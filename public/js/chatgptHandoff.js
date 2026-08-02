/**
 * ChatGPT アプリ Handoff
 *
 * OpenAI 公式 ChatGPT アプリを優先起動。
 * モバイル: Web Share API → ChatGPTアプリへ直接共有（入力済みに近いUX）
 * その他: クリップボード + アプリ起動
 */

/** ChatGPT アプリ URL スキーム */
const CHATGPT_APP_SCHEME = "chatgpt://";

/** プロンプト付き起動を試行するスキーム（非公式・端末により動作差あり） */
function buildChatGptPromptSchemes(promptText) {
  const encoded = encodeURIComponent(promptText.slice(0, 4000));
  return [
    `chatgpt://chat?prompt=${encoded}`,
    `chatgpt://compose?text=${encoded}`,
    `chatgpt://?q=${encoded}`,
  ];
}

/** Android Intent（ChatGPT パッケージ） */
const CHATGPT_ANDROID_INTENT =
  "intent://#Intent;scheme=chatgpt;package=com.openai.chatgpt;end";

/** iOS App Store（フォールバック案内用） */
const CHATGPT_IOS_STORE = "https://apps.apple.com/app/chatgpt/id6448311069";

/** Google Play（フォールバック案内用） */
const CHATGPT_ANDROID_STORE =
  "https://play.google.com/store/apps/details?id=com.openai.chatgpt";

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

function isMobile() {
  return isIOS() || isAndroid();
}

/**
 * Web Share API で ChatGPT アプリへテキスト共有
 * @param {string} promptText
 */
export async function sharePromptToChatGpt(promptText) {
  if (!navigator.share) return { shared: false, reason: "share_unavailable" };

  try {
    await navigator.share({
      title: "AI Builder プロンプト",
      text: promptText,
    });
    return { shared: true, method: "web_share" };
  } catch (err) {
    if (err?.name === "AbortError") return { shared: false, reason: "cancelled" };
    return { shared: false, reason: err?.message ?? "share_failed" };
  }
}

/**
 * ChatGPT 公式アプリを起動
 * @param {string} [promptText] プロンプト付き起動を試行
 */
export function openChatGptApp(promptText) {
  const platform = isIOS() ? "ios" : isAndroid() ? "android" : "desktop";

  try {
    if (promptText) {
      const schemes = buildChatGptPromptSchemes(promptText);
      for (const url of schemes) {
        try {
          window.location.href = url;
          return { opened: true, platform, method: "deeplink_prompt", fallbackUrl: getStoreUrl(platform) };
        } catch {
          /* 次のスキームを試行 */
        }
      }
    }

    if (isIOS()) {
      window.location.href = CHATGPT_APP_SCHEME;
      return { opened: true, platform, method: "scheme", fallbackUrl: CHATGPT_IOS_STORE };
    }

    if (isAndroid()) {
      window.location.href = CHATGPT_ANDROID_INTENT;
      return { opened: true, platform, method: "intent", fallbackUrl: CHATGPT_ANDROID_STORE };
    }

    window.location.href = CHATGPT_APP_SCHEME;
    return { opened: true, platform, method: "scheme", fallbackUrl: null };
  } catch {
    return {
      opened: false,
      platform,
      method: "failed",
      fallbackUrl: getStoreUrl(platform),
    };
  }
}

function getStoreUrl(platform) {
  if (platform === "ios") return CHATGPT_IOS_STORE;
  if (platform === "android") return CHATGPT_ANDROID_STORE;
  return null;
}

/**
 * Handoff 統合 — Share → クリップボード → アプリ起動
 * @param {string} promptText
 */
export async function handoffPromptToChatGptApp(promptText) {
  if (!promptText?.trim()) {
    return { ok: false, message: "プロンプトが空です" };
  }

  if (isMobile() && navigator.share) {
    const shareResult = await sharePromptToChatGpt(promptText);
    if (shareResult.shared) {
      setTimeout(() => openChatGptApp(), 400);
      return {
        ok: true,
        method: "web_share",
        message: "ChatGPTアプリを選択して共有してください。そのまま送信できます。",
      };
    }
    if (shareResult.reason === "cancelled") {
      return { ok: false, message: "共有がキャンセルされました" };
    }
  }

  try {
    await navigator.clipboard.writeText(promptText);
  } catch {
    return { ok: false, message: "クリップボードへのコピーに失敗しました" };
  }

  const { platform, method } = openChatGptApp(promptText);
  return {
    ok: true,
    method: method ?? "clipboard_app",
    platform,
    message: getChatGptHandoffMessage(platform, method),
  };
}

/** Handoff 用トーストメッセージ */
export function getChatGptHandoffMessage(platform, method) {
  if (method === "web_share") {
    return "ChatGPTアプリを選んで共有しました。内容を確認して送信してください。";
  }
  if (platform === "ios" || platform === "android") {
    return "プロンプトをコピーしました。ChatGPTアプリが開いたら貼り付けて送信してください。";
  }
  return "プロンプトをコピーしました。ChatGPTアプリ（デスクトップ版）を開いて貼り付けてください。";
}

export { isMobile, CHATGPT_IOS_STORE, CHATGPT_ANDROID_STORE };
