'use client';

import React, { useEffect, useState } from 'react';
import { useTelegramStore } from '../../store/telegramStore';
import { api } from '../../services/api';
import { TelegramDetectedChat } from '../../types';
import {
  X,
  Send,
  Radio,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react';

export const TelegramModal: React.FC = () => {
  const {
    botInfo,
    setBotInfo,
    chatId,
    setChatId,
    autoBroadcast,
    setAutoBroadcast,
    minConfidence,
    setMinConfidence,
    isConfigModalOpen,
    setIsConfigModalOpen,
  } = useTelegramStore();

  const [inputChatId, setInputChatId] = useState(chatId);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedChats, setDetectedChats] = useState<TelegramDetectedChat[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setInputChatId(chatId);
  }, [chatId]);

  // Load status on modal open
  useEffect(() => {
    if (isConfigModalOpen) {
      api.getTelegramStatus()
        .then((res) => {
          if (res.bot_info) setBotInfo(res.bot_info);
          if (res.chat_id) {
            setChatId(res.chat_id);
            setInputChatId(res.chat_id);
          }
          setAutoBroadcast(res.auto_send);
          setMinConfidence(res.min_confidence);
        })
        .catch(() => {});
    }
  }, [isConfigModalOpen, setBotInfo, setChatId, setAutoBroadcast, setMinConfidence]);

  if (!isConfigModalOpen) return null;

  // Auto-Detect recent chats
  const handleDetectChats = async () => {
    setIsDetecting(true);
    setFeedback(null);
    try {
      const res = await api.detectTelegramChat();
      if (res.chats && res.chats.length > 0) {
        setDetectedChats(res.chats);
        setFeedback({
          type: 'success',
          text: `Found ${res.chats.length} chat(s)! Click on one below to select it.`,
        });
      } else {
        setFeedback({
          type: 'error',
          text: 'No recent updates found. Please send /start to @alphx_signal_bot or add it as Admin to your channel, then try again.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.detail || err.message || 'Detection failed',
      });
    } finally {
      setIsDetecting(false);
    }
  };

  // Helper check
  const isBotSelfUsername = (val: string) => {
    const clean = val.trim().toLowerCase();
    return clean === '@alphx_signal_bot' || clean === 'alphx_signal_bot' || clean === '8978992155';
  };

  // Test message
  const handleTestMessage = async () => {
    const target = inputChatId.trim();
    if (!target) {
      setFeedback({ type: 'error', text: 'Please enter a Channel Username or Chat ID first.' });
      return;
    }

    if (isBotSelfUsername(target)) {
      setFeedback({
        type: 'error',
        text: "You entered the bot's username (@alphx_signal_bot). The bot cannot send messages to itself! Please enter YOUR channel handle (e.g. @your_channel) or personal Chat ID.",
      });
      return;
    }

    setIsTesting(true);
    setFeedback(null);

    try {
      const res = await api.testTelegramMessage(target);
      if (res.status === 'delivered') {
        setFeedback({
          type: 'success',
          text: `Test message successfully delivered to ${res.chat || target}!`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.detail || err.message || 'Delivery failed. Ensure the bot is an Admin in the channel.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Save settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = inputChatId.trim();
    if (isBotSelfUsername(target)) {
      setFeedback({
        type: 'error',
        text: "You entered the bot's username (@alphx_signal_bot). The bot cannot send messages to itself! Please enter YOUR channel handle (e.g. @your_channel) or personal Chat ID.",
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await api.updateTelegramConfig({
        chat_id: target,
        auto_send: autoBroadcast,
        min_confidence: minConfidence,
      });

      setChatId(target);
      setFeedback({ type: 'success', text: 'Telegram settings saved successfully!' });
      setTimeout(() => {
        setIsConfigModalOpen(false);
        setFeedback(null);
      }, 1200);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.detail || err.message || 'Failed to save configuration',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={() => setIsConfigModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md hover:bg-surface-elevated transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="h-10 w-10 rounded-lg bg-[#229ED9]/20 border border-[#229ED9]/40 flex items-center justify-center text-[#229ED9]">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Telegram Signal Automation</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Bot: <a href="https://t.me/alphx_signal_bot" target="_blank" rel="noopener noreferrer" className="text-[#229ED9] hover:underline font-mono">@alphx_signal_bot</a>
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs flex items-start space-x-2 ${
              feedback.type === 'success'
                ? 'bg-bull/15 border border-bull/30 text-emerald-300'
                : 'bg-bear/15 border border-bear/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-bull shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-bear shrink-0 mt-0.5" />
            )}
            <div className="leading-snug">{feedback.text}</div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Target Channel / Chat ID */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300">
                Telegram Channel or Chat ID
              </label>
              <button
                type="button"
                onClick={handleDetectChats}
                disabled={isDetecting}
                className="text-[11px] text-[#229ED9] hover:underline flex items-center space-x-1"
              >
                {isDetecting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                <span>Auto-Detect Chat ID</span>
              </button>
            </div>

            <input
              type="text"
              placeholder="e.g. @your_channel_name or your personal Chat ID"
              value={inputChatId}
              onChange={(e) => setInputChatId(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#229ED9] font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              💡 <strong>Important:</strong> Do not enter <code>@alphx_signal_bot</code> here. Enter <strong>your</strong> channel (e.g. <code>@my_trading_channel</code>) where the bot was added as Admin, or your personal Chat ID.
            </p>
          </div>

          {/* Detected Chats Picker */}
          {detectedChats.length > 0 && (
            <div className="p-2.5 rounded-lg bg-background/80 border border-border space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-300">
                Discovered Channels & Chats:
              </span>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {detectedChats.map((c) => (
                  <button
                    key={c.chat_id}
                    type="button"
                    onClick={() => setInputChatId(c.username || c.chat_id)}
                    className="w-full p-1.5 rounded bg-surface-elevated hover:bg-surface text-left text-xs text-slate-300 flex items-center justify-between border border-border/60 transition-colors"
                  >
                    <span className="font-medium text-white">{c.title}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {c.username || c.chat_id} ({c.type})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Auto Broadcast Configuration */}
          <div className="p-3 bg-surface-elevated/70 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Auto-Broadcast Signals</span>
                <span className="text-[11px] text-slate-400">
                  Automatically post verified signals to Telegram in real time
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutoBroadcast(!autoBroadcast)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  autoBroadcast ? 'bg-[#229ED9]' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    autoBroadcast ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {autoBroadcast && (
              <div className="pt-2 border-t border-border/50 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Min Confidence Threshold</span>
                  <span className="font-mono text-[#229ED9] font-bold">
                    {(minConfidence * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-[#229ED9]"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={handleTestMessage}
              disabled={isTesting || !inputChatId.trim()}
              className="flex-1 py-2 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
            >
              {isTesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Radio className="h-3.5 w-3.5 text-[#229ED9]" />
              )}
              <span>Send Test Ping</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2 rounded-lg bg-[#229ED9] hover:bg-[#1f8ec4] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-[#229ED9]/25 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
