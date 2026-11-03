import React, { useState, useEffect } from 'react';
import {
  WatchItem,
  CustomizerSelection,
  CaseMaterial,
  BezelType,
  DialColor,
  HandsStyle,
  StrapMaterial,
  MovementType,
  TransparentPriceBreakdown,
} from '../../../shared/types.js';
import { api } from '../services/api.js';
import { formatCurrencyCents } from '../../../server/services/pricingService.js';
import { WatchRenderer } from './WatchRenderer.js';
import { useCart } from '../context/CartContext.js';
import {
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Info,
  Check,
  Eye,
  Sliders,
  ShieldAlert,
} from 'lucide-react';

interface WatchConfiguratorProps {
  initialWatch?: WatchItem | null;
  onExit?: () => void;
}

export const WatchConfigurator: React.FC<WatchConfiguratorProps> = ({ initialWatch }) => {
  const { addToCart } = useCart();

  // Selected base watch
  const [baseWatch, setBaseWatch] = useState<WatchItem | null>(initialWatch || null);
  const [availableWatches, setAvailableWatches] = useState<WatchItem[]>([]);
  const [viewMode, setViewMode] = useState<'front' | 'caseback'>('front');

  // Customizer state
  const [caseMaterial, setCaseMaterial] = useState<CaseMaterial>(initialWatch?.caseMaterial || 'Stainless Steel');
  const [caseDiameterMm, setCaseDiameterMm] = useState<number>(initialWatch?.caseDiameterMm || 40);
  const [bezel, setBezel] = useState<BezelType>('Smooth Polished');
  const [dialColor, setDialColor] = useState<DialColor>(initialWatch?.dialColor || 'Midnight Obsidian');
  const [hands, setHands] = useState<HandsStyle>('Dauphine');
  const [strap, setStrap] = useState<StrapMaterial>(initialWatch?.strapMaterial || 'Horween Calfskin');
  const [movement, setMovement] = useState<MovementType>(initialWatch?.movement || 'Automatic');
  const [engraving, setEngraving] = useState<string>('');

  // Active step tab
  const [activeTab, setActiveTab] = useState<'case' | 'bezel' | 'dial' | 'hands' | 'strap' | 'movement' | 'engraving'>('case');

  // Server-side price calculation state
  const [priceBreakdown, setPriceBreakdown] = useState<TransparentPriceBreakdown | null>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Load catalog if initial watch not provided
  useEffect(() => {
    const loadWatches = async () => {
      try {
        const list = await api.getCatalog();
        setAvailableWatches(list);
        if (!baseWatch && list.length > 0) {
          setBaseWatch(list[0]);
          setCaseMaterial(list[0].caseMaterial);
          setDialColor(list[0].dialColor);
          setMovement(list[0].movement);
          setCaseDiameterMm(list[0].caseDiameterMm);
        }
      } catch (err) {
        console.error('Failed to load watches for customizer:', err);
      }
    };
    loadWatches();
  }, []);

  // Recalculate price on the server when configuration changes (SWEBOK v4 Ch. 03 & 13)
  useEffect(() => {
    if (!baseWatch) return;

    const recalculatePrice = async () => {
      try {
        setCalculatingPrice(true);
        const config: CustomizerSelection = {
          baseWatchId: baseWatch.id,
          caseMaterial,
          caseDiameterMm,
          bezel,
          dialColor,
          hands,
          strap,
          movement,
          engraving: engraving.trim() || undefined,
        };

        const res = await api.calculateCustomizerPrice({
          baseWatchId: baseWatch.id,
          customConfig: config,
          quantity: 1,
        });

        setPriceBreakdown(res.breakdown);
      } catch (err) {
        console.error('Server pricing calculation error:', err);
      } finally {
        setCalculatingPrice(false);
      }
    };

    const timer = setTimeout(recalculatePrice, 150);
    return () => clearTimeout(timer);
  }, [baseWatch, caseMaterial, caseDiameterMm, bezel, dialColor, hands, strap, movement, engraving]);

  const handleAddToCart = async () => {
    if (!baseWatch) return;
    try {
      setAddingToCart(true);
      const config: CustomizerSelection = {
        baseWatchId: baseWatch.id,
        caseMaterial,
        caseDiameterMm,
        bezel,
        dialColor,
        hands,
        strap,
        movement,
        engraving: engraving.trim() || undefined,
      };

      await addToCart({
        watchId: baseWatch.id,
        isCustom: true,
        customConfig: config,
        quantity: 1,
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleReset = () => {
    if (baseWatch) {
      setCaseMaterial(baseWatch.caseMaterial);
      setCaseDiameterMm(baseWatch.caseDiameterMm);
      setBezel('Smooth Polished');
      setDialColor(baseWatch.dialColor);
      setHands('Dauphine');
      setStrap(baseWatch.strapMaterial);
      setMovement(baseWatch.movement);
      setEngraving('');
    }
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-luxury-800 pb-6 mb-8 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-luxury-gold text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Atelier Horloger • Bespoke Atelier</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-100">
            Interactive Watch Configurator
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Engineer your personal luxury timepiece. Every component modification is verified by our server-side pricing engine in real time.
          </p>
        </div>

        {/* Base Watch Selector */}
        <div className="flex items-center space-x-3">
          <label className="text-xs uppercase tracking-wider text-slate-400 font-medium">Base Model:</label>
          <select
            value={baseWatch?.id || ''}
            onChange={(e) => {
              const selected = availableWatches.find((w) => w.id === e.target.value);
              if (selected) {
                setBaseWatch(selected);
                setCaseMaterial(selected.caseMaterial);
                setDialColor(selected.dialColor);
                setMovement(selected.movement);
              }
            }}
            className="bg-luxury-900 border border-luxury-800 focus:border-luxury-gold rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            {availableWatches.map((w) => (
              <option key={w.id} value={w.id}>
                {w.brand} - {w.name} ({formatCurrencyCents(w.basePriceInCents)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Configurator Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Watch Visualizer */}
        <div className="lg:col-span-6 bg-luxury-900/60 border border-luxury-800 rounded-2xl p-6 flex flex-col items-center justify-between relative shadow-2xl min-h-[550px]">
          {/* Top Controls: View Angle Toggle */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="flex bg-luxury-950 p-1 rounded-lg border border-luxury-800">
              <button
                onClick={() => setViewMode('front')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                  viewMode === 'front' ? 'bg-luxury-gold text-luxury-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Dial Front</span>
              </button>
              <button
                onClick={() => setViewMode('caseback')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                  viewMode === 'caseback' ? 'bg-luxury-gold text-luxury-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Caseback Exhibition</span>
              </button>
            </div>

            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-luxury-gold transition-colors flex items-center space-x-1"
              title="Reset to Base Model"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Real-Time Live Watch Renderer */}
          <div className="my-auto py-4">
            <WatchRenderer
              caseMaterial={caseMaterial}
              caseDiameterMm={caseDiameterMm}
              bezel={bezel}
              dialColor={dialColor}
              hands={hands}
              strap={strap}
              movement={movement}
              engraving={engraving}
              viewMode={viewMode}
              size={380}
            />
          </div>

          {/* Visual Indicator Footer */}
          <div className="w-full text-center border-t border-luxury-800/80 pt-4 flex items-center justify-between text-xs text-slate-400">
            <span>{caseDiameterMm}mm • {caseMaterial}</span>
            <span className="text-luxury-gold font-medium">{viewMode === 'front' ? `${dialColor} Dial` : 'Sapphire Exhibition'}</span>
            <span>{movement} Calibre</span>
          </div>
        </div>

        {/* Right Column: Customization Controls & Transparent Pricing */}
        <div className="lg:col-span-6 space-y-6">
          {/* Navigation Category Tabs */}
          <div className="flex border-b border-luxury-800 overflow-x-auto pb-1 gap-2 text-xs">
            {[
              { id: 'case', label: 'Case & Metal' },
              { id: 'bezel', label: 'Bezel Ring' },
              { id: 'dial', label: 'Dial Finish' },
              { id: 'hands', label: 'Hands' },
              { id: 'strap', label: 'Strap / Bracelet' },
              { id: 'movement', label: 'Movement' },
              { id: 'engraving', label: 'Engraving' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 whitespace-nowrap font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'text-luxury-gold border-b-2 border-luxury-gold bg-luxury-900/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Tab Configuration Panel */}
          <div className="bg-luxury-900/90 border border-luxury-800 rounded-xl p-5 shadow-xl min-h-[220px]">
            {/* 1. Case Material & Diameter */}
            {activeTab === 'case' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-2">
                    Case Alloy & Metallurgy
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { name: 'Stainless Steel', desc: 'Oystergrade 904L', price: 0 },
                      { name: 'Titanium', desc: 'Grade 5 Aerospace', price: 45000 },
                      { name: 'Ceramic', desc: 'High-Tech Scratchproof', price: 65000 },
                      { name: 'Yellow Gold', desc: '18K Royal Yellow', price: 180000 },
                      { name: 'Rose Gold', desc: '18K Sedna Rose Gold', price: 195000 },
                    ].map((item) => (
                      <button
                        key={item.name}
                        onClick={() => setCaseMaterial(item.name as CaseMaterial)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          caseMaterial === item.name
                            ? 'border-luxury-gold bg-luxury-gold/10'
                            : 'border-luxury-800 hover:border-slate-600 bg-luxury-950'
                        }`}
                      >
                        <p className="text-xs font-semibold text-slate-100">{item.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                        <p className="text-[11px] font-mono text-luxury-gold mt-1.5 font-bold">
                          {item.price === 0 ? 'Included' : `+${formatCurrencyCents(item.price)}`}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-luxury-800">
                  <h4 className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-2">
                    Case Diameter: {caseDiameterMm} mm
                  </h4>
                  <div className="flex gap-2">
                    {[38, 39, 40, 41, 42, 44].map((mm) => (
                      <button
                        key={mm}
                        onClick={() => setCaseDiameterMm(mm)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${
                          caseDiameterMm === mm
                            ? 'border-luxury-gold bg-luxury-gold text-luxury-950'
                            : 'border-luxury-800 bg-luxury-950 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {mm} mm
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Bezel Ring */}
            {activeTab === 'bezel' && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-2">
                  Bezel Architecture
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Smooth Polished', desc: 'Mirror finish bevelled ring', price: 0 },
                    { name: 'Ceramic Tachymeter', desc: 'Engraved speed measurement scale', price: 25000 },
                    { name: 'Diver 60-Min Unidirectional', desc: 'Tactile dive timer bezel', price: 30000 },
                    { name: 'Fluted Luxury', desc: 'Precision fluted reflective facets', price: 40000 },
                  ].map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setBezel(item.name as BezelType)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        bezel === item.name
                          ? 'border-luxury-gold bg-luxury-gold/10'
                          : 'border-luxury-800 hover:border-slate-600 bg-luxury-950'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-100">{item.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                      <p className="text-[11px] font-mono text-luxury-gold mt-1 font-bold">
                        {item.price === 0 ? 'Included' : `+${formatCurrencyCents(item.price)}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Dial Colors & Guilloche */}
            {activeTab === 'dial' && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-2">
                  Dial Color & Texture
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { name: 'Midnight Obsidian', desc: 'Deep jet black lacquer', price: 0 },
                    { name: 'Silver Guilloche', desc: 'Clous de Paris engraving', price: 15000 },
                    { name: 'Sunburst Royal Blue', desc: 'Vibrant brushed metallic', price: 20000 },
                    { name: 'Emerald Forest', desc: 'Deep green sunray finish', price: 25000 },
                    { name: 'Champagne Gold', desc: 'Warm golden shimmer', price: 35000 },
                    { name: 'Skeleton Open-Heart', desc: 'Aperture showing balance wheel', price: 85000 },
                  ].map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setDialColor(item.name as DialColor)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        dialColor === item.name
                          ? 'border-luxury-gold bg-luxury-gold/10'
                          : 'border-luxury-800 hover:border-slate-600 bg-luxury-950'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-100">{item.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                      <p className="text-[11px] font-mono text-luxury-gold mt-1 font-bold">
                        {item.price === 0 ? 'Included' : `+${formatCurrencyCents(item.price)}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Hands Style */}
            {activeTab === 'hands' && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-2">
                  Hands Horology Style
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Baton Luminous', desc: 'Super-LumiNova filled markers', price: 0 },
                    { name: 'Dauphine', desc: 'Facet-polished triangular hands', price: 10000 },
                    { name: 'Blued Steel Leaf', desc: 'Thermally treated cobalt steel', price: 18000 },
                    { name: 'Breguet Classic', desc: 'Hollow eccentric moon tips', price: 25000 },
                  ].map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setHands(item.name as HandsStyle)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        hands === item.name
                          ? 'border-luxury-gold bg-luxury-gold/10'
                          : 'border-luxury-800 hover:border-slate-600 bg-luxury-950'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-100">{item.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                      <p className="text-[11px] font-mono text-luxury-gold mt-1 font-bold">
                        {item.price === 0 ? 'Included' : `+${formatCurrencyCents(item.price)}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Strap Selection */}
            {activeTab === 'strap' && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-2">
                  Strap & Bracelet Material
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { name: 'Horween Calfskin', desc: 'Supple full-grain leather', price: 0 },
                    { name: 'Vulcanized Rubber', desc: 'Waterproof sports strap', price: 8000 },
                    { name: 'Milanese Mesh', desc: 'Woven steel magnetic clasp', price: 16000 },
                    { name: 'Stainless Steel Oyster', desc: 'Solid links with foldover clasp', price: 28000 },
                    { name: 'Alligator Leather', desc: 'Hand-stitched genuine grain', price: 38000 },
                  ].map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setStrap(item.name as StrapMaterial)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        strap === item.name
                          ? 'border-luxury-gold bg-luxury-gold/10'
                          : 'border-luxury-800 hover:border-slate-600 bg-luxury-950'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-100">{item.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                      <p className="text-[11px] font-mono text-luxury-gold mt-1 font-bold">
                        {item.price === 0 ? 'Included' : `+${formatCurrencyCents(item.price)}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Movement Calibre */}
            {activeTab === 'movement' && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-2">
                  Mechanical Movement Calibre
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Precision Quartz', desc: 'High accuracy +/- 10s/year', price: 0 },
                    { name: 'Manual', desc: 'Traditional hand-wound mechanical', price: 35000 },
                    { name: 'Automatic', desc: 'Self-winding rotor chronometer', price: 45000 },
                    { name: 'Tourbillon', desc: 'Gravitational compensation cage', price: 350000 },
                  ].map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setMovement(item.name as MovementType)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        movement === item.name
                          ? 'border-luxury-gold bg-luxury-gold/10'
                          : 'border-luxury-800 hover:border-slate-600 bg-luxury-950'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-100">{item.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                      <p className="text-[11px] font-mono text-luxury-gold mt-1 font-bold">
                        {item.price === 0 ? 'Included' : `+${formatCurrencyCents(item.price)}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Caseback Engraving */}
            {activeTab === 'engraving' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1">
                    Custom Caseback Inscription (+{formatCurrencyCents(5000)})
                  </h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Personalize your timepiece with up to 25 characters engraved upon the sapphire or steel exhibition caseback.
                  </p>
                  <input
                    type="text"
                    maxLength={25}
                    value={engraving}
                    onChange={(e) => setEngraving(e.target.value)}
                    placeholder="e.g., VANCE 2026 - GENEVA"
                    className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-600 font-serif tracking-wider uppercase focus:outline-none"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1.5">
                    <span>Allowed: letters, numbers, hyphens</span>
                    <span>{engraving.length} / 25 chars</span>
                  </div>
                </div>

                <div className="bg-luxury-950 p-3 rounded-lg border border-luxury-800/80 flex items-center space-x-2 text-xs text-slate-300">
                  <Info className="w-4 h-4 text-luxury-gold shrink-0" />
                  <span>Switch to "Caseback Exhibition" view on the left to inspect live text rendering!</span>
                </div>
              </div>
            )}
          </div>

          {/* Transparent Price Breakdown (SWEBOK v4 Ch. 14: No Dark Patterns) */}
          <div className="bg-luxury-900 border border-luxury-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-luxury-800 pb-3">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-200">
                Transparent Financial Breakdown
              </span>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>Server-Side Recalculated</span>
              </span>
            </div>

            {priceBreakdown ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Base Model ({baseWatch?.name})</span>
                  <span className="font-mono">{formatCurrencyCents(priceBreakdown.baseTotalInCents)}</span>
                </div>

                {priceBreakdown.customizationAddonsInCents > 0 && (
                  <div className="flex justify-between text-luxury-gold">
                    <span>Selected Bespoke Add-ons</span>
                    <span className="font-mono">+{formatCurrencyCents(priceBreakdown.customizationAddonsInCents)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400">
                  <span>Estimated Tax ({priceBreakdown.taxRatePercent}%)</span>
                  <span className="font-mono">{formatCurrencyCents(priceBreakdown.taxInCents)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Insured Courier Shipping</span>
                  <span className="font-mono">
                    {priceBreakdown.isFreeShipping ? 'Complimentary ($0.00)' : formatCurrencyCents(priceBreakdown.shippingInCents)}
                  </span>
                </div>

                <div className="pt-3 border-t border-luxury-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                    Total Estimated Investment
                  </span>
                  <span className="font-mono text-2xl font-bold text-slate-100">
                    {formatCurrencyCents(priceBreakdown.finalTotalInCents)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500">Recalculating canonical total...</div>
            )}

            {/* Action Buttons */}
            <button
              disabled={addingToCart || calculatingPrice}
              onClick={handleAddToCart}
              className="w-full py-4 bg-gradient-to-r from-luxury-gold to-luxury-goldDark text-luxury-950 font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg hover:shadow-luxury-gold/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{addingToCart ? 'Allocating Bespoke Piece...' : 'Add Bespoke Watch to Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

