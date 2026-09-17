import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
export function Button({
  children,
  className = '',
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={`rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
