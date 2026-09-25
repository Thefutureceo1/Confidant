import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  FileUp,
  Download,
  Terminal,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  ChevronLeft,
  Shield,
  ShieldAlert,
  Unlock,
  AlertCircle,
  FileCode,
  Cloud,
} from 'lucide-react';
import { Project, Environment, DecryptedSecret } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { SecretRow } from '../components/SecretRow';
import { SecretModal } from '../components/SecretModal';
import { ImportEnvModal } from '../components/ImportEnvModal';
import { InspectCiphertextModal } from '../components/InspectCiphertextModal';

interface EnvironmentDetailPageProps {
  project: Project;
  environment: Environment;
  onBackToProject: () => void;
  onOpenCli: () => void;
  onOpenMasterKey: () => void;
  onOpenCloudSync?: () => void;
}

export const EnvironmentDetailPage: React.FC<EnvironmentDetailPageProps> = ({
  project,
  environment,
  onBackToProject,
  onOpenCli,
  onOpenMasterKey,
  onOpenCloudSync,
}) => {
  const { isKeyUnlocked } = useAuth();
  const {
    secrets,
    decryptedSecrets,
    isLoadingSecrets,
    decryptionError,
    saveSecret,
    deleteSecret,
    bulkImport,
    exportAsEnvString,
  } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [globalShowAll, setGlobalShowAll] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<DecryptedSecret | null>(null);
  const [inspectSecret, setInspectSecret] = useState<DecryptedSecret | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const filteredSecrets = decryptedSecrets.filter((s) =>
    s.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const existingKeys = secrets.map((s) => s.key);

  const handleSaveSecret = async (key: string, value: string) => {
    await saveSecret(environment.id, key, value);
  };

  const handleExportDownload = async () => {
    try {
      const content = await exportAsEnvString(environment.id);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.${environment.name}.env`;
      a.click();
      URL.revokeObjectURL(url);
      setExportNotice('Downloaded .env file');
      setTimeout(() => setExportNotice(null), 2500);
    } catch (e: any) {
      alert(e.message || 'Export failed.');
    }
  };

  const handleCopyAllAsEnv = async () => {
    try {
      const content = await exportAsEnvString(environment.id);
      await navigator.clipboard.writeText(content);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (e: any) {
      alert(e.message || 'Copy failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-slate-400">
        <button
          onClick={onBackToProject}
          className="flex items-center space-x-1 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{project.name}</span>
        </button>
        <span>/</span>
        <span className="font-mono text-cyan-300 font-semibold uppercase">{environment.name}</span>
      </div>

      {/* Main Header Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0e1322]/80 p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span
                className={`h-3 w-3 rounded-full ${
                  environment.name === 'production'
                    ? 'bg-rose-400 shadow-sm shadow-rose-400/50'
                    : environment.name === 'staging'
                    ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                    : 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                }`}
              />
              <h1 className="text-xl font-bold text-white tracking-tight capitalize">
                {environment.name} Environment
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300">
                {secrets.length} variables
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Encrypted secrets for <span className="text-white font-medium">{project.name}</span> ({environment.name})
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2 text-xs font-medium text-slate-200 transition-colors"
            >
              <FileUp className="h-3.5 w-3.5 text-cyan-400" />
              <span>Import .env</span>
            </button>

            <button
              onClick={handleExportDownload}
              className="flex items-center space-x-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2 text-xs font-medium text-slate-200 transition-colors"
              title="Download as .env file"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export .env</span>
            </button>

            <button
              onClick={onOpenCli}
              className="flex items-center space-x-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2 text-xs font-medium text-slate-200 transition-colors"
              title="Sync via Confidant CLI"
            >
              <Terminal className="h-3.5 w-3.5 text-indigo-400" />
              <span>Sync via CLI</span>
            </button>

            {onOpenCloudSync && (
              <button
                onClick={onOpenCloudSync}
                className="flex items-center space-x-1.5 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 hover:from-indigo-500/20 hover:to-cyan-500/20 px-3 py-2 text-xs font-medium text-slate-200 transition-colors"
                title="Sync Secrets with Vercel, AWS, Cloudflare, GitHub (⌘S)"
              >
                <Cloud className="h-3.5 w-3.5 text-cyan-400" />
                <span>Sync to Cloud</span>
              </button>
            )}

            <button
              onClick={() => {
                setEditingSecret(null);
                setModalOpen(true);
              }}
              className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 text-xs font-medium transition-all shadow-lg shadow-indigo-600/30"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Variable</span>
            </button>
          </div>
        </div>

        {exportNotice && (
          <div className="mt-3 text-xs text-emerald-400 font-mono">✓ {exportNotice}</div>
        )}
      </div>

      {/* Vault Locked Warning (Zero-Knowledge) */}
      {!isKeyUnlocked && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-white">Vault is currently locked</div>
              <div className="text-[11px] text-amber-300/90 mt-0.5">
                Plaintext secrets can only be decrypted with your client-side master passphrase.
              </div>
            </div>
          </div>
          <button
            onClick={onOpenMasterKey}
            className="flex items-center space-x-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold px-3.5 py-1.5 text-xs transition-colors shrink-0"
          >
            <Unlock className="h-3.5 w-3.5" />
            <span>Unlock Vault</span>
          </button>
        </div>
      )}

      {/* Search & Bulk Utilities Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter variables by key (e.g. DATABASE, STRIPE)..."
            className="w-full rounded-xl border border-white/[0.08] bg-black/40 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
          />
        </div>

        <div className="flex items-center space-x-2">
          {isKeyUnlocked && secrets.length > 0 && (
            <>
              <button
                onClick={() => setGlobalShowAll(!globalShowAll)}
                className="flex items-center space-x-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-2.5 py-1.5 text-xs text-slate-300 transition-colors"
              >
                {globalShowAll ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Mask All</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Reveal All</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopyAllAsEnv}
                className="flex items-center space-x-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-2.5 py-1.5 text-xs text-slate-300 transition-colors"
                title="Copy all variables as .env formatted text"
              >
                {copiedAll ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied .env</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Secret Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a]/70 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#121726] border-b border-white/[0.08] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Key</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4 hidden sm:table-cell">Ciphertext</th>
                <th className="py-3 px-4 hidden md:table-cell">Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredSecrets.map((secret) => (
                <SecretRow
                  key={secret.id}
                  secret={secret}
                  globalShowAll={globalShowAll}
                  onEdit={(sec) => {
                    setEditingSecret(sec);
                    setModalOpen(true);
                  }}
                  onDelete={deleteSecret}
                  onInspectCiphertext={(sec) => setInspectSecret(sec)}
                />
              ))}

              {filteredSecrets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <KeyRound className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-slate-300">
                      {searchQuery ? 'No variables matching search' : 'No variables in this environment yet'}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchQuery
                        ? 'Try clearing your search filter.'
                        : 'Add your first secret variable or import a .env file.'}
                    </p>
                    {!searchQuery && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setModalOpen(true)}
                          className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 text-xs font-medium"
                        >
                          Add Variable
                        </button>
                        <button
                          onClick={() => setImportModalOpen(true)}
                          className="rounded-xl border border-white/[0.1] bg-white/[0.04] text-slate-300 px-3.5 py-1.5 text-xs font-medium"
                        >
                          Import .env
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <SecretModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSecret(null);
        }}
        onSave={handleSaveSecret}
        initialSecret={editingSecret}
        existingKeys={existingKeys}
      />

      <ImportEnvModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={(content, overwrite) => bulkImport(environment.id, content, overwrite)}
        environmentName={environment.name}
      />

      <InspectCiphertextModal
        secret={inspectSecret}
        onClose={() => setInspectSecret(null)}
      />
    </div>
  );
};
