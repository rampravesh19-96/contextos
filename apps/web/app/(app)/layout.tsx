'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/app-shell';
import { useAuth } from '../../components/auth-provider';
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace('/sign-in');
  }, [loading, router, user]);
  if (loading || !user)
    return (
      <main className="grid min-h-screen place-items-center text-sm text-slate-500">
        Checking your session…
      </main>
    );
  return <AppShell>{children}</AppShell>;
}
