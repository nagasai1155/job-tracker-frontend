import React, { useRef, useCallback } from 'react';
import { useAuth, useGoogleAuth } from '../context/AuthContext';

const stats = [
  { value: '10k+', label: 'Active users' },
  { value: '94%', label: 'Interview rate' },
  { value: '4.9★', label: 'User rating' },
];

const steps = [
  { icon: '→', text: 'Add your job applications' },
  { icon: '→', text: 'Track every interview stage' },
  { icon: '→', text: 'Land your dream offer' },
];

export function LoginScreen() {
  const { login } = useAuth();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const handleLogin = useCallback((credential: string) => login(credential), [login]);
  useGoogleAuth(googleBtnRef, handleLogin);

  return (
    <div className="auth-page">
      {/* subtle grid bg */}
      <div className="auth-grid-bg" aria-hidden />

      {/* ── Top bar ── */}
      <header className="auth-topbar">
        <div className="auth-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="2" y="3" width="20" height="18" rx="3" fill="#2563eb" opacity=".15"/>
            <path d="M7 8h10M7 12h6M7 16h8" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span>JobTracker</span>
        </div>
        <span className="auth-topbar-badge">Free to use</span>
      </header>

      {/* ── Main layout ── */}
      <main className="auth-main">
        {/* Left: copy */}
        <section className="auth-left">
          <div className="auth-pill">🚀 Built for job seekers</div>

          <h1 className="auth-headline">
            Your job search,<br />
            <span className="auth-headline-accent">organised.</span>
          </h1>

          <p className="auth-desc">
            Track applications, manage interviews, and build standout
            resumes — everything in one clean workspace.
          </p>

          <ul className="auth-steps">
            {steps.map((s) => (
              <li key={s.text} className="auth-step">
                <span className="auth-step-arrow">{s.icon}</span>
                <span>{s.text}</span>
              </li>
            ))}
          </ul>

          <div className="auth-stats">
            {stats.map((s) => (
              <div key={s.label} className="auth-stat">
                <span className="auth-stat-val">{s.value}</span>
                <span className="auth-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Right: sign-in */}
        <section className="auth-right">
          <div className="auth-card">
            {/* card header */}
            <div className="auth-card-top">
              <div className="auth-card-logo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="2" y="3" width="20" height="18" rx="3" fill="#2563eb" opacity=".15"/>
                  <path d="M7 8h10M7 12h6M7 16h8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="auth-card-title">Sign in to JobTracker</h2>
              <p className="auth-card-sub">Welcome back — your applications are waiting.</p>
            </div>

            {/* separator */}
            <div className="auth-sep">
              <hr /><span>Continue with Google</span><hr />
            </div>

            {/* Google button */}
            <div className="auth-google-wrap" ref={googleBtnRef} id="googleSignInBtn" />

            {/* footer note */}
            <p className="auth-note">
              By signing in you agree to our{' '}
              <a href="#terms" className="auth-a">Terms</a> and{' '}
              <a href="#privacy" className="auth-a">Privacy Policy</a>.
              <br />No account needed — we create one on first sign-in.
            </p>

            {/* trust row */}
            <div className="auth-trust">
              <span className="auth-trust-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.36C16.5 22.15 20 17.25 20 12V6l-8-4z" fill="#16a34a" opacity=".2"/><path d="M9 12l2 2 4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                SSL encrypted
              </span>
              <span className="auth-trust-dot" />
              <span className="auth-trust-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#2563eb" opacity=".15"/><path d="M12 7v5l3 3" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/></svg>
                No spam, ever
              </span>
              <span className="auth-trust-dot" />
              <span className="auth-trust-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" fill="#7c3aed" opacity=".15"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"/></svg>
                Google OAuth
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* ── Bottom bar ── */}
      <footer className="auth-footer">
        <span>© 2024 JobTracker. All rights reserved.</span>
        <nav>
          <a href="#privacy" className="auth-a">Privacy</a>
          <a href="#terms" className="auth-a">Terms</a>
          <a href="#help" className="auth-a">Help</a>
        </nav>
      </footer>
    </div>
  );
}
