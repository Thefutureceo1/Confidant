-- ==============================================================================
-- ENVAULT DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Target: Supabase / PostgreSQL 15+
-- ==============================================================================

-- Enable UUID extension
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

-- 5. SECRETS (Zero-Knowledge Encrypted)
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
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'viewed', 'rotated_keys')),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('secret', 'project', 'environment', 'workspace', 'api_key')),
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

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current authenticated user belongs to workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if current user is admin of workspace
CREATE OR REPLACE FUNCTION public.is_workspace_admin(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. WORKSPACES POLICIES
CREATE POLICY "Users can view workspaces they belong to"
    ON public.workspaces FOR SELECT
    USING (public.is_workspace_member(id));

CREATE POLICY "Users can create workspaces"
    ON public.workspaces FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update workspace"
    ON public.workspaces FOR UPDATE
    USING (public.is_workspace_admin(id));

CREATE POLICY "Admins can delete workspace"
    ON public.workspaces FOR DELETE
    USING (public.is_workspace_admin(id));

-- 2. WORKSPACE MEMBERS POLICIES
CREATE POLICY "Members can view other members in their workspaces"
    ON public.workspace_members FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Admins can invite or manage members"
    ON public.workspace_members FOR ALL
    USING (public.is_workspace_admin(workspace_id));

-- 3. PROJECTS POLICIES
CREATE POLICY "Users can view projects in their workspaces"
    ON public.projects FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can create projects"
    ON public.projects FOR INSERT
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can update projects"
    ON public.projects FOR UPDATE
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Only admins can delete projects"
    ON public.projects FOR DELETE
    USING (public.is_workspace_admin(workspace_id));

-- 4. ENVIRONMENTS POLICIES
CREATE POLICY "Users can view environments in their workspace projects"
    ON public.environments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = environments.project_id AND public.is_workspace_member(p.workspace_id)
    ));

CREATE POLICY "Members can create environments"
    ON public.environments FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = environments.project_id AND public.is_workspace_member(p.workspace_id)
    ));

CREATE POLICY "Members can update environments"
    ON public.environments FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = environments.project_id AND public.is_workspace_member(p.workspace_id)
    ));

CREATE POLICY "Only admins can delete environments"
    ON public.environments FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = environments.project_id AND public.is_workspace_admin(p.workspace_id)
    ));

-- 5. SECRETS POLICIES
-- All members can read encrypted secrets (decryption happens locally in browser!)
CREATE POLICY "Members can view encrypted secrets"
    ON public.secrets FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.environments e
        JOIN public.projects p ON p.id = e.project_id
        WHERE e.id = secrets.environment_id AND public.is_workspace_member(p.workspace_id)
    ));

CREATE POLICY "Members can insert secrets"
    ON public.secrets FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.environments e
        JOIN public.projects p ON p.id = e.project_id
        WHERE e.id = secrets.environment_id AND public.is_workspace_member(p.workspace_id)
    ));

CREATE POLICY "Members can update secrets"
    ON public.secrets FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.environments e
        JOIN public.projects p ON p.id = e.project_id
        WHERE e.id = secrets.environment_id AND public.is_workspace_member(p.workspace_id)
    ));

-- Rule: Only admins can delete secrets, or the creator if permitted
CREATE POLICY "Admins or creator can delete secrets"
    ON public.secrets FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.environments e
        JOIN public.projects p ON p.id = e.project_id
        WHERE e.id = secrets.environment_id AND (public.is_workspace_admin(p.workspace_id) OR secrets.created_by = auth.uid())
    ));

-- 6. AUDIT LOGS POLICIES
CREATE POLICY "Members can view workspace audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (public.is_workspace_member(workspace_id));

-- 7. API KEYS POLICIES
CREATE POLICY "Members can view workspace api keys"
    ON public.api_keys FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Admins can manage api keys"
    ON public.api_keys FOR ALL
    USING (public.is_workspace_admin(workspace_id));
