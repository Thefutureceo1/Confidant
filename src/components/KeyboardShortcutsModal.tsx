import React from 'react';
import { Keyboard, X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcutGroups = [
    {
      category: 'General & Navigation',
      shortcuts: [
        { keys: [`${modKey}`, 'K'], description: 'Open Global Search & Command Palette' },
        { keys: [`${modKey}`, 'N'], description: 'Create New Project' },
        { keys: [`${modKey}`, 'I'], description: 'Import .env file' },
        { keys: ['?'], description: 'Show keyboard shortcuts guide' },
        { keys: ['Esc'], description: 'Close active modal or dismiss search' },
      ],
    },
    {
      category: 'Security & Developer Tooling',
      shortcuts: [
        { keys: [`${modKey}`, 'L'], description: 'Lock / Unlock Zero-Knowledge Vault' },
        { keys: [`${modKey}`, 'J'], description: 'Launch Interactive CLI Terminal' },
        { keys: [`${modKey}`, 'S'], description: 'Sync Secrets across Cloud & Hosting Providers' },
        { keys: [`${modKey}`, 'D'], description: 'Go to Projects Dashboard' },
      ],
    },
    {
      category: 'Global Search Navigation',
      shortcuts: [
        { keys: ['↑', '↓'], description: 'Navigate through matching environment variables' },
        { keys: ['Enter'], description: 'Jump to selected secret & environment' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#111624] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Keyboard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Keyboard Shortcuts</h3>
            <p className="text-xs text-slate-400">Fast navigation and developer productivity</p>
          </div>
        </div>

        <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
          {shortcutGroups.map((group) => (
            <div key={group.category} className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {group.category}
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/40 divide-y divide-white/[0.04]">
                {group.shortcuts.map((sc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3.5 py-2.5 text-xs text-slate-300"
                  >
                    <span>{sc.description}</span>
                    <div className="flex items-center space-x-1">
                      {sc.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 rounded-md border border-white/[0.12] bg-white/[0.06] font-mono text-[11px] text-white shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-500">
          <span>Tip: Press <kbd className="font-mono text-slate-400">?</kbd> anywhere to view this cheat sheet</span>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.08]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
