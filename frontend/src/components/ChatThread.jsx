import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import Avatar from './ui/Avatar';
import { timeAgo } from '../utils/helpers';
import { Spinner } from './ui/Loading';

export default function ChatThread({ conversationId, otherName, otherAvatar, compact = false }) {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    api.get(`/conversations/${conversationId}/messages`).then((r) => setMessages(r.data.messages)).finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || connected) return undefined;
    const poll = window.setInterval(async () => {
      try {
        const response = await api.get(`/conversations/${conversationId}/messages`);
        setMessages((current) => {
          const known = new Set(current.map((message) => message.id));
          const incoming = response.data.messages.filter((message) => !known.has(message.id));
          return incoming.length ? [...current, ...incoming] : current;
        });
      } catch {
        // The initial request and send action surface errors to the user.
      }
    }, 4000);
    return () => window.clearInterval(poll);
  }, [conversationId, connected]);

  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit('conversation:join', conversationId);
    const onNew = (payload) => {
      if (payload.conversationId === conversationId) setMessages((m) => [...m, payload.message]);
    };
    socket.on('message:new', onNew);
    return () => { socket.emit('conversation:leave', conversationId); socket.off('message:new', onNew); };
  }, [socket, conversationId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  async function send() {
    if (!text.trim() || !conversationId) return;
    setSending(true);
    const content = text.trim();
    setText('');
    try {
      const res = await api.post(`/conversations/${conversationId}/messages`, { content });
      // Avoid duplicate if socket already appended it (same message id)
      setMessages((m) => (m.some((x) => x.id === res.data.message.id) ? m : [...m, res.data.message]));
    } catch (err) {
      toast.error(err.message);
      setText(content);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  if (!conversationId) return null;

  return (
    <div className={compact ? 'flex flex-col h-[440px]' : 'flex flex-col h-full'}>
      <div className="flex-1 overflow-y-auto px-1 py-3 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-10"><Spinner /></div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-ink-faint text-center pt-10">Say hello to start the conversation.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                {!mine && <Avatar seed={otherAvatar || otherName} size="xs" />}
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-card text-sm leading-relaxed ${mine ? 'bg-accent text-white rounded-br-sm' : 'bg-black/[0.04] text-ink rounded-bl-sm'}`}>
                  {m.content}
                  <p className={`text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-ink-faint'}`}>{timeAgo(m.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-end gap-2 pt-3 border-t border-line">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Write a message…"
          className="input resize-none py-2.5"
        />
        <button onClick={send} disabled={sending || !text.trim()} className="btn-primary px-3.5 py-2.5 shrink-0" aria-label="Send message">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
