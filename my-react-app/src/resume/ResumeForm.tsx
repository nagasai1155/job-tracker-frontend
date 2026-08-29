import React, { useState, useCallback, useMemo, useRef, KeyboardEvent } from 'react';
import { useResume } from './ResumeContext';
import { api } from '../api';
import { processParsedResume } from './resumeParser';
import {
  ExperienceItem,
  EducationItem,
  ProjectItem,
  CertificationItem,
  SectionKey,
  DEFAULT_SECTION_ORDER,
  EMPTY_RESUME,
  EMPTY_EXPERIENCE,
  EMPTY_EDUCATION,
  EMPTY_PROJECT,
  EMPTY_CERTIFICATION,
} from './types';
import './resume-builder.css';

export function ResumeForm() {
  const { data, updateField, setData } = useResume();
  const [skillInput, setSkillInput] = useState('');
  const [draggedSection, setDraggedSection] = useState<SectionKey | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({});

  // PDF import state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [parseSuccessMsg, setParseSuccessMsg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      e.target.value = '';

      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        setUploadError('Please select a valid PDF file (.pdf).');
        return;
      }

      setUploading(true);
      setUploadError('');
      setParseSuccessMsg(false);

      try {
        const parsed = await api.parseResumePdf(file);
        if (!parsed) {
          throw new Error('No parsed data returned from server');
        }

        setData(prev => processParsedResume(parsed, prev));
        setParseSuccessMsg(true);
      } catch (err: any) {
        setUploadError(
          err?.message || 'Failed to parse resume PDF. Please check your backend connection or enter details manually.'
        );
      } finally {
        setUploading(false);
      }
    },
    [setData]
  );

  const handleClearForm = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all fields in the resume form? This cannot be undone.')) {
      setData({ ...EMPTY_RESUME });
      setParseSuccessMsg(false);
      setUploadError('');
    }
  }, [setData]);

  const sectionOrder = useMemo(
    () => (Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0 ? data.sectionOrder : DEFAULT_SECTION_ORDER),
    [data.sectionOrder]
  );

  const experiences = useMemo(() => data.experience || [], [data.experience]);
  const educations = useMemo(() => data.education || [], [data.education]);
  const skills = useMemo(() => data.skills || [], [data.skills]);
  const projects = useMemo(() => data.projects || [], [data.projects]);
  const certifications = useMemo(() => data.certifications || [], [data.certifications]);

  // ── Section Reordering Handlers (Drag & Drop + Up/Down buttons) ────────────
  const moveSection = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const newOrder = [...sectionOrder];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newOrder.length) return;

      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;

      updateField('sectionOrder', newOrder);
    },
    [sectionOrder, updateField]
  );

  const handleDragStart = (sectionKey: SectionKey) => {
    setDraggedSection(sectionKey);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetKey: SectionKey) => {
    if (!draggedSection || draggedSection === targetKey) {
      setDraggedSection(null);
      return;
    }

    const currentOrder = [...sectionOrder];
    const fromIndex = currentOrder.indexOf(draggedSection);
    const toIndex = currentOrder.indexOf(targetKey);

    if (fromIndex !== -1 && toIndex !== -1) {
      currentOrder.splice(fromIndex, 1);
      currentOrder.splice(toIndex, 0, draggedSection);
      updateField('sectionOrder', currentOrder);
    }
    setDraggedSection(null);
  };

  const toggleCollapse = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Experience helpers ──────────────────────────────────────────────────────
  const addExperience = useCallback(() => {
    updateField('experience', [...experiences, { ...EMPTY_EXPERIENCE }]);
  }, [experiences, updateField]);

  const updateExperience = useCallback(
    (index: number, field: keyof ExperienceItem, value: string) => {
      const updated = experiences.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      updateField('experience', updated);
    },
    [experiences, updateField]
  );

  const removeExperience = useCallback(
    (index: number) => {
      updateField('experience', experiences.filter((_, i) => i !== index));
    },
    [experiences, updateField]
  );

  const moveExperience = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= experiences.length) return;
      const updated = [...experiences];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      updateField('experience', updated);
    },
    [experiences, updateField]
  );

  // ── Education helpers ───────────────────────────────────────────────────────
  const addEducation = useCallback(() => {
    updateField('education', [...educations, { ...EMPTY_EDUCATION }]);
  }, [educations, updateField]);

  const updateEducation = useCallback(
    (index: number, field: keyof EducationItem, value: string) => {
      const updated = educations.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      updateField('education', updated);
    },
    [educations, updateField]
  );

  const removeEducation = useCallback(
    (index: number) => {
      updateField('education', educations.filter((_, i) => i !== index));
    },
    [educations, updateField]
  );

  const moveEducation = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= educations.length) return;
      const updated = [...educations];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      updateField('education', updated);
    },
    [educations, updateField]
  );

  // ── Projects helpers ────────────────────────────────────────────────────────
  const addProject = useCallback(() => {
    updateField('projects', [...projects, { ...EMPTY_PROJECT }]);
  }, [projects, updateField]);

  const updateProject = useCallback(
    (index: number, field: keyof ProjectItem, value: any) => {
      const updated = projects.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      updateField('projects', updated);
    },
    [projects, updateField]
  );

  const removeProject = useCallback(
    (index: number) => {
      updateField('projects', projects.filter((_, i) => i !== index));
    },
    [projects, updateField]
  );

  const moveProject = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= projects.length) return;
      const updated = [...projects];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      updateField('projects', updated);
    },
    [projects, updateField]
  );

  const addProjectBullet = useCallback(
    (projIndex: number) => {
      const proj = projects[projIndex];
      if (!proj) return;
      const bullets = [...(proj.bullets || []), ''];
      updateProject(projIndex, 'bullets', bullets);
    },
    [projects, updateProject]
  );

  const updateProjectBullet = useCallback(
    (projIndex: number, bulletIndex: number, text: string) => {
      const proj = projects[projIndex];
      if (!proj) return;
      const bullets = (proj.bullets || []).map((b, i) =>
        i === bulletIndex ? text : b
      );
      updateProject(projIndex, 'bullets', bullets);
    },
    [projects, updateProject]
  );

  const removeProjectBullet = useCallback(
    (projIndex: number, bulletIndex: number) => {
      const proj = projects[projIndex];
      if (!proj) return;
      const bullets = (proj.bullets || []).filter((_, i) => i !== bulletIndex);
      updateProject(projIndex, 'bullets', bullets);
    },
    [projects, updateProject]
  );

  // ── Certifications helpers ──────────────────────────────────────────────────
  const addCertification = useCallback(() => {
    updateField('certifications', [...certifications, { ...EMPTY_CERTIFICATION }]);
  }, [certifications, updateField]);

  const updateCertification = useCallback(
    (index: number, field: keyof CertificationItem, value: string) => {
      const updated = certifications.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      updateField('certifications', updated);
    },
    [certifications, updateField]
  );

  const removeCertification = useCallback(
    (index: number) => {
      updateField('certifications', certifications.filter((_, i) => i !== index));
    },
    [certifications, updateField]
  );

  const moveCertification = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= certifications.length) return;
      const updated = [...certifications];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      updateField('certifications', updated);
    },
    [certifications, updateField]
  );

  // ── Skills helpers ──────────────────────────────────────────────────────────
  const addSkill = useCallback(
    (skill: string) => {
      const parts = skill.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      if (parts.length === 0) return;

      const newSkills = [...skills];
      for (const p of parts) {
        if (!newSkills.includes(p)) {
          newSkills.push(p);
        }
      }
      updateField('skills', newSkills);
    },
    [skills, updateField]
  );

  const removeSkill = useCallback(
    (index: number) => {
      updateField('skills', skills.filter((_, i) => i !== index));
    },
    [skills, updateField]
  );

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(skillInput);
      setSkillInput('');
    }
  };

  // ── Render Dynamic Reorderable Sections ────────────────────────────────────
  const renderSection = (key: SectionKey, index: number) => {
    const isFirst = index === 0;
    const isLast = index === sectionOrder.length - 1;
    const isCollapsed = !!collapsedSections[key];

    switch (key) {
      case 'experience':
        return (
          <div
            key="experience"
            className="rb-section rb-reorderable-section"
            draggable
            onDragStart={() => handleDragStart('experience')}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('experience')}
          >
            <div className="rb-section-bar">
              <div className="rb-section-drag-handle" title="Drag to reorder section">
                ⠿
              </div>
              <div className="rb-section-title" onClick={() => toggleCollapse('experience')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span>💼 Experience <span className="rb-required-star">*</span></span>
                <span className="rb-collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
              </div>
              <div className="rb-section-controls">
                <button
                  type="button"
                  className="rb-reorder-btn"
                  onClick={() => moveSection(index, 'up')}
                  disabled={isFirst}
                  title="Move section up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="rb-reorder-btn"
                  onClick={() => moveSection(index, 'down')}
                  disabled={isLast}
                  title="Move section down"
                >
                  ▼
                </button>
              </div>
            </div>

            {!isCollapsed && (
              <div className="rb-section-content">
                {experiences.length === 0 && (
                  <div className="rb-empty-warning">
                    ⚠️ Add at least one experience entry.
                  </div>
                )}

                {experiences.map((exp, i) => (
                  <div key={i} className="rb-repeat-item">
                    <div className="rb-repeat-item-header">
                      <span className="rb-repeat-item-title">Experience #{i + 1}</span>
                      <div className="rb-item-actions">
                        <button
                          type="button"
                          className="rb-item-move-btn"
                          onClick={() => moveExperience(i, 'up')}
                          disabled={i === 0}
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className="rb-item-move-btn"
                          onClick={() => moveExperience(i, 'down')}
                          disabled={i === experiences.length - 1}
                          title="Move down"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          className="rb-remove-btn"
                          onClick={() => removeExperience(i)}
                          title="Remove experience"
                          aria-label={`Remove experience ${i + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="rb-repeat-row">
                      <div className="form-group">
                        <label htmlFor={`expRole${i}`}>
                          Role / Title <span className="rb-required-star">*</span>
                        </label>
                        <input
                          id={`expRole${i}`}
                          type="text"
                          required
                          placeholder="e.g. Software Engineer Intern"
                          value={exp.role || ''}
                          onChange={e => updateExperience(i, 'role', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`expDuration${i}`}>
                          Duration / Dates <span className="rb-required-star">*</span>
                        </label>
                        <input
                          id={`expDuration${i}`}
                          type="text"
                          required
                          placeholder="e.g. Oct 2025 – Dec 2025"
                          value={exp.duration || ''}
                          onChange={e => updateExperience(i, 'duration', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="rb-repeat-row">
                      <div className="form-group">
                        <label htmlFor={`expCompany${i}`}>
                          Company <span className="rb-required-star">*</span>
                        </label>
                        <input
                          id={`expCompany${i}`}
                          type="text"
                          required
                          placeholder="e.g. Sendora.ai"
                          value={exp.company || ''}
                          onChange={e => updateExperience(i, 'company', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`expDocType${i}`}>
                          Document / Tag <span className="rb-optional-tag">(optional)</span>
                        </label>
                        <input
                          id={`expDocType${i}`}
                          type="text"
                          placeholder="e.g. [Offer Letter] or [Experience Letter]"
                          value={exp.documentType || ''}
                          onChange={e => updateExperience(i, 'documentType', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`expTech${i}`}>
                        Tech Stack Used <span className="rb-optional-tag">(shown on company row)</span>
                      </label>
                      <input
                        id={`expTech${i}`}
                        type="text"
                        placeholder="e.g. Next.js, Node.js, REST APIs, OAuth 2.0, JWT, SQL"
                        value={exp.techStack || ''}
                        onChange={e => updateExperience(i, 'techStack', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`expDesc${i}`}>
                        Bullet Points / Responsibilities <span className="rb-required-star">*</span>
                      </label>
                      <textarea
                        id={`expDesc${i}`}
                        className="rb-textarea"
                        rows={4}
                        placeholder="• Engineered daily content aggregation...&#10;• Established secure authentication...&#10;• Designed scalable REST APIs..."
                        value={exp.description || ''}
                        onChange={e => updateExperience(i, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <div>
                  <button type="button" className="rb-add-btn" onClick={addExperience} id="addExperienceBtn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Experience Entry
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'skills':
        return (
          <div
            key="skills"
            className="rb-section rb-reorderable-section"
            draggable
            onDragStart={() => handleDragStart('skills')}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('skills')}
          >
            <div className="rb-section-bar">
              <div className="rb-section-drag-handle" title="Drag to reorder section">
                ⠿
              </div>
              <div className="rb-section-title" onClick={() => toggleCollapse('skills')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span>🛠️ Skills Summary <span className="rb-required-star">*</span></span>
                <span className="rb-collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
              </div>
              <div className="rb-section-controls">
                <button
                  type="button"
                  className="rb-reorder-btn"
                  onClick={() => moveSection(index, 'up')}
                  disabled={isFirst}
                  title="Move section up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="rb-reorder-btn"
                  onClick={() => moveSection(index, 'down')}
                  disabled={isLast}
                  title="Move section down"
                >
                  ▼
                </button>
              </div>
            </div>

            {!isCollapsed && (
              <div className="rb-section-content">
                <div className="form-group">
                  <label htmlFor="resumeSkillInput">
                    Add Skills <span className="rb-optional-tag">(Press Enter or separate by commas)</span>
                  </label>
                  <div className="rb-skill-input-wrap">
                    <input
                      id="resumeSkillInput"
                      type="text"
                      placeholder="e.g. Java, Python, React.js, Docker, MySQL…"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                    />
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      onClick={() => {
                        addSkill(skillInput);
                        setSkillInput('');
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {skills.length === 0 ? (
                  <div className="rb-empty-warning">
                    ⚠️ Add at least one skill.
                  </div>
                ) : (
                  <div className="rb-skill-tags">
                    {skills.map((skill, i) => (
                      <span key={i} className="rb-skill-tag">
                        {skill}
                        <button
                          type="button"
                          className="rb-skill-remove"
                          onClick={() => removeSkill(i)}
                          aria-label={`Remove skill ${skill}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'education':
        return (
          <div
            key="education"
            className="rb-section rb-reorderable-section"
            draggable
            onDragStart={() => handleDragStart('education')}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('education')}
          >
            <div className="rb-section-bar">
              <div className="rb-section-drag-handle" title="Drag to reorder section">
                ⠿
              </div>
              <div className="rb-section-title" onClick={() => toggleCollapse('education')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span>🎓 Education <span className="rb-required-star">*</span></span>
                <span className="rb-collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
              </div>
              <div className="rb-section-controls">
                <button
                  type="button"
                  className="rb-reorder-btn"
                  onClick={() => moveSection(index, 'up')}
                  disabled={isFirst}
                  title="Move section up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="rb-reorder-btn"
                  onClick={() => moveSection(index, 'down')}
                  disabled={isLast}
                  title="Move section down"
                >
                  ▼
                </button>
              </div>
            </div>

            {!isCollapsed && (
              <div className="rb-section-content">
                {educations.length === 0 && (
                  <div className="rb-empty-warning">
                    ⚠️ Add at least one education entry.
                  </div>
                )}

                {educations.map((edu, i) => (
                  <div key={i} className="rb-repeat-item">
                    <div className="rb-repeat-item-header">
                      <span className="rb-repeat-item-title">Education #{i + 1}</span>
                      <div className="rb-item-actions">
                        <button
                          type="button"
                          className="rb-item-move-btn"
                          onClick={() => moveEducation(i, 'up')}
                          disabled={i === 0}
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className="rb-item-move-btn"
                          onClick={() => moveEducation(i, 'down')}
                          disabled={i === educations.length - 1}
                          title="Move down"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          className="rb-remove-btn"
                          onClick={() => removeEducation(i)}
                          title="Remove education"
                          aria-label={`Remove education ${i + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`eduDegree${i}`}>
                        Degree & Major <span className="rb-required-star">*</span>
                      </label>
                      <input
                        id={`eduDegree${i}`}
                        type="text"
                        required
                        placeholder="e.g. Bachelor of Technology (B.Tech) – Computer Science and Engineering"
                        value={edu.degree || ''}
                        onChange={e => updateEducation(i, 'degree', e.target.value)}
                      />
                    </div>

                    <div className="rb-repeat-row">
                      <div className="form-group">
                        <label htmlFor={`eduSchool${i}`}>
                          School / University <span className="rb-required-star">*</span>
                        </label>
                        <input
                          id={`eduSchool${i}`}
                          type="text"
                          required
                          placeholder="e.g. Lovely Professional University"
                          value={edu.school || ''}
                          onChange={e => updateEducation(i, 'school', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`eduYear${i}`}>
                          Graduation Year / Dates <span className="rb-required-star">*</span>
                        </label>
                        <input
                          id={`eduYear${i}`}
                          type="text"
                          required
                          placeholder="e.g. July 2021 – August 2025"
                          value={edu.year || ''}
                          onChange={e => updateEducation(i, 'year', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="rb-repeat-row">
                      <div className="form-group">
                        <label htmlFor={`eduLocation${i}`}>Location</label>
                        <input
                          id={`eduLocation${i}`}
                          type="text"
                          placeholder="e.g. Punjab, India"
                          value={edu.location || ''}
                          onChange={e => updateEducation(i, 'location', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`eduGpa${i}`}>GPA / Percentage</label>
                        <input
                          id={`eduGpa${i}`}
                          type="text"
                          placeholder="e.g. 8.1 / 10 or 3.8 / 4.0"
                          value={edu.gpa || ''}
                          onChange={e => updateEducation(i, 'gpa', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div>
                  <button type="button" className="rb-add-btn" onClick={addEducation} id="addEducationBtn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Education Entry
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'projects':
        return (
          <div
            key="projects"
            className="rb-section rb-reorderable-section"
            draggable
            onDragStart={() => handleDragStart('projects')}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('projects')}
          >
            <div className="rb-section-bar">
              <div className="rb-section-drag-handle" title="Drag to reorder section">
                ⠿
              </div>
              <div className="rb-section-title" onClick={() => toggleCollapse('projects')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span>🚀 Projects <span className="rb-required-star">*</span></span>
                <span className="rb-collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
              </div>
              <div className="rb-section-controls">
                <button
                  type="button"
                  className="rb-reorder-btn"
                  onClick={() => moveSection(index, 'up')}
                  disabled={isFirst}
                  title="Move section up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="rb-reorder-btn"
                  onClick={() => moveSection(index, 'down')}
                  disabled={isLast}
                  title="Move section down"
                >
                  ▼
                </button>
              </div>
            </div>

            {!isCollapsed && (
              <div className="rb-section-content">
                {projects.length === 0 && (
                  <div className="rb-empty-warning">
                    ⚠️ Add at least one project entry.
                  </div>
                )}

                {projects.map((proj, i) => (
                  <div key={i} className="rb-repeat-item">
                    <div className="rb-repeat-item-header">
                      <span className="rb-repeat-item-title">Project #{i + 1}</span>
                      <div className="rb-item-actions">
                        <button
                          type="button"
                          className="rb-item-move-btn"
                          onClick={() => moveProject(i, 'up')}
                          disabled={i === 0}
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className="rb-item-move-btn"
                          onClick={() => moveProject(i, 'down')}
                          disabled={i === projects.length - 1}
                          title="Move down"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          className="rb-remove-btn"
                          onClick={() => removeProject(i)}
                          title="Remove project"
                          aria-label={`Remove project ${i + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="rb-repeat-row">
                      <div className="form-group">
                        <label htmlFor={`projName${i}`}>
                          Project Name <span className="rb-required-star">*</span>
                        </label>
                        <input
                          id={`projName${i}`}
                          type="text"
                          required
                          placeholder="e.g. AI Interview Preparation Platform"
                          value={proj.name || ''}
                          onChange={e => updateProject(i, 'name', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`projDuration${i}`}>
                          Year / Duration <span className="rb-required-star">*</span>
                        </label>
                        <input
                          id={`projDuration${i}`}
                          type="text"
                          required
                          placeholder="e.g. 2026 or 2023 – 2024"
                          value={proj.duration || ''}
                          onChange={e => updateProject(i, 'duration', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="rb-repeat-row">
                      <div className="form-group">
                        <label htmlFor={`projTech${i}`}>
                          Tech Stack <span className="rb-required-star">*</span>
                        </label>
                        <input
                          id={`projTech${i}`}
                          type="text"
                          required
                          placeholder="e.g. Next.js, Spring Boot, MySQL"
                          value={proj.techStack || ''}
                          onChange={e => updateProject(i, 'techStack', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`projLink${i}`}>
                          Live / Demo URL <span className="rb-optional-tag">(optional)</span>
                        </label>
                        <input
                          id={`projLink${i}`}
                          type="text"
                          placeholder="e.g. https://myproject.com or github.com/..."
                          value={proj.link || ''}
                          onChange={e => updateProject(i, 'link', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        Bullet Points / Key Features <span className="rb-required-star">*</span>
                      </label>
                      <div className="rb-bullets-container">
                        {(proj.bullets || []).map((bullet, bIdx) => (
                          <div key={bIdx} className="rb-bullet-input-row">
                            <span className="rb-bullet-dot">•</span>
                            <textarea
                              className="rb-bullet-textarea"
                              rows={2}
                              placeholder={`Key contribution, tech used, or outcome (bullet ${bIdx + 1})`}
                              value={bullet || ''}
                              onChange={e => updateProjectBullet(i, bIdx, e.target.value)}
                            />
                            <button
                              type="button"
                              className="rb-bullet-delete-btn"
                              onClick={() => removeProjectBullet(i, bIdx)}
                              title="Remove bullet"
                              aria-label={`Remove bullet ${bIdx + 1}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="rb-add-btn"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem', marginTop: '0.35rem' }}
                        onClick={() => addProjectBullet(i)}
                      >
                        + Add Bullet Point
                      </button>
                    </div>
                  </div>
                ))}

                <div>
                  <button type="button" className="rb-add-btn" onClick={addProject} id="addProjectBtn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Project Entry
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'certifications':
        return (
          <div
            key="certifications"
            className="rb-section rb-reorderable-section"
            draggable
            onDragStart={() => handleDragStart('certifications')}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('certifications')}
          >
            <div className="rb-section-bar">
              <div className="rb-section-drag-handle" title="Drag to reorder section">
                ⠿
              </div>
              <div className="rb-section-title" onClick={() => toggleCollapse('certifications')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span>🏆 Certifications & Achievements <span className="rb-required-star">*</span></span>
                <span className="rb-collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
              </div>
              <div className="rb-section-controls">
                <button
                  type="button"
                  className="rb-reorder-btn"
                  onClick={() => moveSection(index, 'up')}
                  disabled={isFirst}
                  title="Move section up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="rb-reorder-btn"
                  onClick={() => moveSection(index, 'down')}
                  disabled={isLast}
                  title="Move section down"
                >
                  ▼
                </button>
              </div>
            </div>

            {!isCollapsed && (
              <div className="rb-section-content">
                {certifications.length === 0 && (
                  <div className="rb-empty-warning">
                    ⚠️ Add at least one certification or achievement entry.
                  </div>
                )}

                {certifications.map((cert, i) => (
                  <div key={i} className="rb-repeat-item">
                    <div className="rb-repeat-item-header">
                      <span className="rb-repeat-item-title">Certification / Achievement #{i + 1}</span>
                      <div className="rb-item-actions">
                        <button
                          type="button"
                          className="rb-item-move-btn"
                          onClick={() => moveCertification(i, 'up')}
                          disabled={i === 0}
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className="rb-item-move-btn"
                          onClick={() => moveCertification(i, 'down')}
                          disabled={i === certifications.length - 1}
                          title="Move down"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          className="rb-remove-btn"
                          onClick={() => removeCertification(i)}
                          title="Remove certification"
                          aria-label={`Remove certification ${i + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`certName${i}`}>
                        Title / Name <span className="rb-required-star">*</span>
                      </label>
                      <input
                        id={`certName${i}`}
                        type="text"
                        required
                        placeholder="e.g. SQL Developer or Solved 270+ DSA problems on LeetCode..."
                        value={cert.name || ''}
                        onChange={e => updateCertification(i, 'name', e.target.value)}
                      />
                    </div>

                    <div className="rb-repeat-row">
                      <div className="form-group">
                        <label htmlFor={`certIssuer${i}`}>
                          Issuing Organization / Platform <span className="rb-optional-tag">(optional)</span>
                        </label>
                        <input
                          id={`certIssuer${i}`}
                          type="text"
                          placeholder="e.g. Great Learning Academy, CipherSchools, LeetCode"
                          value={cert.issuer || ''}
                          onChange={e => updateCertification(i, 'issuer', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`certLink${i}`}>
                          Link Label / URL <span className="rb-optional-tag">(optional)</span>
                        </label>
                        <input
                          id={`certLink${i}`}
                          type="text"
                          placeholder="e.g. [Certificate Link] or [Leet Code]"
                          value={cert.link || ''}
                          onChange={e => updateCertification(i, 'link', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div>
                  <button type="button" className="rb-add-btn" onClick={addCertification} id="addCertificationBtn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Certification / Achievement
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'summary':
        return (
          <div
            key="summary"
            className="rb-section rb-reorderable-section"
            draggable
            onDragStart={() => handleDragStart('summary')}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('summary')}
          >
            <div className="rb-section-bar">
              <div className="rb-section-drag-handle" title="Drag to reorder section">
                ⠿
              </div>
              <div className="rb-section-title" onClick={() => toggleCollapse('summary')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span>📝 Professional Summary <span className="rb-optional-tag">(optional)</span></span>
                <span className="rb-collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
              </div>
              <div className="rb-section-controls">
                <button
                  type="button"
                  className="rb-reorder-btn"
                  onClick={() => moveSection(index, 'up')}
                  disabled={isFirst}
                  title="Move section up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="rb-reorder-btn"
                  onClick={() => moveSection(index, 'down')}
                  disabled={isLast}
                  title="Move section down"
                >
                  ▼
                </button>
              </div>
            </div>

            {!isCollapsed && (
              <div className="rb-section-content">
                <div className="form-group">
                  <textarea
                    id="resumeSummary"
                    className="rb-textarea"
                    rows={3}
                    placeholder="A brief 2–3 line summary of your expertise and strengths…"
                    value={data.summary || ''}
                    onChange={e => updateField('summary', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="rb-panel rb-form-panel">
      <div className="rb-panel-header">
        <div className="rb-panel-title-wrap">
          <span className="rb-panel-icon">✏️</span>
          <h2 className="rb-panel-title">Resume Details</h2>
        </div>

        {/* Sleek Compact Header Actions: Clear Form & Import PDF */}
        <div className="rb-form-header-actions">
          <button
            type="button"
            className="rb-clear-btn"
            id="clearResumeFormBtn"
            onClick={handleClearForm}
            title="Clear all fields in the resume form"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            <span>Clear</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            id="resumePdfUploadInput"
          />
          <button
            type="button"
            className="rb-import-btn"
            id="uploadResumePdfBtn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Upload existing resume to auto-fill form"
          >
            {uploading ? (
              <>
                <span className="rb-spinner" />
                <span>Parsing PDF...</span>
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Import PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="rb-panel-body rb-form-body">
        {/* Dismissible Success Banner */}
        {parseSuccessMsg && (
          <div className="rb-alert-banner rb-alert-success" id="parseSuccessBanner" style={{ marginBottom: '1rem' }}>
            <div className="rb-alert-content">
              <span className="rb-alert-icon">✨</span>
              <div>
                <strong>Resume imported & structured successfully!</strong>
                <p>All sections have been automatically extracted and organized into individual fields below.</p>
              </div>
            </div>
            <button
              type="button"
              className="rb-alert-close"
              onClick={() => setParseSuccessMsg(false)}
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        )}

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="rb-alert-banner rb-alert-error" id="parseErrorBanner" style={{ marginBottom: '1rem' }}>
            <div className="rb-alert-content">
              <span className="rb-alert-icon">⚠️</span>
              <div>
                <strong>Could not parse PDF</strong>
                <p>{uploadError}</p>
              </div>
            </div>
            <button
              type="button"
              className="rb-alert-close"
              onClick={() => setUploadError('')}
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Fixed Top: Personal Info & Links (Required) ────────────────────── */}
        <div className="rb-section rb-personal-info-section">
          <div className="rb-section-bar">
            <div className="rb-section-title">
              👤 Personal Information & Links <span className="rb-required-star">*</span>
            </div>
          </div>

          <div className="rb-section-content">
            <div className="rb-repeat-row">
              <div className="form-group">
                <label htmlFor="resumeFullName">
                  Full Name <span className="rb-required-star">*</span>
                </label>
                <input
                  id="resumeFullName"
                  type="text"
                  required
                  placeholder="e.g. NAGA SAI BALAM"
                  value={data.fullName || ''}
                  onChange={e => updateField('fullName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="resumeTitle">
                  Job Title / Role <span className="rb-required-star">*</span>
                </label>
                <input
                  id="resumeTitle"
                  type="text"
                  required
                  placeholder="e.g. Full Stack Developer"
                  value={data.title || ''}
                  onChange={e => updateField('title', e.target.value)}
                />
              </div>
            </div>

            <div className="rb-repeat-row">
              <div className="form-group">
                <label htmlFor="resumeEmail">
                  Email <span className="rb-required-star">*</span>
                </label>
                <input
                  id="resumeEmail"
                  type="email"
                  required
                  placeholder="e.g. nagasaibalam123@gmail.com"
                  value={data.email || ''}
                  onChange={e => updateField('email', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="resumePhone">
                  Phone <span className="rb-required-star">*</span>
                </label>
                <input
                  id="resumePhone"
                  type="tel"
                  required
                  placeholder="e.g. +91-6302854330"
                  value={data.phone || ''}
                  onChange={e => updateField('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="rb-repeat-row">
              <div className="form-group">
                <label htmlFor="resumeLocation">
                  Location <span className="rb-optional-tag">(optional)</span>
                </label>
                <input
                  id="resumeLocation"
                  type="text"
                  placeholder="e.g. Punjab, India or Hyderabad, India"
                  value={data.location || ''}
                  onChange={e => updateField('location', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="resumePortfolio">
                  Portfolio / Website <span className="rb-optional-tag">(optional)</span>
                </label>
                <input
                  id="resumePortfolio"
                  type="text"
                  placeholder="e.g. portfolio.com or nagasai.dev"
                  value={data.portfolio || ''}
                  onChange={e => updateField('portfolio', e.target.value)}
                />
              </div>
            </div>

            <div className="rb-repeat-row">
              <div className="form-group">
                <label htmlFor="resumeLinkedin">
                  LinkedIn URL / Username <span className="rb-required-star">*</span>
                </label>
                <input
                  id="resumeLinkedin"
                  type="text"
                  required
                  placeholder="e.g. linkedin.com/in/nagasai-b-ab36b7285"
                  value={data.linkedin || ''}
                  onChange={e => updateField('linkedin', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="resumeGithub">
                  GitHub URL / Username <span className="rb-required-star">*</span>
                </label>
                <input
                  id="resumeGithub"
                  type="text"
                  required
                  placeholder="e.g. github.com/nagasai1155"
                  value={data.github || ''}
                  onChange={e => updateField('github', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Dynamic Reorderable Sections (Drag & Drop or Move Up/Down) ──────── */}
        <div className="rb-reorderable-sections-list">
          {sectionOrder.map((sectionKey, index) => renderSection(sectionKey, index))}
        </div>
      </div>
    </div>
  );
}
