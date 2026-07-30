/**
 * AI Builder — メインスクリプト
 *
 * 構成:
 *   1. カテゴリ & 質問データ
 *   2. アプリ状態管理
 *   3. DOM 参照
 *   4. ビュー切り替え
 *   5. ホーム画面
 *   6. 質問フロー
 *   7. プロンプト生成
 *   8. 結果画面
 *   9. ユーティリティ
 *  10. 初期化
 */

/* ============================================================
   1. カテゴリ & 質問データ
   ============================================================ */

/**
 * 各カテゴリの定義
 * @type {Array<{id: string, label: string, icon: string, wide?: boolean, questions: Array}>}
 */
const CATEGORIES = [
  {
    id: "sales",
    label: "営業",
    icon: "💼",
    questions: [
      {
        text: "対象顧客はどのタイプですか？",
        options: ["B2B（法人向け）", "B2C（個人向け）", "既存顧客", "新規見込み客"],
      },
      {
        text: "今回の営業目的は？",
        options: ["アポイント獲得", "成約・クロージング", "フォローアップ", "提案書作成"],
      },
      {
        text: "コミュニケーションのトーンは？",
        options: ["フォーマル・丁寧", "フレンドリー", "説得的・熱意ある", "簡潔・要点のみ"],
      },
      {
        text: "商品・サービスの強みは？",
        options: ["コスト削減", "時間短縮", "品質向上", "独自性・差別化"],
      },
    ],
  },
  {
    id: "newsletter",
    label: "メルマガ",
    icon: "📧",
    questions: [
      {
        text: "メルマガの配信目的は？",
        options: ["新商品・サービスの告知", "教育・ノウハウ提供", "キャンペーン・セール", "ブランド認知向上"],
      },
      {
        text: "ターゲット読者は？",
        options: ["新規登録者", "既存顧客", "VIP・ロイヤル顧客", "見込み客（リード）"],
      },
      {
        text: "文体・トーンは？",
        options: ["ビジネスライク", "カジュアル・親しみやすい", "専門的・権威的", "ストーリーテリング"],
      },
      {
        text: "CTA（行動喚起）は？",
        options: ["商品購入", "資料ダウンロード", "セミナー参加", "問い合わせ・相談"],
      },
    ],
  },
  {
    id: "sns",
    label: "SNS",
    icon: "📱",
    questions: [
      {
        text: "投稿するプラットフォームは？",
        options: ["X（Twitter）", "Instagram", "LinkedIn", "TikTok / YouTube Shorts"],
      },
      {
        text: "投稿の種類は？",
        options: ["テキスト投稿", "画像付き投稿", "動画スクリプト", "スレッド / 連続投稿"],
      },
      {
        text: "投稿の目的は？",
        options: ["認知拡大・バズ狙い", "商品・サービス宣伝", "専門性・信頼構築", "コミュニティ活性化"],
      },
      {
        text: "トーン・雰囲気は？",
        options: ["ユーモア・エンタメ", "プロフェッショナル", "共感・共鳴", "挑発的・議論喚起"],
      },
    ],
  },
  {
    id: "image",
    label: "画像生成",
    icon: "🎨",
    questions: [
      {
        text: "画像の用途は？",
        options: ["SNS投稿", "Webサイト・LP", "プレゼン資料", "広告バナー"],
      },
      {
        text: "求めるスタイルは？",
        options: ["フォトリアル", "イラスト・アニメ", "ミニマル・フラット", "3Dレンダリング"],
      },
      {
        text: "画像の雰囲気・ムードは？",
        options: ["明るく・ポジティブ", "落ち着いた・高級感", "未来的・テック", "自然・オーガニック"],
      },
      {
        text: "主要な被写体・要素は？",
        options: ["人物", "風景・背景", "商品・オブジェクト", "抽象・パターン"],
      },
    ],
  },
  {
    id: "agent",
    label: "AIエージェント",
    icon: "🤖",
    questions: [
      {
        text: "エージェントの主な役割は？",
        options: ["カスタマーサポート", "リサーチ・情報収集", "コーディング支援", "コンテンツ作成"],
      },
      {
        text: "対象ユーザーは？",
        options: ["一般消費者", "社内メンバー", "開発者・エンジニア", "経営者・意思決定者"],
      },
      {
        text: "必要な主要機能は？",
        options: ["質問応答（Q&A）", "タスク自動実行", "データ分析・要約", "マルチステップ推論"],
      },
      {
        text: "守るべき制約・ルールは？",
        options: ["正確性・ファクト重視", "簡潔・要点のみ", "創造性・柔軟性", "セキュリティ・機密保持"],
      },
    ],
  },
  {
    id: "analysis",
    label: "分析",
    icon: "📊",
    questions: [
      {
        text: "分析対象は？",
        options: ["売上・財務データ", "ユーザー行動データ", "競合・市場調査", "テキスト・口コミ"],
      },
      {
        text: "分析の目的は？",
        options: ["課題の特定", "トレンド把握", "意思決定支援", "レポート・報告書作成"],
      },
      {
        text: "出力形式は？",
        options: ["箇条書きサマリー", "詳細レポート", "グラフ・チャート付き", "アクション提案リスト"],
      },
      {
        text: "分析の深さは？",
        options: ["概要レベル（5分で読める）", "標準（15分程度）", "詳細（30分以上）", "エグゼクティブ向け1ページ"],
      },
    ],
  },
  {
    id: "other",
    label: "その他",
    icon: "✨",
    wide: true,
    questions: [
      {
        text: "プロンプトの用途・目的は？",
        options: ["ビジネス文書", "クリエイティブ制作", "学習・教育", "日常・個人利用"],
      },
      {
        text: "AIに期待する出力は？",
        options: ["短い回答（1〜2段落）", "中程度（500字程度）", "長文・詳細（1000字以上）", "リスト・箇条書き形式"],
      },
      {
        text: "文体・トーンは？",
        options: ["フォーマル", "カジュアル", "専門的", "創造的・自由"],
      },
      {
        text: "特に重視する点は？",
        options: ["正確性", "創造性", "簡潔さ", "網羅性"],
      },
    ],
  },
];

