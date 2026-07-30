export type ValidationResult = {
  valid: boolean;
  message: string;
};

/** メールアドレスの形式チェック */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return { valid: false, message: "メールアドレスを入力してください。" };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    return { valid: false, message: "正しいメールアドレスの形式で入力してください。" };
  }

  return { valid: true, message: "" };
}
