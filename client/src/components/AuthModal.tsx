import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, authModalMode, setAuthModalMode, login, register } = useAuth();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMessage('');

      if (authModalMode === 'login') {
        await login(email, password);
      } else {
        await register(email, fullName, password);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (type: 'admin' | 'customer') => {
    if (type === 'admin') {
      setEmail('admin@wristwatch.luxury');
      setPassword('AdminPass123!');
      setAuthModalMode('login');
    } else {
      setEmail('collector@wristwatch.luxury');
      setPassword('CustomerPass123!');
      setAuthModalMode('login');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-luxury-900 border border-luxury-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-luxury-800 flex items-center justify-between bg-luxury-950">
          <div>
            <h3 className="font-serif text-xl font-bold text-slate-100">
              {authModalMode === 'login' ? 'Collector Sign In' : 'Join Aethel & Kronos'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Secure RBAC Authentication (IEEE SWEBOK v4)
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-luxury-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick-Fill Demo Pills */}
        <div className="bg-luxury-950/70 px-6 py-2.5 border-b border-luxury-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Quick Demo Accounts:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => handleQuickFill('admin')}
              className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold hover:bg-amber-500/30 transition-colors"
            >
              Admin Hub
            </button>
            <button
              onClick={() => handleQuickFill('customer')}
              className="px-2 py-0.5 rounded bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 font-semibold hover:bg-luxury-gold/30 transition-colors"
            >
              Collector
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-950/70 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {authModalMode === 'register' && (
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Alexander Vance"
                  className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@wristwatch.luxury"
                className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-luxury-950 border border-luxury-800 focus:border-luxury-gold rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none"
              />
            </div>
            {authModalMode === 'register' && (
              <span className="text-[10px] text-slate-500 mt-1 block">
                Must include 8+ chars, 1 uppercase letter, 1 lowercase letter, 1 number.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-luxury-gold to-luxury-goldDark text-luxury-950 font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg hover:shadow-luxury-gold/20 hover:scale-[1.01] transition-all flex items-center justify-center space-x-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {loading
                ? 'Authenticating...'
                : authModalMode === 'login'
                ? 'Sign In to Account'
                : 'Create Collector Account'}
            </span>
          </button>

          {/* Toggle Login / Register */}
          <div className="text-center pt-2">
            {authModalMode === 'login' ? (
              <p className="text-xs text-slate-400">
                New to Aethel & Kronos?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalMode('register')}
                  className="text-luxury-gold hover:underline font-semibold"
                >
                  Create an Account
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalMode('login')}
                  className="text-luxury-gold hover:underline font-semibold"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

