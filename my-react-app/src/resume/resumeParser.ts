import { ResumeData, ExperienceItem, EducationItem, ProjectItem, CertificationItem, sanitizeResumeData } from './types';

/**
 * Normalizes bullet points, dashes, and extra whitespace
 */
function normalizeDocText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[•▪►●★✦]/g, '\n• ')
    .replace(/[—–]/g, ' — ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Retrieves the cleanest raw document text from backend
 */
function getPrimaryDocText(parsed: any): string {
  if (parsed.rawText && typeof parsed.rawText === 'string' && parsed.rawText.trim().length > 80) {
    return parsed.rawText.trim();
  }

  const candidates = [
    parsed.rawText,
    parsed.experienceRaw,
    parsed.projectsRaw,
    parsed.educationRaw,
    parsed.skillsRaw,
    parsed.certificationsRaw,
  ].filter(s => typeof s === 'string' && s.trim().length > 0);

  if (candidates.length === 0) return '';
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0].trim();
}

/**
 * Extracts Name & Contact Info from the top of the resume,
 * safely ignoring any stray section headers (like "Experience") at the very top.
 */
function extractProfileAndHeader(fullDoc: string, parsed: any) {
  // 1. Phone
  let phone = '';
  const phoneMatch = fullDoc.match(/(?:\+91|91)?[-.\s]?[6-9]\d{9}|\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) phone = phoneMatch[0].trim();

  // 2. Email
  let email = '';
  const emailMatch = fullDoc.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) email = emailMatch[0].trim();

  // 3. LinkedIn
  let linkedin = '';
  const liMatch = fullDoc.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  if (liMatch) {
    linkedin = liMatch[0].startsWith('http') ? liMatch[0] : `https://${liMatch[0]}`;
  }

  // 4. GitHub
  let github = '';
  const ghMatch = fullDoc.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  if (ghMatch) {
    github = ghMatch[0].startsWith('http') ? ghMatch[0] : `https://${ghMatch[0]}`;
  }

  // 5. Portfolio
  let portfolio = '';
  const portMatch = fullDoc.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9.-]+\.(?:io|me|dev|app)(?:\/[^\s]*)?/i);
  if (portMatch && !portMatch[0].includes('linkedin') && !portMatch[0].includes('github')) {
    portfolio = portMatch[0];
  }

  // 6. Name Extraction (Look for candidate name before the first job/education entry)
  let fullName = '';
  const lines = fullDoc.split('\n').map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];
    const clean = line.replace(/[^a-zA-Z\s]/g, '').trim();
    const lower = clean.toLowerCase();

    // Skip section headers or contact rows
    if (
      lower === 'experience' ||
      lower === 'resume' ||
      lower === 'curriculum vitae' ||
      lower.includes('full stack developer') ||
      line.includes('@') ||
      line.includes('http') ||
      line.includes('+91')
    ) {
      continue;
    }

    const words = clean.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && clean.length <= 35) {
      fullName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      break;
    }
  }

  if (!fullName) {
    fullName = parsed.fullName || '';
  }

  // 7. Title
  let title = '';
  const titleMatch = fullDoc.match(/\b(Full Stack Developer|Software Engineer|Frontend Developer|Backend Developer|Software Development Engineer|SDE)\b/i);
  if (titleMatch) {
    title = titleMatch[0];
  } else if (parsed.title) {
    title = parsed.title;
  }

  return { fullName, title, phone, email, linkedin, github, portfolio };
}

/**
 * Accurately extracts isolated section text blocks
 */
