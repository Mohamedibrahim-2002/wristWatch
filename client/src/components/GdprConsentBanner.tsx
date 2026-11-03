import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';

export const GdprConsentBanner: React.FC = () => {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('wrist_gdpr_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = async () => {
    const preferences = { necessaryCookies: true, analyticsCookies: true, marketingCookies: true };
    localStorage.setItem('wrist_gdpr_consent', JSON.stringify(preferences));
    if (user) {
      try {
        await api.updateConsent(preferences);
      } catch {}
    }
    setShowBanner(false);
  };

  const handleSavePreferences = async () => {
    const preferences = { necessaryCookies: true, analyticsCookies: analytics, marketingCookies: marketing };
    localStorage.setItem('wrist_gdpr_consent', JSON.stringify(preferences));
    if (user) {
      try {
        await api.updateConsent(preferences);
      } catch {}
    }
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-luxury-950/95 border-t border-luxury-800 backdrop-blur-md text-slate-200 animate-slide-up shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3 max-w-3xl">
          <Cookie className="w-5 h-5 text-luxury-gold shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-100 flex items-center space-x-1.5">
              <span>IEEE SWEBOK v4 Ch. 14 Privacy & Cookie Governance</span>
              <span className="text-[10px] text-emerald-400 font-normal">● GDPR & CCPA Compliant</span>
            </h4>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              We respect your sovereign data privacy. We employ minimal, essential cookies for your secure shopping bag and encrypted sessions. Optional telemetry cookies require explicit consent.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="text-xs text-slate-400 hover:text-slate-200 underline font-medium px-2 py-1"
          >
            {showPreferences ? 'Hide Preferences' : 'Customize Preferences'}
          </button>

          <button
            onClick={handleSavePreferences}
            className="px-4 py-2 bg-luxury-900 hover:bg-luxury-850 text-slate-200 border border-luxury-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Save Essential Only
          </button>

          <button
            onClick={handleAcceptAll}
            className="px-5 py-2 bg-luxury-gold hover:bg-luxury-goldLight text-luxury-950 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md"
          >
            Accept All
          </button>
        </div>
      </div>

      {/* Expanded Granular Preferences Drawer */}
      {showPreferences && (
        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-luxury-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-luxury-900 p-3 rounded-lg border border-luxury-800 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-200">Strictly Necessary</span>
              <span className="text-[10px] text-emerald-400 font-bold">Always Active</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Essential for cart persistence, session encryption, and anti-CSRF token verification.
            </p>
          </div>

          <div className="bg-luxury-900 p-3 rounded-lg border border-luxury-800 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-200">Performance & Analytics</span>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="rounded border-luxury-800 text-luxury-gold focus:ring-0"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Helps us measure watch configurator responsiveness and rendering latency.
            </p>
          </div>

          <div className="bg-luxury-900 p-3 rounded-lg border border-luxury-800 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-200">Personalized Horology</span>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="rounded border-luxury-800 text-luxury-gold focus:ring-0"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Allows recommendation of matching straps and horology complications.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
