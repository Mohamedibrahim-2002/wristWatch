import React, { useState, useEffect } from 'react';
import { User as UserIcon, Package, Shield, Download, Trash2, LogOut, ExternalLink, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Order } from '../../../shared/types.js';
import { formatCurrencyCents } from '../../../server/services/pricingService.js';

interface AccountDashboardProps {
  onBackToShopping: () => void;
}

export const AccountDashboard: React.FC<AccountDashboardProps> = ({ onBackToShopping }) => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        const data = await api.getMyOrders();
        setOrders(data);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    if (user) {
      fetchOrders();
    }
  }, [user]);

  if (!user) return null;

  const handleExportData = async () => {
    try {
      setExporting(true);
      const blob = await api.exportGdprData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-data-export-${user.id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export data archive');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    try {
      setDeleting(true);
      await api.deleteAccount();
      logout();
      onBackToShopping();
    } catch (err: any) {
      alert(err.message || 'Failed to erase account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Profile Header */}
      <div className="bg-luxury-900 border border-luxury-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-luxury-gold/20 border border-luxury-gold/40 text-luxury-gold flex items-center justify-center font-serif text-2xl font-bold">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif text-2xl font-bold text-slate-100">{user.fullName}</h1>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Collector since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            onBackToShopping();
          }}
          className="px-4 py-2 bg-luxury-950 hover:bg-luxury-850 text-slate-300 hover:text-white border border-luxury-800 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Order History */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-slate-100 flex items-center space-x-2">
              <Package className="w-5 h-5 text-luxury-gold" />
              <span>Acquisition & Order History</span>
            </h2>
            <span className="text-xs text-slate-400">{orders.length} timepieces</span>
          </div>

          {loadingOrders ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading order records...</div>
          ) : orders.length === 0 ? (
            <div className="bg-luxury-900/60 border border-luxury-800 rounded-xl p-8 text-center space-y-3">
              <Clock className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-serif text-slate-200 font-bold">No Orders Placed Yet</p>
              <p className="text-xs text-slate-400">
                Your acquired watches and bespoke builds will be logged here with live tracking.
              </p>
              <button
                onClick={onBackToShopping}
                className="px-4 py-2 bg-luxury-gold text-luxury-950 text-xs font-bold uppercase tracking-wider rounded-lg"
              >
                Explore Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-luxury-900/80 border border-luxury-800 rounded-xl p-5 space-y-4 shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-luxury-800/80 pb-3">
                    <div>
                      <span className="font-mono text-sm font-bold text-luxury-gold">{order.orderNumber}</span>
                      <p className="text-[11px] text-slate-400">
                        Placed on {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        {order.orderStatus}
                      </span>
                      <span className="font-mono text-base font-bold text-slate-100">
                        {formatCurrencyCents(order.pricing.finalTotalInCents)}
                      </span>
                    </div>
                  </div>

                  {/* Items in order */}
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.watchSnapshot.imageUrl}
                            alt={item.watchSnapshot.name}
                            className="w-10 h-10 rounded-md object-cover bg-luxury-950"
                          />
                          <div>
                            <p className="font-semibold text-slate-200">{item.watchSnapshot.name}</p>
                            <p className="text-[10px] text-slate-400">
                              Qty: {item.quantity} • {item.isCustom ? 'Bespoke Custom' : 'Standard'}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-medium text-slate-300">
                          {formatCurrencyCents(item.totalPriceInCents)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery & Tracking */}
                  <div className="bg-luxury-950 p-3 rounded-lg border border-luxury-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Tracking Reference:</span>
                    <span className="font-mono text-slate-200 font-semibold">{order.trackingNumber}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: SWEBOK v4 Chapter 14 Privacy Hub */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-luxury-900 border border-luxury-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-slate-100 font-serif font-bold text-base border-b border-luxury-800 pb-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>SWEBOK v4 Privacy Hub</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-light">
              In full compliance with <strong className="text-slate-100">GDPR Articles 17 & 20</strong> and CCPA guidelines, you have total sovereignty over your personal profile, addresses, and order history.
            </p>

            <div className="space-y-3 pt-2">
              {/* GDPR Portability Export */}
              <button
                onClick={handleExportData}
                disabled={exporting}
                className="w-full py-2.5 px-3 bg-luxury-950 hover:bg-luxury-800 text-slate-200 border border-luxury-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4 text-luxury-gold" />
                <span>{exporting ? 'Generating Archive...' : 'Download Personal Data (JSON)'}</span>
              </button>

              {/* GDPR Right to Erasure */}
              {user.role !== 'admin' && (
                <div className="pt-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-2 ${
                      deleteConfirm
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-luxury-950 hover:bg-rose-950 text-rose-400 border border-rose-900/50'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{deleteConfirm ? 'Confirm Permanent Erasure' : 'Erase Account (GDPR Art. 17)'}</span>
                  </button>
                  {deleteConfirm && (
                    <p className="text-[10px] text-rose-400 text-center mt-1.5">
                      Click again to permanently erase your profile and anonymize records.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
