import { useRef } from 'react';
import { Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

const GROUPS = 4;
const GROUP_LEN = 4;

export default function CodeInput({ value, onChange, disabled }: CodeInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const sanitize = (s: string) =>
    s
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, GROUP_LEN);

  const setGroup = (i: number, raw: string) => {
    const clean = sanitize(raw);
    const next = [...value];
    next[i] = clean;
    onChange(next);
    if (clean.length === GROUP_LEN && i < GROUPS - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < GROUPS - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, GROUPS * GROUP_LEN);
    const next = ['', '', '', ''];
    for (let g = 0; g < GROUPS; g++) {
      next[g] = clean.slice(g * GROUP_LEN, (g + 1) * GROUP_LEN);
    }
    onChange(next);
    const focusIdx = Math.min(
      next.findIndex((g) => g.length < GROUP_LEN),
      GROUPS - 1,
    );
    refs.current[focusIdx < 0 ? GROUPS - 1 : focusIdx]?.focus();
  };

  return (
    <div className="space-y-2.5">
      <label className="block text-sm font-medium text-ink">Redemption Code</label>

      <div
        className={cn(
          'grid grid-cols-4 gap-2 sm:gap-3',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        {Array.from({ length: GROUPS }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            value={value[i] ?? ''}
            disabled={disabled}
            onChange={(e) => setGroup(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            aria-label={`Redemption code group ${i + 1}`}
            className={cn(
              'font-code h-14 w-full rounded-xl border bg-white text-center text-lg font-semibold text-ink',
              'transition-all outline-none',
              'focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15',
              'border-stone-200 hover:border-stone-300',
              'placeholder:text-stone-200',
            )}
            maxLength={GROUP_LEN}
          />
        ))}
      </div>

      <div
        className={cn(
          'flex gap-2.5 rounded-xl border border-stone-200/80 bg-stone-50/80 px-3.5 py-3',
          'text-[13px] leading-relaxed text-stone-600',
        )}
      >
        <Gift className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
        <div>
          <p className="font-medium text-stone-700">Where is my code?</p>
          <p className="mt-0.5">
            Your redemption code is printed on a card inside your package.
            <span className="text-stone-800"> Scratch off the silver coating</span> to reveal the
            16-character code. Enter the 4 characters into each box (letters and numbers only — case
            is automatically converted to uppercase).
          </p>
        </div>
      </div>
    </div>
  );
}
