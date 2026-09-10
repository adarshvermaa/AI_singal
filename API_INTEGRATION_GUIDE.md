# AI Crypto Trading Platform — Frontend Integration & API Guide

This guide provides everything needed to build and connect the frontend UI (Next.js / React / Vite) with the AI Signal Backend.

---

## 1. Connection Details

- **REST Base URL:** `http://localhost:8000/api`
- **WebSocket URL:** `ws://localhost:8000/api/ws`
- **Default Headers:**
  ```json
  {
    "Content-Type": "application/json"
  }
  ```

---

## 2. API Endpoints Reference

### A. Health Check
- **Endpoint:** `GET /health`
- **Purpose:** Check if backend is alive, which exchanges are connected, and if ML models are ready.
- **Response:**
  ```json
  {
    "status": "healthy",
    "version": "1.0.0",
    "exchange_connections": ["coindcx"],
    "models_loaded": true
  }
  ```

---

### B. Exchange Management

#### 1. Connect Exchange (CoinDCX)
- **Endpoint:** `POST /exchange/connect`
- **Payload:**
  ```json
  {
    "exchange": "coindcx",
    "api_key": "YOUR_COINDCX_API_KEY",
    "api_secret": "YOUR_COINDCX_API_SECRET"
  }
  ```
- **Response (Success):**
  ```json
  {
    "exchange": "coindcx",
    "status": "connected",
    "message": "Successfully connected to coindcx",
    "user_name": "Adarsh"
  }
  ```

#### 2. Get Exchange Status
- **Endpoint:** `GET /exchange/status`
- **Response:**
  ```json
  {
    "connected": ["coindcx"],
    "supported": [
      {
        "name": "coindcx",
        "display_name": "CoinDCX",
        "supports": ["spot", "margin", "futures"],
        "status": "active"
      },
      {
        "name": "wazirx",
        "display_name": "WazirX",
        "supports": ["spot"],
        "status": "coming_soon"
      },
      {
        "name": "binance",
        "display_name": "Binance",
        "supports": ["spot", "margin", "futures"],
        "status": "coming_soon"
      }
    ]
  }
  ```

#### 3. Get Balances
- **Endpoint:** `GET /exchange/balances?exchange=coindcx`
- **Response:**
  ```json
  {
    "exchange": "coindcx",
    "balances": [
      {
        "currency": "USDT",
        "available": 1250.50,
        "locked": 100.00,
        "total": 1350.50
      },
      {
        "currency": "INR",
        "available": 25000.00,
        "locked": 0.00,
        "total": 25000.00
      }
    ]
  }
  ```

#### 4. Get Active Positions
- **Endpoint:** `GET /exchange/positions?exchange=coindcx`
- **Response:**
  ```json
  {
    "exchange": "coindcx",
    "positions": [
      {
        "id": "pos_12345",
        "pair": "B-BTC_USDT",
        "side": "long",
        "quantity": 0.05,
        "entry_price": 68200.0,
        "mark_price": 68650.0,
        "leverage": 5.0,
        "unrealized_pnl": 22.50,
        "liquidation_price": 55400.0,
        "take_profit": 69500.0,
        "stop_loss": 67500.0
      }
    ]
  }
  ```

---

### C. Markets & Instruments

#### 1. List Available Pairs
- **Endpoint:** `GET /markets?quote=USDT&search=BTC`
- **Query Params:**
  - `exchange` (default: `"coindcx"`)
  - `quote` (optional, e.g. `"USDT"`, `"INR"`)
  - `search` (optional, e.g. `"BTC"`, `"ETH"`)
- **Response:**
  ```json
  {
    "exchange": "coindcx",
    "count": 1,
    "markets": [
      {
        "pair": "B-BTC_USDT",
        "base_currency": "BTC",
        "quote_currency": "USDT",
        "last_price": 68510.5,
        "change_24h": 2.45,
        "volume_24h": 15420000.0,
        "max_leverage": 25.0,
        "trading_modes": ["spot", "margin", "futures"],
        "is_active": true
      }
    ]
  }
  ```

---

### D. AI Market Analysis & Signals (Primary UI Trigger)

When the user clicks a timeframe button (e.g., `15m`) or selects a pair, send this request.

- **Endpoint:** `POST /analyze`
- **Payload:**
  ```json
  {
    "symbol": "B-BTC_USDT",
    "timeframe": "15m",
    "exchange": "coindcx",
    "trading_mode": "futures"
  }
  ```

