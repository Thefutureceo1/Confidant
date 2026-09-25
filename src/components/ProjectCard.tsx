import React from 'react';
import {
  Folder,
  Layers,
  Clock,
  ArrowRight,
  MoreVertical,
  Trash2,
  GitCompare,
  Shield,
} from 'lucide-react';
import { Project, Environment } from '../types';
import { db } from '../lib/storage';
import { useAuth } from '../context/AuthContext';

interface ProjectCardProps {
  project: Project;
  environments: Environment[];
  onSelectProject: (project: Project) => void;
  onSelectEnvironment: (project: Project, env: Environment) => void;
  onDiffEnvironments: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  environments,
  onSelectProject,
  onSelectEnvironment,
  onDiffEnvironments,
  onDeleteProject,
}) => {
  const { userRole } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const formattedDate = new Date(project.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  const totalSecrets = environments.reduce(
    (acc, env) => acc + db.getSecrets(env.id).length,
    0
  );

  return (
    <div className="glass-card rounded-2xl p-5 hover:border-white/[0.16] transition-all group relative flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 group-hover:scale-105 transition-transform">
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <button
                onClick={() => onSelectProject(project)}
                className="text-left font-semibold text-white hover:text-indigo-300 transition-colors text-sm line-clamp-1"
              >
                {project.name}
              </button>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                <Clock className="h-3 w-3 text-slate-500" />
                <span>Updated {formattedDate}</span>
                <span>•</span>
                <span className="font-mono text-cyan-300">{totalSecrets} encrypted vars</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-44 rounded-xl border border-white/[0.1] bg-[#121724] p-1.5 shadow-2xl z-20"
                onClick={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => onDiffEnvironments(project)}
                  className="w-full flex items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.05]"
                >
                  <GitCompare className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Compare Envs</span>
                </button>

                {userRole === 'admin' ? (
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete project "${project.name}" and all its encrypted secrets?`)) {
                        onDeleteProject(project.id);
                      }
                    }}
                    className="w-full flex items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Project</span>
                  </button>
                ) : (
                  <div className="px-2.5 py-1 text-[10px] text-slate-500 italic">
                    Admin role required to delete
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs text-slate-400 line-clamp-2 min-h-[32px] leading-relaxed">
          {project.description || 'No description provided.'}
        </p>

        {/* Environments chips */}
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center justify-between">
            <span>Environments ({environments.length})</span>
            <button
              onClick={() => onDiffEnvironments(project)}
              className="text-[10px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
            >
              <GitCompare className="h-3 w-3" /> Compare
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {environments.map((env) => {
              const count = db.getSecrets(env.id).length;
              return (
                <button
                  key={env.id}
                  onClick={() => onSelectEnvironment(project, env)}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-indigo-600/20 hover:border-indigo-500/40 border border-white/[0.08] text-xs transition-colors"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    env.name === 'production' ? 'bg-rose-400' : env.name === 'staging' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <span className="font-mono text-slate-300 text-[11px] capitalize">{env.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-black/40 px-1 rounded">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer link */}
      <div className="mt-4 pt-3 flex items-center justify-between text-xs">
        <button
          onClick={() => onSelectProject(project)}
          className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Manage Vault</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
