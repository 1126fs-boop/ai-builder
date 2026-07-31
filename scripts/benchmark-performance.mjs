/**
 * AI会議・プロンプト生成の処理時間ベンチマーク（Node.js）
 * ブラウザ外で純粋なJS処理時間を計測
 */

import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicJs = path.join(__dirname, "../public/js");

const rolesModule = await import(pathToFileURL(path.join(publicJs, "meeting/roles.js")).href);
const engineModule = await import(pathToFileURL(path.join(publicJs, "ai/meetingRoundEngine.js")).href);
const frameworkModule = await import(pathToFileURL(path.join(publicJs, "ai/contentFramework.js")).href);
const enhancerModule = await import(pathToFileURL(path.join(publicJs, "ai/promptEnhancer.js")).href);
const pipelineModule = await import(pathToFileURL(path.join(publicJs, "ai/promptGenerationPipeline.js")).href);
const promptBuilderModule = await import(pathToFileURL(path.join(__dirname, "../public/promptBuilder.js")).href);
const qualityModule = await import(pathToFileURL(path.join(__dirname, "../public/qualityEngine.js")).href);

const { getDiscussionRoles } = rolesModule;
const { generateRoundOpinion, generateDeepConclusion } = engineModule;
const { buildMeetingTransferPayload, MIN_DISCUSSION_ROUNDS } = frameworkModule;
const { buildMeetingPromptPayload, structuredPro } = enhancerModule;
const { generateMeetingPrompt, generateWizardPrompt } = pipelineModule;
const { buildPromptFromMeeting, evaluateMeetingPrompt, buildPrompt, evaluatePrompt } = promptBuilderModule;
const { diagnoseQuality } = qualityModule;

const TOPIC = "新規サロン開拓の営業戦略をどう強化すべきか";
const selectedIds = [
  "sales_director", "top_sales", "beauty_consultant", "marketer",
  "executive", "sns_manager", "recruiter", "facilitator",
];
const discussionRoles = getDiscussionRoles(selectedIds);

function ms(start, end) {
  return Math.round((end - start) * 100) / 100;
}

function bench(label, fn) {
  const t0 = performance.now();
  const result = fn();
  const t1 = performance.now();
  return { label, ms: ms(t0, t1), result };
}

async function benchAsync(label, fn, delayMs) {
  const t0 = performance.now();
  const result = await fn(delayMs);
  const t1 = performance.now();
  return { label, ms: ms(t0, t1), result };
}

/** 旧実装: 各発言前に sleep */
async function runMeetingWithSleep(delayMs) {
  const messages = [];
  for (let round = 1; round <= MIN_DISCUSSION_ROUNDS; round++) {
    for (const role of discussionRoles) {
      await new Promise((r) => setTimeout(r, delayMs));
      const opinion = generateRoundOpinion(role, TOPIC, round, messages);
      messages.push(opinion);
    }
  }
  await new Promise((r) => setTimeout(r, delayMs));
  const conclusion = generateDeepConclusion(TOPIC, messages);
  return { messages, conclusion };
}

/** 生成のみ（sleepなし） */
function runMeetingGenerationOnly() {
  const messages = [];
  for (let round = 1; round <= MIN_DISCUSSION_ROUNDS; round++) {
    for (const role of discussionRoles) {
      const opinion = generateRoundOpinion(role, TOPIC, round, messages);
      messages.push(opinion);
    }
  }
  const conclusion = generateDeepConclusion(TOPIC, messages);
  return { messages, conclusion };
}

console.log("=== AI Builder パフォーマンスベンチマーク ===\n");
console.log(`参加AI: ${discussionRoles.length}名 × ${MIN_DISCUSSION_ROUNDS}ラウンド + ファシリテーター\n`);

const genOnly = bench("AI会議 — 意見生成のみ（CPU）", runMeetingGenerationOnly);
const withSleep100 = await benchAsync("AI会議 — sleep(100ms)×22回込み（旧実装）", () => runMeetingWithSleep(100), 100);

