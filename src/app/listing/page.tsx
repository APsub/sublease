'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

type Listing = {
  id: string;
  title: string | null;
  city: string | null;
  state: string | null;
  price_monthly: number | null;
  address_text: string | null;
  published_at: string | null;
};

export default function ListingsPage() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);

      const { data, error } = await supabase
        .from('listings')
        .select('id,title,city,state,price_monthly,address_text,published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) {
        setMsg(error.message);
        setListings([]);
      } else {
        setListings((data ?? []) as Listing[]);
      }

      setLoading(false);
    })();
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Listings</h1>
      <p style={{ opacity: 0.8, marginBottom: 20 }}>
        Public listings (published only).
      </p>

      {loading && <p>Loading…</p>}
      {msg && <p style={{ color: 'crimson' }}>{msg}</p>}

      {!loading && !msg && listings.length === 0 && (
        <p>No published listings yet.</p>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {listings.map((l) => (
          <div
            key={l.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 14,
              padding: 14,
              display: 'grid',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontWeight: 800 }}>{l.title ?? 'Untitled listing'}</div>
              <div style={{ fontWeight: 700 }}>
                {typeof l.price_monthly === 'number' ? `$${l.price_monthly}/mo` : ''}
              </div>
            </div>

            <div style={{ opacity: 0.85 }}>
              {l.address_text ?? ''}{l.city || l.state ? ' — ' : ''}
              {[l.city, l.state].filter(Boolean).join(', ')}
            </div>

            <Link href={`/listings/${l.id}`} style={{ fontWeight: 700 }}>
              View
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
