// 兑换服务：对接后台同一套 localStorage 数据
// 兑换前台调用此服务，兑换记录写入 db，后台可查询/补救

import { codeDB, batchDB, redemptionLogDB } from '@/admin/db';
import { checkRateLimit } from '@/admin/rateLimit';
import type { RedeemRequest, RedeemResult } from '@/types';

// Mock 未注册邮箱（演示用）
const UNREGISTERED_EMAILS = new Set(['unregistered@example.com']);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 600));
}

export async function redeemCode(req: RedeemRequest): Promise<RedeemResult> {
  await delay(600);

  const email = req.email.trim();
  const code = req.code.toUpperCase();
  const ip = '127.0.0.1'; // Mock：真实场景从请求头获取

  // 1. 限频检查
  const rateCheck = checkRateLimit(ip, email);
  if (!rateCheck.allowed) {
    redemptionLogDB.add({ code, email, result: 'rate_limited', ip });
    return { status: 'failed', reason: 'invalid_code' }; // 前台仍按 invalid 显示，避免泄露码是否存在
  }

  // 2. 邮箱注册校验（Mock）
  if (UNREGISTERED_EMAILS.has(email.toLowerCase())) {
    redemptionLogDB.add({ code, email, result: 'email_not_registered', ip });
    return { status: 'failed', reason: 'email_not_registered' };
  }

  // 3. 查码
  const codeRecord = codeDB.get(code);
  if (!codeRecord) {
    redemptionLogDB.add({ code, email, result: 'invalid_code', ip });
    return { status: 'failed', reason: 'invalid_code' };
  }

  // 4. 批次启用校验（补发码不受批次状态限制）
  if (!codeRecord.isSupplement) {
    const batch = batchDB.get(codeRecord.batchId);
    if (batch && batch.status !== 'active') {
      redemptionLogDB.add({ code, email, result: 'batch_inactive', ip });
      // 提示码已作废，联系客服（不暴露批次未启用细节）
      return { status: 'failed', reason: 'invalid_code' };
    }
  }

  // 5. 状态校验
  if (codeRecord.status === 'voided') {
    redemptionLogDB.add({ code, email, result: 'voided', ip });
    return { status: 'failed', reason: 'already_used' }; // 前台统一提示联系客服
  }
  if (codeRecord.status === 'used') {
    redemptionLogDB.add({ code, email, result: 'already_used', ip });
    return { status: 'failed', reason: 'already_used' };
  }

  // 6. 核销（db 内部保证状态判断 + 写入）
  const result = codeDB.redeem(code, email, ip);
  if (result.success) {
    redemptionLogDB.add({ code, email, result: 'success', ip });
    return { status: 'success' };
  }
  // 兜底
  redemptionLogDB.add({ code, email, result: 'invalid_code', ip });
  return { status: 'failed', reason: 'invalid_code' };
}
