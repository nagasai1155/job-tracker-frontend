import React, { useState } from 'react';
import { Job, JobStatus } from '../types';

interface JobCardProps {
  job: Job;
  onDelete: (id: number) => void;
  onUpdateStatus?: (id: number, status: JobStatus) => void;
}

const STATUS_OPTIONS: { status: JobStatus; label: string }[] = [
  { status: 'Applied', label: 'Applied' },
  { status: 'Interview', label: 'Interview' },
  { status: 'Offer', label: 'Offer' },
  { status: 'Rejected', label: 'Rejected' },
];

function getCompanyAvatarColor(company: string): { bg: string; text: string } {
  const palettes = [
    { bg: '#eff6ff', text: '#2563eb' },
    { bg: '#f5f3ff', text: '#7c3aed' },
    { bg: '#f0fdf4', text: '#16a34a' },
    { bg: '#fff7ed', text: '#ea580c' },
    { bg: '#ecfeff', text: '#0891b2' },
    { bg: '#fdf2f8', text: '#db2777' },
  ];
  let sum = 0;
  for (let i = 0; i < company.length; i++) sum += company.charCodeAt(i);
  return palettes[sum % palettes.length];
}

export function JobCard({ job, onDelete, onUpdateStatus }: JobCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const avatarStyle = getCompanyAvatarColor(job.company || 'Job');
  const initial = (job.company || 'J').charAt(0).toUpperCase();

  const formattedDate = job.date
    ? new Date(job.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <div className="clean-job-card">
      <div className="card-top-row">
        <div className="card-company-section">
          <div
            className="company-initial-badge"
            style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.text }}
          >
            {initial}
          </div>
          <div className="company-text-meta">
            <h3 className="card-job-title" title={job.title}>
              {job.title}
            </h3>
            <p className="card-company-name" title={job.company}>
              {job.company}
            </p>
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="card-status-dropdown-wrap">
          <button
            className={`clean-status-pill status-${job.status}`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            title="Change status"
            aria-expanded={dropdownOpen}
          >
            <span className="clean-dot" />
            <span>{job.status}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {dropdownOpen && (
            <>
              <div className="status-dropdown-backdrop" onClick={() => setDropdownOpen(false)} />
              <div className="status-dropdown-menu">
                <span className="dropdown-label">Move to</span>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.status}
                    className={`dropdown-item ${job.status === opt.status ? 'active' : ''}`}
                    onClick={() => {
                      onUpdateStatus && onUpdateStatus(job.id, opt.status);
                      setDropdownOpen(false);
                    }}
                  >
                    <span className={`dropdown-item-dot status-${opt.status}`} />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card-bottom-row">
        <span className="card-date-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formattedDate}
        </span>

        <button
          className="clean-delete-btn"
          title="Delete application"
          onClick={() => onDelete(job.id)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
