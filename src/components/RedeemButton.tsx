import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RedeemButtonProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export default function RedeemButton({ disabled, loading, onClick }: RedeemButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3.5',
        'text-[15px] font-semibold text-cream transition-all',
        'bg-ink hover:bg-stone-800',
        'shadow-[0_8px_24px_-8px_rgba(28,25,23,0.5)] hover:shadow-[0_12px_28px_-8px_rgba(28,25,23,0.55)]',
        'active:translate-y-px',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
      )}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      {loading ? (
        <>
          <Loader2 className="h-4.5 w-4.5 animate-spin" />
          <span>Redeeming…</span>
        </>
      ) : (
        <>
          <Sparkles className="h-4.5 w-4.5 text-amber-400" />
          <span>Redeem Now</span>
        </>
      )}
    </button>
  );
}
