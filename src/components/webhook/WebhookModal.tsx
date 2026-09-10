'use client';

import React, { useState, useEffect } from 'react';
import { useWebhookStore } from '../../store/webhookStore';
import {
  X,
  Copy,
  Check,
  Radio,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Terminal,
  Code,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';

export const WebhookModal: React.FC = () => {
  const {
    isWebhookModalOpen,
    setIsWebhookModalOpen,
    config,
    logs,
    isLoadingConfig,
    isLoadingLogs,
    fetchLogs,
  } = useWebhookStore();

  const [activeTab, setActiveTab] = useState<'templates' | 'endpoint' | 'logs'>('templates');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWebhookModalOpen && activeTab === 'logs') {
      interval = setInterval(() => {
        fetchLogs();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWebhookModalOpen, activeTab, fetchLogs]);

  if (!isWebhookModalOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const defaultWebhookId = process.env.NEXT_PUBLIC_COINDCX_WEBHOOK_ID || 'd536c102-6568-4f5e-8297-5ef23f194ace';
  const defaultSecret = process.env.NEXT_PUBLIC_WEBHOOK_SECRET || 'coindcx_secret_key_8899';
  const defaultCoinDCXUrl = process.env.NEXT_PUBLIC_COINDCX_WEBHOOK_URL || 'https://api.coindcx.com/callbacks/v1/derivatives/futures/order/jSsqRkGH5aQDvuD01JLoV1jDo';
  const defaultBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const templates = config?.templates || {
    coindcx_official_dynamic: {
      side: '{{strategy.order.action}}',
      price: '{{close}}',
      symbol: '{{ticker}}',
      order_type: 'market_order',
      total_quantity: '0.001',
      margin_currency_short_name: 'USDT',
      webhook_id: defaultWebhookId,
    },
    coindcx_official_static_buy: {
      side: 'buy',
      price: '67000',
      symbol: 'B-BTC_USDT',
      order_type: 'market_order',
      total_quantity: '0.001',
      margin_currency_short_name: 'USDT',
      webhook_id: defaultWebhookId,
    },
    coindcx_native_futures_buy: {
      pair: 'B-BTC_USDT',
      side: 'buy',
      order_type: 'market_order',
      total_quantity: 0.001,
      leverage: 3,
    },
    coindcx_native_futures_sell: {
      pair: 'B-BTC_USDT',
      side: 'sell',
      order_type: 'market_order',
      total_quantity: 0.001,
      leverage: 3,
    },
    futures_long_3x: {
      secret: config?.secret_key || 'YOUR_SECRET_KEY',
      symbol: 'B-BTC_USDT',
      action: 'buy',
      trading_mode: 'futures',
      leverage: 3.0,
      auto_risk: true,
      stop_loss: 67800,
      take_profit: 69500,
      require_ai_confirmation: true,
    },
    futures_short_3x: {
      secret: config?.secret_key || 'YOUR_SECRET_KEY',
      symbol: 'B-BTC_USDT',
      action: 'sell',
      trading_mode: 'futures',
      leverage: 3.0,
      auto_risk: true,
      stop_loss: 69200,
      take_profit: 67400,
      require_ai_confirmation: true,
    },
    close_position: {
      secret: config?.secret_key || 'YOUR_SECRET_KEY',
      symbol: 'B-BTC_USDT',
      action: 'close',
      trading_mode: 'futures',
    },
    spot_market_buy: {
      secret: config?.secret_key || 'YOUR_SECRET_KEY',
      symbol: 'B-BTC_USDT',
      action: 'buy',
      trading_mode: 'spot',
      order_type: 'market_order',
      auto_risk: true,
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-surface border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-tech-blue/20 border border-tech-blue/30 flex items-center justify-center text-tech-blue">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">TradingView & CoinDCX Webhooks</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                  Live Receiver
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Execute algorithmic trades directly from TradingView alerts via CoinDCX with AI confirmation
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsWebhookModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-surface-elevated transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-background/50 px-6 pt-2 space-x-4">
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'templates'
                ? 'border-tech-blue text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="h-4 w-4" />
            <span>Alert JSON Templates</span>
          </button>

          <button
            onClick={() => setActiveTab('endpoint')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'endpoint'
                ? 'border-tech-blue text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="h-4 w-4" />
            <span>Endpoint & Credentials</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('logs');
              fetchLogs();
            }}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'logs'
                ? 'border-tech-blue text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Execution Logs</span>
            {logs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 border border-slate-700 text-slate-300">
                {logs.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: Alert Templates */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-ai/10 border border-ai/20 flex items-start space-x-3">
                <ShieldCheck className="h-5 w-5 text-ai-light shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-white">AI Sentinel Confirmation Active:</span>
                  <p className="text-slate-300">
                    When <code className="text-ai-light">require_ai_confirmation: true</code> is sent,
                    the backend verifies the incoming TradingView alert with the real-time AI Multi-Indicator
                    Ensemble model before placing CoinDCX orders. Counter-trend false signals will be safely rejected.
                  </p>
                </div>
              </div>

              {/* CoinDCX Native Direct Webhook Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-tech-blue" />
                    <span>CoinDCX Official Webhook Specification:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Works with CoinDCX URL & AI Bridge</span>
                </div>

                {/* Official CoinDCX Dynamic Webhook Payload Card */}
                <div className="bg-background border border-tech-blue/40 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-tech-blue/20 text-tech-blue border border-tech-blue/30 uppercase">
                        CoinDCX Official JSON
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">Your Exact Alert Payload</span>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(templates.coindcx_official_dynamic, null, 2),
                          'coindcx_official'
                        )
                      }
                      className="text-xs text-white bg-tech-blue hover:bg-tech-blue/90 px-2.5 py-1 rounded flex items-center space-x-1.5 transition-colors font-semibold"
                    >
                      {copiedKey === 'coindcx_official' ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied JSON</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Payload</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-200 bg-surface/90 p-3 rounded border border-border overflow-x-auto">
                    {JSON.stringify(templates.coindcx_official_dynamic, null, 2)}
                  </pre>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Includes your active Webhook ID: <code className="text-ai-light font-mono">d536c102-6568-4f5e-8297-5ef23f194ace</code>. Paste directly into TradingView Alert Message box.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CoinDCX Native Buy */}
                  <div className="bg-background border border-border rounded-lg p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bull/20 text-bull border border-bull/30 uppercase">
                            CoinDCX Direct Buy
                          </span>
                          <span className="text-xs text-slate-400">Market Order</span>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(templates.coindcx_native_futures_buy, null, 2),
                              'coindcx_buy'
                            )
                          }
                          className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 bg-surface px-2 py-1 rounded border border-border transition-colors"
                        >
                          {copiedKey === 'coindcx_buy' ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-bull" />
                              <span className="text-bull">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy JSON</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-300 bg-surface/80 p-3 rounded border border-border overflow-x-auto">
                        {JSON.stringify(templates.coindcx_native_futures_buy, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* CoinDCX Native Sell */}
                  <div className="bg-background border border-border rounded-lg p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bear/20 text-bear border border-bear/30 uppercase">
                            CoinDCX Direct Sell
                          </span>
                          <span className="text-xs text-slate-400">Market Order</span>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(templates.coindcx_native_futures_sell, null, 2),
                              'coindcx_sell'
                            )
                          }
                          className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 bg-surface px-2 py-1 rounded border border-border transition-colors"
                        >
                          {copiedKey === 'coindcx_sell' ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-bull" />
                              <span className="text-bull">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy JSON</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-300 bg-surface/80 p-3 rounded border border-border overflow-x-auto">
                        {JSON.stringify(templates.coindcx_native_futures_sell, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Sentinel Protected Webhook Section */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-ai" />
                    <span>AI Sentinel Format (With Automatic 2% Risk & Trend Check):</span>
                  </span>
                  <span className="text-[10px] text-ai-light">Use with AI Bridge URL</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Long Alert Template */}
                  <div className="bg-background border border-border rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bull/20 text-bull border border-bull/30 uppercase">
                          Futures Long (3x)
                        </span>
                        <span className="text-xs text-slate-400">Buy Alert</span>
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(templates.futures_long_3x, null, 2),
                            'long_template'
                          )
                        }
                        className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 bg-surface px-2 py-1 rounded border border-border transition-colors"
                      >
                        {copiedKey === 'long_template' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-bull" />
                            <span className="text-bull">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 bg-surface/80 p-3 rounded border border-border overflow-x-auto">
                      {JSON.stringify(templates.futures_long_3x, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Short Alert Template */}
                <div className="bg-background border border-border rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bear/20 text-bear border border-bear/30 uppercase">
                          Futures Short (3x)
                        </span>
                        <span className="text-xs text-slate-400">Sell Alert</span>
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(templates.futures_short_3x, null, 2),
                            'short_template'
                          )
                        }
                        className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 bg-surface px-2 py-1 rounded border border-border transition-colors"
                      >
                        {copiedKey === 'short_template' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-bull" />
                            <span className="text-bull">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 bg-surface/80 p-3 rounded border border-border overflow-x-auto">
                      {JSON.stringify(templates.futures_short_3x, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Close Position Template */}
                <div className="bg-background border border-border rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                          Exit Position
                        </span>
                        <span className="text-xs text-slate-400">Close Trigger</span>
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(templates.close_position, null, 2),
                            'close_template'
                          )
                        }
                        className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 bg-surface px-2 py-1 rounded border border-border transition-colors"
                      >
                        {copiedKey === 'close_template' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-bull" />
                            <span className="text-bull">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 bg-surface/80 p-3 rounded border border-border overflow-x-auto">
                      {JSON.stringify(templates.close_position, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Spot Buy Template */}
                <div className="bg-background border border-border rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-tech-blue/20 text-tech-blue border border-tech-blue/30 uppercase">
                          Spot Market Buy
                        </span>
                        <span className="text-xs text-slate-400">Accumulate</span>
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(templates.spot_market_buy, null, 2),
                            'spot_template'
                          )
                        }
                        className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 bg-surface px-2 py-1 rounded border border-border transition-colors"
                      >
                        {copiedKey === 'spot_template' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-bull" />
                            <span className="text-bull">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 bg-surface/80 p-3 rounded border border-border overflow-x-auto">
                      {JSON.stringify(templates.spot_market_buy, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

              {/* TradingView Setup Guide */}
              <div className="p-4 rounded-lg bg-surface-elevated/40 border border-border text-xs space-y-2">
                <span className="font-semibold text-white flex items-center space-x-1.5">
                  <Flame className="h-4 w-4 text-amber-400" />
                  <span>How to attach this to TradingView:</span>
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>In TradingView, click on your indicator or candle alert icon.</li>
                  <li>In the <strong>Notifications</strong> tab, check <strong>Webhook URL</strong>.</li>
                  <li>
                    Paste your Webhook URL from the <em>Endpoint & Credentials</em> tab.
                  </li>
                  <li>
                    In the <strong>Message</strong> box, paste one of the JSON payloads above.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: Endpoint & Credentials */}
          {activeTab === 'endpoint' && (
            <div className="space-y-6">
              {/* Option A: CoinDCX Official Callback Webhook */}
              <div className="p-4 rounded-lg bg-surface-elevated/60 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-tech-blue/20 text-tech-blue border border-tech-blue/30 uppercase">
                      Direct Mode
                    </span>
                    <span className="text-xs font-bold text-white">Your CoinDCX Futures Webhook URL</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Token Active
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={config?.coindcx_webhook_url || defaultCoinDCXUrl}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-xs text-white font-mono"
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(
                        config?.coindcx_webhook_url || defaultCoinDCXUrl,
                        'coindcx_webhook_url'
                      )
                    }
                    className="px-3 py-2 bg-tech-blue hover:bg-tech-blue/90 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                  >
                    {copiedKey === 'coindcx_webhook_url' ? (
                      <>
                        <Check className="h-4 w-4 text-white" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-slate-300 leading-relaxed bg-background/50 p-2.5 rounded border border-border">
                  <p className="font-medium text-white mb-1">How CoinDCX uses this link:</p>
                  <p>
                    The path ending in <code className="text-ai-light font-mono">jSsqRkGH5aQDvuD01JLoV1jDo</code> is your private token.
                    When you paste this URL directly into TradingView Alerts, CoinDCX automatically executes futures orders on your account without requiring HMAC signatures.
                  </p>
                </div>
              </div>

              {/* Option B: Antigravity AI Sentinel Webhook */}
              <div className="p-4 rounded-lg bg-surface-elevated/60 border border-ai/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ai/20 text-ai-light border border-ai/40 uppercase">
                      AI Sentinel Mode
                    </span>
                    <span className="text-xs font-bold text-white">AI Confirmed Inbound Bridge URL</span>
                  </div>
                  <span className="text-[10px] text-ai-light bg-ai/10 px-2 py-0.5 rounded border border-ai/30">
                    Smart Filter & Sizing
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={config?.webhook_url || `${defaultBackendUrl}/api/webhook/trade`}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-xs text-white font-mono"
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(
                        config?.webhook_url || `${defaultBackendUrl}/api/webhook/trade`,
                        'webhook_url'
                      )
                    }
                    className="px-3 py-2 bg-surface hover:bg-surface-elevated border border-border rounded-lg text-xs font-medium text-slate-200 flex items-center space-x-1.5 transition-colors"
                  >
                    {copiedKey === 'webhook_url' ? (
                      <>
                        <Check className="h-4 w-4 text-bull" />
                        <span className="text-bull">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Authorization Secret Key (Or use your CoinDCX Token)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={config?.secret_key || defaultSecret}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-xs text-white font-mono"
                    />
                    <button
                      onClick={() =>
                        copyToClipboard(
                          config?.secret_key || defaultSecret,
                          'secret_key'
                        )
                      }
                      className="px-3 py-2 bg-surface hover:bg-surface-elevated border border-border rounded-lg text-xs font-medium text-slate-200 flex items-center space-x-1.5 transition-colors"
                    >
                      {copiedKey === 'secret_key' ? (
                        <>
                          <Check className="h-4 w-4 text-bull" />
                          <span className="text-bull">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy Secret</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pass in the payload <code className="text-ai-light font-mono">&quot;secret&quot;</code> field, query param <code className="text-ai-light font-mono">?secret=...</code>, or header.
                  </p>
                </div>
              </div>

              {/* Comparison Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-background border border-border space-y-1">
                  <span className="font-bold text-white flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-tech-blue" />
                    <span>When to use Direct Mode:</span>
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    You have a battle-tested TradingView strategy and want 0-latency execution directly into CoinDCX Futures without running a local backend server.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-background border border-border space-y-1">
                  <span className="font-bold text-white flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-ai" />
                    <span>When to use AI Sentinel Mode:</span>
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    You want our AI multi-indicator engine (120+ indicators & ML ensemble) to verify trend momentum, check for fakeouts, and calculate automatic 2% risk position size before executing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Execution Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Real-time webhook events (In-memory buffer, last 50 alerts):
                </span>
                <button
                  onClick={() => fetchLogs()}
                  disabled={isLoadingLogs}
                  className="px-2.5 py-1 bg-surface-elevated hover:bg-surface border border-border rounded text-xs text-slate-300 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingLogs ? 'animate-spin text-tech-blue' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border rounded-lg bg-background/50">
                  <Radio className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No webhook alerts received yet</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Send a test POST request to your webhook URL or trigger an alert on TradingView.
                  </p>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface-elevated/80 text-slate-400 font-semibold">
                        <th className="py-2 px-3">Time</th>
                        <th className="py-2 px-3">Pair</th>
                        <th className="py-2 px-3">Action</th>
                        <th className="py-2 px-3">Mode</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">AI Verdict</th>
                        <th className="py-2 px-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 font-mono text-[11px]">
                      {logs.map((log) => {
                        const dateStr = new Date(log.timestamp).toLocaleTimeString();
                        let statusBadge = null;

                        if (log.status === 'executed') {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded bg-bull/15 text-bull border border-bull/30 flex items-center space-x-1 w-fit">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>EXECUTED</span>
                            </span>
                          );
                        } else if (log.status === 'rejected_by_ai') {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded bg-ai/20 text-ai-light border border-ai/40 flex items-center space-x-1 w-fit">
                              <ShieldAlert className="h-3 w-3" />
                              <span>AI BLOCKED</span>
                            </span>
                          );
                        } else if (log.status === 'invalid_secret') {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded bg-bear/15 text-bear border border-bear/30 flex items-center space-x-1 w-fit">
                              <AlertTriangle className="h-3 w-3" />
                              <span>UNAUTH</span>
                            </span>
                          );
                        } else {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 w-fit">
                              FAILED
                            </span>
                          );
                        }

                        return (
                          <tr key={log.id} className="hover:bg-surface-elevated/40 transition-colors">
                            <td className="py-2 px-3 text-slate-400 whitespace-nowrap">{dateStr}</td>
                            <td className="py-2 px-3 text-white font-bold">{log.symbol}</td>
                            <td className="py-2 px-3 uppercase">
                              <span
                                className={
                                  log.action.toLowerCase() === 'buy'
                                    ? 'text-bull font-bold'
                                    : log.action.toLowerCase() === 'sell'
                                    ? 'text-bear font-bold'
                                    : 'text-amber-400 font-bold'
                                }
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-400 uppercase">{log.trading_mode}</td>
                            <td className="py-2 px-3">{statusBadge}</td>
                            <td className="py-2 px-3">
                              {log.ai_verdict ? (
                                <span className="text-slate-300">
                                  {log.ai_verdict}{' '}
                                  {log.ai_confidence !== undefined && (
                                    <span className="text-slate-500">
                                      ({(log.ai_confidence * 100).toFixed(0)}%)
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-300 max-w-[200px] truncate" title={log.message}>
                              {log.message}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-surface-elevated/40 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CoinDCX API Bridge Ready</span>
          </div>
          <button
            onClick={() => setIsWebhookModalOpen(false)}
            className="px-4 py-1.5 bg-surface-elevated hover:bg-border text-white rounded-lg font-medium transition-colors border border-border"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
