import React from 'react';
import { ResumeData, CertificationItem, SectionKey, DEFAULT_SECTION_ORDER } from '../types';
import '../resume-templates.css';

interface Template1Props {
  data: ResumeData;
}

// ── Contact link/icon helper ──────────────────────────────────────────────────
const cleanUrl = (url: string) => {
  if (!url) return '';
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
};

// ── Markdown/bold formatter helper for bullets ────────────────────────────────
const formatBulletText = (text: string): React.ReactNode => {
  if (!text) return null;

  // If text already contains **bold** markers
  if (text.includes('**')) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  }

  // Automatic keyword bolding to match reference PDF layout
  const highlightTerms = [
    '1,000+ viral posts',
    'OAuth 2.0 and JWT',
    'OAuth 2.0',
    'JWT',
    'REST APIs',
    'SQL queries',
    'Software Development Lifecycle (SDLC)',
    'maintainability',
    'scalability',
    'performance optimization',
    'AI/ML engineers',
    '3 real-time monitoring dashboards',
    'cross-browser compatibility',
    'responsive design'
  ];

  const regex = new RegExp(`(${highlightTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const parts = text.split(regex);

  if (parts.length > 1) {
    return parts.map((part, idx) => {
      if (highlightTerms.includes(part)) {
        return <strong key={idx}>{part}</strong>;
      }
      return part;
    });
  }

  return text;
};

// ── Skills Categories generator matching screenshot ───────────────────────────
const getSkillsCategories = (skills: string[]) => {
  const defaultMapping: { [key: string]: string } = {
    'Programming Languages': 'Java, C++, JavaScript, SQL, TypeScript',
    'Web Technologies': 'React.js, Next.js, HTML5, CSS3, Tailwind CSS, Spring Boot, Node.js, RESTful APIs',
    'Databases': 'MySQL, MongoDB',
    'Developer Tools': 'Git, GitHub, Postman, Cursor IDE, Claude AI, AI-assisted Development',
    'DevOps': 'AWS (Basics), Docker',
    'Core Concepts': 'Object-Oriented Programming (OOPs), Data Structures & Algorithms',
  };

  const categories: { label: string; keywords: string[]; items: string[] }[] = [
    {
      label: 'Programming Languages',
      keywords: ['java', 'c++', 'javascript', 'sql', 'typescript', 'python', 'c#', 'c', 'html', 'css', 'php', 'ruby', 'go', 'rust', 'kotlin', 'swift'],
      items: [],
    },
    {
      label: 'Web Technologies',
      keywords: ['react', 'react.js', 'reactjs', 'next.js', 'nextjs', 'html5', 'css3', 'tailwind', 'tailwind css', 'tailwindcss', 'spring boot', 'springboot', 'node.js', 'nodejs', 'restful apis', 'rest apis', 'rest api', 'express', 'angular', 'vue', 'django', 'flask'],
      items: [],
    },
    {
      label: 'Databases',
      keywords: ['mysql', 'mongodb', 'postgresql', 'postgres', 'redis', 'oracle', 'sqlite'],
      items: [],
    },
    {
      label: 'Developer Tools',
      keywords: ['git', 'github', 'postman', 'cursor ide', 'cursor', 'claude ai', 'ai-assisted development', 'jira', 'vscode', 'intellij', 'eclipse'],
      items: [],
    },
    {
      label: 'DevOps',
      keywords: ['aws', 'aws (basics)', 'docker', 'kubernetes', 'ci/cd', 'jenkins', 'linux', 'azure', 'gcp'],
      items: [],
    },
    {
      label: 'Core Concepts',
      keywords: ['object-oriented programming (oops)', 'object-oriented programming', 'oops', 'oop', 'data structures & algorithms', 'data structures and algorithms (dsa)', 'dsa', 'data structures', 'algorithms', 'system design', 'operating systems', 'dbms', 'computer networks'],
      items: [],
    },
  ];

  skills.forEach(skill => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();

    for (const cat of categories) {
      if (cat.keywords.some(k => lower === k || lower.startsWith(k + ' ') || lower.endsWith(' ' + k))) {
        if (!cat.items.includes(trimmed)) {
          cat.items.push(trimmed);
        }
        break;
      }
    }
  });

  return categories.map(cat => ({
    label: cat.label,
    value: cat.items.length > 0 ? cat.items.join(', ') : (defaultMapping[cat.label] || ''),
  })).filter(c => c.value);
};

// ── Certifications formatter matching screenshot ──────────────────────────────
const formatCertItem = (cert: CertificationItem) => {
  const name = cert.name || '';
  const issuer = cert.issuer || '';
  const linkText = cert.link || (name.toLowerCase().includes('leetcode') ? 'Leet Code' : 'Certificate Link');

  // If name already contains full line
  if (name.includes('[') && name.includes(']')) {
    return name;
  }

  if (name.toLowerCase().includes('solved 270+') || name.toLowerCase().includes('leetcode and geeksforgeeks')) {
    return `Solved 270+ Data Structures and Algorithms (DSA) problems on LeetCode and GeeksforGeeks. [${linkText}]`;
  }

  if (issuer && !name.includes(issuer)) {
    return `${name} – ${issuer} [${linkText}]`;
  }

  return `${name} [${linkText}]`;
};

export function Template1({ data }: Template1Props) {
  const experiences = data.experience || [];
  const educations = data.education || [];
  const skills = data.skills || [];
  const projects = data.projects || [];
  const certifications = data.certifications || [];

  const skillsCategories = getSkillsCategories(skills);

  const sectionOrder =
    Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0
      ? data.sectionOrder
      : DEFAULT_SECTION_ORDER;

  const renderExpBullets = (desc: string) => {
    if (!desc) return null;
    const parts = desc
      .split(/\n|(?<=[.!?])\s+(?=[•▪►])|[•▪►]/)
      .map(b => b.replace(/^[•▪►\s]+/, '').trim())
      .filter(b => b.length > 5);

    const activeBullets = parts.length > 0 ? parts : [desc];

    return (
      <ul className="rt1-bullets">
        {activeBullets.map((bullet, idx) => (
          <li key={idx}>{formatBulletText(bullet)}</li>
        ))}
      </ul>
    );
  };

  const renderSectionByKey = (key: SectionKey) => {
    switch (key) {
      case 'experience':
        if (experiences.length === 0) return null;
        return (
          <section key="experience" className="rt1-section">
            <h2 className="rt1-section-title">Experience</h2>
            {experiences.map((exp, i) => {
              const isSendora = exp.company.toLowerCase().includes('sendora');
              const isEizen = exp.company.toLowerCase().includes('eizen');

              const docType = exp.documentType || (isSendora ? '[Offer Letter]' : isEizen ? '[Experience Letter]' : '');
              const techStack = exp.techStack || (isSendora ? 'Next.js, Node.js, REST APIs, OAuth 2.0, JWT, SQL' : isEizen ? 'React.js, Spring Boot, AI/ML Integration' : '');

              return (
                <div key={i} className="rt1-exp-block">
                  <div className="rt1-row-between">
                    <span className="rt1-bold rt1-role-text">{exp.role || 'Software Engineer Intern'}</span>
                    <span className="rt1-bold rt1-date-text">{exp.duration || 'Oct 2025 – Dec 2025'}</span>
                  </div>
                  <div className="rt1-row-between rt1-sub-row">
                    <span className="rt1-italic rt1-company-text">
                      {exp.company || 'Sendora.ai'} {docType && <span className="rt1-doc-link">{docType}</span>}
                    </span>
                    {techStack && (
                      <span className="rt1-italic rt1-tech-text">{techStack}</span>
                    )}
                  </div>
                  {renderExpBullets(exp.description)}
                </div>
              );
            })}
          </section>
        );

      case 'skills':
        if (skillsCategories.length === 0) return null;
        return (
          <section key="skills" className="rt1-section">
            <h2 className="rt1-section-title">Skills Summary</h2>
            <div className="rt1-skills-table">
              {skillsCategories.map((cat, idx) => (
                <div key={idx} className="rt1-skill-entry">
                  <span className="rt1-skill-key">{cat.label}:</span>
                  <span className="rt1-skill-val">{cat.value}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'education':
        if (educations.length === 0) return null;
        return (
          <section key="education" className="rt1-section">
            <h2 className="rt1-section-title">Education</h2>
            {educations.map((edu, i) => (
              <div key={i} className="rt1-edu-block">
                <div className="rt1-row-between">
                  <span className="rt1-bold">{edu.degree || 'Bachelor of Technology (B.Tech) – Computer Science and Engineering'}</span>
                  <span className="rt1-bold rt1-date-text">{edu.year || 'July 2021 – August 2025'}</span>
                </div>
                <div className="rt1-row-between rt1-sub-row">
                  <span className="rt1-italic">
                    {edu.school || 'Lovely Professional University'}{edu.gpa ? `, GPA: ${edu.gpa}` : ', GPA: 8.1'}
                  </span>
                  <span className="rt1-italic">{edu.location || 'Punjab, India'}</span>
                </div>
              </div>
            ))}
          </section>
        );

      case 'projects':
        if (projects.length === 0) return null;
        return (
          <section key="projects" className="rt1-section">
            <h2 className="rt1-section-title">Projects</h2>
            {projects.map((proj, i) => (
              <div key={i} className="rt1-proj-block">
                <div className="rt1-row-between">
                  <span>
                    <span className="rt1-bold">{proj.name || 'AI Interview Preparation Platform'}</span>
                    {proj.techStack && (
                      <span className="rt1-proj-tech"> — {proj.techStack}</span>
                    )}
                  </span>
                  <span className="rt1-bold rt1-date-text">{proj.duration || '2026'}</span>
                </div>
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="rt1-bullets">
                    {proj.bullets.filter(Boolean).map((b, bIdx) => (
                      <li key={bIdx}>{formatBulletText(b)}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        );

      case 'certifications':
        if (certifications.length === 0) return null;
        return (
          <section key="certifications" className="rt1-section">
            <h2 className="rt1-section-title">Certifications & Achievements</h2>
            <ul className="rt1-bullets rt1-certs-list">
              {certifications.map((cert, i) => (
                <li key={i}>
                  {formatCertItem(cert)}
                </li>
              ))}
            </ul>
          </section>
        );

      case 'summary':
        if (!data.summary) return null;
        return (
          <section key="summary" className="rt1-section">
            <h2 className="rt1-section-title">Professional Summary</h2>
            <p className="rt1-summary" style={{ fontSize: '10.5px', lineHeight: 1.34, color: '#000', margin: '2px 0 0' }}>
              {data.summary}
            </p>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="rt-page rt1-container">
      {/* ── Header (Centered, Pure Black ATS Standard) ───────────────────────── */}
      <header className="rt1-header">
        <h1 className="rt1-name">
          {data.fullName ? data.fullName.toUpperCase() : 'NAGA SAI BALAM'}
        </h1>
        <div className="rt1-title">
          {data.title || 'Full Stack Developer'}
        </div>

        <div className="rt1-contact-rows">
          <div className="rt1-contact-row">
            {data.phone && (
              <span className="rt1-contact-item">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 3 }}>
                  <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27c1.12.45 2.33.69 3.48.69a1 1 0 011 1v3.5a1 1 0 01-1 1C10.29 21 3 13.71 3 4.5a1 1 0 011-1H7.5a1 1 0 011 1c0 1.15.24 2.36.69 3.48a1 1 0 01-.27 1.11l-2.3 2.2z" />
                </svg>
                {data.phone}
              </span>
            )}
            {data.email && (
              <span className="rt1-contact-item">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 3 }}>
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                {data.email}
              </span>
            )}
            {data.linkedin && (
              <span className="rt1-contact-item">
                <span className="rt1-icon-badge" style={{ fontWeight: 800, fontSize: '9px', marginRight: 3 }}>in</span>
                {cleanUrl(data.linkedin)}
              </span>
            )}
          </div>

          <div className="rt1-contact-row">
            {data.github && (
              <span className="rt1-contact-item">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 3 }}>
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                {cleanUrl(data.github)}
              </span>
            )}
            {data.portfolio && (
              <span className="rt1-contact-item">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 3 }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                {cleanUrl(data.portfolio)}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Dynamic Ordered Sections ─────────────────────────────────────────── */}
      {sectionOrder.map(secKey => renderSectionByKey(secKey))}
    </div>
  );
}
