'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useParams } from 'next/navigation';

type Listing = {
  id: string;
  title: string | null;
  description: string | null;
  price_monthly: number | null;
  beds: number | null;
  baths: number | null;
  bedroom_sqft: number | null;
  apartment_sqft: number | null;
  address_text: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  published_at: string | null;
};

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) {
        setMsg('Listing not found or not published.');
        setListing(null);
      } else {
        setListing(data as Listing);
      }

      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <p style={{ padding: 40 }}>Loading…</p>;
  }

  if (msg || !listing) {
    return <p style={{ padding: 40 }}>{msg}</p>;
  }

  return (
    <main style={{ maxWidth: 800, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 6 }}>
        {listing.title ?? 'Untitled listing'}
      </h1>

      <p style={{ opacity: 0.8, marginBottom: 20 }}>
        {listing.address_text}
        {listing.city || listing.state ? ' — ' : ''}
        {[listing.city, listing.state].filter(Boolean).join(', ')}
      </p>

      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        {listing.price_monthly ? `$${listing.price_monthly}/month` : ''}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {listing.beds !== null && <span>🛏 {listing.beds} beds</span>}
        {listing.baths !== null && <span>🛁 {listing.baths} baths</span>}
        {listing.apartment_sqft && <span>📐 {listing.apartment_sqft} sqft</span>}
      </div>

      <hr style={{ margin: '24px 0' }} />

      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
        {listing.description}
      </p>
    </main>
  );
}
