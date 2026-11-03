import React, { useState, useEffect } from 'react';
import { Wrench, Package, AlertTriangle, TrendingUp, Check, Save, ArrowLeft, RefreshCw } from 'lucide-react';
import { api } from '../services/api.js';
import { WatchItem, Order } from '../../../shared/types.js';
import { formatCurrencyCents } from '../../../server/services/pricingService.js';

interface AdminDashboardProps {
  onBackToShopping: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToShopping }) => {
  const [inventory, setInventory] = useState<WatchItem[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Edit stock buffer
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const invData = await api.getAdminInventory();
      setInventory(invData.items);
      setMetrics(invData.metrics);

      // Initialize buffer
      const buffer: Record<string, number> = {};
      for (const w of invData.items) {
        buffer[w.id] = w.stockQuantity;
      }
      setStockEdits(buffer);

      const ordData = await api.getAdminOrders();
      setOrders(ordData.orders);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStock = async (watchId: string) => {
    const newStock = stockEdits[watchId];
    if (newStock === undefined || newStock < 0) return;

    try {
      setSavingId(watchId);
      await api.updateAdminInventory(watchId, { stockQuantity: newStock });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.updateAdminOrderStatus(orderId, status);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-luxury-800 pb-6 gap-4">
        <div>
          <button
            onClick={onBackToShopping}
            className="text-xs text-slate-400 hover:text-luxury-gold flex items-center space-x-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </button>
          <div className="flex items-center space-x-2">
            <Wrench className="w-6 h-6 text-amber-400" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-100">
              Admin Inventory & Supply Chain Hub
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Role-Based Access Control (RBAC) Protected Endpoint (IEEE SWEBOK v4 Ch. 13)
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2 bg-luxury-900 hover:bg-luxury-850 text-slate-200 border border-luxury-800 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-luxury-900 border border-luxury-800 p-5 rounded-xl shadow-lg">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Catalog Timepieces</span>
              <Package className="w-4 h-4 text-luxury-gold" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{metrics.totalProducts}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Active distinct references</span>
          </div>

          <div className="bg-luxury-900 border border-luxury-800 p-5 rounded-xl shadow-lg">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Total Available Units</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{metrics.totalStockUnits}</p>
            <span className="text-[10px] text-emerald-400 mt-1 block">Real-time atomic storage count</span>
          </div>

          <div className="bg-luxury-900 border border-luxury-800 p-5 rounded-xl shadow-lg">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Low Stock Alerts (&le;5 units)</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-400 mt-2">{metrics.lowStockAlertCount}</p>
            <span className="text-[10px] text-amber-400/80 mt-1 block">Requires atelier restocking</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-luxury-800 space-x-4">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-xs uppercase tracking-wider font-bold transition-colors ${
            activeTab === 'inventory'
              ? 'text-luxury-gold border-b-2 border-luxury-gold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Inventory Management ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs uppercase tracking-wider font-bold transition-colors ${
            activeTab === 'orders'
              ? 'text-luxury-gold border-b-2 border-luxury-gold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Customer Orders Pipeline ({orders.length})
        </button>
      </div>

      {/* Active Tab Table */}
      {activeTab === 'inventory' ? (
        <div className="bg-luxury-900 border border-luxury-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-luxury-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-luxury-800">
                <tr>
                  <th className="p-4">Timepiece Reference</th>
                  <th className="p-4">Calibre</th>
                  <th className="p-4">Base Price</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Adjust Stock</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-800/60">
                {inventory.map((watch) => {
                  const isLow = watch.stockQuantity <= 5;
                  const isModified = stockEdits[watch.id] !== watch.stockQuantity;

                  return (
                    <tr key={watch.id} className="hover:bg-luxury-850/50 transition-colors">
                      <td className="p-4 flex items-center space-x-3">
                        <img
                          src={watch.imageUrl}
                          alt={watch.name}
                          className="w-10 h-10 rounded-md object-cover bg-luxury-950 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-100">{watch.name}</p>
                          <p className="text-[10px] text-slate-400">{watch.modelCode} • {watch.caseDiameterMm}mm</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-luxury-950 text-luxury-gold font-medium border border-luxury-800">
                          {watch.movement}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-200">
                        {formatCurrencyCents(watch.basePriceInCents)}
                      </td>
                      <td className="p-4">
                        <span className={`font-mono font-bold ${isLow ? 'text-amber-400' : 'text-slate-100'}`}>
                          {watch.stockQuantity} units
                        </span>
                        {isLow && <span className="block text-[9px] text-amber-400/90 uppercase font-bold">Low Stock</span>}
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          min={0}
                          max={500}
                          value={stockEdits[watch.id] ?? watch.stockQuantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setStockEdits({ ...stockEdits, [watch.id]: isNaN(val) ? 0 : val });
                          }}
                          className="w-20 bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded px-2 py-1 text-xs font-mono text-slate-100 focus:outline-none"
                        />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          disabled={savingId === watch.id || !isModified}
                          onClick={() => handleUpdateStock(watch.id)}
                          className={`px-3 py-1.5 rounded text-[11px] font-semibold transition-all flex items-center space-x-1 ml-auto ${
                            isModified
                              ? 'bg-luxury-gold hover:bg-luxury-goldLight text-luxury-950 shadow-md'
                              : 'bg-luxury-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{savingId === watch.id ? 'Saving...' : 'Commit'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Orders Pipeline Table */
        <div className="bg-luxury-900 border border-luxury-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-luxury-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-luxury-800">
                <tr>
                  <th className="p-4">Order Reference</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Total (Cents)</th>
                  <th className="p-4">Pipeline Status</th>
                  <th className="p-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-800/60">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-luxury-850/50 transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-bold text-luxury-gold">{order.orderNumber}</span>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{order.trackingNumber}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-200">{order.customerName}</p>
                      <p className="text-[10px] text-slate-400">{order.customerEmail}</p>
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-100">
                      {formatCurrencyCents(order.pricing.finalTotalInCents)}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                      >
                        <option value="processing">Processing</option>
                        <option value="assembling">Assembling</option>
                        <option value="quality_check">Quality Check</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

