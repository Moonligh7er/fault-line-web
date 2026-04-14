import { Suspense } from 'react';
import LoginForm from './login-form';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to Fault Line with a magic link.',
};

export default function LoginPage() {
  return (
    <div style={{ maxWidth: 420, margin: '48px auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Sign in</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        We&apos;ll email you a secure link. No password required.
      </p>
      <Suspense fallback={<div className="card">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
