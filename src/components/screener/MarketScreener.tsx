'use client';

import React, { useEffect, useState } from 'react';
import { useTerminalStore } from '../../store/terminalStore';
import { api } from '../../services/api';
import { MarketItem } from '../../types';
import { Search, Star, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export const MarketScreener: React.FC = () => {
  const { activeSymbol, setActiveSymbol } = useTerminalStore();
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<'USDT' | 'INR'>('USDT');
  const [isLoading, setIsLoading] = useState(false);

  const fetchMarkets = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMarkets(selectedQuote);
      if (res.markets) {
        setMarkets(res.markets);
      }
    } catch {
      // Fallback default list if backend is not yet started
      setMarkets([
        {
          pair: 'B-BTC_USDT',
          base_currency: 'BTC',
          quote_currency: 'USDT',
          last_price: 68510.5,
          change_24h: 2.34,
          volume_24h: 15420000,
          max_leverage: 25,
          trading_modes: ['futures', 'margin', 'spot'],
          is_active: true,
        },
        {
          pair: 'B-ETH_USDT',
          base_currency: 'ETH',
          quote_currency: 'USDT',
          last_price: 3520.8,
          change_24h: 4.12,
          volume_24h: 9840000,
          max_leverage: 25,
          trading_modes: ['futures', 'margin', 'spot'],
          is_active: true,
        },
        {
          pair: 'B-SOL_USDT',
          base_currency: 'SOL',
          quote_currency: 'USDT',
          last_price: 184.25,
          change_24h: -1.45,
          volume_24h: 4210000,
          max_leverage: 20,
          trading_modes: ['futures', 'margin', 'spot'],
          is_active: true,
        },
        {
          pair: 'B-DOGE_USDT',
          base_currency: 'DOGE',
          quote_currency: 'USDT',
          last_price: 0.1284,
          change_24h: 7.82,
          volume_24h: 2850000,
          max_leverage: 15,
          trading_modes: ['futures', 'margin', 'spot'],
          is_active: true,
        },
        {
          pair: 'B-XRP_USDT',
          base_currency: 'XRP',
          quote_currency: 'USDT',
          last_price: 0.584,
          change_24h: 0.45,
          volume_24h: 1950000,
          max_leverage: 20,
          trading_modes: ['futures', 'margin', 'spot'],
          is_active: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [selectedQuote]);

  const filteredMarkets = markets.filter((m) =>
    m.pair.toLowerCase().includes(search.toLowerCase()) ||
    m.base_currency.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-64 border-r border-border bg-surface flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Search & Refresh */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search coin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-tech-blue"
          />
        </div>

        {/* Currency Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1 bg-background p-0.5 rounded-md border border-border">
            {(['USDT', 'INR'] as const).map((quote) => (
              <button
                key={quote}
                onClick={() => setSelectedQuote(quote)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  selectedQuote === quote
                    ? 'bg-surface-elevated text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {quote}
              </button>
            ))}
          </div>

          <button
            onClick={fetchMarkets}
            disabled={isLoading}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
            title="Refresh markets"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Markets List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {filteredMarkets.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">No pairs found</div>
        ) : (
          filteredMarkets.map((market) => {
            const isSelected = activeSymbol === market.pair;
            const isPositive = (market.change_24h || 0) >= 0;

            return (
              <div
                key={market.pair}
                onClick={() => setActiveSymbol(market.pair)}
                className={`px-3 py-2.5 cursor-pointer transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-surface-elevated border-l-2 border-ai text-white'
                    : 'hover:bg-surface-elevated/40 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-white">
                      {market.base_currency}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      /{market.quote_currency}
                    </span>
                    {market.max_leverage > 1 && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-tech-blue/15 text-tech-blue font-semibold">
                        {market.max_leverage}x
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Vol: {((market.volume_24h || 0) / 1000000).toFixed(1)}M
                  </div>
                </div>

                <div className="text-right num-mono">
                  <div className="text-xs font-semibold text-white">
                    ${(market.last_price || 0).toLocaleString(undefined, {
                      minimumFractionDigits: (market.last_price || 0) < 1 ? 4 : 2,
                    })}
                  </div>
                  <div
                    className={`text-[10px] font-medium flex items-center justify-end space-x-0.5 ${
                      isPositive ? 'text-bull' : 'text-bear'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    <span>
                      {isPositive ? '+' : ''}
                      {(market.change_24h || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
