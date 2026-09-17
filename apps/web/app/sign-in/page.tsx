'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth-provider';
export default function SignInPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'}/auth/sign-in`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      },
    );
    setPending(false);
    if (!response.ok) {
      setError('Unable to sign in. Check the demo credentials and try again.');
      return;
    }
    await refresh();
    router.replace('/dashboard');
  }
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-7 shadow-sm"
      >
        <h1 className="text-2xl font-bold">Sign in to ContextOS</h1>
        <p className="mt-2 text-sm text-slate-600">
          Demo credentials are documented in the README. This is demo data only.
        </p>
        <label className="mt-6 block text-sm font-medium">
          Email
          <input
            required
            name="email"
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-300 p-2"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            required
            minLength={8}
            name="password"
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-300 p-2"
          />
        </label>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
