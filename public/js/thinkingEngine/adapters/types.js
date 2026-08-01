/**
 * AI Adapter — 型定義
 */

/**
 * @typedef {Object} AIAdapter
 * @property {string} id
 * @property {string} label
 * @property {string[]} supportedPromptFields
 * @property {(generatedPrompt: Object) => Object} buildRequest
 * @property {(request: Object) => Object} getHandoff
 */

export {};
