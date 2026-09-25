import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Shield,
  ExternalLink,
  Layers,
  Terminal,
  Zap,
  Globe,
  Github,
  Server,
} from 'lucide-react';
import { Project, Environment, DecryptedSecret } from '../types';
import { CloudProviderId, CloudProviderInfo, SyncLogItem } from '../types/cloudSync';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { db } from '../lib/storage';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProject?: Project | null;
  initialEnvironment?: Environment | null;
}

const PROVIDERS: CloudProviderInfo[] = [
  {
    id: 'vercel',
    name: 'Vercel',
    tagline: 'Sync environment variables directly to Vercel Deployments',
    color: '#ffffff',
    badgeBg: 'bg-white/10 text-white border-white/20',
    iconName: 'triangle',
    fields: [
      { key: 'token', label: 'Vercel Access Token', placeholder: 'vca_xxxxxxxxxxxx', type: 'password', required: true },
      { key: 'projectId', label: 'Vercel Project ID or Name', placeholder: 'prj_ecommerce_prod', type: 'text', required: true },
      { key: 'targetEnv', label: 'Target Scope', placeholder: 'production', type: 'text', required: true, helper: 'production, preview, or development' },
    ],
  },
  {
    id: 'aws',
    name: 'AWS Secrets Manager',
    tagline: 'Store secrets in AWS KMS-encrypted Secrets Manager / SSM',
    color: '#ff9900',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    iconName: 'aws',
    fields: [
      { key: 'token', label: 'AWS Access Key / Secret Token', placeholder: 'AKIATOKENEXAMPLE...', type: 'password', required: true },
      { key: 'region', label: 'AWS Region', placeholder: 'us-east-1', type: 'text', required: true },
      { key: 'secretName', label: 'Secret Name / Path', placeholder: '/production/ecommerce-api/secrets', type: 'text', required: true },
    ],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Workers & Pages',
    tagline: 'Inject secrets into Edge Workers and Pages variables',
    color: '#f38020',
    badgeBg: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    iconName: 'cloudflare',
    fields: [
      { key: 'token', label: 'Cloudflare API Token', placeholder: 'cf_api_xxxxxxxx', type: 'password', required: true },
      { key: 'accountId', label: 'Account ID', placeholder: 'd41d8cd98f00b204e9800998ecf8427e', type: 'text', required: true },
      { key: 'scriptName', label: 'Worker Script / Pages App', placeholder: 'ecommerce-worker-prod', type: 'text', required: true },
    ],
  },
  {
    id: 'github',
    name: 'GitHub Actions Secrets',
    tagline: 'Sync encrypted repository & environment secrets for CI/CD',
    color: '#a371f7',
    badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    iconName: 'github',
    fields: [
      { key: 'token', label: 'GitHub Personal Access Token (PAT)', placeholder: 'ghp_xxxxxxxxxxxx', type: 'password', required: true },
      { key: 'repoName', label: 'Repository (owner/repo)', placeholder: 'acme-corp/ecommerce-api', type: 'text', required: true },
      { key: 'environment', label: 'Environment Name (Optional)', placeholder: 'production', type: 'text', required: false },
    ],
  },
  {
    id: 'railway',
    name: 'Railway',
    tagline: 'Sync service variables to Railway deployment containers',
    color: '#b347d4',
    badgeBg: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20',
    iconName: 'railway',
    fields: [
      { key: 'token', label: 'Railway API Token', placeholder: 'rw_xxxxxxxxxxxx', type: 'password', required: true },
      { key: 'projectId', label: 'Railway Project ID', placeholder: '48f9-4b89-a309-881a', type: 'text', required: true },
      { key: 'serviceId', label: 'Service Name / ID', placeholder: 'api-gateway', type: 'text', required: true },
    ],
  },
  {
    id: 'fly',
    name: 'Fly.io',
    tagline: 'Set application secrets across global Fly Machines',
    color: '#24185b',
    badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    iconName: 'fly',
    fields: [
      { key: 'token', label: 'Fly.io API Token', placeholder: 'FlyV1 fm_xxxxxxxx', type: 'password', required: true },
      { key: 'appName', label: 'Fly App Name', placeholder: 'acme-ecommerce-api', type: 'text', required: true },
    ],
  },
];

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  initialProject,
  initialEnvironment,
}) => {
  const { currentWorkspace, isKeyUnlocked } = useAuth();
  const { projects, environments, decryptedSecrets } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'sync' | 'webhook' | 'history'>('sync');
  const [selectedProviderId, setSelectedProviderId] = useState<CloudProviderId>('vercel');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProject?.id || projects[0]?.id || ''
  );

  const projectEnvs = environments.filter((e) => e.project_id === selectedProjectId);
  const [selectedEnvId, setSelectedEnvId] = useState<string>(
    initialEnvironment?.id || projectEnvs[0]?.id || ''
  );

  const [providerConfig, setProviderConfig] = useState<Record<string, string>>({
    token: 'vca_demo_secure_token_99182',
    projectId: 'prj_acme_gateway',
    targetEnv: 'production',
  });

  const [overwrite, setOverwrite] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Sync history log
  const [syncHistory, setSyncHistory] = useState<SyncLogItem[]>([
    {
      id: 'syn-1',
      provider: 'vercel',
      project_name: 'Ecommerce API Gateway',
      environment_name: 'production',
      variable_count: 7,
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
      status: 'success',
      details: 'Synced 7 environment variables to Vercel (production scope)',
    },
    {
      id: 'syn-2',
      provider: 'github',
      project_name: 'Ecommerce API Gateway',
      environment_name: 'staging',
      variable_count: 5,
      timestamp: new Date(Date.now() - 26 * 3600000).toISOString(),
      status: 'success',
      details: 'Updated GitHub Actions encrypted secrets for acme-corp/ecommerce-api',
    },
  ]);

  if (!isOpen) return null;

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const currentEnv = environments.find((e) => e.id === selectedEnvId) || projectEnvs[0];
  const currentProvider = PROVIDERS.find((p) => p.id === selectedProviderId) || PROVIDERS[0];

  // Secrets for chosen environment
  const targetSecrets = currentEnv ? db.getSecrets(currentEnv.id) : [];

  const handleProviderSelect = (pId: CloudProviderId) => {
    setSelectedProviderId(pId);
    setSyncSuccess(null);
    setSyncError(null);

    // Set demo credentials based on provider
    if (pId === 'vercel') {
      setProviderConfig({ token: 'vca_demo_9824_active', projectId: 'prj_ecommerce_prod', targetEnv: 'production' });
    } else if (pId === 'aws') {
      setProviderConfig({ token: 'AKIADEMOTOKEN9924...', region: 'us-east-1', secretName: '/production/ecommerce-api' });
    } else if (pId === 'cloudflare') {
      setProviderConfig({ token: 'cf_demo_token_3389', accountId: 'd41d8cd98f00b204e9800998ecf8427e', scriptName: 'ecommerce-api-worker' });
    } else if (pId === 'github') {
      setProviderConfig({ token: 'ghp_live_pat_token_demo', repoName: 'acme-corp/ecommerce-api', environment: 'production' });
    } else if (pId === 'railway') {
      setProviderConfig({ token: 'rw_demo_token_882', projectId: 'proj_railway_992', serviceId: 'api-service' });
    } else if (pId === 'fly') {
      setProviderConfig({ token: 'FlyV1_demo_token_771', appName: 'acme-ecommerce-api' });
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setProviderConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleExecuteSync = async () => {
    if (!isKeyUnlocked) {
      setSyncError('Zero-Knowledge vault is locked. Unlock before syncing secrets to cloud providers.');
      return;
    }

    if (targetSecrets.length === 0) {
      setSyncError(`No secrets found in ${currentProject?.name} (${currentEnv?.name}) to sync.`);
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(null);

    try {
      setSyncStep('Authenticating provider API token...');
      await new Promise((r) => setTimeout(r, 600));

      setSyncStep(`Decrypting ${targetSecrets.length} secrets locally via AES-256-GCM...`);
      await new Promise((r) => setTimeout(r, 700));

      setSyncStep(`Transforming schema for ${currentProvider.name}...`);
      await new Promise((r) => setTimeout(r, 600));

      setSyncStep(`Dispatching secrets to ${currentProvider.name} API...`);
      await new Promise((r) => setTimeout(r, 800));

      const newLog: SyncLogItem = {
        id: 'syn-' + Math.random().toString(36).substring(2, 9),
        provider: selectedProviderId,
        project_name: currentProject?.name || 'Project',
        environment_name: currentEnv?.name || 'production',
        variable_count: targetSecrets.length,
        timestamp: new Date().toISOString(),
        status: 'success',
        details: `Successfully synced ${targetSecrets.length} variables to ${currentProvider.name}`,
      };

      setSyncHistory((prev) => [newLog, ...prev]);

      // Record in workspace audit log
      db.addAuditLog({
        workspace_id: currentWorkspace?.id || '',
        user_id: 'user-active',
        user_email: 'developer@confidant.dev',
        action: 'created',
        resource_type: 'secret',
        resource_id: newLog.id,
        metadata: {
          details: `Synced ${targetSecrets.length} secrets to ${currentProvider.name} (${currentEnv?.name})`,
        },
      });

      setSyncSuccess(`Successfully pushed ${targetSecrets.length} environment variables to ${currentProvider.name}!`);
    } catch (e: any) {
      setSyncError(e.message || 'Sync operation failed.');
    } finally {
      setIsSyncing(false);
      setSyncStep(null);
    }
  };

  const webhookUrl = `https://api.confidant.dev/v1/workspaces/${currentWorkspace?.id || 'ws'}/sync/webhook?provider=${selectedProviderId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/[0.12] bg-[#0c101a] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#111624]">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 shadow-md">
              <Cloud className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Cloud & Hosting Providers Sync</h3>
              <p className="text-[11px] text-slate-400">
                1-click push and automated sync of environment variables to your deployment targets
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center rounded-lg bg-black/40 p-1 border border-white/[0.06]">
              <button
                onClick={() => setActiveTab('sync')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'sync' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Push to Cloud
              </button>
              <button
                onClick={() => setActiveTab('webhook')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'webhook' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                CI/CD Webhook
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sync History
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

        {/* Tab 1: Push to Cloud */}
        {activeTab === 'sync' && (
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Step 1: Select Cloud Provider */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                1. Select Target Cloud / Hosting Provider
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PROVIDERS.map((provider) => {
                  const isSelected = provider.id === selectedProviderId;
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => handleProviderSelect(provider.id)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-600/20 shadow-lg shadow-indigo-600/20'
                          : 'border-white/[0.08] bg-black/40 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-white text-xs">{provider.name}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{provider.tagline}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Source Project & Environment */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-black/30 space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2. Select Confidant Source Vault
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      const envs = environments.filter((env) => env.project_id === e.target.value);
                      if (envs.length > 0) setSelectedEnvId(envs[0].id);
                    }}
                    className="w-full rounded-lg bg-[#141a29] border border-white/[0.1] px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Environment</label>
                  <select
                    value={selectedEnvId}
                    onChange={(e) => setSelectedEnvId(e.target.value)}
                    className="w-full rounded-lg bg-[#141a29] border border-white/[0.1] px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    {projectEnvs.map((env) => (
                      <option key={env.id} value={env.id}>
                        {env.name.toUpperCase()} ({db.getSecrets(env.id).length} variables)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1">
                <span>Variables ready to sync: <strong className="text-cyan-300">{targetSecrets.length}</strong></span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Client decrypted & safely transmitted
                </span>
              </div>
            </div>

            {/* Step 3: Provider Credentials & Mapping */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-black/30 space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                3. Configure {currentProvider.name} Credentials
              </label>

              <div className="space-y-3">
                {currentProvider.fields.map((field) => (
                  <div key={field.key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-300 font-medium">
                        {field.label} {field.required && <span className="text-rose-400">*</span>}
                      </label>
                      {field.helper && <span className="text-[10px] text-slate-500 font-mono">{field.helper}</span>}
                    </div>
                    <input
                      type={field.type}
                      value={providerConfig[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-white/[0.1] bg-black/50 px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cloud-overwrite"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="rounded border-white/[0.2] bg-black/50 text-indigo-500 focus:ring-0"
                />
                <label htmlFor="cloud-overwrite" className="text-xs text-slate-300 select-none">
                  Overwrite existing variables on {currentProvider.name} with Confidant values
                </label>
              </div>
            </div>

            {/* Status alerts */}
            {syncStep && (
              <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-xs text-indigo-300 flex items-center space-x-2 animate-pulse">
                <RefreshCw className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
                <span>{syncStep}</span>
              </div>
            )}

            {syncSuccess && (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{syncSuccess}</span>
              </div>
            )}

            {syncError && (
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{syncError}</span>
              </div>
            )}

            {/* Sync Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
              <div className="text-xs text-slate-400">
                Syncing <strong className="text-white">{targetSecrets.length} vars</strong> &rarr;{' '}
                <strong className="text-cyan-300">{currentProvider.name}</strong>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSync}
                  disabled={isSyncing || targetSecrets.length === 0}
                  className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium px-5 py-2 text-xs transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : `Push Secrets to ${currentProvider.name}`}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: CI/CD Webhook & Automation */}
        {activeTab === 'webhook' && (
          <div className="p-6 overflow-y-auto space-y-5 text-xs">
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Continuous Cloud Sync Webhook</h4>
              <p className="text-slate-400 leading-relaxed mb-3">
                Trigger an automated synchronization directly from your CI/CD runner or whenever environment variables are updated in Confidant.
              </p>

              <div className="rounded-xl border border-white/[0.1] bg-black/60 p-3.5 flex items-center justify-between gap-3">
                <code className="font-mono text-[11px] text-cyan-300 truncate">
                  POST {webhookUrl}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 text-xs font-medium flex items-center gap-1 shrink-0"
                >
                  {copiedWebhook ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="font-semibold text-white">GitHub Actions Auto-Sync Workflow</h5>
              <pre className="rounded-xl border border-white/[0.08] bg-black/60 p-3.5 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`# .github/workflows/sync-secrets.yml
name: Sync Confidant Secrets to Cloud
on:
  push:
    branches: [main]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Confidant Cloud Sync
        run: |
          curl -X POST "${webhookUrl}" \\
            -H "Authorization: Bearer \${{ secrets.CONFIDANT_API_KEY }}"`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Sync History */}
        {activeTab === 'history' && (
          <div className="p-6 overflow-y-auto space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-semibold text-white">Recent Cloud Sync Events</span>
              <span>{syncHistory.length} recorded events</span>
            </div>

            <div className="divide-y divide-white/[0.06] border border-white/[0.08] rounded-xl overflow-hidden bg-black/30">
              {syncHistory.map((log) => {
                const dateStr = new Date(log.timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-white/[0.02]">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase text-xs">
                        {log.provider.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span className="capitalize">{log.provider}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400">
                            {log.project_name} ({log.environment_name})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{log.details}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center space-x-1 text-emerald-400 font-mono text-[11px]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Success</span>
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">{dateStr}</div>
                    </div>
                  </div>
                );
              })}

              {syncHistory.length === 0 && (
                <div className="p-6 text-center text-slate-500 italic">
                  No sync events recorded yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
