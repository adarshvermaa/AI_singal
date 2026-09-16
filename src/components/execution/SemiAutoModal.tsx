'use client';

import React, { useEffect, useState } from 'react';
import { useTerminalStore } from '../../store/terminalStore';
import { useExchangeStore } from '../../store/exchangeStore';
import { api } from '../../services/api';
import {
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  X,
  Loader2,
  Clock,
} from 'lucide-react';

export const SemiAutoModal: React.FC = () => {
  const { pendingTradeProposal, setPendingTradeProposal, analysis } = useTerminalStore();
  const inrRate = analysis?.inr_rate || 99.95;
  const { isConnected, setIsConnectModalOpen } = useExchangeStore();
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingTradeProposal) {
      setTimeLeft(15);
      setFeedback(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPendingTradeProposal(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingTradeProposal, setPendingTradeProposal]);

  if (!pendingTradeProposal) return null;

  const { symbol, side, confidence, price, sl, tp, tradingMode } = pendingTradeProposal;
  const isBuy = side === 'buy';

  const handleApprove = async () => {
    if (!isConnected) {
      setIsConnectModalOpen(true);
      return;
    }

    setIsExecuting(true);
    setFeedback(null);

    try {
      const res = await api.executeTrade({
        symbol,
        side,
        tradingMode,
        price,
        stopLoss: sl,
        takeProfit: tp,
        autoSize: true,
      });

      if (res.status === 'executed') {
        setFeedback('Trade Executed Successfully on CoinDCX!');
        setTimeout(() => {
          setPendingTradeProposal(null);
        }, 1200);
      } else {
        setFeedback(res.message || 'Order was rejected by exchange risk controls.');
      }
    } catch (err: any) {
      setFeedback(err.response?.data?.detail || err.message || 'Failed to execute trade.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl overflow-hidden relative">
        {/* Progress bar timer */}
        <div className="h-1 bg-surface-elevated w-full">
          <div
            className={`h-full transition-all duration-1000 ${
              isBuy ? 'bg-bull' : 'bg-bear'
            }`}
            style={{ width: `${(timeLeft / 15) * 100}%` }}
          />
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                  isBuy
                    ? 'bg-bull/20 text-bull border border-bull/30'
                    : 'bg-bear/20 text-bear border border-bear/30'
                }`}
              >
                {isBuy ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownRight className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20">
                    Semi-Auto Alert
                  </span>
                  <span className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{timeLeft}s remaining</span>
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  High-Confidence Quantitative Trade Opportunity
                </h3>
              </div>
            </div>

            <button
              onClick={() => setPendingTradeProposal(null)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-surface-elevated transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Trade Details Card */}
          <div className="p-3.5 bg-surface-elevated/70 border border-border rounded-lg space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Market Pair</span>
              <span className="font-bold text-white">
                {symbol.replace('B-', '').replace('_', '/')} ({tradingMode.toUpperCase()})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Action</span>
              <span
                className={`font-extrabold uppercase ${
                  isBuy ? 'text-bull' : 'text-bear'
                }`}
              >
                {side.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Model Confidence</span>
              <span className="font-bold text-emerald-400">
                {(confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Entry Reference</span>
              <span className="font-bold text-white">
                ${price.toLocaleString(undefined, { minimumFractionDigits: price < 1 ? 4 : 2 })}
                <span className="text-slate-400 text-[11px] ml-1.5 font-normal">
                  (₹{(price * inrRate).toLocaleString('en-IN', { maximumFractionDigits: (price * inrRate) < 1 ? 4 : 2 })})
                </span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
              <div>
                <span className="text-[10px] text-slate-400 block">Stop Loss</span>
                <span className="font-bold text-rose-400">
                  ${sl.toLocaleString(undefined, { minimumFractionDigits: sl < 1 ? 4 : 2 })}
                  <span className="text-rose-400/80 text-[10px] ml-1 block">
                    (₹{(sl * inrRate).toLocaleString('en-IN', { maximumFractionDigits: (sl * inrRate) < 1 ? 4 : 2 })})
                  </span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Take Profit</span>
                <span className="font-bold text-emerald-400">
                  ${tp.toLocaleString(undefined, { minimumFractionDigits: tp < 1 ? 4 : 2 })}
                  <span className="text-emerald-400/80 text-[10px] ml-1 block">
                    (₹{(tp * inrRate).toLocaleString('en-IN', { maximumFractionDigits: (tp * inrRate) < 1 ? 4 : 2 })})
                  </span>
                </span>
              </div>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center space-x-2 ${
                feedback.includes('Successfully')
                  ? 'bg-bull/15 border border-bull/40 text-emerald-300'
                  : 'bg-bear/15 border border-bear/40 text-rose-300'
              }`}
            >
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={() => setPendingTradeProposal(null)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-surface-elevated hover:bg-slate-700/60 border border-border transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={handleApprove}
              disabled={isExecuting}
              className={`flex-1 py-2 rounded-lg text-xs font-bold text-white flex items-center justify-center space-x-1.5 shadow-lg transition-all ${
                isBuy
                  ? 'bg-bull hover:bg-emerald-600 shadow-bull/20'
                  : 'bg-bear hover:bg-rose-600 shadow-bear/20'
              }`}
            >
              {isExecuting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approve & Execute</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
