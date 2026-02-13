import type { ReactNode } from 'react';

interface AuthLayoutProps {
  readonly children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="dark min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
