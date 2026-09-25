import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace, Role } from '../types';
import { db, DEMO_USERS } from '../lib/storage';
import { deriveKey, encrypt, decrypt } from '../lib/encryption';

interface AuthContextType {
  user: User | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  userRole: Role;
  encryptionKey: CryptoKey | null;
  isKeyUnlocked: boolean;
  masterPassphrase: string | null;
  login: (email: string, pass: string, masterPassphrase?: string) => Promise<boolean>;
  signup: (email: string, name: string, pass: string, masterPassphrase: string) => Promise<boolean>;
  logout: () => void;
  switchWorkspace: (workspaceId: string) => void;
  unlockEncryptionKey: (passphrase: string) => Promise<boolean>;
  lockEncryptionKey: () => void;
  switchDemoUser: (userId: string) => void;
  refreshWorkspaces: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_DEMO_PASSPHRASE = 'confidant-demo-key';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user defaults to Alex (Admin)
  const [user, setUser] = useState<User | null>(DEMO_USERS[0]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [masterPassphrase, setMasterPassphrase] = useState<string | null>(DEFAULT_DEMO_PASSPHRASE);
  const [isKeyUnlocked, setIsKeyUnlocked] = useState<boolean>(false);

  // Load workspaces on user change
  useEffect(() => {
    if (user) {
      const userWorkspaces = db.getWorkspaces(user.id);
      setWorkspaces(userWorkspaces);
      if (userWorkspaces.length > 0) {
        // preserve current workspace if valid, else pick first
        if (!currentWorkspace || !userWorkspaces.find((w) => w.id === currentWorkspace.id)) {
          setCurrentWorkspace(userWorkspaces[0]);
        }
      } else {
        setCurrentWorkspace(null);
      }
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
    }
  }, [user]);

  // Derive key whenever current workspace or masterPassphrase changes
  useEffect(() => {
    let isCancelled = false;

    async function initKey() {
      if (!currentWorkspace || !masterPassphrase) {
        setEncryptionKey(null);
        setIsKeyUnlocked(false);
        return;
      }

      try {
        const key = await deriveKey(masterPassphrase, currentWorkspace.encryption_key_salt);
        if (!isCancelled) {
          setEncryptionKey(key);
          setIsKeyUnlocked(true);

          // Seed default sample secrets if ecommerce project is empty
          seedInitialEncryptedSecrets(currentWorkspace.id, key, user || DEMO_USERS[0]);
        }
      } catch (err) {
        console.error('Failed to derive encryption key:', err);
        if (!isCancelled) {
          setEncryptionKey(null);
          setIsKeyUnlocked(false);
        }
      }
    }

    initKey();

    return () => {
      isCancelled = true;
    };
  }, [currentWorkspace, masterPassphrase]);

  // Seed sample real-looking secrets client-side encrypted
  const seedInitialEncryptedSecrets = async (workspaceId: string, key: CryptoKey, author: User) => {
    const projects = db.getProjects(workspaceId);
    const ecommerceProj = projects.find((p) => p.name.includes('Ecommerce') || p.id === 'proj-ecommerce-api');
    if (!ecommerceProj) return;

    const envs = db.getEnvironments(ecommerceProj.id);
    const devEnv = envs.find((e) => e.name === 'development');
    const prodEnv = envs.find((e) => e.name === 'production');

    if (devEnv) {
      const currentSecrets = db.getSecrets(devEnv.id);
      if (currentSecrets.length <= 1) {
        const samples = [
          { key: 'DATABASE_URL', value: 'postgres://acme_dev:secret99@localhost:5432/ecommerce_dev' },
          { key: 'STRIPE_SECRET_KEY', value: 'sk_test_51MzDemoKeyExample92742918349' },
          { key: 'JWT_SECRET', value: 'super-secure-jwt-signing-secret-key-32chars' },
          { key: 'REDIS_URL', value: 'redis://localhost:6379' },
          { key: 'PORT', value: '8080' },
          { key: 'AWS_S3_BUCKET', value: 'acme-dev-uploads' },
        ];

        for (const item of samples) {
          const enc = await encrypt(item.value, key);
          db.saveSecret(devEnv.id, item.key, enc.ciphertext, enc.iv, author);
        }
      }
    }

    if (prodEnv) {
      const currentSecrets = db.getSecrets(prodEnv.id);
      if (currentSecrets.length === 0) {
        const samples = [
          { key: 'DATABASE_URL', value: 'postgres://acme_prod:complexP@ss_9918@aws-rds.cluster.internal:5432/ecommerce_prod' },
          { key: 'STRIPE_SECRET_KEY', value: 'sk_live_51MzLiveStripeToken992817420' },
          { key: 'JWT_SECRET', value: 'prod-jwt-hyper-entropy-99482710129a8f' },
          { key: 'REDIS_URL', value: 'rediss://default:mYTok3n@upstash-redis-prod.io:6379' },
          { key: 'AWS_S3_BUCKET', value: 'acme-prod-media-cdn' },
          { key: 'AWS_ACCESS_KEY_ID', value: 'AKIAIOSFODNN7EXAMPLE' },
          { key: 'AWS_SECRET_ACCESS_KEY', value: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' },
        ];

        for (const item of samples) {
          const enc = await encrypt(item.value, key);
          db.saveSecret(prodEnv.id, item.key, enc.ciphertext, enc.iv, author);
        }
      }
    }
  };

  const userRole: Role = currentWorkspace && user
    ? db.getMemberRole(currentWorkspace.id, user.id) || 'member'
    : 'admin';

  const unlockEncryptionKey = async (passphrase: string): Promise<boolean> => {
    if (!currentWorkspace) return false;
    try {
      const key = await deriveKey(passphrase, currentWorkspace.encryption_key_salt);
      setEncryptionKey(key);
      setMasterPassphrase(passphrase);
      setIsKeyUnlocked(true);
      return true;
    } catch {
      return false;
    }
  };

  const lockEncryptionKey = () => {
    setEncryptionKey(null);
    setMasterPassphrase(null);
    setIsKeyUnlocked(false);
  };

  const switchWorkspace = (workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      setCurrentWorkspace(ws);
    }
  };

  const switchDemoUser = (userId: string) => {
    const selected = DEMO_USERS.find((u) => u.id === userId);
    if (selected) {
      setUser(selected);
    }
  };

  const login = async (email: string, _pass: string, passphrase = DEFAULT_DEMO_PASSPHRASE): Promise<boolean> => {
    const existing = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setUser(existing);
      setMasterPassphrase(passphrase);
      return true;
    }
    // New user session
    const newUser: User = {
      id: 'user-' + Math.random().toString(36).substring(2, 9),
      email,
      name: email.split('@')[0],
      created_at: new Date().toISOString(),
    };
    setUser(newUser);
    // ensure user has a personal workspace
    const personalWs = db.createWorkspace(`${newUser.name}'s Personal Workspace`, 'a1b2c3d4e5f60718293a4b5c6d7e8f90', newUser);
    setCurrentWorkspace(personalWs);
    setMasterPassphrase(passphrase);
    return true;
  };

