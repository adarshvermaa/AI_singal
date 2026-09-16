import { create } from 'zustand';
import { TelegramBotInfo } from '../types';

interface TelegramState {
  botToken: string;
  botInfo: TelegramBotInfo | null;
  chatId: string;
  autoBroadcast: boolean;
  minConfidence: number;
  isConfigModalOpen: boolean;
  isSending: boolean;
  lastBroadcastStatus: {
    type: 'success' | 'error';
    message: string;
    timestamp: number;
  } | null;

  // Actions
  setBotInfo: (info: TelegramBotInfo | null) => void;
  setChatId: (chatId: string) => void;
  setAutoBroadcast: (auto: boolean) => void;
  setMinConfidence: (confidence: number) => void;
  setIsConfigModalOpen: (open: boolean) => void;
  setIsSending: (sending: boolean) => void;
  setLastBroadcastStatus: (status: { type: 'success' | 'error'; message: string; timestamp: number } | null) => void;
}

export const useTelegramStore = create<TelegramState>((set) => ({
  botToken: '8978992155:AAF6k9I0k61hYI97TfuuKDVAq_5_pGT7Rf0',
  botInfo: {
    id: 8978992155,
    is_bot: true,
    first_name: 'ALPHX Signal Bot',
    username: 'alphx_signal_bot',
  },
  chatId: '',
  autoBroadcast: false,
  minConfidence: 0.70,
  isConfigModalOpen: false,
  isSending: false,
  lastBroadcastStatus: null,

  setBotInfo: (info) => set({ botInfo: info }),
  setChatId: (chatId) => set({ chatId }),
  setAutoBroadcast: (auto) => set({ autoBroadcast: auto }),
  setMinConfidence: (confidence) => set({ minConfidence: confidence }),
  setIsConfigModalOpen: (open) => set({ isConfigModalOpen: open }),
  setIsSending: (sending) => set({ isSending: sending }),
  setLastBroadcastStatus: (status) => set({ lastBroadcastStatus: status }),
}));
