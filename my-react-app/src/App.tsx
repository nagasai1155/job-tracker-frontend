import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { ProfileSettings } from './components/ProfileSettings';
import { ResumeBuilder } from './resume/ResumeBuilder';

type Page = 'dashboard' | 'settings';
type AppTab = 'jobs' | 'resume';

function AppContent() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [activeTab, setActiveTab] = useState<AppTab>('jobs');

  if (!user) return <LoginScreen />;

  if (page === 'settings') {
    return <ProfileSettings onBack={() => setPage('dashboard')} />;
  }

  if (activeTab === 'resume') {
    return (
      <ResumeBuilder
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNavigate={(p) => setPage(p)}
      />
    );
  }

  return (
    <Dashboard
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onNavigate={(p) => setPage(p)}
    />
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
