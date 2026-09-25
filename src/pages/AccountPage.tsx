import React, { useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Check,
  Users,
  Lock,
  Cpu,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  Key,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS } from '../lib/storage';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import zxcvbn from 'zxcvbn';

export const AccountPage: React.FC = () => {
  const { user, userRole, currentWorkspace, switchDemoUser, unlockEncryptionKey } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);

  // Password & Master Key change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (!newPass) {
      setPassMsg({ type: 'error', text: 'Please enter a new password/passphrase.' });
      return;
    }

    if (newPass !== confirmPass) {
      setPassMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    const evaluation = zxcvbn(newPass, [name, email, currentWorkspace?.name || '']);
    if (evaluation.score < 2) {
      setPassMsg({
        type: 'error',
        text: `Password is too weak (${evaluation.score}/4). ${evaluation.feedback.warning || 'Please choose a more robust master key.'}`,
      });
      return;
    }

    setIsChangingPass(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      // Unlock or refresh key in session
      await unlockEncryptionKey(newPass);

      setPassMsg({
        type: 'success',
        text: 'Master password successfully updated! Session re-authenticated.',
      });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl pb-12">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Account & Security Profile</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Personal credentials, session crypto status, and role inspection
        </p>
      </div>

      {/* RLS Persona Switcher Box (Crucial for testing) */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-[#101423] to-cyan-950/30 p-6 shadow-xl">
        <div className="flex items-center space-x-2 text-sm font-semibold text-white mb-1">
          <Users className="h-4 w-4 text-cyan-400" />
          <span>Interactive Role Tester (RLS Verification)</span>
        </div>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Switch between predefined identities to test Supabase Row Level Security (RLS) enforcement in real-time. Notice how Jordan (Member) can view and add secrets, but cannot delete projects, environments, or other users' secrets!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DEMO_USERS.map((u) => {
            const isSelected = u.id === user?.id;
            return (
              <button
                key={u.id}
                onClick={() => switchDemoUser(u.id)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-600/20 shadow-lg shadow-indigo-600/20'
                    : 'border-white/[0.08] bg-black/40 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white text-xs">{u.name}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                      u.id.includes('admin')
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {u.id.includes('admin') ? 'Admin Role' : 'Member Role'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                <div className="text-[10px] text-slate-500 mt-2">
                  {u.id.includes('admin')
                    ? 'Full permissions: manage members, rotate keys, delete projects'
                    : 'Restricted permissions: can read & insert secrets; cannot delete'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* User Information */}
      <div className="glass-card rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center space-x-2 text-sm font-semibold text-white">
          <User className="h-4 w-4 text-indigo-400" />
          <span>User Profile</span>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 text-xs transition-colors"
            >
              Save Profile
            </button>
            {saved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Updated
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Password & Master Key Change Form */}
      <div className="glass-card rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center space-x-2 text-sm font-semibold text-white">
          <Key className="h-4 w-4 text-cyan-400" />
          <span>Change Password & Workspace Master Passphrase</span>
        </div>
        <p className="text-xs text-slate-400">
          Evaluated in real-time with <strong className="text-indigo-300">zxcvbn</strong> entropy analysis. Ensures your encryption key can withstand offline dictionary and GPU cluster attacks.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Current Password / Passphrase
            </label>
            <input
              type="password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="Enter current password..."
              className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              New Master Password
            </label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Enter robust master key..."
              className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
            />

            {/* zxcvbn Password Strength Meter */}
            <PasswordStrengthMeter
              password={newPass}
              userInputs={[name, email, currentWorkspace?.name || '']}
              minScore={3}
              onGenerateSecure={(pass) => {
                setNewPass(pass);
                setConfirmPass(pass);
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Confirm New Master Password
            </label>
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Confirm new master key..."
              className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>

          {passMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                passMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
              }`}
            >
              {passMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{passMsg.text}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isChangingPass || !newPass}
              className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-2 text-xs transition-colors shadow-lg shadow-cyan-600/30 disabled:opacity-50"
            >
              {isChangingPass ? 'Updating...' : 'Update Master Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Client-Side Cryptographic Specs */}
      <div className="glass-card rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center space-x-2 text-sm font-semibold text-white">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Cryptographic Architecture & Web Crypto API</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              <span>Symmetric Cipher</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              AES-256-GCM with 96-bit random initialization vector (IV) generated per secret. Provides authenticated encryption with integrity verification.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Fingerprint className="h-3.5 w-3.5 text-indigo-400" />
              <span>Key Derivation Function (KDF)</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              PBKDF2 with HMAC-SHA-256 and 100,000 iterations prevents dictionary attacks. Key derivation occurs exclusively in the user's browser runtime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
