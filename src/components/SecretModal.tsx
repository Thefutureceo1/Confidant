import React, { useState, useEffect } from 'react';
import { KeyRound, Shield, Eye, EyeOff, AlertCircle, X, Check, Calendar, RefreshCw, ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import { Secret, DecryptedSecret } from '../types';

interface SecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    key: string,
    value: string,
    rotationIntervalDays?: number | null,
    rotationStrategy?: 'generate_alphanumeric' | 'generate_hex' | 'generate_uuid' | 'manual_update' | null,
    rotationKeyLength?: number | null
  ) => Promise<void>;
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

  // Rotation policy states
  const [enableRotation, setEnableRotation] = useState(false);
  const [rotationInterval, setRotationInterval] = useState(30);
  const [rotationStrategy, setRotationStrategy] = useState<'generate_alphanumeric' | 'generate_hex' | 'generate_uuid' | 'manual_update'>('manual_update');
  const [rotationKeyLength, setRotationKeyLength] = useState(32);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (initialSecret) {
      setKeyName(initialSecret.key);
      setValue(initialSecret.value || '');
      setEnableRotation(!!initialSecret.rotation_interval_days);
      setRotationInterval(initialSecret.rotation_interval_days || 30);
      setRotationStrategy(initialSecret.rotation_strategy || 'manual_update');
      setRotationKeyLength(initialSecret.rotation_key_length || 32);
      setShowAdvanced(!!initialSecret.rotation_interval_days);
    } else {
      setKeyName('');
      setValue('');
      setEnableRotation(false);
      setRotationInterval(30);
      setRotationStrategy('manual_update');
      setRotationKeyLength(32);
      setShowAdvanced(false);
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

  const handleGenerateValue = () => {
    let newVal = '';
    if (rotationStrategy === 'generate_uuid') {
      newVal = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (window.crypto.getRandomValues(new Uint8Array(1))[0]) % 16;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    } else {
      const hexChars = '0123456789abcdef';
      const alphaChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
      const chars = rotationStrategy === 'generate_hex' ? hexChars : alphaChars;
      const arr = new Uint8Array(rotationKeyLength);
      window.crypto.getRandomValues(arr);
      newVal = Array.from(arr).map(b => chars[b % chars.length]).join('');
    }
    setValue(newVal);
    setShowValue(true);
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
      await onSave(
        cleanKey,
        value,
        enableRotation ? rotationInterval : null,
        enableRotation ? rotationStrategy : null,
        enableRotation ? (rotationStrategy === 'generate_uuid' || rotationStrategy === 'manual_update' ? null : rotationKeyLength) : null
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to encrypt and store secret.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExisting = !initialSecret && existingKeys.includes(keyName.trim().toUpperCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#111624] p-6 shadow-2xl my-8">
        <button
          onClick={onClose}
          type="button"
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
              <div className="flex items-center space-x-2">
                {enableRotation && rotationStrategy !== 'manual_update' && (
                  <button
                    type="button"
                    onClick={handleGenerateValue}
                    className="flex items-center space-x-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors mr-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Generate Secure Value</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowValue(!showValue)}
                  className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showValue ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Reveal</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter plaintext secret value or paste multiline key..."
                style={!showValue ? ({ WebkitTextSecurity: 'disc' } as any) : {}}
                className="w-full rounded-xl border border-white/[0.1] bg-black/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
              />
            </div>
          </div>

          {/* Advanced / Rotation policy section */}
          <div className="border border-white/[0.06] bg-black/15 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-3 flex items-center justify-between text-xs text-slate-300 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center space-x-2 font-medium">
                <Sliders className="h-4 w-4 text-indigo-400" />
                <span>Rotation & Expiry Policy</span>
                {enableRotation && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                    Active
                  </span>
                )}
              </div>
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showAdvanced && (
              <div className="p-4 border-t border-white/[0.06] bg-black/25 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-slate-200 block">Automated Secret Rotation</label>
                    <span className="text-[10px] text-slate-400 block">Enforce automated token rotation intervals</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableRotation(!enableRotation)}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors relative focus:outline-none ${
                      enableRotation ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 bg-white rounded-full transition-transform shadow-md ${
                        enableRotation ? 'translate-x-4.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {enableRotation && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-150">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-300">Rotation Interval</label>
                        <select
                          value={rotationInterval}
                          onChange={(e) => setRotationInterval(Number(e.target.value))}
                          className="w-full rounded-lg bg-black/60 border border-white/[0.08] p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value={7}>Every 7 Days</option>
                          <option value={14}>Every 14 Days</option>
                          <option value={30}>Every 30 Days</option>
                          <option value={60}>Every 60 Days</option>
                          <option value={90}>Every 90 Days</option>
                          <option value={180}>Every 180 Days</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-300">Rotation Method</label>
                        <select
                          value={rotationStrategy}
                          onChange={(e) => setRotationStrategy(e.target.value as any)}
                          className="w-full rounded-lg bg-black/60 border border-white/[0.08] p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="manual_update">Manual Alert Warning</option>
                          <option value="generate_alphanumeric">Auto-Gen Alphanumeric</option>
                          <option value="generate_hex">Auto-Gen Hex String</option>
                          <option value="generate_uuid">Auto-Gen UUIDv4</option>
                        </select>
                      </div>
                    </div>

                    {rotationStrategy !== 'manual_update' && rotationStrategy !== 'generate_uuid' && (
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-300">Generated Token Length</label>
                        <div className="flex rounded-lg bg-black/40 p-0.5 border border-white/[0.06] justify-around text-xs">
                          {[16, 24, 32, 64].map((len) => (
                            <button
                              key={len}
                              type="button"
                              onClick={() => setRotationKeyLength(len)}
                              className={`flex-1 py-1 text-center rounded-md font-mono ${
                                rotationKeyLength === len
                                  ? 'bg-slate-700 text-white font-semibold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {len} ch
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 bg-black/20 p-2 rounded-lg leading-relaxed flex items-center gap-1.5 border border-white/[0.03]">
                      <Calendar className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span>
                        Next automatic rotation check scheduled on:{' '}
                        <strong className="text-cyan-300">
                          {new Date(Date.now() + rotationInterval * 86400000).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
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
