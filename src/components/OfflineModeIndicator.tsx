import React, { useState, useEffect } from 'react';
import { WifiOff, ShieldAlert, Cpu } from 'lucide-react';

export const OfflineModeIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return (
      <div className="hidden sm:flex items-center space-x-1 text-[10px] text-slate-500 font-mono select-none" title="All operations are processed fully on your device (Offline-First)">
        <Cpu className="h-3.5 w-3.5 text-slate-600" />
        <span className="opacity-75">Offline-First Engine</span>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center space-x-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 text-[10px] font-mono select-none animate-pulse"
      title="Disconnected from external internet. Confidant is running in fully secure, local Air-Gapped Sandbox mode."
    >
      <WifiOff className="h-3 w-3 text-indigo-400 shrink-0" />
      <span className="font-semibold uppercase tracking-wide">Air-Gapped Local</span>
    </div>
  );
};
