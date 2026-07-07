// 后台数据模型类型定义

// 角色
export type Role = 'admin' | 'service';

// 后台用户
export interface AdminUser {
  username: string;
  password: string; // Mock 原型，明文存储
  role: Role;
  nickname: string;
}

// 批次状态
export type BatchStatus = 'inactive' | 'active' | 'voided';
// inactive: 未启用（默认，码不可兑换）
// active: 已启用（码可兑换）
// voided: 已作废

// 批次
export interface Batch {
  id: string; // 批次号 B + 时间戳
  durationMonths: number; // 会员时长，写死 12
  count: number; // 生成数量
  remark: string; // 备注
  status: BatchStatus;
  createdBy: string;
  createdAt: string; // ISO
}

// 兑换码状态
export type CodeStatus = 'unused' | 'used' | 'voided';

// 兑换码
export interface Code {
  id: string; // 码值 16 位大写
  batchId: string;
  status: CodeStatus;
  redeemedAt: string | null;
  redeemedEmail: string | null;
  redeemedIp: string | null;
  createdAt: string;
  voidedAt?: string | null;
  voidedReason?: string;
  // 补发标记
  isSupplement?: boolean;
  supplementRemark?: string;
  supplementFor?: string | null; // 补发给哪个原始码/用户
}

// 兑换记录结果
export type RedemptionResult =
  | 'success'
  | 'invalid_code'
  | 'already_used'
  | 'voided'
  | 'email_not_registered'
  | 'batch_inactive'
  | 'rate_limited';

// 兑换记录（含失败）
export interface RedemptionLog {
  id: string;
  code: string;
  email: string;
  result: RedemptionResult;
  ip: string;
  createdAt: string;
}

// 操作日志动作
export type AdminAction =
  | 'login'
  | 'logout'
  | 'batch_create'
  | 'batch_export'
  | 'batch_activate'
  | 'batch_deactivate'
  | 'batch_void'
  | 'code_void'
  | 'code_supplement'
  | 'redeem_rebind'
  | 'redeem_revoke';

// 操作日志
export interface AdminLog {
  id: string;
  operator: string;
  action: AdminAction;
  target: string; // 操作对象描述
  detail?: string;
  createdAt: string;
}

// 看板统计
export interface DashboardStats {
  totalCodes: number;
  totalRedeemed: number;
  totalVoided: number;
  totalUnused: number;
  redemptionRate: number;
  recent7Days: { date: string; count: number }[];
  recent30Days: { date: string; count: number }[];
  batchStats: {
    batchId: string;
    remark: string;
    total: number;
    redeemed: number;
    rate: number;
    status: BatchStatus;
  }[];
}
