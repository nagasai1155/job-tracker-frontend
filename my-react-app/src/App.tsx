import React from 'react';
import { useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';

function App() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <LoginScreen />;
}

export default App;