/* ============================================================
   2. アプリ状態管理
   ============================================================ */

/** @type {{ categoryId: string|null, questionIndex: number, answers: string[] }} */
const state = {
  categoryId: null,
  questionIndex: 0,
  answers: [],
};

/* ============================================================
   3. DOM 参照
   ============================================================ */

const DOM = {
  // ビュー
  viewHome: document.getElementById("view-home"),
  viewQuestions: document.getElementById("view-questions"),
  viewResult: document.getElementById("view-result"),

  // ホーム
  categoryGrid: document.getElementById("category-grid"),

  // 質問
  questionCategoryLabel: document.getElementById("question-category-label"),
  progressBar: document.getElementById("progress-bar"),
  progressText: document.getElementById("progress-text"),
  questionText: document.getElementById("question-text"),
  optionsContainer: document.getElementById("options-container"),
  btnPrev: document.getElementById("btn-prev"),
  btnNext: document.getElementById("btn-next"),
  btnBackHome: document.getElementById("btn-back-home"),

  // 結果
  resultCategoryLabel: document.getElementById("result-category-label"),
  promptOutput: document.getElementById("prompt-output"),
  btnCopy: document.getElementById("btn-copy"),
  btnCopyLabel: document.getElementById("btn-copy-label"),
  btnRestart: document.getElementById("btn-restart"),

  // トースト
  toast: document.getElementById("toast"),
};

/* ============================================================
   4. ビュー切り替え
   ============================================================ */

/** 表示可能なビュー ID */
const VIEWS = {
  home: DOM.viewHome,
  questions: DOM.viewQuestions,
  result: DOM.viewResult,
};

/**
 * 指定ビューに切り替える
 * @param {"home"|"questions"|"result"} viewName
 */
