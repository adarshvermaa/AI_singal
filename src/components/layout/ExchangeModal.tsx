'use client';

import React, { useState } from 'react';
import { useExchangeStore } from '../../store/exchangeStore';
import { api } from '../../services/api';
import { X, Key, ShieldCheck, ExternalLink, Loader2 } from 'lucide-react';

export const ExchangeModal: React.FC = () => {
  const {
    isConnectModalOpen,
    setIsConnectModalOpen,
    isConnected,
    isDemo,
    setIsConnected,
    setIsDemo,
    setUserName,
    setBalances,
  } = useExchangeStore();

  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isConnectModalOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.connectExchange(apiKey.trim(), apiSecret.trim());
      if (res.status === 'connected') {
        setIsConnected(true);
        setIsDemo(res.is_demo || false);
        setUserName(res.user_name || 'Trader');
        setSuccess(true);
        // Refresh balances
        try {
          const bal = await api.getBalances();
          setBalances(bal);
        } catch {}
        setTimeout(() => {
          setIsConnectModalOpen(false);
          setSuccess(false);
        }, 1200);
      } else {
        setError(res.message || 'Connection failed. Please check credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to connect to CoinDCX');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectDemo = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.connectExchange('demo', 'demo');
      if (res.status === 'connected') {
        setIsConnected(true);
        setIsDemo(true);
        setUserName(res.user_name || 'Demo Trader');
        setSuccess(true);
        try {
          const bal = await api.getBalances();
          setBalances(bal);
        } catch {}
        setTimeout(() => {
          setIsConnectModalOpen(false);
          setSuccess(false);
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start demo session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl p-6 relative">
        <button
          onClick={() => setIsConnectModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md hover:bg-surface-elevated transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="h-10 w-10 rounded-lg bg-tech-blue/20 border border-tech-blue/30 flex items-center justify-center text-tech-blue">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Connect CoinDCX Account</h3>
            <p className="text-xs text-slate-400">Trade Spot, Margin & Futures via your API keys</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-bear/10 border border-bear/30 text-bear text-xs leading-relaxed space-y-1">
            <div className="font-semibold text-rose-300">
              {error}
            </div>
            {error.includes('401') && (
              <div className="text-[11px] text-slate-400 pt-1 space-y-1 border-t border-bear/20 mt-1.5">
                <p className="font-medium text-slate-300">Troubleshooting HTTP 401:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                  <li>Verify your <strong>API Secret</strong> is from CoinDCX API dashboard (not the Webhook secret).</li>
                  <li>Ensure <strong>Read</strong> and <strong>Trade</strong> permissions are enabled on CoinDCX.</li>
                  <li>Disable IP restriction or add this IP: <code className="text-ai-light">152.58.158.52</code>.</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-bull/10 border border-bull/30 text-bull text-xs flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Successfully connected!</span>
          </div>
        )}

        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              CoinDCX API Key
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 7fa982bc4e..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-tech-blue font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              CoinDCX API Secret
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••••••••••••••"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-tech-blue font-mono"
            />
          </div>

          <div className="p-3 bg-surface-elevated/50 border border-border/50 rounded-lg text-xs text-slate-400 flex items-start space-x-2">
            <ShieldCheck className="h-4 w-4 text-tech-blue mt-0.5 shrink-0" />
            <span>
              Your keys are signed with HMAC-SHA256 and never stored in any persistent database.
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <a
              href="https://coindcx.com/api-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-tech-blue hover:underline flex items-center space-x-1"
            >
              <span>Get API keys from CoinDCX</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-tech-blue to-ai text-white text-sm font-semibold hover:opacity-95 transition-opacity flex items-center justify-center space-x-2 shadow-lg shadow-tech-blue/25 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <span>Connect Live Exchange</span>
            )}
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase font-bold">Or</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <button
            type="button"
            onClick={handleConnectDemo}
            disabled={isLoading}
            className="w-full py-2 rounded-lg bg-surface-elevated hover:bg-surface border border-ai/40 text-ai-light hover:text-white text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <span>🎮 Connect Demo / Paper Account (10,000 USDT)</span>
          </button>
        </form>
      </div>
    </div>
  );
};
