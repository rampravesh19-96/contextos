'use client';
import { FormEvent, useEffect, useState } from 'react';
import { api, API_URL } from '../../../lib/api';
import { PageFrame } from '../../../components/page-frame';
import { useWorkspace } from '../../../components/workspace-provider';
type Message = {
  id?: string;
  role: string;
  content: string;
  citations?: Array<{ documentName: string; chunkId: string; excerpt: string }>;
};
type Conversation = { id: string; title?: string | null };
type ConversationDetail = Conversation & { messages: Message[] };
export default function Page() {
  const { workspaceId } = useWorkspace();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [streaming, setStreaming] = useState(false);
  useEffect(() => {
    setConversation(null);
    setMessages([]);
    setError('');
    if (!workspaceId) return;
    void (async () => {
      try {
        const conversations = await api<Conversation[]>(`/workspaces/${workspaceId}/conversations`);
        const latest = conversations[0];
        if (!latest) return;
        const detail = await api<ConversationDetail>(
          `/workspaces/${workspaceId}/conversations/${latest.id}`,
        );
        setConversation(detail);
        setMessages(detail.messages);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Could not load conversation history.');
      }
    })();
  }, [workspaceId]);
  async function start() {
    if (!workspaceId) return;
    try {
      const created = await api<Conversation>(`/workspaces/${workspaceId}/conversations`, {
        method: 'POST',
        body: JSON.stringify({ title: 'New conversation' }),
      });
      setConversation(created);
      setMessages([]);
    } catch {
      setError('Could not create a conversation.');
    }
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!workspaceId || !conversation || !question.trim()) return;
    const prompt = question.trim();
    setQuestion('');
    setError('');
    setStreaming(true);
    setMessages((current) => [
      ...current,
      { role: 'USER', content: prompt },
      { role: 'ASSISTANT', content: '' },
    ]);
    try {
      const response = await fetch(
        `${API_URL}/workspaces/${workspaceId}/conversations/${conversation.id}/messages/stream`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ content: prompt }),
        },
      );
      if (!response.ok || !response.body)
        throw new Error('Chat is unavailable. Configure LLM_API_KEY to use grounded chat.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = '';
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        pending += decoder.decode(next.value, { stream: true });
        const events = pending.split('\n\n');
        pending = events.pop() ?? '';
        for (const item of events) {
          const data = item
            .split('\n')
            .find((line) => line.startsWith('data: '))
            ?.slice(6);
          if (!data) continue;
          const parsed = JSON.parse(data) as {
            token?: string;
            citations?: Message['citations'];
            message?: string;
          };
          if (parsed.token)
            setMessages((current) =>
              current.map((message, index) =>
                index === current.length - 1
                  ? { ...message, content: message.content + parsed.token }
                  : message,
              ),
            );
          if (parsed.citations)
            setMessages((current) =>
              current.map((message, index) =>
                index === current.length - 1
                  ? { ...message, citations: parsed.citations }
                  : message,
              ),
            );
          if (parsed.message) setError(parsed.message);
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chat failed.');
    } finally {
      setStreaming(false);
    }
  }
  return (
    <PageFrame
      title="AI Chat"
      description="Grounded answers stream from documents in your current workspace."
    >
      <div className="mb-5 flex gap-3">
        <button
          onClick={() => void start()}
          disabled={!workspaceId || streaming}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
        >
          New conversation
        </button>
        <p className="self-center text-xs text-slate-500">
          Answers are grounded in documents from the current workspace.
        </p>
      </div>
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="min-h-64 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">Create a conversation to begin.</p>
        )}
        {messages.map((message, index) => (
          <div key={message.id ?? index} className={message.role === 'USER' ? 'ml-8' : 'mr-8'}>
            <p className="text-xs font-semibold text-slate-500">
              {message.role === 'USER' ? 'You' : 'ContextOS'}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {message.content || (streaming ? 'Thinking…' : '')}
            </p>
            {message.citations?.map((citation) => (
              <details key={citation.chunkId} className="mt-2 rounded bg-slate-50 p-2 text-xs">
                <summary>{citation.documentName}</summary>
                <p className="mt-1 text-slate-600">{citation.excerpt}</p>
              </details>
            ))}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-4 flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={!conversation || streaming}
          placeholder="Ask a question about your uploaded documents"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2"
        />
        <button
          disabled={!conversation || streaming}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </PageFrame>
  );
}
