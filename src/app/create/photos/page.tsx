'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

type RoomKey = 'kitchen' | 'bedroom' | 'bathroom' | 'living_room';

const ROOM_LABELS: Record<RoomKey, string> = {
  kitchen: 'Kitchen',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  living_room: 'Living Room',
};

function makePreviewUrls(files: File[]) {
  return files.map((f) => URL.createObjectURL(f));
}

export default function AddPhotosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId') || '';
  

  const [filesByRoom, setFilesByRoom] = useState<Record<RoomKey, File[]>>({
    kitchen: [],
    bedroom: [],
    bathroom: [],
    living_room: [],
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);


  const previews = useMemo(() => {
    return {
      kitchen: makePreviewUrls(filesByRoom.kitchen),
      bedroom: makePreviewUrls(filesByRoom.bedroom),
      bathroom: makePreviewUrls(filesByRoom.bathroom),
      living_room: makePreviewUrls(filesByRoom.living_room),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesByRoom]);

  function onPick(room: RoomKey, fileList: FileList | null) {
    if (!fileList) return;
    const next = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    setFilesByRoom((prev) => ({ ...prev, [room]: next }));
  }

  async function uploadRoom(room: RoomKey, files: File[]) {
    // Bucket must exist: "listing-photos"
    const bucket = supabase.storage.from('listing-photos');

    const uploads = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${listingId}/${room}/${crypto.randomUUID()}.${ext}`;

      const { error } = await bucket.upload(path, file, {
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;

      // Public URL (bucket should be public OR you can use signed URLs later)
      const { data } = bucket.getPublicUrl(path);
      uploads.push({ room, url: data.publicUrl, path });
    }

    return uploads;
  }

  async function handleFinish() {
    const { data: authData } = await supabase.auth.getUser();
console.log('AUTH USER:', authData.user);

    if (!listingId) {
      setMsg('Missing listingId in URL. Go back and publish again.');
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace('/login');
        return;
      }
      console.log("AUTH USER ID:", userData.user.id);
      const allUploads: { room: string; url: string; path: string }[] = [];
      for (const room of Object.keys(filesByRoom) as RoomKey[]) {
        const roomFiles = filesByRoom[room];
        if (roomFiles.length === 0) continue;
        const uploaded = await uploadRoom(room, roomFiles);
        allUploads.push(...uploaded);
      }

      const { data: u } = await supabase.auth.getUser();
    console.log("USER:", u.user?.id);

      // OPTIONAL: save photo records to a table if you have one
      // If you DON'T have listing_photos table, you can skip this insert.
      // Table schema suggestion:
      // listing_photos: id uuid, listing_id uuid, room text, url text, storage_path text, created_at timestamp
      if (allUploads.length > 0) {
        const { error } = await supabase.from('listing_photos').insert(
          allUploads.map((u) => ({
            listing_id: listingId,
            room: u.room,
            url: u.url,
            storage_path: u.path,
          }))
        );

        // If table doesn't exist yet, you'll get an error. In that case, comment this block out.
        if (error) throw error;
      }

      setCompleted(true);
      setMsg('🎉 Congrats! You have published your listing.');
    } catch (e: any) {
      setMsg(e?.message ?? 'Upload failed.');
    } finally {
      setLoading(false);
    }
  }
if (completed) {
  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        🎉 Congrats!
      </h1>

      <p style={{ opacity: 0.9, marginBottom: 20 }}>
        You have published your listing and it is now live for others to see.
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{
            padding: 12,
            borderRadius: 12,
            border: '1px solid #111',
            background: '#111',
            color: 'white',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Go to homepage
        </button>

        <button
          type="button"
          onClick={() => router.push(`/listings/${listingId}`)}
          style={{
            padding: 12,
            borderRadius: 12,
            border: '1px solid #999',
            background: 'white',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          View listing
        </button>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Add Pictures</h1>
      <p style={{ opacity: 0.8, marginBottom: 20 }}>
        Upload photos for each room (optional). Listing ID: <b>{listingId || 'missing'}</b>
      </p>

      <div style={{ display: 'grid', gap: 16 }}>
        {(Object.keys(ROOM_LABELS) as RoomKey[]).map((room) => (
          <section
            key={room}
            style={{
              border: '1px solid #ddd',
              borderRadius: 14,
              padding: 14,
              display: 'grid',
              gap: 10,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 18 }}>{ROOM_LABELS[room]}</div>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onPick(room, e.target.files)}
            />

            {filesByRoom[room].length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {previews[room].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`${room}-${i}`}
                    style={{
                      width: 120,
                      height: 90,
                      objectFit: 'cover',
                      borderRadius: 10,
                      border: '1px solid #ccc',
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <button
          type="button"
          onClick={() => router.push(`/listings/${listingId}`)}
          style={{
            padding: 12,
            borderRadius: 12,
            border: '1px solid #999',
            background: 'white',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Skip
        </button>

        <button
          type="button"
          onClick={handleFinish}
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 12,
            border: '1px solid #111',
            background: '#111',
            color: 'white',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Saving…' : 'Publish'}
        </button>
      </div>

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </main>
  );
}
