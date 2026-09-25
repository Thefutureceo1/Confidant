import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MasterKeyModal } from './components/MasterKeyModal';
import { CliModal } from './components/CliModal';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { CreateEnvironmentModal } from './components/CreateEnvironmentModal';
import { CreateWorkspaceModal } from './components/CreateWorkspaceModal';
import { DiffEnvModal } from './components/DiffEnvModal';
import { ImportEnvModal } from './components/ImportEnvModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { AuthModal } from './components/AuthModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { EnvironmentDetailPage } from './pages/EnvironmentDetailPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { AccountPage } from './pages/AccountPage';
import { Project, Environment } from './types';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeEnvironment, setActiveEnvironment] = useState<Environment | null>(null);

  // Modal open states
  const [cliModalOpen, setCliModalOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [masterKeyModalOpen, setMasterKeyModalOpen] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [newEnvironmentModalOpen, setNewEnvironmentModalOpen] = useState(false);
  const [newWorkspaceModalOpen, setNewWorkspaceModalOpen] = useState(false);
  const [diffProject, setDiffProject] = useState<Project | null>(null);
  const [importEnvModalOpen, setImportEnvModalOpen] = useState(false);
  const [cloudSyncModalOpen, setCloudSyncModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { projects, environments, bulkImport } = useWorkspace();

  // Global Keyboard Shortcuts (Cmd/Ctrl+K, Cmd/Ctrl+N, Cmd/Ctrl+I, Cmd/Ctrl+S, Cmd/Ctrl+J, ?, Esc)
  useKeyboardShortcuts({
    onOpenSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="Search variables"]') as HTMLInputElement;
      searchInput?.focus();
    },
    onOpenNewProject: () => setNewProjectModalOpen(true),
    onOpenImportEnv: () => setImportEnvModalOpen(true),
    onOpenMasterKey: () => setMasterKeyModalOpen(true),
    onOpenCli: () => setCliModalOpen(true),
    onOpenCloudSync: () => setCloudSyncModalOpen(true),
    onOpenShortcutsHelp: () => setShortcutsModalOpen(true),
    onCloseModals: () => {
      setCliModalOpen(false);
      setSupabaseModalOpen(false);
      setMasterKeyModalOpen(false);
      setNewProjectModalOpen(false);
      setNewEnvironmentModalOpen(false);
      setNewWorkspaceModalOpen(false);
      setDiffProject(null);
      setImportEnvModalOpen(false);
      setCloudSyncModalOpen(false);
      setShortcutsModalOpen(false);
      setAuthModalOpen(false);
    },
  });

  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    setCurrentPage('project-detail');
  };

  const handleSelectEnvironment = (project: Project, env: Environment) => {
    setActiveProject(project);
    setActiveEnvironment(env);
    setCurrentPage('environment-detail');
  };

  const handleBackToDashboard = () => {
    setActiveProject(null);
    setActiveEnvironment(null);
    setCurrentPage('dashboard');
  };

  const handleBackToProject = () => {
    setActiveEnvironment(null);
    setCurrentPage('project-detail');
  };

  const handleOpenDiff = (project: Project) => {
    setDiffProject(project);
  };

  return (
    <div className="min-h-screen bg-[#0b0d13] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => {
          if (page === 'dashboard') {
            setActiveProject(null);
            setActiveEnvironment(null);
          }
          setCurrentPage(page);
        }}
        onOpenCli={() => setCliModalOpen(true)}
        onOpenSupabase={() => setSupabaseModalOpen(true)}
        onOpenMasterKey={() => setMasterKeyModalOpen(true)}
        onOpenNewWorkspace={() => setNewWorkspaceModalOpen(true)}
        onOpenCloudSync={() => setCloudSyncModalOpen(true)}
        onOpenShortcutsHelp={() => setShortcutsModalOpen(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onSelectEnvironment={handleSelectEnvironment}
      />

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => {
            if (page === 'dashboard') {
              setActiveProject(null);
              setActiveEnvironment(null);
            }
            setCurrentPage(page);
          }}
          onOpenNewProject={() => setNewProjectModalOpen(true)}
          onOpenCli={() => setCliModalOpen(true)}
          onOpenCloudSync={() => setCloudSyncModalOpen(true)}
          onOpenShortcutsHelp={() => setShortcutsModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {currentPage === 'dashboard' && (
            <DashboardPage
              onOpenNewProject={() => setNewProjectModalOpen(true)}
              onOpenImportEnv={() => setImportEnvModalOpen(true)}
              onOpenCli={() => setCliModalOpen(true)}
              onOpenMasterKey={() => setMasterKeyModalOpen(true)}
              onOpenCloudSync={() => setCloudSyncModalOpen(true)}
              onSelectProject={handleSelectProject}
              onSelectEnvironment={handleSelectEnvironment}
              onDiffEnvironments={handleOpenDiff}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'project-detail' && activeProject && (
            <ProjectDetailPage
              project={activeProject}
              onBack={handleBackToDashboard}
              onSelectEnvironment={handleSelectEnvironment}
              onOpenCreateEnvironment={() => setNewEnvironmentModalOpen(true)}
              onDiffEnvironments={handleOpenDiff}
              onOpenCli={() => setCliModalOpen(true)}
            />
          )}

          {currentPage === 'environment-detail' && activeProject && activeEnvironment && (
            <EnvironmentDetailPage
              project={activeProject}
              environment={activeEnvironment}
              onBackToProject={handleBackToProject}
              onOpenCli={() => setCliModalOpen(true)}
              onOpenMasterKey={() => setMasterKeyModalOpen(true)}
              onOpenCloudSync={() => setCloudSyncModalOpen(true)}
            />
          )}

          {currentPage === 'audit-log' && <AuditLogPage />}

          {(currentPage === 'settings' || currentPage === 'cli-keys') && <SettingsPage />}

          {currentPage === 'account' && <AccountPage />}
        </main>
      </div>

      {/* Global Modals */}
      <MasterKeyModal
        isOpen={masterKeyModalOpen}
        onClose={() => setMasterKeyModalOpen(false)}
      />

      <CliModal
        isOpen={cliModalOpen}
        onClose={() => setCliModalOpen(false)}
      />

      <CloudSyncModal
        isOpen={cloudSyncModalOpen}
        onClose={() => setCloudSyncModalOpen(false)}
        initialProject={activeProject}
        initialEnvironment={activeEnvironment}
      />

      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <SupabaseSetupModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />

      <CreateProjectModal
        isOpen={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        onSuccess={(projId) => {
          const created = projects.find((p) => p.id === projId);
          if (created) {
            setActiveProject(created);
            setCurrentPage('project-detail');
          }
        }}
      />

      {activeProject && (
        <CreateEnvironmentModal
          isOpen={newEnvironmentModalOpen}
          onClose={() => setNewEnvironmentModalOpen(false)}
          projectId={activeProject.id}
        />
      )}

      <CreateWorkspaceModal
        isOpen={newWorkspaceModalOpen}
        onClose={() => setNewWorkspaceModalOpen(false)}
      />

      {diffProject && (
        <DiffEnvModal
          isOpen={!!diffProject}
          onClose={() => setDiffProject(null)}
          project={diffProject}
        />
      )}

      {/* Global Quick Import Modal */}
      {importEnvModalOpen && (
        <ImportEnvModal
          isOpen={importEnvModalOpen}
          onClose={() => setImportEnvModalOpen(false)}
          environmentName={
            activeEnvironment?.name ||
            (projects[0] ? environments.find((e) => e.project_id === projects[0].id)?.name || 'development' : 'development')
          }
          onImport={async (content, overwrite) => {
            const targetEnv =
              activeEnvironment ||
              (projects[0] ? environments.find((e) => e.project_id === projects[0].id) : null);
            if (!targetEnv) {
              throw new Error('Please select or create a project environment first.');
            }
            return bulkImport(targetEnv.id, content, overwrite);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <MainApp />
      </WorkspaceProvider>
    </AuthProvider>
  );
}
