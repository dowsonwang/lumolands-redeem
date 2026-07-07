// 兑换码生成器
// 16 位大写字母+数字，剔除易混淆字符 0 O 1 I L，剩 31 个字符

const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 31 个字符（剔除 0O1IL）
const CODE_LEN = 16;

function randomChar(): string {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)];
}

// 生成单个 16 位码
export function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LEN; i++) {
    code += randomChar();
  }
  return code;
}

// 批量生成 N 个不重复码（与已有码集合去重）
export function generateCodes(count: number, existing: Set<string>): string[] {
  const result: string[] = [];
  let attempts = 0;
  const maxAttempts = count * 10; // 容错
  while (result.length < count && attempts < maxAttempts) {
    const code = generateCode();
    if (!existing.has(code)) {
      existing.add(code);
      result.push(code);
    }
    attempts++;
  }
  if (result.length < count) {
    throw new Error(`Failed to generate ${count} unique codes after ${maxAttempts} attempts`);
  }
  return result;
}

// 格式化为 4-4-4-4 展示
export function formatCode(code: string): string {
  return code.match(/.{4}/g)?.join('-') ?? code;
}
