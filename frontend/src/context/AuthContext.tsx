import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'cliente' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  joinedAt: string;
  customerId?: string;
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  isLogged: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; role?: UserRole }>;
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string; role?: UserRole }>;
  logout: () => void;
  updateUser: (data: Partial<Pick<AuthUser, 'name' | 'email' | 'phone'>>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from Supabase
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserFromSupabase(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
        if (session?.user) {
          setUserFromSupabase(session.user);
        }
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user) {
          setUserFromSupabase(session.user);
        }
      } else if (!session) {
        // Si no hay sesión, desloguear
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setUserFromSupabase = async (supabaseUser: User) => {
    // Leer el rol desde user_metadata
    const roleFromMetadata = supabaseUser.user_metadata?.role;
    const isAdmin = roleFromMetadata === 'admin';
    
    const authUser: AuthUser = {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
      email: supabaseUser.email || '',
      phone: supabaseUser.user_metadata?.phone || supabaseUser.phone || '',
      role: isAdmin ? 'admin' : 'cliente',
      joinedAt: supabaseUser.created_at || new Date().toISOString(),
      avatar: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
      customerId: supabaseUser.id, // Mismo ID que el usuario de auth
    };

    // Crear cliente en la base de datos si no existe (solo para clientes, no admins)
    if (!isAdmin) {
      try {
        // Verificar si el cliente ya existe
        const response = await fetch(`${import.meta.env.VITE_API_URL}/customers/${supabaseUser.id}`);
        
        if (response.status === 404) {
          // Cliente no existe, crearlo
          const createResponse = await fetch(`${import.meta.env.VITE_API_URL}/customers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: supabaseUser.id,
              name: authUser.name,
              email: authUser.email,
              phone: authUser.phone,
              address: '',
              city: '',
              province: '',
              postalCode: '',
              notes: `Registrado con ${supabaseUser.app_metadata?.provider || 'email'}`,
            }),
          });

          if (createResponse.ok) {
            console.log('✅ Cliente creado automáticamente');
          }
        }
      } catch (error) {
        console.error('Error al crear cliente:', error);
        // No bloqueamos el login si falla la creación del cliente
      }
    }

    setUser(authUser);
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      if (data.user) {
        setUserFromSupabase(data.user);
        const role = data.user.user_metadata?.role === 'admin' ? 'admin' : 'cliente';
        return { ok: true, role };
      }

      return { ok: false, error: 'Error al iniciar sesión' };
    } catch (error) {
      console.error('Login error:', error);
      return { ok: false, error: 'Error al iniciar sesión' };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const basename = import.meta.env.MODE === 'production' ? '/SantyHogar' : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${basename}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true };
    } catch (error) {
      console.error('Google login error:', error);
      return { ok: false, error: 'Error al iniciar sesión con Google' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities?.length === 0) {
          return { ok: false, error: 'Ya existe una cuenta con ese email' };
        }

        setUserFromSupabase(data.user);
        return { ok: true, role: 'cliente' as UserRole };
      }

      return { ok: false, error: 'Error al registrarse' };
    } catch (error) {
      console.error('Register error:', error);
      return { ok: false, error: 'Error al registrarse' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = (data: Partial<Pick<AuthUser, 'name' | 'email' | 'phone'>>) => {
    setUser(prev => prev ? { ...prev, ...data } : prev);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin: user?.role === 'admin',
      isLogged: !!user,
      loading,
      login,
      loginWithGoogle,
      register,
      logout,
      updateUser,
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
