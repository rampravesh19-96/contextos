'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { useAuth } from './auth-provider';

export type Workspace = { id: string; name: string; slug: string; role: string };
type WorkspaceState = {
  workspaces: Workspace[];
  workspaceId: string | null;
  loading: boolean;
  selectWorkspace: (id: string) => void;
};
const WorkspaceContext = createContext<WorkspaceState | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setWorkspaces([]);
      setWorkspaceId(null);
      setLoading(false);
      return;
    }
    void api<Workspace[]>('/workspaces')
      .then((items) => {
        const saved = localStorage.getItem('contextos-workspace');
        const selected = items.some((item) => item.id === saved) ? saved : (items[0]?.id ?? null);
        setWorkspaces(items);
        setWorkspaceId(selected);
        if (selected) localStorage.setItem('contextos-workspace', selected);
      })
      .catch(() => {
        setWorkspaces([]);
        setWorkspaceId(null);
      })
      .finally(() => setLoading(false));
  }, [authLoading, user]);
  function selectWorkspace(id: string) {
    if (!workspaces.some((workspace) => workspace.id === id)) return;
    setWorkspaceId(id);
    localStorage.setItem('contextos-workspace', id);
  }
  return (
    <WorkspaceContext.Provider value={{ workspaces, workspaceId, loading, selectWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return context;
}
