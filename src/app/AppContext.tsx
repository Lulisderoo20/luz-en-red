import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { getBackendAdapter } from '@/services/backend';
import { BackendAdapter } from '@/services/backend/types';
import { UserProfile } from '@/types/domain';

interface AppContextValue {
  backend: BackendAdapter;
  mode: 'demo' | 'supabase';
  user: UserProfile | null;
  isBootstrapping: boolean;
  refreshSession: () => Promise<void>;
  setCurrentUser: (user: UserProfile | null) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);
const backend = getBackendAdapter();

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  async function refreshSession() {
    try {
      const session = await backend.getSession();
      setUser(session.user);
    } finally {
      setIsBootstrapping(false);
    }
  }

  useEffect(() => {
    void refreshSession();
    const unsubscribe = backend.onAuthStateChange(() => {
      void refreshSession();
    });

    return unsubscribe;
  }, []);

  return (
    <AppContext.Provider
      value={{
        backend,
        mode: backend.mode,
        user,
        isBootstrapping,
        refreshSession,
        setCurrentUser: setUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider.');
  }

  return context;
}
