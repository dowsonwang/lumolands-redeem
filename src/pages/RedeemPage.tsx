import { useState } from 'react';
import EmailInput from '@/components/EmailInput';
import CodeInput from '@/components/CodeInput';
import RedeemButton from '@/components/RedeemButton';
import ResultCard from '@/components/ResultCard';
import { useRedeem } from '@/hooks/useRedeem';
import { isValidEmail, isCodeComplete, joinCode } from '@/utils/validation';

const EMPTY_CODE = ['', '', '', ''];

export default function RedeemPage() {
  const { status, result, submit, reset } = useRedeem();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(EMPTY_CODE);
  const [emailTouched, setEmailTouched] = useState(false);

  const loading = status === 'loading';
  const finished = status === 'success' || status === 'failed';

  const emailValid = isValidEmail(email);
  const codeComplete = isCodeComplete(code);
  const canSubmit = emailValid && codeComplete && !loading;

  const showEmailError = emailTouched && email.length > 0 && !emailValid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (!emailValid) setEmailTouched(true);
    void submit(email.trim(), joinCode(code));
  };

  const handleReset = () => {
    reset();
    setCode(EMPTY_CODE);
    setEmailTouched(false);
  };

  const lockInputs = loading || status === 'success';

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:py-14">
      <header className="mb-7 flex flex-col items-center text-center animate-fade-up" style={{ animationDelay: '0ms' }}>
        <div className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          lumolands
        </div>
        <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.25em] text-stone-400">
          Membership Redemption
        </p>
      </header>

      <section
        className="w-full max-w-[520px] animate-fade-up rounded-3xl border border-stone-200/70 bg-white/90 p-6 shadow-[0_24px_60px_-24px_rgba(28,25,23,0.25)] backdrop-blur-sm sm:p-8"
        style={{ animationDelay: '90ms' }}
      >
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-semibold text-ink sm:text-[22px]">Redeem Your Membership</h1>
          <p className="text-[13.5px] text-stone-500">
            Enter the email registered in the lumolands App and the 16-character code from your
            redemption card to activate.
          </p>
        </div>

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div style={{ animationDelay: '160ms' }} className="animate-fade-up">
            <EmailInput
              value={email}
              onChange={setEmail}
              onBlur={() => email && setEmailTouched(true)}
              invalid={showEmailError}
              disabled={lockInputs}
            />
          </div>

          <div style={{ animationDelay: '230ms' }} className="animate-fade-up">
            <CodeInput value={code} onChange={setCode} disabled={lockInputs} />
          </div>

          {!finished && (
            <div className="animate-fade-up" style={{ animationDelay: '300ms' }}>
              <RedeemButton
                disabled={!canSubmit}
                loading={loading}
                onClick={handleSubmit}
              />
            </div>
          )}

          {finished && result && (
            <ResultCard
              result={result}
              onRetry={status === 'failed' ? handleReset : undefined}
            />
          )}
        </form>
      </section>
    </main>
  );
}
