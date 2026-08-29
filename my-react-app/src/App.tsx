import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { ProfileSettings } from './components/ProfileSettings';
import { ResumeBuilder } from './resume/ResumeBuilder';
import { InterviewPage } from './interview/InterviewPage';
import { AppHeader } from './components/AppHeader';
import { AIChatBot } from './components/AIChatBot';

type Page = 'dashboard' | 'settings';
type AppTab = 'jobs' | 'resume' | 'interview';

function AppContent() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [activeTab, setActiveTab] = useState<AppTab>('jobs');

  if (!user) return <LoginScreen />;

  if (page === 'settings') {
    return <ProfileSettings onBack={() => setPage('dashboard')} />;
  }

  return (
    <div className="app-shell">
      <AppHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNavigate={setPage}
      />
      {activeTab === 'jobs' ? (
        <Dashboard onNavigate={setPage} />
      ) : activeTab === 'resume' ? (
        <ResumeBuilder onNavigate={setPage} />
      ) : (
        <InterviewPage onNavigate={setPage} />
      )}
      <AIChatBot />
    </div>
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
