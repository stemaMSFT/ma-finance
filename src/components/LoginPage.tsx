import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const COLORS = {
  bg: '#0f172a',
  card: '#1e293b',
  accent: '#3b82f6',
  accentHover: '#2563eb',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  border: '#334155',
  error: '#ef4444',
  errorBg: 'rgba(239, 68, 68, 0.1)',
};

export default function LoginPage() {
  const { login, error, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: COLORS.textMuted }}>Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await login(email, password);
    setSubmitting(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>ma-finance</h1>
        <p style={styles.tagline}>Scenario Planner</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.error}>{error}</div>
          )}

          <label style={styles.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              autoComplete="email"
              required
              autoFocus
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: COLORS.bg,
    padding: 20,
  },
  card: {
    background: COLORS.card,
    borderRadius: 16,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 400,
    textAlign: 'center',
    border: `1px solid ${COLORS.border}`,
    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
  },
  logo: {
    fontSize: 28,
    fontWeight: 800,
    color: COLORS.accent,
    margin: 0,
    letterSpacing: '-0.5px',
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textMuted,
    margin: '4px 0 32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  label: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.textMuted,
    textAlign: 'left' as const,
  },
  input: {
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.bg,
    color: COLORS.text,
    fontSize: 15,
    outline: 'none',
  },
  button: {
    marginTop: 8,
    padding: '12px 24px',
    borderRadius: 8,
    border: 'none',
    background: COLORS.accent,
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  error: {
    padding: '10px 14px',
    borderRadius: 8,
    background: COLORS.errorBg,
    color: COLORS.error,
    fontSize: 13,
    fontWeight: 500,
    border: `1px solid ${COLORS.error}33`,
  },
};
