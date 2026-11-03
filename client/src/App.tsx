import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { CartProvider } from './context/CartContext.js';
import { Navbar } from './components/Navbar.js';
import { Hero } from './components/Hero.js';
import { WatchCatalog } from './components/WatchCatalog.js';
import { WatchConfigurator } from './components/WatchConfigurator.js';
import { WatchDetailModal } from './components/WatchDetailModal.js';
import { CartDrawer } from './components/CartDrawer.js';
import { CheckoutModal } from './components/CheckoutModal.js';
import { AuthModal } from './components/AuthModal.js';
import { AccountDashboard } from './components/AccountDashboard.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { GdprConsentBanner } from './components/GdprConsentBanner.js';
import { SwebokComplianceModal } from './components/SwebokComplianceModal.js';
import { Footer } from './components/Footer.js';
import { WatchItem, Order } from '../../shared/types.js';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'catalog' | 'configurator' | 'account' | 'admin'>('home');

  // Modals state
  const [detailWatch, setDetailWatch] = useState<WatchItem | null>(null);
  const [customizerBaseWatch, setCustomizerBaseWatch] = useState<WatchItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSwebokOpen, setIsSwebokOpen] = useState(false);

  const handleStartCustomizing = (watch?: WatchItem) => {
    if (watch) {
      setCustomizerBaseWatch(watch);
    }
    setCurrentView('configurator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = (watch: WatchItem) => {
    setDetailWatch(watch);
  };

  const handleOrderSuccess = (_order: Order) => {
    // Keep checkout modal open on success screen; user closes when ready
  };

  return (
    <div className="min-h-screen bg-luxury-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenSwebokModal={() => setIsSwebokOpen(true)}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentView={currentView}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'home' && (
          <>
            <Hero
              onExplore={() => {
                setCurrentView('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onCustomize={() => handleStartCustomizing()}
              onOpenCompliance={() => setIsSwebokOpen(true)}
            />
            <WatchCatalog
              onCustomize={handleStartCustomizing}
              onViewDetails={handleViewDetails}
            />
          </>
        )}

        {currentView === 'catalog' && (
          <div className="pt-6">
            <WatchCatalog
              onCustomize={handleStartCustomizing}
              onViewDetails={handleViewDetails}
            />
          </div>
        )}

        {currentView === 'configurator' && (
          <WatchConfigurator
            initialWatch={customizerBaseWatch}
            onExit={() => setCurrentView('catalog')}
          />
        )}

        {currentView === 'account' && (
          <AccountDashboard
            onBackToShopping={() => setCurrentView('catalog')}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            onBackToShopping={() => setCurrentView('catalog')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenSwebokModal={() => setIsSwebokOpen(true)}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Modals & Overlays */}
      <WatchDetailModal
        watch={detailWatch}
        onClose={() => setDetailWatch(null)}
        onCustomize={handleStartCustomizing}
      />

      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      <AuthModal />

      <SwebokComplianceModal
        isOpen={isSwebokOpen}
        onClose={() => setIsSwebokOpen(false)}
      />

      <GdprConsentBanner />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
};
export default App;
