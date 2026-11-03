import React from 'react';
import { ArrowRight, Sliders, Shield, Award, Sparkles, Lock } from 'lucide-react';

interface HeroProps {
  onExplore: () => void;
  onCustomize: () => void;
  onOpenCompliance: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore, onCustomize, onOpenCompliance }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-luxury-950 via-luxury-900 to-luxury-950 pt-12 pb-24 border-b border-luxury-800/60">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-luxury-gold/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-luxury-sapphire/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bespoke Swiss Chronometry & Architecture</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-100 tracking-tight leading-[1.15]">
              Precision Engineering. <br />
              <span className="gold-gradient-text">Eternal Distinction.</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed font-light">
              Crafted in Genève to exacting chronometric standards and built upon <strong className="text-slate-100 font-medium">IEEE SWEBOK v4</strong> engineering discipline. Configure bespoke timepieces in real time with server-verified pricing, zero dark patterns, and end-to-end transaction integrity.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onCustomize}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-luxury-gold to-luxury-goldDark text-luxury-950 font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg hover:shadow-luxury-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <Sliders className="w-4 h-4" />
                <span>Launch Bespoke Customizer</span>
              </button>

              <button
                onClick={onExplore}
                className="w-full sm:w-auto px-8 py-4 bg-luxury-900 hover:bg-luxury-850 text-slate-200 hover:text-white border border-luxury-700/80 hover:border-luxury-gold/60 font-semibold uppercase tracking-wider text-xs rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <span>Browse Collection</span>
                <ArrowRight className="w-4 h-4 text-luxury-gold" />
              </button>
            </div>

            {/* SWEBOK v4 Security Trust Indicators */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-luxury-800/80">
              <div
                onClick={onOpenCompliance}
                className="cursor-pointer group flex items-center space-x-2.5 p-2 rounded-lg hover:bg-luxury-900 transition-colors"
              >
                <Shield className="w-5 h-5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-200">SWEBOK v4</p>
                  <p className="text-[10px] text-slate-400">IEEE Standards</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-2">
                <Lock className="w-5 h-5 text-luxury-gold shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-200">PCI-DSS Tokenized</p>
                  <p className="text-[10px] text-slate-400">Zero Raw Card Risk</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-2">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-200">No Dark Patterns</p>
                  <p className="text-[10px] text-slate-400">Ethical SWEBOK Ch. 14</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-2">
                <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-200">5-Year Warranty</p>
                  <p className="text-[10px] text-slate-400">COSC Chronometer</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Featured Luxury Showcase Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md bg-gradient-to-b from-luxury-900 to-luxury-950 p-6 rounded-2xl border border-luxury-800 shadow-2xl overflow-hidden group">
              <div className="absolute top-4 right-4 z-20">
                <span className="px-3 py-1 bg-luxury-gold text-luxury-950 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Flagship Calibre
                </span>
              </div>

              {/* Watch Display Image */}
              <div className="relative h-72 sm:h-80 w-full overflow-hidden rounded-xl bg-luxury-950/80 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"
                  alt="Aegis Deep Diver 300M"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-950 via-transparent to-transparent opacity-80" />
              </div>

              <div className="pt-5 space-y-2 text-left">
                <div className="flex justify-between items-baseline">
                  <p className="text-xs uppercase tracking-widest text-luxury-gold font-semibold">
                    Maritime Professional
                  </p>
                  <span className="text-xs text-emerald-400 font-medium">● In Stock (18 units)</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-slate-100">
                  Aegis Deep Diver 300M
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  Surgical oyster steel case, ceramic diver bezel, 70-hour chronometer automatic movement.
                </p>
                <div className="pt-3 flex items-center justify-between border-t border-luxury-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Base Price</span>
                    <span className="font-mono text-xl font-bold text-slate-100">$1,450.00</span>
                  </div>
                  <button
                    onClick={onCustomize}
                    className="px-4 py-2 bg-luxury-800 hover:bg-luxury-gold hover:text-luxury-950 text-luxury-gold text-xs uppercase font-bold tracking-wider rounded-lg transition-colors"
                  >
                    Customize
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
