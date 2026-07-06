import { MapPin, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  disabled?: boolean;
}

export default function EmailInput({ value, onChange, onBlur, invalid, disabled }: EmailInputProps) {
  return (
    <div className="space-y-2.5">
      <label htmlFor="email" className="block text-sm font-medium text-ink">
        Registered App Email
      </label>

      <input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        spellCheck={false}
        placeholder="e.g. you@example.com"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          'w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-ink placeholder:text-stone-300',
          'transition-colors outline-none',
          'focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15',
          invalid
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
            : 'border-stone-200 hover:border-stone-300',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      />

      {/* Tip 1 — where to find the email */}
      <div
        className={cn(
          'flex gap-2.5 rounded-xl border border-stone-200/80 bg-stone-50/80 px-3.5 py-3',
          'text-[13px] leading-relaxed text-stone-600',
        )}
      >
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
        <div>
          <p className="font-medium text-stone-700">Where can I find my registered email?</p>
          <p className="mt-0.5">
            Open the lumolands App, tap the <span className="font-medium text-stone-800">Profile</span>
            {' '}tab at the bottom. The email address shown at the top of the Profile page is your registered email.
          </p>
        </div>
      </div>

      {/* Tip 2 — Apple/Google sign-in users must use the masked/privacy email shown in App */}
      <div
        className={cn(
          'flex gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-3',
          'text-[13px] leading-relaxed text-amber-900',
        )}
      >
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
        <div>
          <p className="font-medium">Signed in with Google or Apple?</p>
          <p className="mt-0.5 text-amber-800/90">
            When you use Sign in with Apple or Google, the system may create a
            <span className="font-medium"> masked / privacy relay email </span>
            for you (e.g. <span className="font-mono">xxxx@privaterelay.appleid.com</span>).
            Please <span className="font-medium text-amber-900">do not</span> enter your personal
            Google or Apple email directly — you must enter the exact masked email shown on the
            Profile page inside the App, otherwise we cannot match your membership.
          </p>
        </div>
      </div>

      {invalid && (
        <p className="text-[13px] text-red-500">Please enter a valid email address.</p>
      )}
    </div>
  );
}
