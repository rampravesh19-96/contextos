'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { useWorkspace } from './workspace-provider';
import { api } from '../lib/api';

const links = [
  ['Overview', '/dashboard'],
  ['Knowledge Bases', '/knowledge-bases'],
  ['Documents', '/documents'],
  ['AI Chat', '/chat'],
  ['Analytics', '/analytics'],
];
export function AppShell({ children }: { children: ReactNode }) {
  const { user, refresh } = useAuth();
  const { workspaces, workspaceId, selectWorkspace } = useWorkspace();
  const router = useRouter();
  async function signOut() {
    await api('/auth/sign-out', { method: 'POST' }).catch(() => undefined);
    await refresh();
    router.replace('/sign-in');
  }
  const active = workspaces.find((item) => item.id === workspaceId);
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-slate-200 bg-white p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <Link href="/dashboard" className="text-lg font-bold">
          ContextOS
        </Link>
        <label className="mt-7 block text-xs font-medium text-slate-500">
          Workspace
          <select
            value={workspaceId ?? ''}
            onChange={(event) => selectWorkspace(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {workspaces.length === 0 && <option value="">Loading workspaces…</option>}
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name} · {workspace.role}
              </option>
            ))}
          </select>
        </label>
        <nav className="mt-6 flex gap-1 overflow-x-auto md:block">
          {links.map(([name, href]) => (
            <Link
              key={href}
              href={href}
              className="block shrink-0 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              {name}
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t pt-4 text-xs text-slate-500">
          <p>{user?.email}</p>
          <p className="mt-1">{active ? `${active.name} workspace` : 'No accessible workspace'}</p>
          <button
            onClick={() => void signOut()}
            className="mt-3 font-medium text-slate-700 underline"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 sm:p-10">{children}</main>
    </div>
  );
}
