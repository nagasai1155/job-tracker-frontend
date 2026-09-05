import React from 'react';

interface DashboardProps {
  onSelectFeature: (feature: 'jobs' | 'resume' | 'interview') => void;
}

export function Dashboard({ onSelectFeature }: DashboardProps) {
  const features = [
    {
      id: 'jobs' as const,
      title: 'Job Tracking',
      badge: 'Applications Pipeline',
      badgeClass: 'badge-blue',
      cardClass: 'card-theme-blue',
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      description:
        'Track job applications across stages, manage your Kanban pipeline, monitor interview milestones, and analyze hiring conversion rates.',
      tags: ['Kanban Pipeline', 'Milestone Stats', 'Drag & Drop'],
      buttonText: 'Open Job Tracking',
      buttonClass: 'hub-btn-blue',
    },
    {
      id: 'resume' as const,
      title: 'Resume Studio',
      badge: 'ATS Resume Builder',
      badgeClass: 'badge-emerald',
      cardClass: 'card-theme-emerald',
      iconBg: '#f0fdf4',
      iconColor: '#059669',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      description:
        'Build ATS-optimized resumes with real-time live preview, custom tech stack tagging, dynamic skill categorization, and instant PDF download.',
      tags: ['Smart ATS Score', 'Live A4 Preview', 'Instant PDF Export'],
      buttonText: 'Open Resume Studio',
      buttonClass: 'hub-btn-emerald',
    },
    {
      id: 'interview' as const,
      title: 'AI Interview',
      badge: 'AI Mock Practice',
      badgeClass: 'badge-purple',
      cardClass: 'card-theme-purple',
      iconBg: '#faf5ff',
      iconColor: '#7c3aed',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      ),
      description:
        'Practice role-specific technical and behavioral questions with instant AI scoring, in-depth audio feedback, and tailored performance critiques.',
      tags: ['Interactive Audio', 'Instant AI Feedback', 'Role-Based Prep'],
      buttonText: 'Start AI Interview',
      buttonClass: 'hub-btn-purple',
    },
  ];

  return (
    <div className="clean-hub-wrapper">
      <div className="clean-hub-cards-grid">
        {features.map((feature) => (
          <div
            key={feature.id}
            className={`hub-card ${feature.cardClass}`}
            onClick={() => onSelectFeature(feature.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectFeature(feature.id);
              }
            }}
            aria-label={`Open ${feature.title}`}
          >
            {/* Ambient Card Glow */}
            <div className="hub-card-ambient-glow" />

            {/* Top Bar: Icon & Pill Badge */}
            <div className="hub-card-header">
              <div
                className="hub-card-icon-wrap"
                style={{ backgroundColor: feature.iconBg, color: feature.iconColor }}
              >
                {feature.icon}
              </div>
              <span className={`hub-card-badge ${feature.badgeClass}`}>
                {feature.badge}
              </span>
            </div>

            {/* Title & Description */}
            <div className="hub-card-body">
              <h2 className="hub-card-title">{feature.title}</h2>
              <p className="hub-card-description">{feature.description}</p>

              {/* Feature Highlights Pills */}
              <div className="hub-card-tags">
                {feature.tags.map((tag) => (
                  <span key={tag} className="hub-tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Card Action Footer */}
            <div className="hub-card-footer">
              <button
                className={`hub-card-action-btn ${feature.buttonClass}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFeature(feature.id);
                }}
                tabIndex={-1}
              >
                <span>{feature.buttonText}</span>
                <svg
                  className="hub-btn-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
