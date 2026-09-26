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
  ChevronRight,
  FolderOpen
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
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onOpenNewProject,
  onOpenCli,
  onOpenCloudSync,
  onOpenShortcutsHelp,
  collapsed = false,
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
    <aside className={`border-r border-white/[0.06] bg-[#0c0d0e]/70 backdrop-blur-md flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-3 space-y-6 overflow-x-hidden">
        {/* Main Navigation */}
        <div className="space-y-1">
          {!collapsed && (
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Navigation
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl text-xs font-medium transition-all ${
                  collapsed ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-amber-500/10 text-[#e5c158] border border-amber-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#e5c158]' : 'text-slate-500'}`} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Quick Project List */}
        <div className="space-y-2">
          {collapsed ? (
            <div className="flex flex-col items-center space-y-2 border-t border-white/[0.06] pt-4">
              <button
                onClick={onOpenNewProject}
                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all"
                title="Create new project"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
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
          )}

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
            {projects.map((proj) => {
              const isSelected = currentPage === 'project-detail' && selectedProject?.id === proj.id;
              
              if (collapsed) {
                return (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setSelectedProject(proj);
                      onNavigate('project-detail');
                    }}
                    title={proj.name}
                    className={`w-full flex items-center justify-center py-1 rounded-lg transition-colors ${
                      isSelected ? 'text-amber-400 scale-105' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-colors border ${
                      isSelected 
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                        : 'bg-black/40 text-slate-400 border-white/[0.05] hover:border-white/[0.12]'
                    }`}>
                      {proj.name.charAt(0).toUpperCase()}
                    </div>
                  </button>
                );
              }

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

            {!collapsed && projects.length === 0 && (
              <div className="px-3 py-3 text-[11px] text-slate-400 italic">
                No projects yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Status Box & CLI Callout */}
      <div className="p-3 space-y-2.5">
        {collapsed ? (
          <div className="space-y-2.5 flex flex-col items-center">
            <button
              onClick={onOpenCloudSync}
              className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/15 border border-amber-500/20 text-amber-400 hover:scale-105 transition-all"
              title="Sync Cloud Providers"
            >
              <Cloud className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={onOpenCli}
              className="p-2.5 rounded-xl border border-white/[0.08] text-slate-300 hover:bg-white/[0.04] transition-all"
              title="Sync via Confidant CLI"
            >
              <Terminal className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={onOpenShortcutsHelp}
              className="p-2.5 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all"
              title="Keyboard Shortcuts Guide (?)"
            >
              <Keyboard className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onOpenCloudSync}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-[#c5a85c]/10 to-[#d4af37]/15 border border-amber-500/20 hover:border-amber-500/45 py-2 px-3 text-xs font-medium text-slate-200 transition-all shadow-sm"
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
          </>
        )}
      </div>
    </aside>
  );
};
