import React, { useState } from 'react';
import { X, ShieldCheck, Lock, CreditCard, CheckCircle2, AlertTriangle, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { formatCurrencyCents } from '../../../server/services/pricingService.js';
import { Order } from '../../../shared/types.js';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { items, breakdown, couponCode, clearCart } = useCart();
  const { user } = useAuth();

  // Form State
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [streetAddress, setStreetAddress] = useState('124 Rue du Rhône');
  const [city, setCity] = useState('Geneva');
  const [stateOrProvince, setStateOrProvince] = useState('Geneva');
  const [postalCode, setPostalCode] = useState('1204');
  const [country, setCountry] = useState('Switzerland');
  const [phoneNumber, setPhoneNumber] = useState('+41 22 819 99 99');

  // Simulated PCI Credit Card fields
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  // Submission state
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakdown || items.length === 0) return;

    try {
      setProcessing(true);
      setErrorMessage('');

      // SWEBOK v4 Ch. 13 (PCI-DSS Compliance): Client-Side Tokenization Simulation
      // Raw card details are NEVER sent to the application backend.
      // Instead, the client exchanges raw card credentials with the PCI vault to obtain a one-time token 'tok_...'.
      const simulatedPciToken = `tok_visa_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const payload = {
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim(),
        shippingAddress: {
          fullName: customerName.trim(),
          streetAddress: streetAddress.trim(),
          city: city.trim(),
          stateOrProvince: stateOrProvince.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
          phoneNumber: phoneNumber.trim(),
        },
        items: items.map((i) => ({
          watchId: i.watchId,
          isCustom: i.isCustom,
          customConfig: i.customConfig,
          quantity: i.quantity,
        })),
        couponCode: couponCode || undefined,
        paymentToken: simulatedPciToken,
        cardLastFour: '4242',
        cardBrand: 'Visa Signature',
      };

      const order = await api.processCheckout(payload);
      setCompletedOrder(order);
      await clearCart();
      onOrderSuccess(order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment authorization failed. Please check your credentials.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-luxury-900 border border-luxury-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-luxury-800 flex items-center justify-between bg-luxury-950">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-luxury-gold" />
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-100">
                {completedOrder ? 'Order Confirmed & Certified' : 'Secure Encrypted Checkout'}
              </h3>
              <p className="text-[11px] text-slate-400">
                IEEE SWEBOK v4 Compliant • PCI-DSS Level 1 Tokenization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-luxury-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {completedOrder ? (
            /* --- ORDER SUCCESS VIEW --- */
            <div className="text-center space-y-6 py-6">
              <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-luxury-gold font-bold">
                  Payment Captured & Authenticated
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-100">
                  Congratulations, Order Placed
                </h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Your bespoke timepiece order <strong className="text-luxury-gold">{completedOrder.orderNumber}</strong> has been allocated into assembly.
                </p>
              </div>

              {/* Order Tracking Summary Card */}
              <div className="bg-luxury-950 p-5 rounded-xl border border-luxury-800 text-left max-w-lg mx-auto space-y-3 text-xs">
                <div className="flex justify-between border-b border-luxury-800 pb-2">
                  <span className="text-slate-400">Tracking Reference:</span>
                  <span className="font-mono font-bold text-slate-100">{completedOrder.trackingNumber}</span>
                </div>
                <div className="flex justify-between border-b border-luxury-800 pb-2">
                  <span className="text-slate-400">Customer Recipient:</span>
                  <span className="text-slate-200">{completedOrder.customerName} ({completedOrder.customerEmail})</span>
                </div>
                <div className="flex justify-between border-b border-luxury-800 pb-2">
                  <span className="text-slate-400">Total Authorized (Integer Cents):</span>
                  <span className="font-mono font-bold text-luxury-gold text-sm">
                    {formatCurrencyCents(completedOrder.pricing.finalTotalInCents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Delivery Method:</span>
                  <span className="text-emerald-400 font-medium flex items-center space-x-1">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Insured Armored Courier (3-5 Business Days)</span>
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-8 py-3 bg-luxury-gold text-luxury-950 font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg hover:bg-luxury-goldLight transition-all"
              >
                Return to Horology Gallery
              </button>
            </div>
          ) : (
            /* --- CHECKOUT FORM VIEW --- */
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-4 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center space-x-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Customer Contact */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-luxury-gold text-luxury-950 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Recipient & Contact Profile</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g., Alexander Vance"
                      className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="collector@wristwatch.luxury"
                      className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Shipping Destination */}
              <div className="space-y-3 pt-3 border-t border-luxury-800">
                <h4 className="text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-luxury-gold text-luxury-950 flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Insured Delivery Address</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">State / Canton</label>
                      <input
                        type="text"
                        required
                        value={stateOrProvince}
                        onChange={(e) => setStateOrProvince(e.target.value)}
                        className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Postal Code</label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Country</label>
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Courier Contact Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Payment Tokenization (PCI-DSS Compliant) */}
              <div className="space-y-3 pt-3 border-t border-luxury-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-luxury-gold text-luxury-950 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>Client Tokenized Payment (PCI-DSS)</span>
                  </h4>
                  <span className="text-[10px] text-emerald-400 flex items-center space-x-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>256-Bit TLS 1.3 Vault</span>
                  </span>
                </div>

                <div className="bg-luxury-950 p-4 rounded-xl border border-luxury-800 space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Credit / Debit Card Number</label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        readOnly
                        value={cardNumber}
                        className="w-full bg-luxury-900 border border-luxury-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-200 cursor-not-allowed"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Demo simulation card with pre-authorized tokenization.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Expiration</label>
                      <input
                        type="text"
                        readOnly
                        value={cardExpiry}
                        className="w-full bg-luxury-900 border border-luxury-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Security CVC</label>
                      <input
                        type="password"
                        readOnly
                        value={cardCvc}
                        className="w-full bg-luxury-900 border border-luxury-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Total & Final Submit */}
              {breakdown && (
                <div className="pt-4 border-t border-luxury-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-medium">
                      Total Due (Verified)
                    </span>
                    <span className="font-mono text-2xl font-bold text-slate-100">
                      {formatCurrencyCents(breakdown.finalTotalInCents)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={processing}
                    className="px-8 py-3.5 bg-gradient-to-r from-luxury-gold to-luxury-goldDark text-luxury-950 font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg hover:shadow-luxury-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{processing ? 'Processing Payment & Inventory...' : 'Authorize & Place Order'}</span>
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

