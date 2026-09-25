import React, { useState } from 'react';
import { Layers, X, Check } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface CreateEnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const CreateEnvironmentModal: React.FC<CreateEnvironmentModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const { createEnvironment, environments } = useWorkspace();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const existingProjectEnvs = environments.filter((e) => e.project_id === projectId).map((e) => e.name.toLowerCase());

  const presets = ['development', 'staging', 'production', 'preview', 'testing', 'qa'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim().toLowerCase();
    if (!clean) {
      setError('Environment name is required');
      return;
    }
    if (existingProjectEnvs.includes(clean)) {
      setError(`Environment "${clean}" already exists for this project.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createEnvironment(projectId, clean);
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create environment');
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Add Environment</h3>
            <p className="text-xs text-slate-400">
              Create a distinct deployment tier for environment variables
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Environment Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''));
                if (error) setError(null);
              }}
              placeholder="e.g. preview, test, qa, custom"
              className="w-full rounded-xl border border-white/[0.1] bg-black/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
              Or pick standard preset:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => {
                const disabled = existingProjectEnvs.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    disabled={disabled}
                    onClick={() => setName(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                      name === p
                        ? 'bg-indigo-600 text-white border border-indigo-500'
                        : disabled
                        ? 'bg-white/[0.02] text-slate-600 border border-white/[0.04] cursor-not-allowed line-through'
                        : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.08]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
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
              <span>{isSubmitting ? 'Creating...' : 'Add Environment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
