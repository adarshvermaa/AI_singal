'use client';

import React, { useState } from 'react';
import { useTerminalStore } from '../../store/terminalStore';
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

export const ReasoningAccordion: React.FC = () => {
  const { analysis } = useTerminalStore();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!analysis?.reasoning || analysis.reasoning.length === 0) return null;

  return (
    <div className="p-4 bg-surface/95 border border-border rounded-xl space-y-3 select-none">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          🧠 Quantitative Reasoning Engine
        </h4>
        <span className="text-[10px] text-slate-500 font-mono">
          {analysis.reasoning.length} Factors Analyzed
        </span>
      </div>

      <div className="space-y-2">
        {analysis.reasoning.map((item, idx) => {
          const isExpanded = expandedIndex === idx;
          const isBullish = item.signal === 'bullish';
          const isBearish = item.signal === 'bearish';

          return (
            <div
              key={`${item.category}-${idx}`}
              className="rounded-lg border border-border bg-background/60 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-surface-elevated/50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isBullish ? 'bg-bull' : isBearish ? 'bg-bear' : 'bg-slate-500'
                    }`}
                  />
                  <span className="text-xs font-semibold text-white">
                    {item.category}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                      isBullish
                        ? 'bg-bull/15 text-bull'
                        : isBearish
                        ? 'bg-bear/15 text-bear'
                        : 'bg-slate-700/40 text-slate-400'
                    }`}
                  >
                    {item.signal}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Strength: {(item.strength * 100).toFixed(0)}%
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-border/40 space-y-2 text-xs">
                  <p className="text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                  {item.indicators?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.indicators.map((ind, i) => (
                        <span
                          key={`${ind}-${i}`}
                          className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border/60 text-[10px] text-slate-400 font-mono"
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
