import { queryExecutor } from "../helper/queryExecutor.js";

export const createResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    const result = await queryExecutor(
      'INSERT INTO resumes (user_id, title) VALUES (?, ?)',
      [userId, title || 'Untitled Resume']
    );

    const resume = await queryExecutor('SELECT * FROM resumes WHERE id = ?', [result.insertId]);

    return res.status(201).json({ message: 'Resume created', resume: resume[0] });
  } catch (error) {
    console.error('[resume.controller > createResume]', error.message, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getResumes = async (req, res) => {
  try {
    const userId = req.user.id;

    const resumes = await queryExecutor(
      'SELECT r.*, t.name as template_name FROM resumes r LEFT JOIN templates t ON r.template_id = t.id WHERE r.user_id = ? ORDER BY r.updated_at DESC',
      [userId]
    );

    return res.status(200).json({ resumes });
  } catch (error) {
    console.error('[resume.controller > getResumes]', error.message, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getResumeById = async (req, res) => {
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

    return res.status(200).json({ resume: resumes[0] });
  } catch (error) {
    console.error('[resume.controller > getResumeById]', error.message, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, full_name, email, phone, skills, experience, education, summary, template_id } = req.body;

    const existing = await queryExecutor(
      'SELECT id FROM resumes WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const fields = [];
    const values = [];

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (full_name !== undefined) { fields.push('full_name = ?'); values.push(full_name); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (skills !== undefined) { fields.push('skills = ?'); values.push(skills); }
    if (experience !== undefined) { fields.push('experience = ?'); values.push(experience); }
    if (education !== undefined) { fields.push('education = ?'); values.push(education); }
    if (summary !== undefined) { fields.push('summary = ?'); values.push(summary); }
    if (template_id !== undefined) { fields.push('template_id = ?'); values.push(template_id); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    await queryExecutor(`UPDATE resumes SET ${fields.join(', ')} WHERE id = ?`, values);

    const updated = await queryExecutor('SELECT * FROM resumes WHERE id = ?', [id]);

    return res.status(200).json({ message: 'Resume updated', resume: updated[0] });
  } catch (error) {
    console.error('[resume.controller > updateResume]', error.message, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await queryExecutor(
      'SELECT id FROM resumes WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    await queryExecutor('DELETE FROM resumes WHERE id = ?', [id]);

    return res.status(200).json({ message: 'Resume deleted' });
  } catch (error) {
    console.error('[resume.controller > deleteResume]', error.message, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
