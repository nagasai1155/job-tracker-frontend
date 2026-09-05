import React from 'react';
import { ResumeData } from '../types';
import '../resume-templates.css';

interface Template2Props {
  data: ResumeData;
}

// ── Word trimmer helper (Max 18-20 words per bullet) ──────────────────────────
const trimWords = (text: string, maxWords = 20): string => {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(' ') + '…';
};

// ── Normalize certifications ──────────────────────────────────────────────────
const normalizeCertifications = (items: any[]) => {
  if (!items || items.length === 0) return [];
  return items.filter(c => c && (c.name || c.issuer));
};

export function Template2({ data }: Template2Props) {
  const experiences = data.experience || [];
  const educations = data.education || [];
  const skills = data.skills || [];
  const projects = data.projects || [];
  const certifications = normalizeCertifications(data.certifications || []);

  const renderExpBullets = (desc: string) => {
    if (!desc) return null;
    const parts = desc
      .split(/\n|(?<=[.!?])\s+(?=[•▪►])|[•▪►]/)
      .map(b => b.replace(/^[•▪►\s]+/, '').trim())
      .filter(b => b.length > 5);

    const activeBullets = (parts.length > 0 ? parts : [desc]).slice(0, 3);

    return (
      <ul className="rt1-bullets" style={{ margin: '3px 0 0', paddingLeft: '14px' }}>
        {activeBullets.map((bullet, idx) => (
          <li key={idx} style={{ marginBottom: '2px' }}>{trimWords(bullet, 20)}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="rt-page rt2-container">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="rt2-sidebar">
        <h1 className="rt2-sidebar-name">
          {data.fullName || <span className="rt-placeholder" style={{ color: '#64748b' }}>Your Name</span>}
        </h1>
        <p className="rt2-sidebar-tagline">
          {data.title || <span className="rt-placeholder" style={{ color: '#64748b' }}>Professional Title</span>}
        </p>

        {/* Contact */}
        <div className="rt2-sidebar-section">
          <h2 className="rt2-sidebar-title">Contact & Links</h2>
          {data.email && (
            <div className="rt2-contact-item">
              <span className="rt2-contact-icon">✉</span>
              <span>{data.email}</span>
            </div>
          )}
          {data.phone && (
            <div className="rt2-contact-item">
              <span className="rt2-contact-icon">☎</span>
              <span>{data.phone}</span>
            </div>
          )}
          {data.linkedin && (
            <div className="rt2-contact-item">
              <span className="rt2-contact-icon">🌐</span>
              <span>{data.linkedin}</span>
            </div>
          )}
          {data.github && (
            <div className="rt2-contact-item">
              <span className="rt2-contact-icon">💻</span>
              <span>{data.github}</span>
            </div>
          )}
          {data.portfolio && (
            <div className="rt2-contact-item">
              <span className="rt2-contact-icon">🔗</span>
              <span>{data.portfolio}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="rt2-sidebar-section">
            <h2 className="rt2-sidebar-title">Skills</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {skills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    background: '#1e293b',
                    color: '#e2e8f0',
                    fontSize: '9.5px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    border: '1px solid #334155'
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {educations.length > 0 && (
          <div className="rt2-sidebar-section">
            <h2 className="rt2-sidebar-title">Education</h2>
            {educations.map((edu, i) => (
              <div key={i} className="rt2-edu-item">
                <div className="rt2-edu-degree">{edu.degree || 'Degree'}</div>
                <div className="rt2-edu-school">
                  {edu.school || ''} {edu.location ? `• ${edu.location}` : ''}
                </div>
                {edu.year && <div className="rt2-edu-year">{edu.year} {edu.gpa ? `• GPA: ${edu.gpa}` : ''}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="rt2-sidebar-section">
            <h2 className="rt2-sidebar-title">Certifications</h2>
            {certifications.map((cert, i) => (
              <div key={i} className="rt2-edu-item">
                <div className="rt2-edu-degree">{cert.name || 'Certification'}</div>
                <div className="rt2-edu-school">{cert.issuer || ''}</div>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="rt2-main">
        {/* Summary */}
        {data.summary && (
          <div className="rt2-main-section">
            <h2 className="rt2-main-title">Professional Summary</h2>
            <p className="rt2-summary">{data.summary}</p>
          </div>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <div className="rt2-main-section">
            <h2 className="rt2-main-title">Experience</h2>
            {experiences.map((exp, i) => (
              <div key={i} className="rt2-exp-item">
                <span className="rt2-exp-dot" />
                <div className="rt2-exp-header">
                  <span className="rt2-exp-role">{exp.role || 'Role'}</span>
                  {exp.duration && (
                    <span className="rt2-exp-duration">{exp.duration}</span>
                  )}
                </div>
                {exp.company && (
                  <div className="rt2-exp-company">{exp.company}</div>
                )}
                {renderExpBullets(exp.description)}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="rt2-main-section">
            <h2 className="rt2-main-title">Projects</h2>
            {projects.map((proj, i) => (
              <div key={i} className="rt2-exp-item">
                <span className="rt2-exp-dot" />
                <div className="rt2-exp-header">
                  <span className="rt2-exp-role">{proj.name || 'Project Name'}</span>
                  {proj.duration && (
                    <span className="rt2-exp-duration">{proj.duration}</span>
                  )}
                </div>
                {proj.techStack && (
                  <div className="rt2-exp-company">Tech: {proj.techStack}</div>
                )}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="rt1-bullets" style={{ margin: '3px 0 0', paddingLeft: '14px' }}>
                    {proj.bullets.filter(Boolean).slice(0, 3).map((b, bIdx) => (
                      <li key={bIdx}>{trimWords(b, 20)}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
