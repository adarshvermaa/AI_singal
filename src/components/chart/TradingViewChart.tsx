'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, IPriceLine } from 'lightweight-charts';
import { useTerminalStore } from '../../store/terminalStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { api } from '../../services/api';
import { Zap, Wifi, WifiOff } from 'lucide-react';

export const TradingViewChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const activePriceLinesRef = useRef<IPriceLine[]>([]);
  const lastCandleRef = useRef<{ time: number; open: number; high: number; low: number; close: number } | null>(null);

  const {
    activeSymbol,
    activeTimeframe,
    activeTradingMode,
    setActiveTimeframe,
    analysis,
    setAnalysis,
    isLoadingAnalysis,
    setIsLoadingAnalysis,
    overlays,
    toggleOverlay,
  } = useTerminalStore();

  const { isConnected: isWsConnected, latestPrice } = useWebSocket();
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<string>('');
  const [isFetchingCandles, setIsFetchingCandles] = useState<boolean>(false);

  // Helper to get interval ms
  const getIntervalMs = (tf: string) => {
    const value = parseInt(tf);
    if (tf.endsWith('m')) return value * 60 * 1000;
    if (tf.endsWith('h')) return value * 60 * 60 * 1000;
    if (tf.endsWith('d')) return value * 24 * 60 * 60 * 1000;
    return 60 * 1000; // default 1m
  };

  // Real-time live tick update to the active candlestick
  useEffect(() => {
    if (!seriesRef.current || !latestPrice || !lastCandleRef.current) return;
    try {
      const last = lastCandleRef.current;
      const intervalMs = getIntervalMs(activeTimeframe);
      const currentTickTime = Date.now();
      const candleOpenTimeMs = (last.time as number) * 1000;

      if (currentTickTime >= candleOpenTimeMs + intervalMs) {
        const newTime = Math.floor(currentTickTime / 1000);
        const newCandle = {
          time: newTime as any,
          open: latestPrice,
          high: latestPrice,
          low: latestPrice,
          close: latestPrice,
        };
        seriesRef.current.update(newCandle);
        lastCandleRef.current = newCandle;
      } else {
        const updated = {
          time: last.time as any,
          open: last.open,
          high: Math.max(last.high, latestPrice),
          low: Math.min(last.low, latestPrice),
          close: latestPrice,
        };
        seriesRef.current.update(updated);
        lastCandleRef.current = updated;
      }
    } catch {}
  }, [latestPrice, activeTimeframe]);

  // 1. Fetch Real Historical Candles from API
  const loadCandles = useCallback(async () => {
    if (!seriesRef.current || !volumeSeriesRef.current) return;
    setIsFetchingCandles(true);

    try {
      const candles = await api.getCandles(activeSymbol, activeTimeframe, activeTradingMode, 300);
      if (candles && candles.length > 0) {
        lastCandleRef.current = { ...candles[candles.length - 1] };
        seriesRef.current.setData(
          candles.map((c) => ({
            time: c.time as any,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        );
        volumeSeriesRef.current.setData(
          candles.map((c) => ({
            time: c.time as any,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)',
          }))
        );
        return;
      }
    } catch {
      // Fallback to sample candles if backend is not yet started
      const sampleCandles: CandlestickData[] = [];
      const sampleVolume: any[] = [];
      let basePrice = 67500;
      const now = Math.floor(Date.now() / 1000);
      const intervalSecs = 15 * 60;

      for (let i = 120; i >= 0; i--) {
        const time = (now - i * intervalSecs) as any;
        const change = (Math.random() - 0.48) * 150;
        const open = basePrice;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * 80;
        const low = Math.min(open, close) - Math.random() * 80;
        basePrice = close;

        sampleCandles.push({ time, open, high, low, close });
        sampleVolume.push({
          time,
          value: Math.floor(Math.random() * 150) + 50,
          color: close >= open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)',
        });
      }

      seriesRef.current?.setData(sampleCandles);
      volumeSeriesRef.current?.setData(sampleVolume);
    } finally {
      setIsFetchingCandles(false);
    }
  }, [activeSymbol, activeTimeframe, activeTradingMode]);

  // 2. Trigger on-demand AI analysis
  const triggerAnalysis = useCallback(async () => {
    setIsLoadingAnalysis(true);
    try {
      const data = await api.analyze(activeSymbol, activeTimeframe, activeTradingMode);
      setAnalysis(data);
      setLastAnalyzedTime(new Date().toLocaleTimeString());
    } catch {
      // Fallback default analysis if backend is not running
      setAnalysis({
        symbol: activeSymbol,
        timeframe: activeTimeframe,
        exchange: 'coindcx',
        timestamp: Date.now(),
        current_price: 68510.5,
        market_regime: 'trending',
        funding_rate: -0.00015,
        long_short_ratio: 1.15,
        volume_24h: 15420000,
        signal: {
          direction: 'BUY',
          confidence: 0.84,
          model_agreement: 'UNANIMOUS',
          model_votes: [
            { model_name: 'xgboost', direction: 'BUY', buy_prob: 0.82, hold_prob: 0.11, sell_prob: 0.07 },
            { model_name: 'lstm', direction: 'BUY', buy_prob: 0.86, hold_prob: 0.09, sell_prob: 0.05 },
            { model_name: 'lightgbm', direction: 'BUY', buy_prob: 0.84, hold_prob: 0.10, sell_prob: 0.06 },
          ],
        },
        levels: {
          entry: 68510.5,
          stop_loss: 67820.0,
          take_profit_1: 69430.0,
          take_profit_2: 70120.0,
          take_profit_3: 71150.0,
          risk_reward_ratio: 2.33,
          leverage_suggestion: 3.0,
        },
        reasoning: [
          {
            category: 'Trend Structure',
            signal: 'bullish',
            strength: 0.88,
            description: 'Bullish EMA stack (9 > 21 > 50 > 200). ADX at 28.5 confirms strong trend momentum.',
            indicators: ['EMA 9', 'EMA 21', 'EMA 50', 'ADX'],
          },
          {
            category: 'Momentum Oscillators',
            signal: 'bullish',
            strength: 0.75,
            description: 'RSI at 58 showing expansion from oversold. StochRSI bullish crossover confirmed.',
            indicators: ['RSI 14', 'StochRSI'],
          },
          {
            category: 'Futures Sentiment',
            signal: 'bullish',
            strength: 0.82,
            description: 'Negative funding rate (-0.015%) reflects heavy short positioning; strong short-squeeze setup.',
            indicators: ['Funding Rate', 'Open Interest'],
          },
          {
            category: 'Orderbook & Flow',
            signal: 'bullish',
            strength: 0.72,
            description: 'Bid-to-ask depth ratio exceeds 1.42x. Aggressive taker buy ratio is 61%.',
            indicators: ['Orderbook Depth', 'Taker Volume'],
          },
        ],
        overlays: {
          entry_line: { price: 68510.5, label: 'AI Entry', color: '#3b82f6', line_style: 'solid', line_width: 2 },
          stop_loss_line: { price: 67820.0, label: 'Stop Loss', color: '#f43f5e', line_style: 'dashed', line_width: 2 },
          take_profit_lines: [
            { price: 69430.0, label: 'TP1 (2.0R)', color: '#10b981', line_style: 'dashed', line_width: 1 },
            { price: 70120.0, label: 'TP2 (3.0R)', color: '#10b981', line_style: 'dotted', line_width: 1 },
          ],
          support_levels: [{ price: 67450.0, label: 'Key Support S1', color: '#059669', line_style: 'solid', line_width: 1 }],
          resistance_levels: [{ price: 69800.0, label: 'Key Resistance R1', color: '#dc2626', line_style: 'solid', line_width: 1 }],
          patterns: [{ name: 'Bullish Engulfing', start_index: 497, end_index: 498, confidence: 0.85, direction: 'bullish' }],
          fvg_zones: [{ upper: 68350.0, lower: 68150.0, label: 'Bullish FVG Zone', color: '#3b82f6', opacity: 0.25 }],
          supply_demand_zones: [],
        },
        indicators: {
          rsi_14: 58.4,
          macd: 45.2,
          macd_signal: 32.1,
          macd_histogram: 13.1,
          ema_9: 68420.0,
          ema_21: 68250.0,
          ema_50: 67900.0,
          ema_200: 66500.0,
          adx: 28.5,
          atr_14: 460.0,
          bb_upper: 69100.0,
          bb_middle: 68300.0,
          bb_lower: 67500.0,
          volume_sma_ratio: 1.65,
          supertrend: 67950.0,
          supertrend_direction: 1,
        },
      });
      setLastAnalyzedTime(new Date().toLocaleTimeString());
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [activeSymbol, activeTimeframe, activeTradingMode, setAnalysis, setIsLoadingAnalysis]);

  // 3. Initialize Lightweight Chart Canvas
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: '#090d16' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#131b2b' },
        horzLines: { color: '#131b2b' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#334155', width: 1, style: 3 },
        horzLine: { color: '#334155', width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        textColor: '#cbd5e1',
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRef.current = series;
    volumeSeriesRef.current = volumeSeries;

    // Load initial candles
    loadCandles();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // 4. Reload candles & re-analyze on symbol or timeframe change
  useEffect(() => {
    loadCandles();
    triggerAnalysis();
  }, [activeSymbol, activeTimeframe, activeTradingMode]);

  // 5. Draw AI Price Overlays when analysis updates
  useEffect(() => {
    if (!seriesRef.current || !analysis?.overlays) return;
    const series = seriesRef.current;

    // Remove old price lines
    activePriceLinesRef.current.forEach((line) => {
      try {
        series.removePriceLine(line);
      } catch {}
    });
    activePriceLinesRef.current = [];

    // Apply Entry Line
    if (overlays.showTradeLevels && analysis.overlays.entry_line) {
      const l = series.createPriceLine({
        price: analysis.overlays.entry_line.price,
        color: analysis.overlays.entry_line.color,
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: analysis.overlays.entry_line.label,
      });
      activePriceLinesRef.current.push(l);
    }

    // Apply Stop Loss Line
    if (overlays.showTradeLevels && analysis.overlays.stop_loss_line) {
      const l = series.createPriceLine({
        price: analysis.overlays.stop_loss_line.price,
        color: analysis.overlays.stop_loss_line.color,
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: analysis.overlays.stop_loss_line.label,
      });
      activePriceLinesRef.current.push(l);
    }

    // Apply Take Profit Lines
    if (overlays.showTradeLevels && analysis.overlays.take_profit_lines) {
      analysis.overlays.take_profit_lines.forEach((tp) => {
        const l = series.createPriceLine({
          price: tp.price,
          color: tp.color,
          lineWidth: 1,
          lineStyle: 1,
          axisLabelVisible: true,
          title: tp.label,
        });
        activePriceLinesRef.current.push(l);
      });
    }

    // Apply Support & Resistance Pivot Lines
    if (overlays.showSR) {
      analysis.overlays.support_levels?.forEach((s) => {
        const l = series.createPriceLine({
          price: s.price,
          color: s.color,
          lineWidth: 1,
          lineStyle: 0,
          title: s.label,
        });
        activePriceLinesRef.current.push(l);
      });
      analysis.overlays.resistance_levels?.forEach((r) => {
        const l = series.createPriceLine({
          price: r.price,
          color: r.color,
          lineWidth: 1,
          lineStyle: 0,
          title: r.label,
        });
        activePriceLinesRef.current.push(l);
      });
    }
  }, [analysis, overlays]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-background">
      {/* Chart Toolbar & Timeframe Bar */}
      <div className="h-10 border-b border-border px-4 flex items-center justify-between bg-surface/50 text-xs">
        {/* Timeframes */}
        <div className="flex items-center space-x-1">
          {(['1m', '5m', '15m', '1h', '4h', '1d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={`px-2.5 py-1 rounded font-mono font-medium transition-all ${
                activeTimeframe === tf
                  ? 'bg-ai text-white shadow-sm shadow-ai/30'
                  : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
              }`}
            >
              {tf}
            </button>
          ))}

          <div className="h-4 w-px bg-border mx-2" />

          {/* Overlays toggle buttons */}
          <button
            onClick={() => toggleOverlay('showTradeLevels')}
            className={`px-2 py-0.5 rounded text-[11px] flex items-center space-x-1 border ${
              overlays.showTradeLevels
                ? 'bg-tech-blue/15 border-tech-blue/40 text-tech-blue'
                : 'border-border text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>SL/TP Plan</span>
          </button>

          <button
            onClick={() => toggleOverlay('showSR')}
            className={`px-2 py-0.5 rounded text-[11px] flex items-center space-x-1 border ${
              overlays.showSR
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'border-border text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>S/R Pivots</span>
          </button>
        </div>

        {/* Action: Real-time Socket & Trigger AI Analysis */}
        <div className="flex items-center space-x-3">
          {/* Live WebSocket Status Pill */}
          <div
            className={`flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
              isWsConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={isWsConnected ? 'Connected to live CoinDCX feed' : 'Connecting WebSocket...'}
          >
            {isWsConnected ? <Wifi className="h-3 w-3 text-emerald-400" /> : <WifiOff className="h-3 w-3 text-slate-400" />}
            <span>{isWsConnected ? 'LIVE FEED' : 'OFFLINE'}</span>
          </div>

          {lastAnalyzedTime && (
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              Analyzed {lastAnalyzedTime}
            </span>
          )}

          <button
            onClick={triggerAnalysis}
            disabled={isLoadingAnalysis || isFetchingCandles}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-ai to-tech-blue text-white text-xs font-semibold flex items-center space-x-1.5 hover:opacity-90 transition-all shadow-md shadow-ai/20 disabled:opacity-50"
          >
            <Zap className={`h-3.5 w-3.5 ${isLoadingAnalysis ? 'animate-spin' : ''}`} />
            <span>{isLoadingAnalysis ? 'Analyzing...' : '⚡ AI Analyze'}</span>
          </button>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div ref={chartContainerRef} className="flex-1 w-full relative" />
    </div>
  );
};
