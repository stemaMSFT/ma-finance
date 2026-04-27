/**
 * Auth routes: login, logout, and session status.
 * Uses cookie-session for simple signed-cookie auth.
 */

import { Router } from 'express';
import bcrypt from 'bcrypt';

const router = Router();

/** POST /auth/login — validate credentials, set session */
router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  const expectedEmail = process.env.AUTH_EMAIL;
  const expectedHash = process.env.AUTH_PASSWORD_HASH;

  if (!expectedEmail || !expectedHash) {
    console.error('[auth] AUTH_EMAIL or AUTH_PASSWORD_HASH not configured');
    res.status(500).json({ error: 'Server authentication not configured' });
    return;
  }

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailMatch = normalizedEmail === expectedEmail.trim().toLowerCase();
  const passwordMatch = await bcrypt.compare(password, expectedHash);

  if (!emailMatch || !passwordMatch) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // Set session
  req.session!.authenticated = true;
  req.session!.email = normalizedEmail;
  res.json({ ok: true });
});

/** POST /auth/logout — clear session */
router.post('/logout', (_req, res) => {
  _req.session = null;
  res.json({ ok: true });
});

/** GET /auth/status — check if currently authenticated */
router.get('/status', (req, res) => {
  if (req.session?.authenticated) {
    res.json({ authenticated: true, email: req.session.email });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
