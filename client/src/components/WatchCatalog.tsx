import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { WatchItem } from '../../../shared/types.js';
import { api } from '../services/api.js';
import { WatchCard } from './WatchCard.js';

interface WatchCatalogProps {
  onCustomize: (watch: WatchItem) => void;
  onViewDetails: (watch: WatchItem) => void;
}

export const WatchCatalog: React.FC<WatchCatalogProps> = ({ onCustomize, onViewDetails }) => {
  const [watches, setWatches] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMovement, setSelectedMovement] = useState('ALL');
  const [selectedDiameter, setSelectedDiameter] = useState('ALL');
  const [selectedWaterResistance, setSelectedWaterResistance] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('featured');

  const fetchWatches = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedMovement !== 'ALL') params.movement = selectedMovement;
      if (selectedDiameter !== 'ALL') params.caseDiameter = selectedDiameter;
      if (selectedWaterResistance !== 'ALL') params.waterResistance = selectedWaterResistance;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (sortOrder === 'price_asc') params.sort = 'price_asc';
      if (sortOrder === 'price_desc') params.sort = 'price_desc';

      const data = await api.getCatalog(params);
      setWatches(data);
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatches();
  }, [selectedMovement, selectedDiameter, selectedWaterResistance, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWatches();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedMovement('ALL');
    setSelectedDiameter('ALL');
    setSelectedWaterResistance('ALL');
    setSortOrder('featured');
  };

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
        <p className="text-xs uppercase tracking-[0.25em] text-luxury-gold font-semibold">
          Curated Horology Catalog
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-100">
          The Masterpiece Collection
        </h2>
        <p className="text-sm text-slate-400 font-light leading-relaxed">
          Explore iconic Swiss movements, hand-finished cases, and high complications. Filter by mechanical calibre, water resistance, or diameter.
        </p>
      </div>

      {/* Filter & Search Bar (SWEBOK v4 Ch. 01 Functional Requirement) */}
      <div className="bg-luxury-900/90 border border-luxury-800 rounded-xl p-4 sm:p-6 mb-10 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by model, reference, or calibre..."
              className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
          </form>

          {/* Movement Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedMovement}
              onChange={(e) => setSelectedMovement(e.target.value)}
              className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Calibres</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual Wind</option>
              <option value="Tourbillon">Tourbillon</option>
              <option value="Quartz">Precision Quartz</option>
            </select>
          </div>

          {/* Case Diameter Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedDiameter}
              onChange={(e) => setSelectedDiameter(e.target.value)}
              className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Diameters</option>
              <option value="38">38 mm (Classic)</option>
              <option value="39">39 mm (Dress)</option>
              <option value="40">40 mm (Standard)</option>
              <option value="41">41 mm</option>
              <option value="42">42 mm (Sports)</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="md:col-span-3">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="featured">Sort: Featured First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tags & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-luxury-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Quick Calibre:</span>
            {['ALL', 'Automatic', 'Manual', 'Tourbillon'].map((mov) => (
              <button
                key={mov}
                onClick={() => setSelectedMovement(mov)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  selectedMovement === mov
                    ? 'bg-luxury-gold text-luxury-950'
                    : 'bg-luxury-950 text-slate-400 hover:text-slate-200 border border-luxury-800'
                }`}
              >
                {mov}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetFilters}
            className="flex items-center space-x-1 text-slate-400 hover:text-luxury-gold transition-colors text-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-slate-400">Loading Precision Timepieces...</p>
        </div>
      ) : watches.length === 0 ? (
        <div className="text-center py-20 bg-luxury-900/50 rounded-2xl border border-luxury-800 p-8 space-y-4">
          <SlidersHorizontal className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-slate-200">No Timepieces Match Your Criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search query, movement filter, or case diameter parameters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 bg-luxury-800 hover:bg-luxury-gold hover:text-luxury-950 text-luxury-gold text-xs uppercase font-bold tracking-wider rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {watches.map((watch) => (
            <WatchCard
              key={watch.id}
              watch={watch}
              onCustomize={onCustomize}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </section>
  );
};
