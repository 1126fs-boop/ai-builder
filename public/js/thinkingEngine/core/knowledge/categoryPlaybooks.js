/**
 * カテゴリ別 Playbook — 美容業界プロ品質の設計テンプレート
 *
 * メルマガ・提案書・営業・POP など、SNS 以外のカテゴリ品質を底上げする。
 */

/** 美容業界の季節性・サロン経営サイクル */
export const BEAUTY_SEASONALITY = {
  seasons: {
    "1-2": {
      label: "新年・閑散期",
      ownerConcerns: ["年間計画", "スタッフ定着", "閑散期の集客", "キャッシュフロー"],
      topics: ["年間売上計画", "リピート施策", "新メニュー検討", "スタッフ目標設定"],
      tone: "前向き・計画型",
    },
    "3-5": {
      label: "春・新生活",
      ownerConcerns: ["新規集客", "スタッフ採用", "メニュー刷新"],
      topics: ["春のキャンペーン", "新規客リピート化", "差別化メニュー"],
      tone: "刷新・チャレンジ",
    },
    "6-8": {
      label: "夏季・繁忙前",
      ownerConcerns: ["暑さ対策", "スタッフシフト", "夏メニュー", "客単価"],
      topics: ["夏季メニュー", "稼働率改善", "物販・ホームケア提案"],
      tone: "実践・具体策",
    },
    "9-11": {
      label: "秋・商戦前",
      ownerConcerns: ["年末商戦準備", "会員施策", "客単価アップ"],
      topics: ["秋冬メニュー", "会員制度見直し", "年末キャンペーン設計"],
      tone: "準備・仕込み",
    },
    "12": {
      label: "年末・繁忙期",
      ownerConcerns: ["繁忙期シフト", "売上最大化", "スタッフ疲弊", "来年計画"],
      topics: ["繁忙期オペレーション", "予約枠最適化", "来年の投資判断"],
      tone: "成果・感謝",
    },
  },
};

/**
 * 現在の季節コンテキストを取得
 * @param {Date} [now]
 */
export function getSeasonalContext(now = new Date()) {
  const month = now.getMonth() + 1;
  let key = "3-5";
  if (month <= 2) key = "1-2";
  else if (month <= 5) key = "3-5";
  else if (month <= 8) key = "6-8";
  else if (month <= 11) key = "9-11";
  else key = "12";

  const season = BEAUTY_SEASONALITY.seasons[key];
  return {
    month,
    seasonKey: key,
    label: season.label,
    ownerConcerns: season.ownerConcerns,
    topics: season.topics,
    tone: season.tone,
    hook: `【${season.label}】${season.ownerConcerns[0]}に悩むオーナー向け`,
  };
}

/** メルマガ — プロ品質 Playbook */
export const NEWSLETTER_PLAYBOOK = {
  subjectLineFormulas: [
    "【課題ワード】+ 具体ベネフィット（例: リピート率、客単価）",
    "【数字・期間】+ 経営改善（例: 90日で、○%改善）",
    "【季節・タイミング】+ オーナーの悩み",
    "【限定・今だけ】+ 教育型価値（煽りすぎ禁止）",
    "質問型（例: スタッフ定着、どこがボトルネック？）",
  ],
  preheaderHint: "件名を補完し、開封後3行目まで読ませる一言",
  bodyFlow: [
    "挨拶（1文）— 長い前置き禁止",
    "共感フック（3行以内）— 読者の経営課題に触れる",
    "教育パート — ノウハウ・事例・数字（売り込み前）",
    "橋渡し — 「だからこそ」で自然に商品・サービスへ",
    "ソフトCTA — 資料請求・相談・セミナー（1つだけ）",
    "PS（追伸）— 最も重要なメッセージ or 限定情報",
  ],
  educationalAngles: [
    "経営KPIの見方（客数×客単価×リピート×稼働率）",
    "繁忙期・閑散期の打ち手",
    "スタッフ定着とサービス品質の関係",
    "リピート率を上げるフォロー設計",
    "差別化メニューの考え方",
  ],
  softSellBridge: [
    "「実際に取り組んでいるサロンでは…」→ 事例 → 商品提案",
    "「この課題の解決には『仕組み』が必要です」→ ソリューション",
    "「まずは小さくPoC（検証）から」→ 低リスク導入提案",
  ],
  lineRules: [
    "300字以内",
    "1メッセージ1CTA",
    "改行多め・箇条書き可",
    "絵文字は控えめ（信頼感優先）",
  ],
};

