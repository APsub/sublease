'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useParams, useRouter } from 'next/navigation';

type Listing = {
  id: string;
  owner_id: string;
  title: string | null;
  description: string | null;
  price_monthly: number | null;
  beds: number | null;
  baths: number | null;
  address_text: string | null;
  city: string | null;
  state: string | null;
};

type Photo = {
  id?: string;
  listing_id: string;
  room: 'kitchen' | 'bedroom' | 'bathroom' | 'living_room' | string;
  url: string;
  created_at: string;
};

const ROOM_LABEL: Record<string, string> = {
  kitchen: 'Kitchen',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  living_room: 'Living Room',
};

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);

      const { data: l, error: lErr } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (lErr) {
        setMsg('Listing not found or not published.');
        setListing(null);
        setPhotos([]);
        setLoading(false);
        return;
      }

      setListing(l as Listing);

      const { data: p, error: pErr } = await supabase
        .from('listing_photos')
        .select('listing_id,room,url,created_at')
        .eq('listing_id', id)
        .order('created_at', { ascending: true });

 if (!pErr) setPhotos((p ?? []) as Photo[]);

      setLoading(false);
    })();
  }, [id]);

  const photosByRoom = useMemo(() => {
    const grouped: Record<string, Photo[]> = {};
    for (const ph of photos) {
      grouped[ph.room] = grouped[ph.room] || [];
      grouped[ph.room].push(ph);
    }
    return grouped;
  }, [photos]);

  async function handleTextPerson() {
    setMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!listing) return;

    // prevent messaging yourself
    if (listing.owner_id === user.id) {
      setMsg("You can't message your own listing.");
      return;
    }

    // Find existing conversation
    const { data: existing, error: findErr } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', id)
      .eq('buyer_id', user.id)
      .maybeSingle();

    if (existing?.id) {
      router.push(`/messages/${existing.id}`);
      return;
    }
    if (findErr) {
      setMsg(findErr.message);
      return;
    }

    // Create new conversation
    const { data: created, error: createErr } = await supabase
      .from('conversations')
      .insert([
        {
          listing_id: id,
          buyer_id: user.id,
          seller_id: listing.owner_id,
        },
      ])
      .select('id')
      .single();

    if (createErr) {
      setMsg(createErr.message);
      return;
    }

    router.push(`/messages/${created.id}`);
  }

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>;
  if (msg && !listing) return <p style={{ padding: 40 }}>{msg}</p>;
  if (!listing) return <p style={{ padding: 40 }}>Not found.</p>;

  return (
    <main style={{ maxWidth: 1000, margin: '40px auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 6 }}>
            {listing.title ?? 'Untitled listing'}
          </h1>
          <div style={{ opacity: 0.8, marginBottom: 12 }}>
            {listing.address_text}
            {listing.city || listing.state ? ' — ' : ''}
            {[listing.city, listing.state].filter(Boolean).join(', ')}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {typeof listing.price_monthly === 'number' ? `$${listing.price_monthly}/month` : ''}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 14, opacity: 0.9 }}>
            {listing.beds !== null && <span>🛏 {listing.beds} beds</span>}
            {listing.baths !== null && <span>🛁 {listing.baths} baths</span>}
          </div>
        </div>

        <button
          onClick={handleTextPerson}
          style={{
            padding: 12,
            borderRadius: 12,
            border: '1px solid #111',
            background: '#111',
            color: 'white',
            fontWeight: 800,
            cursor: 'pointer',
            height: 46,
            whiteSpace: 'nowrap',
          }}
        >
          Text the person
        </button>
      </div>

      {msg && <p style={{ color: 'crimson', marginTop: 12 }}>{msg}</p>}

      <hr style={{ margin: '22px 0' }} />

      {/* Photos */}
      <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 10 }}>Photos</h2>

      {photos.length === 0 ? (
        <p style={{ opacity: 0.75 }}>No photos uploaded.</p>
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          {Object.keys(photosByRoom).map((room) => (
            <section key={room} style={{ display: 'grid', gap: 10 }}>
              <div style={{ fontWeight: 900 }}>{ROOM_LABEL[room] ?? room}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {photosByRoom[room].map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: 14,
                      overflow: 'hidden',
                      border: '1px solid #ddd',
                      height: 220,
                      background: '#f3f4f6',
                    }}
                  >
                    <img
                      src={p.url}
                      alt={`${room}-${idx}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <hr style={{ margin: '22px 0' }} />

      {/* Description */}
      <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 10 }}>Details</h2>
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{listing.description}</p>
    </main>
  );
}
