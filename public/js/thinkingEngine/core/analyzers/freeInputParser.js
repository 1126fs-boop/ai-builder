/**
 * 自由記述欄の解析 — 回答不足を補完するヒント抽出
 *
 * gapAnalyzer / inputEnricher / purposeAnalyzer で共用。
 */

/**
 * @param {string} freeInput
 * @returns {{ hints: string[], hasMustInclude: boolean, length: number }}
 */
export function parseFreeInput(freeInput) {
  const text = (freeInput || "").trim();
  if (!text) return { hints: [], hasMustInclude: false, length: 0 };

  const hints = [];
  if (/【必須】|絶対|必ず入|入れたい/.test(text)) hints.push("must_include");
  if (/高級|プレミアム|ラグジュアリー/.test(text)) hints.push("tone_luxury");
  if (/親しみ|カジュアル|やわらか/.test(text)) hints.push("tone_friendly");
  if (/数字|％|%/.test(text)) hints.push("numbers");
  if (/参考|イメージ|似せ|トーン/.test(text)) hints.push("reference");
  if (/季節|春|夏|秋|冬|繁忙|閑散/.test(text)) hints.push("seasonality");
  if (/ヒアリング|商談|メモ/.test(text)) hints.push("hearing");

  return {
    hints,
    hasMustInclude: hints.includes("must_include"),
    length: text.length,
  };
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

  if (categoryId === "image" || categoryId === "sns") {
    if (/店内|POP|サロン店内|受付/.test(corpus)) inferred.display_location = "サロン店内";
    else if (/展示会|セミナー|ブース/.test(corpus)) inferred.display_location = "展示会ブース";
    else if (/SNS|Instagram|デジタル|配信/.test(corpus)) inferred.display_location = "デジタル配信（SNS等）";
    else if (/クリニック/.test(corpus)) inferred.display_location = "クリニック受付";

    if (/売上|売上アップ/.test(corpus)) inferred.appeal_point = "売上アップ";
    else if (/新メニュー|新商品|新機器/.test(corpus)) inferred.appeal_point = "新メニュー";
    else if (/キャンペーン/.test(corpus)) inferred.appeal_point = "キャンペーン";
    else if (/リピート|再来/.test(corpus)) inferred.appeal_point = "リピート率向上";
    else if (/導入|メリット/.test(corpus)) inferred.appeal_point = "導入メリット";

    if (/キャッチ|ヘッド|コピー|文言/.test(corpus) && !inferred.catch_direction) {
      const match = corpus.match(/(?:キャッチ|ヘッド|コピー)[：:]\s*(.{4,40})/);
      if (match) inferred.catch_direction = match[1].trim();
    }
  }

  if (categoryId === "sns") {
    if (/オーナー|経営/.test(corpus)) inferred.target_audience = "サロンオーナー";
    else if (/スタッフ|施術/.test(corpus)) inferred.target_audience = "施術者・スタッフ";
  }

  if (categoryId === "newsletter") {
    if (/新規|見込/.test(corpus)) inferred.audience = "新規見込み客";
    else if (/VIP|重要/.test(corpus)) inferred.audience = "VIP取引先";
    else if (/休眠|離反/.test(corpus)) inferred.audience = "休眠取引先";
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