- **Full Response:**
  ```json
  {
    "symbol": "B-BTC_USDT",
    "timeframe": "15m",
    "exchange": "coindcx",
    "timestamp": 1725800000000,
    "current_price": 68510.5,
    "market_regime": "trending",
    "funding_rate": -0.00015,
    "long_short_ratio": 1.12,
    "volume_24h": 15420000.0,
    "signal": {
      "direction": "BUY",
      "confidence": 0.84,
      "model_agreement": "UNANIMOUS",
      "model_votes": [
        {
          "model_name": "xgboost",
          "direction": "BUY",
          "buy_prob": 0.82,
          "hold_prob": 0.11,
          "sell_prob": 0.07
        },
        {
          "model_name": "lstm",
          "direction": "BUY",
          "buy_prob": 0.86,
          "hold_prob": 0.09,
          "sell_prob": 0.05
        },
        {
          "model_name": "lightgbm",
          "direction": "BUY",
          "buy_prob": 0.84,
          "hold_prob": 0.10,
          "sell_prob": 0.06
        }
      ]
    },
    "levels": {
      "entry": 68510.5,
      "stop_loss": 67820.0,
      "take_profit_1": 69430.0,
      "take_profit_2": 70120.0,
      "take_profit_3": 71150.0,
      "risk_reward_ratio": 2.33,
      "leverage_suggestion": 3.0
    },
    "reasoning": [
      {
        "category": "Trend",
        "signal": "bullish",
        "strength": 0.88,
        "description": "Bullish EMA stack (EMA 9 > 21 > 50 > 200). ADX at 28.5 indicates strong upward trend momentum.",
        "indicators": ["EMA 9", "EMA 21", "EMA 50", "EMA 200", "ADX"]
      },
      {
        "category": "Momentum",
        "signal": "bullish",
        "strength": 0.75,
        "description": "RSI at 58 showing healthy upside expansion. StochRSI bullish cross verified in lower quartile.",
        "indicators": ["RSI 14", "StochRSI"]
      },
      {
        "category": "Futures Sentiment",
        "signal": "bullish",
        "strength": 0.80,
        "description": "Negative funding rate (-0.015%) shows aggressive short positioning; elevated potential for short squeeze.",
        "indicators": ["Funding Rate", "Open Interest"]
      },
      {
        "category": "Microstructure",
        "signal": "bullish",
        "strength": 0.72,
        "description": "Order book bid depth exceeds ask depth by 1.42x. Aggressive taker buy ratio is 61%.",
        "indicators": ["OrderBook Imbalance", "Taker Volume"]
      }
    ],
    "overlays": {
      "entry_line": {
        "price": 68510.5,
        "label": "Entry",
        "color": "#2196F3",
        "line_style": "solid",
        "line_width": 2
      },
      "stop_loss_line": {
        "price": 67820.0,
        "label": "Stop Loss",
        "color": "#F44336",
        "line_style": "dashed",
        "line_width": 2
      },
      "take_profit_lines": [
        {
          "price": 69430.0,
          "label": "TP1",
          "color": "#4CAF50",
          "line_style": "dashed",
          "line_width": 1
        },
        {
          "price": 70120.0,
          "label": "TP2",
          "color": "#4CAF50",
          "line_style": "dotted",
          "line_width": 1
        }
      ],
      "support_levels": [
        {"price": 67450.0, "label": "Key Support S1", "color": "#00E676", "line_style": "solid", "line_width": 1}
      ],
      "resistance_levels": [
        {"price": 69800.0, "label": "Key Resistance R1", "color": "#FF5252", "line_style": "solid", "line_width": 1}
      ],
      "patterns": [
        {
          "name": "Bullish Engulfing",
          "start_index": 497,
          "end_index": 498,
          "confidence": 0.85,
          "direction": "bullish"
        }
      ],
      "fvg_zones": [
        {
          "upper": 68350.0,
          "lower": 68150.0,
          "label": "Bullish FVG Zone",
          "color": "#2196F3",
          "opacity": 0.25
        }
      ]
    },
    "indicators": {
      "rsi_14": 58.4,
      "macd": 45.2,
      "macd_signal": 32.1,
      "macd_histogram": 13.1,
      "ema_9": 68420.0,
      "ema_21": 68250.0,
      "ema_50": 67900.0,
      "ema_200": 66500.0,
      "adx": 28.5,
      "atr_14": 460.0,
      "bb_upper": 69100.0,
      "bb_middle": 68300.0,
      "bb_lower": 67500.0,
      "volume_sma_ratio": 1.65,
      "supertrend": 67950.0,
      "supertrend_direction": 1
    }
  }
  ```

---

### E. Order Execution

