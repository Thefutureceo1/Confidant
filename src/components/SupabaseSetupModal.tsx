import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, ShieldCheck, Sparkles, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../lib/storage';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const currentConfig = db.getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig?.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig?.anonKey || '');
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'instructions' | 'sql' | 'connect'>('instructions');

  if (!isOpen) return null;

  const sqlSchemaCode = `-- ==============================================================================
-- CONFIDANT DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Target: Supabase / PostgreSQL 15+
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    encryption_key_salt TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. WORKSPACE MEMBERS
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    invited_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    accepted_at TIMESTAMPTZ,
    UNIQUE(workspace_id, user_id)
);

-- 3. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ENVIRONMENTS
CREATE TABLE IF NOT EXISTS public.environments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, name)
);

-- 5. SECRETS (Zero-Knowledge AES-256-GCM Encrypted)
CREATE TABLE IF NOT EXISTS public.secrets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    environment_id UUID NOT NULL REFERENCES public.environments(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    encrypted_value TEXT NOT NULL, -- AES-256-GCM Base64 Ciphertext
    iv TEXT NOT NULL,              -- AES-256-GCM Base64 Initialization Vector (12 bytes)
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(environment_id, key)
);

-- 6. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. API KEYS
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (supabaseUrl && anonKey) {
      db.setSupabaseConfig(supabaseUrl.trim(), anonKey.trim());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/[0.12] bg-[#0d121e] shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#111726]">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Supabase PostgreSQL & RLS Integration</h3>
              <p className="text-[11px] text-slate-400">Production-grade relational schema with Row-Level Security</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center rounded-lg bg-black/40 p-1 border border-white/[0.06]">
              <button
                onClick={() => setActiveTab('instructions')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'instructions' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Setup Guide
              </button>
              <button
                onClick={() => setActiveTab('sql')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'sql' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                SQL Schema
              </button>
              <button
                onClick={() => setActiveTab('connect')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'connect' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Connect Project
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

        {/* Tab 1: Setup Guide */}
        {activeTab === 'instructions' && (
          <div className="p-6 overflow-y-auto space-y-4 text-xs">
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-300">
              <div className="flex items-center space-x-2 font-semibold text-white mb-1">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Zero-Knowledge Server Architecture</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Supabase serves as your high-performance PostgreSQL persistence layer. Because secrets are encrypted on the client with AES-256-GCM before insert, Supabase administrators and database backups only ever see encrypted ciphertexts.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 rounded-xl bg-black/30 border border-white/[0.06]">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-400 font-bold shrink-0">
                  1
                </div>
                <div>
                  <div className="font-semibold text-white">Create a Supabase Project</div>
                  <p className="text-slate-400 mt-0.5">
                    Sign up or log in to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">supabase.com</a> and create a new project.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-black/30 border border-white/[0.06]">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-400 font-bold shrink-0">
                  2
                </div>
                <div>
                  <div className="font-semibold text-white">Execute SQL Migration in SQL Editor</div>
                  <p className="text-slate-400 mt-0.5">
                    Navigate to Supabase Dashboard &rarr; <strong>SQL Editor</strong> &rarr; Click <strong>New Query</strong>, paste the complete schema from the <strong>SQL Schema</strong> tab, and click <strong>Run</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-black/30 border border-white/[0.06]">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-400 font-bold shrink-0">
                  3
                </div>
                <div>
                  <div className="font-semibold text-white">Connect Your Project</div>
                  <p className="text-slate-400 mt-0.5">
                    Paste your <span className="font-mono text-cyan-300">Project URL</span> and <span className="font-mono text-cyan-300">anon public key</span> into the <strong>Connect Project</strong> tab.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: SQL Code */}
        {activeTab === 'sql' && (
          <div className="p-6 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Complete SQL schema with RLS policies:</span>
              <button
                onClick={handleCopySql}
                className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs text-white shadow-md shadow-indigo-600/30 transition-colors"
              >
                {copiedSql ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSql ? 'Copied to Clipboard' : 'Copy SQL Schema'}</span>
              </button>
            </div>

            <pre className="rounded-xl border border-white/[0.08] bg-black/60 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-80 leading-relaxed">
              {sqlSchemaCode}
            </pre>
          </div>
        )}

        {/* Tab 3: Connect Credentials */}
        {activeTab === 'connect' && (
          <form onSubmit={handleSaveConnection} className="p-6 overflow-y-auto space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full rounded-xl border border-white/[0.1] bg-black/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Supabase Anon / Public API Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full rounded-xl border border-white/[0.1] bg-black/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {savedSuccess && (
              <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Supabase connection details saved successfully!</span>
              </div>
            )}

            <button
              type="submit"
              className="flex items-center space-x-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 text-xs transition-colors shadow-lg shadow-emerald-600/30"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Save Supabase Credentials</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
