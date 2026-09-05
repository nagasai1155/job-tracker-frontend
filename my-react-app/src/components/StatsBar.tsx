import React from 'react';
import { Job, JobStatus } from '../types';

interface StatsBarProps {
  jobs: Job[];
  activeFilter?: JobStatus | 'All';
  onFilterChange?: (filter: JobStatus | 'All') => void;
}

export function StatsBar({ jobs }: StatsBarProps) {
  const counts = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };
  jobs.forEach((j) => {
    if (j.status in counts) counts[j.status]++;
  });

  return (
    <div className="stats-bar">
      <div className="stat-card">
        <div className="stat-label">Total</div>
        <div className="stat-value">{jobs.length}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Applied</div>
        <div className="stat-value" style={{ color: 'var(--status-applied-text, #0284c7)' }}>
          {counts.Applied}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Interview</div>
        <div className="stat-value" style={{ color: 'var(--status-interview-text, #d97706)' }}>
          {counts.Interview}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Offers</div>
        <div className="stat-value" style={{ color: 'var(--status-offer-text, #10b981)' }}>
          {counts.Offer}
        </div>
      </div>
    </div>
  );
}
