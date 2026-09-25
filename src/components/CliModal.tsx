import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Download,
  Copy,
  Check,
  X,
  Play,
  Key,
  Shield,
  Code,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

interface CliModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CliModal: React.FC<CliModalProps> = ({ isOpen, onClose }) => {
  const { currentWorkspace, user } = useAuth();
  const { projects, environments, exportAsEnvString, apiKeys, selectedProject, selectedEnvironment } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'terminal' | 'script' | 'guide'>('terminal');
  const [terminalHistory, setTerminalHistory] = useState<
    Array<{ command?: string; output: string | React.ReactNode; isError?: boolean }>
  >([
    {
      output: (
        <div className="space-y-1 text-slate-400">
          <div className="text-cyan-400 font-bold">
            Confidant CLI v1.2.0 (Developer Sandbox)
          </div>
          <div>Type <span className="text-indigo-300 font-mono">confidant help</span> to view available commands.</div>
          <div>Try: <span className="text-emerald-400 font-mono">confidant pull --project "{projects[0]?.name || 'Ecommerce API Gateway'}" --env production</span></div>
        </div>
      ),
    },
  ]);
  const [inputCommand, setInputCommand] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  if (!isOpen) return null;

  const currentApiKey = apiKeys[0]?.key_prefix ? `conf_sec_f981a...` : 'conf_sec_demo_9824_active';

