'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg('Check your email to confirm your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
      }
    } catch (err: any) {
      setMsg(err?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        {mode === 'signup' ? 'Create your account' : 'Log in'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="you@example.com"
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={6}
            placeholder="At least 6 characters"
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10 }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 12,
            border: '1px solid #111',
            background: '#111',
            color: 'white',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Log in'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMsg(null);
            setMode(mode === 'signup' ? 'login' : 'signup');
          }}
          style={{
            padding: 12,
            borderRadius: 12,
            border: '1px solid #ccc',
            background: 'white',
            fontWeight: 600,
          }}
        >
          {mode === 'signup' ? 'I already have an account' : 'I need an account'}
        </button>

        {msg && <p style={{ marginTop: 4 }}>{msg}</p>}
      </form>
    </main>
  );
}
