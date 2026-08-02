/**
 * ChatGPT アプリ Handoff
 *
 * Web版ではなく OpenAI 公式 ChatGPT アプリを優先して起動する。
 * プロンプトは事前にコピー済み → 「アプリを開く → 貼り付けるだけ」の UX。
 */

/** ChatGPT アプリ URL スキーム */
const CHATGPT_APP_SCHEME = "chatgpt://";

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
 * ChatGPT 公式アプリを起動（Web版は開かない）
 * @returns {{ opened: boolean, platform: string, fallbackUrl: string|null }}
 */
export function openChatGptApp() {
  const platform = isIOS() ? "ios" : isAndroid() ? "android" : "desktop";

  try {
    if (isIOS()) {
      window.location.href = CHATGPT_APP_SCHEME;
      return { opened: true, platform, fallbackUrl: CHATGPT_IOS_STORE };
    }

    if (isAndroid()) {
      window.location.href = CHATGPT_ANDROID_INTENT;
      return { opened: true, platform, fallbackUrl: CHATGPT_ANDROID_STORE };
    }

    // デスクトップ — ChatGPT デスクトップアプリがあれば起動
    window.location.href = CHATGPT_APP_SCHEME;
    return { opened: true, platform, fallbackUrl: null };
  } catch {
    return {
      opened: false,
      platform,
      fallbackUrl: isIOS() ? CHATGPT_IOS_STORE : isAndroid() ? CHATGPT_ANDROID_STORE : null,
    };
  }
}

/** Handoff 用トーストメッセージ */
export function getChatGptHandoffMessage(platform) {
  if (platform === "ios" || platform === "android") {
    return "プロンプトをコピーしました。ChatGPTアプリが開いたら貼り付けてください。";
  }
  return "プロンプトをコピーしました。ChatGPTアプリ（またはデスクトップ版）を開いて貼り付けてください。";
}

export { isMobile, CHATGPT_IOS_STORE, CHATGPT_ANDROID_STORE };
