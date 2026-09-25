import React, { useState } from 'react';
import {
  Settings,
  Users,
  Shield,
  Key,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { db } from '../lib/storage';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import zxcvbn from 'zxcvbn';

export const SettingsPage: React.FC = () => {
  const { currentWorkspace, userRole, user, refreshWorkspaces } = useAuth();
  const {
    members,
    apiKeys,
    inviteMember,
    updateMemberRole,
    removeMember,
    createApiKey,
    deleteApiKey,
    rotateWorkspaceKeys,
  } = useWorkspace();

  // Workspace Name State
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || '');
  const [wsSaved, setWsSaved] = useState(false);

  // Invite Member State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // API Key State
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Key Rotation State
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [isRotating, setIsRotating] = useState(false);
  const [rotationMsg, setRotationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveWorkspaceName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !workspaceName.trim()) return;
    if (userRole !== 'admin') {
      alert('RLS Policy: Only Admins can edit workspace settings.');
      return;
    }
    db.updateWorkspace(currentWorkspace.id, { name: workspaceName.trim() });
    refreshWorkspaces();
    setWsSaved(true);
    setTimeout(() => setWsSaved(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    if (!inviteEmail.trim()) return;

    try {
      await inviteMember(inviteEmail.trim(), inviteRole);
      setInviteSuccess(`Invited ${inviteEmail} as ${inviteRole}.`);
      setInviteEmail('');
      setTimeout(() => setInviteSuccess(null), 3000);
    } catch (e: any) {
      setInviteError(e.message || 'Failed to invite member.');
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    if (!newKeyName.trim()) return;

    try {
      const res = await createApiKey(newKeyName.trim());
      setGeneratedKey(res.rawKey);
      setNewKeyName('');
    } catch (e: any) {
      setKeyError(e.message || 'Failed to generate API key.');
    }
  };

  const handleRotateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setRotationMsg(null);

    if (userRole !== 'admin') {
      setRotationMsg({ type: 'error', text: 'RLS: Only workspace Admins can rotate encryption keys.' });
      return;
    }

    if (!newPassphrase || newPassphrase.length < 6) {
      setRotationMsg({ type: 'error', text: 'New master passphrase must be at least 6 characters.' });
      return;
    }

    if (newPassphrase !== confirmPassphrase) {
      setRotationMsg({ type: 'error', text: 'Passphrases do not match.' });
      return;
    }

    const evaluation = zxcvbn(newPassphrase, [currentWorkspace?.name || '', user?.email || '', user?.name || '']);
    if (evaluation.score < 2) {
      setRotationMsg({
        type: 'error',
        text: `New master passphrase is too weak (${evaluation.score}/4) according to zxcvbn. ${evaluation.feedback.warning || 'Please choose a more robust key.'}`,
      });
      return;
    }

    setIsRotating(true);
    try {
      await rotateWorkspaceKeys(newPassphrase);
      setRotationMsg({
        type: 'success',
        text: 'All secrets successfully re-encrypted with new AES-256-GCM key and new cryptographic salt!',
      });
      setNewPassphrase('');
      setConfirmPassphrase('');
    } catch (e: any) {
      setRotationMsg({ type: 'error', text: e.message || 'Rotation failed.' });
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl pb-12">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Workspace Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage workspace team, cryptographic key rotation, and CLI API keys
        </p>
      </div>

      {/* 1. General Settings */}
      <div className="glass-card rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center space-x-2 text-sm font-semibold text-white">
          <Settings className="h-4 w-4 text-indigo-400" />
          <span>General Information</span>
        </div>

        <form onSubmit={handleSaveWorkspaceName} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              disabled={userRole !== 'admin'}
              className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={userRole !== 'admin'}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-4 py-2 text-xs transition-colors"
            >
              Update Name
            </button>
            {wsSaved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
          </div>
        </form>

        <div className="pt-3 border-t border-white/[0.06] text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            Workspace ID: <span className="font-mono text-slate-300">{currentWorkspace?.id}</span>
          </div>
          <div>
            Current Role: <span className="font-mono uppercase text-indigo-400 font-bold">{userRole}</span>
          </div>
        </div>
      </div>

      {/* 2. Team Members & Roles (RBAC) */}
      <div className="glass-card rounded-2xl p-6 border border-white/[0.08] space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-semibold text-white">
            <Users className="h-4 w-4 text-cyan-400" />
            <span>Workspace Members & Roles ({members.length})</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">Role-Based Access Control</span>
        </div>

        {/* Invite Member Box */}
        {userRole === 'admin' ? (
          <form onSubmit={handleInvite} className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-3">
            <div className="text-xs font-medium text-slate-200">Invite New Teammate</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 rounded-xl border border-white/[0.1] bg-black/60 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                className="rounded-xl border border-white/[0.1] bg-[#121724] px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="member">Member (Read & Edit)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
              <button
                type="submit"
                className="flex items-center justify-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-medium transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Invite</span>
              </button>
            </div>

            {inviteError && <div className="text-xs text-rose-400">{inviteError}</div>}
            {inviteSuccess && <div className="text-xs text-emerald-400">{inviteSuccess}</div>}
          </form>
        ) : (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400">
            You are logged in as a <strong>Member</strong>. Only workspace <strong>Admins</strong> can invite new members or change roles.
          </div>
        )}

        {/* Members Table */}
        <div className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden bg-black/20">
          {members.map((member) => (
            <div key={member.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-white/[0.02]">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white text-xs font-bold uppercase">
                  {member.user_name.slice(0, 1)}
                </div>
                <div>
                  <div className="font-medium text-white flex items-center gap-1.5">
                    <span>{member.user_name}</span>
                    {member.user_id === user?.id && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">You</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">{member.user_email}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {userRole === 'admin' && member.user_id !== user?.id ? (
                  <select
                    value={member.role}
                    onChange={(e) => updateMemberRole(member.id, e.target.value as 'admin' | 'member')}
                    className="rounded-lg border border-white/[0.1] bg-[#141a29] px-2.5 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] text-slate-300 uppercase">
                    {member.role}
                  </span>
                )}

                {userRole === 'admin' && member.user_id !== user?.id && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Remove ${member.user_email} from workspace?`)) {
                        removeMember(member.id);
                      }
                    }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400"
                    title="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Key Rotation (Zero-Knowledge Re-encryption) */}
      <div className="glass-card rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center space-x-2 text-sm font-semibold text-white">
          <RefreshCw className="h-4 w-4 text-purple-400" />
          <span>Rotate Workspace Encryption Key</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Need to rotate your team's encryption key? Confidant will decrypt every secret in your workspace in your browser session using your current key, generate a brand new cryptographic salt, derive a new AES-256-GCM key from your new passphrase, and re-encrypt all secrets before saving back to the database.
        </p>

        {userRole === 'admin' ? (
          <form onSubmit={handleRotateKeys} className="space-y-3 max-w-md p-4 rounded-xl bg-black/40 border border-white/[0.06]">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                New Master Passphrase
              </label>
              <input
                type="password"
                value={newPassphrase}
                onChange={(e) => setNewPassphrase(e.target.value)}
                placeholder="Enter new master passphrase..."
                className="w-full rounded-xl border border-white/[0.1] bg-black/60 px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
              <PasswordStrengthMeter
                password={newPassphrase}
                userInputs={[currentWorkspace?.name || '', user?.email || '', user?.name || '']}
                minScore={3}
                onGenerateSecure={(pass) => {
                  setNewPassphrase(pass);
                  setConfirmPassphrase(pass);
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirm New Master Passphrase
              </label>
              <input
                type="password"
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Confirm new master passphrase..."
                className="w-full rounded-xl border border-white/[0.1] bg-black/60 px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {rotationMsg && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center space-x-2 ${
                  rotationMsg.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {rotationMsg.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{rotationMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isRotating || !newPassphrase}
              className="flex items-center space-x-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium px-4 py-2 text-xs transition-colors shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRotating ? 'animate-spin' : ''}`} />
              <span>{isRotating ? 'Re-encrypting Workspace Secrets...' : 'Rotate & Re-encrypt All Secrets'}</span>
            </button>
          </form>
        ) : (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400">
            Only workspace Admins can trigger cryptographic key rotations.
          </div>
        )}
      </div>

      {/* 4. API Keys for CLI & CI/CD */}
      <div className="glass-card rounded-2xl p-6 border border-white/[0.08] space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-semibold text-white">
            <Key className="h-4 w-4 text-emerald-400" />
            <span>API Keys for CLI & CI/CD ({apiKeys.length})</span>
          </div>
          <span className="text-xs text-slate-500">Automated Secret Injection</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Use API keys to authenticate the Confidant CLI in your terminal, GitHub Actions workflows, or Docker builds.
        </p>

        {/* Generate API Key Form */}
        {userRole === 'admin' && (
          <form onSubmit={handleCreateApiKey} className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-3">
            <div className="text-xs font-medium text-slate-200">Create New API Token</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key label (e.g. GitHub Actions Production, Developer CLI)"
                className="flex-1 rounded-xl border border-white/[0.1] bg-black/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newKeyName.trim()}
                className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-4 py-2 text-xs transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Generate Key</span>
              </button>
            </div>
            {keyError && <div className="text-xs text-rose-400">{keyError}</div>}
          </form>
        )}

        {/* Newly Generated Key Banner */}
        {generatedKey && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">
                Copy your new API Key now. You won't be able to see it again!
              </span>
              <button
                onClick={() => setGeneratedKey(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Dismiss
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={generatedKey}
                className="flex-1 font-mono text-xs text-white bg-black/60 p-2 rounded-lg border border-white/[0.1]"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedKey);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1"
              >
                {copiedKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Existing API Keys Table */}
        <div className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden bg-black/20">
          {apiKeys.map((k) => (
            <div key={k.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-white/[0.02]">
              <div>
                <div className="font-semibold text-white">{k.name}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {k.key_prefix} • Created {new Date(k.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-[11px] text-slate-500">
                  {k.last_used_at ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}` : 'Never used'}
                </span>

                {userRole === 'admin' && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Revoke API key "${k.name}"?`)) {
                        deleteApiKey(k.id);
                      }
                    }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400"
                    title="Revoke key"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {apiKeys.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500 italic">
              No API keys generated yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
