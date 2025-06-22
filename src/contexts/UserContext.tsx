import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuthContext } from './AuthContext';

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  address: {
    city: string;
    country: string;
    street: string;
    full: string;
  };
  uid: string;
  joinDate?: Date;
  lastOrder?: Date;
  status?: string;
  totalOrders?: number;
  totalSpent?: number;
  orders?: string[];
}

interface UserContextProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authLoading: boolean;
  error: string | null;
}

export const UserContext = createContext<UserContextProps>({
  currentUser: null,
  userProfile: null,
  loading: false,
  authLoading: true,
  error: null,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, authLoading } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetching if auth is still loading or user is not logged in
    if (authLoading || !currentUser) {
      if (!currentUser) {
        setUserProfile(null);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchUserProfile = async () => {
        const userDocRef = doc(db, 'customers', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserProfile;
          setUserProfile(userData);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      };

      fetchUserProfile().catch(err => {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile data');
        setLoading(false);
      });
    } catch (err) {
      console.error('Error in profile effect:', err);
      setError('Failed to load user profile data');
      setLoading(false);
    }
  }, [currentUser, authLoading]);

  return (
    <UserContext.Provider value={{ currentUser, userProfile, loading, authLoading, error }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for easier usage
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 