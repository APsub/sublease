'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CreateListingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceMonthly, setPriceMonthly] = useState<number>(1200);
  const [beds, setBeds] = useState<number>(1);
  const [baths, setBaths] = useState<number>(1);

  const [addressText, setAddressText] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.replace('/login');
    })();
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        router.replace('/login');
        return;
      }

      const { error } = await supabase.from('listings').insert([
        {
          owner_id: user.id,
          title,
          description,
          price_monthly: priceMonthly,
          beds,
          baths,
          address_text: addressText,
          city,
          state,
          postal_code: postalCode || null,
          country: 'United States',
          status: 'draft',
          verified_status: 'unverified',
        },
      ]);

      if (error) throw error;

      setMsg('✅ Listing created (draft).');
      setTitle('');
      setDescription('');
      setAddressText('');
      setCity('');
      setState('');
      setPostalCode('');
    } catch (err: any) {
      setMsg(err?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Create Listing</h1>
      <p style={{ opacity: 0.8, marginBottom: 20 }}>
        This creates a <b>draft</b> listing in Supabase.
      </p>

      <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Modern 2BR near downtown"
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            placeholder="Explain lease dates, furniture, utilities, parking, etc."
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10 }}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Price / month ($)</span>
            <input
              value={priceMonthly}
              onChange={(e) => setPriceMonthly(Number(e.target.value))}
              type="number"
              min={0}
              required
              style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10 }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>Beds</span>
            <input
              value={beds}
              onChange={(e) => setBeds(Number(e.target.value))}
              type="number"
              min={0}
              required
              style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10 }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>Baths</span>
            <input
              value={baths}
              onChange={(e) => setBaths(Number(e.target.value))}
              type="number"
              step="0.5"
              min={0}
              required
              style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10 }}
            />
          </label>
        </div>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Address (text)</span>
          <input
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            required
            placeholder="123 Main St, Apt 4B"
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10 }}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>City</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10 }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>State</span>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
              placeholder="GA"
              style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10 }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>ZIP (optional)</span>
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10 }}
            />
          </label>
        </div>

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
          {loading ? 'Creating…' : 'Create draft listing'}
        </button>

        {msg && <p style={{ marginTop: 4 }}>{msg}</p>}
      </form>
    </main>
  );
}
