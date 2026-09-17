'use client';

import { useEffect, useState } from 'react';
import { useWorkspace } from '../../../components/workspace-provider';
import { EmptyState } from '../../../components/states';
import { api } from '../../../lib/api';

type Overview = {
  knowledgeBases: number;
  documents: number;
  readyDocuments: number;
  conversations: number;
  aiRequests: number;
};
const number = new Intl.NumberFormat('en-US');

export default function DashboardPage() {
  const { workspaceId, workspaces, loading: workspaceLoading } = useWorkspace();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!workspaceId) {
      setData(null);
      return;
    }
    setData(null);
    setError('');
    void api<Overview>(`/workspaces/${workspaceId}/analytics`)
      .then(setData)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'Could not load workspace overview.'),
      );
  }, [workspaceId]);
  const workspace = workspaces.find((item) => item.id === workspaceId);
  const hasData = Boolean(
    data && (data.knowledgeBases || data.documents || data.conversations || data.aiRequests),
  );
  return (
    <>
      <p className="text-sm text-slate-500">
        {workspace ? `${workspace.name} · ${workspace.role}` : 'Workspace overview'}
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Good to see you</h1>
      <p className="mt-2 text-slate-600">A live summary of your selected workspace.</p>
      {workspaceLoading || (workspaceId && !data && !error) ? (
        <p className="mt-8 text-sm text-slate-500">Loading workspace data…</p>
      ) : null}
      {!workspaceLoading && !workspaceId ? (
        <p className="mt-8 text-sm text-slate-500">
          Choose an authorized workspace to view its overview.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-8 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {data ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ['Knowledge bases', data.knowledgeBases],
              ['Documents', data.documents],
              ['Conversations', data.conversations],
            ].map(([label, value]) => (
              <div
                className="rounded-xl border border-slate-200 bg-white p-5"
                key={label as string}
              >
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{number.format(value as number)}</p>
              </div>
            ))}
          </div>
          {hasData ? (
            <p className="mt-8 text-sm text-slate-600">
              {number.format(data.readyDocuments)} ready document
              {data.readyDocuments === 1 ? '' : 's'} available for retrieval and{' '}
              {number.format(data.aiRequests)} recorded AI request{data.aiRequests === 1 ? '' : 's'}
              .
            </p>
          ) : (
            <div className="mt-8">
              <EmptyState
                title="Start building your context"
                description="Create a knowledge base, then add documents to make workspace knowledge available."
              />
            </div>
          )}
        </>
      ) : null}
    </>
  );
}
