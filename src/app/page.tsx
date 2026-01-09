'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        router.replace('/login');
        return;
      }
      setEmail(user.email ?? null);
    })();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-black" />
            <span className="text-lg font-extrabold tracking-tight">Sublease</span>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <Link className="text-sm font-medium text-gray-700 hover:text-black" href="/create">
              Create listing
            </Link>
            <Link className="text-sm font-medium text-gray-700 hover:text-black" href="/search">
              Browse
            </Link>
            <Link className="text-sm font-medium text-gray-700 hover:text-black" href="/messages">
              Messages
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-600 md:inline">
              {email ? `Signed in: ${email}` : 'Loading…'}
            </span>
            <button
              onClick={logout}
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              Find and post subleases across the U.S.
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              A clean, organized marketplace for apartments and homes. Post your place in minutes and chat in-app.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/create"
                className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                Create a listing
              </Link>
              <Link
                href="/search"
                className="rounded-2xl border px-6 py-3 text-sm font-semibold hover:bg-gray-50"
              >
                Browse listings
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border p-4">
                <p className="text-sm font-semibold">High-quality photos</p>
                <p className="mt-1 text-sm text-gray-600">Clean galleries, fast loading.</p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-sm font-semibold">Location search</p>
                <p className="mt-1 text-sm text-gray-600">City, state, range filters.</p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-sm font-semibold">In-app messaging</p>
                <p className="mt-1 text-sm text-gray-600">Chat without sharing info.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-gray-50 p-6">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">Quick actions</p>
              <div className="mt-4 grid gap-3">
                <Link
                  href="/create"
                  className="rounded-2xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50"
                >
                  ➕ Create a new listing
                </Link>
                <Link
                  href="/search"
                  className="rounded-2xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50"
                >
                  🔎 Browse listings
                </Link>
                <Link
                  href="/messages"
                  className="rounded-2xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50"
                >
                  💬 Open messages
                </Link>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Next: we’ll build Browse + Messages so these links work.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-gray-500">
          © {new Date().getFullYear()} Sublease. Marketplace only — we don’t create legal agreements.
        </div>
      </footer>
    </main>
  );
}
