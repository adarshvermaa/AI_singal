'use client';

import React from 'react';
import { Topbar } from '../components/layout/Topbar';
import { ExchangeModal } from '../components/layout/ExchangeModal';
import { WebhookModal } from '../components/webhook/WebhookModal';
import { MarketScreener } from '../components/screener/MarketScreener';
import { TradingViewChart } from '../components/chart/TradingViewChart';
import { BottomDrawer } from '../components/positions/BottomDrawer';
import { SignalCard } from '../components/signal/SignalCard';
import { TradePanel } from '../components/execution/TradePanel';
import { ReasoningAccordion } from '../components/signal/ReasoningAccordion';
import { IndicatorMatrix } from '../components/signal/IndicatorMatrix';
import { SemiAutoModal } from '../components/execution/SemiAutoModal';
import { TelegramModal } from '../components/telegram/TelegramModal';
import { useAutoTrade } from '../hooks/useAutoTrade';

export default function Home() {
  // Activate automatic & semi-automatic trade monitoring
  useAutoTrade();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* 1. Header Bar */}
      <Topbar />

      {/* 2. Main 3-Column Trading Terminal Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Pair Screener */}
        <MarketScreener />

        {/* Center Column: Chart + Bottom Dock */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TradingViewChart />
          <BottomDrawer />
        </main>

        {/* Right Column: AI Signal & Execution Hub */}
        <aside className="w-96 border-l border-border bg-surface flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-3 space-y-3">
          <SignalCard />
          <TradePanel />
          <ReasoningAccordion />
          <IndicatorMatrix />
        </aside>
      </div>

      {/* 3. Connect Exchange Modal */}
      <ExchangeModal />

      {/* 4. Webhook Automation Modal */}
      <WebhookModal />

      {/* 5. Semi-Automatic Trade Proposal Modal */}
      <SemiAutoModal />

      {/* 6. Telegram Automation Modal */}
      <TelegramModal />
    </div>
  );
}
