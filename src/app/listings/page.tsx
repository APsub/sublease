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
  created_at: string;
};


const ROOM_ORDER = ['kitchen', 'bedroom', 'bathroom', 'living_room'] as const;

function pickPreviewPhotos(all: Photo[], max = 4) {
  // Goal:
  // 1) pick 1 from each room if available (kitchen, bedroom, bathroom, living_room)
  // 2) if some rooms missing, fill with other photos they did upload
  const chosen: Photo[] = [];
  const usedUrls = new Set<string>();

  // group by room
  const byRoom: Record<string, Photo[]> = {};
  for (const p of all) {
    byRoom[p.room] = byRoom[p.room] || [];
    byRoom[p.room].push(p);
  }
  // sort each room by created_at (oldest first, doesn’t matter much)
  for (const r of Object.keys(byRoom)) {
    byRoom[r].sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
  }

  // 1) one per preferred room
  for (const room of ROOM_ORDER) {
  const first = byRoom[room]?.[0];
  if (first && !usedUrls.has(first.storage_path) && chosen.length < max) {
    chosen.push(first);
    usedUrls.add(first.storage_path);
  }
}

// 2) fill with remaining photos from anywhere
if (chosen.length < max) {
  const remaining = all.filter((p) => !usedUrls.has(p.storage_path));
  remaining.sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
  for (const p of remaining) {
    if (chosen.length >= max) break;
    chosen.push(p);
    usedUrls.add(p.storage_path);
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
    (async () => {
      setLoading(true);
      setMsg(null);

      // 1) Get published listings
      const { data: listingData, error: listingErr } = await supabase
        .from('listings')
        .select('id,title,city,state,price_monthly,published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (listingErr) {
        setMsg(listingErr.message);
        setListings([]);
        setPhotosByListing({});
        setLoading(false);
        return;
      }

      const list = (listingData ?? []) as Listing[];
      setListings(list);

      // 2) Get photos for these listings (if any)
      const ids = list.map((l) => l.id);
      if (ids.length === 0) {
        setPhotosByListing({});
        setLoading(false);
        return;
      }

     const { data: photoData, error: photoErr } = await supabase
  .from('listing_photos')
  .select('listing_id,room,storage_path,created_at')
        .in('listing_id', ids)
        .order('created_at', { ascending: true });

      if (photoErr) {
        // still show listings even if photos fail
        setPhotosByListing({});
        setLoading(false);
        return;
      }

      const photos = (photoData ?? []) as Photo[];
      console.log("photoData length:", photos.length, photos);
      const grouped: Record<string, Photo[]> = {};
      for (const p of photos) {
        grouped[p.listing_id] = grouped[p.listing_id] || [];
        grouped[p.listing_id].push(p);
      }
      setPhotosByListing(grouped);

      setLoading(false);
    })();
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
            {/* Thumbnails row */}
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

            {/* Info */}
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

            {/* View opens in a new tab */}
            <Link
              href={`/listings/${listing.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 800 }}
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