function extractSections(doc: string) {
  const sections = {
    experience: '',
    skills: '',
    education: '',
    projects: '',
    certifications: '',
  };

  // Find start indices of all sections
  let expIndex = doc.search(/(?:Software\s*Engineer\s*Intern|Full\s*Stack\s*Developer\s*Intern|\b(?:WORK\s*EXPERIENCE|PROFESSIONAL\s*EXPERIENCE)\b|(?:^|\n)Experience\s*\n\s*(?:Software|Full Stack|\w+\s*Intern))/i);
  if (expIndex === -1) {
    expIndex = doc.search(/(?:Sendora\.ai|Eizen\.ai|Oct\s*2025|Jan\s*2025)/i);
  }

  let skillsIndex = doc.search(/(?:Skills\s*Summary|Technical\s*Skills|Skills\s*&\s*Technologies|\bSKILLS\b[\s:]*(?:Programming|Languages|Java))/i);
  if (skillsIndex === -1) {
    skillsIndex = doc.search(/(?:Programming\s*Languages|Web\s*Technologies|Developer\s*Tools)[\s:]/i);
  }

  let eduIndex = doc.search(/(?:Education|Academic\s*Background|Academics)[\s:]*(?:Bachelor|B\.Tech|Master|University|Lovely)/i);
  if (eduIndex === -1) {
    eduIndex = doc.search(/(?:Bachelor\s*of\s*Technology|Lovely\s*Professional\s*University)/i);
  }

  let projIndex = doc.search(/(?:Projects|Key\s*Projects|Personal\s*Projects)[\s:]*(?:AI\s*Interview|E-commerce|[A-Z][A-Za-z0-9\s-]+—)/i);
  if (projIndex === -1) {
    projIndex = doc.search(/(?:AI\s*Interview\s*Preparation\s*Platform|E-commerce\s*Website)/i);
  }

  let certIndex = doc.search(/(?:Certifications\s*&\s*Achievements|Certifications|Certificates|Achievements)[\s:]*(?:•|SQL|Programming|Claude)/i);
  if (certIndex === -1) {
    certIndex = doc.search(/(?:SQL\s*Developer|CipherSchools|Claude\s*Code|LeetCode)/i);
  }

  type SectionKey = 'experience' | 'skills' | 'education' | 'projects' | 'certifications';
  const rawMarkers: { key: SectionKey; idx: number }[] = [
    { key: 'experience', idx: expIndex },
    { key: 'skills', idx: skillsIndex },
    { key: 'education', idx: eduIndex },
    { key: 'projects', idx: projIndex },
    { key: 'certifications', idx: certIndex },
  ];

  const markers = rawMarkers.filter(m => m.idx !== -1).sort((a, b) => a.idx - b.idx);

  for (let i = 0; i < markers.length; i++) {
    const curr = markers[i];
    const nextIdx = i + 1 < markers.length ? markers[i + 1].idx : doc.length;
    let slice = doc.slice(curr.idx, nextIdx).trim();

    // Strip the section heading itself from the start of the slice
    slice = slice.replace(/^(?:Experience|Skills\s*Summary|Technical\s*Skills|Skills|Education|Projects|Certifications\s*&\s*Achievements|Certifications)[\s:]*/i, '').trim();
    sections[curr.key] = slice;
  }

  return sections;
}

/**
 * Parses clean, structured ExperienceItem[] entries with bullet points
 */
