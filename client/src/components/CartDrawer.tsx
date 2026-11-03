import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, Tag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { formatCurrencyCents } from '../../../shared/types.js';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    items,
    itemCount,
    breakdown,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    couponCode,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    try {
      setCouponError('');
      await applyCoupon(inputCoupon.trim());
    } catch {
      setCouponError('Invalid promotion code');
    }
  };

  // Free shipping threshold calculations
  const freeShippingThreshold = 150000; // $1,500.00 in cents
  const currentSubtotal = breakdown?.subtotalInCents || 0;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - currentSubtotal);
  const freeShippingProgress = Math.min(100, Math.round((currentSubtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-luxury-900 border-l border-luxury-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-luxury-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-luxury-gold" />
              <h2 className="font-serif text-lg font-bold text-slate-100">
                Horology Bag ({itemCount})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-luxury-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator (Ethical E-Commerce UX) */}
          <div className="bg-luxury-950 px-6 py-3 border-b border-luxury-800/80">
            {remainingForFreeShipping === 0 ? (
              <p className="text-xs text-emerald-400 font-medium flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Complimentary Insured Courier Shipping Unlocked!</span>
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-300">
                  Add <strong className="text-luxury-gold">{formatCurrencyCents(remainingForFreeShipping)}</strong> more for complimentary insured courier shipping.
                </p>
                <div className="w-full h-1.5 bg-luxury-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-luxury-gold rounded-full transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm font-serif text-slate-300 font-bold">Your Bag is Empty</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Browse our master timepiece collection or configure a bespoke watch to begin.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="bg-luxury-950/80 border border-luxury-800 p-4 rounded-xl flex space-x-4 items-center"
                >
                  {/* Watch Thumbnail */}
                  <img
                    src={item.watchSnapshot.imageUrl}
                    alt={item.watchSnapshot.name}
                    className="w-16 h-16 rounded-lg object-cover bg-luxury-900 shrink-0"
                  />

                  {/* Item Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-serif font-bold text-slate-100 truncate">
                        {item.watchSnapshot.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {item.isCustom ? (
                        <span className="text-luxury-gold font-medium">Bespoke Custom Build</span>
                      ) : (
                        item.watchSnapshot.brand
                      )}
                    </p>

                    {item.isCustom && item.customConfig && (
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.customConfig.caseMaterial} • {item.customConfig.dialColor}
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-3">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {formatCurrencyCents(item.totalPriceInCents)}
                      </span>

                      {/* Quantity Stepper */}
                      <div className="flex items-center space-x-2 bg-luxury-900 border border-luxury-800 rounded-md px-1.5 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-slate-400 hover:text-white p-0.5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-medium px-1.5 text-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-slate-400 hover:text-white p-0.5"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Financial Breakdown & Checkout Button */}
          {items.length > 0 && breakdown && (
            <div className="p-6 border-t border-luxury-800 bg-luxury-950/90 space-y-4">
              {/* Promotional Coupon Input */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value)}
                    placeholder="Promo code (e.g., HOROLOGY10)"
                    className="w-full bg-luxury-900 border border-luxury-800 focus:border-luxury-gold rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 uppercase focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 bg-luxury-800 hover:bg-luxury-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors"
                >
                  Apply
                </button>
              </form>

              {couponCode && (
                <div className="text-[11px] text-emerald-400 flex items-center justify-between">
                  <span>Applied Promo: <strong>{couponCode}</strong></span>
                  <span>-{formatCurrencyCents(breakdown.discountInCents)}</span>
                </div>
              )}

              {/* Itemized Transparent Math */}
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-mono">{formatCurrencyCents(breakdown.subtotalInCents)}</span>
                </div>

                {breakdown.discountInCents > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span className="font-mono">-{formatCurrencyCents(breakdown.discountInCents)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-mono">{formatCurrencyCents(breakdown.taxInCents)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Insured Courier Shipping</span>
                  <span className="font-mono">
                    {breakdown.isFreeShipping ? 'Complimentary ($0.00)' : formatCurrencyCents(breakdown.shippingInCents)}
                  </span>
                </div>

                <div className="pt-2 border-t border-luxury-800 flex justify-between items-baseline font-bold text-slate-100 text-sm">
                  <span>Final Verified Total</span>
                  <span className="font-mono text-xl text-slate-100">
                    {formatCurrencyCents(breakdown.finalTotalInCents)}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full py-4 bg-gradient-to-r from-luxury-gold to-luxury-goldDark text-luxury-950 font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg hover:shadow-luxury-gold/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={clearCart}
                className="w-full text-center text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
              >
                Clear entire bag
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

