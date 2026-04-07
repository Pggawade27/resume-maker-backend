import { queryExecutor } from "../helper/queryExecutor.js";
import fs from "fs/promises";
import path from "path";

const escapeHtml = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
};

const getInitials = (fullName) => {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getFirstName = (fullName) => {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/)[0];
};

const getLastName = (fullName) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return '';
  return parts.slice(1).join(' ');
};

const templateMap = {
  1: 'jake-resume.html',
  2: 'awesome-cv.html',
  3: 'moderncv-classic.html',
  4: 'altacv.html',
  5: 'deedy-resume.html',
  6: 'crisp-minimal.html',
  // legacy fallbacks
  7: 'modern-professional.html',
  8: 'classic-executive.html',
  9: 'creative-designer.html',
};

export const downloadResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const resumes = await queryExecutor(
      'SELECT r.*, t.name as template_name FROM resumes r LEFT JOIN templates t ON r.template_id = t.id WHERE r.id = ? AND r.user_id = ?',
      [id, userId]
    );

    if (resumes.length === 0) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const resume = resumes[0];
    const templateFile = templateMap[resume.template_id] || 'jake-resume.html';
    const templatePath = path.join(process.cwd(), 'src/templates', templateFile);

    let html;
    try {
      html = await fs.readFile(templatePath, 'utf8');
    } catch {
      const fallbackPath = path.join(process.cwd(), 'src/templates/jake-resume.html');
      html = await fs.readFile(fallbackPath, 'utf8');
    }

    html = html
      .replace(/{{FULL_NAME}}/g, escapeHtml(resume.full_name) || 'Your Name')
      .replace(/{{FIRSTNAME}}/g, escapeHtml(getFirstName(resume.full_name)))
      .replace(/{{LASTNAME}}/g, escapeHtml(getLastName(resume.full_name)))
      .replace(/{{INITIALS}}/g, getInitials(resume.full_name))
      .replace(/{{EMAIL}}/g, escapeHtml(resume.email) || '')
      .replace(/{{PHONE}}/g, escapeHtml(resume.phone) || '')
      .replace(/{{SUMMARY}}/g, escapeHtml(resume.summary) || '')
      .replace(/{{SKILLS}}/g, escapeHtml(resume.skills) || '')
      .replace(/{{EXPERIENCE}}/g, escapeHtml(resume.experience) || '')
      .replace(/{{EDUCATION}}/g, escapeHtml(resume.education) || '');

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${(resume.full_name || 'resume').replace(/[^a-zA-Z0-9 ]/g, '')}.html"`);

    return res.send(html);
  } catch (error) {
    console.error('[pdf.controller > downloadResume]', error.message, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
