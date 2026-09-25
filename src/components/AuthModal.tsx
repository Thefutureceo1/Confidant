import React, { useState } from 'react';
import {
  UserPlus,
  LogIn,
  KeyRound,
  Shield,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import zxcvbn from 'zxcvbn';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signup',
}) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [masterPassphrase, setMasterPassphrase] = useState('');
  const [useSeparateMasterKey, setUseSeparateMasterKey] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (!email.trim()) {
        setError('Please enter a valid email address');
        return;
      }
      if (!accountPassword) {
        setError('Please choose a password');
        return;
      }

      // Check password strength via zxcvbn
      const effectiveMaster = useSeparateMasterKey && masterPassphrase ? masterPassphrase : accountPassword;
      const evaluation = zxcvbn(effectiveMaster, [name, email]);
      if (evaluation.score < 2) {
        setError('Your master encryption passphrase is too weak. Please choose a stronger key (score 2+).');
        return;
      }

      setIsSubmitting(true);
      try {
        await signup(email.trim(), name.trim(), accountPassword, effectiveMaster);
        setSuccess('Account created and Zero-Knowledge workspace initialized!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } catch (err: any) {
        setError(err.message || 'Failed to create account');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!email.trim() || !accountPassword) {
        setError('Please enter email and password');
        return;
      }

      setIsSubmitting(true);
      try {
        const ok = await login(email.trim(), accountPassword);
        if (ok) {
          setSuccess('Logged in successfully!');
          setTimeout(() => {
            onClose();
          }, 800);
        } else {
          setError('Invalid credentials');
        }
      } catch (err: any) {
        setError(err.message || 'Login failed');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#111624] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-md">
            {mode === 'signup' ? (
              <UserPlus className="h-5 w-5 text-white" />
            ) : (
              <LogIn className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              {mode === 'signup' ? 'Create Confidant Developer Account' : 'Sign In to Confidant'}
            </h3>
            <p className="text-xs text-slate-400">
              {mode === 'signup'
                ? 'Client-side zero-knowledge encrypted secret manager'
                : 'Access your projects, environments, and secrets'}
            </p>
          </div>
        </div>

        {/* Tabs: Sign Up vs Sign In */}
        <div className="flex rounded-xl bg-black/40 p-1 border border-white/[0.06] mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              mode === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              mode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Developer Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@company.com"
              className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Account Password & Master Passphrase
            </label>
            <input
              type="password"
              value={accountPassword}
              onChange={(e) => setAccountPassword(e.target.value)}
              placeholder="Choose a strong master passphrase..."
              className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
              required
            />

            {/* Password Strength Meter for Account/Master Key */}
            {mode === 'signup' && !useSeparateMasterKey && (
              <PasswordStrengthMeter
                password={accountPassword}
                userInputs={[name, email]}
                minScore={2}
                onGenerateSecure={(pass) => setAccountPassword(pass)}
              />
            )}
          </div>

          {/* Option for separate master encryption key during signup */}
          {mode === 'signup' && (
            <div className="pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={useSeparateMasterKey}
                  onChange={(e) => setUseSeparateMasterKey(e.target.checked)}
                  className="rounded border-white/[0.2] bg-black/40 text-indigo-600 focus:ring-0"
                />
                <span>Use a dedicated master passphrase for AES-256 vault encryption</span>
              </label>

              {useSeparateMasterKey && (
                <div className="mt-3 p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-300">
                    <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Workspace Zero-Knowledge Master Passphrase</span>
                  </div>
                  <input
                    type="password"
                    value={masterPassphrase}
                    onChange={(e) => setMasterPassphrase(e.target.value)}
                    placeholder="Enter dedicated master key..."
                    className="w-full rounded-xl border border-white/[0.1] bg-black/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                  />
                  <PasswordStrengthMeter
                    password={masterPassphrase}
                    userInputs={[name, email]}
                    minScore={3}
                    onGenerateSecure={(pass) => setMasterPassphrase(pass)}
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 text-xs transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Processing...</span>
              ) : mode === 'signup' ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account & Initialize Vault</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-white/[0.08] text-center text-xs text-slate-500">
          Zero-Knowledge Guarantee: Your master passphrase is never sent to our servers.
        </div>
      </div>
    </div>
  );
};
