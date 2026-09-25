import React, { useState } from 'react';
import {
  Folder,
  Layers,
  Plus,
  GitCompare,
  ArrowRight,
  Clock,
  KeyRound,
  Terminal,
  Trash2,
  Edit2,
  ChevronLeft,
} from 'lucide-react';
import { Project, Environment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { db } from '../lib/storage';

interface ProjectDetailPageProps {
  project: Project;
  onBack: () => void;
  onSelectEnvironment: (project: Project, env: Environment) => void;
  onOpenCreateEnvironment: () => void;
  onDiffEnvironments: (project: Project) => void;
  onOpenCli: () => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  project,
  onBack,
  onSelectEnvironment,
  onOpenCreateEnvironment,
  onDiffEnvironments,
  onOpenCli,
}) => {
  const { userRole } = useAuth();
  const { environments, deleteEnvironment, deleteProject } = useWorkspace();
  const [isEditing, setIsEditing] = useState(false);

  const projectEnvs = environments.filter((e) => e.project_id === project.id);

  const totalProjectSecrets = projectEnvs.reduce(
    (acc, env) => acc + db.getSecrets(env.id).length,
    0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back button and breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-slate-400">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>All Projects</span>
        </button>
        <span>/</span>
        <span className="text-white font-medium">{project.name}</span>
      </div>

      {/* Project Header Box */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0e1322]/80 p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Folder className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{project.name}</h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                {project.description || 'No description provided for this project.'}
              </p>
              <div className="mt-3 flex items-center space-x-4 text-[11px] text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="font-mono text-cyan-300 font-medium">{totalProjectSecrets} encrypted keys</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onDiffEnvironments(project)}
              className="flex items-center space-x-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2 text-xs font-medium text-slate-200 transition-colors"
            >
              <GitCompare className="h-3.5 w-3.5 text-indigo-400" />
              <span>Compare Envs</span>
            </button>

            <button
              onClick={onOpenCli}
              className="flex items-center space-x-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2 text-xs font-medium text-slate-200 transition-colors"
            >
              <Terminal className="h-3.5 w-3.5 text-cyan-400" />
              <span>CLI Pull</span>
            </button>

            <button
              onClick={onOpenCreateEnvironment}
              className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 text-xs font-medium transition-all shadow-lg shadow-indigo-600/30"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Environment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Environments Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Environments ({projectEnvs.length})</h2>
          </div>
          <span className="text-xs text-slate-500">
            Select an environment to view and edit secrets
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projectEnvs.map((env) => {
            const count = db.getSecrets(env.id).length;
            const updatedTime = new Date(env.updated_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={env.id}
                className="glass-card rounded-2xl p-5 hover:border-white/[0.16] transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          env.name === 'production'
                            ? 'bg-rose-400 shadow-sm shadow-rose-400/50'
                            : env.name === 'staging'
                            ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                            : 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                        }`}
                      />
                      <span className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                        {env.name}
                      </span>
                    </div>

                    {userRole === 'admin' && projectEnvs.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete environment "${env.name}" and all its encrypted secrets?`)) {
                            deleteEnvironment(env.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-rose-400 transition-opacity"
                        title="Delete environment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-bold font-mono text-cyan-300">{count}</div>
                      <div className="text-[11px] text-slate-400">Environment Variables</div>
                    </div>
                  </div>

                  <div className="mt-4 text-[11px] text-slate-500 font-mono">
                    Last updated: {updatedTime}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <button
                    onClick={() => onSelectEnvironment(project, env)}
                    className="w-full flex items-center justify-between text-xs font-medium text-indigo-400 hover:text-indigo-300 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Open Secret Vault</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
