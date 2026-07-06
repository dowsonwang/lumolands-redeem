import { useRedeemStore } from '@/store/redeemStore';

// 兑换逻辑 Hook：薄封装，集中暴露状态与动作
export function useRedeem() {
  const status = useRedeemStore((s) => s.status);
  const result = useRedeemStore((s) => s.result);
  const submit = useRedeemStore((s) => s.submit);
  const reset = useRedeemStore((s) => s.reset);

  return { status, result, submit, reset };
}
