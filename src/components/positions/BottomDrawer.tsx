'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useExchangeStore } from '../../store/exchangeStore';
import { useTerminalStore } from '../../store/terminalStore';
import { api } from '../../services/api';
import { ChevronUp, ChevronDown, RefreshCw, DollarSign, Wallet } from 'lucide-react';

export const BottomDrawer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'positions' | 'balances'>('positions');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isClosingId, setIsClosingId] = useState<string | null>(null);

  const {
    positions,
    balances,
    setPositions,
    setBalances,
    isConnected,
    setIsConnectModalOpen,
  } = useExchangeStore();

  const { activeTradingMode } = useTerminalStore();

  const fetchPositions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const pos = await api.getPositions();
      setPositions(pos || []);
    } catch {
      setPositions([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [setPositions]);

  const fetchBalances = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const bal = await api.getBalances();
      if (bal) setBalances(bal);
    } catch {
      // Ignored
    } finally {
      setIsRefreshing(false);
    }
  }, [setBalances]);

  // Selective polling: ONLY when expanded, on positions tab, and connected
  useEffect(() => {
    if (!isExpanded) return;

    if (activeTab === 'positions') {
      fetchPositions();
      // Only poll when connected to exchange, relaxed to 30s to prevent spam
      if (isConnected) {
        const interval = setInterval(fetchPositions, 30000);
        return () => clearInterval(interval);
      }
    } else if (activeTab === 'balances') {
      fetchBalances();
    }
  }, [isExpanded, activeTab, isConnected, fetchPositions, fetchBalances]);

  const handleClosePosition = async (id: string) => {
    setIsClosingId(id);
    try {
      await api.closePosition(id, activeTradingMode);
      setPositions(positions.filter((p) => p.id !== id));
    } catch {
      fetchPositions(); // Sync with actual exchange state
    } finally {
      setIsClosingId(null);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'positions') {
      fetchPositions();
    } else {
      fetchBalances();
    }
  };

  return (
    <div className="border-t border-border bg-surface/95 backdrop-blur-md select-none transition-all duration-300">
      {/* Header Bar */}
      <div className="h-9 px-4 border-b border-border/70 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          {(['positions', 'balances'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setIsExpanded(true);
              }}
              className={`px-3 py-1 font-semibold capitalize rounded-md transition-colors ${
                activeTab === tab && isExpanded
                  ? 'bg-surface-elevated text-white border border-border'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'positions' ? `Positions (${positions.length})` : 'Account Balances'}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 px-2 rounded text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors flex items-center space-x-1"
            title="Refresh active tab"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-tech-blue' : ''}`} />
            <span className="text-[10px] hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors flex items-center space-x-1"
          >
            <span className="text-[10px]">{isExpanded ? 'Hide' : 'Show'}</span>
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      {isExpanded && (
        <div className="h-44 overflow-y-auto p-3">
          {activeTab === 'positions' && (
            positions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 py-4 space-y-2">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Wallet className="h-4 w-4 text-tech-blue" />
                  <span className="font-semibold">No active open positions on CoinDCX</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {isConnected
                    ? 'Execute a trade from the order execution panel to monitor it here.'
                    : 'Connect your CoinDCX API credentials to view your live futures and spot positions.'}
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={fetchPositions}
                    disabled={isRefreshing}
                    className="px-2.5 py-1 text-[11px] bg-surface-elevated hover:bg-surface border border-border rounded text-slate-300 hover:text-white flex items-center space-x-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh Positions</span>
                  </button>
                  {!isConnected && (
                    <button
                      onClick={() => setIsConnectModalOpen(true)}
                      className="px-2.5 py-1 text-[11px] bg-tech-blue hover:bg-tech-blue/90 text-white font-semibold rounded"
                    >
                      Connect CoinDCX
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <table className="w-full text-left text-xs num-mono">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase border-b border-border/60 pb-2">
                    <th className="pb-2">Pair</th>
                    <th className="pb-2">Side</th>
                    <th className="pb-2">Size</th>
                    <th className="pb-2">Entry Price</th>
                    <th className="pb-2">Mark Price</th>
                    <th className="pb-2">Liq. Price</th>
                    <th className="pb-2">Unrealized PnL</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {positions.map((pos) => {
                    const isProfitable = pos.unrealized_pnl >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-surface-elevated/40">
                        <td className="py-2.5 font-bold text-white font-sans">
                          {pos.pair.replace('B-', '')}
                          <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-ai/20 text-ai-light">
                            {pos.leverage}x
                          </span>
                        </td>
                        <td className="py-2.5 font-bold uppercase">
                          <span
                            className={
                              pos.side === 'long'
                                ? 'text-bull font-bold'
                                : 'text-bear font-bold'
                            }
                          >
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-300">{pos.quantity}</td>
                        <td className="py-2.5 text-slate-300">${pos.entry_price.toLocaleString()}</td>
                        <td className="py-2.5 text-white font-semibold">
                          ${pos.mark_price.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-rose-400">${pos.liquidation_price.toLocaleString()}</td>
                        <td className="py-2.5">
                          <span
                            className={`font-bold ${
                              isProfitable ? 'text-bull' : 'text-bear'
                            }`}
                          >
                            {isProfitable ? '+' : ''}${pos.unrealized_pnl.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleClosePosition(pos.id)}
                            disabled={isClosingId === pos.id}
                            className="px-2.5 py-1 rounded bg-bear/20 hover:bg-bear/30 text-rose-300 border border-bear/40 text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            {isClosingId === pos.id ? 'Closing...' : 'Close'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'balances' && (
            balances.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 py-4 space-y-2">
                <div className="flex items-center space-x-2 text-slate-400">
                  <DollarSign className="h-4 w-4 text-tech-blue" />
                  <span className="font-semibold">No balances available</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {isConnected
                    ? 'CoinDCX returned zero active balances for this account.'
                    : 'Connect your CoinDCX API credentials to inspect spot & margin balances.'}
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={fetchBalances}
                    disabled={isRefreshing}
                    className="px-2.5 py-1 text-[11px] bg-surface-elevated hover:bg-surface border border-border rounded text-slate-300 hover:text-white flex items-center space-x-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh Balances</span>
                  </button>
                  {!isConnected && (
                    <button
                      onClick={() => setIsConnectModalOpen(true)}
                      className="px-2.5 py-1 text-[11px] bg-tech-blue hover:bg-tech-blue/90 text-white font-semibold rounded"
                    >
                      Connect CoinDCX
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs num-mono">
                {balances.map((b) => (
                  <div key={b.currency} className="p-3 bg-surface-elevated/60 rounded-lg border border-border">
                    <div className="text-[10px] text-slate-400 font-sans font-semibold">
                      {b.currency} Balance
                    </div>
                    <div className="text-base font-bold text-white mt-1">
                      {b.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Available: {b.available.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