#### 1. Execute Trade from Signal
- **Endpoint:** `POST /trade/execute`
- **Payload:**
  ```json
  {
    "exchange": "coindcx",
    "symbol": "B-BTC_USDT",
    "side": "buy",
    "trading_mode": "futures",
    "order_type": "market_order",
    "leverage": 3.0,
    "auto_size": true,
    "stop_loss": 67820.0,
    "take_profit": 69430.0
  }
  ```
- **Response:**
  ```json
  {
    "status": "executed",
    "order_id": "1849204859",
    "exchange": "coindcx",
    "trading_mode": "futures",
    "side": "buy",
    "quantity": 0.045,
    "price": 68510.5,
    "leverage": 3.0,
    "stop_loss": 67820.0,
    "take_profit": 69430.0,
    "message": "Order placed successfully on coindcx"
  }
  ```

#### 2. Close Position
- **Endpoint:** `POST /trade/close`
- **Payload:**
  ```json
  {
    "exchange": "coindcx",
    "position_id": "pos_12345",
    "trading_mode": "futures"
  }
  ```
- **Response:**
  ```json
  {
    "status": "closed",
    "position_id": "pos_12345",
    "exchange": "coindcx"
  }
  ```

---

## 3. Real-time WebSocket Protocol

Frontend connects to:
```ts
const ws = new WebSocket("ws://localhost:8000/api/ws");
```

### Subscribing to Channels:
```json
// Subscribe to candle updates
{"action": "subscribe", "channel": "candles:B-BTC_USDT:15m"}

// Subscribe to signals
{"action": "subscribe", "channel": "signals:B-BTC_USDT"}

// Ping to keep connection alive every 30s
{"action": "ping"}
```

---

## 4. Frontend Implementation Snippets

### A. TypeScript API Service (`src/services/api.ts`)
```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function analyzePair(symbol: string, timeframe: string = '15m', mode: string = 'futures') {
  const res = await apiClient.post('/analyze', {
    symbol,
    timeframe,
    exchange: 'coindcx',
    trading_mode: mode,
  });
  return res.data;
}

export async function executeTrade(params: {
  symbol: string;
  side: 'buy' | 'sell';
  mode?: 'spot' | 'margin' | 'futures';
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
}) {
  const res = await apiClient.post('/trade/execute', {
    exchange: 'coindcx',
    symbol: params.symbol,
    side: params.side,
    trading_mode: params.mode || 'futures',
    order_type: 'market_order',
    leverage: params.leverage || 3.0,
    auto_size: true,
    stop_loss: params.stopLoss,
    take_profit: params.takeProfit,
  });
  return res.data;
}

export async function fetchBalances() {
  const res = await apiClient.get('/exchange/balances?exchange=coindcx');
  return res.data.balances;
}

export async function fetchPositions() {
  const res = await apiClient.get('/exchange/positions?exchange=coindcx');
  return res.data.positions;
}
```

### B. Drawing AI Overlays on TradingView Lightweight Charts
```typescript
import { IChartApi, ISeriesApi } from 'lightweight-charts';

export function applyAIOverlays(
  chart: IChartApi,
  candleSeries: ISeriesApi<'Candlestick'>,
  overlays: any
) {
  // 1. Draw Entry Line
  if (overlays.entry_line) {
    candleSeries.createPriceLine({
      price: overlays.entry_line.price,
      color: overlays.entry_line.color,
      lineWidth: overlays.entry_line.line_width,
      lineStyle: 0, // Solid
      axisLabelVisible: true,
      title: overlays.entry_line.label,
    });
  }

  // 2. Draw Stop Loss
  if (overlays.stop_loss_line) {
    candleSeries.createPriceLine({
      price: overlays.stop_loss_line.price,
      color: overlays.stop_loss_line.color,
      lineWidth: overlays.stop_loss_line.line_width,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: overlays.stop_loss_line.label,
    });
  }

  // 3. Draw Take Profits
  overlays.take_profit_lines?.forEach((tp: any) => {
    candleSeries.createPriceLine({
      price: tp.price,
      color: tp.color,
      lineWidth: tp.line_width,
      lineStyle: 1, // Dotted
      axisLabelVisible: true,
      title: tp.label,
    });
  });

  // 4. Draw Support & Resistance
  overlays.support_levels?.forEach((lvl: any) => {
    candleSeries.createPriceLine({
      price: lvl.price,
      color: lvl.color,
      lineWidth: 1,
      lineStyle: 0,
      title: lvl.label,
    });
  });

  overlays.resistance_levels?.forEach((lvl: any) => {
    candleSeries.createPriceLine({
      price: lvl.price,
      color: lvl.color,
      lineWidth: 1,
      lineStyle: 0,
      title: lvl.label,
    });
  });
}
```
