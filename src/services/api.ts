import axios from 'axios';
import {
  AnalyzeResponse,
  MarketItem,
  BalanceItem,
  PositionItem,
  TradingMode,
  WebhookLogItem,
  WebhookConfigResponse,
  TelegramStatusResponse,
  TelegramDetectedChat,
  TelegramSendSignalParams,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const api = {
  // Health
  checkHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Analysis
  analyze: async (symbol: string, timeframe: string = '15m', mode: TradingMode = 'futures'): Promise<AnalyzeResponse> => {
    const res = await apiClient.post('/analyze', {
      symbol,
      timeframe,
      exchange: 'coindcx',
      trading_mode: mode,
    });
    return res.data;
  },

  // Markets
  getMarkets: async (quote?: string, search?: string): Promise<{ count: number; markets: MarketItem[] }> => {
    const params: Record<string, string> = { exchange: 'coindcx' };
    if (quote) params.quote = quote;
    if (search) params.search = search;
    const res = await apiClient.get('/markets', { params });
    return res.data;
  },

  getCandles: async (
    symbol: string,
    interval: string = '15m',
    mode: TradingMode = 'futures',
    limit: number = 200
  ): Promise<{ time: number; open: number; high: number; low: number; close: number; volume: number }[]> => {
    const res = await apiClient.get('/markets/candles', {
      params: { symbol, interval, trading_mode: mode, limit, exchange: 'coindcx' },
    });
    return res.data.candles || [];
  },

  // Exchange
  getExchangeStatus: async (): Promise<{ connected: string[]; authenticated: boolean; is_demo?: boolean; user_name: string | null; message: string | null }> => {
    const res = await apiClient.get('/exchange/status', {
      params: { exchange: 'coindcx' },
    });
    return res.data;
  },

  connectExchange: async (
    apiKey: string,
    apiSecret: string
  ): Promise<{ exchange: string; status: string; message: string; user_name?: string | null; is_demo?: boolean }> => {
    const res = await apiClient.post('/exchange/connect', {
      exchange: 'coindcx',
      api_key: apiKey,
      api_secret: apiSecret,
    });
    return res.data;
  },

  disconnectExchange: async (): Promise<{ status: string }> => {
    const res = await apiClient.post('/exchange/disconnect', null, {
      params: { exchange: 'coindcx' },
    });
    return res.data;
  },

  getBalances: async (): Promise<BalanceItem[]> => {
    const res = await apiClient.get('/exchange/balances', {
      params: { exchange: 'coindcx' },
    });
    return res.data.balances || [];
  },

  getPositions: async (): Promise<PositionItem[]> => {
    const res = await apiClient.get('/exchange/positions', {
      params: { exchange: 'coindcx' },
    });
    return res.data.positions || [];
  },

  // Trade
  executeTrade: async (params: {
    symbol: string;
    side: 'buy' | 'sell';
    tradingMode: TradingMode;
    orderType?: string;
    quantity?: number;
    price?: number;
    leverage?: number;
    stopLoss?: number;
    takeProfit?: number;
    autoSize?: boolean;
  }) => {
    const res = await apiClient.post('/trade/execute', {
      exchange: 'coindcx',
      symbol: params.symbol,
      side: params.side,
      trading_mode: params.tradingMode,
      order_type: params.orderType || 'market_order',
      quantity: params.quantity,
      price: params.price,
      leverage: params.leverage || 3.0,
      stop_loss: params.stopLoss,
      take_profit: params.takeProfit,
      auto_size: params.autoSize ?? true,
    });
    return res.data;
  },

  closePosition: async (positionId: string, mode: TradingMode = 'futures') => {
    const res = await apiClient.post('/trade/close', {
      exchange: 'coindcx',
      position_id: positionId,
      trading_mode: mode,
    });
    return res.data;
  },

  // Webhook
  getWebhookConfig: async (): Promise<WebhookConfigResponse> => {
    const res = await apiClient.get('/webhook/config');
    return res.data;
  },

  getWebhookLogs: async (): Promise<WebhookLogItem[]> => {
    const res = await apiClient.get('/webhook/logs');
    return res.data;
  },

  // Telegram
  getTelegramStatus: async (): Promise<TelegramStatusResponse> => {
    const res = await apiClient.get('/telegram/status');
    return res.data;
  },

  detectTelegramChat: async (): Promise<{ count: number; chats: TelegramDetectedChat[]; instruction: string }> => {
    const res = await apiClient.get('/telegram/detect-chat');
    return res.data;
  },

  updateTelegramConfig: async (config: { chat_id?: string; auto_send?: boolean; min_confidence?: number; bot_token?: string }) => {
    const res = await apiClient.post('/telegram/config', config);
    return res.data;
  },

  sendTelegramSignal: async (params: TelegramSendSignalParams): Promise<{ status: string; message_id?: number; chat: string }> => {
    const res = await apiClient.post('/telegram/send', params);
    return res.data;
  },

  testTelegramMessage: async (chatId?: string): Promise<{ status: string; message_id?: number; chat: string }> => {
    const res = await apiClient.post('/telegram/test', { chat_id: chatId });
    return res.data;
  },
};
