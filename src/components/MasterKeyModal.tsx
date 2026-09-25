import React, { useState } from 'react';
import { Shield, KeyRound, Lock, Unlock, AlertCircle, CheckCircle2, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MasterKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasterKeyModal: React.FC<MasterKeyModalProps> = ({ isOpen, onClose }) => {
  const { currentWorkspace, isKeyUnlocked, unlockEncryptionKey, lockEncryptionKey, masterPassphrase } = useAuth();
  const [passphraseInput, setPassphraseInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUnlock = async (pass: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const ok = await unlockEncryptionKey(pass);
      if (ok) {
        setSuccessMsg('Vault unlocked successfully with AES-256-GCM!');
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 900);
      } else {
        setError('Failed to unlock. Invalid passphrase or derivation error.');
      }
    } catch (e: any) {
      setError(e.message || 'Error deriving key.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoPassphrase = () => {
    setPassphraseInput('envault-demo-key');
    handleUnlock('envault-demo-key');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.12] bg-[#101420] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/20">
            <KeyRound className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Master Passphrase & Encryption</h3>
            <p className="text-xs text-slate-400">Zero-knowledge client-side AES-256-GCM</p>
          </div>
        </div>

        {/* Status Callout */}
        <div
          className={`rounded-xl border p-3 mb-5 ${
            isKeyUnlocked
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
          }`}
        >
          <div className="flex items-center space-x-2 text-xs font-semibold">
            {isKeyUnlocked ? (
              <>
                <Unlock className="h-4 w-4 text-emerald-400" />
                <span>Vault is currently Unlocked in Browser Memory</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-amber-400" />
                <span>Vault is Locked — Secrets cannot be decrypted</span>
              </>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
            Your encryption key is derived locally using <span className="font-mono text-cyan-300">PBKDF2</span> with 100,000 SHA-256 iterations and workspace salt. The server never receives your passphrase or plaintext keys.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Enter Workspace Master Passphrase
            </label>
            <input
              type="password"
              value={passphraseInput}
              onChange={(e) => setPassphraseInput(e.target.value)}
              placeholder="e.g. confidant-demo-key"
              className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => handleUnlock(passphraseInput)}
              disabled={!passphraseInput || isSubmitting}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 px-4 text-xs transition-all shadow-lg shadow-indigo-600/30"
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Deriving Key...' : 'Unlock Vault'}</span>
            </button>

            <button
              type="button"
              onClick={handleQuickDemoPassphrase}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 py-2 px-3 text-xs transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Unlock with Demo Passphrase (confidant-demo-key)</span>
            </button>

            {isKeyUnlocked && (
              <button
                type="button"
                onClick={() => {
                  lockEncryptionKey();
                  onClose();
                }}
                className="w-full flex items-center justify-center space-x-2 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 py-2 px-3 text-xs transition-colors mt-2"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Lock Vault Now</span>
              </button>
            )}
          </div>

          {/* Crypto Specs */}
          <div className="pt-3 border-t border-white/[0.08] space-y-1.5 text-[11px] text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Cipher:</span>
              <span className="text-slate-200">AES-256-GCM (96-bit IV)</span>
            </div>
            <div className="flex justify-between">
              <span>KDF:</span>
              <span className="text-slate-200">PBKDF2 (SHA-256, 100k rounds)</span>
            </div>
            <div className="flex justify-between truncate">
              <span>Workspace Salt:</span>
              <span className="text-slate-400 truncate max-w-[160px]">
                {currentWorkspace?.encryption_key_salt || 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
