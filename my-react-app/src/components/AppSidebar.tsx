import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AppTab, getDisplayName } from '../types';

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function AppSidebar({
  isCollapsed,
  onToggleCollapse,
  activeTab,
  onTabChange,
}: AppSidebarProps) {
  const { user, logout } = useAuth();
  const displayName = getDisplayName(user?.name, user?.email);
  const avatarUrl =
    user?.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff&bold=true`;

  const navItems = [
    {
      id: 'dashboard',
      tab: 'dashboard' as AppTab,
      label: 'Dashboard',
      subtitle: 'Home & Hub',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      id: 'jobs',
      tab: 'jobs' as AppTab,
      label: 'Job Tracking',
      subtitle: 'Tracker & Applications',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      id: 'resume',
      tab: 'resume' as AppTab,
      label: 'Resume Studio',
      subtitle: 'ATS-Ready Studio',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      id: 'interview',
      tab: 'interview' as AppTab,
      label: 'AI Interview',
      subtitle: 'Mock Practice & Prep',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16 10 8" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className={`app-sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}
      aria-label="Sidebar Navigation"
    >
      {/* ── Brand Header & Toggle ── */}
      <div className="sidebar-brand-row">
        {isCollapsed ? (
          <button
            className="sidebar-collapsed-expand-btn"
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
          >
            <div className="sidebar-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <span className="expand-overlay-chevron">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </button>
        ) : (
          <>
            <div
              className="sidebar-brand-box"
              onClick={() => onTabChange('dashboard')}
              title="JobTracker Home"
              style={{ cursor: 'pointer' }}
            >
              <div className="sidebar-logo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div className="sidebar-brand-text">
                <span className="brand-title">JobTracker</span>
                <span className="brand-badge-pill">PRO</span>
              </div>
            </div>

            <button
              className="sidebar-toggle-btn"
              onClick={onToggleCollapse}
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* ── Navigation Links ── */}
      <div className="sidebar-scrollable-menu">
        <div className="sidebar-group">
          {!isCollapsed && <span className="sidebar-group-title">NAVIGATION</span>}
          <nav className="sidebar-nav-list">
            {navItems.map((item) => {
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.id}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onTabChange(item.tab)}
                  title={isCollapsed ? `${item.label} (${item.subtitle})` : undefined}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <div className="sidebar-nav-label-box">
                      <span className="sidebar-nav-label">{item.label}</span>
                      <span className="sidebar-nav-sub">{item.subtitle}</span>
                    </div>
                  )}
                  {isActive && <span className="sidebar-active-indicator" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Footer: Logout Above, Profile Down ── */}
      <div className="sidebar-footer-card">
        {/* Logout Button (Above) */}
        <button
          className={isCollapsed ? 'sidebar-logout-btn-collapsed' : 'sidebar-logout-btn'}
          onClick={logout}
          title="Sign Out"
          aria-label="Sign out"
          id="sidebarLogoutBtn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!isCollapsed && <span>Sign Out</span>}
        </button>

        {/* Profile Info / Icon (Down) */}
        <div
          className="sidebar-user-info"
          title={`${displayName} (${user?.email || 'Logged in'})`}
          style={{ cursor: 'default' }}
        >
          <img
            src={avatarUrl}
            alt={`${displayName} Avatar`}
            className="sidebar-user-avatar"
          />
          {!isCollapsed && (
            <div className="sidebar-user-meta">
              <span className="sidebar-user-name">{displayName}</span>
              <span className="sidebar-user-email" title={user?.email || ''}>
                {user?.email || 'Logged in'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
