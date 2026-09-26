import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Terminal,
  Database,
  Users,
  ChevronDown,
  Plus,
  Lock,
  Unlock,
  Check,
  ExternalLink,
  Sparkles,
  Search,
  X,
  Cloud,
  Keyboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS } from '../lib/storage';

import { Project, Environment } from '../types';
import { GlobalSearch } from './GlobalSearch';
import { OfflineModeIndicator } from './OfflineModeIndicator';

interface NavbarProps {
  onOpenCli: () => void;
  onOpenSupabase: () => void;
  onOpenMasterKey: () => void;
  onOpenNewWorkspace: () => void;
  onOpenCloudSync: () => void;
  onOpenShortcutsHelp: () => void;
  onOpenAuthModal?: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  onSelectEnvironment?: (project: Project, env: Environment) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCli,
  onOpenSupabase,
  onOpenMasterKey,
  onOpenNewWorkspace,
  onOpenCloudSync,
  onOpenShortcutsHelp,
  onOpenAuthModal,
  onNavigate,
  currentPage,
  onSelectEnvironment,
}) => {
  const {
    user,
    currentWorkspace,
    workspaces,
    userRole,
    isKeyUnlocked,
    switchWorkspace,
    switchDemoUser,
    lockEncryptionKey,
  } = useAuth();

  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0b0d13]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Workspace Switcher */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-2.5 group focus:outline-none"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-all">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0d1017]">
                <KeyRound className="h-4 w-4 text-cyan-400 transition-transform group-hover:scale-110" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base font-semibold tracking-tight text-white flex items-center gap-1.5">
                Confidant
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Zero-Knowledge
                </span>
              </span>
            </div>
          </button>

          <div className="hidden md:block h-5 w-[1px] bg-white/10" />

          {/* Workspace Dropdown */}
          <div className="relative">
            <button
              onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
              className="flex items-center space-x-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors focus:outline-none"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="max-w-[140px] truncate">{currentWorkspace?.name || 'Select Workspace'}</span>
              <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400 uppercase">
                {userRole}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {wsDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-64 rounded-xl border border-white/[0.1] bg-[#121724] p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100"
                onClick={() => setWsDropdownOpen(false)}
              >
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Workspaces
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => switchWorkspace(ws.id)}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs text-left transition-colors ${
                      ws.id === currentWorkspace?.id
                        ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                        : 'text-slate-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {ws.id === currentWorkspace?.id && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                  </button>
                ))}
                <div className="my-1 border-t border-white/[0.08]" />
                <button
                  onClick={onOpenNewWorkspace}
                  className="w-full flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md mx-3 hidden md:block">
          <GlobalSearch onSelectEnvironment={onSelectEnvironment || (() => {})} />
        </div>

        {/* Center / Right: Encryption status badge & Quick Action tools */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Subtle network connection / air-gap indicator */}
          <OfflineModeIndicator />

          {/* Mobile search toggle button */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition-colors"
            title="Search variables"
          >
            {mobileSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>

          {/* Encryption Key Lock Status Badge */}
          <button
            onClick={onOpenMasterKey}
            className={`flex items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-all ${
              isKeyUnlocked
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
            }`}
            title="Click to view encryption key derivation details or lock vault"
          >
            {isKeyUnlocked ? (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="hidden sm:inline">AES-256 Unlocked</span>
                <span className="sm:hidden">Unlocked</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">Vault Locked</span>
                <span className="sm:hidden">Locked</span>
              </>
            )}
          </button>

          {/* Interactive CLI Terminal button */}
          <button
            onClick={onOpenCli}
            className="flex items-center space-x-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors"
          >
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">CLI Sandbox</span>
          </button>

          {/* Cloud Providers Sync button */}
          <button
            onClick={onOpenCloudSync}
            className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 hover:from-indigo-500/20 hover:to-cyan-500/20 border border-indigo-500/30 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors"
            title="Sync Secrets with Cloud & Hosting Providers (Vercel, AWS, Cloudflare, GitHub) — ⌘S"
          >
            <Cloud className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Cloud Sync</span>
          </button>

          {/* Supabase Schema & Integration button */}
          <button
            onClick={onOpenSupabase}
            className="flex items-center space-x-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors"
          >
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden xl:inline">Supabase SQL</span>
          </button>

          {/* Keyboard Shortcuts Help button */}
          <button
            onClick={onOpenShortcutsHelp}
            className="hidden sm:flex items-center space-x-1 p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
            title="Keyboard shortcuts guide (?)"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>

          {/* Demo User Switcher (For verifying RLS roles: Admin vs Member) */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-2.5 py-1.5 text-xs text-slate-200 transition-colors focus:outline-none"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-[10px] font-bold text-white uppercase">
                {user?.name.slice(0, 1) || 'U'}
              </div>
              <span className="hidden lg:inline text-xs font-medium max-w-[100px] truncate">
                {user?.name}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-72 rounded-xl border border-white/[0.1] bg-[#121724] p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100"
                onClick={() => setUserDropdownOpen(false)}
              >
                <div className="px-2.5 py-2 border-b border-white/[0.08]">
                  <div className="text-xs font-semibold text-white">{user?.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                      Current Role: {userRole}
                    </span>
                  </div>
                </div>

                <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>Switch Role / Test RLS</span>
                </div>

                {DEMO_USERS.map((demoUser) => (
                  <button
                    key={demoUser.id}
                    onClick={() => switchDemoUser(demoUser.id)}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs text-left transition-colors ${
                      demoUser.id === user?.id
                        ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                        : 'text-slate-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-200">{demoUser.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {demoUser.id.includes('admin') ? 'Role: Admin (Full Access)' : 'Role: Member (Read & Update only)'}
                      </div>
                    </div>
                    {demoUser.id === user?.id && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                  </button>
                ))}

                <div className="my-1 border-t border-white/[0.08]" />

                <button
                  onClick={() => onNavigate('account')}
                  className="w-full flex items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.05] transition-colors"
                >
                  <span>Account & Password Settings</span>
                </button>

                {onOpenAuthModal && (
                  <button
                    onClick={onOpenAuthModal}
                    className="w-full flex items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create New Account (Sign Up)</span>
                  </button>
                )}

                {isKeyUnlocked ? (
                  <button
                    onClick={lockEncryptionKey}
                    className="w-full flex items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 hover:bg-amber-500/10 transition-colors"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Lock Encryption Session</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenMasterKey}
                    className="w-full flex items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    <span>Unlock Vault</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Input Drawer */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-white/[0.06] bg-[#0b0d13] animate-in fade-in slide-in-from-top-2">
          <GlobalSearch
            onSelectEnvironment={(p, e) => {
              setMobileSearchOpen(false);
              onSelectEnvironment?.(p, e);
            }}
          />
        </div>
      )}
    </header>
  );
};
