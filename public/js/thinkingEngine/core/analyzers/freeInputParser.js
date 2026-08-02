/**
 * 自由記述欄の解析 — 回答不足を補完するヒント抽出
 *
 * gapAnalyzer / inputEnricher / purposeAnalyzer で共用。
 * ユーザー指定（キーワード・NG・キャンペーン名等）と AI 推定を分離して扱う。
 */

/**
 * @typedef {Object} FreeInputDirectives
 * @property {string} raw
 * @property {boolean} hasContent
 * @property {string[]} mustIncludeKeywords
 * @property {string[]} ngWords
 * @property {string|null} campaignName
 * @property {string|null} designDirection
 * @property {string|null} referenceImage
 * @property {string|null} companyExpression
 * @property {string[]} hints
 */

/**
 * @param {string} freeInput
 * @returns {{ hints: string[], hasMustInclude: boolean, length: number }}
 */
export function parseFreeInput(freeInput) {
  const text = (freeInput || "").trim();
  if (!text) return { hints: [], hasMustInclude: false, length: 0 };

  const hints = [];
  if (/【必須】|絶対|必ず入|入れたい|キーワード/.test(text)) hints.push("must_include");
  if (/NG|ng|禁止|使わない|避け/.test(text)) hints.push("ng_words");
  if (/キャンペーン|施策名/.test(text)) hints.push("campaign");
  if (/高級|プレミアム|ラグジュアリー/.test(text)) hints.push("tone_luxury");
  if (/親しみ|カジュアル|やわらか/.test(text)) hints.push("tone_friendly");
  if (/数字|％|%/.test(text)) hints.push("numbers");
  if (/参考|イメージ|似せ|トーン|リファレンス/.test(text)) hints.push("reference");
  if (/デザイン|方向性|レイアウト|配色/.test(text)) hints.push("design");
  if (/季節|春|夏|秋|冬|繁忙|閑散/.test(text)) hints.push("seasonality");
  if (/ヒアリング|商談|メモ/.test(text)) hints.push("hearing");
  if (/独自|ブランド|会社.*表現/.test(text)) hints.push("company_voice");

  return {
    hints,
    hasMustInclude: hints.includes("must_include"),
    length: text.length,
  };
}

/**
 * 自由記述から構造化ディレクティブを抽出（AnalysisContext / Purpose へ渡す）
 * @param {string} freeInput
 * @returns {FreeInputDirectives}
 */
export function parseFreeInputDirectives(freeInput) {
  const raw = (freeInput || "").trim();
  /** @type {FreeInputDirectives} */
  const result = {
    raw,
    hasContent: Boolean(raw),
    mustIncludeKeywords: [],
    ngWords: [],
    campaignName: null,
    designDirection: null,
    referenceImage: null,
    companyExpression: null,
    hints: [],
  };

  if (!raw) return result;

  const meta = parseFreeInput(raw);
  result.hints = meta.hints;

  extractListAfterLabel(raw, /(?:必ず|絶対|必須).*?(?:キーワード|文言|入)[：:]\s*/i, result.mustIncludeKeywords);
  extractListAfterLabel(raw, /(?:必ず入れたい|入れたい内容)[：:]\s*/i, result.mustIncludeKeywords);
  extractListAfterLabel(raw, /(?:キーワード|必須文言|キャッチコピー)[：:]\s*/i, result.mustIncludeKeywords);
  extractQuotedPhrases(raw, result.mustIncludeKeywords);

  extractListAfterLabel(raw, /(?:NG|ng|禁止|使わない)[ワード語句]*[：:]\s*/i, result.ngWords);

  const campaignMatch = raw.match(/(?:キャンペーン|施策)[名]?[：:]\s*([^\n。]+)/i);
  if (campaignMatch) result.campaignName = campaignMatch[1].trim();

  const designMatch = raw.match(/(?:デザイン|方向性|ビジュアル|トーン)[：:]\s*([^\n。]+)/i);
  if (designMatch) result.designDirection = designMatch[1].trim();
  else if (/高級|プレミアム|ミニマル|ポップ|シンプル/.test(raw)) {
    const toneMatch = raw.match(/(高級[^。\n]{0,20}|プレミアム[^。\n]{0,20}|ミニマル[^。\n]{0,20}|ポップ[^。\n]{0,20}|シンプル[^。\n]{0,20})/);
    if (toneMatch) result.designDirection = toneMatch[1].trim();
  }

  const refMatch = raw.match(/(?:参考|リファレンス|イメージ)[：:]\s*([^\n。]+)/i);
  if (refMatch) result.referenceImage = refMatch[1].trim();

  const companyMatch = raw.match(/(?:会社|独自|ブランド)[^。\n]*(?:表現|トーン|言い回し)[：:]\s*([^\n。]+)/i);
  if (companyMatch) result.companyExpression = companyMatch[1].trim();

  const brandMatch = raw.match(/(?:ブランドトーン|トーン)[：:]\s*([^\n。]+)/i);
  if (brandMatch && !result.companyExpression) result.companyExpression = brandMatch[1].trim();

  const catchMatch = raw.match(/(?:キャッチコピー|キャッチ)[：:]\s*([^\n。]+)/i);
  if (catchMatch && !result.designDirection) {
    result.designDirection = catchMatch[1].trim();
  }

  result.mustIncludeKeywords = [...new Set(result.mustIncludeKeywords.map((s) => s.trim()).filter(Boolean))];
  result.ngWords = [...new Set(result.ngWords.map((s) => s.trim()).filter(Boolean))];

  return result;
}

