import React from 'react';
import { ConfidantLogo } from '../components/ConfidantLogo';
import { Shield, KeyRound, Cloud, RefreshCw, Cpu, Terminal, Sparkles, ArrowRight, Check } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[#0c0d0e] text-slate-100 flex flex-col justify-between selection:bg-amber-500/20 selection:text-amber-200 relative overflow-y-auto">
      
      {/* Background radial gradient ambient glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="container mx-auto max-w-7xl px-6 py-6 flex items-center justify-between border-b border-white/[0.04] relative z-10">
        <div className="flex items-center space-x-3">
          <ConfidantLogo size={32} />
          <div className="flex flex-col text-left">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Confidant
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                v2.4
              </span>
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 bg-white/[0.02] border border-white/[0.05] rounded-full px-3 py-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
          <span>Local Engine Active</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto max-w-7xl px-6 py-12 md:py-20 flex-1 flex flex-col justify-center relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 text-xs text-amber-300 font-semibold uppercase tracking-wider">
              <Shield className="h-3 w-3" />
              <span>Zero-Knowledge Architecture</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.1] max-w-xl">
                Your Secrets. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f3e5ab] via-[#d4af37] to-[#e5c158]">
                  Fully Air-Gapped.
                </span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-lg">
                Confidant is a state-of-the-art client-side environment variable and secret manager. 
                Using browser-native Web Crypto APIs, all keys are derived and decrypted in isolated volatile memory. 
                Plaintext data never leaves your device.
              </p>
            </div>

            {/* Let's Go Call to Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 max-w-md pt-2">
              <button
                onClick={onStart}
                className="group flex items-center justify-center space-x-3 bg-gradient-to-r from-[#d4af37] to-[#e5c158] hover:from-[#e5c158] hover:to-[#f3e5ab] text-[#0c0d0e] font-bold rounded-2xl px-8 py-4 text-base transition-all transform hover:scale-[1.02] shadow-xl shadow-amber-500/10 cursor-pointer"
              >
                <span>Let's go</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 duration-200" />
              </button>
              
              <div className="text-left py-2 px-1">
                <p className="text-xs font-semibold text-slate-300">Ready for Production</p>
                <p className="text-[11px] text-slate-500 mt-0.5">No login or cloud account required to start.</p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/[0.04] max-w-lg">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold font-mono">Encryption</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">AES-256-GCM</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold font-mono">Derivation</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">PBKDF2 SHA256</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold font-mono">Deployability</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">100% Offline</p>
              </div>
            </div>
          </div>

          {/* Right Column: Key Interactive Feature Blocks */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-card rounded-2xl p-6 border border-white/[0.06] bg-[#121315]/80 relative overflow-hidden group hover:border-[#d4af37]/20 transition-all duration-300">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <Shield className="h-24 w-24 text-amber-400" />
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 border border-amber-500/10">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left">
                  <h4 className="text-sm font-bold text-white">Client-Side Encryption Keys</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Derive custom keys using PBKDF2 with 100,000 hashing rounds. Decrypted secrets are kept purely in active React state memory.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-white/[0.06] bg-[#121315]/80 relative overflow-hidden group hover:border-[#d4af37]/20 transition-all duration-300">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <RefreshCw className="h-24 w-24 text-amber-400" />
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 border border-amber-500/10">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left">
                  <h4 className="text-sm font-bold text-white">Automated Secret Rotation</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Establish automated rotation limits from 7 to 180 days. Get notified with status flags before credentials expire.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-white/[0.06] bg-[#121315]/80 relative overflow-hidden group hover:border-[#d4af37]/20 transition-all duration-300">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <Cloud className="h-24 w-24 text-amber-400" />
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 border border-amber-500/10">
                  <Cloud className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left">
                  <h4 className="text-sm font-bold text-white">Cryptographic Webhooks & Cloud Sync</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Trigger outbound webhook broadcasts signed with HMAC-SHA256 headers to securely synchronize secret payloads across target platforms.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-6 relative z-10 bg-black/10">
        <div className="container mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 space-y-3 md:space-y-0">
          <div className="flex items-center space-x-1.5">
            <Cpu className="h-3.5 w-3.5 text-amber-500/50" />
            <span>Air-Gapped Sandbox Local Storage</span>
          </div>
          <div>
            <span>Est. 1923 &bull; Encrypted Confidant Keyvault Engine &bull; MIT Licensed</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
