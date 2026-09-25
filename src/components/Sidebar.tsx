import React from 'react';
import {
  FolderKanban,
  History,
  Key,
  Settings,
  User,
  Shield,
  Plus,
  Terminal,
  ExternalLink,
  Lock,
  Cloud,
  Keyboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenNewProject: () => void;
  onOpenCli: () => void;
  onOpenCloudSync: () => void;
  onOpenShortcutsHelp: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onOpenNewProject,
  onOpenCli,
  onOpenCloudSync,
  onOpenShortcutsHelp,
}) => {
  const { currentWorkspace, isKeyUnlocked } = useAuth();
  const { projects, selectedProject, setSelectedProject, setSelectedEnvironment } = useWorkspace();

  const navItems = [
    { id: 'dashboard', label: 'All Projects', icon: FolderKanban },
    { id: 'audit-log', label: 'Audit Logs', icon: History },
    { id: 'cli-keys', label: 'API Keys & CLI', icon: Key },
    { id: 'settings', label: 'Workspace Settings', icon: Settings },
    { id: 'account', label: 'Account Profile', icon: User },
  ];

  return (
    <aside className="w-64 border-r border-white/[0.08] bg-[#0d1019]/70 backdrop-blur-md flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Project List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Projects ({projects.length})
            </span>
            <button
              onClick={onOpenNewProject}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Create new project"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-0.5 max-h-56 overflow-y-auto pr-1">
            {projects.map((proj) => {
              const isSelected = currentPage === 'project-detail' && selectedProject?.id === proj.id;
              return (
                <button
                  key={proj.id}
                  onClick={() => {
                    setSelectedProject(proj);
                    onNavigate('project-detail');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left group ${
                    isSelected
                      ? 'bg-white/[0.08] text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="truncate">{proj.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono group-hover:text-slate-300">
                    &rarr;
                  </span>
                </button>
              );
            })}

            {projects.length === 0 && (
              <div className="px-3 py-3 text-[11px] text-slate-400 italic">
                No projects yet in this workspace.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Status Box & CLI Callout */}
      <div className="p-4 space-y-3">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
            <Shield className="h-3.5 w-3.5 text-indigo-400" />
            <span>Zero-Knowledge Vault</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
            All secrets are encrypted client-side with AES-256-GCM. Plaintext never hits the database.
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-white/[0.06] pt-2 font-mono">
            <span>PBKDF2 SHA-256</span>
            <span className="text-emerald-400">100k rounds</span>
          </div>
        </div>

        <button
          onClick={onOpenCloudSync}
          className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600/30 via-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 hover:border-indigo-500/50 py-2 px-3 text-xs font-medium text-slate-200 transition-all shadow-sm"
        >
          <Cloud className="h-3.5 w-3.5 text-cyan-400" />
          <span>Sync Cloud Providers</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenCli}
            className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] py-1.5 px-2 text-xs font-medium text-slate-300 transition-colors"
          >
            <Terminal className="h-3 w-3 text-cyan-400" />
            <span>CLI</span>
          </button>

          <button
            onClick={onOpenShortcutsHelp}
            className="flex items-center justify-center space-x-1 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] py-1.5 px-2.5 text-xs text-slate-400 hover:text-white transition-colors"
            title="Keyboard Shortcuts Guide (?)"
          >
            <Keyboard className="h-3 w-3" />
            <span className="font-mono text-[10px]">?</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
