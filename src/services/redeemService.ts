import type { RedeemRequest, RedeemResult } from '@/types';

// ====== Mock Redeem Service ======
// Replace redeemCode with a real API call later — keep the signature the same.
//
// Test codes for manual verification:
//   LUMOGOOD00000001  → success
//   LUMOUSED00000001  → already redeemed
//   any other code    → invalid / not found

const VALID_CODES = new Set(['LUMOGOOD00000001']);

const USED_CODES = new Set(['LUMOUSED00000001']);

const UNREGISTERED_EMAILS = new Set(['unregistered@example.com']);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function redeemCode(req: RedeemRequest): Promise<RedeemResult> {
  await delay(900);

  const email = req.email.trim().toLowerCase();
  const code = req.code.toUpperCase();

  if (UNREGISTERED_EMAILS.has(email)) {
    return { status: 'failed', reason: 'email_not_registered' };
  }
  if (USED_CODES.has(code)) {
    return { status: 'failed', reason: 'already_used' };
  }
  if (VALID_CODES.has(code)) {
    return { status: 'success' };
  }
  return { status: 'failed', reason: 'invalid_code' };
}
