import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, X, Lock } from 'lucide-react';
import { DecryptedSecret } from '../types';

interface InspectCiphertextModalProps {
  secret: DecryptedSecret | null;
  onClose: () => void;
}

export const InspectCiphertextModal: React.FC<InspectCiphertextModalProps> = ({
  secret,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!secret) return null;

  const rawDatabasePayload = {
    id: secret.id,
    environment_id: secret.environment_id,
    key: secret.key,
    encrypted_value: secret.encrypted_value, // Base64 AES-256-GCM
    iv: secret.iv,                          // Base64 12-byte IV
    created_by: secret.created_by,
    updated_by: secret.updated_by,
    created_at: secret.created_at,
    updated_at: secret.updated_at,
  };

  const payloadString = JSON.stringify(rawDatabasePayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/[0.12] bg-[#111624] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Zero-Knowledge Database Payload
            </h3>
            <p className="text-xs text-slate-400">
              Variable: <span className="font-mono text-cyan-300">{secret.key}</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 mb-4 text-xs text-emerald-300 leading-relaxed">
          <p>
            <strong>Zero-Knowledge Verification:</strong> This is the exact record stored in Supabase / PostgreSQL. Notice that the secret value is completely encrypted as Base64 ciphertext. Neither Supabase nor network eavesdroppers can decrypt it without your client-side passphrase.
          </p>
        </div>

        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute right-3 top-3 flex items-center space-x-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] px-2.5 py-1 text-xs text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>

          <pre className="max-h-80 overflow-y-auto rounded-xl border border-white/[0.08] bg-black/60 p-4 font-mono text-[11px] text-slate-300 leading-relaxed">
            {payloadString}
          </pre>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/[0.08]">
          <div className="flex items-center space-x-2">
            <Lock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Algorithm: AES-256-GCM</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.08] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
