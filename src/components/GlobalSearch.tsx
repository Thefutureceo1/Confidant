import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  KeyRound,
  Folder,
  Layers,
  ArrowRight,
  Copy,
  Check,
  X,
  Command,
  CornerDownLeft,
  Lock,
} from 'lucide-react';
import { Project, Environment, Secret } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { db } from '../lib/storage';
import { decrypt } from '../lib/encryption';

interface SearchResultItem {
  secret: Secret;
  project: Project;
  environment: Environment;
  decryptedValue?: string;
}

interface GlobalSearchProps {
  onSelectEnvironment: (project: Project, env: Environment) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onSelectEnvironment }) => {
  const { currentWorkspace, encryptionKey, isKeyUnlocked } = useAuth();
  const { projects, environments } = useWorkspace();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterEnv, setFilterEnv] = useState<'all' | 'development' | 'staging' | 'production'>('all');
  const [decryptedValues, setDecryptedValues] = useState<Record<string, string>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcut: ⌘K or Ctrl+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Collect all secrets in the current workspace
  const workspaceSecrets = useMemo(() => {
    if (!currentWorkspace) return [];
    const wsProjectIds = new Set(projects.map((p) => p.id));
    const wsEnvs = environments.filter((e) => wsProjectIds.has(e.project_id));
    const envMap = new Map(wsEnvs.map((e) => [e.id, e]));
    const projectMap = new Map(projects.map((p) => [p.id, p]));

    const allSecrets = db.getState().secrets;
    const items: SearchResultItem[] = [];

    for (const sec of allSecrets) {
      const env = envMap.get(sec.environment_id);
      if (!env) continue;
      const proj = projectMap.get(env.project_id);
      if (!proj) continue;

      items.push({
        secret: sec,
        project: proj,
        environment: env,
      });
    }

    return items;
  }, [currentWorkspace, projects, environments]);

  // Filter items based on query & environment
  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.trim().toLowerCase();

    return workspaceSecrets.filter((item) => {
      // Filter by environment tab
      if (filterEnv !== 'all' && item.environment.name.toLowerCase() !== filterEnv) {
        return false;
      }

      const matchKey = item.secret.key.toLowerCase().includes(q);
      const matchProject = item.project.name.toLowerCase().includes(q);
      const matchEnv = item.environment.name.toLowerCase().includes(q);

      return matchKey || matchProject || matchEnv;
    });
  }, [query, workspaceSecrets, filterEnv]);

  // Decrypt visible search results if vault is unlocked
  useEffect(() => {
    let isCancelled = false;

    async function decryptMatches() {
      if (!isKeyUnlocked || !encryptionKey || filteredResults.length === 0) {
        return;
      }

      const newValues: Record<string, string> = {};
      // Decrypt top 12 matches
      const targetSlice = filteredResults.slice(0, 12);

      for (const item of targetSlice) {
        if (decryptedValues[item.secret.id]) continue;
        try {
          const val = await decrypt(item.secret.encrypted_value, item.secret.iv, encryptionKey);
          newValues[item.secret.id] = val;
        } catch {
          newValues[item.secret.id] = '[Decryption Error]';
        }
      }

      if (!isCancelled && Object.keys(newValues).length > 0) {
        setDecryptedValues((prev) => ({ ...prev, ...newValues }));
      }
    }

    decryptMatches();

    return () => {
      isCancelled = true;
    };
  }, [filteredResults, isKeyUnlocked, encryptionKey]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults.length]);

  const handleSelectResult = (item: SearchResultItem) => {
    onSelectEnvironment(item.project, item.environment);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectResult(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleCopySecretValue = async (
    e: React.MouseEvent,
    secretId: string,
    plainVal?: string
  ) => {
    e.stopPropagation();
    if (!plainVal) return;
    try {
      await navigator.clipboard.writeText(plainVal);
      setCopiedId(secretId);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // fallback
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDownInput}
          placeholder="Search variables across projects..."
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] focus:bg-[#0c101b] pl-9 pr-14 py-1.5 text-xs text-white placeholder-slate-400 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-sans"
        />

        {/* Clear query or Keyboard shortcut badge */}
        <div className="absolute right-2.5 flex items-center space-x-1 pointer-events-none">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="pointer-events-auto p-0.5 text-slate-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center space-x-0.5 rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 w-full sm:min-w-[460px] sm:w-[500px] rounded-2xl border border-white/[0.12] bg-[#0f1422]/95 backdrop-blur-2xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header Filters & Count */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/[0.06] text-[11px] text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span>Filter:</span>
              <div className="flex items-center space-x-1 bg-black/40 p-0.5 rounded-lg border border-white/[0.06]">
                {(['all', 'development', 'staging', 'production'] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setFilterEnv(tier)}
                    className={`px-2 py-0.5 rounded capitalize text-[10px] transition-colors ${
                      filterEnv === tier
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <span className="font-mono text-cyan-300">
              {filteredResults.length} {filteredResults.length === 1 ? 'match' : 'matches'}
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto space-y-1 p-1">
            {filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const decrypted = decryptedValues[item.secret.id];

              return (
                <div
                  key={item.secret.id}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/30'
                      : 'hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div className="flex items-start space-x-3 overflow-hidden">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                      <KeyRound className="h-3.5 w-3.5" />
                    </div>

                    <div className="truncate">
                      {/* Secret Key */}
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-white tracking-tight">
                          {item.secret.key}
                        </span>

                        {/* Environment tag */}
                        <span
                          className={`inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[10px] font-mono capitalize ${
                            item.environment.name === 'production'
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                              : item.environment.name === 'staging'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.environment.name === 'production'
                                ? 'bg-rose-400'
                                : item.environment.name === 'staging'
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                          <span>{item.environment.name}</span>
                        </span>
                      </div>

                      {/* Project Name & Value Preview */}
                      <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400">
                        <span className="truncate max-w-[140px] text-slate-300 font-medium">
                          {item.project.name}
                        </span>
                        <span>•</span>
                        {isKeyUnlocked && decrypted ? (
                          <span className="font-mono text-cyan-300 truncate max-w-[140px]">
                            {decrypted}
                          </span>
                        ) : (
                          <span className="font-mono text-slate-500">••••••••</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions on right */}
                  <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                    {isKeyUnlocked && decrypted && (
                      <button
                        onClick={(e) => handleCopySecretValue(e, item.secret.id, decrypted)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          copiedId === item.secret.id
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white'
                        }`}
                        title="Copy decrypted value"
                      >
                        {copiedId === item.secret.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}

                    <div className="hidden sm:flex items-center space-x-1 text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-1 rounded-md border border-indigo-500/20 font-medium">
                      <span>Jump</span>
                      <CornerDownLeft className="h-2.5 w-2.5" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty State when no query entered */}
            {!query.trim() && (
              <div className="py-6 px-4 text-center">
                <Search className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                <div className="text-xs font-medium text-slate-300">
                  Search across all {workspaceSecrets.length} variables
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Type a key name (e.g. <span className="font-mono text-cyan-300">DATABASE_URL</span>, <span className="font-mono text-cyan-300">STRIPE</span>, <span className="font-mono text-cyan-300">JWT</span>) or project name.
                </p>
              </div>
            )}

            {/* Empty State when query has no matches */}
            {query.trim() && filteredResults.length === 0 && (
              <div className="py-8 text-center">
                <KeyRound className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-300">
                  No variables found for "{query}"
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Try searching for another key name or adjust your environment filter.
                </p>
              </div>
            )}
          </div>

          {/* Footer hints */}
          <div className="px-3 py-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <div className="flex items-center space-x-3">
              <span><kbd className="text-slate-400">↑↓</kbd> navigate</span>
              <span><kbd className="text-slate-400">↵</kbd> select</span>
              <span><kbd className="text-slate-400">esc</kbd> close</span>
            </div>
            {!isKeyUnlocked && (
              <span className="text-amber-400 flex items-center gap-1 font-sans">
                <Lock className="h-2.5 w-2.5" /> Vault locked
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
