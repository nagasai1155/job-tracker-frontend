import React, { useRef, useCallback } from 'react';
import { useAuth, useGoogleAuth } from '../context/AuthContext';

export function LoginScreen() {
  const { login } = useAuth();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleLogin = useCallback((credential: string) => login(credential), [login]);
  const handleMockLogin = useCallback(() => login('', true), [login]);

  useGoogleAuth(googleBtnRef, handleLogin, handleMockLogin);

  return (
    <div className="login-screen">
      <div className="login-card">
        <span className="login-logo-icon">💼</span>
        <h1>Job Tracker Pro</h1>
        <p>Track your applications, land your dream job.</p>
        <div className="divider">Sign in to continue</div>
        <div className="google-btn-wrap" ref={googleBtnRef} id="googleSignInBtn" />
      </div>
    </div>
  );
}