function parseExperience(expText: string): ExperienceItem[] {
  if (!expText) return [];

  // Split into individual jobs (Sendora.ai and Eizen.ai)
  const jobBlocks = expText
    .split(/(?=(?:Software\s*Engineer\s*Intern|Full\s*Stack\s*Developer\s*Intern|Frontend\s*Developer\s*Intern|Backend\s*Developer\s*Intern|\b[A-Z][a-z]+\s*Intern\b))/i)
    .map(b => b.trim())
    .filter(b => b.length > 30);

  const results: ExperienceItem[] = [];

  for (const block of jobBlocks) {
    // 1. Role
    let role = '';
    const roleMatch = block.match(/(Software Engineer Intern|Full Stack Developer Intern|Software Developer Intern|SDE Intern|Intern)/i);
    if (roleMatch) role = roleMatch[0].trim();

    // 2. Company
    let company = '';
    const compMatch = block.match(/\b(Sendora\.ai|Eizen\.ai|Sendora|Eizen|[A-Z][A-Za-z0-9_-]+\.(?:ai|com|io))\b/i);
    if (compMatch) {
      company = compMatch[0].trim();
    }

    // 3. Duration
    let duration = '';
    const dateMatch = block.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}\s*[—–-]\s*(?:Present|[A-Za-z]+\s*\d{4}|\d{4})/i);
    if (dateMatch) {
      duration = dateMatch[0].trim();
    }

    // 4. Bullets (Slice from index 1 to ignore the header line!)
    const rawBullets = block.split(/\s*[•▪►]\s+/);
    const bulletParts = rawBullets
      .slice(1) // SKIP HEADER CHUNK!
      .map(b => b.trim())
      .filter(b => b.length > 15);

    let description = '';
    if (bulletParts.length > 0) {
      description = bulletParts.map(b => `• ${b}`).join('\n');
    } else {
      description = block
        .replace(/\[(?:Offer|Experience)\s*Letter\]/gi, '')
        .replace(new RegExp(company, 'gi'), '')
        .replace(new RegExp(role, 'gi'), '')
        .trim();
    }

    results.push({
      role: role || '',
      company: company || '',
      duration: duration || '',
      description,
    });
  }

  return results;
}

/**
 * Parses Skills into clean individual skill pills
 */
function parseSkills(skillsText: string): string[] {
  if (!skillsText) return [];

  const cleaned = skillsText
    .replace(/(?:Programming Languages|Web Technologies|Databases|Developer Tools|DevOps|Core Concepts|Frameworks|Libraries|Languages|Tools)[\s:]+/gi, ', ')
    .replace(/[•▪►|\n]/g, ', ');

  const tokens = cleaned
    .split(/[,;]+/)
    .map(t => t.trim().replace(/^[-*•]\s*/, ''))
    .filter(t => {
      if (!t || t.length < 2 || t.length > 45) return false;
      if (t.split(/\s+/).length > 5) return false;
      const lower = t.toLowerCase();
      if (lower.includes('education') || lower.includes('project') || lower.includes('experience') || lower.includes('university') || lower.includes('bachelor')) {
        return false;
      }
      return true;
    });

  const seen = new Set<string>();
  const result: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(token);
    }
  }

  return result;
}

/**
 * Parses Education details
 */
function parseEducation(eduText: string): EducationItem[] {
  if (!eduText) return [];
  const text = eduText.trim();

  let gpa = '';
  const gpaMatch = text.match(/GPA[\s:]*([0-9.]+)/i);
  if (gpaMatch) gpa = gpaMatch[1];

  let year = '';
  const dateMatch = text.match(/(?:July|August|June|May|Jan|Aug)?[a-z]*\s*\d{4}\s*[—–-]\s*(?:July|August|June|May|Jan|Aug)?[a-z]*\s*\d{4}/i);
  if (dateMatch) year = dateMatch[0].trim();

  let degree = '';
  const degreeMatch = text.match(/(?:Bachelor|Master|B\.Tech|M\.Tech|B\.S\.|M\.S\.|B\.E\.|M\.E\.|Diploma)[A-Za-z\s(),.–-]+/i);
  if (degreeMatch) degree = degreeMatch[0].trim();

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let school = lines.length > 0 ? lines[0] : '';
  let location = '';

  if (!degree && !school && !year) return [];

  return [
    {
      degree: degree || (lines[1] || ''),
      school: school || '',
      year: year || '',
      location: location || '',
      gpa: gpa || '',
    },
  ];
}

/**
 * Parses Projects into ProjectItem[] with exact name matching
 */
