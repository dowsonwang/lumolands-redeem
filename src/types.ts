// 兑换相关共享类型

// 兑换状态
export type RedeemStatus = 'idle' | 'loading' | 'success' | 'failed';

// 兑换失败原因
export type RedeemFailReason = 'already_used' | 'invalid_code' | 'email_not_registered';

// 兑换结果
export type RedeemResult = { status: 'success' } | { status: 'failed'; reason: RedeemFailReason };

// 兑换请求参数
export interface RedeemRequest {
  email: string;
  code: string; // 16 位字母+数字（已大写、已去空格）
}
