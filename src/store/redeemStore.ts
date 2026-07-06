import { create } from 'zustand';
import { redeemCode } from '@/services/redeemService';
import type { RedeemResult, RedeemStatus } from '@/types';

interface RedeemState {
  status: RedeemStatus;
  result: RedeemResult | null;
  submit: (email: string, code: string) => Promise<void>;
  reset: () => void;
}

export const useRedeemStore = create<RedeemState>((set) => ({
  status: 'idle',
  result: null,
  submit: async (email, code) => {
    set({ status: 'loading', result: null });
    try {
      const result = await redeemCode({ email, code });
      set({
        status: result.status === 'success' ? 'success' : 'failed',
        result,
      });
    } catch {
      // 兜底：异常时按兑换码无效处理
      set({
        status: 'failed',
        result: { status: 'failed', reason: 'invalid_code' },
      });
    }
  },
  reset: () => set({ status: 'idle', result: null }),
}));
