import React from 'react';
import { X, Sliders, ShoppingBag, ShieldCheck, Clock, Compass, Activity, Droplets } from 'lucide-react';
import { WatchItem, formatCurrencyCents } from '../../../shared/types.js';
import { useCart } from '../context/CartContext.js';

interface WatchDetailModalProps {
  watch: WatchItem | null;
  onClose: () => void;
  onCustomize: (watch: WatchItem) => void;
}

export const WatchDetailModal: React.FC<WatchDetailModalProps> = ({ watch, onClose, onCustomize }) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = React.useState(false);

  if (!watch) return null;

  const handleAdd = async () => {
    try {
      setAdding(true);
      await addToCart({
        watchId: watch.id,
        isCustom: false,
        quantity: 1,
      });
      onClose();
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-luxury-900 border border-luxury-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-luxury-950/80 text-slate-400 hover:text-white border border-luxury-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Watch Image Showcase */}
        <div className="w-full md:w-1/2 bg-luxury-950 flex items-center justify-center relative min-h-[300px]">
          <img
            src={watch.imageUrl}
            alt={watch.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-900 via-transparent to-transparent md:hidden" />
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1 bg-luxury-gold text-luxury-950 text-xs font-bold uppercase tracking-wider rounded-full">
              {watch.movement} Calibre
            </span>
          </div>
        </div>

        {/* Technical Data & Details */}
        <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-luxury-gold font-semibold">
                {watch.brand} • {watch.collection}
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-100 mt-1">
                {watch.name}
              </h2>
              <p className="font-mono text-xs text-slate-400 mt-0.5">Reference: {watch.modelCode}</p>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-light">
              {watch.description}
            </p>

            {/* Technical Specifications Grid (SWEBOK v4 Requirements) */}
            <div className="pt-2">
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Horological Technical Specification</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-luxury-950/70 p-3 rounded-lg border border-luxury-800">
                  <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                    <Compass className="w-3.5 h-3.5 text-luxury-gold" />
                    <span>Case Diameter</span>
                  </div>
                  <span className="font-semibold text-slate-200">{watch.caseDiameterMm} mm</span>
                </div>

                <div className="bg-luxury-950/70 p-3 rounded-lg border border-luxury-800">
                  <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    <span>Water Resistance</span>
                  </div>
                  <span className="font-semibold text-slate-200">{watch.waterResistanceMeters} Meters / {Math.round(watch.waterResistanceMeters * 3.28)} ft</span>
                </div>

                <div className="bg-luxury-950/70 p-3 rounded-lg border border-luxury-800">
                  <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Power Reserve</span>
                  </div>
                  <span className="font-semibold text-slate-200">
                    {watch.specs.powerReserveHours > 1000 ? '3 Years (Quartz Cell)' : `${watch.specs.powerReserveHours} Hours`}
                  </span>
                </div>

                <div className="bg-luxury-950/70 p-3 rounded-lg border border-luxury-800">
                  <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                    <Activity className="w-3.5 h-3.5 text-rose-400" />
                    <span>Jewel Count</span>
                  </div>
                  <span className="font-semibold text-slate-200">{watch.specs.jewelsCount} Synthetic Rubies</span>
                </div>

                <div className="bg-luxury-950/70 p-3 rounded-lg border border-luxury-800 col-span-2">
                  <span className="text-slate-400 block mb-0.5">Crystal & Case Thickness:</span>
                  <span className="font-semibold text-slate-200">
                    {watch.specs.crystalType} • {watch.specs.caseThicknessMm} mm Thickness
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-6 border-t border-luxury-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-medium">
                Canonical Base Price
              </span>
              <span className="font-mono text-2xl font-bold text-slate-100">
                {formatCurrencyCents(watch.basePriceInCents)}
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">
                ● In Stock ({watch.stockQuantity} available)
              </span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  onClose();
                  onCustomize(watch);
                }}
                className="flex-1 sm:flex-none px-4 py-3 bg-luxury-800 hover:bg-luxury-700 text-luxury-gold text-xs uppercase font-bold tracking-wider rounded-lg border border-luxury-700 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Sliders className="w-4 h-4" />
                <span>Customize</span>
              </button>

              <button
                disabled={adding || watch.stockQuantity === 0}
                onClick={handleAdd}
                className="flex-1 sm:flex-none px-6 py-3 bg-luxury-gold hover:bg-luxury-goldLight text-luxury-950 text-xs uppercase font-bold tracking-wider rounded-lg transition-all shadow-lg flex items-center justify-center space-x-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{adding ? 'Adding...' : 'Add to Cart'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

