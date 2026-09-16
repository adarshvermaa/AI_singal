# ALPHX Institutional Trading Terminal
### Next.js 14 Algorithmic Cryptocurrency Interface & TradingView Analytics Suite

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-18.2-blue.svg?style=flat&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-4.5-orange.svg?style=flat)](https://zustand-demo.pmnd.rs)
[![TradingView](https://img.shields.io/badge/Lightweight_Charts-4.1-131722.svg?style=flat&logo=tradingview&logoColor=white)](https://tradingview.github.io/lightweight-charts/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ALPHX Terminal is an institutional-grade cryptocurrency web terminal built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, and **Zustand**. Designed for professional traders and quantitative researchers, it pairs with the ALPHX Quantitative Backend to visualize real-time candlestick charts with custom technical overlays (Support/Resistance, Fair Value Gaps, ATR levels), display multi-model consensus signals, manage dual-currency capital (**USD $ & INR ₹**), and execute orders seamlessly across **Manual**, **Semi-Automatic**, and **Autonomous Sentinel** modes.

---

## 📑 Table of Contents
1. [Interface & Layout Architecture](#-interface--layout-architecture)
2. [Core Feature Breakdown](#-core-feature-breakdown)
3. [Dual-Currency (USD $ & INR ₹) Precision System](#-dual-currency-usd---inr--precision-system)
4. [Execution Workflow Modes](#-execution-workflow-modes)
5. [Telegram Signal Broadcaster & Channel Linking](#-telegram-signal-broadcaster--channel-linking)
6. [Interactive TradingView Chart Canvas & Overlays](#-interactive-tradingview-chart-canvas--overlays)
7. [Project Structure](#-project-structure)
8. [Installation & Development Guide](#-installation--development-guide)
9. [Production Deployment](#-production-deployment)
10. [Environment Variables](#-environment-variables)
11. [License](#-license)

---

## 🖥 Interface & Layout Architecture

The terminal is engineered as a responsive, high-density 3-column workspace with persistent top and bottom telemetry docks:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR: Brand Logo │ Active Ticker ($ & ₹) │ Trading Mode (Futures/Margin/Spot) │ Balance Pill ($/₹) │ Controls  │
├──────────────────────┬────────────────────────────────────────────────────────────┬──────────────────────────────┤
│ LEFT: MARKET         │ CENTER: INTERACTIVE TRADINGVIEW CHART                      │ RIGHT: QUANTITATIVE HUB      │
│ SCREENER             │ • High-performance Candlestick Canvas                      │ • Quantitative Verdict Card  │
│ • Search & Filter    │ • Dynamic Overlays: S&R, FVG, ATR Target Bands             │   (Consensus, Confidence %)  │
│ • USDT / INR / BTC   │ • Timeframe Switcher (1m, 5m, 15m, 1h, 4h, 1d)             │ • Model Vote Telemetry       │
│ • 24h Price & Volume │ • Auto-Zoom / Fit Candle View                              │ • Execution Center           │
│ • Favorites Tracking ├────────────────────────────────────────────────────────────┤   (Leverage, Dual Currency)  │
│                      │ CHART BOTTOM ACTION BAR: Live Price │ Quick Buy/Sell │ TG  │ • Factor Reasoning Accordion │
│                      ├────────────────────────────────────────────────────────────┤ • Live Telemetry Matrix      │
│                      │ BOTTOM DOCK: Active Positions Table │ Spot & Margin Balances│   (RSI, ADX, ATR, MACD, BB)  │
└──────────────────────┴────────────────────────────────────────────────────────────┴──────────────────────────────┘
```

---

## 🌟 Core Feature Breakdown

### 1. Market Screener ([MarketScreener.tsx](src/components/screener/MarketScreener.tsx))
* **Multi-Quote Currency Filtering**: Switch effortlessly between `ALL`, `USDT`, `INR`, and `BTC` denominated pairs.
* **Instant Dynamic Switching**: Selecting any market immediately repopulates the central chart, resets WebSocket feeds, updates order book depth, and synchronizes signal models.
* **Smart Search**: Filter pairs by base or quote symbol with debounced indexing.

### 2. Interactive Chart Canvas ([TradingViewChart.tsx](src/components/chart/TradingViewChart.tsx))
* **Engineered on Lightweight Charts v4**: Capable of streaming 60fps tick updates with zero browser thread lag.
* **Algorithmic Canvas Overlays**:
  * **Support & Resistance (S&R)**: Clusters price pivot levels with color-coded horizontal boundary bands.
  * **Fair Value Gaps (FVG)**: Visualizes 3-candle institutional liquidity imbalances with transparent bounding boxes.
  * **ATR Dynamic Setup**: Overlays entry lines, dynamic stop losses, and multi-tier take profit targets directly onto the canvas.
* **Auto-Fit View**: Re-scales and fits historical candle geometry instantly upon asset selection.

### 3. Chart Bottom Action Bar ([ChartActionBar.tsx](src/components/chart/ChartActionBar.tsx))
* Persistent command strip directly under the candlestick canvas.
* Displays clean market pair name, live Dollar price, and INR equivalent side by side.
* **1-Click Quick Execution**:
  * **`[ 🚀 BUY / LONG ]`**: Executes a long order sized to $2\%$ portfolio risk.
  * **`[ 🔻 SELL / SHORT ]`**: Executes a short order sized to $2\%$ portfolio risk.
* **Telegram Broadcast Trigger**: 1-click dispatch to your linked Telegram channel.

### 4. Quantitative Signal & Model Consensus ([SignalCard.tsx](src/components/signal/SignalCard.tsx))
* Displays consensus direction (`STRONG BUY`, `STRONG SELL`, `HOLD / NEUTRAL`).
* **Consensus Tag**: Displays model agreement level (`UNANIMOUS (3/3)`, `MAJORITY (2/3)`, or `SPLIT`).
* **Telemetry Breakdown**: Displays individual voting probabilities across technical and statistical engines.
* **Dynamic Setup Levels**: Shows exact ATR calculated Entry, Stop Loss, and Take Profit 1 with dual-currency values.

### 5. Execution Center ([TradePanel.tsx](src/components/execution/TradePanel.tsx))
* **Leverage Slider**: Supports variable leverage from $1\times$ to $25\times$.
* **Dual-Currency Sizing Input**: Toggle between `$ USD` and `₹ INR` inputs with real-time cross-currency conversions.
* **Auto-Risk Calculation**: Automatically sizes quantities based on account equity and stop loss distance to enforce strict capital preservation.

### 6. Positions & Balances Dock ([BottomDrawer.tsx](src/components/positions/BottomDrawer.tsx))
* Collapsible bottom drawer displaying active positions with real-time Mark Price, Liquidation Price, and Unrealized PnL in both USD and INR (`+$16.00 (+₹1,599)`).
* 1-Click Position Exit with exchange synchronization.
* Balances tab displaying total and available funds with native currency symbols (`₹` for INR, `$` for USDT).

---

## 💱 Dual-Currency (USD $ & INR ₹) Precision System

To provide frictionless experience for Indian and global traders, all components display dual currencies side by side:

| Component | USD Display | INR Equivalent Display |
| :--- | :--- | :--- |
| **Topbar Balance** | `$TotalUsd` | `(₹TotalInr)` |
| **Market Tickers** | `$Price` | `(₹PriceInr)` |
| **Trade Setup Levels**| `$Entry`, `$SL`, `$TP1` | `(₹Entry)`, `(₹SL)`, `(₹TP1)` |
| **Trade Execution** | `$ Custom USD Amount` | `₹ Custom INR Amount` |
| **Unrealized PnL** | `+$PnL_USD` | `(+₹PnL_INR)` |
| **Asset Balances** | `$ Amount (USDT)` | `₹ Amount (INR)` |

The live conversion rate is synchronized dynamically from the backend currency provider (with $99.95$ fallback).

---

## ⚡ Execution Workflow Modes

The terminal supports 3 execution philosophies configured via [terminalStore.ts](src/store/terminalStore.ts):

```
┌────────────────────────────────────────────────────────┐
│               EXECUTION ENGINE SELECTOR                │
├───────────────────┬──────────────────┬─────────────────┤
│    1. MANUAL      │  2. SEMI-AUTO    │     3. AUTO     │
│ Trader controls   │ 15s High-Priority│ Sentinel Loop   │
│ every execution   │ Approval Modal   │ Hands-off Auto  │
└───────────────────┴──────────────────┴─────────────────┘
```

1. **Manual Mode**:
   * Trader inspects quantitative reasoning and executes manually via the **Execution Center** or **Chart Bottom Bar**.
2. **Semi-Automatic Mode**:
   * When the backend emits a directional signal with confidence $\ge 70\%$, a high-priority **15-Second Confirmation Modal** ([SemiAutoModal.tsx](src/components/execution/SemiAutoModal.tsx)) appears with an auditory chime.
   * Trader can click **Approve & Execute** or let it expire safely.
3. **Autonomous Mode (Sentinel Auto-Trade)**:
   * Background hook ([useAutoTrade.ts](src/hooks/useAutoTrade.ts)) automatically places verified orders on CoinDCX/Paper trading when high-confidence signals trigger, with built-in deduplication against double execution.

---

## 📢 Telegram Signal Broadcaster & Channel Linking

The terminal integrates with [@alphx_signal_bot](https://t.me/alphx_signal_bot) for instant signal distribution:

### How to Connect Your Telegram Channel in 60 Seconds:
1. Open your Telegram Channel or Group.
2. Navigate to **Channel Settings $\rightarrow$ Administrators $\rightarrow$ Add Administrator**.
3. Search for **`@alphx_signal_bot`** and grant permission to **Post Messages**.
4. In your channel, send any test message (e.g. `test`), or send `/start` to `@alphx_signal_bot` in a private chat.
5. In the ALPHX Terminal Topbar, click **Telegram** (or the gear icon in the Chart Bottom Bar).
6. Click **⚡ Auto-Detect Chat ID** — the bot will discover your channel and auto-fill the Chat ID.
7. Click **Send Test Ping** to verify message delivery.
8. Enable **Auto-Broadcast** if you want high-confidence signals pushed automatically!

---

## 📁 Project Structure

```text
AI_singal/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout & font configurations
│   │   ├── page.tsx               # Main 3-column trading terminal canvas
│   │   └── globals.css            # Tailwind & custom terminal styling rules
│   ├── components/
│   │   ├── chart/
│   │   │   ├── TradingViewChart.tsx # Lightweight Charts canvas & overlay drawing
│   │   │   └── ChartActionBar.tsx   # Persistent chart bottom execution bar
│   │   ├── execution/
│   │   │   ├── TradePanel.tsx       # Execution Center & dual-currency risk controls
│   │   │   └── SemiAutoModal.tsx    # 15s high-priority trade approval modal
│   │   ├── layout/
│   │   │   ├── Topbar.tsx           # Global header, balance pill, mode switcher
│   │   │   └── ExchangeModal.tsx    # CoinDCX API connection modal
│   │   ├── positions/
│   │   │   └── BottomDrawer.tsx     # Active positions & balances docking drawer
│   │   ├── screener/
│   │   │   └── MarketScreener.tsx   # Searchable asset screener with quote tabs
│   │   ├── signal/
│   │   │   ├── SignalCard.tsx       # Quantitative verdict & model consensus gauge
│   │   │   ├── ReasoningAccordion.tsx # Expandable technical factor breakdown
│   │   │   └── IndicatorMatrix.tsx  # 6-indicator live technical telemetry grid
│   │   ├── telegram/
│   │   │   └── TelegramModal.tsx    # Telegram bot configuration & chat discovery
│   │   ├── ui/
│   │   │   └── AlphxLogo.tsx        # Terminal vector branding badge
│   │   └── webhook/
│   │       └── WebhookModal.tsx     # Inbound TradingView webhook automation
│   ├── hooks/
│   │   ├── useAutoTrade.ts          # Automated trade execution listener
│   │   └── useWebSocket.ts          # Real-time CoinDCX ticker & candle feed hook
│   ├── services/
│   │   └── api.ts                   # Typed Axios client & backend REST client
│   ├── store/
│   │   ├── exchangeStore.ts         # Balances, positions, & connection state
│   │   ├── telegramStore.ts         # Channel ID & auto-broadcast settings
│   │   └── terminalStore.ts         # Active pair, timeframe, analysis, & mode
│   └── types/
│       └── index.ts                 # Complete TypeScript interfaces & schemas
├── public/                          # Static assets
├── .env.example                     # Environment variable template
├── next.config.js                   # Next.js build configuration
├── package.json                     # Node.js dependencies & scripts
├── tailwind.config.ts               # Custom institutional color theme
├── tsconfig.json                    # TypeScript compiler options
└── README.md
```

---

## 🚀 Installation & Development Guide

### 1. Prerequisites
* **Node.js 18.17+** or **Node.js 20+**
* **npm** (or **pnpm** / **yarn**)
* Backend service running on [http://localhost:8000](http://localhost:8000)

### 2. Clone Repository
```bash
git clone https://github.com/your-username/AI_singal.git
cd AI_singal
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy the template into a `.env.local` file:
```bash
cp .env.example .env.local
```

Verify your `.env.local` settings:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/ws
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_PAIR=B-BTC_USDT
NEXT_PUBLIC_DEFAULT_TIMEFRAME=15m
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the terminal.

---

## 🏗 Production Deployment

### 1. Build Verification
Run TypeScript validation and optimized Next.js build:
```bash
npx tsc --noEmit
npm run build
```

### 2. Start Production Server
```bash
npm run start
```

### 3. Deploying to Vercel
1. Import the repository on [Vercel](https://vercel.com).
2. Configure Environment Variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`).
3. Deploy with standard Next.js preset.

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
