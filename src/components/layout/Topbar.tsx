'use client';

import React, { useEffect } from 'react';
import { useTerminalStore } from '../../store/terminalStore';
import { useExchangeStore } from '../../store/exchangeStore';
import { useWebhookStore } from '../../store/webhookStore';
import { useTelegramStore } from '../../store/telegramStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { api } from '../../services/api';
import { AlphxLogo } from '../ui/AlphxLogo';
import {
  Activity,
  Zap,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Layers,
  Radio,
  Send,
} from 'lucide-react';

export const Topbar: React.FC = () => {
  const {
    activeSymbol,
    activeTradingMode,
    setActiveTradingMode,
    analysis,
    soundEnabled,
    setSoundEnabled,
    autoTradeEnabled,
    setAutoTradeEnabled,
  } = useTerminalStore();

  const { latestPrice } = useWebSocket();

  const {
    isConnected,
    isDemo,
    setIsDemo,
    userName,
    balances,
    setIsConnected,
    setUserName,
    setBalances,
    setIsConnectModalOpen,
  } = useExchangeStore();

  const { setIsWebhookModalOpen } = useWebhookStore();
  const { setIsConfigModalOpen: setIsTelegramModalOpen, autoBroadcast: telegramAutoBroadcast } = useTelegramStore();

  // Load balances if connected
  useEffect(() => {
    const checkExchangeStatus = async () => {
      try {
        const status = await api.getExchangeStatus();
        if (status.authenticated) {
          setIsConnected(true);
          if (status.is_demo !== undefined) {
            setIsDemo(status.is_demo);
          }
          if (status.user_name) setUserName(status.user_name);
          try {
            const bal = await api.getBalances();
            if (bal && bal.length > 0) {
              setBalances(bal);
            }
          } catch {}
        } else {
          setIsConnected(false);
          setIsDemo(false);
        }
      } catch {
        setIsConnected(false);
        setIsDemo(false);
      }
    };
    checkExchangeStatus();
  }, [setIsConnected, setIsDemo, setUserName, setBalances]);

  const usdtBalance = balances.find(
    (b) => b.currency.toUpperCase() === 'USDT'
  );
  const inrBalance = balances.find(
    (b) => b.currency.toUpperCase() === 'INR'
  );

  const inrRate = analysis?.inr_rate || 99.95;
  const usdtAvail = usdtBalance?.available ?? 0;
  const inrAvail = inrBalance?.available ?? 0;
  const totalUsd = (usdtAvail > 0 || inrAvail > 0) ? usdtAvail + (inrAvail / inrRate) : 0;
  const totalInr = (usdtAvail * inrRate) + inrAvail;

  const currentPrice = latestPrice || analysis?.current_price || 0;
  const currentPriceInr = analysis?.current_price_inr || (currentPrice * inrRate);
  const isBullish = analysis?.signal.direction === 'BUY';
  const isBearish = analysis?.signal.direction === 'SELL';

  return (
    <header className="h-14 border-b border-border bg-surface/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Market Pair */}
      <div className="flex items-center space-x-4">
        <AlphxLogo size="md" />

        <div className="h-5 w-px bg-border mx-1" />

        {/* Pair Ticker & Current Price */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold tracking-wider text-slate-200">
            {activeSymbol.replace('B-', '').replace('_', '/')}
          </span>

          {currentPrice > 0 && (
            <div className="flex items-center space-x-2 num-mono">
              <span className="text-base font-bold text-white">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: currentPrice < 1 ? 4 : 2, maximumFractionDigits: currentPrice < 1 ? 4 : 2 })}
              </span>
              <span className="text-xs text-emerald-400 font-mono hidden xl:inline">
                (₹{currentPriceInr.toLocaleString('en-IN', { maximumFractionDigits: currentPriceInr < 1 ? 4 : 2 })})
              </span>
              {analysis?.funding_rate !== undefined && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded flex items-center space-x-1 ${
                    analysis.funding_rate >= 0
                      ? 'bg-bull/10 text-bull'
                      : 'bg-bear/10 text-bear'
                  }`}
                  title="Funding Rate"
                >
                  <span>FR: {(analysis.funding_rate * 100).toFixed(4)}%</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center: Trading Mode Selector */}
      <div className="hidden md:flex items-center bg-background/80 p-1 rounded-lg border border-border">
        {(['futures', 'margin', 'spot'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setActiveTradingMode(mode)}
            className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTradingMode === mode
                ? 'bg-surface-elevated text-white shadow-sm border border-border'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Right: Exchange Status & Quick Telemetry */}
      <div className="flex items-center space-x-3">
        {/* Balances Pill */}
        {isConnected && (
          <div className="hidden sm:flex items-center space-x-2 bg-surface-elevated px-3 py-1 rounded-lg border border-border text-xs num-mono">
            <span className="text-slate-400">Balance:</span>
            <span className="text-emerald-400 font-semibold">
              ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-slate-400 text-[11px]">
              (₹{totalInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
            </span>
            {isDemo && (
              <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/25 text-purple-300 border border-purple-500/40">
                DEMO
              </span>
            )}
          </div>
        )}

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-lg border text-xs transition-colors ${
            soundEnabled
              ? 'border-border bg-surface hover:bg-surface-elevated text-slate-300'
              : 'border-border/50 bg-background text-slate-500'
          }`}
          title={soundEnabled ? 'Audio alerts ON' : 'Audio alerts OFF'}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        {/* Webhooks Manager */}
        <button
          onClick={() => setIsWebhookModalOpen(true)}
          className="px-2.5 py-1 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-xs font-medium text-slate-300 hover:text-white flex items-center space-x-1.5 transition-all shadow-sm"
          title="TradingView & CoinDCX Webhooks"
        >
          <Radio className="h-3.5 w-3.5 text-tech-blue" />
          <span className="hidden sm:inline">Webhooks</span>
        </button>

        {/* Telegram Manager */}
        <button
          onClick={() => setIsTelegramModalOpen(true)}
          className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm ${
            telegramAutoBroadcast
              ? 'bg-[#229ED9]/20 border-[#229ED9]/50 text-[#229ED9] glow-ai'
              : 'border-border bg-surface hover:bg-surface-elevated text-slate-300 hover:text-white'
          }`}
          title="Telegram Signal Automation & Channel Settings"
        >
          <Send className="h-3.5 w-3.5 text-[#229ED9]" />
          <span className="hidden sm:inline">
            {telegramAutoBroadcast ? 'Telegram (Auto)' : 'Telegram'}
          </span>
        </button>

        {/* Quick Demo Button if not connected */}
        {!isConnected && (
          <button
            onClick={async () => {
              try {
                const res = await api.connectExchange('demo', 'demo');
                if (res.status === 'connected') {
                  setIsConnected(true);
                  setIsDemo(true);
                  setUserName(res.user_name || 'Demo Trader');
                  const bal = await api.getBalances();
                  setBalances(bal);
                }
              } catch {}
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-elevated hover:bg-surface border border-ai/40 text-ai-light hover:text-white transition-all flex items-center space-x-1.5 shadow-sm"
            title="Launch Interactive Demo Account with $10,000 USDT Virtual Balance"
          >
            <span>🧪 Demo Account</span>
          </button>
        )}

        {/* Exchange Connector Button */}
        <button
          onClick={() => setIsConnectModalOpen(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
            isConnected
              ? isDemo
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-tech-blue text-white hover:bg-tech-blue/90 shadow-md shadow-tech-blue/20'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isConnected ? (isDemo ? 'bg-purple-400 animate-pulse' : 'bg-emerald-400 animate-pulse') : 'bg-white'}`} />
          <span>{isConnected ? (isDemo ? 'Demo Account ($10k)' : `CoinDCX (${userName || 'Active'})`) : 'Connect CoinDCX'}</span>
        </button>
      </div>
    </header>
  );
};
