import { create } from 'zustand';
import { WebhookConfigResponse, WebhookLogItem } from '../types';
import { api } from '../services/api';

interface WebhookState {
  isWebhookModalOpen: boolean;
  config: WebhookConfigResponse | null;
  logs: WebhookLogItem[];
  isLoadingConfig: boolean;
  isLoadingLogs: boolean;
  error: string | null;

  // Actions
  setIsWebhookModalOpen: (open: boolean) => void;
  fetchConfig: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  addLogItem: (item: WebhookLogItem) => void;
}

export const useWebhookStore = create<WebhookState>((set, get) => ({
  isWebhookModalOpen: false,
  config: null,
  logs: [],
  isLoadingConfig: false,
  isLoadingLogs: false,
  error: null,

  setIsWebhookModalOpen: (open) => {
    set({ isWebhookModalOpen: open });
    if (open) {
      get().fetchConfig();
      get().fetchLogs();
    }
  },

  fetchConfig: async () => {
    set({ isLoadingConfig: true, error: null });
    try {
      const config = await api.getWebhookConfig();
      set({ config, isLoadingConfig: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || err.message || 'Failed to fetch webhook config',
        isLoadingConfig: false,
      });
    }
  },

  fetchLogs: async () => {
    set({ isLoadingLogs: true });
    try {
      const logs = await api.getWebhookLogs();
      set({ logs, isLoadingLogs: false });
    } catch (err: any) {
      set({ isLoadingLogs: false });
    }
  },

  addLogItem: (item: WebhookLogItem) => {
    set((state) => ({
      logs: [item, ...state.logs.filter((l) => l.id !== item.id)].slice(0, 50),
    }));
  },
}));
