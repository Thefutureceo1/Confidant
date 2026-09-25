export type CloudProviderId =
  | 'vercel'
  | 'aws'
  | 'cloudflare'
  | 'github'
  | 'railway'
  | 'fly';

export interface CloudProviderInfo {
  id: CloudProviderId;
  name: string;
  tagline: string;
  color: string;
  badgeBg: string;
  iconName: string;
  fields: Array<{
    key: string;
    label: string;
    placeholder: string;
    type: 'text' | 'password';
    required: boolean;
    helper?: string;
  }>;
}

export interface CloudIntegration {
  id: string;
  workspace_id: string;
  provider: CloudProviderId;
  name: string;
  config: {
    token?: string;
    projectId?: string;
    targetEnv?: string;
    region?: string;
    repoName?: string;
    accountId?: string;
    serviceId?: string;
    [key: string]: string | undefined;
  };
  last_synced_at: string | null;
  last_synced_count: number;
  status: 'connected' | 'idle' | 'syncing' | 'error';
  auto_sync: boolean;
  created_at: string;
}

export interface SyncLogItem {
  id: string;
  provider: CloudProviderId;
  project_name: string;
  environment_name: string;
  variable_count: number;
  timestamp: string;
  status: 'success' | 'failed';
  details: string;
}
