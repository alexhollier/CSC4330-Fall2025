import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { migrateLocalToUser } from '../app/services/filterService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] Starting auth state check');
    const startTime = Date.now();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const elapsed = Date.now() - startTime;
      console.log(`[AuthContext] Auth state received in ${elapsed}ms, user: ${currentUser ? 'signed in' : 'not signed in'}`);
      setUser(currentUser);
      if (currentUser) {
        // Attempt to migrate any anonymous/local filters into this user's Firestore doc
        migrateLocalToUser(currentUser.uid).catch((err) => console.error('[AuthContext] migrateLocalToUser failed', err));
      }
      setLoading(false);
    });

    // Timeout fallback: force loading to false after 5 seconds to prevent indefinite loading
    const timeoutId = setTimeout(() => {
      console.log('[AuthContext] Auth check timeout - forcing loading to false');
      setLoading(false);
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
