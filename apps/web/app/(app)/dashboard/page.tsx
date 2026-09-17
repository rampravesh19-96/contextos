import { EmptyState } from '../../../components/states';
export default function DashboardPage() {
  return (
    <>
      <p className="text-sm text-slate-500">Demo workspace</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Good to see you</h1>
      <p className="mt-2 text-slate-600">Your workspace is ready for its first knowledge base.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {['Knowledge bases', 'Documents', 'Conversations'].map((x) => (
          <div className="rounded-xl border border-slate-200 bg-white p-5" key={x}>
            <p className="text-sm text-slate-500">{x}</p>
            <p className="mt-2 text-2xl font-semibold">—</p>
            <p className="mt-1 text-xs text-slate-500">No data yet</p>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <EmptyState
          title="Start building your context"
          description="Create a knowledge base, then add documents when ingestion is enabled."
        />
      </div>
    </>
  );
}
