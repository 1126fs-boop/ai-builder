export type ValidationResult = {
  valid: boolean;
  message: string;
};

/** 氏名の入力チェック */
export function validateFullName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, message: "氏名を入力してください。" };
  }
  if (trimmed.length < 2) {
    return { valid: false, message: "氏名は2文字以上で入力してください。" };
  }
  return { valid: true, message: "" };
}

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

/** パスワードの入力チェック（8文字以上） */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, message: "パスワードを入力してください。" };
  }
  if (password.length < 8) {
    return { valid: false, message: "パスワードは8文字以上で入力してください。" };
  }
  return { valid: true, message: "" };
}

/** パスワード確認の一致チェック */
export function validatePasswordConfirm(
  password: string,
  confirm: string
): ValidationResult {
  if (!confirm) {
    return { valid: false, message: "パスワード（確認）を入力してください。" };
  }
  if (password !== confirm) {
    return { valid: false, message: "パスワードが一致しません。" };
  }
  return { valid: true, message: "" };
}