const meetingResult = {
  title: TOPIC,
  selectedRoleNames: discussionRoles.map((r) => r.name),
  messages: genOnly.result.messages,
  conclusion: genOnly.result.conclusion,
};

const transfer = bench("会議→引き継ぎペイロード構築", () => buildMeetingTransferPayload(meetingResult));
const promptPayload = bench("プロンプトペイロード構築", () => buildMeetingPromptPayload(transfer.result));
const promptBuild = bench("structuredPro プロンプト組み立て", () => structuredPro(promptPayload.result));

console.log("--- 計測結果 ---");
for (const r of [genOnly, withSleep100, transfer, promptPayload, promptBuild]) {
  console.log(`  ${r.label}: ${r.ms} ms`);
}

const messageCount = discussionRoles.length * MIN_DISCUSSION_ROUNDS + 1;
const sleepOverhead = withSleep100.ms - genOnly.ms;
console.log("\n--- ボトルネック分析 ---");
console.log(`  発言数: ${messageCount}`);
console.log(`  人工delay (100ms×${messageCount}): 約 ${messageCount * 100} ms（理論値）`);
console.log(`  実測delayオーバーhead: 約 ${Math.round(sleepOverhead)} ms`);
console.log(`  CPU生成時間: ${genOnly.ms} ms（全体の ${Math.round(genOnly.ms / withSleep100.ms * 1000) / 10}%）`);
console.log(`  プロンプト生成CPU: ${promptPayload.ms + promptBuild.ms} ms`);
console.log("\n--- 改善後（人工sleep削除・CPU+描画フレーム待ちのみ）---");
console.log(`  旧実装合計: ${withSleep100.ms} ms`);
console.log(`  新実装CPU: ${genOnly.ms} ms（約 ${Math.round((1 - genOnly.ms / withSleep100.ms) * 1000) / 10}% 短縮）`);
console.log(`  ブラウザ描画: 約 22フレーム × 16ms ≒ 350ms（推定・進捗表示付き）`);
console.log(`  推定合計: 約 ${Math.round(genOnly.ms + 350)} ms（旧比 ${Math.round(withSleep100.ms / (genOnly.ms + 350))}倍高速）`);

const edits = transfer.result;
const oldMeetingGen = bench("【旧】会議→プロンプト（品質+構築 別々）", () => {
  const quality = evaluateMeetingPrompt(edits);
  const prompt = buildPromptFromMeeting(edits);
  return { quality, prompt };
});
const newMeetingGen = bench("【新】会議→プロンプト（1パス統合）", () => generateMeetingPrompt(edits));

const wizardAnswers = {
  industry: "エステサロン",
  client_challenge: "売上アップ",
  goal: "新規開拓",
  sales_type: "商談",
  ai_role: "BtoB営業コンサルタント",
  tone: "プロフェッショナル",
  output_format: "営業台本",
};
const oldWizardGen = bench("【旧】ウィザード→プロンプト（品質+構築 別々）", () => {
  const quality = evaluatePrompt("sales", wizardAnswers);
  const prompt = buildPrompt("sales", wizardAnswers);
  return { quality, prompt };
});
const newWizardGen = bench("【新】ウィザード→プロンプト（1パス統合）", () =>
  generateWizardPrompt("sales", wizardAnswers)
);

console.log("\n--- プロンプト生成（LLM API呼び出し: 0回）---");
for (const r of [oldMeetingGen, newMeetingGen, oldWizardGen, newWizardGen]) {
  console.log(`  ${r.label}: ${r.ms} ms`);
}

console.log("\n--- ネットワーク呼び出し（改善前後）---");
console.log("  改善前 saveAI: Supabase接続 + getUser + insert + addRecent(getUser+upsert) = 最大5回（UIブロック）");
console.log("  改善後 saveAI: insert 1回のみバックグラウンド（認証キャッシュ・addRecent遅延）");
console.log("  改善前 ユーザー体感: 生成完了まで Supabase 保存を待つ（数十秒〜1分+）");
console.log("  改善後 ユーザー体感: 生成 ~5ms + 表示 ~50ms（保存はバックグラウンド）");