/** 提案書 — プロ品質 Playbook */
export const PROPOSAL_PLAYBOOK = {
  analysisFramework: [
    "現状KPIの推定（客数・客単価・リピート・稼働率）",
    "表面課題 → 根本原因 → 経営インパクトの3層分析",
    "業種特性（エステ/美容室/ネイル/クリニック）を反映",
    "競合・代替手段との比較（押し付けない）",
  ],
  roiFramework: [
    "投資額: 【導入費用】（不明はプレースホルダー）",
    "期待効果: 客単価【○%】/ リピート【○%】/ 稼働率【○%】改善",
    "回収期間: 【○ヶ月】（保守的な試算を明示）",
    "測定KPI: 導入前後の比較指標を3つ以上",
    "リスク低減: PoC・段階導入・伴走支援",
  ],
  implementationStory: [
    "Week 1-2: 現状ヒアリング・KPI整理・Quick Win特定",
    "Month 1-3: PoC実施・スタッフ研修・初期効果測定",
    "Month 4-6: 成功パターン標準化・全店展開",
    "Month 7+: 継続改善・追加施策",
  ],
  differentiationAngles: [
    "経営課題解決の切り口（スペック比較ではない）",
    "導入サロン数・事例・実績（【】でプレースホルダー可）",
    "アフターサポート・研修・消耗品の継続支援",
    "PoC・小さく始める設計",
    "ワムブランド: 信頼・伴走・美容業界特化",
  ],
  numberPlaceholders: [
    "売上【○%】改善",
    "客単価【○円】アップ",
    "リピート率【○%】向上",
    "回収期間【○ヶ月】",
    "導入サロン【○店舗】",
  ],
};

/** 営業トーク — プロ品質 Playbook */
export const SALES_PLAYBOOK = {
  phases: [
    "アイスブレイク",
    "ラポール構築",
    "状況確認（SPIN-S）",
    "課題ヒアリング（SPIN-P）",
    "影響確認（SPIN-I）",
    "解決イメージ（SPIN-N）",
    "提案ストーリー",
    "反論処理",
    "クロージング",
  ],
  icebreakers: {
    商談: [
      "本日はお時間いただきありがとうございます。まず御社の状況を15分ほどお伺いしてもよろしいでしょうか。",
      "前回お話しした{challenge}、その後いかがでしょうか。",
    ],
    テレアポ: [
      "お忙しいところ失礼します。{industry}のオーナー様で、{challenge}にお悩みの方に多い話を30秒だけ共有させてください。",
    ],
    DM: [
      "突然のご連絡失礼します。{industry}向けに{challenge}改善の事例をまとめました。",
    ],
    LINE: [
      "お世話になっております。{challenge}でお困りのサロン様向けの情報を1点共有します。",
    ],
    新規開拓: [
      "初めてのご連絡です。{industry}の経営課題解決を支援しており、参考になる事例がございます。",
    ],
    既存フォロー: [
      "前回ご提案のその後、いかがでしょうか。本日は{challenge}の進捗を確認させてください。",
    ],
  },
  spinQuestions: {
    situation: [
      "現在の{challenge}について、どのような状況でしょうか？",
      "スタッフ数・メニュー構成・来店客層を教えていただけますか？",
    ],
    problem: [
      "その中で、一番のネックはどこでしょうか？",
      "過去に試された施策で、うまくいかなかったことはありますか？",
    ],
    implication: [
      "そのまま放置すると、3ヶ月後・半年後にどんな影響が出そうですか？",
      "オーナー様ご自身、どの部分が一番気になっていますか？",
    ],
    needPayoff: [
      "もし{impact}が実現できたら、経営上どんな変化がありそうですか？",
      "理想として、3ヶ月後にどんな状態になっていたいですか？",
    ],
  },
  deepDiveQuestions: [
    "その課題、いつ頃から感じ始めましたか？",
    "数字で見ると、どのKPIに一番効いていますか？",
    "決裁者（オーナー）以外に、現場の声はありますか？",
    "予算感や導入時期のイメージはありますか？",
  ],
  objectionMatrix: [
    { concern: "本当に効果がある？", response: "2週間Quick Winで初期効果を確認。KPI: {impact}" },
    { concern: "価格が高い", response: "ROI・回収期間【○ヶ月】・導入事例で説明" },
    { concern: "スタッフが使いこなせる？", response: "導入研修＋週次フォロー。段階導入も可能" },
    { concern: "今は忙しい・タイミングが悪い", response: "PoCで小さく始める。負担最小のステップ提案" },
    { concern: "他社と比較中", response: "経営課題解決の切り口で差別化。押し売りしない" },
    { concern: "検討します", response: "次回デモ・PoC日程を具体的に提案" },
  ],
  closingByGoal: {
    商談成功: "本日の内容を踏まえ、次回○日にデモをご用意します。ご都合いかがでしょうか？",
    アポ獲得: "来週○曜日、30分だけ詳細をお話しできませんか？",
    受注: "次のステップとして、PoC開始日と担当者を決めさせてください。",
    資料送付: "本日お話しした内容を資料にまとめ、○日までにお送りします。",
  },
};

