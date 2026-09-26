export type Role = 'admin' | 'member';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  encryption_key_salt: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  role: Role;
  invited_at: string;
  accepted_at: string | null;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Environment {
  id: string;
  project_id: string;
  name: 'development' | 'staging' | 'production' | string;
  created_at: string;
  updated_at: string;
}

export interface Secret {
  id: string;
  environment_id: string;
  key: string;
  encrypted_value: string; // Base64 ciphertext
  iv: string; // Base64 IV
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  rotation_interval_days?: number | null; // e.g. 30, 60, 90, null
  rotation_strategy?: 'generate_alphanumeric' | 'generate_hex' | 'generate_uuid' | 'manual_update' | null;
  rotation_key_length?: number | null; // e.g. 16, 24, 32, 64
  last_rotated_at?: string | null;
  next_rotation_due?: string | null;
}

export interface DecryptedSecret extends Secret {
  value: string; // Plaintext in memory only
}

export interface AuditLog {
  id: string;
  workspace_id: string;
  user_id: string;
  user_email: string;
  action: 'created' | 'updated' | 'deleted' | 'viewed' | 'rotated_keys';
  resource_type: 'secret' | 'project' | 'environment' | 'workspace' | 'api_key';
  resource_id: string;
  metadata: {
    key?: string;
    environment_name?: string;
    project_name?: string;
    details?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

export interface ApiKey {
  id: string;
  workspace_id: string;
  name: string;
  key_prefix: string; // e.g., 'env_sec_...'
  key_hash: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export interface TransferRecord {
  id: string;
  workspace_id: string;
  project_id: string;
  project_name: string;
  environment_id: string;
  environment_name: string;
  type: 'import' | 'export' | 'revert';
  source_label: string; // e.g. '.env.production', 'Web Export', 'CLI sync', 'Rollback'
  user_id: string;
  user_email: string;
  user_name: string;
  created_at: string;
  added_keys: string[];
  updated_keys: string[];
  unchanged_keys_count: number;
  total_keys: number;
  reverted_at?: string | null;
  reverted_by?: string | null;
  snapshot_before: Secret[]; // encrypted backup before the transfer
  snapshot_after: Secret[];  // encrypted backup after the transfer
  checksum: string;
  notes?: string;
}

export interface WebhookConfig {
  id: string;
  project_id: string;
  name: string;
  url: string;
  secret_token: string;
  active: boolean;
  events: ('secret.created' | 'secret.updated' | 'secret.deleted' | 'secret.reverted')[];
  created_at: string;
  updated_at: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhook_id: string;
  project_id: string;
  event: string;
  url: string;
  status_code: number | null;
  success: boolean;
  duration_ms: number;
  request_payload: string;
  request_headers: Record<string, string>;
  response_body: string;
  created_at: string;
}

