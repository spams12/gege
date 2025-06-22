import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import nookies from 'nookies';
import { app } from '@/lib/firebase'; // Import Firebase app

interface AuthContextProps {
  currentUser: User | null;
  authLoading: boolean; // Add loading state
}

export const AuthContext = createContext<AuthContextProps>({
  currentUser: null,
  authLoading: true, // Default to loading
});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true); // Initialize as loading

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setCurrentUser(user);
        nookies.set(undefined, 'token', token, { path: '/' });
      } else {
        setCurrentUser(null);
        nookies.destroy(undefined, 'token', { path: '/' });
      }
      setAuthLoading(false);
    }, (error) => {
      console.error("Auth state observer error:", error);
      setCurrentUser(null);
      nookies.destroy(undefined, 'token', { path: '/' });
      setAuthLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
