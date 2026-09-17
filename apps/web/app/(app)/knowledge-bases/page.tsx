'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useWorkspace } from '../../../components/workspace-provider';
import { PageFrame } from '../../../components/page-frame';

type KnowledgeBase = { id: string; name: string; description: string | null; updatedAt: string };
export default function Page() {
  const { workspaceId } = useWorkspace();
  const [items, setItems] = useState<KnowledgeBase[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function load(id: string) {
    try {
      setItems(await api<KnowledgeBase[]>(`/workspaces/${id}/knowledge-bases`));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load knowledge bases.');
    }
  }
  useEffect(() => {
    if (workspaceId) void load(workspaceId);
    else setItems([]);
  }, [workspaceId]);
  async function create(event: FormEvent) {
    event.preventDefault();
    if (!workspaceId) return;
    setPending(true);
    setError('');
    try {
      const item = await api<KnowledgeBase>(`/workspaces/${workspaceId}/knowledge-bases`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setItems((current) => [item, ...current]);
      setName('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create knowledge base.');
    } finally {
      setPending(false);
    }
  }
  async function remove(id: string) {
    if (!workspaceId || !confirm('Delete this knowledge base and its associated documents?'))
      return;
    try {
      await api(`/workspaces/${workspaceId}/knowledge-bases/${id}`, { method: 'DELETE' });
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not delete knowledge base.');
    }
  }
  return (
    <PageFrame title="Knowledge Bases" description="Organize durable context for your team.">
      <form onSubmit={create} className="flex max-w-xl gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
          maxLength={80}
          placeholder="New knowledge base name"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2"
        />
        <button
          disabled={pending || !workspaceId}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? 'Creating…' : 'Create'}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {!workspaceId ? (
        <p className="mt-8 text-sm text-slate-500">
          Choose a workspace from the sidebar to manage its knowledge bases.
        </p>
      ) : items.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">No knowledge bases in this workspace yet.</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <h2 className="font-semibold">{item.name}</h2>
                {item.description && (
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                )}
              </div>
              <button
                onClick={() => void remove(item.id)}
                className="text-sm font-medium text-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </PageFrame>
  );
}
