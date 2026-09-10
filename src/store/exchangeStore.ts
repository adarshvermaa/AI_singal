import { create } from 'zustand';
import { BalanceItem, PositionItem } from '../types';

interface ExchangeState {
  isConnected: boolean;
  userName: string | null;
  selectedExchange: string;
  balances: BalanceItem[];
  positions: PositionItem[];
  isLoadingBalances: boolean;
  isLoadingPositions: boolean;
  isConnectModalOpen: boolean;
  isDemo: boolean;

  // Actions
  setIsConnected: (connected: boolean) => void;
  setIsDemo: (isDemo: boolean) => void;
  setUserName: (name: string | null) => void;
  setSelectedExchange: (exchange: string) => void;
  setBalances: (balances: BalanceItem[]) => void;
  setPositions: (positions: PositionItem[]) => void;
  setIsLoadingBalances: (loading: boolean) => void;
  setIsLoadingPositions: (loading: boolean) => void;
  setIsConnectModalOpen: (open: boolean) => void;
}

export const useExchangeStore = create<ExchangeState>((set) => ({
  isConnected: false,
  isDemo: false,
  userName: null,
  selectedExchange: 'coindcx',
  balances: [],
  positions: [],
  isLoadingBalances: false,
  isLoadingPositions: false,
  isConnectModalOpen: false,

  setIsConnected: (connected) => set({ isConnected: connected }),
  setIsDemo: (isDemo) => set({ isDemo }),
  setUserName: (name) => set({ userName: name }),
  setSelectedExchange: (exchange) => set({ selectedExchange: exchange }),
  setBalances: (balances) => set({ balances }),
  setPositions: (positions) => set({ positions }),
  setIsLoadingBalances: (loading) => set({ isLoadingBalances: loading }),
  setIsLoadingPositions: (loading) => set({ isLoadingPositions: loading }),
  setIsConnectModalOpen: (open) => set({ isConnectModalOpen: open }),
}));