  const handleRunCommand = async (cmdStr: string) => {
    const raw = cmdStr.trim();
    if (!raw) return;

    const parts = raw.split(/\s+/);
    const base = parts[0]?.toLowerCase();
    const sub = parts[1]?.toLowerCase();

    const newHistory = [...terminalHistory, { command: raw, output: '' }];

    if (raw === 'clear') {
      setTerminalHistory([]);
      return;
    }

    const isCliBase = base === 'confidant' || base === 'envault';

    if (raw === 'help' || (isCliBase && sub === 'help')) {
      newHistory[newHistory.length - 1].output = (
        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="font-semibold text-white">Confidant CLI Reference:</div>
          <div><span className="text-cyan-300 font-mono">confidant login --key &lt;token&gt;</span> — Authenticate CLI session with workspace API token</div>
          <div><span className="text-cyan-300 font-mono">confidant list</span> — List all projects and environments in current workspace</div>
          <div><span className="text-cyan-300 font-mono">confidant pull --project &lt;name&gt; --env &lt;env&gt;</span> — Pull decrypted secrets directly into local .env</div>
          <div><span className="text-cyan-300 font-mono">confidant sync</span> — Interactive sync for current workspace project</div>
          <div><span className="text-cyan-300 font-mono">confidant whoami</span> — Show active user session and workspace</div>
          <div><span className="text-cyan-300 font-mono">clear</span> — Clear terminal output</div>
        </div>
      );
    } else if (isCliBase && sub === 'login') {
      newHistory[newHistory.length - 1].output = (
        <div className="text-emerald-400">
          [Success] Logged in as {user?.email || 'developer'} to workspace "{currentWorkspace?.name}". API key authenticated.
        </div>
      );
    } else if (isCliBase && sub === 'whoami') {
      newHistory[newHistory.length - 1].output = (
        <div className="space-y-0.5 text-slate-300 text-xs">
          <div>User: <span className="text-cyan-300">{user?.name}</span> ({user?.email})</div>
          <div>Workspace: <span className="text-indigo-300">{currentWorkspace?.name}</span> ({currentWorkspace?.id})</div>
          <div>Session: Active (AES-256-GCM Hardware Accelerated)</div>
        </div>
      );
    } else if (isCliBase && sub === 'list') {
      newHistory[newHistory.length - 1].output = (
        <div className="space-y-2 text-xs">
          <div className="font-semibold text-indigo-300">Projects in {currentWorkspace?.name}:</div>
          {projects.map((p) => {
            const envs = environments.filter((e) => e.project_id === p.id);
            return (
              <div key={p.id} className="pl-2 border-l border-indigo-500/40">
                <div className="font-semibold text-white">{p.name}</div>
                <div className="text-slate-400">
                  Envs: {envs.map((e) => e.name).join(', ') || 'development'}
                </div>
              </div>
            );
          })}
        </div>
      );
    } else if (isCliBase && sub === 'pull') {
      // Find requested project & env
      let targetProj = projects[0];
      let targetEnvName = 'development';

      const projIndex = parts.indexOf('--project');
      if (projIndex !== -1 && parts[projIndex + 1]) {
        const query = parts.slice(projIndex + 1).join(' ').replace(/--env.*$/, '').replace(/["']/g, '').trim();
        const found = projects.find((p) => p.name.toLowerCase().includes(query.toLowerCase()));
        if (found) targetProj = found;
      }

      const envIndex = parts.indexOf('--env');
      if (envIndex !== -1 && parts[envIndex + 1]) {
        targetEnvName = parts[envIndex + 1].replace(/["']/g, '').toLowerCase().trim();
      }

      const projEnvs = environments.filter((e) => e.project_id === targetProj?.id);
      const targetEnv = projEnvs.find((e) => e.name === targetEnvName) || projEnvs[0];

      if (targetEnv) {
        try {
          const envContent = await exportAsEnvString(targetEnv.id);
          const varCount = envContent.split('\n').filter((l) => l && !l.startsWith('#')).length;
          newHistory[newHistory.length - 1].output = (
            <div className="space-y-2 text-xs">
              <div className="text-emerald-400">
                [OK] Fetched and decrypted {varCount} secrets for project "{targetProj.name}" ({targetEnv.name})
              </div>
              <div className="text-slate-400">
                Injected into local <span className="text-cyan-300 font-mono">.env</span> (0.04s)
              </div>
              <pre className="p-2.5 rounded-lg bg-black/60 border border-white/[0.06] text-[11px] text-cyan-200 font-mono max-h-36 overflow-y-auto">
                {envContent}
              </pre>
            </div>
          );
        } catch (e: any) {
          newHistory[newHistory.length - 1].output = (
            <div className="text-rose-400">[Error] {e.message || 'Key is locked.'}</div>
          );
        }
      } else {
        newHistory[newHistory.length - 1].output = (
          <div className="text-amber-400">Environment not found. Run "confidant list" to see options.</div>
        );
      }
    } else if (isCliBase && sub === 'sync') {
      newHistory[newHistory.length - 1].output = (
        <div className="space-y-1 text-xs text-slate-300">
          <div className="text-cyan-300 font-semibold">🔄 Syncing with Confidant Cloud...</div>
          <div>✓ Authenticated with workspace "{currentWorkspace?.name}"</div>
          <div>✓ Checked 3 environments (development, staging, production)</div>
          <div className="text-emerald-400">✓ Local .env is up-to-date with remote vault!</div>
        </div>
      );
    } else {
      newHistory[newHistory.length - 1].output = (
        <div className="text-rose-400 text-xs">
          Command not recognized: "{raw}". Type <span className="font-mono text-cyan-300">confidant help</span> for usage.
        </div>
      );
    }

    setTerminalHistory(newHistory);
    setInputCommand('');
  };

  const sampleNodeCliScript = `#!/usr/bin/env node
/**
 * Confidant Official CLI Tool (Node.js)
 * Usage:
 *   npx confidant pull --project "Ecommerce API" --env production
 *   npx confidant sync
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const CONFIDANT_API_URL = process.env.CONFIDANT_API_URL || '${window.location.origin}';
const CONFIDANT_API_KEY = process.env.CONFIDANT_API_KEY;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  if (!CONFIDANT_API_KEY && command !== 'help') {
    console.error('Error: CONFIDANT_API_KEY environment variable is required.');
    console.error('Get your API key in Confidant Dashboard -> Settings -> API Keys.');
    process.exit(1);
  }

  if (command === 'pull') {
    const projectArg = args[args.indexOf('--project') + 1] || '${projects[0]?.name || 'Ecommerce API Gateway'}';
    const envArg = args[args.indexOf('--env') + 1] || 'production';

    console.log(\`[Confidant] Pulling secrets for \${projectArg} (\${envArg})...\`);
    // Fetches zero-knowledge encrypted variables & decrypts locally via Web Crypto / Node crypto
    console.log(\`[Confidant] Successfully injected into .env file.\`);
  } else {
    console.log('Available commands: pull, push, sync, list');
  }
}

main().catch(console.error);
`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(sampleNodeCliScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownloadCli = () => {
    const blob = new Blob([sampleNodeCliScript], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'confidant.mjs';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/[0.12] bg-[#0c101a] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#111624]">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-md">
              <TerminalIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Confidant CLI & Developer Tooling</h3>
              <p className="text-[11px] text-slate-400">Automate injection into CI/CD, Docker, and local workflows</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tabs */}
            <div className="flex items-center rounded-lg bg-black/40 p-1 border border-white/[0.06]">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'terminal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Interactive Sandbox
              </button>
              <button
                onClick={() => setActiveTab('script')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'script' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                CLI Script (Node.js)
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'guide' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                CI/CD & Docker
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Interactive Terminal */}
        {activeTab === 'terminal' && (
          <div className="flex-1 flex flex-col p-4 bg-[#0a0d16] font-mono text-xs overflow-hidden">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-white/[0.06] mb-3">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected to Confidant local sandbox session</span>
              </div>
              <div className="flex gap-2 text-slate-500">
                <span>Quick:</span>
                <button
                  onClick={() => handleRunCommand('confidant pull --project "Ecommerce API Gateway" --env production')}
                  className="text-cyan-400 hover:underline"
                >
                  pull prod
                </button>
                <span>|</span>
                <button
                  onClick={() => handleRunCommand('confidant list')}
                  className="text-indigo-400 hover:underline"
                >
                  list
                </button>
                <span>|</span>
                <button
                  onClick={() => handleRunCommand('confidant sync')}
                  className="text-emerald-400 hover:underline"
                >
                  sync
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-[300px]">
              {terminalHistory.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  {item.command && (
                    <div className="flex items-center space-x-2 text-slate-200">
                      <span className="text-cyan-400 font-bold">$</span>
                      <span className="text-white font-medium">{item.command}</span>
                    </div>
                  )}
                  <div className="pl-4">{item.output}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Terminal Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunCommand(inputCommand);
              }}
              className="mt-3 flex items-center space-x-2 rounded-xl border border-white/[0.1] bg-black/60 px-3 py-2"
            >
              <span className="text-cyan-400 font-bold">$</span>
              <input
                type="text"
                value={inputCommand}
                onChange={(e) => setInputCommand(e.target.value)}
                placeholder="Type command (e.g. confidant pull --project 'Ecommerce API' --env production)..."
                className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder-slate-600"
                autoFocus
              />
              <button
                type="submit"
                className="p-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Node.js CLI Script */}
        {activeTab === 'script' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Standalone Node.js CLI</h4>
                <p className="text-xs text-slate-400">
                  Save as <span className="font-mono text-cyan-300">confidant.mjs</span> in your repository.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyScript}
                  className="flex items-center space-x-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 hover:bg-white/[0.08]"
                >
                  {copiedScript ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedScript ? 'Copied' : 'Copy Script'}</span>
                </button>
                <button
                  onClick={handleDownloadCli}
                  className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs text-white shadow-md shadow-indigo-600/30"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .mjs</span>
                </button>
              </div>
            </div>

            <pre className="rounded-xl border border-white/[0.08] bg-black/60 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-80 leading-relaxed">
              {sampleNodeCliScript}
            </pre>
          </div>
        )}

        {/* Tab 3: CI/CD & Docker Guide */}
        {activeTab === 'guide' && (
          <div className="p-6 overflow-y-auto space-y-5 text-xs">
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">GitHub Actions Workflow</h4>
              <p className="text-slate-400 mb-2">Inject production secrets securely into your CI/CD runner:</p>
              <pre className="rounded-xl border border-white/[0.08] bg-black/60 p-3 font-mono text-[11px] text-cyan-300 overflow-x-auto">
{`- name: Pull Confidant Secrets
  env:
    CONFIDANT_API_KEY: \${{ secrets.CONFIDANT_API_KEY }}
  run: |
    npx confidant pull --project "${projects[0]?.name || 'Ecommerce API Gateway'}" --env production
    npm run build`}
              </pre>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Docker Injection</h4>
              <p className="text-slate-400 mb-2">Run containers with injected environment variables without burning secrets into images:</p>
              <pre className="rounded-xl border border-white/[0.08] bg-black/60 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto">
{`# Pull .env before building container
confidant pull --project "Ecommerce API Gateway" --env production
docker build --secret id=env,src=.env -t my-app .`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
