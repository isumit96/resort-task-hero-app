
import { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextType {
  userId: string | null;
  login: (id: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  const login = (id: string) => {
    setUserId(id);
    // In a real app, we might store this in localStorage or a secure cookie
  };

  const logout = () => {
    setUserId(null);
    // In a real app, we would clear storage/cookies
  };

  const value = {
    userId,
    login,
    logout,
    isAuthenticated: Boolean(userId)
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
