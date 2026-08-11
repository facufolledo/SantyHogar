import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchFavorites, addFavorite, removeFavorite } from '../api/customersApi';

interface FavoritesContextType {
  favorites: Set<string>;
  loading: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLogged } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user?.customerId || !isLogged) {
      setFavorites(new Set());
      return;
    }

    setLoading(true);
    try {
      const data = await fetchFavorites(user.customerId);
      setFavorites(new Set(data.map(f => f.productId)));
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites(new Set());
    } finally {
      setLoading(false);
    }
  }, [user?.customerId, isLogged]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorite = useCallback((productId: string) => {
    return favorites.has(productId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (productId: string) => {
    if (!user?.customerId) {
      throw new Error('Debes iniciar sesión para agregar favoritos');
    }

    const wasFavorite = favorites.has(productId);

    // Optimistic update
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (wasFavorite) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });

    try {
      if (wasFavorite) {
        await removeFavorite(user.customerId, productId);
      } else {
        await addFavorite(user.customerId, productId);
      }
    } catch (error) {
      // Revert on error
      setFavorites(prev => {
        const newSet = new Set(prev);
        if (wasFavorite) {
          newSet.add(productId);
        } else {
          newSet.delete(productId);
        }
        return newSet;
      });
      throw error;
    }
  }, [user?.customerId, favorites]);

  const refreshFavorites = useCallback(async () => {
    await loadFavorites();
  }, [loadFavorites]);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      loading,
      isFavorite,
      toggleFavorite,
      refreshFavorites,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
};
