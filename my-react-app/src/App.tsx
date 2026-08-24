import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { ProfileSettings } from './components/ProfileSettings';

type Page = 'dashboard' | 'settings';

function AppContent() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');

  if (!user) return <LoginScreen />;

  if (page === 'settings') {
    return <ProfileSettings onBack={() => setPage('dashboard')} />;
  }

  return <Dashboard onNavigate={(p) => setPage(p)} />;
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
