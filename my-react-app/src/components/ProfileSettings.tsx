import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings, DefaultStatus } from '../context/SettingsContext';

interface ProfileSettingsProps {
  onBack: () => void;
}

// ─── Toggle Switch Component ──────────────────────────────────────────────────
function Toggle({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="ps-toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="ps-toggle-track">
        <span className="ps-toggle-thumb" />
      </span>
    </label>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="ps-section">
      <div className="ps-section-header">
        <span className="ps-section-icon">{icon}</span>
        <h2 className="ps-section-title">{title}</h2>
      </div>
      <div className="ps-section-body">{children}</div>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="ps-row">
      <div className="ps-row-info">
        <span className="ps-row-label">{label}</span>
        {description && <span className="ps-row-desc">{description}</span>}
      </div>
      <div className="ps-row-control">{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProfileSettings({ onBack }: ProfileSettingsProps) {
  const { user, logout } = useAuth();
  const { settings, updateSetting, resetSettings } = useSettings();

  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const avatarUrl =
    user?.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'User')}&background=2563eb&color=fff&size=128`;

  const handleSave = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, []);

  const handleReset = useCallback(() => {
    resetSettings();
    setShowConfirm(false);
  }, [resetSettings]);

  const statusColors: Record<DefaultStatus, string> = {
    Applied: '#1d4ed8',
    Interview: '#92400e',
    Offer: '#15803d',
    Rejected: '#be123c',
  };

  return (
    <div className="ps-page">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <span className="brand-text">JobTracker</span>
          </div>
          <div className="header-actions">
            <button className="ps-back-btn" id="backToDashboardBtn" onClick={onBack}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="ps-content">
        {/* Page Title */}
        <div className="ps-page-title">
          <h2>Profile & Settings</h2>
          <p>Manage your account details and application preferences</p>
        </div>

        {/* ── Profile Card ─────────────────────────────────────────────────── */}
        <div className="ps-profile-card">
          <div className="ps-avatar-wrap">
            <img src={avatarUrl} alt={user?.name ?? 'User'} className="ps-avatar" />
            <div className="ps-avatar-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
          <div className="ps-profile-info">
            <h3 className="ps-profile-name">{user?.name ?? 'User'}</h3>
            <p className="ps-profile-email">{user?.email ?? 'No email'}</p>
            <span className="ps-profile-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified Account
            </span>
          </div>
          <div className="ps-profile-stats">
            <div className="ps-pstat">
              <span className="ps-pstat-icon">📋</span>
              <span className="ps-pstat-label">Default Status</span>
              <span
                className="ps-pstat-value"
                style={{ color: statusColors[settings.defaultStatus] }}
              >
                {settings.defaultStatus}
              </span>
            </div>
          </div>
        </div>

        {/* ── Preferences ──────────────────────────────────────────────────── */}
        <Section icon="⚙️" title="Preferences">
          <Row
            label="Default Job Status"
            description="Status pre-selected when adding a new job"
          >
            <select
              id="defaultStatusSelect"
              className="ps-select"
              value={settings.defaultStatus}
              onChange={e => updateSetting('defaultStatus', e.target.value as DefaultStatus)}
            >
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </Row>
          <Row
            label="Compact View"
            description="Show smaller job cards with less padding"
          >
            <Toggle
              id="compactViewToggle"
              checked={settings.compactView}
              onChange={v => updateSetting('compactView', v)}
            />
          </Row>
        </Section>

        {/* ── Notifications ────────────────────────────────────────────────── */}
        <Section icon="🔔" title="Notifications">
          <Row
            label="Email Notifications"
            description="Receive emails when your application status changes"
          >
            <Toggle
              id="emailNotifToggle"
              checked={settings.emailNotifications}
              onChange={v => updateSetting('emailNotifications', v)}
            />
          </Row>
          <Row
            label="Weekly Digest"
            description="Get a weekly summary of your job applications"
          >
            <Toggle
              id="weeklyDigestToggle"
              checked={settings.weeklyDigest}
              onChange={v => updateSetting('weeklyDigest', v)}
            />
          </Row>
          <Row
            label="Application Reminders"
            description="Get reminded to follow up on pending applications"
          >
            <Toggle
              id="appRemindersToggle"
              checked={settings.applicationReminders}
              onChange={v => updateSetting('applicationReminders', v)}
            />
          </Row>
        </Section>

        {/* ── Account ──────────────────────────────────────────────────────── */}
        <Section icon="🔐" title="Account">
          <Row
            label="Sign Out"
            description="Log out from your Job Tracker Pro account"
          >
            <button className="btn btn-outline" id="settingsLogoutBtn" onClick={logout}>
              Sign Out
            </button>
          </Row>
          <Row
            label="Reset Preferences"
            description="Restore all settings to their default values"
          >
            {showConfirm ? (
              <div className="ps-confirm-row">
                <span className="ps-confirm-text">Are you sure?</span>
                <button className="ps-btn-danger" id="confirmResetBtn" onClick={handleReset}>Yes, Reset</button>
                <button className="btn btn-outline" onClick={() => setShowConfirm(false)}>Cancel</button>
              </div>
            ) : (
              <button
                className="ps-btn-ghost"
                id="resetPrefsBtn"
                onClick={() => setShowConfirm(true)}
              >
                Reset to Defaults
              </button>
            )}
          </Row>
        </Section>

        {/* ── Save Button ──────────────────────────────────────────────────── */}
        <div className="ps-save-bar">
          <div className={`ps-save-feedback ${saved ? 'ps-save-feedback--visible' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Settings saved successfully!
          </div>
          <button className="btn" id="saveSettingsBtn" onClick={handleSave}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
