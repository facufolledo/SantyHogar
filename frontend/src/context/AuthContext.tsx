import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'cliente' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  joinedAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  isLogged: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; role?: UserRole }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string; role?: UserRole }>;
  logout: () => void;
}

// Mock credentials
const MOCK_USERS: (AuthUser & { password: string })[] = [
  {
    id: 'admin1',
    name: 'Admin Santy Hogar',
    email: 'admin@santyhogar.com',
    phone: '011 4000-0000',
    role: 'admin',
    joinedAt: '2023-01-01',
    password: 'admin123',
  },
  {
    id: 'u1',
    name: 'María González',
    email: 'maria@email.com',
    phone: '011 1234-5678',
    role: 'cliente',
    joinedAt: '2023-06-10',
    password: '123456',
  },
];

const STORAGE_KEY = 'santyhogar_auth';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login = async (email: string, password: string) => {
    await new Promise(r => setTimeout(r, 600));
    const found = MOCK_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return { ok: false, error: 'Email o contraseña incorrectos' };
    const { password: _, ...authUser } = found;
    setUser(authUser);
    return { ok: true, role: authUser.role };
  };

  const register = async (name: string, email: string, _password: string) => {
    await new Promise(r => setTimeout(r, 600));
    const exists = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return { ok: false, error: 'Ya existe una cuenta con ese email' };
    const newUser: AuthUser = {
      id: Date.now().toString(),
      name,
      email,
      phone: '',
      role: 'cliente',
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setUser(newUser);
    return { ok: true, role: 'cliente' as UserRole };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin: user?.role === 'admin',
      isLogged: !!user,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
