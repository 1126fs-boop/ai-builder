/**
 * AI Builder — 共通コンテンツフレームワーク
 * （思考エンジンへの互換レイヤー — 会議・ブリッジ用）
 */

export {
  formatDiscussionSections,
  ROUND_TYPES,
  MIN_DISCUSSION_ROUNDS,
  pickReferenceMessages,
  pickStance,
  STANCE_LABELS,
  summarizeDiscussion,
  buildMeetingTransferPayload,
} from "../thinkingEngine/index.js";
