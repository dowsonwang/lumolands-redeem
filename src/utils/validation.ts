// 邮箱与兑换码校验工具

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CODE_CHAR_RE = /[A-Z0-9]/;

// 邮箱格式校验
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

// 将任意字符串规范为兑换码字符（大写 + 仅字母数字）
export function normalizeCodeChar(ch: string): string {
  const upper = ch.toUpperCase();
  return CODE_CHAR_RE.test(upper) ? upper : '';
}

// 判断 16 位兑换码是否完整（4 组 × 4 位）
export function isCodeComplete(groups: string[]): boolean {
  return groups.length === 4 && groups.every((g) => g.length === 4);
}

// 将 4 组拼接为完整兑换码
export function joinCode(groups: string[]): string {
  return groups.join('');
}
