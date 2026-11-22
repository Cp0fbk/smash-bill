import type { ReactNode } from 'react';
import { AppShell } from '../../components/app-shell';
import { AuthProvider } from '../../lib/auth-context';

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
