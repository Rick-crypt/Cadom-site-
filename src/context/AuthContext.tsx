import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserRole = 'client' | 'admin' | 'super-admin';

interface UserData {
  uid: string;
  email: string | null;
  role: UserRole;
  photoURL?: string;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let role: UserRole = 'client';
        
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocInfo = await getDoc(userDocRef);
          
          let photoURL = firebaseUser.photoURL || undefined;

          const isOwner = firebaseUser.email === 'andymbourou45@gmail.com' || firebaseUser.email === 'autre@example.com';
          
          if (isOwner) {
            role = 'super-admin';
            // Force save the role if not set or different
            if (!userDocInfo.exists() || userDocInfo.data()?.role !== 'super-admin') {
              await setDoc(userDocRef, { email: firebaseUser.email, role: 'super-admin' }, { merge: true });
            }
          } else if (userDocInfo.exists()) {
            role = userDocInfo.data().role || 'client';
            if (userDocInfo.data().photoURL) photoURL = userDocInfo.data().photoURL;
            // Handle legacy users
            if (userDocInfo.data().isAdmin && !userDocInfo.data().role) {
                role = 'admin';
            }
          } else {
             // Create initial user doc for normal users
             await setDoc(userDocRef, { email: firebaseUser.email, role: 'client' }, { merge: true });
          }

          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role, photoURL });
        } catch (e) {
          console.error("Error fetching user data", e);
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: (firebaseUser.email === 'andymbourou45@gmail.com' || firebaseUser.email === 'autre@example.com') ? 'super-admin' : 'client', photoURL: firebaseUser.photoURL || undefined });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = () => firebaseSignOut(auth);

  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';
  const isSuperAdmin = user?.role === 'super-admin';

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSuperAdmin, signOut }}>
      {!loading ? children : <div className="flex h-screen w-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

