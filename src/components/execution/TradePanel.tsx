'use client';

import React, { useState } from 'react';
import { useTerminalStore } from '../../store/terminalStore';
import { useExchangeStore } from '../../store/exchangeStore';
import { api } from '../../services/api';
import { Rocket, ShieldCheck, AlertCircle, Loader2, CheckCircle2, Cpu, Zap, SlidersHorizontal } from 'lucide-react';

export const TradePanel: React.FC = () => {
  const { activeSymbol, activeTradingMode, analysis, executionMode, setExecutionMode } = useTerminalStore();
  const { isConnected, balances, setIsConnectModalOpen } = useExchangeStore();

  const [leverage, setLeverage] = useState<number>(3);
  const [autoRisk, setAutoRisk] = useState<boolean>(true);
  const [customAmount, setCustomAmount] = useState<string>('100');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [orderFeedback, setOrderFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    orderId?: string;
  } | null>(null);

  const signalDirection = analysis?.signal.direction || 'BUY';
  const isBuy = signalDirection === 'BUY' || signalDirection === 'HOLD';
  const currentPrice = analysis?.current_price || 0;
  const sl = analysis?.levels?.stop_loss || (isBuy ? currentPrice * 0.98 : currentPrice * 1.02);
  const tp = analysis?.levels?.take_profit_1 || (isBuy ? currentPrice * 1.03 : currentPrice * 0.97);

  const usdtBalance = balances.find((b) => b.currency.toUpperCase() === 'USDT')?.available || 1000;
  const riskAmount = (usdtBalance * 0.02).toFixed(2); // 2% risk

  const handleExecute = async () => {
    if (!isConnected) {
      setIsConnectModalOpen(true);
      return;
    }

    setIsExecuting(true);
    setOrderFeedback(null);

    try {
      const res = await api.executeTrade({
        symbol: activeSymbol,
        side: isBuy ? 'buy' : 'sell',
        tradingMode: activeTradingMode,
        price: currentPrice,
        leverage,
        autoSize: autoRisk,
        stopLoss: sl,
        takeProfit: tp,
      });

      if (res.status === 'executed') {
        setOrderFeedback({
          type: 'success',
          message: `Order filled successfully on CoinDCX!`,
          orderId: res.order_id,
        });
      } else {
        setOrderFeedback({
          type: 'error',
          message: res.message || 'Order was rejected by exchange risk controls.',
        });
      }
    } catch (err: any) {
      setOrderFeedback({
        type: 'error',
        message: err.response?.data?.detail || err.message || 'Trade execution failed',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="p-4 bg-surface/95 border border-border rounded-xl space-y-4 shadow-xl select-none">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
          <Rocket className="h-3.5 w-3.5 text-tech-blue" />
          <span>Execution Center</span>
        </h4>
        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-surface-elevated text-slate-300 border border-border">
          {activeTradingMode}
        </span>
      </div>

      {/* Execution Engine Selector: Manual | Semi-Auto | Auto-Trade */}
      <div className="space-y-1.5 p-2.5 rounded-lg bg-background/90 border border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium flex items-center space-x-1">
            <SlidersHorizontal className="h-3 w-3 text-tech-blue" />
            <span>Execution Engine</span>
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            executionMode === 'auto'
              ? 'bg-ai/20 text-ai-light border border-ai/40 glow-ai'
              : executionMode === 'semi-auto'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-surface-elevated text-slate-300 border border-border'
          }`}>
            {executionMode === 'auto' ? '⚡ Fully Auto' : executionMode === 'semi-auto' ? '⏱ Semi-Auto (15s)' : '🎯 Manual'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 p-0.5 bg-surface-elevated/80 rounded-lg border border-border/50">
          <button
            type="button"
            onClick={() => setExecutionMode('manual')}
            className={`py-1 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center space-x-1 ${
              executionMode === 'manual'
                ? 'bg-surface text-white shadow-sm border border-border'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Manual</span>
          </button>
          <button
            type="button"
            onClick={() => setExecutionMode('semi-auto')}
            className={`py-1 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center space-x-1 ${
              executionMode === 'semi-auto'
                ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Semi-Auto</span>
          </button>
          <button
            type="button"
            onClick={() => setExecutionMode('auto')}
            className={`py-1 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center space-x-1 ${
              executionMode === 'auto'
                ? 'bg-ai/25 text-ai-light shadow-sm border border-ai/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-3 w-3 mr-0.5" />
            <span>Auto</span>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight pt-0.5">
          {executionMode === 'manual' && 'Manual: Configure leverage, risk, and execute orders on your demand.'}
          {executionMode === 'semi-auto' && 'Semi-Auto: Signals (≥70% confidence) trigger a 15s modal for 1-click confirmation.'}
          {executionMode === 'auto' && 'Auto-Trade: High-confidence AI signals execute immediately in real-time.'}
        </p>
      </div>

      {orderFeedback && (
        <div
          className={`p-3 rounded-lg text-xs leading-relaxed flex items-start space-x-2 ${
            orderFeedback.type === 'success'
              ? 'bg-bull/15 border border-bull/40 text-emerald-300'
              : 'bg-bear/15 border border-bear/40 text-rose-300'
          }`}
        >
          {orderFeedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-bull" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-bear" />
          )}
          <div>
            <div>{orderFeedback.message}</div>
            {orderFeedback.orderId && (
              <div className="text-[10px] font-mono mt-0.5 text-slate-400">
                Order ID: {orderFeedback.orderId}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leverage Controller */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-400">Leverage Multiplier</span>
          <span className="text-white font-mono font-bold">{leverage}x</span>
        </div>
        <input
          type="range"
          min="1"
          max="25"
          step="1"
          value={leverage}
          onChange={(e) => setLeverage(Number(e.target.value))}
          className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-tech-blue"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>1x (Spot)</span>
          <span>5x (Safe)</span>
          <span>15x</span>
          <span>25x (Max)</span>
        </div>
      </div>

      {/* Risk Sizing Mode */}
      <div className="p-2.5 rounded-lg bg-background/80 border border-border text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-medium">Auto-Risk Position Sizer</span>
          <button
            onClick={() => setAutoRisk(!autoRisk)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              autoRisk
                ? 'bg-bull/20 text-bull border border-bull/40'
                : 'bg-surface-elevated text-slate-400'
            }`}
          >
            {autoRisk ? '2% Risk Mode (Active)' : 'Custom USD'}
          </button>
        </div>

        {autoRisk ? (
          <div className="text-[11px] text-slate-400 leading-snug">
            Max loss is capped at <span className="text-white font-bold font-mono">${riskAmount} USDT</span> (2% of portfolio) if Stop-Loss is hit.
          </div>
        ) : (
          <div className="flex items-center space-x-2 pt-1">
            <span className="text-slate-400 font-mono text-xs">$</span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full bg-surface-elevated px-2 py-1 rounded border border-border text-xs text-white font-mono focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Execute Order CTA */}
      <button
        onClick={handleExecute}
        disabled={isExecuting}
        className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ${
          isBuy
            ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-950/40 glow-bull'
            : 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 shadow-rose-950/40 glow-bear'
        }`}
      >
        {isExecuting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sending to CoinDCX...</span>
          </>
        ) : (
          <>
            <span>{isBuy ? '🚀 EXECUTE LONG POSITION' : '🔻 EXECUTE SHORT POSITION'}</span>
            <span className="text-xs font-mono font-normal opacity-90">({leverage}x)</span>
          </>
        )}
      </button>
    </div>
  );
};