function showView(viewName) {
  Object.entries(VIEWS).forEach(([name, el]) => {
    const isActive = name === viewName;
    el.classList.toggle("view--active", isActive);
    el.hidden = !isActive;
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ============================================================
   5. ホーム画面
   ============================================================ */

/**
 * カテゴリカードをグリッドに描画
 */
function renderCategoryCards() {
  DOM.categoryGrid.innerHTML = "";

  CATEGORIES.forEach((category) => {
    const card = document.createElement("button");
    card.className = "category-card";
    if (category.wide) card.classList.add("category-card--wide");
    card.setAttribute("role", "listitem");
    card.setAttribute("aria-label", `${category.label}を選択`);
    card.dataset.categoryId = category.id;

    card.innerHTML = `
      <span class="category-card__icon" aria-hidden="true">${category.icon}</span>
      <span class="category-card__label">${category.label}</span>
    `;

    card.addEventListener("click", () => startCategory(category.id));
    DOM.categoryGrid.appendChild(card);
  });
}

/**
 * カテゴリ選択 → 質問フロー開始
 * @param {string} categoryId
 */
function startCategory(categoryId) {
  state.categoryId = categoryId;
  state.questionIndex = 0;
  state.answers = [];

  const category = getCategory(categoryId);
  DOM.questionCategoryLabel.textContent = category.label;

  renderQuestion();
  showView("questions");
}

/* ============================================================
   6. 質問フロー
   ============================================================ */

/**
 * ID からカテゴリオブジェクトを取得
 * @param {string} id
 */
function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id);
}

/**
 * 現在の質問を画面に描画
 */
function renderQuestion() {
  const category = getCategory(state.categoryId);
  const total = category.questions.length;
  const current = state.questionIndex;
  const question = category.questions[current];

  // 進捗バー更新
  const progressPercent = ((current + 1) / total) * 100;
  DOM.progressBar.style.width = `${progressPercent}%`;
  DOM.progressBar.parentElement.setAttribute("aria-valuenow", String(Math.round(progressPercent)));
  DOM.progressText.textContent = `${current + 1} / ${total}`;

  // 質問テキスト
  DOM.questionText.textContent = question.text;

  // 選択肢ボタン生成
  DOM.optionsContainer.innerHTML = "";
  question.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.type = "button";
    btn.textContent = option;
    btn.setAttribute("role", "option");
    btn.dataset.index = String(index);

    // 既に選択済みならハイライト
    if (state.answers[current] === option) {
      btn.classList.add("option-btn--selected");
    }

    btn.addEventListener("click", () => selectOption(option, btn));
    DOM.optionsContainer.appendChild(btn);
  });

  // ナビゲーションボタン状態
  DOM.btnPrev.disabled = current === 0;
  DOM.btnNext.disabled = !state.answers[current];
  DOM.btnNext.textContent = current === total - 1 ? "完成" : "次へ";

  // 質問カードのアニメーションリセット
  const card = DOM.questionText.closest(".question-card");
  card.style.animation = "none";
  card.offsetHeight; // reflow
  card.style.animation = "";
}

/**
 * 選択肢を選んだときの処理
 * @param {string} option
 * @param {HTMLButtonElement} clickedBtn
 */
function selectOption(option, clickedBtn) {
  state.answers[state.questionIndex] = option;

  // 選択状態の UI 更新
  DOM.optionsContainer.querySelectorAll(".option-btn").forEach((btn) => {
    btn.classList.remove("option-btn--selected");
  });
  clickedBtn.classList.add("option-btn--selected");

  DOM.btnNext.disabled = false;
}

/**
 * 次の質問へ進む（最終問なら結果画面へ）
 */
function goNext() {
  const category = getCategory(state.categoryId);
  const isLast = state.questionIndex >= category.questions.length - 1;

  if (isLast) {
    showResult();
  } else {
    state.questionIndex++;
    renderQuestion();
  }
}

/**
 * 前の質問に戻る
 */
function goPrev() {
  if (state.questionIndex > 0) {
    state.questionIndex--;
    renderQuestion();
  }
}

/* ============================================================
   7. プロンプト生成
   ============================================================ */

/**
 * カテゴリ別のプロンプトテンプレート
 * 各カテゴリの回答を自然なプロンプト文に変換
 */
