'use client';

import { AddressAutofill } from '@mapbox/search-js-react';

type Picked = {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  lat: number | null;
  lng: number | null;
};

export default function AddressAutocomplete(props: {
  value: string;
  onChange: (v: string) => void;
  onPick: (p: Picked) => void;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

  return (
    <AddressAutofill
      accessToken={token}
      options={{ country: 'us'}}
      onRetrieve={(res: any) => {
        const feat = res?.features?.[0];
        if (!feat) return;

        const p = feat.properties ?? {};
        const coords = feat.geometry?.coordinates ?? null; // [lng, lat]

        const address = p.full_address || p.place_formatted || props.value;

        const city =
          p.context?.place?.name ||
          p.context?.locality?.name ||
          p.place ||
          '';

        const state =
          p.context?.region?.region_code ||
          p.region ||
          '';

        const postalCode =
          p.context?.postcode?.name ||
          p.postcode ||
          '';

        props.onPick({
          address,
          city,
          state,
          postalCode,
          lng: coords ? coords[0] : null,
          lat: coords ? coords[1] : null,
        });
      }}
    >
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder="Start typing an address…"
        autoComplete="street-address"
        className="w-full rounded-2xl border px-4 py-3 text-sm"
      />
    </AddressAutofill>
  );
}

