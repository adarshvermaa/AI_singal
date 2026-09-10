import { create } from 'zustand';
import { AnalyzeResponse, TradingMode } from '../types';

interface OverlaySettings {
  showSR: boolean;
  showFVG: boolean;
  showPatterns: boolean;
  showTradeLevels: boolean;
}

interface TerminalState {
  activeSymbol: string;
  activeTimeframe: string;
  activeTradingMode: TradingMode;
  analysis: AnalyzeResponse | null;
  isLoadingAnalysis: boolean;
  analysisError: string | null;
  overlays: OverlaySettings;
  soundEnabled: boolean;
  autoTradeEnabled: boolean;
  executionMode: 'manual' | 'semi-auto' | 'auto';
  pendingTradeProposal: {
    symbol: string;
    side: 'buy' | 'sell';
    confidence: number;
    price: number;
    sl: number;
    tp: number;
    tradingMode: TradingMode;
  } | null;

  // Actions
  setActiveSymbol: (symbol: string) => void;
  setActiveTimeframe: (timeframe: string) => void;
  setActiveTradingMode: (mode: TradingMode) => void;
  setAnalysis: (analysis: AnalyzeResponse | null) => void;
  setIsLoadingAnalysis: (loading: boolean) => void;
  setAnalysisError: (error: string | null) => void;
  toggleOverlay: (key: keyof OverlaySettings) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setAutoTradeEnabled: (enabled: boolean) => void;
  setExecutionMode: (mode: 'manual' | 'semi-auto' | 'auto') => void;
  setPendingTradeProposal: (proposal: {
    symbol: string;
    side: 'buy' | 'sell';
    confidence: number;
    price: number;
    sl: number;
    tp: number;
    tradingMode: TradingMode;
  } | null) => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  activeSymbol: 'B-BTC_USDT',
  activeTimeframe: '15m',
  activeTradingMode: 'futures',
  analysis: null,
  isLoadingAnalysis: false,
  analysisError: null,
  overlays: {
    showSR: true,
    showFVG: true,
    showPatterns: true,
    showTradeLevels: true,
  },
  soundEnabled: true,
  autoTradeEnabled: false,
  executionMode: 'manual',
  pendingTradeProposal: null,

  setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
  setActiveTimeframe: (timeframe) => set({ activeTimeframe: timeframe }),
  setActiveTradingMode: (mode) => set({ activeTradingMode: mode }),
  setAnalysis: (analysis) => set({ analysis, analysisError: null }),
  setIsLoadingAnalysis: (loading) => set({ isLoadingAnalysis: loading }),
  setAnalysisError: (error) => set({ analysisError: error }),
  toggleOverlay: (key) =>
    set((state) => ({
      overlays: { ...state.overlays, [key]: !state.overlays[key] },
    })),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setAutoTradeEnabled: (enabled) =>
    set({ autoTradeEnabled: enabled, executionMode: enabled ? 'auto' : 'manual' }),
  setExecutionMode: (mode) =>
    set({ executionMode: mode, autoTradeEnabled: mode === 'auto' }),
  setPendingTradeProposal: (proposal) => set({ pendingTradeProposal: proposal }),
}));
