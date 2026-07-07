// localStorage 持久化数据库层
// 所有数据存在 localStorage，刷新不丢失。提供同步读写 + 订阅。

import type { AdminUser, Batch, Code, RedemptionLog, AdminLog } from './types';
import { generateCodes } from './codeGenerator';

const DB_KEY = 'lumolands_redeem_db_v2';

interface DBShape {
  users: AdminUser[];
  batches: Batch[];
  codes: Code[];
  redemptionLogs: RedemptionLog[];
  adminLogs: AdminLog[];
  // 登录失败锁定记录
  loginLocks: Record<string, { failCount: number; lockedUntil: number | null }>;
}

// 默认种子数据
function seedDB(): DBShape {
  const now = new Date().toISOString();
  const users: AdminUser[] = [
    { username: 'admin', password: 'admin', role: 'admin', nickname: '管理员' },
    { username: 'service', password: 'service', role: 'service', nickname: '客服' },
  ];

  // 种子：1 个已启用的批次 + 3 个固定测试码（覆盖客服补救全部场景）
  const batch1: Batch = {
    id: 'B20260707001',
    durationMonths: 12,
    count: 3,
    remark: '种子批次·测试用',
    status: 'active',
    createdBy: 'admin',
    createdAt: now,
  };

  // 3 个固定可记忆的 mock 码（仅使用合法字符集，剔除 0O1IL）
  const codes: Code[] = [
    {
      // 场景1：已使用 —— 用户把邮箱拼错了（gmial），用来测「换绑」和「撤销兑换」
      id: 'REMEDYUSEDAAAAAA',
      batchId: batch1.id,
      status: 'used',
      redeemedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      redeemedEmail: 'user@gmial.com',
      redeemedIp: '203.0.113.42',
      createdAt: now,
    },
    {
      // 场景2：未使用 —— 可测「该码尚未被兑换」提示
      id: 'REMEDYNEWAAAAAAA',
      batchId: batch1.id,
      status: 'unused',
      redeemedAt: null,
      redeemedEmail: null,
      redeemedIp: null,
      createdAt: now,
    },
    {
      // 场景3：已作废 —— 可测「该码已被作废」提示
      id: 'REMEDYVDDAAAAAAA',
      batchId: batch1.id,
      status: 'voided',
      redeemedAt: null,
      redeemedEmail: null,
      redeemedIp: null,
      createdAt: now,
    },
  ];

  // 对应的兑换记录（含一次失败的尝试，还原真实客诉排查场景）
  const redemptionLogs: RedemptionLog[] = [
    {
      id: 'log_seed_1',
      code: 'REMEDYUSEDAAAAAA',
      email: 'user@gmial.com',
      result: 'success',
      ip: '203.0.113.42',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
  ];

  return {
    users,
    batches: [batch1],
    codes,
    redemptionLogs,
    adminLogs: [],
    loginLocks: {},
  };
}

let db: DBShape | null = null;
const listeners = new Set<() => void>();

function load(): DBShape {
  if (db) return db;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      db = JSON.parse(raw) as DBShape;
      return db;
    }
  } catch {
    // ignore parse error, fall through to seed
  }
  db = seedDB();
  persist();
  return db;
}

