/**
 * @deprecated Magic Link / 端末自動パスワード方式は廃止。password-auth.ts を使用してください。
 */
export {
  signInWithPassword,
  signUpWithPassword,
  getSessionUser,
} from "./password-auth";

export { SAVED_EMAIL_KEY } from "./constants";

/** @deprecated ログアウト時に localStorage から削除 */
export function clearSavedEmail(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("ai_builder_saved_email");
}
