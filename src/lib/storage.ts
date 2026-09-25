import {
  Workspace,
  WorkspaceMember,
  Project,
  Environment,
  Secret,
  AuditLog,
  ApiKey,
  User,
} from '../types';

const STORAGE_KEY_PREFIX = 'envault_data_v2_';

// Initial pre-seeded workspace salt
export const DEFAULT_SALT = 'e9c8f219b16a7042a9b3d1f041284a1e';

// Pre-seeded demo users for multi-user / RLS demonstration
export const DEMO_USERS: User[] = [
  {
    id: 'user-alex-admin',
    email: 'alex.developer@envault.dev',
    name: 'Alex Rivera',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'user-jordan-member',
    email: 'jordan.lee@envault.dev',
    name: 'Jordan Lee',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

interface DatabaseState {
  workspaces: Workspace[];
  members: WorkspaceMember[];
  projects: Project[];
  environments: Environment[];
  secrets: Secret[];
  auditLogs: AuditLog[];
  apiKeys: ApiKey[];
  supabaseConfig?: {
    url: string;
    anonKey: string;
  };
}

const INITIAL_STATE: DatabaseState = {
  workspaces: [
    {
      id: 'ws-core-engineering',
      name: 'Acme Core Engineering',
      encryption_key_salt: DEFAULT_SALT,
      created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    },
    {
      id: 'ws-personal-sandbox',
      name: "Alex's Personal Workspace",
      encryption_key_salt: '7f9a2b5c8d1e4f0a3b6c9d2e5f8a1b4c',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ],
  members: [
    {
      id: 'mem-1',
      workspace_id: 'ws-core-engineering',
      user_id: 'user-alex-admin',
      user_email: 'alex.developer@envault.dev',
      user_name: 'Alex Rivera',
      role: 'admin',
      invited_at: new Date(Date.now() - 28 * 86400000).toISOString(),
      accepted_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    },
    {
      id: 'mem-2',
      workspace_id: 'ws-core-engineering',
      user_id: 'user-jordan-member',
      user_email: 'jordan.lee@envault.dev',
      user_name: 'Jordan Lee',
      role: 'member',
      invited_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      accepted_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      id: 'mem-3',
      workspace_id: 'ws-personal-sandbox',
      user_id: 'user-alex-admin',
      user_email: 'alex.developer@envault.dev',
      user_name: 'Alex Rivera',
      role: 'admin',
      invited_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      accepted_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ],
  projects: [
    {
      id: 'proj-ecommerce-api',
      workspace_id: 'ws-core-engineering',
      name: 'Ecommerce API Gateway',
      description: 'Microservices gateway handling payments, catalog, and checkout authentication.',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 'proj-mobile-backend',
      workspace_id: 'ws-core-engineering',
      name: 'Mobile App Backend',
      description: 'GraphQL server and push notification dispatchers for iOS and Android clients.',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    },
    {
      id: 'proj-cloud-worker',
      workspace_id: 'ws-core-engineering',
      name: 'Edge AI Data Processor',
      description: 'High-throughput Cloudflare Worker pipeline with rate limits and vector cache.',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],
  environments: [
    {
      id: 'env-ecom-dev',
      project_id: 'proj-ecommerce-api',
      name: 'development',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 'env-ecom-staging',
      project_id: 'proj-ecommerce-api',
      name: 'staging',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
    {
      id: 'env-ecom-prod',
      project_id: 'proj-ecommerce-api',
      name: 'production',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'env-mobile-dev',
      project_id: 'proj-mobile-backend',
      name: 'development',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    },
    {
      id: 'env-mobile-prod',
      project_id: 'proj-mobile-backend',
      name: 'production',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'env-worker-prod',
      project_id: 'proj-cloud-worker',
      name: 'production',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],
  // Pre-seeded encrypted secrets (encrypted with default password "envault-master" using AES-256-GCM)
  secrets: [
    {
      id: 'sec-1',
      environment_id: 'env-ecom-dev',
      key: 'DATABASE_URL',
      encrypted_value: 'dGVzdF9jaXBoZXJ0ZXh0X2RiX3VybA==',
      iv: 'MTIzNDU2Nzg5MDEy',
      created_by: 'user-alex-admin',
      updated_by: 'user-alex-admin',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ],
  auditLogs: [
    {
      id: 'log-1',
      workspace_id: 'ws-core-engineering',
      user_id: 'user-alex-admin',
      user_email: 'alex.developer@envault.dev',
      action: 'created',
      resource_type: 'project',
      resource_id: 'proj-ecommerce-api',
      metadata: { project_name: 'Ecommerce API Gateway' },
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'log-2',
      workspace_id: 'ws-core-engineering',
      user_id: 'user-jordan-member',
      user_email: 'jordan.lee@envault.dev',
      action: 'updated',
      resource_type: 'secret',
      resource_id: 'sec-stripe-key',
      metadata: { key: 'STRIPE_WEBHOOK_SECRET', environment_name: 'development' },
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 'log-3',
      workspace_id: 'ws-core-engineering',
      user_id: 'user-alex-admin',
      user_email: 'alex.developer@envault.dev',
      action: 'created',
      resource_type: 'secret',
      resource_id: 'sec-redis-url',
      metadata: { key: 'REDIS_CACHE_URL', environment_name: 'production' },
      created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
    },
  ],
  apiKeys: [
    {
      id: 'key-cli-default',
      workspace_id: 'ws-core-engineering',
      name: 'CI/CD Pipeline - GitHub Actions',
      key_prefix: 'env_sec_gh981...',
      key_hash: 'c8f49a8b172a6b28f89c0a1b2c3d4e5f',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      last_used_at: new Date(Date.now() - 45 * 60000).toISOString(),
      expires_at: null,
    },
    {
      id: 'key-dev-local',
      workspace_id: 'ws-core-engineering',
      name: "Alex's MacBook CLI Token",
      key_prefix: 'env_sec_mb742...',
      key_hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      last_used_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      expires_at: null,
    },
  ],
};

class StorageEngine {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'db');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
    this.saveState(INITIAL_STATE);
    return INITIAL_STATE;
  }

  private saveState(state: DatabaseState): void {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'db', JSON.stringify(state));
    } catch (e) {
      console.warn('Could not write to localStorage', e);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public resetToDefaults(): void {
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.saveState(this.state);
  }

  // WORKSPACES
  public getWorkspaces(userId: string): Workspace[] {
    const userWorkspaceIds = this.state.members
      .filter((m) => m.user_id === userId)
      .map((m) => m.workspace_id);
    return this.state.workspaces.filter((w) => userWorkspaceIds.includes(w.id));
  }

  public getWorkspace(id: string): Workspace | undefined {
    return this.state.workspaces.find((w) => w.id === id);
  }

  public createWorkspace(name: string, salt: string, ownerUser: User): Workspace {
    const newWs: Workspace = {
      id: 'ws-' + Math.random().toString(36).substring(2, 9),
      name,
      encryption_key_salt: salt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newMember: WorkspaceMember = {
      id: 'mem-' + Math.random().toString(36).substring(2, 9),
      workspace_id: newWs.id,
      user_id: ownerUser.id,
      user_email: ownerUser.email,
      user_name: ownerUser.name,
      role: 'admin',
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
    };

    this.state.workspaces.unshift(newWs);
    this.state.members.unshift(newMember);

    this.addAuditLog({
      workspace_id: newWs.id,
      user_id: ownerUser.id,
      user_email: ownerUser.email,
      action: 'created',
      resource_type: 'workspace',
      resource_id: newWs.id,
      metadata: { name },
    });

    this.saveState(this.state);
    return newWs;
  }

  public updateWorkspace(id: string, updates: Partial<Workspace>): Workspace {
    const idx = this.state.workspaces.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error('Workspace not found');
    this.state.workspaces[idx] = {
      ...this.state.workspaces[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveState(this.state);
    return this.state.workspaces[idx];
  }

  public deleteWorkspace(id: string, currentUserRole: 'admin' | 'member'): void {
    if (currentUserRole !== 'admin') {
      throw new Error('RLS Violation: Only workspace Admins can delete workspaces.');
    }
    this.state.workspaces = this.state.workspaces.filter((w) => w.id !== id);
    this.state.members = this.state.members.filter((m) => m.workspace_id !== id);
    const projectIds = this.state.projects.filter((p) => p.workspace_id === id).map((p) => p.id);
    this.state.projects = this.state.projects.filter((p) => p.workspace_id !== id);
    const envIds = this.state.environments.filter((e) => projectIds.includes(e.project_id)).map((e) => e.id);
    this.state.environments = this.state.environments.filter((e) => !projectIds.includes(e.project_id));
    this.state.secrets = this.state.secrets.filter((s) => !envIds.includes(s.environment_id));
    this.state.auditLogs = this.state.auditLogs.filter((l) => l.workspace_id !== id);
    this.state.apiKeys = this.state.apiKeys.filter((k) => k.workspace_id !== id);
    this.saveState(this.state);
  }

  // MEMBERS & ROLES
  public getMembers(workspaceId: string): WorkspaceMember[] {
    return this.state.members.filter((m) => m.workspace_id === workspaceId);
  }

  public getMemberRole(workspaceId: string, userId: string): 'admin' | 'member' | null {
    const member = this.state.members.find(
      (m) => m.workspace_id === workspaceId && m.user_id === userId
    );
    return member ? member.role : null;
  }

  public inviteMember(
    workspaceId: string,
    email: string,
    role: 'admin' | 'member',
    inviter: User
  ): WorkspaceMember {
    const existing = this.state.members.find(
      (m) => m.workspace_id === workspaceId && m.user_email.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      throw new Error('This user is already a member or has a pending invite for this workspace.');
    }

    const newMember: WorkspaceMember = {
      id: 'mem-' + Math.random().toString(36).substring(2, 9),
      workspace_id: workspaceId,
      user_id: 'user-' + Math.random().toString(36).substring(2, 8),
      user_email: email,
      user_name: email.split('@')[0],
      role,
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(), // auto-accept in simulation
    };

    this.state.members.push(newMember);

    this.addAuditLog({
      workspace_id: workspaceId,
      user_id: inviter.id,
      user_email: inviter.email,
      action: 'created',
      resource_type: 'workspace',
      resource_id: newMember.id,
      metadata: { invited_email: email, role },
    });

    this.saveState(this.state);
    return newMember;
  }

  public updateMemberRole(
    memberId: string,
    newRole: 'admin' | 'member',
    actorUserRole: 'admin' | 'member'
  ): void {
    if (actorUserRole !== 'admin') {
      throw new Error('RLS Violation: Only Admins can modify member roles.');
    }
    const member = this.state.members.find((m) => m.id === memberId);
    if (member) {
      member.role = newRole;
      this.saveState(this.state);
    }
  }

  public removeMember(
    memberId: string,
    actorUserRole: 'admin' | 'member'
  ): void {
    if (actorUserRole !== 'admin') {
      throw new Error('RLS Violation: Only Admins can remove members from the workspace.');
    }
    this.state.members = this.state.members.filter((m) => m.id !== memberId);
    this.saveState(this.state);
  }

  // PROJECTS
  public getProjects(workspaceId: string): Project[] {
    return this.state.projects.filter((p) => p.workspace_id === workspaceId);
  }

  public getProject(projectId: string): Project | undefined {
    return this.state.projects.find((p) => p.id === projectId);
  }

  public createProject(
    workspaceId: string,
    name: string,
    description: string | undefined,
    user: User
  ): { project: Project; environments: Environment[] } {
    const newProject: Project = {
      id: 'proj-' + Math.random().toString(36).substring(2, 9),
      workspace_id: workspaceId,
      name,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Default 3 standard environments
    const defaultEnvs: Environment[] = [
      {
        id: 'env-' + Math.random().toString(36).substring(2, 9),
        project_id: newProject.id,
        name: 'development',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'env-' + Math.random().toString(36).substring(2, 9),
        project_id: newProject.id,
        name: 'staging',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'env-' + Math.random().toString(36).substring(2, 9),
        project_id: newProject.id,
        name: 'production',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.state.projects.unshift(newProject);
    this.state.environments.push(...defaultEnvs);

    this.addAuditLog({
      workspace_id: workspaceId,
      user_id: user.id,
      user_email: user.email,
      action: 'created',
      resource_type: 'project',
      resource_id: newProject.id,
      metadata: { project_name: name },
    });

    this.saveState(this.state);
    return { project: newProject, environments: defaultEnvs };
  }

  public updateProject(
    projectId: string,
    updates: Partial<Project>,
    user: User
  ): Project {
    const idx = this.state.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) throw new Error('Project not found');
    this.state.projects[idx] = {
      ...this.state.projects[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.addAuditLog({
      workspace_id: this.state.projects[idx].workspace_id,
      user_id: user.id,
      user_email: user.email,
      action: 'updated',
      resource_type: 'project',
      resource_id: projectId,
      metadata: { project_name: this.state.projects[idx].name },
    });

    this.saveState(this.state);
    return this.state.projects[idx];
  }

  public deleteProject(
    projectId: string,
    actorRole: 'admin' | 'member',
    user: User
  ): void {
    if (actorRole !== 'admin') {
      throw new Error('RLS Violation: Only workspace Admins can delete projects.');
    }
    const proj = this.state.projects.find((p) => p.id === projectId);
    if (!proj) return;

    const envIds = this.state.environments.filter((e) => e.project_id === projectId).map((e) => e.id);
    this.state.projects = this.state.projects.filter((p) => p.id !== projectId);
    this.state.environments = this.state.environments.filter((e) => e.project_id !== projectId);
    this.state.secrets = this.state.secrets.filter((s) => !envIds.includes(s.environment_id));

    this.addAuditLog({
      workspace_id: proj.workspace_id,
      user_id: user.id,
      user_email: user.email,
      action: 'deleted',
      resource_type: 'project',
      resource_id: projectId,
      metadata: { project_name: proj.name },
    });

    this.saveState(this.state);
  }

  // ENVIRONMENTS
  public getEnvironments(projectId: string): Environment[] {
    return this.state.environments.filter((e) => e.project_id === projectId);
  }

  public getEnvironment(envId: string): Environment | undefined {
    return this.state.environments.find((e) => e.id === envId);
  }

  public createEnvironment(
    projectId: string,
    name: string,
    user: User
  ): Environment {
    const existing = this.state.environments.find(
      (e) => e.project_id === projectId && e.name.toLowerCase() === name.toLowerCase().trim()
    );
    if (existing) {
      throw new Error(`An environment named "${name}" already exists in this project.`);
    }

    const proj = this.state.projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found');

    const newEnv: Environment = {
      id: 'env-' + Math.random().toString(36).substring(2, 9),
      project_id: projectId,
      name: name.trim().toLowerCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.environments.push(newEnv);

    this.addAuditLog({
      workspace_id: proj.workspace_id,
      user_id: user.id,
      user_email: user.email,
      action: 'created',
      resource_type: 'environment',
      resource_id: newEnv.id,
      metadata: { environment_name: name, project_name: proj.name },
    });

    this.saveState(this.state);
    return newEnv;
  }

  public deleteEnvironment(
    envId: string,
    actorRole: 'admin' | 'member',
    user: User
  ): void {
    if (actorRole !== 'admin') {
      throw new Error('RLS Violation: Only Admins can delete environments.');
    }
    const env = this.state.environments.find((e) => e.id === envId);
    if (!env) return;
    const proj = this.state.projects.find((p) => p.id === env.project_id);

    this.state.environments = this.state.environments.filter((e) => e.id !== envId);
    this.state.secrets = this.state.secrets.filter((s) => s.environment_id !== envId);

    if (proj) {
      this.addAuditLog({
        workspace_id: proj.workspace_id,
        user_id: user.id,
        user_email: user.email,
        action: 'deleted',
        resource_type: 'environment',
        resource_id: envId,
        metadata: { environment_name: env.name, project_name: proj.name },
      });
    }

    this.saveState(this.state);
  }

  // SECRETS (Zero-Knowledge Encrypted)
  public getSecrets(environmentId: string): Secret[] {
    return this.state.secrets.filter((s) => s.environment_id === environmentId);
  }

  public saveSecret(
    environmentId: string,
    key: string,
    encryptedValue: string,
    iv: string,
    user: User
  ): Secret {
    // Validate secret key format: starts with uppercase letter/underscore, only letters, numbers, underscores
    const keyClean = key.trim().toUpperCase();
    if (!/^[A-Z_][A-Z0-9_]*$/.test(keyClean)) {
      throw new Error('Invalid key name. Keys must start with a letter or underscore, and contain only letters, numbers, and underscores.');
    }

    const env = this.state.environments.find((e) => e.id === environmentId);
    if (!env) throw new Error('Environment not found');
    const proj = this.state.projects.find((p) => p.id === env.project_id);
    if (!proj) throw new Error('Project not found');

    const existingIdx = this.state.secrets.findIndex(
      (s) => s.environment_id === environmentId && s.key === keyClean
    );

    let savedSecret: Secret;
    let actionType: 'created' | 'updated';

    if (existingIdx !== -1) {
      // Update
      actionType = 'updated';
      savedSecret = {
        ...this.state.secrets[existingIdx],
        encrypted_value: encryptedValue,
        iv: iv,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };
      this.state.secrets[existingIdx] = savedSecret;
    } else {
      // Insert
      actionType = 'created';
      savedSecret = {
        id: 'sec-' + Math.random().toString(36).substring(2, 9),
        environment_id: environmentId,
        key: keyClean,
        encrypted_value: encryptedValue,
        iv: iv,
        created_by: user.id,
        updated_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.state.secrets.push(savedSecret);
    }

    // Update parent environment & project updated_at
    env.updated_at = new Date().toISOString();
    proj.updated_at = new Date().toISOString();

    this.addAuditLog({
      workspace_id: proj.workspace_id,
      user_id: user.id,
      user_email: user.email,
      action: actionType,
      resource_type: 'secret',
      resource_id: savedSecret.id,
      metadata: {
        key: keyClean,
        environment_name: env.name,
        project_name: proj.name,
      },
    });

    this.saveState(this.state);
    return savedSecret;
  }

  public deleteSecret(
    secretId: string,
    actorRole: 'admin' | 'member',
    user: User
  ): void {
    const sec = this.state.secrets.find((s) => s.id === secretId);
    if (!sec) return;

    // RLS check: members cannot delete unless they are the creator or an admin
    if (actorRole !== 'admin' && sec.created_by !== user.id) {
      throw new Error('RLS Violation: Only workspace Admins or the creator can delete secrets.');
    }

    const env = this.state.environments.find((e) => e.id === sec.environment_id);
    const proj = env ? this.state.projects.find((p) => p.id === env.project_id) : undefined;

    this.state.secrets = this.state.secrets.filter((s) => s.id !== secretId);

    if (proj && env) {
      this.addAuditLog({
        workspace_id: proj.workspace_id,
        user_id: user.id,
        user_email: user.email,
        action: 'deleted',
        resource_type: 'secret',
        resource_id: secretId,
        metadata: {
          key: sec.key,
          environment_name: env.name,
          project_name: proj.name,
        },
      });
    }

    this.saveState(this.state);
  }

  public bulkSaveSecrets(
    environmentId: string,
    items: Array<{ key: string; encryptedValue: string; iv: string }>,
    user: User
  ): void {
    for (const item of items) {
      this.saveSecret(environmentId, item.key, item.encryptedValue, item.iv, user);
    }
  }

  // KEY ROTATION: Replaces all encrypted values in a workspace
  public rotateAllWorkspaceSecrets(
    workspaceId: string,
    reEncryptedItems: Array<{ id: string; encryptedValue: string; iv: string }>,
    newSalt: string,
    user: User
  ): void {
    const ws = this.state.workspaces.find((w) => w.id === workspaceId);
    if (!ws) throw new Error('Workspace not found');

    for (const item of reEncryptedItems) {
      const sec = this.state.secrets.find((s) => s.id === item.id);
      if (sec) {
        sec.encrypted_value = item.encryptedValue;
        sec.iv = item.iv;
        sec.updated_by = user.id;
        sec.updated_at = new Date().toISOString();
      }
    }

    ws.encryption_key_salt = newSalt;
    ws.updated_at = new Date().toISOString();

    this.addAuditLog({
      workspace_id: workspaceId,
      user_id: user.id,
      user_email: user.email,
      action: 'rotated_keys',
      resource_type: 'workspace',
      resource_id: workspaceId,
      metadata: { count: reEncryptedItems.length, details: 'Rotated workspace encryption key and re-encrypted secrets' },
    });

    this.saveState(this.state);
  }

  // AUDIT LOGS
  public getAuditLogs(workspaceId: string): AuditLog[] {
    return this.state.auditLogs
      .filter((l) => l.workspace_id === workspaceId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(newLog);
    // Keep max 200 logs
    if (this.state.auditLogs.length > 200) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 200);
    }
    return newLog;
  }

  // API KEYS
  public getApiKeys(workspaceId: string): ApiKey[] {
    return this.state.apiKeys.filter((k) => k.workspace_id === workspaceId);
  }

  public createApiKey(
    workspaceId: string,
    name: string,
    user: User
  ): { apiKey: ApiKey; rawKey: string } {
    const randomHex = Array.from(window.crypto.getRandomValues(new Uint8Array(20)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const rawKey = `env_sec_${randomHex}`;
    const keyPrefix = rawKey.substring(0, 16) + '...';

    const apiKey: ApiKey = {
      id: 'key-' + Math.random().toString(36).substring(2, 9),
      workspace_id: workspaceId,
      name,
      key_prefix: keyPrefix,
      key_hash: rawKey.slice(-16), // simple demonstration hash
      created_at: new Date().toISOString(),
      last_used_at: null,
      expires_at: null,
    };

    this.state.apiKeys.unshift(apiKey);

    this.addAuditLog({
      workspace_id: workspaceId,
      user_id: user.id,
      user_email: user.email,
      action: 'created',
      resource_type: 'api_key',
      resource_id: apiKey.id,
      metadata: { key_name: name },
    });

    this.saveState(this.state);
    return { apiKey, rawKey };
  }

  public deleteApiKey(apiKeyId: string, actorRole: 'admin' | 'member'): void {
    if (actorRole !== 'admin') {
      throw new Error('RLS Violation: Only workspace Admins can revoke API keys.');
    }
    this.state.apiKeys = this.state.apiKeys.filter((k) => k.id !== apiKeyId);
    this.saveState(this.state);
  }

  // SUPABASE CONFIG
  public setSupabaseConfig(url: string, anonKey: string): void {
    this.state.supabaseConfig = { url, anonKey };
    this.saveState(this.state);
  }

  public getSupabaseConfig(): { url: string; anonKey: string } | undefined {
    return this.state.supabaseConfig;
  }
}

export const db = new StorageEngine();
