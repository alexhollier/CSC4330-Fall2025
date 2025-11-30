// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

interface UserData {
  uid: string;
  email: string | null;
  accountType: 'user' | 'organization';
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isOrganization: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] Starting auth state check');
    const startTime = Date.now();
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const elapsed = Date.now() - startTime;
      console.log(`[AuthContext] Auth state received in ${elapsed}ms, user: ${currentUser ? 'signed in' : 'not signed in'}`);
      
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch user data from Firestore
        try {
          console.log('[AuthContext] Fetching user data from Firestore');
          const userDocRef = doc(db, 'UserInformation', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('[AuthContext] User data loaded:', data.accountType);
            setUserData({
              uid: currentUser.uid,
              email: currentUser.email,
              accountType: data.accountType || 'user',
            });
          } else {
            console.log('[AuthContext] No user document found, defaulting to user type');
            setUserData({
              uid: currentUser.uid,
              email: currentUser.email,
              accountType: 'user',
            });
          }
        } catch (error) {
          console.error('[AuthContext] Error fetching user data:', error);
          setUserData({
            uid: currentUser.uid,
            email: currentUser.email,
            accountType: 'user',
          });
        }
      } else {
        setUserData(null);
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

  const isOrganization = userData?.accountType === 'organization';

  return (
    <AuthContext.Provider value={{ user, userData, loading, isOrganization }}>
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