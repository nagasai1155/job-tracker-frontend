// ─── Resume Domain Types ──────────────────────────────────────────────────────

export interface ExperienceItem {
  company: string;
  role: string;
  duration: string;
  description: string;
  techStack?: string;
  documentType?: string;
}

export interface EducationItem {
  school: string;
  degree: string;
  year: string;
  location?: string;
  gpa?: string;
}

export interface ProjectItem {
  name: string;
  techStack: string;
  duration: string;
  link?: string;
  bullets: string[];
}

export interface CertificationItem {
  name: string;
  issuer: string;
  link?: string;
}

export type SectionKey =
  | 'experience'
  | 'skills'
  | 'education'
  | 'projects'
  | 'certifications'
  | 'summary';

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'experience',
  'skills',
  'education',
  'projects',
  'certifications',
  'summary',
];

export interface ResumeData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location?: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  sectionOrder?: SectionKey[];
}

export const EMPTY_RESUME: ResumeData = {
  fullName: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  sectionOrder: DEFAULT_SECTION_ORDER,
};

export const EMPTY_EXPERIENCE: ExperienceItem = {
  company: '',
  role: '',
  duration: '',
  techStack: '',
  documentType: '',
  description: '',
};

export const EMPTY_EDUCATION: EducationItem = {
  school: '',
  degree: '',
  year: '',
  location: '',
  gpa: '',
};

export const EMPTY_PROJECT: ProjectItem = {
  name: '',
  techStack: '',
  duration: '',
  link: '',
  bullets: [''],
};

export const EMPTY_CERTIFICATION: CertificationItem = {
  name: '',
  issuer: '',
  link: '',
};

export function sanitizeResumeData(raw?: Partial<ResumeData> | null): ResumeData {
  if (!raw) return { ...EMPTY_RESUME };
  return {
    fullName: raw.fullName ?? '',
    title: raw.title ?? '',
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    location: raw.location ?? '',
    linkedin: raw.linkedin ?? '',
    github: raw.github ?? '',
    portfolio: raw.portfolio ?? '',
    summary: raw.summary ?? '',
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    education: Array.isArray(raw.education) ? raw.education : [],
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
    sectionOrder: Array.isArray(raw.sectionOrder) && raw.sectionOrder.length > 0 ? raw.sectionOrder : DEFAULT_SECTION_ORDER,
  };
}

export function isResumeEmpty(data?: ResumeData | null): boolean {
  if (!data) return true;
  const hasName = Boolean(data.fullName?.trim());
  const hasTitle = Boolean(data.title?.trim());
  const hasEmail = Boolean(data.email?.trim());
  const hasPhone = Boolean(data.phone?.trim());
  const hasSummary = Boolean(data.summary?.trim());
  const hasExp = (data.experience || []).some(e => e.role?.trim() || e.company?.trim());
  const hasEdu = (data.education || []).some(e => e.school?.trim() || e.degree?.trim());
  const hasSkills = (data.skills || []).some(s => s?.trim());
  const hasProjects = (data.projects || []).some(p => p.name?.trim());
  const hasCerts = (data.certifications || []).some(c => c.name?.trim());
  return !hasName && !hasTitle && !hasEmail && !hasPhone && !hasSummary && !hasExp && !hasEdu && !hasSkills && !hasProjects && !hasCerts;
}

export interface ResumeValidationError {
  field: string;
  message: string;
}

export function validateResume(data: ResumeData): { isValid: boolean; errors: ResumeValidationError[] } {
  const errors: ResumeValidationError[] = [];

  if (!data.fullName?.trim()) {
    errors.push({ field: 'fullName', message: 'Full Name is required' });
  }
  if (!data.title?.trim()) {
    errors.push({ field: 'title', message: 'Professional Title is required' });
  }
  if (!data.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  }
  if (!data.phone?.trim()) {
    errors.push({ field: 'phone', message: 'Phone is required' });
  }
  if (!data.linkedin?.trim()) {
    errors.push({ field: 'linkedin', message: 'LinkedIn URL is required' });
  }
  if (!data.github?.trim()) {
    errors.push({ field: 'github', message: 'GitHub URL is required' });
  }
  if (!data.experience || data.experience.length === 0 || !data.experience.some(e => e.company?.trim() || e.role?.trim())) {
    errors.push({ field: 'experience', message: 'At least one Experience entry is required' });
  }
  if (!data.skills || data.skills.length === 0 || !data.skills.some(s => s.trim())) {
    errors.push({ field: 'skills', message: 'At least one Skill is required' });
  }
  if (!data.projects || data.projects.length === 0 || !data.projects.some(p => p.name?.trim())) {
    errors.push({ field: 'projects', message: 'At least one Project is required' });
  }
  if (!data.certifications || data.certifications.length === 0 || !data.certifications.some(c => c.name?.trim())) {
    errors.push({ field: 'certifications', message: 'At least one Certification is required' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
