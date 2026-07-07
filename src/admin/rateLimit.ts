// 限频控制（防爆破）
// 同一 IP 每分钟最多 5 次；同一邮箱每小时最多 10 次

const ipWindow = 60 * 1000; // 1 分钟
const emailWindow = 60 * 60 * 1000; // 1 小时
const ipLimit = 5;
const emailLimit = 10;

interface RateEntry {
  timestamps: number[];
}

const ipAttempts = new Map<string, RateEntry>();
const emailAttempts = new Map<string, RateEntry>();

function cleanup(entry: RateEntry, windowMs: number) {
  const now = Date.now();
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
}

export function checkRateLimit(ip: string, email: string): { allowed: boolean; reason?: string } {
  const now = Date.now();

  // IP 限频
  let ipEntry = ipAttempts.get(ip);
  if (!ipEntry) {
    ipEntry = { timestamps: [] };
    ipAttempts.set(ip, ipEntry);
  }
  cleanup(ipEntry, ipWindow);
  if (ipEntry.timestamps.length >= ipLimit) {
    return { allowed: false, reason: 'Too many attempts from your IP. Please try again later.' };
  }

  // 邮箱限频
  let emailEntry = emailAttempts.get(email.toLowerCase());
  if (!emailEntry) {
    emailEntry = { timestamps: [] };
    emailAttempts.set(email.toLowerCase(), emailEntry);
  }
  cleanup(emailEntry, emailWindow);
  if (emailEntry.timestamps.length >= emailLimit) {
    return { allowed: false, reason: 'Too many attempts for this email. Please try again later.' };
  }

  // 记录本次
  ipEntry.timestamps.push(now);
  emailEntry.timestamps.push(now);
  return { allowed: true };
}
