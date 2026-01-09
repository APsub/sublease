'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AddressAutocomplete from '../../components/AddressAutocomplete';


export default function CreateListingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceMonthly, setPriceMonthly] = useState<string>('1200');
  const [beds, setBeds] = useState<string>('1');
  const [baths, setBaths] = useState<string>('1');
  const [bedroomSqft, setBedroomSqft] = useState<string>('');
  const [apartmentSqft, setApartmentSqft] = useState<string>('');



  const [addressText, setAddressText] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

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
      // REQUIRED FIELD CHECKS BEFORE PUBLISH
    if (!addressText.trim()) {
    setMsg('❌ Address is required.');
    setLoading(false);
    return;
    }

    if (!postalCode.trim()) {
    setMsg('❌ Postal code is required.');
    setLoading(false);
    return;
    }


    const { data: listing, error } = await supabase
  .from('listings')
  .insert([
    {
      owner_id: user.id,
      title,
      description,

      price_monthly: Number(priceMonthly),
      beds: Number(beds),
      baths: Number(baths),

      bedroom_sqft: bedroomSqft ? Number(bedroomSqft) : null,
      apartment_sqft: apartmentSqft ? Number(apartmentSqft) : null,

      address_text: addressText,
      city,
      state,
      postal_code: postalCode,
      country: 'United States',

      lat,
      lng,

      status: 'published',
      published_at: new Date().toISOString(),
    },
  ])
  .select('id')
  .single();


    if (error) throw error;
    setMsg('✅ Listing published.');
    router.push(`/create/photos?listingId=${listing.id}`);
    return;

router.push('/listings');


      setMsg('✅ Listing published..');
      setTitle('');
      setDescription('');
      setAddressText('');
      setCity('');
      setState('');
      setPostalCode('');
      setPriceMonthly('');
      setBeds('');
      setBaths('');
      setBedroomSqft('');
      setApartmentSqft('');

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
              onChange={(e) => setPriceMonthly(e.target.value)}
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
              onChange={(e) => setBeds(e.target.value)}
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
              onChange={(e) => setBaths(e.target.value)}
              type="number"
              step="0.5"
              min={0}
              required
              style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10 }}
            />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
  <label style={{ display: 'grid', gap: 6 }}>
    <span>Bedroom sqft (optional)</span>
    <input
      value={bedroomSqft}
      onChange={(e) => setBedroomSqft(e.target.value)}
      inputMode="numeric"
      placeholder="e.g. 140"
      style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10 }}
    />
  </label>

  <label style={{ display: 'grid', gap: 6 }}>
    <span>Apartment sqft (optional)</span>
    <input
      value={apartmentSqft}
      onChange={(e) => setApartmentSqft(e.target.value)}
      inputMode="numeric"
      placeholder="e.g. 900"
      style={{ padding: 10, border: '1px solid #ccc', borderRadius: 10 }}
    />
  </label>
</div>


        <label style={{ display: 'grid', gap: 6 }}>
  <span>Address</span>
  <AddressAutocomplete
    value={addressText}
    onChange={setAddressText}
  onPick={(p: { address: string; city: string; state: string; postalCode: string; lat: number | null; lng: number | null }) => {

    setAddressText(p.address);
    setCity(p.city);
    setState(p.state);
    setPostalCode(p.postalCode);
    setLat(p.lat);
    setLng(p.lng);
  }}
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
            <span>Postal Code</span>
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
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
          {loading ? 'Punlishing' : 'Next Page'}
        </button>

        {msg && <p style={{ marginTop: 4 }}>{msg}</p>}
      </form>
    </main>
  );
}