/** POP・販促 — プロ品質 Playbook */
export const POP_PLAYBOOK = {
  headlineFormulas: [
    "【ベネフィット】+ 商品名",
    "【数字】+ 経営改善（例: 客単価○%UP）",
    "【課題解決】+ 具体像",
    "【限定・今だけ】+ 訴求（煽りすぎ禁止）",
  ],
  copyHierarchy: [
    "ヘッドライン — 3秒で意味が伝わる（最大15文字目安）",
    "サブコピー — 課題共感 or ベネフィット補足",
    "ボディ — 箇条書き3点まで",
    "CTA — QR・問い合わせ・予約（1つ）",
  ],
  layoutByLocation: {
    受付: "来店直後の視線。大文字・シンプル・1メッセージ",
    店内: "待ち時間に読める。詳細・事例可",
    入口: "遠目視認。コントラスト強・文字少なめ",
    施術室: "リラックス感。高級感・信頼感",
  },
  promoTypes: {
    店内POP: "3秒ルール・遠目視認",
    チラシ: "AIDA構成・裏面に詳細",
    ポスター: "1メッセージ・大ビジュアル",
    デジタルサイネージ: "7秒以内・動き控えめ",
  },
};

/**
 * カテゴリ別 Playbook ブロック（Prompt Builder 用）
 * @param {string} categoryId
 * @param {Object} [context]
 */
