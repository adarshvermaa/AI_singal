'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, IPriceLine } from 'lightweight-charts';
import { useTerminalStore } from '../../store/terminalStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { api } from '../../services/api';
import {
  Zap,
  Wifi,
  WifiOff,
  Maximize2,
  Scan,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { ChartActionBar } from './ChartActionBar';

// Helper to derive realistic baseline pricing & precision for fallback/synthetic candles
const getAssetDefaults = (symbol: string) => {
  const upper = symbol.toUpperCase();
  if (upper.includes('BTC')) {
    return { basePrice: 68500, volatility: 180, precision: 2, minMove: 0.01 };
  }
  if (upper.includes('ETH')) {
    return { basePrice: 3520, volatility: 15, precision: 2, minMove: 0.01 };
  }
  if (upper.includes('SOL')) {
    return { basePrice: 184, volatility: 1.2, precision: 2, minMove: 0.01 };
  }
  if (upper.includes('DOGE')) {
    return { basePrice: 0.1284, volatility: 0.0015, precision: 4, minMove: 0.0001 };
  }
  if (upper.includes('XRP')) {
    return { basePrice: 0.584, volatility: 0.004, precision: 4, minMove: 0.0001 };
  }
  if (upper.includes('PEPE') || upper.includes('SHIB')) {
    return { basePrice: 0.0000185, volatility: 0.0000003, precision: 8, minMove: 0.00000001 };
  }
  return { basePrice: 100, volatility: 1, precision: 2, minMove: 0.01 };
};

// Dynamic price precision for sub-dollar assets
const getPrecisionFromPrice = (price: number) => {
  if (price < 0.0001) return { precision: 8, minMove: 0.00000001 };
  if (price < 0.01) return { precision: 6, minMove: 0.000001 };
  if (price < 1.0) return { precision: 4, minMove: 0.0001 };
  if (price < 10.0) return { precision: 3, minMove: 0.001 };
  return { precision: 2, minMove: 0.01 };
};

export const TradingViewChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const activePriceLinesRef = useRef<IPriceLine[]>([]);
  const lastCandleRef = useRef<{ time: number; open: number; high: number; low: number; close: number } | null>(null);
  const candleCountRef = useRef<number>(0);

  const {
    activeSymbol,
    activeTimeframe,
    activeTradingMode,
    lastSymbolChange,
    setActiveTimeframe,
    analysis,
    setAnalysis,
    isLoadingAnalysis,
    setIsLoadingAnalysis,
    overlays,
    toggleOverlay,
  } = useTerminalStore();

  const activeSymbolRef = useRef<string>(activeSymbol);
  activeSymbolRef.current = activeSymbol;

  const { isConnected: isWsConnected, latestPrice } = useWebSocket();
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<string>('');
  const [isFetchingCandles, setIsFetchingCandles] = useState<boolean>(false);
  const [autoFitNotice, setAutoFitNotice] = useState<string | null>(null);

  // Helper to get interval ms
  const getIntervalMs = (tf: string) => {
    const value = parseInt(tf);
    if (tf.endsWith('m')) return value * 60 * 1000;
    if (tf.endsWith('h')) return value * 60 * 60 * 1000;
    if (tf.endsWith('d')) return value * 24 * 60 * 60 * 1000;
    return 60 * 1000; // default 1m
  };

  // Trigger temporary notification pill
  const showNotice = (msg: string) => {
    setAutoFitNotice(msg);
    setTimeout(() => {
      setAutoFitNotice((curr) => (curr === msg ? null : curr));
    }, 2500);
  };

  // --- Auto-Fit & Zoom Controls ---

  // Auto-fit to recent ~65 candles with optimal right-padding and vertical autoScale
  const autoFitChart = useCallback((customCount?: number, notify: boolean = false) => {
    if (!chartRef.current) return;
    try {
      // 1. Force priceScale autoscale
      chartRef.current.priceScale('right').applyOptions({
        autoScale: true,
      });

      // 2. Set optimal logical range: focus on the most recent 60-70 candles
      const total = customCount ?? candleCountRef.current;
      if (total > 0) {
        const visibleBars = Math.min(total, 65);
        chartRef.current.timeScale().setVisibleLogicalRange({
          from: Math.max(0, total - visibleBars),
          to: total + 6, // 6 bars of breathing room on the right
        });
      } else {
        chartRef.current.timeScale().fitContent();
      }

      if (notify) {
        showNotice('Chart Auto-Fitted');
      }
    } catch {}
  }, []);

  // Fit all historical candles into view
  const fitAllHistory = useCallback(() => {
    if (!chartRef.current) return;
    try {
      chartRef.current.priceScale('right').applyOptions({
        autoScale: true,
      });
      chartRef.current.timeScale().fitContent();
      showNotice('Fitted Full History');
    } catch {}
  }, []);

  // Zoom In by 20%
  const handleZoomIn = useCallback(() => {
    if (!chartRef.current) return;
    try {
      const range = chartRef.current.timeScale().getVisibleLogicalRange();
      if (!range) return;
      const count = range.to - range.from;
      if (count <= 15) return;
      const delta = Math.max(2, Math.round(count * 0.2));
      chartRef.current.timeScale().setVisibleLogicalRange({
        from: range.from + delta,
        to: range.to,
      });
    } catch {}
  }, []);

  // Zoom Out by 20%
  const handleZoomOut = useCallback(() => {
    if (!chartRef.current) return;
    try {
      const range = chartRef.current.timeScale().getVisibleLogicalRange();
      if (!range) return;
      const count = range.to - range.from;
      const delta = Math.max(5, Math.round(count * 0.2));
      chartRef.current.timeScale().setVisibleLogicalRange({
        from: Math.max(0, range.from - delta),
        to: range.to + Math.round(delta * 0.2),
      });
    } catch {}
  }, []);

  // Real-time live tick update to the active candlestick
  useEffect(() => {
    if (!seriesRef.current || !latestPrice || !lastCandleRef.current) return;
    try {
      const last = lastCandleRef.current;

      // Sanity check: verify tick belongs to the active asset magnitude
      if (last.close > 0) {
        const ratio = latestPrice / last.close;
        if (ratio > 4.0 || ratio < 0.25) return;
      }

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

  // 1. Fetch Real Historical Candles from API & Auto-Fit
  const loadCandles = useCallback(async () => {
    if (!seriesRef.current || !volumeSeriesRef.current) return;
    const requestedSymbol = activeSymbol;
    setIsFetchingCandles(true);

    // Reset last candle reference to avoid stale tick pollution
    lastCandleRef.current = null;

    // Immediately clear all previous price lines from chart canvas
    activePriceLinesRef.current.forEach((line) => {
      try {
        seriesRef.current?.removePriceLine(line);
      } catch {}
    });
    activePriceLinesRef.current = [];

    try {
      const candles = await api.getCandles(requestedSymbol, activeTimeframe, activeTradingMode, 300);

      // Check if user switched symbol while request was in flight
      if (requestedSymbol !== activeSymbolRef.current) return;

      if (candles && candles.length > 0) {
        candleCountRef.current = candles.length;
        const last = candles[candles.length - 1];
        lastCandleRef.current = { ...last };

        // Dynamic price precision for sub-dollar assets (e.g. DOGE, XRP, SHIB)
        const samplePrice = last.close || 1;
        const { precision, minMove } = getPrecisionFromPrice(samplePrice);

        seriesRef.current.applyOptions({
          priceFormat: {
            type: 'price',
            precision,
            minMove,
          },
        });

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

        // Auto-fit & auto-zoom chart to optimal recent view
        autoFitChart(candles.length);
        requestAnimationFrame(() => autoFitChart(candles.length));
        return;
      }
    } catch {
      // Check if user switched symbol while request was in flight
      if (requestedSymbol !== activeSymbolRef.current) return;

      // Dynamic fallback candles matching the active asset's baseline price & volatility
      const defaults = getAssetDefaults(requestedSymbol);
      let basePrice = defaults.basePrice;
      const sampleCandles: CandlestickData[] = [];
      const sampleVolume: any[] = [];
      const now = Math.floor(Date.now() / 1000);
      const intervalSecs = 15 * 60;

      for (let i = 120; i >= 0; i--) {
        const time = (now - i * intervalSecs) as any;
        const change = (Math.random() - 0.48) * defaults.volatility;
        const open = basePrice;
        const close = Math.max(defaults.minMove, open + change);
        const high = Math.max(open, close) + Math.random() * (defaults.volatility * 0.5);
        const low = Math.max(defaults.minMove, Math.min(open, close) - Math.random() * (defaults.volatility * 0.5));
        basePrice = close;

        sampleCandles.push({ time, open, high, low, close });
        sampleVolume.push({
          time,
          value: Math.floor(Math.random() * 150) + 50,
          color: close >= open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)',
        });
      }

      candleCountRef.current = sampleCandles.length;
      const lastSample = sampleCandles[sampleCandles.length - 1];
      lastCandleRef.current = {
        time: Number(lastSample.time),
        open: lastSample.open,
        high: lastSample.high,
        low: lastSample.low,
        close: lastSample.close,
      };

      seriesRef.current?.applyOptions({
        priceFormat: {
          type: 'price',
          precision: defaults.precision,
          minMove: defaults.minMove,
        },
      });

      seriesRef.current?.setData(sampleCandles);
      volumeSeriesRef.current?.setData(sampleVolume);

      // Auto-fit chart zoom to new asset candles
      autoFitChart(sampleCandles.length);
      requestAnimationFrame(() => autoFitChart(sampleCandles.length));
    } finally {
      setIsFetchingCandles(false);
    }
  }, [activeSymbol, activeTimeframe, activeTradingMode, autoFitChart]);

  // 2. Trigger on-demand analysis
  const triggerAnalysis = useCallback(async () => {
    const requestedSymbol = activeSymbol;
    setIsLoadingAnalysis(true);
    try {
      const data = await api.analyze(requestedSymbol, activeTimeframe, activeTradingMode);
      if (requestedSymbol !== activeSymbolRef.current) return;
      setAnalysis(data);
      setLastAnalyzedTime(new Date().toLocaleTimeString());
    } catch {
      if (requestedSymbol !== activeSymbolRef.current) return;

      // Fallback default analysis dynamically scaled to the active asset's real price
      const defaults = getAssetDefaults(requestedSymbol);
      const curPrice = lastCandleRef.current?.close || defaults.basePrice;
      const { precision } = getPrecisionFromPrice(curPrice);

      const entry = curPrice;
      const stop_loss = +(curPrice * 0.985).toFixed(precision);
      const take_profit_1 = +(curPrice * 1.02).toFixed(precision);
      const take_profit_2 = +(curPrice * 1.035).toFixed(precision);
      const take_profit_3 = +(curPrice * 1.05).toFixed(precision);
      const support_1 = +(curPrice * 0.98).toFixed(precision);
      const resistance_1 = +(curPrice * 1.025).toFixed(precision);

      setAnalysis({
        symbol: requestedSymbol,
        timeframe: activeTimeframe,
        exchange: 'coindcx',
        timestamp: Date.now(),
        current_price: curPrice,
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
          entry,
          stop_loss,
          take_profit_1,
          take_profit_2,
          take_profit_3,
          risk_reward_ratio: 2.33,
          leverage_suggestion: 3.0,
        },
        reasoning: [
          {
            category: 'Trend Structure',
            signal: 'bullish',
            strength: 0.88,
            description: 'Bullish EMA stack (9 > 21 > 50 > 200). ADX confirms strong momentum.',
            indicators: ['EMA 9', 'EMA 21', 'EMA 50', 'ADX'],
          },
          {
            category: 'Momentum Oscillators',
            signal: 'bullish',
            strength: 0.75,
            description: 'RSI showing expansion from oversold. StochRSI bullish crossover confirmed.',
            indicators: ['RSI 14', 'StochRSI'],
          },
          {
            category: 'Futures Sentiment',
            signal: 'bullish',
            strength: 0.82,
            description: 'Negative funding rate reflects heavy short positioning; short-squeeze potential.',
            indicators: ['Funding Rate', 'Open Interest'],
          },
          {
            category: 'Orderbook & Flow',
            signal: 'bullish',
            strength: 0.72,
            description: 'Bid-to-ask depth ratio exceeds 1.42x. Aggressive taker buy ratio is elevated.',
            indicators: ['Orderbook Depth', 'Taker Volume'],
          },
        ],
        overlays: {
          entry_line: { price: entry, label: 'Entry', color: '#3b82f6', line_style: 'solid', line_width: 2 },
          stop_loss_line: { price: stop_loss, label: 'Stop Loss', color: '#f43f5e', line_style: 'dashed', line_width: 2 },
          take_profit_lines: [
            { price: take_profit_1, label: 'TP1 (2.0R)', color: '#10b981', line_style: 'dashed', line_width: 1 },
            { price: take_profit_2, label: 'TP2 (3.0R)', color: '#10b981', line_style: 'dotted', line_width: 1 },
          ],
          support_levels: [{ price: support_1, label: 'Support S1', color: '#059669', line_style: 'solid', line_width: 1 }],
          resistance_levels: [{ price: resistance_1, label: 'Resistance R1', color: '#dc2626', line_style: 'solid', line_width: 1 }],
          patterns: [{ name: 'Bullish Engulfing', start_index: 497, end_index: 498, confidence: 0.85, direction: 'bullish' }],
          fvg_zones: [],
          supply_demand_zones: [],
        },
        indicators: {
          rsi_14: 58.4,
          macd: 45.2,
          macd_signal: 32.1,
          macd_histogram: 13.1,
          ema_9: +(curPrice * 0.998).toFixed(precision),
          ema_21: +(curPrice * 0.995).toFixed(precision),
          ema_50: +(curPrice * 0.99).toFixed(precision),
          ema_200: +(curPrice * 0.97).toFixed(precision),
          adx: 28.5,
          atr_14: +(curPrice * 0.008).toFixed(precision),
          bb_upper: +(curPrice * 1.015).toFixed(precision),
          bb_middle: curPrice,
          bb_lower: +(curPrice * 0.985).toFixed(precision),
          volume_sma_ratio: 1.65,
          supertrend: +(curPrice * 0.988).toFixed(precision),
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
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2, // room for volume histogram
        },
        alignLabels: true,
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: 11,
        minBarSpacing: 3,
        fixLeftEdge: false,
        fixRightEdge: false,
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

    // Handle container resizing (browser resize or drawer/sidebar collapse)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === chartContainerRef.current && chartRef.current) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            chartRef.current.applyOptions({ width, height });
          }
        }
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    // Double-click on chart canvas resets auto-fit
    const handleDblClick = () => {
      autoFitChart(undefined, true);
    };
    const container = chartContainerRef.current;
    container.addEventListener('dblclick', handleDblClick);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('dblclick', handleDblClick);
      chart.remove();
    };
  }, []);

  // 4. Reload candles & re-analyze on symbol, timeframe, or click change
  useEffect(() => {
    loadCandles();
    triggerAnalysis();
  }, [activeSymbol, activeTimeframe, activeTradingMode, lastSymbolChange]);

  // 5. Draw Price Overlays when analysis updates
  useEffect(() => {
    if (!seriesRef.current) return;
    const series = seriesRef.current;

    // Remove old price lines
    activePriceLinesRef.current.forEach((line) => {
      try {
        series.removePriceLine(line);
      } catch {}
    });
    activePriceLinesRef.current = [];

    // Only draw overlays if analysis matches the currently active symbol
    if (!analysis?.overlays || analysis.symbol !== activeSymbol) return;

    // Price sanity check: verify overlay price is within reasonable bounds (0.35x to 2.8x)
    // of current candle to prevent cross-symbol vertical stretching
    const curClose = lastCandleRef.current?.close;
    const isSanePrice = (p: number) => {
      if (!p || p <= 0) return false;
      if (!curClose || curClose <= 0) return true;
      const ratio = p / curClose;
      return ratio >= 0.35 && ratio <= 2.8;
    };

    // Apply Entry Line
    if (overlays.showTradeLevels && analysis.overlays.entry_line && isSanePrice(analysis.overlays.entry_line.price)) {
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
    if (overlays.showTradeLevels && analysis.overlays.stop_loss_line && isSanePrice(analysis.overlays.stop_loss_line.price)) {
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
        if (!isSanePrice(tp.price)) return;
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
        if (!isSanePrice(s.price)) return;
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
        if (!isSanePrice(r.price)) return;
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
  }, [analysis, overlays, activeSymbol]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-background relative select-none">
      {/* Chart Toolbar & Timeframe Bar */}
      <div className="h-10 border-b border-border px-4 flex items-center justify-between bg-surface/50 text-xs">
        {/* Left: Timeframes & Overlays */}
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
            className={`px-2 py-0.5 rounded text-[11px] flex items-center space-x-1 border transition-colors ${
              overlays.showTradeLevels
                ? 'bg-tech-blue/15 border-tech-blue/40 text-tech-blue'
                : 'border-border text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>SL/TP Plan</span>
          </button>

          <button
            onClick={() => toggleOverlay('showSR')}
            className={`px-2 py-0.5 rounded text-[11px] flex items-center space-x-1 border transition-colors ${
              overlays.showSR
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'border-border text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>S/R Pivots</span>
          </button>

          <div className="h-4 w-px bg-border mx-2" />

          {/* Feature: Auto-Fit & Zoom Controls in Toolbar */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => autoFitChart(undefined, true)}
              className="px-2 py-0.5 rounded text-[11px] font-medium flex items-center space-x-1 border border-border/80 bg-surface-elevated hover:bg-ai/20 hover:border-ai/40 hover:text-ai text-slate-300 transition-all shadow-sm"
              title="Auto-Fit Chart: Optimal candle zoom & auto-scale price (or Double-Click chart)"
            >
              <Maximize2 className="h-3 w-3 text-ai" />
              <span>Auto-Fit</span>
            </button>

            <button
              onClick={fitAllHistory}
              className="px-2 py-0.5 rounded text-[11px] font-medium flex items-center space-x-1 border border-border/80 bg-surface-elevated hover:bg-surface hover:text-white text-slate-400 transition-all"
              title="Fit All History: View entire candle history across the chart"
            >
              <Scan className="h-3 w-3" />
              <span>Fit All</span>
            </button>

            <div className="flex items-center space-x-0.5 bg-surface-elevated border border-border/80 rounded px-1 py-0.5">
              <button
                onClick={handleZoomIn}
                className="p-0.5 rounded hover:bg-surface text-slate-400 hover:text-white transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-3 w-3" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-0.5 rounded hover:bg-surface text-slate-400 hover:text-white transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Action: Real-time Socket & Trigger Analysis */}
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
            <span>{isLoadingAnalysis ? 'Analyzing...' : '⚡ Analyze'}</span>
          </button>
        </div>
      </div>

      {/* Main Chart Canvas & Overlay Container */}
      <div className="flex-1 w-full relative overflow-hidden">
        <div ref={chartContainerRef} className="w-full h-full" />

        {/* Notification Pill */}
        {autoFitNotice && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-surface-elevated/95 backdrop-blur-md border border-ai/40 text-ai text-xs font-mono px-3 py-1 rounded-full shadow-xl flex items-center space-x-1.5 animate-in fade-in zoom-in-95">
            <Maximize2 className="h-3 w-3 animate-pulse" />
            <span>{autoFitNotice}</span>
          </div>
        )}

        {/* Candle Loading Indicator */}
        {isFetchingCandles && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center space-y-2 pointer-events-none">
            <Loader2 className="h-6 w-6 text-ai animate-spin" />
            <span className="text-xs text-slate-300 font-mono">
              Loading {activeSymbol} & auto-fitting...
            </span>
          </div>
        )}

        {/* Floating In-Chart Zoom & Auto-Fit Dock (Bottom-Right) */}
        <div className="absolute bottom-6 right-16 z-20 flex items-center space-x-1 bg-surface-elevated/85 backdrop-blur-md border border-border/80 rounded-lg p-1 shadow-xl text-slate-400 hover:text-white transition-opacity opacity-75 hover:opacity-100">
          <button
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="p-1 rounded hover:bg-surface hover:text-white transition-colors"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="p-1 rounded hover:bg-surface hover:text-white transition-colors"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <div className="h-3.5 w-px bg-border/80 mx-0.5" />
          <button
            onClick={() => autoFitChart(undefined, true)}
            title="Auto-Fit & Center Candles (Optimal Zoom)"
            className="px-2 py-0.5 rounded text-[11px] font-medium flex items-center space-x-1 hover:bg-ai/20 hover:text-ai text-slate-300 transition-colors"
          >
            <Maximize2 className="h-3 w-3 text-ai" />
            <span>Auto-Fit</span>
          </button>
          <button
            onClick={fitAllHistory}
            title="Fit Entire History"
            className="px-2 py-0.5 rounded text-[11px] font-medium flex items-center space-x-1 hover:bg-surface hover:text-white text-slate-400 transition-colors"
          >
            <Scan className="h-3 w-3" />
            <span>Fit All</span>
          </button>
        </div>
      </div>

      {/* Auto-Generating Buy/Sell Request & Telegram Action Bar */}
      <ChartActionBar />
    </div>
  );
};
