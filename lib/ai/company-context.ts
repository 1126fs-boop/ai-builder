/**
 * 株式会社ワム — プロンプト生成用ビジネスコンテキスト（サーバー側）
 */

export const COMPANY_PROFILE = `【会社前提】
株式会社ワムは、美容機器・美容商材メーカーとして全国の美容サロン・クリニック等へ商品を卸す BtoB 企業です。
営業スタイルは「ソリューション営業」——商品を売るのではなく、
お客様（サロン・クリニック等）の経営課題をヒアリングし、解決策を提案します。`;

export const TARGET_CLIENTS = `【主な取引先】
エステサロン / 美容室 / ネイルサロン / アイラッシュサロン /
整体院 / 整骨院・接骨院 / 鍼灸院 / クリニック /
リラクゼーションサロン / フィットネス・パーソナルジム 等`;

export const SOLUTION_AREAS = `【提案領域】
美容機器・痩身機器・フェイシャル機器・脱毛機 /
美容液・化粧品・店販商品 / 経営改善・売上アップ・客単価アップ /
集客支援・教育・スタッフ育成・AI活用・業務効率化`;

export const SOLUTION_SELLING_RULES = `【ソリューション営業の原則 — 必ず守ること】
1. 商品説明・スペック押し売りはしない。経営課題の解決を最優先する
2. 売上・利益・リピート・集客・客単価・業務効率・人材の視点を優先する
3. サロンオーナー・院長・店長の立場に立った共感から入る
4. 具体的な数字・施策・Before/After を意識した提案にする
5. 営業担当者が ChatGPT / Claude 等に貼り付けて即使用できる完成度にする
6. AI っぽい表現を避け、現場の営業担当者が自然に使える日本語にする`;

export function getCompanyContextBlock(): string {
  return [COMPANY_PROFILE, TARGET_CLIENTS, SOLUTION_AREAS, SOLUTION_SELLING_RULES].join("\n\n");
}
