import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  FileUp,
  Search,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Activity,
  ArrowRight,
  Layers,
  Terminal,
  Lock,
  Unlock,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { Project, Environment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { ProjectCard } from '../components/ProjectCard';
import { db } from '../lib/storage';

interface DashboardPageProps {
  onOpenNewProject: () => void;
  onOpenImportEnv: () => void;
  onOpenCli: () => void;
  onOpenMasterKey: () => void;
  onOpenCloudSync?: () => void;
  onSelectProject: (p: Project) => void;
  onSelectEnvironment: (p: Project, e: Environment) => void;
  onDiffEnvironments: (p: Project) => void;
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenNewProject,
  onOpenImportEnv,
  onOpenCli,
  onOpenMasterKey,
  onOpenCloudSync,
  onSelectProject,
  onSelectEnvironment,
  onDiffEnvironments,
  onNavigate,
}) => {
  const { currentWorkspace, isKeyUnlocked } = useAuth();
  const { projects, environments, auditLogs, deleteProject } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSecrets = db
    .getState()
    .secrets.filter((s) => {
      const env = db.getState().environments.find((e) => e.id === s.environment_id);
      if (!env) return false;
      const proj = projects.find((p) => p.id === env.project_id);
      return !!proj;
    }).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Projects & Environments</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized zero-knowledge secrets vault for <span className="text-indigo-300 font-medium">{currentWorkspace?.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenCloudSync && (
            <button
              onClick={onOpenCloudSync}
              className="flex items-center space-x-1.5 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 hover:from-indigo-500/20 hover:to-cyan-500/20 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors"
              title="Sync secrets with Vercel, AWS, Cloudflare, GitHub (⌘S)"
            >
              <Cloud className="h-3.5 w-3.5 text-cyan-400" />
              <span>Cloud Sync</span>
            </button>
          )}

          <button
            onClick={onOpenImportEnv}
            className="flex items-center space-x-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors"
          >
            <FileUp className="h-3.5 w-3.5 text-cyan-400" />
            <span>Import .env</span>
          </button>

          <button
            onClick={onOpenNewProject}
            className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 text-xs font-medium transition-all shadow-lg shadow-indigo-600/30"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Projects</span>
            <FolderKanban className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{projects.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active microservices</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Encrypted Secrets</span>
            <KeyRound className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">{totalSecrets}</div>
          <div className="text-[11px] text-slate-500 mt-1">AES-256-GCM ciphertext</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Environments</span>
            <Layers className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{environments.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Dev, Staging & Prod</div>
        </div>

        <div
          onClick={onOpenMasterKey}
          className={`glass-card rounded-2xl p-4 border cursor-pointer transition-colors ${
            isKeyUnlocked
              ? 'border-emerald-500/30 hover:border-emerald-500/50'
              : 'border-amber-500/30 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Vault Security</span>
            {isKeyUnlocked ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-amber-400 animate-pulse" />
            )}
          </div>
          <div className={`text-sm font-bold truncate ${isKeyUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isKeyUnlocked ? 'Unlocked (PBKDF2)' : 'Locked Vault'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            {isKeyUnlocked ? 'Session active in memory' : 'Click to unlock'}
          </div>
        </div>
      </div>

      {/* Projects Grid Section with Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name or description..."
              className="w-full rounded-xl border border-white/[0.08] bg-black/40 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="text-xs text-slate-400">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((proj) => {
              const projectEnvs = environments.filter((e) => e.project_id === proj.id);
              return (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  environments={projectEnvs}
                  onSelectProject={onSelectProject}
                  onSelectEnvironment={onSelectEnvironment}
                  onDiffEnvironments={onDiffEnvironments}
                  onDeleteProject={deleteProject}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-12 text-center">
            <FolderKanban className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">No projects found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No projects matching "${searchQuery}". Clear your search query.`
                : 'Get started by creating your first project or importing a .env file.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={onOpenNewProject}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 text-xs font-medium"
              >
                Create Project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity / Audit Feed */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0d111d]/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Recent Activity & Audit Feed</h2>
          </div>
          <button
            onClick={() => onNavigate('audit-log')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>View All Logs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {auditLogs.slice(0, 5).map((log) => {
            const timeAgo = new Date(log.created_at).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                      log.action === 'created'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : log.action === 'updated'
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                        : log.action === 'deleted'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                    }`}
                  >
                    {log.action}
                  </span>
                  <div className="text-slate-300">
                    <span className="font-semibold text-white">{log.user_email.split('@')[0]}</span>{' '}
                    <span>{log.action}</span>{' '}
                    <span className="font-mono text-cyan-300">
                      {log.metadata?.key || log.metadata?.project_name || log.resource_type}
                    </span>
                    {log.metadata?.environment_name && (
                      <span className="text-slate-500"> in ({log.metadata.environment_name})</span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">{timeAgo}</span>
              </div>
            );
          })}

          {auditLogs.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500 italic">
              No audit activities recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
