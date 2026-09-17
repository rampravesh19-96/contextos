import Link from 'next/link';
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold tracking-tight">ContextOS</span>
        <Link
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          href="/dashboard"
        >
          Open workspace
        </Link>
      </nav>
      <section className="mx-auto max-w-6xl px-6 py-24 text-center sm:py-36">
        <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-indigo-600">
          Knowledge, in context
        </p>
        <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-slate-950 sm:text-7xl">
          Your team’s knowledge, ready when work needs it.
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-600">
          ContextOS is a focused home for the documents, decisions, and AI-assisted workflows your
          team relies on.
        </p>
        <div className="mt-10">
          <Link
            className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm"
            href="/dashboard"
          >
            Explore the workspace
          </Link>
        </div>
      </section>
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-3">
          <Feature
            title="Organized knowledge"
            text="Build durable knowledge bases around the way your team works."
          />
          <Feature
            title="Grounded conversations"
            text="Bring useful context into discussions with source-aware AI."
          />
          <Feature
            title="Built for teams"
            text="Workspace boundaries create a clear foundation for collaboration."
          />
        </div>
      </section>
    </main>
  );
}
function Feature({ title, text }: { title: string; text: string }) {
  return (
    <article>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 leading-6 text-slate-600">{text}</p>
    </article>
  );
}
