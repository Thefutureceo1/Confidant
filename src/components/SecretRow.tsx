import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit2,
  Trash2,
  Shield,
  Clock,
  Code2,
  Lock,
} from 'lucide-react';
import { DecryptedSecret } from '../types';
import { useAuth } from '../context/AuthContext';

interface SecretRowProps {
  secret: DecryptedSecret;
  globalShowAll: boolean;
  onEdit: (secret: DecryptedSecret) => void;
  onDelete: (secretId: string) => void;
  onInspectCiphertext: (secret: DecryptedSecret) => void;
}

export const SecretRow: React.FC<SecretRowProps> = ({
  secret,
  globalShowAll,
  onEdit,
  onDelete,
  onInspectCiphertext,
}) => {
  const { userRole, user, isKeyUnlocked } = useAuth();
  const [localShow, setLocalShow] = useState(false);
  const [copiedValue, setCopiedValue] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const isVisible = globalShowAll || localShow;

  const handleCopyValue = async () => {
    if (!secret.value) return;
    try {
      await navigator.clipboard.writeText(secret.value);
      setCopiedValue(true);
      setTimeout(() => setCopiedValue(false), 1800);
    } catch {
      // fallback
    }
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(secret.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 1800);
    } catch {
      // fallback
    }
  };

  const canDelete = userRole === 'admin' || secret.created_by === user?.id;

  const formattedDate = new Date(secret.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <tr className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors group">
      {/* Key column */}
      <td className="py-3 px-4 text-left">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs font-semibold text-slate-100 tracking-tight">
            {secret.key}
          </span>
          <button
            onClick={handleCopyKey}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-slate-200 transition-opacity"
            title="Copy Key Name"
          >
            {copiedKey ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </td>

      {/* Value column (masked or revealed) */}
      <td className="py-3 px-4 text-left max-w-xs md:max-w-md">
        <div className="flex items-center space-x-2">
          {isKeyUnlocked ? (
            <div className="font-mono text-xs text-slate-300 truncate max-w-[280px] md:max-w-[420px] select-all">
              {isVisible ? (
                <span className="text-cyan-300 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-800/30">
                  {secret.value}
                </span>
              ) : (
                <span className="tracking-widest text-slate-500 select-none">
                  ••••••••••••••••••••
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-xs text-amber-400/80">
              <Lock className="h-3 w-3" />
              <span className="font-mono text-[11px]">Vault locked</span>
            </div>
          )}

          {isKeyUnlocked && (
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={() => setLocalShow(!localShow)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
                title={isVisible ? 'Hide value' : 'Show value'}
              >
                {isVisible ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                onClick={handleCopyValue}
                className={`p-1 rounded transition-colors ${
                  copiedValue
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                }`}
                title="Copy Plaintext Value"
              >
                {copiedValue ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </td>

      {/* Security badge / inspect ciphertext */}
      <td className="py-3 px-4 text-left hidden sm:table-cell">
        <button
          onClick={() => onInspectCiphertext(secret)}
          className="inline-flex items-center space-x-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] px-2 py-0.5 text-[10px] font-mono text-slate-400 hover:text-indigo-300 transition-colors"
          title="Inspect stored Base64 AES-GCM Ciphertext & IV in database"
        >
          <Code2 className="h-3 w-3 text-indigo-400" />
          <span>Ciphertext</span>
        </button>
      </td>

      {/* Updated at */}
      <td className="py-3 px-4 text-left hidden md:table-cell">
        <div className="flex items-center space-x-1 text-[11px] text-slate-400">
          <Clock className="h-3 w-3 text-slate-500" />
          <span>{formattedDate}</span>
        </div>
      </td>

      {/* Action buttons (Edit, Delete) */}
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={() => onEdit(secret)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
            title="Edit secret value"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => {
              if (canDelete) {
                if (window.confirm(`Are you sure you want to delete secret "${secret.key}"?`)) {
                  onDelete(secret.id);
                }
              } else {
                alert('RLS Policy: Only Admins or the creator can delete secrets.');
              }
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              canDelete
                ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title={canDelete ? 'Delete secret' : 'RLS: Members cannot delete secrets'}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
