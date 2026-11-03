import React from 'react';
import { Sliders, ShoppingBag, Eye, Shield } from 'lucide-react';
import { WatchItem } from '../../../shared/types.js';
import { formatCurrencyCents } from '../../../server/services/pricingService.js';
import { useCart } from '../context/CartContext.js';

interface WatchCardProps {
  watch: WatchItem;
  onCustomize: (watch: WatchItem) => void;
  onViewDetails: (watch: WatchItem) => void;
}

export const WatchCard: React.FC<WatchCardProps> = ({ watch, onCustomize, onViewDetails }) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = React.useState(false);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setAdding(true);
      await addToCart({
        watchId: watch.id,
        isCustom: false,
        quantity: 1,
      });
    } finally {
      setAdding(false);
    }
  };

  const isLowStock = watch.stockQuantity <= 5 && watch.stockQuantity > 0;
  const isOutOfStock = watch.stockQuantity === 0;

  return (
    <div
      onClick={() => onViewDetails(watch)}
      className="group relative bg-luxury-900/80 hover:bg-luxury-850/90 border border-luxury-800/90 hover:border-luxury-gold/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-luxury-gold/5 flex flex-col cursor-pointer"
    >
      {/* Top Badges */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-luxury-950/80 backdrop-blur-md text-luxury-gold border border-luxury-gold/30 rounded-md">
          {watch.movement}
        </span>
        {isLowStock && (
          <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/30 rounded-md">
            Only {watch.stockQuantity} Left
          </span>
        )}
      </div>

      {/* Watch Visual / Image */}
      <div className="relative h-64 w-full bg-luxury-950/60 overflow-hidden flex items-center justify-center">
        <img
          src={watch.imageUrl}
          alt={watch.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-900/90 via-transparent to-transparent opacity-60" />

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-luxury-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(watch);
            }}
            className="p-3 bg-luxury-800 hover:bg-luxury-700 text-slate-100 rounded-full transition-transform hover:scale-110 shadow-lg"
            title="Inspect Technical Specs"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCustomize(watch);
            }}
            className="p-3 bg-luxury-gold hover:bg-luxury-goldLight text-luxury-950 rounded-full transition-transform hover:scale-110 shadow-lg"
            title="Open in Bespoke Customizer"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium tracking-wider uppercase mb-1">
            <span>{watch.collection}</span>
            <span>{watch.caseDiameterMm}mm • {watch.waterResistanceMeters}M</span>
          </div>

          <h3 className="font-serif text-lg font-bold text-slate-100 group-hover:text-luxury-gold transition-colors line-clamp-1">
            {watch.name}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed font-light">
            {watch.description}
          </p>
        </div>

        {/* Pricing & Cart Action */}
        <div className="pt-3 border-t border-luxury-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
              Base Price
            </span>
            <span className="font-mono text-lg font-bold text-slate-100">
              {formatCurrencyCents(watch.basePriceInCents)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCustomize(watch);
              }}
              className="px-3 py-1.5 bg-luxury-800 hover:bg-luxury-700 text-luxury-gold text-xs font-semibold rounded-md transition-colors"
            >
              Customize
            </button>
            <button
              disabled={isOutOfStock || adding}
              onClick={handleQuickAdd}
              className={`p-2 rounded-md transition-all ${
                isOutOfStock
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-luxury-gold hover:bg-luxury-goldLight text-luxury-950 hover:scale-105 active:scale-95'
              }`}
              title="Add to Cart"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

