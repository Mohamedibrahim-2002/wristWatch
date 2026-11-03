import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, TransparentPriceBreakdown, CustomizerSelection } from '../../../shared/types.js';
import { api } from '../services/api.js';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  breakdown: TransparentPriceBreakdown | null;
  loading: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  couponCode: string;
  setCouponCode: (code: string) => void;
  applyCoupon: (code: string) => Promise<void>;
  addToCart: (payload: { watchId: string; isCustom: boolean; customConfig?: CustomizerSelection; quantity?: number }) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemCount, setItemCount] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<TransparentPriceBreakdown | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>('');

  const refreshCart = async () => {
    try {
      setLoading(true);
      const data = await api.getCart(couponCode);
      setItems(data.items);
      setItemCount(data.itemCount);
      setBreakdown(data.breakdown);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [couponCode]);

  const applyCoupon = async (code: string) => {
    setCouponCode(code);
  };

  const addToCart = async (payload: {
    watchId: string;
    isCustom: boolean;
    customConfig?: CustomizerSelection;
    quantity?: number;
  }) => {
    const data = await api.addToCart(payload);
    setItems(data.items);
    setItemCount(data.items.reduce((acc, i) => acc + i.quantity, 0));
    await refreshCart();
    setIsCartOpen(true);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }
    const data = await api.updateCartQuantity(itemId, quantity);
    setItems(data.items);
    await refreshCart();
  };

  const removeFromCart = async (itemId: string) => {
    const data = await api.removeFromCart(itemId);
    setItems(data.items);
    await refreshCart();
  };

  const clearCart = async () => {
    await api.clearCart();
    setItems([]);
    setItemCount(0);
    setBreakdown(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        breakdown,
        loading,
        isCartOpen,
        setIsCartOpen,
        couponCode,
        setCouponCode,
        applyCoupon,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

