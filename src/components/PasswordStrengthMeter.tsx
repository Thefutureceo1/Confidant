import React, { useMemo } from 'react';
import zxcvbn from 'zxcvbn';
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
} from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  userInputs?: string[];
  minScore?: number;
  onGenerateSecure?: (generated: string) => void;
  showDetails?: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  userInputs = [],
  minScore = 3,
  onGenerateSecure,
  showDetails = true,
}) => {
  const result = useMemo(() => {
    if (!password) return null;
    return zxcvbn(password, userInputs);
  }, [password, userInputs]);

  const score = result ? result.score : 0;

  const scoreMeta = [
    { label: 'Very Weak', color: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30' },
    { label: 'Weak', color: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/30' },
    { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' },
    { label: 'Good', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    { label: 'Robust (Vault Ready)', color: 'bg-gradient-to-r from-emerald-400 to-cyan-400', text: 'text-cyan-300 font-bold', border: 'border-cyan-500/40' },
  ];

  // Requirements checklist
  const requirements = useMemo(() => {
    return [
      { label: 'At least 10 characters', met: password.length >= 10 },
      { label: 'Mix of upper & lower case', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
      { label: 'Includes numbers (0-9)', met: /\d/.test(password) },
      { label: 'Includes symbols (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(password) },
    ];
  }, [password]);

  const handleGeneratePassword = () => {
    if (!onGenerateSecure) return;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+';
    const array = new Uint8Array(22);
    crypto.getRandomValues(array);
    let str = '';
    for (let i = 0; i < array.length; i++) {
      str += chars[array[i] % chars.length];
    }
    onGenerateSecure(str);
  };

  if (!password) {
    return (
      <div className="mt-2 space-y-2 text-xs">
        {onGenerateSecure && (
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="flex items-center space-x-1.5 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generate secure 22-char master passphrase</span>
          </button>
        )}
      </div>
    );
  }

  const currentMeta = scoreMeta[score];
  const isSufficient = score >= minScore;

  return (
    <div className="mt-2.5 space-y-2.5 rounded-xl border border-white/[0.08] bg-black/40 p-3 text-xs animate-in fade-in duration-150">
      {/* Strength Bars & Score Header */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            {isSufficient ? (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span>Master Key Strength:</span>
          </span>

          <span className={`text-[11px] font-mono ${currentMeta.text}`}>
            {currentMeta.label} ({score}/4)
          </span>
        </div>

        {/* 4 Segmented Progress Bars */}
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map((step) => {
            const active = score >= step + 1 || (score === 0 && step === 0 && password.length > 0);
            return (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  active ? currentMeta.color : 'bg-white/[0.08]'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Details: Crack Time & Entropy */}
      {showDetails && result && (
        <div className="space-y-2 pt-1 border-t border-white/[0.06] text-[11px]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-cyan-400" />
              <span>Offline crack time (PBKDF2):</span>
            </span>
            <span className="font-mono text-cyan-300 font-semibold">
              {result.crack_times_display.offline_slow_hashing_1e4_per_second}
            </span>
          </div>

          {/* zxcvbn Feedback & Warnings */}
          {result.feedback.warning && (
            <div className="flex items-start space-x-1.5 text-rose-300 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{result.feedback.warning}</span>
            </div>
          )}

          {result.feedback.suggestions && result.feedback.suggestions.length > 0 && (
            <div className="text-slate-400 space-y-0.5 pl-1">
              {result.feedback.suggestions.map((sugg, i) => (
                <div key={i} className="text-[10px] text-amber-300/90 flex items-center gap-1">
                  <span>•</span>
                  <span>{sugg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Checklist */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
            {requirements.map((req, idx) => (
              <div
                key={idx}
                className={`flex items-center space-x-1.5 ${
                  req.met ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {req.met ? (
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 shrink-0" />
                )}
                <span>{req.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Generator link */}
      {onGenerateSecure && (
        <div className="pt-1 flex items-center justify-between text-[11px] border-t border-white/[0.04]">
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            <span>Regenerate high-entropy key</span>
          </button>
          {!isSufficient && (
            <span className="text-[10px] text-amber-400">
              Score of {minScore}+ recommended for zero-knowledge vault
            </span>
          )}
        </div>
      )}
    </div>
  );
};
