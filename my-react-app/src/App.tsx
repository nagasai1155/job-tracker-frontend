import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { JobTracker } from './components/JobTracker';
import { ResumeBuilder } from './resume/ResumeBuilder';
import { InterviewPage } from './interview/InterviewPage';
import { AppSidebar } from './components/AppSidebar';
import { AppHeader } from './components/AppHeader';
import { AIChatBot } from './components/AIChatBot';
import { ResumeProvider } from './resume/ResumeContext';
import { AppTab } from './types';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('job_tracker_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('job_tracker_sidebar_collapsed', String(isCollapsed));
    } catch {}
  }, [isCollapsed]);

  if (!user) return <LoginScreen />;

  const isDashboardView = activeTab === 'dashboard';

  return (
    <div className={`app-shell-saas ${isDashboardView ? 'dashboard-hub-mode' : ''}`}>
      {/* Sidebar with collapse feature, navigation, email profile, and logout */}
      <AppSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div
        className={`app-main-layout ${
          isCollapsed ? 'sidebar-is-collapsed' : 'sidebar-is-expanded'
        }`}
      >
        {/* AppHeader ONLY appears on the dashboard page, not on the 3 separated cards */}
        {isDashboardView && (
          <AppHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        <main className={`app-main-viewport ${isDashboardView ? 'hub-viewport' : 'workspace-viewport'}`}>
          {activeTab === 'dashboard' ? (
            <Dashboard
              onSelectFeature={setActiveTab}
            />
          ) : activeTab === 'jobs' ? (
            <JobTracker
              onBackToDashboard={() => setActiveTab('dashboard')}
              onTabChange={setActiveTab}
            />
          ) : activeTab === 'resume' ? (
            <ResumeBuilder
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          ) : (
            <InterviewPage
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}
        </main>
        <AIChatBot />
      </div>
    </div>
  );
}

function App() {
  return (
    <ResumeProvider>
      <AppContent />
    </ResumeProvider>
  );
}

export default App;
