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

    const templateMap = {
      1: 'modern-professional.html',
      2: 'classic-executive.html',
      3: 'creative-designer.html',
    };

    const templateFile = templateMap[resume.template_id] || 'modern-professional.html';
    const templatePath = path.join(process.cwd(), 'src/templates', templateFile);

    let html;
    try {
      html = await fs.readFile(templatePath, 'utf8');
    } catch {
      const fallbackPath = path.join(process.cwd(), 'src/templates/modern-professional.html');
      html = await fs.readFile(fallbackPath, 'utf8');
    }

    html = html
      .replace(/{{FULL_NAME}}/g, escapeHtml(resume.full_name) || 'Your Name')
      .replace(/{{EMAIL}}/g, escapeHtml(resume.email) || '')
      .replace(/{{PHONE}}/g, escapeHtml(resume.phone) || '')
      .replace(/{{SUMMARY}}/g, escapeHtml(resume.summary) || '')
      .replace(/{{SKILLS}}/g, escapeHtml(resume.skills) || '')
      .replace(/{{EXPERIENCE}}/g, escapeHtml(resume.experience) || '')
      .replace(/{{EDUCATION}}/g, escapeHtml(resume.education) || '');

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.full_name || 'resume'}.html"`);

    return res.send(html);
  } catch (error) {
    console.error('[pdf.controller > downloadResume]', error.message, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
