export type TradingMode = 'spot' | 'margin' | 'futures';
export type SignalDirection = 'BUY' | 'SELL' | 'HOLD';

export interface ModelVote {
  model_name: string;
  direction: SignalDirection;
  buy_prob: number;
  hold_prob: number;
  sell_prob: number;
}

export interface SignalResult {
  direction: SignalDirection;
  confidence: number;
  model_agreement: 'UNANIMOUS' | 'MAJORITY' | 'SPLIT';
  model_votes: ModelVote[];
}

export interface TradeLevels {
  entry: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2?: number;
  take_profit_3?: number;
  risk_reward_ratio: number;
  position_size_suggestion?: number;
  leverage_suggestion?: number;
}

export interface ReasoningItem {
  category: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  description: string;
  indicators: string[];
}

export interface ChartLevel {
  price: number;
  label: string;
  color: string;
  line_style?: 'solid' | 'dashed' | 'dotted';
  line_width?: number;
}

export interface ChartPattern {
  name: string;
  start_index: number;
  end_index: number;
  confidence: number;
  direction: 'bullish' | 'bearish';
}

export interface ChartZone {
  upper: number;
  lower: number;
  label: string;
  color: string;
  opacity?: number;
}

export interface ChartOverlays {
  support_levels: ChartLevel[];
  resistance_levels: ChartLevel[];
  entry_line?: ChartLevel;
  stop_loss_line?: ChartLevel;
  take_profit_lines: ChartLevel[];
  patterns: ChartPattern[];
  fvg_zones: ChartZone[];
  supply_demand_zones: ChartZone[];
}

export interface IndicatorValues {
  rsi_14?: number;
  rsi_7?: number;
  macd?: number;
  macd_signal?: number;
  macd_histogram?: number;
  ema_9?: number;
  ema_21?: number;
  ema_50?: number;
  ema_200?: number;
  adx?: number;
  atr_14?: number;
  bb_upper?: number;
  bb_middle?: number;
  bb_lower?: number;
  bb_percent?: number;
  stoch_k?: number;
  stoch_d?: number;
  obv?: number;
  vwap?: number;
  cmf?: number;
  mfi?: number;
  volume_sma_ratio?: number;
  supertrend?: number;
  supertrend_direction?: number;
}

export interface AnalyzeResponse {
  symbol: string;
  timeframe: string;
  exchange: string;
  timestamp: number;
  current_price: number;
  market_regime: string;
  funding_rate?: number;
  long_short_ratio?: number;
  volume_24h?: number;
  signal: SignalResult;
  levels?: TradeLevels;
  reasoning: ReasoningItem[];
  overlays: ChartOverlays;
  indicators: IndicatorValues;
}

export interface MarketItem {
  pair: string;
  base_currency: string;
  quote_currency: string;
  last_price?: number;
  change_24h?: number;
  volume_24h?: number;
  max_leverage: number;
  trading_modes: string[];
  is_active: boolean;
}

export interface BalanceItem {
  currency: string;
  available: number;
  locked: number;
  total: number;
}

export interface PositionItem {
  id: string;
  pair: string;
  side: 'long' | 'short';
  quantity: number;
  entry_price: number;
  mark_price: number;
  leverage: number;
  unrealized_pnl: number;
  liquidation_price: number;
  take_profit: number;
  stop_loss: number;
}

export interface WebhookLogItem {
  id: string;
  timestamp: number;
  symbol: string;
  action: string;
  trading_mode: string;
  status: string; // 'executed' | 'rejected_by_ai' | 'invalid_secret' | 'failed'
  ai_verdict?: string;
  ai_confidence?: number;
  order_id?: string;
  message: string;
}

export interface WebhookConfigResponse {
  webhook_url: string;
  coindcx_webhook_url?: string;
  secret_key: string;
  ai_filter_enabled: boolean;
  templates: Record<string, Record<string, any>>;
}
