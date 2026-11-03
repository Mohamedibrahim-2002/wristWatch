import React from 'react';
import { ShoppingBag, User as UserIcon, ShieldCheck, Wrench, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';

interface NavbarProps {
  onOpenSwebokModal: () => void;
  onNavigate: (view: 'home' | 'catalog' | 'configurator' | 'account' | 'admin') => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSwebokModal, onNavigate, currentView }) => {
  const { user, isAdmin, setIsAuthModalOpen } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-luxury-950/90 backdrop-blur-md border-b border-luxury-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="flex flex-col items-start text-left group cursor-pointer focus:outline-none"
          >
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-widest text-slate-100 group-hover:text-luxury-gold transition-colors">
              AETHEL & KRONOS
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-luxury-gold/90 font-medium">
              Genève • Haute Horlogerie
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => onNavigate('catalog')}
              className={`text-sm tracking-wider uppercase font-medium transition-colors ${
                currentView === 'catalog'
                  ? 'text-luxury-gold border-b-2 border-luxury-gold pb-1'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Collection
            </button>
            <button
              onClick={() => onNavigate('configurator')}
              className={`text-sm tracking-wider uppercase font-medium transition-colors flex items-center space-x-1.5 ${
                currentView === 'configurator'
                  ? 'text-luxury-gold border-b-2 border-luxury-gold pb-1'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Bespoke Customizer</span>
              <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider bg-luxury-gold/20 text-luxury-gold rounded font-bold">
                Live 2D
              </span>
            </button>
            <button
              onClick={onOpenSwebokModal}
              className="text-xs uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-full hover:bg-emerald-900/40 transition-colors flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SWEBOK v4 Certified</span>
            </button>
          </div>

          {/* User Controls & Cart */}
          <div className="hidden md:flex items-center space-x-5">
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded-md flex items-center space-x-1 transition-colors ${
                  currentView === 'admin'
                    ? 'bg-amber-500 text-black'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Admin Hub</span>
              </button>
            )}

            {user ? (
              <button
                onClick={() => onNavigate('account')}
                className={`text-xs uppercase tracking-wider flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                  currentView === 'account'
                    ? 'border-luxury-gold bg-luxury-900 text-luxury-gold'
                    : 'border-luxury-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <UserIcon className="w-4 h-4 text-luxury-gold" />
                <span className="font-medium max-w-[120px] truncate">{user.fullName}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs uppercase tracking-wider font-medium text-slate-300 hover:text-luxury-gold px-3 py-2 transition-colors flex items-center space-x-1.5"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* Shopping Cart Pill */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-luxury-900 hover:bg-luxury-850 border border-luxury-800 hover:border-luxury-gold/50 rounded-full transition-all text-slate-200 hover:text-luxury-gold"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-luxury-gold text-luxury-950 font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {itemCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-200"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-luxury-gold text-luxury-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-luxury-900 border-b border-luxury-800 px-4 pt-3 pb-6 space-y-4">
          <button
            onClick={() => {
              onNavigate('catalog');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm uppercase tracking-wider text-slate-200"
          >
            Collection
          </button>
          <button
            onClick={() => {
              onNavigate('configurator');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm uppercase tracking-wider text-luxury-gold font-medium"
          >
            Bespoke Customizer
          </button>
          <button
            onClick={() => {
              onOpenSwebokModal();
              setMobileMenuOpen(false);
            }}
            className="flex items-center space-x-2 py-2 text-xs uppercase tracking-wider text-emerald-400 font-semibold"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>SWEBOK v4 Certified</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-xs uppercase tracking-wider text-amber-400 font-semibold"
            >
              Admin Dashboard
            </button>
          )}
          {user ? (
            <button
              onClick={() => {
                onNavigate('account');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm text-slate-300"
            >
              Account ({user.fullName})
            </button>
          ) : (
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm text-slate-300"
            >
              Sign In / Register
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