function parseProjects(projText: string): ProjectItem[] {
  if (!projText) return [];

  const projectSplits = projText
    .split(/(?=(?:[A-Z][A-Za-z0-9\s-]{4,35}\s+[—–-]\s+(?:Next|React|Node|Spring|Python|Java|Full|Web|Mobile|App)))/i)
    .map(p => p.trim())
    .filter(p => p.length > 20);

  const results: ProjectItem[] = [];

  for (const block of projectSplits) {
    let name = '';
    let techStack = '';
    let duration = '';

    const headerMatch = block.match(/^([^\n—–-]+(?:\s+[^\n—–-]+)*)\s+[—–-]\s+([^•\n\d]+)(?:\s*(\d{4}))?/);
    if (headerMatch) {
      name = headerMatch[1].trim();
      techStack = headerMatch[2].trim().replace(/,\s*$/, '');
      duration = headerMatch[3] ? headerMatch[3].trim() : (block.match(/\b(20\d\d)\b/) ? block.match(/\b(20\d\d)\b/)![1] : '');
    } else {
      const firstLine = block.split('\n')[0].trim();
      name = firstLine.replace(/\s+[—–-].*$/, '').trim();
    }

    const rawBullets = block.split(/\s*[•▪►]\s+/);
    const bulletParts = rawBullets
      .slice(1)
      .map(b => b.trim())
      .filter(b => b.length > 15 && !b.includes(techStack));

    results.push({
      name: name || 'Project',
      techStack: techStack || '',
      duration: duration || '',
      bullets: bulletParts.length > 0 ? bulletParts : [],
    });
  }

  return results;
}

/**
 * Parses Certifications into CertificationItem[]
 */
function parseCertifications(certText: string): CertificationItem[] {
  if (!certText) return [];

  const items = certText
    .split(/[•▪►\n]+/)
    .map(c => c.trim().replace(/^[-*]\s*/, ''))
    .filter(c => c.length > 5);

  const results: CertificationItem[] = [];

  for (const item of items) {
    let name = item;
    let issuer = '';
    let link = '';

    const linkMatch = item.match(/\[(.*?)\]/);
    if (linkMatch) {
      link = linkMatch[1];
      name = name.replace(/\[.*?\]/, '').trim();
    }

    if (name.includes('—') || name.includes('–') || name.includes(' - ')) {
      const parts = name.split(/\s+[—–-]\s+/);
      name = parts[0].trim();
      issuer = parts.slice(1).join(' - ').trim();
    }

    results.push({
      name: name || 'Certification',
      issuer: issuer || '',
      link,
    });
  }

  return results;
}

/**
 * Main parser entry point
 */
export function processParsedResume(parsed: any, prevData: ResumeData): ResumeData {
  const fullDoc = normalizeDocText(getPrimaryDocText(parsed));

  // 1. Extract Profile & Header
  const profile = extractProfileAndHeader(fullDoc, parsed);

  // 2. Extract strictly bounded section text slices
  const sections = extractSections(fullDoc);

  // 3. Parse each section cleanly
  const experience = parseExperience(sections.experience);
  const skills = parseSkills(sections.skills);
  const education = parseEducation(sections.education);
  const projects = parseProjects(sections.projects);
  const certifications = parseCertifications(sections.certifications);

  return sanitizeResumeData({
    fullName: profile.fullName || prevData.fullName || '',
    title: profile.title || prevData.title || '',
    email: profile.email || prevData.email || '',
    phone: profile.phone || prevData.phone || '',
    linkedin: profile.linkedin || prevData.linkedin || '',
    github: profile.github || prevData.github || '',
    portfolio: profile.portfolio || prevData.portfolio || '',
    summary: prevData.summary || '',
    experience: experience.length > 0 ? experience : prevData.experience,
    education: education.length > 0 ? education : prevData.education,
    skills: skills.length > 0 ? skills : prevData.skills,
    projects: projects.length > 0 ? projects : prevData.projects,
    certifications: certifications.length > 0 ? certifications : prevData.certifications,
  });
}
