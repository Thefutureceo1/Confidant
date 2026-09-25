import React, { useState, useMemo } from 'react';
import {
  History,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Copy,
  Check,
  FileCode,
  Shield,
  Layers,
  ChevronDown,
  ChevronRight,
  Download,
  AlertCircle,
  ExternalLink,
  Undo2,
  Trash2,
} from 'lucide-react';
import { TransferRecord, Project, Environment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

interface TransferHistoryProps {
  filterProjectId?: string;
  filterEnvironmentId?: string;
  title?: string;
  subtitle?: string;
  isEmbedded?: boolean;
}

export const TransferHistory: React.FC<TransferHistoryProps> = ({
  filterProjectId,
  filterEnvironmentId,
  title = 'Transfer History & Snapshots',
  subtitle = 'Audit and safely revert bulk environment variable imports, exports, and deployments',
  isEmbedded = false,
}) => {
  const { user, userRole, isKeyUnlocked } = useAuth();
  const { transfers, projects, environments, revertTransfer } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'import' | 'export' | 'revert'>('all');
  const [selectedProject, setSelectedProject] = useState<string>(filterProjectId || 'all');
  const [selectedEnv, setSelectedEnv] = useState<string>(filterEnvironmentId || 'all');

  // Expanded row details
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Revert confirmation state
  const [revertingRecord, setRevertingRecord] = useState<TransferRecord | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [isReverting, setIsReverting] = useState(false);
  const [revertFeedback, setRevertFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      if (selectedProject !== 'all' && t.project_id !== selectedProject) return false;
      if (selectedEnv !== 'all' && t.environment_id !== selectedEnv) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesLabel = t.source_label.toLowerCase().includes(query);
        const matchesEnv = t.environment_name.toLowerCase().includes(query);
        const matchesProj = t.project_name.toLowerCase().includes(query);
        const matchesUser = t.user_name.toLowerCase().includes(query) || t.user_email.toLowerCase().includes(query);
        const matchesKey =
          t.added_keys.some((k) => k.toLowerCase().includes(query)) ||
          t.updated_keys.some((k) => k.toLowerCase().includes(query));
        if (!matchesLabel && !matchesEnv && !matchesProj && !matchesUser && !matchesKey) {
          return false;
        }
      }
      return true;
    });
  }, [transfers, selectedType, selectedProject, selectedEnv, searchQuery]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExecuteRevert = async () => {
    if (!revertingRecord) return;

    if (!isKeyUnlocked) {
      setRevertFeedback({
        type: 'error',
        text: 'Master encryption key is locked. Unlock the vault to perform safe rollback.',
      });
      return;
    }

    if (userRole !== 'admin') {
      setRevertFeedback({
        type: 'error',
        text: 'Access restricted: Only workspace Admins can revert environment snapshots.',
      });
      return;
    }

    // Require exact environment name typing if production
    if (revertingRecord.environment_name === 'production' && confirmInput !== 'production') {
      setRevertFeedback({
        type: 'error',
        text: 'Please type "production" to confirm reverting production secrets.',
      });
      return;
    }

    setIsReverting(true);
    setRevertFeedback(null);

    try {
      const res = await revertTransfer(revertingRecord.id);
      setRevertFeedback({ type: 'success', text: res.message });
      setTimeout(() => {
        setRevertingRecord(null);
        setConfirmInput('');
        setRevertFeedback(null);
      }, 1500);
    } catch (err: any) {
      setRevertFeedback({ type: 'error', text: err.message || 'Revert operation failed.' });
    } finally {
      setIsReverting(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transfers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `confidant-transfer-audit-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className={`space-y-4 ${isEmbedded ? '' : 'max-w-6xl pb-16'}`}>
      {/* Header */}
      {!isEmbedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-cyan-400">
                <History className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportJson}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-200 transition-colors"
              title="Download audit history as JSON"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Export Audit Manifest</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-[#0f1422] p-2.5 rounded-xl border border-slate-800/80">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file, variable key, project, author..."
            className="w-full rounded-lg bg-black/40 border border-white/[0.06] pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Type filter */}
          <div className="flex rounded-lg bg-black/40 p-0.5 border border-white/[0.06]">
            {(['all', 'import', 'export', 'revert'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-colors ${
                  selectedType === t
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Project dropdown */}
          {!filterProjectId && (
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedEnv('all');
              }}
              className="rounded-lg bg-black/50 border border-white/[0.08] px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Environment dropdown */}
          {!filterEnvironmentId && (
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="rounded-lg bg-black/50 border border-white/[0.08] px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none capitalize"
            >
              <option value="all">All Environments</option>
              {environments
                .filter((e) => selectedProject === 'all' || e.project_id === selectedProject)
                .map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name}
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      {/* Transfers List */}
      <div className="rounded-xl border border-slate-800 bg-[#0d121f] overflow-hidden divide-y divide-slate-800/80">
        {filteredTransfers.map((record) => {
          const isExpanded = expandedId === record.id;
          const date = new Date(record.created_at);
          const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateFormatted = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

          const isImport = record.type === 'import';
          const isExport = record.type === 'export';
          const isRevert = record.type === 'revert';

          const canRevert = isImport && record.snapshot_before && record.snapshot_before.length > 0 && !record.reverted_at;

          return (
            <div key={record.id} className="transition-colors hover:bg-slate-800/20">
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left details */}
                <div className="flex items-start space-x-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                      isImport
                        ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-400'
                        : isExport
                        ? 'bg-indigo-950/40 border-indigo-700/50 text-indigo-400'
                        : 'bg-amber-950/40 border-amber-700/50 text-amber-400'
                    }`}
                  >
                    {isImport ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : isExport ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-semibold text-white text-xs tracking-tight">
                        {record.source_label}
                      </span>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border font-medium ${
                          isImport
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : isExport
                            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {record.type}
                      </span>

                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {record.project_name} · <strong className="text-white capitalize">{record.environment_name}</strong>
                      </span>

                      {record.reverted_at && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          Reverted by {record.reverted_by}
                        </span>
                      )}
                    </div>

                    {/* Metadata line */}
                    <div className="flex items-center flex-wrap gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono text-slate-500">
                        <span>ID: {record.id.slice(0, 10)}</span>
                        <button
                          onClick={() => handleCopyId(record.id)}
                          className="hover:text-slate-300 transition-colors"
                          title="Copy transfer ID"
                        >
                          {copiedId === record.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </span>

                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-500" />
                        <span>{record.user_name}</span>
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{dateFormatted} at {timeFormatted}</span>
                      </span>

                      <span className="font-mono text-slate-300">
                        {record.total_keys} variables
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right action buttons */}
                <div className="flex items-center space-x-2 self-end md:self-center">
                  {canRevert && (
                    <button
                      onClick={() => setRevertingRecord(record)}
                      className="flex items-center space-x-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-3 py-1.5 text-xs font-medium transition-colors"
                      title="Rollback environment to before this import"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Revert to Snapshot</span>
                    </button>
                  )}

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    className="flex items-center space-x-1 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1.5 text-xs text-slate-300 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide Diff' : 'Inspect'}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Expanded Diff & Variables Inspector */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 bg-black/40 border-t border-slate-800/60 space-y-3 text-xs">
                  {record.notes && (
                    <div className="text-slate-400 italic">
                      "{record.notes}"
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-500 text-[10px] uppercase">Variables Added</div>
                      <div className="text-emerald-400 font-bold mt-0.5">+{record.added_keys.length}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-500 text-[10px] uppercase">Variables Overwritten</div>
                      <div className="text-amber-400 font-bold mt-0.5">~{record.updated_keys.length}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-500 text-[10px] uppercase">Snapshot Restore Point</div>
                      <div className="text-cyan-400 font-bold mt-0.5">{record.snapshot_before?.length || 0} variables</div>
                    </div>
                  </div>

                  {/* Keys changed list */}
                  {(record.added_keys.length > 0 || record.updated_keys.length > 0) && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-300">Variables impacted by this transfer:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {record.added_keys.map((k) => (
                          <span
                            key={k}
                            className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-700/40 text-emerald-300"
                          >
                            + {k}
                          </span>
                        ))}
                        {record.updated_keys.map((k) => (
                          <span
                            key={k}
                            className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-950/50 border border-amber-700/40 text-amber-300"
                          >
                            ~ {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-mono">
                    <span>Checksum: {record.checksum}</span>
                    <span>Client-side Zero Knowledge Verified</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredTransfers.length === 0 && (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <History className="h-8 w-8 mx-auto text-slate-600" />
            <div className="text-xs">No transfer records match your current filters.</div>
          </div>
        )}
      </div>

      {/* Safe Revert Confirmation Modal */}
      {revertingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-100">
          <div className="relative w-full max-w-lg rounded-2xl border border-amber-500/40 bg-[#101422] p-6 shadow-2xl space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Revert Environment to Snapshot</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Safe rollback of <strong className="text-white">{revertingRecord.source_label}</strong>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs space-y-2 text-slate-300">
              <div className="flex items-center justify-between text-slate-400">
                <span>Target Environment:</span>
                <span className="font-mono text-white capitalize">{revertingRecord.project_name} ({revertingRecord.environment_name})</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Snapshot Created:</span>
                <span className="font-mono text-slate-200">{new Date(revertingRecord.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Variables to Restore:</span>
                <span className="font-mono text-cyan-300 font-bold">{revertingRecord.snapshot_before.length} variables</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              This action will restore the exact state of your environment prior to this bulk transfer. Any newly added variables from this import will be removed, and overwritten values will revert to their previous encrypted versions.
            </p>

            {revertingRecord.environment_name === 'production' && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-medium text-rose-400">
                  Production Safeguard: Type <span className="font-mono font-bold text-white">production</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="production"
                  className="w-full rounded-xl border border-rose-500/30 bg-black/60 px-3.5 py-2 text-xs text-white font-mono focus:border-rose-500 focus:outline-none"
                  autoFocus
                />
              </div>
            )}

            {revertFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  revertFeedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}
              >
                {revertFeedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{revertFeedback.text}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setRevertingRecord(null);
                  setConfirmInput('');
                  setRevertFeedback(null);
                }}
                className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRevert}
                disabled={
                  isReverting ||
                  (revertingRecord.environment_name === 'production' && confirmInput !== 'production')
                }
                className="flex items-center space-x-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium px-4 py-2 text-xs transition-colors shadow-lg shadow-amber-600/30 disabled:opacity-50"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isReverting ? 'animate-spin' : ''}`} />
                <span>{isReverting ? 'Restoring Snapshot...' : 'Confirm & Restore Snapshot'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
