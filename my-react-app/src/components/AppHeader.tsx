import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AppTab, getDisplayName } from '../types';

interface AppHeaderProps {
  activeTab?: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function AppHeader({
  onTabChange,
}: AppHeaderProps) {
  const { user } = useAuth();
  const displayName = getDisplayName(user?.name, user?.email);

  return (
    <header className="app-topbar" role="banner">
      {/* ── Left: Brand & Personalized Greeting ── */}
      <div className="topbar-left">
        <div
          className="topbar-brand-hub"
          onClick={() => onTabChange('dashboard')}
          title="JobTracker Home"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', marginRight: '0.75rem' }}
        >
          {/* <div className="sidebar-logo-icon" style={{ width: '30px', height: '30px', borderRadius: '9px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div> */}
          {/* <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>JobTracker</span>
            <span className="brand-badge-pill" style={{ padding: '0.12rem 0.4rem', fontSize: '0.62rem' }}>PRO</span>
          </div> */}
        </div>

        <div className="topbar-greeting-pill">
          <span className="greeting-text">
            Welcome back, <strong className="greeting-name">{displayName}</strong>
            <span className="greeting-wave" role="img" aria-label="wave"> 👋</span>
          </span>
        </div>
      </div>

      {/* ── Right: Active Session ── */}
      <div className="topbar-right-actions">
        <div className="topbar-status-chip">
          <span className="status-live-dot" />
          <span className="status-text">Active Session</span>
        </div>
      </div>
    </header>
  );
}
