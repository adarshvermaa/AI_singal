'use client';

import React from 'react';
import { useTerminalStore } from '../../store/terminalStore';
import { TrendingUp, TrendingDown, MinusCircle, ShieldAlert, CheckCircle2, Cpu } from 'lucide-react';

export const SignalCard: React.FC = () => {
  const { analysis } = useTerminalStore();

  if (!analysis) {
    return (
      <div className="p-4 bg-surface rounded-xl border border-border animate-pulse flex flex-col items-center justify-center text-slate-500 text-xs py-8">
        <Cpu className="h-6 w-6 mb-2 animate-spin text-ai" />
        <span>Evaluating AI Signal Models...</span>
      </div>
    );
  }

  const { signal, levels } = analysis;
  const isBuy = signal.direction === 'BUY';
  const isSell = signal.direction === 'SELL';
  const isHold = signal.direction === 'HOLD';

  return (
    <div className="p-4 bg-surface/95 border border-border rounded-xl space-y-4 shadow-xl select-none">
      {/* Top Header: Signal Verdict + Agreement */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={`p-2 rounded-lg ${
              isBuy
                ? 'bg-bull/20 text-bull glow-bull'
                : isSell
                ? 'bg-bear/20 text-bear glow-bear'
                : 'bg-slate-700/30 text-slate-400'
            }`}
          >
            {isBuy ? (
              <TrendingUp className="h-6 w-6" />
            ) : isSell ? (
              <TrendingDown className="h-6 w-6" />
            ) : (
              <MinusCircle className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              AI ENSEMBLE VERDICT
            </div>
            <div
              className={`text-2xl font-black tracking-tight ${
                isBuy ? 'text-bull' : isSell ? 'text-bear' : 'text-slate-300'
              }`}
            >
              {signal.direction === 'BUY'
                ? 'STRONG BUY'
                : signal.direction === 'SELL'
                ? 'STRONG SELL'
                : 'HOLD / NEUTRAL'}
            </div>
          </div>
        </div>

        {/* Model Consensus Tag */}
        <div className="text-right">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              signal.model_agreement === 'UNANIMOUS'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : signal.model_agreement === 'MAJORITY'
                ? 'bg-tech-blue/15 border-tech-blue/40 text-tech-blue'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
            }`}
          >
            {signal.model_agreement} (3/3)
          </span>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Regime: <span className="text-white capitalize">{analysis.market_regime}</span>
          </div>
        </div>
      </div>

      {/* Confidence Meter Bar */}
      <div>
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span className="text-slate-400">Model Confidence</span>
          <span
            className={`num-mono font-bold ${
              isBuy ? 'text-bull' : isSell ? 'text-bear' : 'text-slate-300'
            }`}
          >
            {(signal.confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="h-2 w-full bg-background rounded-full overflow-hidden p-0.5 border border-border">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isBuy
                ? 'bg-gradient-to-r from-emerald-500 to-teal-300'
                : isSell
                ? 'bg-gradient-to-r from-rose-500 to-red-400'
                : 'bg-slate-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(10, signal.confidence * 100))}%` }}
          />
        </div>
      </div>

      {/* Individual Model Votes Breakdown */}
      <div className="p-3 bg-background/60 rounded-lg border border-border/70 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Individual Model Telemetry
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {signal.model_votes?.map((vote) => (
            <div
              key={vote.model_name}
              className="p-2 rounded-md bg-surface-elevated border border-border/50"
            >
              <div className="text-[10px] text-slate-400 uppercase font-mono">
                {vote.model_name}
              </div>
              <div
                className={`font-bold mt-0.5 ${
                  vote.direction === 'BUY'
                    ? 'text-bull'
                    : vote.direction === 'SELL'
                    ? 'text-bear'
                    : 'text-slate-400'
                }`}
              >
                {vote.direction}
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                {(Math.max(vote.buy_prob, vote.sell_prob, vote.hold_prob) * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calculated ATR Trade Levels (Entry, SL, TP) */}
      {levels && (
        <div className="pt-1 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>ATR TRADE SETUP</span>
            <span className="text-ai font-mono">R:R = 1:{levels.risk_reward_ratio}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs num-mono">
            {/* Entry */}
            <div className="p-2 rounded-lg bg-tech-blue/10 border border-tech-blue/25">
              <div className="text-[10px] text-tech-blue font-semibold">ENTRY</div>
              <div className="font-bold text-white mt-0.5">
                ${levels.entry.toLocaleString()}
              </div>
            </div>

            {/* Stop Loss */}
            <div className="p-2 rounded-lg bg-bear/10 border border-bear/25">
              <div className="text-[10px] text-bear font-semibold">STOP LOSS</div>
              <div className="font-bold text-rose-300 mt-0.5">
                ${levels.stop_loss.toLocaleString()}
              </div>
            </div>

            {/* Take Profit 1 */}
            <div className="p-2 rounded-lg bg-bull/10 border border-bull/25">
              <div className="text-[10px] text-bull font-semibold">TP1 (TARGET)</div>
              <div className="font-bold text-emerald-300 mt-0.5">
                ${levels.take_profit_1.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
