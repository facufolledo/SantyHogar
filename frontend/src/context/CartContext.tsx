import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { Product } from '../data/products';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string; // For products with sizes/variants
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; size?: string }
  | { type: 'REMOVE_ITEM'; id: string; size?: string }
  | { type: 'UPDATE_QTY'; id: string; quantity: number; size?: string }
  | { type: 'CLEAN_INVALID'; validProductIds: string[] }
  | { type: 'CLEAR' };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  // Helper to create a unique key for a product + size combination
  const getItemKey = (id: string, size?: string) => size ? `${id}::${size}` : id;
  
  switch (action.type) {
    case 'ADD_ITEM': {
      const itemKey = getItemKey(action.product.id, action.size);
      const existing = state.items.find(i => 
        i.product.id === action.product.id && i.selectedSize === action.size
      );
      if (existing) {
        return {
          items: state.items.map(i =>
            i.product.id === action.product.id && i.selectedSize === action.size
              ? { ...i, quantity: Math.min(i.quantity + 1, action.product.stock) }
              : i
          ),
        };
      }
      return { items: [...state.items, { product: action.product, quantity: 1, selectedSize: action.size }] };
    }
    case 'REMOVE_ITEM':
      return { 
        items: state.items.filter(i => 
          !(i.product.id === action.id && i.selectedSize === action.size)
        ) 
      };
    case 'UPDATE_QTY':
      if (action.quantity <= 0) {
        return { 
          items: state.items.filter(i => 
            !(i.product.id === action.id && i.selectedSize === action.size)
          ) 
        };
      }
      return {
        items: state.items.map(i =>
          i.product.id === action.id && i.selectedSize === action.size
            ? { ...i, quantity: action.quantity }
            : i
        ),
      };
    case 'CLEAR':
      return { items: [] };
    case 'CLEAN_INVALID':
      return { 
        items: state.items.filter(i => 
          action.validProductIds.includes(i.product.id) && i.product.stock > 0
        ) 
      };
    default:
      return state;
  }
};

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size?: string) => void;
  removeItem: (id: string, size?: string) => void;
  updateQty: (id: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  cleanInvalid: (validProducts: Product[]) => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'santyhogar_cart';

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] }, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { items: [] };
    } catch {
      return { items: [] };
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const total = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const count = state.items.reduce((sum, i) => sum + i.quantity, 0);

  const cleanInvalid = useCallback((validProducts: Product[]) => {
    dispatch({ type: 'CLEAN_INVALID', validProductIds: validProducts.map(p => p.id) });
  }, []);

  return (
    <CartContext.Provider value={{
      items: state.items,
      addItem: (product, size) => dispatch({ type: 'ADD_ITEM', product, size }),
      removeItem: (id, size) => dispatch({ type: 'REMOVE_ITEM', id, size }),
      updateQty: (id, quantity, size) => dispatch({ type: 'UPDATE_QTY', id, quantity, size }),
      clearCart: () => dispatch({ type: 'CLEAR' }),
      cleanInvalid,
      total,
      count,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
