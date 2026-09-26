import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, Environment, Secret, DecryptedSecret, AuditLog, ApiKey, WorkspaceMember, TransferRecord } from '../types';
import { db } from '../lib/storage';
import { useAuth } from './AuthContext';
import { encrypt, decrypt, deriveKey, generateSalt } from '../lib/encryption';
import { dispatchWebhooks } from '../lib/webhookDispatcher';

interface WorkspaceContextType {
  projects: Project[];
  selectedProject: Project | null;
  selectedEnvironment: Environment | null;
  environments: Environment[];
  secrets: Secret[];
  decryptedSecrets: DecryptedSecret[];
  isLoadingSecrets: boolean;
  decryptionError: string | null;
  members: WorkspaceMember[];
  auditLogs: AuditLog[];
  apiKeys: ApiKey[];
  transfers: TransferRecord[];
  setSelectedProject: (p: Project | null) => void;
  setSelectedEnvironment: (e: Environment | null) => void;
  getProjectEnvironments: (projectId: string) => Environment[];
  getEnvironmentSecretCount: (envId: string) => number;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  createEnvironment: (projectId: string, name: string) => Promise<Environment>;
  deleteEnvironment: (envId: string) => Promise<void>;
  saveSecret: (
    environmentId: string,
    key: string,
    plainValue: string,
    rotationIntervalDays?: number | null,
    rotationStrategy?: 'generate_alphanumeric' | 'generate_hex' | 'generate_uuid' | 'manual_update' | null,
    rotationKeyLength?: number | null,
    lastRotatedAt?: string | null,
    nextRotationDue?: string | null
  ) => Promise<Secret>;
  deleteSecret: (secretId: string) => Promise<void>;
  bulkImport: (environmentId: string, envContent: string, overwriteExisting: boolean, sourceFilename?: string) => Promise<{ added: number; updated: number }>;
  exportAsEnvString: (environmentId: string, sourceLabel?: string) => Promise<string>;
  revertTransfer: (transferId: string) => Promise<{ success: boolean; restoredCount: number; message: string }>;
  rotateWorkspaceKeys: (newPassphrase: string) => Promise<void>;
  inviteMember: (email: string, role: 'admin' | 'member') => Promise<WorkspaceMember>;
  updateMemberRole: (memberId: string, role: 'admin' | 'member') => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  createApiKey: (name: string) => Promise<{ apiKey: ApiKey; rawKey: string }>;
  deleteApiKey: (id: string) => Promise<void>;
  refreshAll: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentWorkspace, user, userRole, encryptionKey, isKeyUnlocked } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [decryptedSecrets, setDecryptedSecrets] = useState<DecryptedSecret[]>([]);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState<boolean>(false);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);

  // Load workspace level data
  const refreshWorkspaceData = useCallback(() => {
    if (!currentWorkspace) {
      setProjects([]);
      setMembers([]);
      setAuditLogs([]);
      setApiKeys([]);
      setTransfers([]);
      setSelectedProject(null);
      setSelectedEnvironment(null);
      return;
    }

    const projs = db.getProjects(currentWorkspace.id);
    setProjects(projs);

    const mems = db.getMembers(currentWorkspace.id);
    setMembers(mems);

    const logs = db.getAuditLogs(currentWorkspace.id);
    setAuditLogs(logs);

    const keys = db.getApiKeys(currentWorkspace.id);
    setApiKeys(keys);

    const trs = db.getTransfers(currentWorkspace.id);
    setTransfers(trs);

    if (selectedProject) {
      const updated = projs.find((p) => p.id === selectedProject.id);
      setSelectedProject(updated || projs[0] || null);
    }
  }, [currentWorkspace, selectedProject]);

  useEffect(() => {
    refreshWorkspaceData();
  }, [currentWorkspace]);

  // Load environments for selected project
  useEffect(() => {
    if (selectedProject) {
      const envs = db.getEnvironments(selectedProject.id);
      setEnvironments(envs);
      if (selectedEnvironment) {
        const updatedEnv = envs.find((e) => e.id === selectedEnvironment.id);
        setSelectedEnvironment(updatedEnv || envs[0] || null);
      } else if (envs.length > 0) {
        setSelectedEnvironment(envs[0]);
      }
    } else {
      setEnvironments([]);
      setSelectedEnvironment(null);
    }
  }, [selectedProject]);

  // Decrypt secrets for selected environment
  useEffect(() => {
    let isCancelled = false;

    async function loadAndDecrypt() {
      if (!selectedEnvironment) {
        setSecrets([]);
        setDecryptedSecrets([]);
        setDecryptionError(null);
        return;
      }

      const rawSecrets = db.getSecrets(selectedEnvironment.id);
      setSecrets(rawSecrets);

      if (!isKeyUnlocked || !encryptionKey) {
        // Masked or un-decryptable state
        setDecryptedSecrets([]);
        setDecryptionError('Encryption key is locked. Enter your master passphrase to decrypt.');
        return;
      }

      setIsLoadingSecrets(true);
      setDecryptionError(null);

      try {
        const decryptedList: DecryptedSecret[] = [];
        for (const sec of rawSecrets) {
          try {
            const val = await decrypt(sec.encrypted_value, sec.iv, encryptionKey);
            decryptedList.push({
              ...sec,
              value: val,
            });
          } catch (e) {
            decryptedList.push({
              ...sec,
              value: '[DECRYPTION_ERROR: Invalid Key]',
            });
          }
        }

        if (!isCancelled) {
          setDecryptedSecrets(decryptedList);
          setIsLoadingSecrets(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setDecryptionError('Failed to decrypt environment variables.');
          setIsLoadingSecrets(false);
        }
      }
    }

    loadAndDecrypt();

    return () => {
      isCancelled = true;
    };
  }, [selectedEnvironment, encryptionKey, isKeyUnlocked]);

  const getProjectEnvironments = (projectId: string) => {
    return db.getEnvironments(projectId);
  };

  const getEnvironmentSecretCount = (envId: string) => {
    return db.getSecrets(envId).length;
  };

  const createProject = async (name: string, description?: string): Promise<Project> => {
    if (!currentWorkspace || !user) throw new Error('Not authenticated');
    const { project } = db.createProject(currentWorkspace.id, name, description, user);
    refreshWorkspaceData();
    setSelectedProject(project);
    return project;
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
    if (!user) throw new Error('Not authenticated');
    const updated = db.updateProject(id, updates, user);
    refreshWorkspaceData();
    return updated;
  };

  const deleteProject = async (id: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    db.deleteProject(id, userRole, user);
    if (selectedProject?.id === id) {
      setSelectedProject(null);
      setSelectedEnvironment(null);
    }
    refreshWorkspaceData();
  };

  const createEnvironment = async (projectId: string, name: string): Promise<Environment> => {
    if (!user) throw new Error('Not authenticated');
    const newEnv = db.createEnvironment(projectId, name, user);
    const envs = db.getEnvironments(projectId);
    setEnvironments(envs);
    setSelectedEnvironment(newEnv);
    refreshWorkspaceData();
    return newEnv;
  };

  const deleteEnvironment = async (envId: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    db.deleteEnvironment(envId, userRole, user);
    if (selectedProject) {
      const envs = db.getEnvironments(selectedProject.id);
      setEnvironments(envs);
      if (selectedEnvironment?.id === envId) {
        setSelectedEnvironment(envs[0] || null);
      }
    }
    refreshWorkspaceData();
  };

  const saveSecret = async (
    environmentId: string,
    key: string,
    plainValue: string,
    rotationIntervalDays?: number | null,
    rotationStrategy?: 'generate_alphanumeric' | 'generate_hex' | 'generate_uuid' | 'manual_update' | null,
    rotationKeyLength?: number | null,
    lastRotatedAt?: string | null,
    nextRotationDue?: string | null
  ): Promise<Secret> => {
    if (!user) throw new Error('Not authenticated');
    if (!encryptionKey) throw new Error('Encryption key is locked. Please unlock before adding secrets.');

    const isUpdate = db.getSecrets(environmentId).some((s) => s.key === key);

    // Client-side AES-256-GCM encryption
    const encrypted = await encrypt(plainValue, encryptionKey);
    const saved = db.saveSecret(
      environmentId,
      key,
      encrypted.ciphertext,
      encrypted.iv,
      user,
      rotationIntervalDays,
      rotationStrategy,
      rotationKeyLength,
      lastRotatedAt,
      nextRotationDue
    );

    // Refresh state
    const rawSecrets = db.getSecrets(environmentId);
    setSecrets(rawSecrets);

    // Update decrypted list
    setDecryptedSecrets((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id || s.key === saved.key);
      const dec: DecryptedSecret = { ...saved, value: plainValue };
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = dec;
        return copy;
      }
      return [...prev, dec];
    });

    refreshWorkspaceData();

    // Trigger webhook trigger
    const env = db.getEnvironment(environmentId);
    if (env) {
      dispatchWebhooks(env.project_id, isUpdate ? 'secret.updated' : 'secret.created', {
        environment_id: env.id,
        environment_name: env.name,
        actor_email: user.email,
        actor_name: user.name,
        impacted_keys: [key],
      }).catch((e) => console.error('Webhook dispatcher failure:', e));
    }

    return saved;
  };

  const deleteSecret = async (secretId: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    const secret = db.getState().secrets.find((s) => s.id === secretId);
    if (secret) {
      const key = secret.key;
      const environmentId = secret.environment_id;

      db.deleteSecret(secretId, userRole, user);
      if (selectedEnvironment) {
        setSecrets(db.getSecrets(selectedEnvironment.id));
        setDecryptedSecrets((prev) => prev.filter((s) => s.id !== secretId));
      }
      refreshWorkspaceData();

      const env = db.getEnvironment(environmentId);
      if (env) {
        dispatchWebhooks(env.project_id, 'secret.deleted', {
          environment_id: env.id,
          environment_name: env.name,
          actor_email: user.email,
          actor_name: user.name,
          impacted_keys: [key],
        }).catch((e) => console.error('Webhook dispatcher failure:', e));
      }
    }
  };

  const bulkImport = async (
    environmentId: string,
    envContent: string,
    overwriteExisting: boolean,
    sourceFilename?: string
  ): Promise<{ added: number; updated: number }> => {
    if (!user || !encryptionKey || !currentWorkspace) throw new Error('Encryption key is not available.');

    const snapshotBefore = db.getSecrets(environmentId).map((s) => ({ ...s }));
    const lines = envContent.split(/\r?\n/);
    const existing = db.getSecrets(environmentId);
    const existingKeys = new Set(existing.map((s) => s.key));

    let added = 0;
    let updated = 0;
    const addedKeys: string[] = [];
    const updatedKeys: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      // Skip empty or comment lines
      if (!line || line.startsWith('#')) continue;

      const equalIndex = line.indexOf('=');
      if (equalIndex === -1) continue;

      let key = line.slice(0, equalIndex).trim().toUpperCase();
      let value = line.slice(equalIndex + 1).trim();

      // Clean wrapping quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Validate key name
      if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
        continue;
      }

      if (existingKeys.has(key) && !overwriteExisting) {
        continue;
      }

      const enc = await encrypt(value, encryptionKey);
      db.saveSecret(environmentId, key, enc.ciphertext, enc.iv, user);

      if (existingKeys.has(key)) {
        updated++;
        updatedKeys.push(key);
      } else {
        added++;
        addedKeys.push(key);
        existingKeys.add(key);
      }
    }

    const snapshotAfter = db.getSecrets(environmentId).map((s) => ({ ...s }));
    const env = db.getEnvironment(environmentId);
    const proj = env ? db.getProject(env.project_id) : undefined;

    // Track transfer snapshot for 1-click safe revert
    db.addTransfer({
      workspace_id: currentWorkspace.id,
      project_id: proj?.id || '',
      project_name: proj?.name || 'Project',
      environment_id: environmentId,
      environment_name: env?.name || 'environment',
      type: 'import',
      source_label: sourceFilename || '.env import',
      user_id: user.id,
      user_email: user.email,
      user_name: user.name,
      added_keys: addedKeys,
      updated_keys: updatedKeys,
      unchanged_keys_count: Math.max(0, snapshotBefore.length - updatedKeys.length),
      total_keys: snapshotAfter.length,
      snapshot_before: snapshotBefore,
      snapshot_after: snapshotAfter,
      checksum: 'sha256:' + Math.random().toString(36).substring(2, 10),
      notes: `Bulk import: ${added} added, ${updated} updated (${snapshotAfter.length} total variables)`,
    });

    if (selectedEnvironment && selectedEnvironment.id === environmentId) {
      const rawSecrets = db.getSecrets(environmentId);
      setSecrets(rawSecrets);
      const decList: DecryptedSecret[] = [];
      for (const s of rawSecrets) {
        try {
          const val = await decrypt(s.encrypted_value, s.iv, encryptionKey);
          decList.push({ ...s, value: val });
        } catch {
          decList.push({ ...s, value: '[DECRYPT_ERROR]' });
        }
      }
      setDecryptedSecrets(decList);
    }

    refreshWorkspaceData();

    // Trigger webhook trigger
    if (env && proj) {
      const impactedKeys = [...addedKeys, ...updatedKeys];
      dispatchWebhooks(proj.id, 'secret.updated', {
        environment_id: env.id,
        environment_name: env.name,
        actor_email: user.email,
        actor_name: user.name,
        impacted_keys: impactedKeys,
        notes: `Bulk import: ${added} added, ${updated} updated via ${sourceFilename || 'file'}`,
      }).catch((e) => console.error('Webhook dispatcher failure:', e));
    }

    return { added, updated };
  };

  const exportAsEnvString = async (environmentId: string, sourceLabel = 'Downloaded .env'): Promise<string> => {
    if (!encryptionKey || !currentWorkspace || !user) throw new Error('Encryption key is locked.');
    const rawSecrets = db.getSecrets(environmentId);
    const env = db.getEnvironment(environmentId);
    const proj = env ? db.getProject(env.project_id) : undefined;
    const lines: string[] = [
      `# Generated by Confidant (${env?.name || 'environment'})`,
      `# Exported at: ${new Date().toISOString()}`,
      `# WARNING: Plaintext secrets. Do not commit to version control.`,
      '',
    ];

    for (const s of rawSecrets) {
      try {
        const val = await decrypt(s.encrypted_value, s.iv, encryptionKey);
        // If value contains spaces, quotes, or newlines, quote it
        const formatted = /[\s"#']/.test(val) ? `"${val.replace(/"/g, '\\"')}"` : val;
        lines.push(`${s.key}=${formatted}`);
      } catch {
        lines.push(`${s.key}=# [DECRYPTION_ERROR]`);
      }
    }

    // Log export event in transfers
    db.addTransfer({
      workspace_id: currentWorkspace.id,
      project_id: proj?.id || '',
      project_name: proj?.name || 'Project',
      environment_id: environmentId,
      environment_name: env?.name || 'environment',
      type: 'export',
      source_label: sourceLabel,
      user_id: user.id,
      user_email: user.email,
      user_name: user.name,
      added_keys: [],
      updated_keys: [],
      unchanged_keys_count: rawSecrets.length,
      total_keys: rawSecrets.length,
      snapshot_before: [],
      snapshot_after: [],
      checksum: 'sha256:' + Math.random().toString(36).substring(2, 10),
      notes: `Exported ${rawSecrets.length} plaintext decrypted variables`,
    });

    refreshWorkspaceData();
    return lines.join('\n');
  };

  const revertTransfer = async (
    transferId: string
  ): Promise<{ success: boolean; restoredCount: number; message: string }> => {
    if (!user || !encryptionKey || !currentWorkspace) throw new Error('Encryption key is locked.');
    const target = db.getTransfer(transferId);
    if (!target) throw new Error('Transfer record not found.');

    const res = db.revertTransfer(transferId, user);
    refreshWorkspaceData();

    if (selectedEnvironment && selectedEnvironment.id === target.environment_id) {
      const rawSecrets = db.getSecrets(target.environment_id);
      setSecrets(rawSecrets);
      const decList: DecryptedSecret[] = [];
      for (const s of rawSecrets) {
        try {
          const val = await decrypt(s.encrypted_value, s.iv, encryptionKey);
          decList.push({ ...s, value: val });
        } catch {
          decList.push({ ...s, value: '[DECRYPT_ERROR]' });
        }
      }
      setDecryptedSecrets(decList);
    }

    // Trigger webhook trigger
    dispatchWebhooks(target.project_id, 'secret.reverted', {
      environment_id: target.environment_id,
      environment_name: target.environment_name,
      actor_email: user.email,
      actor_name: user.name,
      impacted_keys: target.snapshot_before.map((s) => s.key),
      notes: `Reverted to snapshot from transfer ID: ${transferId.slice(0, 10)}`,
    }).catch((e) => console.error('Webhook dispatcher failure:', e));

    return res;
  };

  // Re-encrypt all workspace secrets with a newly derived key and salt
  const rotateWorkspaceKeys = async (newPassphrase: string): Promise<void> => {
    if (!currentWorkspace || !user || !encryptionKey) throw new Error('Cannot rotate keys');
    if (userRole !== 'admin') throw new Error('Only Admins can rotate workspace encryption keys.');

    const newSalt = generateSalt();
    const newKey = await deriveKey(newPassphrase, newSalt);

    // Get all projects and environments in this workspace
    const wsProjects = db.getProjects(currentWorkspace.id);
    const projectIds = wsProjects.map((p) => p.id);
    const allEnvs = db.getState().environments.filter((e) => projectIds.includes(e.project_id));
    const envIds = allEnvs.map((e) => e.id);
    const allSecrets = db.getState().secrets.filter((s) => envIds.includes(s.environment_id));

    const reEncryptedItems: Array<{ id: string; encryptedValue: string; iv: string }> = [];

    for (const sec of allSecrets) {
      let plaintext = '';
      try {
        plaintext = await decrypt(sec.encrypted_value, sec.iv, encryptionKey);
      } catch {
        continue;
      }
      const newEnc = await encrypt(plaintext, newKey);
      reEncryptedItems.push({
        id: sec.id,
        encryptedValue: newEnc.ciphertext,
        iv: newEnc.iv,
      });
    }

    db.rotateAllWorkspaceSecrets(currentWorkspace.id, reEncryptedItems, newSalt, user);
    refreshWorkspaceData();
  };

  const inviteMember = async (email: string, role: 'admin' | 'member'): Promise<WorkspaceMember> => {
    if (!currentWorkspace || !user) throw new Error('Not authenticated');
    const newMember = db.inviteMember(currentWorkspace.id, email, role, user);
    setMembers(db.getMembers(currentWorkspace.id));
    refreshWorkspaceData();
    return newMember;
  };

  const updateMemberRole = async (memberId: string, role: 'admin' | 'member'): Promise<void> => {
    db.updateMemberRole(memberId, role, userRole);
    if (currentWorkspace) setMembers(db.getMembers(currentWorkspace.id));
  };

  const removeMember = async (memberId: string): Promise<void> => {
    db.removeMember(memberId, userRole);
    if (currentWorkspace) setMembers(db.getMembers(currentWorkspace.id));
  };

  const createApiKey = async (name: string): Promise<{ apiKey: ApiKey; rawKey: string }> => {
    if (!currentWorkspace || !user) throw new Error('Not authenticated');
    const res = db.createApiKey(currentWorkspace.id, name, user);
    setApiKeys(db.getApiKeys(currentWorkspace.id));
    refreshWorkspaceData();
    return res;
  };

  const deleteApiKey = async (id: string): Promise<void> => {
    db.deleteApiKey(id, userRole);
    if (currentWorkspace) setApiKeys(db.getApiKeys(currentWorkspace.id));
    refreshWorkspaceData();
  };

  return (
    <WorkspaceContext.Provider
      value={{
        projects,
        selectedProject,
        selectedEnvironment,
        environments,
        secrets,
        decryptedSecrets,
        isLoadingSecrets,
        decryptionError,
        members,
        auditLogs,
        apiKeys,
        transfers,
        setSelectedProject,
        setSelectedEnvironment,
        getProjectEnvironments,
        getEnvironmentSecretCount,
        createProject,
        updateProject,
        deleteProject,
        createEnvironment,
        deleteEnvironment,
        saveSecret,
        deleteSecret,
        bulkImport,
        exportAsEnvString,
        revertTransfer,
        rotateWorkspaceKeys,
        inviteMember,
        updateMemberRole,
        removeMember,
        createApiKey,
        deleteApiKey,
        refreshAll: refreshWorkspaceData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
