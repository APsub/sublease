'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const canSend = useMemo(() => text.trim().length > 0, [text]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace('/login');
        return;
      }
      setUserId(data.user.id);

      const { data: msgs, error } = await supabase
        .from('messages')
        .select('id,sender_id,body,created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) setMsg(error.message);
      setMessages((msgs ?? []) as Message[]);
      setLoading(false);
    })();
  }, [conversationId, router]);

  async function refresh() {
    const { data: msgs } = await supabase
      .from('messages')
      .select('id,sender_id,body,created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages((msgs ?? []) as Message[]);
  }

  async function send() {
    if (!userId || !canSend) return;

    const body = text.trim();
    setText('');
    setMsg(null);

    const { error } = await supabase.from('messages').insert([
      { conversation_id: conversationId, sender_id: userId, body },
    ]);

    if (error) {
      setMsg(error.message);
      setText(body);
      return;
    }

    await refresh();
  }

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>;

  return (
    <main style={{ maxWidth: 800, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Messages</h1>

      {msg && <p style={{ color: 'crimson', marginBottom: 12 }}>{msg}</p>}

      <div style={{ border: '1px solid #ddd', borderRadius: 14, padding: 14, minHeight: 300 }}>
        {messages.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No messages yet. Say hi 👋</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender_id === userId ? 'end' : 'start',
                  maxWidth: '80%',
                  padding: 10,
                  borderRadius: 12,
                  border: '1px solid #ccc',
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                  {new Date(m.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid #ccc' }}
        />
        <button
          onClick={send}
          disabled={!canSend}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid #111',
            background: '#111',
            color: 'white',
            fontWeight: 700,
            cursor: canSend ? 'pointer' : 'not-allowed',
          }}
        >
          Send
        </button>
      </div>
    </main>
  );
}

