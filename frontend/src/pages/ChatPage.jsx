import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ChatPage = () => {
  const { reportId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [report, setReport] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadMessages = async () => {
      try {
        const response = await api.get(`/chat/${reportId}`);
        if (!active) return;
        setMessages(response.data.messages || []);
        setOtherUser(response.data.otherUser);
        setReport(response.data.report);
        setError('');
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || 'Unable to load chat');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [reportId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = text.trim();
    if (!message || sending) return;

    setSending(true);
    setError('');
    try {
      const response = await api.post(`/chat/${reportId}`, { message });
      setMessages((current) => [...current, response.data.message]);
      setText('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-6">Loading chat...</div>;

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white shadow">
      <div className="border-b p-5">
        <Link to={`/report/${reportId}`} className="text-sm text-primary">&larr; Back to report</Link>
        <h1 className="mt-2 text-2xl font-semibold">Chat with {otherUser?.name || 'matched user'}</h1>
        {report && <p className="text-sm text-slate-500">About: {report.title}</p>}
      </div>

      {error && <div className="m-4 rounded-lg bg-red-50 p-3 text-red-600">{error}</div>}

      <div className="h-[28rem] space-y-3 overflow-y-auto bg-slate-50 p-5">
        {!messages.length && !error && (
          <p className="text-center text-sm text-slate-500">No messages yet. Say hello and arrange a safe public meeting place.</p>
        )}
        {messages.map((message) => {
          const mine = message.senderId?._id === user?._id || message.senderId === user?._id;
          return (
            <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${mine ? 'bg-primary text-white' : 'border bg-white text-slate-800'}`}>
                <p className="whitespace-pre-wrap break-words">{message.message}</p>
                <p className={`mt-1 text-xs ${mine ? 'text-blue-100' : 'text-slate-400'}`}>
                  {new Date(message.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 border-t p-4">
        <input
          className="flex-1 rounded-lg border px-4 py-3"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a message..."
          maxLength={1000}
        />
        <button disabled={sending || !text.trim()} className="rounded-lg bg-primary px-5 py-3 text-white disabled:opacity-50">
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