export function buildCategoryPlaybookBlock(categoryId, context = {}) {
  const lines = [];
  const season = context.seasonal ?? getSeasonalContext();

  if (categoryId === "sns") {
    lines.push("【SNS品質 Playbook — プロレベル】");
    lines.push("", "■ Instagram アルゴリズム");
    lines.push("- 1行目3秒フック — 保存率・シェア率を最優先");
    lines.push("- カルーセル1枚目 / リール最初1秒が離脱の9割");
    lines.push("- ハッシュタグ3〜5個（ニッチ+汎用）");
    lines.push("", "■ 売れる構成");
    lines.push("- PAS: 課題共感→深刻化→解決");
    lines.push("- 1メッセージ1CTA（プロフィール/DM/資料）");
    lines.push("", "■ 美容BtoBデザイン方向");
    lines.push("- 代理店風: 非対称・大胆色面・editorial typography");
    lines.push("- 高級感/雑誌風/Instagram風/韓国風 — 毎回オリジナル");
    lines.push("- 公式HPデザイン再現禁止。商品のみ公式画像");
    if (context.appealAxis) {
      lines.push("", `■ 訴求軸: ${context.appealAxis}`);
    }
  }

  if (categoryId === "newsletter") {
    lines.push("【メルマガ品質 Playbook — プロレベル】");
    lines.push("", "■ 件名（開封率）");
    NEWSLETTER_PLAYBOOK.subjectLineFormulas.forEach((f) => lines.push(`- ${f}`));
    lines.push("", "■ 本文構成（最後まで読ませる）");
    NEWSLETTER_PLAYBOOK.bodyFlow.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push("", "■ 教育型コンテンツの切り口");
    NEWSLETTER_PLAYBOOK.educationalAngles.slice(0, 3).forEach((a) => lines.push(`- ${a}`));
    lines.push("", "■ 自然な商品提案への橋渡し");
    NEWSLETTER_PLAYBOOK.softSellBridge.forEach((b) => lines.push(`- ${b}`));
    lines.push("", `■ 季節性（${season.label}）`);
    season.ownerConcerns.forEach((c) => lines.push(`- オーナーの関心: ${c}`));
    season.topics.slice(0, 2).forEach((t) => lines.push(`- 配信トピック例: ${t}`));
  }

  if (categoryId === "proposal") {
    lines.push("【提案書品質 Playbook — プロレベル】");
    lines.push("", "■ 経営課題分析");
    PROPOSAL_PLAYBOOK.analysisFramework.forEach((f) => lines.push(`- ${f}`));
    lines.push("", "■ ROI・数字の書き方");
    PROPOSAL_PLAYBOOK.roiFramework.forEach((f) => lines.push(`- ${f}`));
    lines.push("", "■ 導入ストーリー（90日〜）");
    PROPOSAL_PLAYBOOK.implementationStory.forEach((s) => lines.push(`- ${s}`));
    lines.push("", "■ 競合との差別化");
    PROPOSAL_PLAYBOOK.differentiationAngles.forEach((d) => lines.push(`- ${d}`));
    if (context.challenge?.surfaceChallenge) {
      lines.push("", `■ 今回の課題: ${context.challenge.surfaceChallenge} → ${context.challenge.impact}`);
    }
  }

  if (categoryId === "sales") {
    lines.push("【営業トーク品質 Playbook — プロレベル】");
    lines.push("", "■ 商談フェーズ");
    SALES_PLAYBOOK.phases.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
    lines.push("", "■ SPIN ヒアリング例");
    Object.entries(SALES_PLAYBOOK.spinQuestions).forEach(([key, qs]) => {
      lines.push(`- ${key}: ${qs[0]}`);
    });
    lines.push("", "■ 深掘り質問");
    SALES_PLAYBOOK.deepDiveQuestions.slice(0, 3).forEach((q) => lines.push(`- ${q}`));
    lines.push("", "■ 反論処理マトリクス");
    SALES_PLAYBOOK.objectionMatrix.slice(0, 4).forEach((o) => lines.push(`- ${o.concern} → ${o.response}`));
  }

  if (categoryId === "image") {
    lines.push("【POP・販促品質 Playbook — プロレベル】");
    lines.push("", "■ ヘッドライン公式");
    POP_PLAYBOOK.headlineFormulas.forEach((f) => lines.push(`- ${f}`));
    lines.push("", "■ コピー階層");
    POP_PLAYBOOK.copyHierarchy.forEach((c) => lines.push(`- ${c}`));
    if (context.location) {
      const hint = POP_PLAYBOOK.layoutByLocation[context.location];
      if (hint) lines.push("", `■ 掲示場所（${context.location}）: ${hint}`);
    }
    lines.push("", `■ 季節性: ${season.label} — ${season.topics[0]}`);
  }

  return lines.join("\n");
}