const PROMPT_TEMPLATES = {
  sales: (answers) =>
    `あなたは優秀な営業コンサルタントです。以下の条件に基づき、効果的な営業メッセージを作成してください。

【条件】
- 対象顧客: ${answers[0]}
- 目的: ${answers[1]}
- トーン: ${answers[2]}
- 強み・訴求ポイント: ${answers[3]}

【出力要件】
- 相手の課題に共感する導入から始める
- 具体的なベネフィットを明示する
- 次のアクション（CTA）を明確に示す
- ${answers[2]}のトーンを一貫して維持する`,

  newsletter: (answers) =>
    `あなたはプロのメールマーケターです。以下の条件でメルマガの本文を作成してください。

【条件】
- 配信目的: ${answers[0]}
- ターゲット読者: ${answers[1]}
- 文体・トーン: ${answers[2]}
- CTA（行動喚起）: ${answers[3]}

【出力要件】
- 件名（3パターン）と本文を出力
- 読者の関心を引く導入文から始める
- スキャンしやすい構成（見出し・箇条書き活用）
- 最後にCTAへの自然な誘導を含める`,

  sns: (answers) =>
    `あなたはSNSマーケティングの専門家です。以下の条件でSNS投稿を作成してください。

【条件】
- プラットフォーム: ${answers[0]}
- 投稿タイプ: ${answers[1]}
- 目的: ${answers[2]}
- トーン: ${answers[3]}

【出力要件】
- プラットフォームの特性に最適化した投稿文
- ハッシュタグ案（5〜10個）を含める
- エンゲージメントを高めるフック文を冒頭に配置
- 文字数制限を考慮した適切な長さ`,

  image: (answers) =>
    `以下の条件でAI画像生成用のプロンプト（英語）を作成してください。

【条件】
- 用途: ${answers[0]}
- スタイル: ${answers[1]}
- 雰囲気・ムード: ${answers[2]}
- 主要被写体: ${answers[3]}

【出力要件】
- 英語の画像生成プロンプト（詳細で具体的に）
- ネガティブプロンプトも併記
- 推奨アスペクト比と解像度の提案
- プロンプトの日本語訳も添える`,

  agent: (answers) =>
    `あなたはAIエージェント設計の専門家です。以下の条件でシステムプロンプトを作成してください。

【条件】
- エージェントの役割: ${answers[0]}
- 対象ユーザー: ${answers[1]}
- 主要機能: ${answers[2]}
- 制約・ルール: ${answers[3]}

【出力要件】
- エージェントのペルソナと行動原則を定義
- 対応可能なタスクと対応不可なタスクを明示
- 応答フォーマットのガイドライン
- エラーハンドリングとエスカレーションルール`,

  analysis: (answers) =>
    `あなたはデータ分析の専門家です。以下の条件で分析プロンプトを作成してください。

【条件】
- 分析対象: ${answers[0]}
- 分析目的: ${answers[1]}
- 出力形式: ${answers[2]}
- 分析の深さ: ${answers[3]}

【出力要件】
- 分析のフレームワークと観点を明示
- 必要なデータ項目のリスト
- 分析手順（ステップバイステップ）
- インサイト抽出とアクション提案の方法`,

  other: (answers) =>
    `以下の条件に基づき、最適なAIプロンプトを作成してください。

【条件】
- 用途・目的: ${answers[0]}
- 期待する出力: ${answers[1]}
- 文体・トーン: ${answers[2]}
- 重視する点: ${answers[3]}

【出力要件】
- 明確な役割定義（あなたは〜です）
- 具体的なタスク指示
- 出力フォーマットの指定
- ${answers[2]}のトーンを維持
- ${answers[3]}を最優先に考慮`,
};

/**
 * 回答からプロンプト文字列を生成
 * @returns {string}
 */
function generatePrompt() {
  const template = PROMPT_TEMPLATES[state.categoryId];
  return template(state.answers);
}

/* ============================================================
   8. 結果画面
   ============================================================ */

/**
 * 結果画面を表示
 */
function showResult() {
  const category = getCategory(state.categoryId);
  const prompt = generatePrompt();

  DOM.resultCategoryLabel.textContent = `${category.icon} ${category.label}`;
  DOM.promptOutput.textContent = prompt;

  // コピーボタンをリセット
  DOM.btnCopy.classList.remove("btn--copied");
  DOM.btnCopyLabel.textContent = "コピー";

  showView("result");
}

/**
 * プロンプトをクリップボードにコピー
 */
async function copyPrompt() {
  const text = DOM.promptOutput.textContent;

  try {
    await navigator.clipboard.writeText(text);
    DOM.btnCopy.classList.add("btn--copied");
    DOM.btnCopyLabel.textContent = "コピーしました！";
    showToast("クリップボードにコピーしました");
  } catch {
    // フォールバック: execCommand
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);

    DOM.btnCopy.classList.add("btn--copied");
    DOM.btnCopyLabel.textContent = "コピーしました！";
    showToast("クリップボードにコピーしました");
  }
}

/**
 * 最初からやり直す
 */
function restart() {
  state.categoryId = null;
  state.questionIndex = 0;
  state.answers = [];
  showView("home");
}

/* ============================================================
   9. ユーティリティ
   ============================================================ */

/** トースト表示タイマー */
let toastTimer = null;

/**
 * トースト通知を表示
 * @param {string} message
 */
function showToast(message) {
  DOM.toast.textContent = message;
  DOM.toast.classList.add("toast--visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    DOM.toast.classList.remove("toast--visible");
  }, 2500);
}

/* ============================================================
   10. 初期化
   ============================================================ */

function init() {
  renderCategoryCards();

  // イベントリスナー登録
  DOM.btnNext.addEventListener("click", goNext);
  DOM.btnPrev.addEventListener("click", goPrev);
  DOM.btnBackHome.addEventListener("click", restart);
  DOM.btnCopy.addEventListener("click", copyPrompt);
  DOM.btnRestart.addEventListener("click", restart);
}

// DOM 読み込み完了後に起動
document.addEventListener("DOMContentLoaded", init);
