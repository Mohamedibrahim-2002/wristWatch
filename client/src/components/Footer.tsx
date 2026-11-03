import React from 'react';
import { ShieldCheck, Compass, Lock, Award, Heart } from 'lucide-react';

interface FooterProps {
  onOpenSwebokModal: () => void;
  onNavigate: (view: 'home' | 'catalog' | 'configurator' | 'account' | 'admin') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSwebokModal, onNavigate }) => {
  return (
    <footer className="bg-luxury-950 border-t border-luxury-800 text-slate-400 text-xs">
      {/* Upper Footer: Horology Values */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-luxury-900 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <span className="font-serif text-lg font-bold text-slate-100 tracking-wider block mb-2">
            AETHEL & KRONOS
          </span>
          <p className="text-[11px] text-slate-400 font-light leading-relaxed">
            Founded in Geneva, Switzerland. Dedicated to the preservation of high mechanical watchmaking, artisan enameling, and mathematical chronometric precision.
          </p>
          <div className="mt-4 flex items-center space-x-2 text-[10px] text-luxury-gold uppercase tracking-widest font-semibold">
            <span>Atelier Horloger • Genève</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wider text-slate-200 font-bold mb-3">
            Haute Horlogerie
          </h4>
          <ul className="space-y-2 text-[11px]">
            <li>
              <button onClick={() => onNavigate('catalog')} className="hover:text-luxury-gold transition-colors">
                The Masterpiece Collection
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('configurator')} className="hover:text-luxury-gold transition-colors">
                Bespoke 2D Watch Studio
              </button>
            </li>
            <li>
              <span className="hover:text-luxury-gold transition-colors cursor-pointer">
                COSC Chronometer Testing
              </span>
            </li>
            <li>
              <span className="hover:text-luxury-gold transition-colors cursor-pointer">
                Exhibition Caseback Service
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wider text-slate-200 font-bold mb-3">
            SWEBOK v4 Engineering
          </h4>
          <ul className="space-y-2 text-[11px]">
            <li>
              <button onClick={onOpenSwebokModal} className="text-emerald-400 hover:underline flex items-center space-x-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Security Audit & Compliance</span>
              </button>
            </li>
            <li>
              <span className="text-slate-400">Integer Cents Currency Precision</span>
            </li>
            <li>
              <span className="text-slate-400">PCI-DSS Tokenized Payment Abstraction</span>
            </li>
            <li>
              <span className="text-slate-400">GDPR Art. 17/20 Data Portability</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wider text-slate-200 font-bold mb-3">
            Client Concierge
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Private consultations, bespoke engraving commissions, and insured global courier delivery.
          </p>
          <p className="text-[11px] text-slate-200 mt-2 font-mono">
            concierge@aethel-kronos.luxury
          </p>
        </div>
      </div>

      {/* Lower Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
        <p className="text-slate-500">
          &copy; {new Date().getFullYear()} Aethel & Kronos Genève. Engineered in compliance with IEEE SWEBOK v4 standards.
        </p>

        <div className="flex items-center space-x-6 text-slate-500">
          <button onClick={onOpenSwebokModal} className="hover:text-slate-300">
            SWEBOK v4 Verification
          </button>
          <span>•</span>
          <button onClick={() => onNavigate('account')} className="hover:text-slate-300">
            Privacy Preferences
          </button>
          <span>•</span>
          <button onClick={() => onNavigate('admin')} className="hover:text-amber-400">
            Admin Portal
          </button>
        </div>
      </div>
    </footer>
  );
};

