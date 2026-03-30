import { queryExecutor } from "../helper/queryExecutor.js";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transporter from "../config/mailer.js";

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const existing = await queryExecutor('SELECT id, is_verified FROM users WHERE email = ?', [email]);

    if (existing.length > 0 && existing[0].is_verified) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (existing.length > 0 && !existing[0].is_verified) {
      await queryExecutor(
        'UPDATE users SET name = ?, password_hash = ?, updated_at = NOW() WHERE email = ?',
        [name, passwordHash, email]
      );
    } else {
      await queryExecutor(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, passwordHash]
      );
    }

    await queryExecutor('DELETE FROM otps WHERE email = ?', [email]);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await queryExecutor(
      'INSERT INTO otps (email, otp_code, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    const templatePath = path.join(process.cwd(), "src/templates/otp-template.html");
    let otpTemplate = await fs.readFile(templatePath, "utf8");
    otpTemplate = otpTemplate.replace("{{OTP}}", otp);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Verification Code",
      html: otpTemplate
    });

    return res.status(200).json({ message: 'OTP sent successfully', email });

  } catch (error) {
    console.error('[auth.controller > signup]', error.message, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'email and otp are required' });
    }

    const otpRecord = await queryExecutor(
      'SELECT * FROM otps WHERE email = ? AND otp_code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (otpRecord.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await queryExecutor('UPDATE users SET is_verified = TRUE WHERE email = ?', [email]);
    await queryExecutor('DELETE FROM otps WHERE email = ?', [email]);

    const user = await queryExecutor('SELECT id, name, email FROM users WHERE email = ?', [email]);

    const token = generateToken(user[0]);

    return res.status(200).json({
      message: 'Email verified successfully',
      token,
      user: { id: user[0].id, name: user[0].name, email: user[0].email }
    });

  } catch (error) {
    console.error('[auth.controller > verifyOtp]', error.message, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const users = await queryExecutor('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('[auth.controller > login]', error.message, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
