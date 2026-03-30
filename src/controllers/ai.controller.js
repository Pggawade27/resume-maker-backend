import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const sectionPrompts = {
  skills: 'You are an expert resume writer. Improve the following skills section to be more impactful, well-organized, and ATS-friendly. Add related skills the candidate might know. Return ONLY a plain comma-separated list of skills (e.g. "React, Node.js, Python, AWS"). Do NOT use markdown, bullet points, bold, headings, or any formatting. No explanations.',
  experience: 'You are an expert resume writer. Improve the following work experience to use strong action verbs, quantify achievements where possible, and make it ATS-friendly. Keep the same structure but make bullet points more impactful. Return ONLY plain text. Do NOT use markdown, bold (**), or any special formatting. Use simple line breaks and hyphens (-) for bullet points. No explanations.',
  education: 'You are an expert resume writer. Improve the following education section to be well-formatted and professional. Highlight relevant coursework and achievements. Return ONLY plain text. Do NOT use markdown, bold (**), or any special formatting. No explanations.',
  summary: 'You are an expert resume writer. Write or improve the following professional summary to be compelling, concise (2-3 sentences), and tailored for ATS systems. Return ONLY plain text. Do NOT use markdown, bold (**), or any special formatting. No explanations.',
  general: 'You are an expert resume writer. Improve the following resume content to be more professional, impactful, and ATS-friendly. Return ONLY plain text. Do NOT use markdown, bold (**), or any special formatting. No explanations.',
};

export const improveContent = async (req, res) => {
  try {
    const { section, content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'content is required' });
    }

    const systemPrompt = sectionPrompts[section] || sectionPrompts.general;

    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    let improved = completion.choices[0].message.content || "";

    improved = improved
      .replace(/\*\*/g, '')
      .replace(/^[*•]\s*/gm, '- ')
      .replace(/^#+\s*/gm, '')
      .trim();

    return res.status(200).json({ improved });
  } catch (error) {
    console.error('[ai.controller > improveContent]', error?.message || error);

    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      return res.status(503).json({ message: 'AI service is not configured. Please set a valid API key.' });
    }

    return res.status(500).json({ message: 'Failed to improve content. Please try again.' });
  }
};
