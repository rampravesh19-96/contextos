'use client';

import { useEffect, useState } from 'react';
import { PageFrame } from '../../../components/page-frame';
import { useWorkspace } from '../../../components/workspace-provider';
import { api } from '../../../lib/api';

type UsageEvent = {
  id: string;
  provider: string;
  model: string;
  operation: string;
  createdAt: string;
};
type Analytics = {
  knowledgeBases: number;
  documents: number;
  readyDocuments: number;
  conversations: number;
  aiRequests: number;
  recent: UsageEvent[];
};
const number = new Intl.NumberFormat('en-US');

export default function Page() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!workspaceId) {
      setData(null);
      return;
    }
    setError('');
    setData(null);
    void api<Analytics>(`/workspaces/${workspaceId}/analytics`)
      .then(setData)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'Could not load analytics.'),
      );
  }, [workspaceId]);
  return (
    <PageFrame title="Analytics" description="Workspace activity derived from ContextOS records.">
      {workspaceLoading || (workspaceId && !data && !error) ? (
        <p className="text-sm text-slate-500">Loading workspace analytics…</p>
      ) : null}
      {!workspaceLoading && !workspaceId ? (
        <p className="text-sm text-slate-500">
          Choose an authorized workspace to view its analytics.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="AI requests" value={data.aiRequests} detail="Recorded chat requests" />
            <Metric
              label="Conversations"
              value={data.conversations}
              detail="Workspace conversations"
            />
            <Metric
              label="Knowledge bases"
              value={data.knowledgeBases}
              detail="Organized knowledge sources"
            />
            <Metric label="Documents" value={data.documents} detail="Uploaded source documents" />
            <Metric
              label="Ready documents"
              value={data.readyDocuments}
              detail="Available for retrieval"
            />
          </div>
          <section className="mt-8 rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold">Recent AI activity</h2>
              <p className="mt-1 text-sm text-slate-500">
                Events recorded for this workspace only.
              </p>
            </div>
            {data.recent.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-500">
                No AI requests have been recorded for this workspace yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recent.map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium capitalize">{event.operation}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {event.provider} · {event.model}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-slate-500" dateTime={event.createdAt}>
                      {new Intl.DateTimeFormat('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(event.createdAt))}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </PageFrame>
  );
}
function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{number.format(value)}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
