'use client';

import React, { useState } from 'react';
import { useTerminalStore } from '../../store/terminalStore';
import { useExchangeStore } from '../../store/exchangeStore';
import { useTelegramStore } from '../../store/telegramStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { api } from '../../services/api';
import {
  Send,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export const ChartActionBar: React.FC = () => {
  const {
    activeSymbol,
    activeTradingMode,
    activeTimeframe,
    analysis,
  } = useTerminalStore();

  const { isConnected, setIsConnectModalOpen } = useExchangeStore();
  const { latestPrice } = useWebSocket();

  const {
    chatId,
    autoBroadcast,
    setAutoBroadcast,
    setIsConfigModalOpen,
    isSending,
    setIsSending,
    setLastBroadcastStatus,
  } = useTelegramStore();

  const [executingSide, setExecutingSide] = useState<'buy' | 'sell' | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const cleanPair = activeSymbol.replace('B-', '').replace('_', '/');
  const currentPrice = latestPrice || analysis?.current_price || 0;
  const inrRate = analysis?.inr_rate || 99.95;
  const currentPriceInr = analysis?.current_price_inr || (currentPrice * inrRate);

  const signalDirection = analysis?.signal.direction || 'HOLD';
  const confidence = analysis?.signal.confidence || 0.70;
  const isBuySignal = signalDirection === 'BUY';
  const isSellSignal = signalDirection === 'SELL';

  // Strict mathematical level calculator for specific side
  const getLevelsForSide = (side: 'buy' | 'sell') => {
    const isLong = side === 'buy';
    let stopLoss = isLong ? currentPrice * 0.98 : currentPrice * 1.02;
    let target1 = isLong ? currentPrice * 1.025 : currentPrice * 0.975;
    let target2 = isLong ? currentPrice * 1.045 : currentPrice * 0.955;
    let target3 = isLong ? currentPrice * 1.07 : currentPrice * 0.93;

    if (analysis?.levels) {
      if (isLong) {
        if (analysis.levels.stop_loss < currentPrice) stopLoss = analysis.levels.stop_loss;
        if (analysis.levels.take_profit_1 > currentPrice) target1 = analysis.levels.take_profit_1;
        if (analysis.levels.take_profit_2 && analysis.levels.take_profit_2 > target1) target2 = analysis.levels.take_profit_2;
        if (analysis.levels.take_profit_3 && analysis.levels.take_profit_3 > target2) target3 = analysis.levels.take_profit_3;
      } else {
        if (analysis.levels.stop_loss > currentPrice) stopLoss = analysis.levels.stop_loss;
        if (analysis.levels.take_profit_1 < currentPrice) target1 = analysis.levels.take_profit_1;
        if (analysis.levels.take_profit_2 && analysis.levels.take_profit_2 < target1) target2 = analysis.levels.take_profit_2;
        if (analysis.levels.take_profit_3 && analysis.levels.take_profit_3 < target2) target3 = analysis.levels.take_profit_3;
      }
    }
    return { stopLoss, target1, target2, target3 };
  };

  // Quick Order Placement
  const handleQuickTrade = async (side: 'buy' | 'sell') => {
    if (!isConnected) {
      setIsConnectModalOpen(true);
      return;
    }

    setExecutingSide(side);
    setToastMessage(null);

    const { stopLoss, target1 } = getLevelsForSide(side);

    const effectivePrice = currentPrice > 0 ? currentPrice : (analysis?.current_price || 68500);
    try {
      const res = await api.executeTrade({
        symbol: activeSymbol,
        side,
        tradingMode: activeTradingMode,
        price: effectivePrice,
        leverage: 3.0,
        autoSize: true,
        stopLoss,
        takeProfit: target1,
      });

      if (res.status === 'executed') {
        setToastMessage({
          type: 'success',
          text: `Quick ${side.toUpperCase()} filled! Order ID: ${res.order_id || 'active'}`,
        });
      } else {
        setToastMessage({
          type: 'error',
          text: res.message || 'Order rejected by risk management.',
        });
      }
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.detail || err.message || 'Trade execution failed',
      });
    } finally {
      setExecutingSide(null);
      setTimeout(() => setToastMessage(null), 4500);
    }
  };

  // Send Signal to Telegram
  const handleSendToTelegram = async () => {
    if (!chatId) {
      // Prompt user to configure channel first
      setIsConfigModalOpen(true);
      setToastMessage({
        type: 'info',
        text: 'Please specify your Telegram Channel or Chat ID first.',
      });
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    setIsSending(true);
    setToastMessage(null);

    const effectiveDirection: 'BUY' | 'SELL' = signalDirection === 'SELL' ? 'SELL' : 'BUY';
    const { stopLoss, target1, target2, target3 } = getLevelsForSide(effectiveDirection === 'BUY' ? 'buy' : 'sell');

    try {
      const res = await api.sendTelegramSignal({
        symbol: activeSymbol,
        direction: effectiveDirection,
        price: currentPrice,
        confidence,
        sl: stopLoss,
        tp1: target1,
        tp2: target2,
        tp3: target3,
        timeframe: activeTimeframe,
        trading_mode: activeTradingMode,
        chat_id: chatId,
        model_agreement: analysis?.signal.model_agreement || 'UNANIMOUS',
        rsi: analysis?.indicators.rsi_14,
        regime: analysis?.market_regime,
      });

      if (res.status === 'sent') {
        const successMsg = `Signal broadcasted to ${res.chat || chatId}!`;
        setToastMessage({ type: 'success', text: successMsg });
        setLastBroadcastStatus({
          type: 'success',
          message: successMsg,
          timestamp: Date.now(),
        });
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to send to Telegram';
      setToastMessage({ type: 'error', text: errorMsg });
      setLastBroadcastStatus({
        type: 'error',
        message: errorMsg,
        timestamp: Date.now(),
      });
    } finally {
      setIsSending(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  return (
    <div className="border-t border-border bg-surface/95 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 z-20 select-none shadow-lg">
      {/* Left: Asset Ticker & Dual Currency Price (USD & INR) */}
      <div className="flex items-center space-x-3">
        <div className="flex items-baseline space-x-2">
          <span className="text-sm font-bold text-white tracking-wider font-mono">
            {cleanPair}
          </span>
          <span className="text-xs text-slate-300 font-mono">
            ${currentPrice.toLocaleString(undefined, {
              minimumFractionDigits: currentPrice < 0.001 ? 6 : currentPrice < 1 ? 4 : 2,
              maximumFractionDigits: currentPrice < 0.001 ? 8 : currentPrice < 1 ? 4 : 2,
            })}
          </span>
          <span className="text-[11px] text-emerald-400 font-mono hidden sm:inline">
            (₹{currentPriceInr.toLocaleString('en-IN', {
              maximumFractionDigits: currentPriceInr < 1 ? 4 : 2,
            })})
          </span>
        </div>

        <div className="h-4 w-px bg-border mx-0.5" />

        {/* Quant Signal Badge */}
        <div className="flex items-center space-x-1.5">
          <div
            className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1 uppercase tracking-wide border ${
              isBuySignal
                ? 'bg-bull/15 text-emerald-400 border-bull/30'
                : isSellSignal
                ? 'bg-bear/15 text-rose-400 border-bear/30'
                : 'bg-surface-elevated text-slate-300 border-border'
            }`}
          >
            {isBuySignal ? (
              <ArrowUpRight className="h-3 w-3 text-bull" />
            ) : isSellSignal ? (
              <ArrowDownRight className="h-3 w-3 text-bear" />
            ) : (
              <Sparkles className="h-3 w-3 text-slate-400" />
            )}
            <span>{signalDirection === 'HOLD' ? 'NEUTRAL' : signalDirection}</span>
          </div>

          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
            {(confidence * 100).toFixed(0)}% Conf
          </span>
        </div>
      </div>

      {/* Feedback Toast if any */}
      {toastMessage && (
        <div
          className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'bg-bull/20 text-emerald-300 border border-bull/40'
              : toastMessage.type === 'error'
              ? 'bg-bear/20 text-rose-300 border border-bear/40'
              : 'bg-tech-blue/20 text-sky-300 border border-tech-blue/40'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-bull shrink-0" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Right: Auto-generated Buy/Sell Requests & Telegram Action */}
      <div className="flex items-center space-x-2">
        {/* 1. Auto-generated Buy Request */}
        <button
          onClick={() => handleQuickTrade('buy')}
          disabled={executingSide !== null}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-500/40 shadow-sm shadow-emerald-950/40 flex items-center space-x-1 transition-all disabled:opacity-50"
          title="Instantly execute Long position on CoinDCX with 2% risk"
        >
          {executingSide === 'buy' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowUpRight className="h-3.5 w-3.5 text-white" />
          )}
          <span>BUY / LONG</span>
        </button>

        {/* 2. Auto-generated Sell Request */}
        <button
          onClick={() => handleQuickTrade('sell')}
          disabled={executingSide !== null}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 border border-rose-500/40 shadow-sm shadow-rose-950/40 flex items-center space-x-1 transition-all disabled:opacity-50"
          title="Instantly execute Short position on CoinDCX with 2% risk"
        >
          {executingSide === 'sell' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-white" />
          )}
          <span>SELL / SHORT</span>
        </button>

        <div className="h-5 w-px bg-border mx-1" />

        {/* 3. Send to Telegram Action Button */}
        <button
          onClick={handleSendToTelegram}
          disabled={isSending}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#229ED9] hover:bg-[#1f8ec4] border border-[#229ED9]/50 shadow-md shadow-[#229ED9]/25 flex items-center space-x-1.5 transition-all disabled:opacity-50"
          title={chatId ? `Broadcast signal to ${chatId}` : 'Configure Telegram Channel to broadcast'}
        >
          {isSending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5 text-white" />
          )}
          <span>Send to Telegram</span>
        </button>

        {/* 4. Telegram Config Dialog Trigger */}
        <button
          onClick={() => setIsConfigModalOpen(true)}
          className="p-1.5 rounded-lg border border-border bg-surface-elevated hover:bg-surface text-slate-400 hover:text-white transition-colors"
          title="Telegram Channel & Auto-Broadcast Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
