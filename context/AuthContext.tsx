import React, { createContext, ReactNode, useContext, useState } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user für Entwicklung - später durch echte API ersetzen
const mockUsers = [
  {
    id: '1',
    name: 'Max Mustermann',
    email: 'max@example.com',
    password: 'password123',
  },
  {
    id: '2',
    name: 'Anna Schmidt',
    email: 'anna@example.com',
    password: 'password123',
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simuliere API-Aufruf
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    
    if (foundUser) {
      setUser({
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
      });
    } else {
      throw new Error('Ungültige E-Mail oder Passwort');
    }
    
    setIsLoading(false);
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    
    // Simuliere Google OAuth
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock Google User
    setUser({
      id: 'google_' + Date.now(),
      name: 'Google User',
      email: 'google.user@gmail.com',
    });
    
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    
    // Simuliere API-Aufruf für Password Reset
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userExists = mockUsers.some(
      u => u.email.toLowerCase() === email.toLowerCase()
    );
    
    if (!userExists) {
      setIsLoading(false);
      throw new Error('E-Mail-Adresse nicht gefunden');
    }
    
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