function extractListAfterLabel(text, labelPattern, target) {
  const match = text.match(labelPattern);
  if (!match) return;
  const rest = text.slice(match.index + match[0].length);
  const line = rest.split(/\n/)[0];
  line
    .split(/[、,/|・]/)
    .map((s) => s.trim().replace(/^[\s「]+|[」\s]+$/g, ""))
    .filter((s) => s.length >= 2 && s.length <= 60)
    .forEach((s) => target.push(s));
}

function extractQuotedPhrases(text, target) {
  const re = /「([^」]{2,40})」/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (/必ず|絶対|入|キーワード/.test(text.slice(Math.max(0, m.index - 12), m.index))) {
      target.push(m[1].trim());
    }
  }
}

/**
 * 自由記述からフィールド推定（KB 補完用）
 * @param {string} categoryId
 * @param {string} corpus — free_input + 他回答の結合テキスト
 * @returns {Record<string, string>}
 */
export function inferFieldsFromCorpus(categoryId, corpus) {
  if (!corpus?.trim()) return {};
  /** @type {Record<string, string>} */
  const inferred = {};
  const directives = parseFreeInputDirectives(corpus);

  if (categoryId === "image" || categoryId === "sns") {
    if (/店内|POP|サロン店内|受付/.test(corpus)) inferred.display_location = "サロン店内";
    else if (/展示会|セミナー|ブース/.test(corpus)) inferred.display_location = "展示会ブース";
    else if (/SNS|Instagram|デジタル|配信/.test(corpus)) inferred.display_location = "デジタル配信（SNS等）";
    else if (/クリニック/.test(corpus)) inferred.display_location = "クリニック受付";

    if (/売上|売上アップ/.test(corpus)) inferred.appeal_point = "売上アップ";
    else if (/新メニュー|新商品|新機器/.test(corpus)) inferred.appeal_point = "新メニュー";
    else if (/キャンペーン/.test(corpus) || directives.campaignName) inferred.appeal_point = "キャンペーン";
    else if (/リピート|再来/.test(corpus)) inferred.appeal_point = "リピート率向上";
    else if (/導入|メリット/.test(corpus)) inferred.appeal_point = "導入メリット";

    if (directives.designDirection && !inferred.catch_direction) {
      inferred.catch_direction = directives.designDirection.slice(0, 80);
    } else if (/キャッチ|ヘッド|コピー|文言/.test(corpus) && !inferred.catch_direction) {
      const match = corpus.match(/(?:キャッチ|ヘッド|コピー)[：:]\s*(.{4,40})/);
      if (match) inferred.catch_direction = match[1].trim();
    }
  }

  if (categoryId === "sns") {
    if (/オーナー|経営/.test(corpus)) inferred.target_audience = "サロンオーナー";
    else if (/スタッフ|施術/.test(corpus)) inferred.target_audience = "施術者・スタッフ";
    else if (/来店客|BtoC|エンド/.test(corpus)) inferred.target_audience = "来店客（BtoC風）";

    if (/新商品|新機器|発売|告知/.test(corpus) || directives.campaignName) {
      inferred.appeal_axis = "新商品告知";
    } else if (/成功事例|導入事例|事例/.test(corpus)) {
      inferred.appeal_axis = "成功事例";
    }
  }

  if (categoryId === "newsletter") {
    if (/新規|見込/.test(corpus)) inferred.audience = "新規見込み客";
    else if (/VIP|重要/.test(corpus)) inferred.audience = "VIP取引先";
    else if (/休眠|離反/.test(corpus)) inferred.audience = "休眠取引先";
    if (directives.campaignName && !inferred.purpose?.trim()) {
      inferred.purpose = `${directives.campaignName}のご案内`;
    }
  }

  if (categoryId === "proposal" || categoryId === "sales") {
    if (/スタッフ\d|月商|坪数|店舗/.test(corpus) && !inferred.client_context) {
      inferred.client_context = corpus.slice(0, 120);
    }
    if (/ヒアリング|商談メモ|聞いた/.test(corpus) && !inferred.hearing_notes) {
      inferred.hearing_notes = corpus.slice(0, 120);
    }
  }

  return inferred;
}

