import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import type { RedeemResult } from '@/types';
import { cn } from '@/lib/utils';

interface ResultCardProps {
  result: RedeemResult;
  onRetry?: () => void;
}

const FAIL_TEXT: Record<Extract<RedeemResult, { status: 'failed' }>['reason'], string> = {
  already_used:
    'This code has already been redeemed. Each code can be used only once.',
  invalid_code:
    "We couldn't find this code. Please double-check the characters on your card and try again.",
  email_not_registered:
    'This email is not registered in the App. Please create an account in the App first, then come back to redeem.',
};

export default function ResultCard({ result, onRetry }: ResultCardProps) {
  if (result.status === 'success') {
    return (
      <div
        className={cn(
          'animate-pop-in flex flex-col items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-6 py-6 text-center',
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <div className="space-y-1.5">
          <p className="text-lg font-semibold text-emerald-800">Redemption Successful</p>
          <p className="max-w-sm text-[13.5px] leading-relaxed text-emerald-800/80">
            Open the App, go to the <span className="font-medium text-emerald-700">Profile</span>{' '}
            tab and tap <span className="font-medium text-emerald-700">Restore Purchases</span> to
            activate your membership.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'animate-pop-in flex flex-col gap-3 rounded-2xl border border-red-200/80 bg-red-50/70 px-6 py-5',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
          <XCircle className="h-6 w-6 text-red-500" />
        </div>
        <div className="space-y-1 pt-0.5">
          <p className="text-base font-semibold text-red-700">Redemption Failed</p>
          <p className="text-[13.5px] leading-relaxed text-red-700/80">
            {FAIL_TEXT[result.reason]}
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-auto inline-flex items-center gap-1.5 self-end rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}
