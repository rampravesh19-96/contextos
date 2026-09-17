'use client';
import { ChangeEvent, useEffect, useState } from 'react';
import { api, API_URL } from '../../../lib/api';
import { PageFrame } from '../../../components/page-frame';
import { useWorkspace } from '../../../components/workspace-provider';
type KB = { id: string; name: string };
type Document = {
  id: string;
  name: string;
  status: string;
  errorMessage?: string | null;
  knowledgeBase: KB;
  _count?: { chunks: number };
};
export default function Page() {
  const { workspaceId } = useWorkspace();
  const [bases, setBases] = useState<KB[]>([]);
  const [knowledgeBaseId, setKnowledgeBaseId] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  async function refresh(id: string) {
    try {
      const [kb, docs] = await Promise.all([
        api<KB[]>(`/workspaces/${id}/knowledge-bases`),
        api<Document[]>(`/workspaces/${id}/documents`),
      ]);
      setBases(kb);
      setKnowledgeBaseId((current) => current || kb[0]?.id || '');
      setDocuments(docs);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load documents.');
    }
  }
  useEffect(() => {
    if (workspaceId) void refresh(workspaceId);
    else {
      setBases([]);
      setDocuments([]);
      setKnowledgeBaseId('');
    }
  }, [workspaceId]);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !workspaceId || !knowledgeBaseId) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Files must be 10 MB or smaller.');
      return;
    }
    setUploading(true);
    setError('');
    const form = new FormData();
    form.set('file', file);
    form.set('knowledgeBaseId', knowledgeBaseId);
    try {
      const response = await fetch(`${API_URL}/workspaces/${workspaceId}/documents/upload`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (!response.ok) throw new Error('Upload failed. Use PDF, TXT, or Markdown files only.');
      await refresh(workspaceId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Upload failed.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }
  async function remove(id: string) {
    if (!workspaceId || !confirm('Delete this document and its chunks?')) return;
    try {
      await api(`/workspaces/${workspaceId}/documents/${id}`, { method: 'DELETE' });
      await refresh(workspaceId);
    } catch {
      setError('Could not delete document.');
    }
  }
  async function retry(id: string) {
    if (!workspaceId) return;
    try {
      await api(`/workspaces/${workspaceId}/documents/${id}/retry`, { method: 'POST' });
      await refresh(workspaceId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not retry ingestion.');
    }
  }
  return (
    <PageFrame
      title="Documents"
      description="Upload PDF, TXT, or Markdown sources (up to 10 MB) for ingestion."
    >
      <div className="flex flex-wrap gap-3">
        <select
          value={knowledgeBaseId}
          onChange={(event) => setKnowledgeBaseId(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {bases.map((base) => (
            <option key={base.id} value={base.id}>
              {base.name}
            </option>
          ))}
        </select>
        <label className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {uploading ? 'Uploading…' : 'Choose file'}
          <input
            disabled={uploading || !knowledgeBaseId}
            onChange={upload}
            type="file"
            accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
            className="sr-only"
          />
        </label>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Files are queued after upload. A configured Redis service is required to process them.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-6 space-y-3">
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">No documents in this workspace yet.</p>
        ) : (
          documents.map((document) => (
            <article
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <h2 className="font-semibold">{document.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {document.knowledgeBase.name} · {document.status} · {document._count?.chunks ?? 0}{' '}
                  chunks
                </p>
                {document.errorMessage && (
                  <p className="mt-1 text-sm text-red-700">{document.errorMessage}</p>
                )}
              </div>
              <div className="flex gap-3">
                {document.status === 'FAILED' && (
                  <button
                    onClick={() => void retry(document.id)}
                    className="text-sm font-medium text-indigo-700"
                  >
                    Retry
                  </button>
                )}
                <button
                  onClick={() => void remove(document.id)}
                  className="text-sm font-medium text-red-700"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </PageFrame>
  );
}
