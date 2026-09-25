import React, { useState } from 'react';
import { History, Search, Filter, Shield, Clock, User, CheckCircle2 } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';

export const AuditLogPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const { auditLogs } = useWorkspace();
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchKey = log.metadata?.key?.toLowerCase().includes(q);
      const matchUser = log.user_email?.toLowerCase().includes(q);
      const matchProj = log.metadata?.project_name?.toLowerCase().includes(q);
      const matchType = log.resource_type.toLowerCase().includes(q);
      return matchKey || matchUser || matchProj || matchType;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Audit Trail & Activity Log</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable audit trail of secret access, creation, updates, and key rotations for <span className="text-indigo-300 font-medium">{currentWorkspace?.name}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
          <Shield className="h-3.5 w-3.5" />
          <span>Audit Logging Active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by key, user email, project..."
            className="w-full rounded-xl border border-white/[0.08] bg-black/40 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <div className="flex rounded-lg bg-black/40 p-1 border border-white/[0.06] text-xs">
            {['all', 'created', 'updated', 'deleted', 'rotated_keys'].map((act) => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  filterAction === act
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {act === 'rotated_keys' ? 'Key Rotation' : act}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a]/70 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#121726] border-b border-white/[0.08] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLogs.map((log) => {
                const dateStr = new Date(log.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {dateStr}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                          {log.user_email?.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="text-slate-200">{log.user_email}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide ${
                          log.action === 'created'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.action === 'updated'
                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                            : log.action === 'deleted'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300 capitalize whitespace-nowrap">
                      {log.resource_type}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {log.metadata?.key ? (
                        <span>
                          Secret key <span className="font-mono text-cyan-300 font-semibold">{log.metadata.key}</span>
                          {log.metadata.environment_name && (
                            <span className="text-slate-500"> ({log.metadata.environment_name})</span>
                          )}
                          {log.metadata.project_name && (
                            <span className="text-slate-500"> in {log.metadata.project_name}</span>
                          )}
                        </span>
                      ) : log.metadata?.project_name ? (
                        <span>Project: <strong className="text-white">{log.metadata.project_name}</strong></span>
                      ) : log.metadata?.environment_name ? (
                        <span>Environment: <strong className="text-white">{log.metadata.environment_name}</strong></span>
                      ) : log.metadata?.details ? (
                        <span>{log.metadata.details}</span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">{log.resource_id}</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                    No matching audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
