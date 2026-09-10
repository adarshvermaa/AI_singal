'use client';

import React from 'react';
import { useTerminalStore } from '../../store/terminalStore';

export const IndicatorMatrix: React.FC = () => {
  const { analysis } = useTerminalStore();
  const ind = analysis?.indicators;

  if (!ind) return null;

  const currentPrice = analysis?.current_price;
  const bbPercent = ind.bb_upper && ind.bb_lower && currentPrice
    ? (currentPrice - ind.bb_lower) / (ind.bb_upper - ind.bb_lower)
    : null;

  const items = [
    { label: 'RSI (14)', value: ind.rsi_14?.toFixed(1) || '—', bull: (ind.rsi_14 || 50) > 50 },
    { label: 'ADX (14)', value: ind.adx?.toFixed(1) || '—', bull: (ind.adx || 0) > 25 },
    { label: 'ATR (14)', value: ind.atr_14 ? `$${ind.atr_14.toFixed(1)}` : '—', bull: true },
    { label: 'MACD Hist', value: ind.macd_histogram?.toFixed(2) || '—', bull: (ind.macd_histogram || 0) > 0 },
    { label: 'Vol/SMA', value: ind.volume_sma_ratio ? `${ind.volume_sma_ratio.toFixed(2)}x` : '—', bull: (ind.volume_sma_ratio || 1) > 1.2 },
    { label: 'BB %B', value: bbPercent !== null ? `${(bbPercent * 100).toFixed(0)}%` : '—', bull: (bbPercent || 0.5) > 0.5 },
  ];

  return (
    <div className="p-3 bg-surface/90 border border-border rounded-xl space-y-2 select-none">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Live Technical Telemetry
      </div>
      <div className="grid grid-cols-3 gap-2 num-mono text-center">
        {items.map((item) => (
          <div
            key={item.label}
            className="p-1.5 rounded-lg bg-background border border-border/60"
          >
            <div className="text-[10px] text-slate-400 font-sans">{item.label}</div>
            <div
              className={`text-xs font-bold mt-0.5 ${
                item.bull ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
