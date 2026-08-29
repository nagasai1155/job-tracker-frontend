import React from 'react';
import { Job, JobStatus } from '../types';

interface StatsBarProps {
  jobs: Job[];
  activeFilter?: JobStatus | 'All';
  onFilterChange?: (filter: JobStatus | 'All') => void;
}

export function StatsBar({ jobs, activeFilter = 'All', onFilterChange }: StatsBarProps) {
  const counts: Record<JobStatus, number> = {
    Applied: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0,
  };

  jobs.forEach((j) => {
    if (j.status in counts) {
      counts[j.status]++;
    }
  });

  const total = jobs.length;

  const stats = [
    {
      key: 'All' as const,
      label: 'Total Applications',
      count: total,
      color: '#2563eb',
      bg: '#eff6ff',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      ),
    },
    {
      key: 'Applied' as const,
      label: 'Applied',
      count: counts.Applied,
      color: '#0284c7',
      bg: '#f0f9ff',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      key: 'Interview' as const,
      label: 'Interviewing',
      count: counts.Interview,
      color: '#d97706',
      bg: '#fffbeb',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
    },
    {
      key: 'Offer' as const,
      label: 'Offers',
      count: counts.Offer,
      color: '#16a34a',
      bg: '#f0fdf4',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
          <path d="M4 22h16"/>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="clean-stats-grid">
      {stats.map((s) => {
        const isSelected = activeFilter === s.key;
        return (
          <div
            key={s.key}
            className={`clean-stat-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onFilterChange && onFilterChange(s.key)}
            role="button"
            tabIndex={0}
            title={`Filter by ${s.label}`}
          >
            <div className="clean-stat-icon" style={{ color: s.color, backgroundColor: s.bg }}>
              {s.icon}
            </div>
            <div className="clean-stat-info">
              <span className="clean-stat-number">{s.count}</span>
              <span className="clean-stat-label">{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
