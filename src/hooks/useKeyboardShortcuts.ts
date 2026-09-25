import { useEffect } from 'react';

interface ShortcutHandlers {
  onOpenSearch?: () => void;
  onOpenNewProject?: () => void;
  onOpenImportEnv?: () => void;
  onOpenMasterKey?: () => void;
  onOpenCli?: () => void;
  onOpenCloudSync?: () => void;
  onOpenShortcutsHelp?: () => void;
  onCloseModals?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;

      const isModifier = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K -> Global Search
      if (isModifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlers.onOpenSearch?.();
        return;
      }

      // Cmd/Ctrl + N -> Create New Project
      if (isModifier && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handlers.onOpenNewProject?.();
        return;
      }

      // Cmd/Ctrl + I -> Import .env
      if (isModifier && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handlers.onOpenImportEnv?.();
        return;
      }

      // Cmd/Ctrl + L -> Lock / Master Key
      if (isModifier && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handlers.onOpenMasterKey?.();
        return;
      }

      // Cmd/Ctrl + J -> CLI Sandbox
      if (isModifier && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        handlers.onOpenCli?.();
        return;
      }

      // Cmd/Ctrl + S -> Cloud Providers Sync (prevent browser save page!)
      if (isModifier && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handlers.onOpenCloudSync?.();
        return;
      }

      // '?' -> Shortcuts Guide (when not typing in an input)
      if (!isInput && e.key === '?') {
        e.preventDefault();
        handlers.onOpenShortcutsHelp?.();
        return;
      }

      // Escape -> Close open modal
      if (e.key === 'Escape') {
        handlers.onCloseModals?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
