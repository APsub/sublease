'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

type Listing = {
  id: string;
  title: string | null;
  city: string | null;
  state: string | null;
  price_monthly: number | null;
  published_at: string | null;
};

type Photo = {
  listing_id: string;
  room: 'kitchen' | 'bedroom' | 'bathroom' | 'living_room' | string;
  storage_path: string;
};

const ROOM_ORDER = ['kitchen', 'bedroom', 'bathroom', 'living_room'] as const;

function pickPreviewPhotos(all: Photo[], max = 4) {
  const chosen: Photo[] = [];
  const usedPaths = new Set<string>();

  const byRoom: Record<string, Photo[]> = {};
  for (const p of all) {
    byRoom[p.room] = byRoom[p.room] || [];
    byRoom[p.room].push(p);
  }

  for (const room of ROOM_ORDER) {
    const first = byRoom[room]?.[0];
    if (first && !usedPaths.has(first.storage_path) && chosen.length < max) {
      chosen.push(first);
      usedPaths.add(first.storage_path);
    }
  }

  if (chosen.length < max) {
    const remaining = all.filter((p) => !usedPaths.has(p.storage_path));
    for (const p of remaining) {
      if (chosen.length >= max) break;
      chosen.push(p);
      usedPaths.add(p.storage_path);
    }
  }

  return chosen;
}

export default function ListingsPage() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [listings, setListings] = useState<Listing[]>([]);
  const [photosByListing, setPhotosByListing] = useState<Record<string, Photo[]>>({});

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setMsg(null);

      // Hard timeout so it never hangs forever
      const timeout = setTimeout(() => {
        if (!cancelled) {
          setMsg('Still loading… If this never finishes, it means the Supabase request is hanging.');
          setLoading(false);
        }
      }, 6000);

      try {
        // 1) Listings
        const { data: listingData, error: listingErr } = await supabase
          .from('listings')
          .select('id,title,city,state,price_monthly,published_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false });

        if (cancelled) return;

        if (listingErr) {
          clearTimeout(timeout);
          setMsg(`Listings error: ${listingErr.message}`);
          setListings([]);
          setPhotosByListing({});
          setLoading(false);
          return;
        }

        const list = (listingData ?? []) as Listing[];
        setListings(list);

        const ids = list.map((l) => l.id);
        if (ids.length === 0) {
          clearTimeout(timeout);
          setPhotosByListing({});
          setLoading(false);
          return;
        }

        // 2) Photos
        const { data: photoData, error: photoErr } = await supabase
          .from('listing_photos')
          .select('listing_id,room,storage_path')
          .in('listing_id', ids);

        if (cancelled) return;

        if (photoErr) {
          clearTimeout(timeout);
          setMsg(`Photos error: ${photoErr.message}`);
          setPhotosByListing({});
          setLoading(false);
          return;
        }

        const photos = (photoData ?? []) as Photo[];
        const grouped: Record<string, Photo[]> = {};
        for (const p of photos) {
          grouped[p.listing_id] = grouped[p.listing_id] || [];
          grouped[p.listing_id].push(p);
        }

        clearTimeout(timeout);
        setPhotosByListing(grouped);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setMsg(e?.message ?? 'Unknown error while loading listings.');
        setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(() => {
    return listings.map((l) => {
      const photos = photosByListing[l.id] || [];
      const previews = pickPreviewPhotos(photos, 4);
      return { listing: l, previews };
    });
  }, [listings, photosByListing]);

  return (
    <main style={{ maxWidth: 1000, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>Browse Listings</h1>

      {loading && <p>Loading…</p>}
      {msg && <p style={{ color: 'crimson' }}>{msg}</p>}

      <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
        {cards.map(({ listing, previews }) => (
          <div
            key={listing.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 16,
              padding: 14,
              display: 'grid',
              gap: 10,
            }}
          >
            {previews.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {Array.from({ length: 4 }).map((_, i) => {
                  const p = previews[i];
                  return (
                    <div
                      key={i}
                      style={{
                        width: '100%',
                        height: 90,
                        borderRadius: 12,
                        border: '1px solid #ccc',
                        overflow: 'hidden',
                        background: '#f3f4f6',
                      }}
                    >
                      {p ? (
                        <img
                          src={
                            supabase.storage
                              .from('listing-photos')
                              .getPublicUrl(p.storage_path).data.publicUrl
                          }
                          alt={p.room}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ opacity: 0.7 }}>No photos uploaded.</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {String(listing.title ?? 'Untitled listing')}
              </div>
              <div style={{ fontWeight: 800 }}>
                {typeof listing.price_monthly === 'number' ? `$${listing.price_monthly}/mo` : ''}
              </div>
            </div>

            <div style={{ opacity: 0.8 }}>
              {[listing.city, listing.state].filter(Boolean).join(', ')}
            </div>

            <Link href={`/listings/${listing.id}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 800 }}>
              View
            </Link>
          </div>
        ))}

        {!loading && !msg && cards.length === 0 && (
          <p style={{ opacity: 0.8 }}>No published listings found.</p>
        )}
      </div>
    </main>
  );
}
