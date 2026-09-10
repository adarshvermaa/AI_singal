'use client';

import { useEffect, useRef } from 'react';
import { useTerminalStore } from '../store/terminalStore';
import { useExchangeStore } from '../store/exchangeStore';
import { api } from '../services/api';

export function useAutoTrade() {
  const {
    activeSymbol,
    activeTradingMode,
    analysis,
    executionMode,
    pendingTradeProposal,
    setPendingTradeProposal,
    soundEnabled,
  } = useTerminalStore();

  const { isConnected } = useExchangeStore();
  const lastProcessedSignalRef = useRef<string | null>(null);

  useEffect(() => {
    if (!analysis || !analysis.signal) return;
    const { direction, confidence } = analysis.signal;

    // Only process strong directional signals (BUY or SELL) with confidence >= 0.70 (70%)
    if (direction === 'HOLD' || confidence < 0.70) return;

    // Create unique key for this signal to avoid double execution on same candle/tick
    const timestampBucket = analysis.timestamp ? Math.floor(analysis.timestamp / 60000) : Math.floor(Date.now() / 60000);
    const signalKey = `${analysis.symbol}_${analysis.timeframe}_${direction}_${timestampBucket}`;
    if (lastProcessedSignalRef.current === signalKey) {
      return;
    }

    const currentPrice = analysis.current_price;
    const isBuy = direction === 'BUY';
    const sl = analysis.levels?.stop_loss || (isBuy ? currentPrice * 0.98 : currentPrice * 1.02);
    const tp = analysis.levels?.take_profit_1 || (isBuy ? currentPrice * 1.03 : currentPrice * 0.97);

    // 1. Semi-Automatic Mode: Trigger high-priority 15s confirmation modal
    if (executionMode === 'semi-auto') {
      if (!pendingTradeProposal) {
        lastProcessedSignalRef.current = signalKey;
        setPendingTradeProposal({
          symbol: activeSymbol,
          side: isBuy ? 'buy' : 'sell',
          confidence,
          price: currentPrice,
          sl,
          tp,
          tradingMode: activeTradingMode,
        });

        if (soundEnabled && typeof window !== 'undefined') {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime);
            osc.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
          } catch {}
        }
      }
    }

    // 2. Automatic Mode: Directly execute trade if connected
    else if (executionMode === 'auto') {
      if (isConnected) {
        lastProcessedSignalRef.current = signalKey;
        api.executeTrade({
          symbol: activeSymbol,
          side: isBuy ? 'buy' : 'sell',
          tradingMode: activeTradingMode,
          price: currentPrice,
          stopLoss: sl,
          takeProfit: tp,
          autoSize: true,
        }).then((res) => {
          console.log('[ALPHX AUTO-TRADE] Order executed:', res);
          if (soundEnabled && typeof window !== 'undefined') {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
              osc.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.3);
            } catch {}
          }
        }).catch((err) => {
          console.error('[ALPHX AUTO-TRADE] Execution error:', err);
        });
      }
    }
  }, [
    analysis,
    executionMode,
    isConnected,
    activeSymbol,
    activeTradingMode,
    pendingTradeProposal,
    setPendingTradeProposal,
    soundEnabled,
  ]);
}
