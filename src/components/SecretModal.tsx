import React, { useState, useEffect } from 'react';
import { KeyRound, Shield, Eye, EyeOff, AlertCircle, X, Check } from 'lucide-react';
import { Secret, DecryptedSecret } from '../types';

interface SecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string, value: string) => Promise<void>;
  initialSecret?: DecryptedSecret | null;
  existingKeys: string[];
}

export const SecretModal: React.FC<SecretModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSecret,
  existingKeys,
}) => {
  const [keyName, setKeyName] = useState('');
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSecret) {
      setKeyName(initialSecret.key);
      setValue(initialSecret.value || '');
    } else {
      setKeyName('');
      setValue('');
    }
    setError(null);
    setShowValue(false);
  }, [initialSecret, isOpen]);

  if (!isOpen) return null;

  const validateKey = (val: string): boolean => {
    if (!val) {
      setError('Key name is required.');
      return false;
    }
    const clean = val.trim().toUpperCase();
    if (!/^[A-Z_][A-Z0-9_]*$/.test(clean)) {
      setError('Invalid key format. Must start with a letter/underscore and contain only letters, numbers, and underscores.');
      return false;
    }
    return true;
  };

  const handleKeyChange = (val: string) => {
    const formatted = val.toUpperCase().replace(/\s+/g, '_');
    setKeyName(formatted);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanKey = keyName.trim().toUpperCase();
    if (!validateKey(cleanKey)) return;

    if (!value) {
      setError('Secret value cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(cleanKey, value);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to encrypt and store secret.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExisting = !initialSecret && existingKeys.includes(keyName.trim().toUpperCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#111624] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              {initialSecret ? 'Edit Secret' : 'Add Environment Variable'}
            </h3>
            <p className="text-xs text-slate-400">
              Encrypted on your client before leaving the browser
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Variable Key
            </label>
            <input
              type="text"
              value={keyName}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder="e.g. DATABASE_URL, STRIPE_SECRET_KEY"
              disabled={!!initialSecret}
              className={`w-full rounded-xl border border-white/[0.1] bg-black/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                initialSecret ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            />
            {isExisting && (
              <p className="mt-1 text-[11px] text-amber-400">
                Note: A secret with this key already exists and will be updated.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Secret Value (Plaintext)
              </label>
              <button
                type="button"
                onClick={() => setShowValue(!showValue)}
                className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showValue ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Hide Value</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Show Value</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter plaintext secret value or paste multiline key..."
                style={!showValue ? ({ WebkitTextSecurity: 'disc' } as any) : {}}
                className="w-full rounded-xl border border-white/[0.1] bg-black/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 flex items-start space-x-2.5">
            <Shield className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300">
              <span className="font-semibold text-white">Client-side Encryption:</span> This value will be encrypted with AES-256-GCM using your workspace key before being transmitted.
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 text-xs transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Encrypting & Saving...' : 'Save Secret'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
