import { PageFrame } from '../knowledge-bases/page';
export default function Page() {
  return (
    <PageFrame title="Settings" description="Workspace preferences and membership controls.">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Workspace settings</h2>
        <p className="mt-2 text-sm text-slate-600">
          Settings management will arrive alongside authentication and RBAC.
        </p>
      </section>
    </PageFrame>
  );
}
