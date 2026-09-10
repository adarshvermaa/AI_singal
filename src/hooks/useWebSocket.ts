'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTerminalStore } from '../store/terminalStore';
import { useWebhookStore } from '../store/webhookStore';

interface WebSocketMessage {
  type: string;
  symbol?: string;
  timeframe?: string;
  data?: any;
  timestamp?: number;
  error?: string;
}

export function useWebSocket() {
  const { activeSymbol, activeTimeframe } = useTerminalStore();
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connectRef = useRef<any>(null);
  const activeSymbolRef = useRef(activeSymbol);
  
  useEffect(() => {
    activeSymbolRef.current = activeSymbol;
  }, [activeSymbol]);

  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/ws';
    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        // Subscribe to current pair candles and ticker
        ws.send(JSON.stringify({ action: 'subscribe', channel: `candles:${activeSymbol}:${activeTimeframe}` }));
        ws.send(JSON.stringify({ action: 'subscribe', channel: `ticker:${activeSymbol}` }));
        ws.send(JSON.stringify({ action: 'subscribe', channel: `signals:${activeSymbol}` }));

        // Ping every 25 seconds
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const msg: WebSocketMessage = JSON.parse(event.data);
          if (msg.type === 'price' && msg.data?.price && msg.symbol === activeSymbolRef.current) {
            setLatestPrice(msg.data.price);
          } else if (msg.type === 'webhook_event' && msg.data) {
            useWebhookStore.getState().addLogItem(msg.data);
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          if (connectRef.current) connectRef.current();
        }, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      socketRef.current = ws;
    } catch {
      setIsConnected(false);
    }
  }, [activeSymbol, activeTimeframe]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const prevSymbolRef = useRef(activeSymbol);
  const prevTimeframeRef = useRef(activeTimeframe);

  // Resubscribe on pair or timeframe change
  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ action: 'subscribe', channel: `candles:${activeSymbol}:${activeTimeframe}` })
      );
      socketRef.current.send(
        JSON.stringify({ action: 'subscribe', channel: `ticker:${activeSymbol}` })
      );
    }
    
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({ action: 'unsubscribe', channel: `candles:${prevSymbolRef.current}:${prevTimeframeRef.current}` })
        );
        socketRef.current.send(
          JSON.stringify({ action: 'unsubscribe', channel: `ticker:${prevSymbolRef.current}` })
        );
      }
      prevSymbolRef.current = activeSymbol;
      prevTimeframeRef.current = activeTimeframe;
    };
  }, [activeSymbol, activeTimeframe]);

  return { isConnected, latestPrice };
}