/**
 * 自由記述で既に十分カバーされている品質フィールドか
 * @param {string} fieldId
 * @param {Object} ctx
 */
export function isQualityFieldSatisfiedByFreeInput(fieldId, ctx) {
  const { merged, enrichmentSources, directives } = ctx;

  if (merged[fieldId]?.trim()) return true;

  const parsed = enrichmentSources?.find(
    (s) => s.field === fieldId && s.source === "free_input_parse" && s.confidence >= 0.65
  );
  if (parsed) return true;

  if (!directives?.hasContent) return false;

  switch (fieldId) {
    case "catch_direction":
      return Boolean(
        directives.designDirection ||
          directives.referenceImage ||
          directives.mustIncludeKeywords.length > 0
      );
    case "wam_product":
      return /ハイパーナイフ|商品|wam|ワム/i.test(directives.raw);
    case "target_audience":
      return /オーナー|スタッフ|施術|来店客|代理店|ターゲット|向け/i.test(directives.raw);
    case "appeal_axis":
    case "appeal_point":
      return Boolean(
        directives.campaignName ||
          /訴求|売上|事例|リピート|新商品|導入|キャンペーン/.test(directives.raw)
      );
    case "display_location":
      return /店内|POP|受付|展示会|SNS|デジタル|クリニック|掲示/.test(directives.raw);
    case "client_context":
    case "hearing_notes":
      return directives.hints.includes("hearing") || /店舗|月商|ヒアリング|商談/.test(directives.raw);
    case "sns_format":
      return /Instagram|リール|ストーリー|LINE|SNS/i.test(directives.raw);
    case "purpose":
      return Boolean(directives.campaignName) || /目的|案内|告知/.test(directives.raw);
    case "audience":
      return /読者|配信先|オーナー|VIP|見込/.test(directives.raw);
    case "goal":
      return /目的|ゴール|達成|商談/.test(directives.raw);
    case "ai_role":
      return /AI|役割|専門|コンサル|アドバイザー|コピーライター/.test(directives.raw);
    case "tone":
      return Boolean(directives.companyExpression) || /トーン|文体|高級|カジュアル|信頼/.test(directives.raw);
    case "value":
      return /価値|メリット|提供|ベネフィット/.test(directives.raw);
    case "industry":
      return /サロン|クリニック|美容|エステ|業種/.test(directives.raw);
    case "client_challenge":
      return /課題|売上|集客|リピート|人手不足|経営/.test(directives.raw);
    case "sales_type":
      return /テレアポ|商談|DM|飛び込み|フォロー|営業/.test(directives.raw);
    case "proposal_scope":
      return /提案|初回|既存|見積|PoC/.test(directives.raw);
    case "product_area":
      return /商品|機器|メニュー|サービス|ハイパーナイフ/.test(directives.raw);
    default:
      return false;
  }
}
