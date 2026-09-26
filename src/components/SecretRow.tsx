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
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { DecryptedSecret } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

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
  const { saveSecret } = useWorkspace();
  const [localShow, setLocalShow] = useState(false);
  const [copiedValue, setCopiedValue] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const isVisible = globalShowAll || localShow;

  const isOverdue = secret.rotation_interval_days && secret.next_rotation_due
    ? new Date().getTime() > new Date(secret.next_rotation_due).getTime()
    : false;

  const handleRotateNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!secret.rotation_interval_days || isRotating) return;
    setIsRotating(true);
    try {
      let newValue = '';
      const strategy = secret.rotation_strategy || 'manual_update';
      const keyLength = secret.rotation_key_length || 32;

      if (strategy === 'manual_update') {
        onEdit(secret);
        setIsRotating(false);
        return;
      }

      if (strategy === 'generate_uuid') {
        newValue = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (window.crypto.getRandomValues(new Uint8Array(1))[0]) % 16;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      } else {
        const hexChars = '0123456789abcdef';
        const alphaChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
        const chars = strategy === 'generate_hex' ? hexChars : alphaChars;
        const arr = new Uint8Array(keyLength);
        window.crypto.getRandomValues(arr);
        newValue = Array.from(arr).map(b => chars[b % chars.length]).join('');
      }

      await saveSecret(
        secret.environment_id,
        secret.key,
        newValue,
        secret.rotation_interval_days,
        secret.rotation_strategy,
        secret.rotation_key_length,
        new Date().toISOString(), // lastRotatedAt
        new Date(Date.now() + secret.rotation_interval_days * 86400000).toISOString() // nextRotationDue
      );
    } catch (err: any) {
      alert(`Rotation Failed: ${err.message || 'Error occurred during cryptographic rotation.'}`);
    } finally {
      setIsRotating(false);
    }
  };

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

        {secret.rotation_interval_days && (
          <div className="text-[10px] text-slate-400 mt-1.5 flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-[9px] uppercase font-bold text-slate-500 font-sans tracking-wide">Rotates:</span>
            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono text-[9px] border border-white/[0.04]">
              {secret.rotation_interval_days}d ({secret.rotation_strategy?.replace('generate_', '')})
            </span>
            {isOverdue ? (
              <span className="text-amber-400 font-semibold animate-pulse flex items-center space-x-0.5">
                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                <span>Rotation Overdue</span>
              </span>
            ) : (
              <span className="text-slate-500 text-[9px]">
                Due: {new Date(secret.next_rotation_due!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
            
            {/* Quick Rotate button */}
            {isKeyUnlocked && (
              <button
                onClick={handleRotateNow}
                disabled={isRotating}
                className="text-indigo-400 hover:text-indigo-300 hover:underline text-[9px] font-sans font-medium shrink-0 ml-1 flex items-center space-x-0.5 border-l border-white/[0.1] pl-2"
                title="Trigger instant auto-generation rotation"
              >
                <RefreshCw className={`h-2.5 w-2.5 ${isRotating ? 'animate-spin' : ''}`} />
                <span>{isRotating ? 'Rotating...' : 'Rotate Now'}</span>
              </button>
            )}
          </div>
        )}
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
