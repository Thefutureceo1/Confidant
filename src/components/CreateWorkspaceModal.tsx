import React, { useState } from 'react';
import { Building2, X, Check, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/storage';
import { generateSalt } from '../lib/encryption';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import zxcvbn from 'zxcvbn';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshWorkspaces, switchWorkspace, unlockEncryptionKey } = useAuth();
  const [name, setName] = useState('');
  const [masterPassphrase, setMasterPassphrase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }
    if (!user) return;

    if (masterPassphrase) {
      const evaluation = zxcvbn(masterPassphrase, [name, user.email, user.name]);
      if (evaluation.score < 2) {
        setError('Master passphrase is too weak according to zxcvbn. Please use a stronger key (score 2+).');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const salt = generateSalt();
      const ws = db.createWorkspace(name.trim(), salt, user);
      refreshWorkspaces();
      switchWorkspace(ws.id);

      if (masterPassphrase) {
        await unlockEncryptionKey(masterPassphrase);
      }

      setName('');
      setMasterPassphrase('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.12] bg-[#111624] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Create New Workspace</h3>
            <p className="text-xs text-slate-400">
              Each workspace maintains its own isolated cryptographic salt and team members
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp, Mobile Division, Side Projects"
              className="w-full rounded-xl border border-white/[0.1] bg-black/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Initial Master Encryption Key (Optional)
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Defaults to session passphrase</span>
            </div>
            <input
              type="password"
              value={masterPassphrase}
              onChange={(e) => setMasterPassphrase(e.target.value)}
              placeholder="Enter custom master passphrase or generate below..."
              className="w-full rounded-xl border border-white/[0.1] bg-black/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
            />
            <PasswordStrengthMeter
              password={masterPassphrase}
              userInputs={[name, user?.email || '', user?.name || '']}
              minScore={3}
              onGenerateSecure={(pass) => setMasterPassphrase(pass)}
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 text-xs transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Creating...' : 'Create Workspace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
