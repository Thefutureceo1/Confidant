import React, { useState } from 'react';
import { GitCompare, ArrowRight, CheckCircle2, AlertTriangle, X, Copy, Plus } from 'lucide-react';
import { Project, Environment, DecryptedSecret } from '../types';
import { db } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

interface DiffEnvModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const DiffEnvModal: React.FC<DiffEnvModalProps> = ({ isOpen, onClose, project }) => {
  const { environments, saveSecret } = useWorkspace();
  const { isKeyUnlocked } = useAuth();

  const projectEnvs = environments.filter((e) => e.project_id === project.id);
  const [sourceEnvId, setSourceEnvId] = useState<string>(projectEnvs[0]?.id || '');
  const [targetEnvId, setTargetEnvId] = useState<string>(projectEnvs[1]?.id || projectEnvs[0]?.id || '');
  const [syncingKey, setSyncingKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const sourceEnv = projectEnvs.find((e) => e.id === sourceEnvId) || projectEnvs[0];
  const targetEnv = projectEnvs.find((e) => e.id === targetEnvId) || projectEnvs[1];

  const sourceSecrets = sourceEnv ? db.getSecrets(sourceEnv.id) : [];
  const targetSecrets = targetEnv ? db.getSecrets(targetEnv.id) : [];

  const sourceKeySet = new Set(sourceSecrets.map((s) => s.key));
  const targetKeySet = new Set(targetSecrets.map((s) => s.key));

  const allKeys = Array.from(new Set([...sourceSecrets.map((s) => s.key), ...targetSecrets.map((s) => s.key)])).sort();

  const missingInTarget = allKeys.filter((k) => sourceKeySet.has(k) && !targetKeySet.has(k));
  const missingInSource = allKeys.filter((k) => !sourceKeySet.has(k) && targetKeySet.has(k));
  const presentInBoth = allKeys.filter((k) => sourceKeySet.has(k) && targetKeySet.has(k));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/[0.12] bg-[#111624] p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <GitCompare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Compare Environments</h3>
            <p className="text-xs text-slate-400">
              Audit missing keys between <span className="text-indigo-300 font-medium">{project.name}</span> environments
            </p>
          </div>
        </div>

        {/* Environment Selectors */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/40 border border-white/[0.08] mb-4">
          <div className="flex-1">
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Source Environment</label>
            <select
              value={sourceEnvId}
              onChange={(e) => setSourceEnvId(e.target.value)}
              className="w-full rounded-lg bg-[#141a29] border border-white/[0.1] px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              {projectEnvs.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name.toUpperCase()} ({db.getSecrets(env.id).length} vars)
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="h-4 w-4 text-slate-500 mt-4 shrink-0" />

          <div className="flex-1">
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Target Environment</label>
            <select
              value={targetEnvId}
              onChange={(e) => setTargetEnvId(e.target.value)}
              className="w-full rounded-lg bg-[#141a29] border border-white/[0.1] px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              {projectEnvs.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name.toUpperCase()} ({db.getSecrets(env.id).length} vars)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
          <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
            <div className="text-emerald-400 font-bold text-base">{presentInBoth.length}</div>
            <div className="text-[11px] text-slate-400">In Both Envs</div>
          </div>
          <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-center">
            <div className="text-rose-400 font-bold text-base">{missingInTarget.length}</div>
            <div className="text-[11px] text-slate-400">Missing in Target</div>
          </div>
          <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center">
            <div className="text-amber-400 font-bold text-base">{missingInSource.length}</div>
            <div className="text-[11px] text-slate-400">Missing in Source</div>
          </div>
        </div>

        {/* Diff Table */}
        <div className="flex-1 overflow-y-auto border border-white/[0.08] rounded-xl bg-black/30">
          <table className="w-full text-xs">
            <thead className="bg-[#141a29] border-b border-white/[0.08] text-slate-400 sticky top-0">
              <tr>
                <th className="py-2.5 px-3 text-left">Variable Key</th>
                <th className="py-2.5 px-3 text-center">{sourceEnv?.name.toUpperCase()}</th>
                <th className="py-2.5 px-3 text-center">{targetEnv?.name.toUpperCase()}</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] font-mono text-[11px]">
              {allKeys.map((key) => {
                const inSource = sourceKeySet.has(key);
                const inTarget = targetKeySet.has(key);

                return (
                  <tr key={key} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-semibold text-white">{key}</td>
                    <td className="py-2 px-3 text-center">
                      {inSource ? (
                        <span className="text-emerald-400 font-sans">✓ Defined</span>
                      ) : (
                        <span className="text-slate-600 font-sans">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {inTarget ? (
                        <span className="text-emerald-400 font-sans">✓ Defined</span>
                      ) : (
                        <span className="text-rose-400 font-sans font-bold">✗ Missing</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-sans">
                      {inSource && !inTarget ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          Missing in {targetEnv?.name}
                        </span>
                      ) : !inSource && inTarget ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Missing in {sourceEnv?.name}
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[10px]">Synced</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {allKeys.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 font-sans italic">
                    No variables defined in either environment yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end pt-3 border-t border-white/[0.08]">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
