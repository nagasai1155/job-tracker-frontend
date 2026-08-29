import React from 'react';
import { useAuth } from '../context/AuthContext';

type AppTab = 'jobs' | 'resume' | 'interview';

interface AppHeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onNavigate: (page: 'settings' | 'dashboard') => void;
}

export function AppHeader({ activeTab, onTabChange, onNavigate }: AppHeaderProps) {
  const { user, logout } = useAuth();

  const avatarUrl =
    user?.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'User')}&background=2563eb&color=fff&bold=true`;

  return (
    <header className="app-header">
      <div className="header-inner">
        <div
          className="header-brand"
          onClick={() => {
            onTabChange('jobs');
            onNavigate('dashboard');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <span className="brand-text">JobTracker</span>
        </div>

        <nav className="header-nav" id="mainNavTabs">
          <button
            className={`header-nav-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => {
              onTabChange('jobs');
              onNavigate('dashboard');
            }}
            id="navTabJobs"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span>Applications</span>
          </button>
          <button
            className={`header-nav-btn ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => {
              onTabChange('resume');
              onNavigate('dashboard');
            }}
            id="navTabResume"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Resume Builder</span>
          </button>
          <button
            className={`header-nav-btn ${activeTab === 'interview' ? 'active' : ''}`}
            onClick={() => {
              onTabChange('interview');
              onNavigate('dashboard');
            }}
            id="navTabInterview"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span>AI Interview</span>
          </button>
        </nav>

        <div className="header-actions">
          <button
            className="icon-action-btn"
            id="settingsNavBtn"
            onClick={() => onNavigate('settings')}
            title="Profile & Settings"
            aria-label="Open profile settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <img
            src={avatarUrl}
            alt={`${user?.name ?? 'User'} avatar`}
            className="header-avatar"
            onClick={() => onNavigate('settings')}
            title="Profile & Settings"
          />
          <button
            className="icon-action-btn"
            id="logoutBtn"
            onClick={logout}
            title="Sign Out"
            aria-label="Sign out"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