function persist() {
  if (!db) return;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function notify() {
  listeners.forEach((l) => l());
}

// 订阅数据变化（组件用 useSyncExternalStore）
export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// 获取只读快照（useSyncExternalStore 需要 stable reference，这里简化处理）
export function getDB(): DBShape {
  return load();
}

// 强制重渲染的版本号
let version = 0;
export function getVersion() {
  return version;
}

// 写操作后调用
function commit() {
  persist();
  version++;
  notify();
}

// ============ 认证 ============
export const authDB = {
  login(username: string, password: string): { success: boolean; user?: AdminUser; error?: string } {
    const data = load();
    const lock = data.loginLocks[username];
    if (lock?.lockedUntil && lock.lockedUntil > Date.now()) {
      const mins = Math.ceil((lock.lockedUntil - Date.now()) / 60000);
      return { success: false, error: `账号已锁定，请 ${mins} 分钟后再试` };
    }
    const user = data.users.find((u) => u.username === username && u.password === password);
    if (!user) {
      const current = data.loginLocks[username] ?? { failCount: 0, lockedUntil: null };
      current.failCount += 1;
      if (current.failCount >= 5) {
        current.lockedUntil = Date.now() + 15 * 60 * 1000;
        current.failCount = 0;
      }
      data.loginLocks[username] = current;
      commit();
      return { success: false, error: '用户名或密码错误' };
    }
    // 登录成功，清除锁定
    data.loginLocks[username] = { failCount: 0, lockedUntil: null };
    commit();
    return { success: true, user };
  },
};

// ============ 批次 ============
export const batchDB = {
  list(): Batch[] {
    return load().batches;
  },
  get(id: string): Batch | undefined {
    return load().batches.find((b) => b.id === id);
  },
  create(input: { count: number; remark: string; createdBy: string }): Batch {
    const data = load();
    const now = new Date();
    const id = `B${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(data.batches.length + 1).padStart(3, '0')}`;
    const batch: Batch = {
      id,
      durationMonths: 12,
      count: input.count,
      remark: input.remark,
      status: 'inactive',
      createdBy: input.createdBy,
      createdAt: now.toISOString(),
    };
    data.batches.push(batch);

    // 批量生成码
    const existing = new Set(data.codes.map((c) => c.id));
    const codeStrings = generateCodes(input.count, existing);
    for (const cs of codeStrings) {
      data.codes.push({
        id: cs,
        batchId: batch.id,
        status: 'unused',
        redeemedAt: null,
        redeemedEmail: null,
        redeemedIp: null,
        createdAt: now.toISOString(),
      });
    }
    commit();
    return batch;
  },
  setStatus(id: string, status: Batch['status']): void {
    const data = load();
    const batch = data.batches.find((b) => b.id === id);
    if (batch) {
      batch.status = status;
      commit();
    }
  },
  // 整批作废：仅作废未使用的码
  void(id: string): void {
    const data = load();
    const batch = data.batches.find((b) => b.id === id);
    if (!batch) return;
    batch.status = 'voided';
    const now = new Date().toISOString();
    data.codes.forEach((c) => {
      if (c.batchId === id && c.status === 'unused') {
        c.status = 'voided';
        c.voidedAt = now;
        c.voidedReason = '批次作废';
      }
    });
    commit();
  },
};

// ============ 兑换码 ============
export const codeDB = {
  list(): Code[] {
    return load().codes;
  },
  get(id: string): Code | undefined {
    return load().codes.find((c) => c.id === id);
  },
  // 按条件查询
  query(opts: {
    code?: string;
    email?: string;
    batchId?: string;
    status?: Code['status'];
  }): Code[] {
    const data = load();
    return data.codes.filter((c) => {
      if (opts.code && !c.id.includes(opts.code.toUpperCase())) return false;
      if (opts.email && !(c.redeemedEmail ?? '').toLowerCase().includes(opts.email.toLowerCase())) return false;
      if (opts.batchId && c.batchId !== opts.batchId) return false;
      if (opts.status && c.status !== opts.status) return false;
      return true;
    });
  },
  // 单个作废（仅未使用）
  void(id: string, reason: string): boolean {
    const data = load();
    const code = data.codes.find((c) => c.id === id);
    if (!code || code.status !== 'unused') return false;
    code.status = 'voided';
    code.voidedAt = new Date().toISOString();
    code.voidedReason = reason;
    commit();
    return true;
  },
  // 单个补发
  supplement(input: { batchId?: string; remark: string }): Code {
    const data = load();
    const existing = new Set(data.codes.map((c) => c.id));
    const [codeStr] = generateCodes(1, existing);
    const newCode: Code = {
      id: codeStr,
      batchId: input.batchId ?? 'SUPPLEMENT',
      status: 'unused',
      redeemedAt: null,
      redeemedEmail: null,
      redeemedIp: null,
      createdAt: new Date().toISOString(),
      isSupplement: true,
      supplementRemark: input.remark,
    };
    data.codes.push(newCode);
    commit();
    return newCode;
  },
  // 兑换核销（前台调用）
  redeem(codeId: string, email: string, ip: string): { success: boolean; reason?: string } {
    const data = load();
    const code = data.codes.find((c) => c.id === codeId.toUpperCase());
    if (!code) return { success: false, reason: 'invalid_code' };
    const batch = data.batches.find((b) => b.id === code.batchId);
    if (code.status === 'voided') return { success: false, reason: 'voided' };
    if (code.status === 'used') return { success: false, reason: 'already_used' };
    if (batch && batch.status !== 'active' && !code.isSupplement) {
      return { success: false, reason: 'batch_inactive' };
    }
    // 核销
    code.status = 'used';
    code.redeemedAt = new Date().toISOString();
    code.redeemedEmail = email;
    code.redeemedIp = ip;
    commit();
    return { success: true };
  },
  // 撤销兑换：码重置为未使用
  revoke(codeId: string): boolean {
    const data = load();
    const code = data.codes.find((c) => c.id === codeId);
    if (!code || code.status !== 'used') return false;
    code.status = 'unused';
    code.redeemedAt = null;
    code.redeemedEmail = null;
    code.redeemedIp = null;
    commit();
    return true;
  },
  // 换绑：改兑换邮箱（码状态不变）
  rebind(codeId: string, newEmail: string): boolean {
    const data = load();
    const code = data.codes.find((c) => c.id === codeId);
    if (!code || code.status !== 'used') return false;
    code.redeemedEmail = newEmail;
    commit();
    return true;
  },
};

// ============ 兑换记录 ============
export const redemptionLogDB = {
  add(log: Omit<RedemptionLog, 'id' | 'createdAt'>): void {
    const data = load();
    data.redemptionLogs.push({
      ...log,
      id: `RL${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    });
    commit();
  },
  list(): RedemptionLog[] {
    return load().redemptionLogs;
  },
  getByCode(codeId: string): RedemptionLog[] {
    return load().redemptionLogs.filter((l) => l.code === codeId);
  },
};

// ============ 操作日志 ============
export const adminLogDB = {
  add(log: Omit<AdminLog, 'id' | 'createdAt'>): void {
    const data = load();
    data.adminLogs.push({
      ...log,
      id: `AL${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    });
    commit();
  },
  list(): AdminLog[] {
    return load().adminLogs;
  },
};

// ============ Mock App 会员接口 ============
// 模拟 App 后端的开通/回收会员
export const appMemberDB = {
  // 给指定邮箱开通 12 个月会员（叠加顺延）
  grant(email: string, months: number, source: string): void {
    // Mock：仅记录到 adminLogs 的 detail，不真实存储
    // 真实场景：调用 App 后端内部接口
    console.log(`[Mock App API] Grant ${months} months membership to ${email}, source: ${source}`);
  },
  // 回收指定邮箱的某次兑换会员
  revoke(email: string, source: string): void {
    console.log(`[Mock App API] Revoke membership from ${email}, source: ${source}`);
  },
};

// 重置数据库（开发用）
export function resetDB() {
  localStorage.removeItem(DB_KEY);
  db = null;
  version++;
  notify();
}