  const signup = async (email: string, name: string, _pass: string, passphrase = DEFAULT_DEMO_PASSPHRASE): Promise<boolean> => {
    const newUser: User = {
      id: 'user-' + Math.random().toString(36).substring(2, 9),
      email,
      name,
      created_at: new Date().toISOString(),
    };
    setUser(newUser);
    const personalWs = db.createWorkspace(`${name}'s Workspace`, 'a1b2c3d4e5f60718293a4b5c6d7e8f90', newUser);
    setCurrentWorkspace(personalWs);
    setMasterPassphrase(passphrase);
    return true;
  };

  const logout = () => {
    setUser(null);
    setCurrentWorkspace(null);
    setEncryptionKey(null);
    setMasterPassphrase(null);
    setIsKeyUnlocked(false);
  };

  const refreshWorkspaces = () => {
    if (user) {
      const userWorkspaces = db.getWorkspaces(user.id);
      setWorkspaces(userWorkspaces);
      if (currentWorkspace) {
        const updated = userWorkspaces.find((w) => w.id === currentWorkspace.id);
        if (updated) setCurrentWorkspace(updated);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentWorkspace,
        workspaces,
        userRole,
        encryptionKey,
        isKeyUnlocked,
        masterPassphrase,
        login,
        signup,
        logout,
        switchWorkspace,
        unlockEncryptionKey,
        lockEncryptionKey,
        switchDemoUser,
        refreshWorkspaces,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
