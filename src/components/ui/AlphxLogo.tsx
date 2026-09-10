import React from 'react';

interface AlphxLogoProps {
  size?: 'sm' | 'md' | 'lg' | number;
  showText?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const AlphxLogo: React.FC<AlphxLogoProps> = ({
  size = 'md',
  showText = true,
  showBadge = true,
  className = '',
}) => {
  const getDimensions = () => {
    if (typeof size === 'number') return { width: size, height: size };
    switch (size) {
      case 'sm':
        return { width: 28, height: 28 };
      case 'lg':
        return { width: 44, height: 44 };
      case 'md':
      default:
        return { width: 34, height: 34 };
    }
  };

  const { width, height } = getDimensions();

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* ALPHX Vector Mark */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-slate-900 border border-slate-700/60 shadow-lg shadow-white/5 transition-transform duration-300 hover:scale-105"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <svg
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[75%] h-[75%] drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]"
        >
          <defs>
            <linearGradient id="alphxIconWhite" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="alphxIconSilver" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>

          {/* Main Upward Apex (Alpha Pyramid) */}
          <path
            d="M128 396 L256 124 L384 396 L324 396 L256 248 L188 396 Z"
            fill="url(#alphxIconWhite)"
          />

          {/* Sharp Intersecting Diagonal (The X-Vector Strike) */}
          <path
            d="M142 164 L370 384 L336 414 L114 198 Z"
            fill="url(#alphxIconSilver)"
          />

          {/* Precision Core Cutout & Diamond Pulse */}
          <polygon points="256,220 286,260 256,300 226,260" fill="#0A0E17" />
          <polygon points="256,236 272,260 256,284 240,260" fill="url(#alphxIconWhite)" />
        </svg>
      </div>

      {/* Typography: ALPHX */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-base tracking-wider text-white font-mono">
              ALPHX
            </span>
            {showBadge && (
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-white/10 text-slate-200 border border-white/20">
                PRO
              </span>
            )}
          </div>
          <span className="text-[9px] font-mono tracking-widest text-slate-400 font-semibold -mt-0.5">
            QUANT TERMINAL
          </span>
        </div>
      )}
    </div>
  );
};
