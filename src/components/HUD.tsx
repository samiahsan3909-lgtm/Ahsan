import React from 'react';
import { GameStats, InputState } from '../game/types';
import { Volume2, VolumeX, Pause, Zap } from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onInputStateChange: (input: Partial<InputState>) => void;
  nearMissNotice: string | null;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  isMuted,
  onToggleMute,
  onPause,
  onInputStateChange,
  nearMissNotice,
}) => {
  // Mobile touch helper with pointer capture to prevent scroll
  const handleTouchStart = (key: keyof InputState, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onInputStateChange({ [key]: true });
  };

  const handleTouchEnd = (key: keyof InputState, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onInputStateChange({ [key]: false });
  };

  // Speedometer calculation (0 to 250 km/h)
  const speedRatio = Math.min(stats.speed / 240, 1);
  const strokeDashoffset = 283 - 283 * 0.75 * speedRatio;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Top Header Cluster */}
      <div className="w-full flex items-start justify-between">
        {/* Left Stats Cluster: Distance & Coins */}
        <div className="flex flex-col gap-2">
          {/* Distance */}
          <div className="bg-gray-950/80 border border-cyan-500/30 px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-racing font-bold">DIST</span>
            <span className="text-xl sm:text-2xl font-bold font-stats text-white tabular-nums tracking-wider">
              {stats.distance >= 1000
                ? `${(stats.distance / 1000).toFixed(2)} km`
                : `${Math.floor(stats.distance)} m`}
            </span>
          </div>

          {/* Coins */}
          <div className="bg-gray-950/80 border border-amber-500/30 px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-black font-extrabold text-[11px] border border-amber-200">
              $
            </div>
            <span className="text-xl sm:text-2xl font-bold font-stats text-amber-300 tabular-nums tracking-wider">
              {stats.coins}
            </span>
          </div>
        </div>

        {/* Center: Near Miss Alert banner */}
        <div className="flex-1 flex justify-center items-start pt-1 px-4">
          {nearMissNotice && (
            <div className="bg-gradient-to-r from-red-600/90 via-amber-500/90 to-red-600/90 text-white px-5 py-1.5 rounded-full border border-amber-300 shadow-xl shadow-amber-500/20 font-racing font-extrabold text-sm sm:text-base tracking-widest uppercase transform scale-105 transition-all">
              ⚡ {nearMissNotice}
            </div>
          )}
        </div>

        {/* Right Stats Cluster: Score & Actions */}
        <div className="flex flex-col items-end gap-2">
          {/* Score */}
          <div className="bg-gray-950/80 border border-cyan-500/30 px-4 py-1.5 rounded-lg flex flex-col items-end shadow-lg">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-racing font-bold">SCORE</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-stats text-cyan-400 tabular-nums tracking-wider">
              {stats.score.toLocaleString()}
            </span>
          </div>

          {/* Top Actions: Pause and Mute */}
          <div className="flex gap-2 pointer-events-auto">
            <button
              onClick={onToggleMute}
              className="w-10 h-10 rounded-lg bg-gray-900/80 border border-gray-700/60 hover:border-cyan-400 text-gray-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
              title={isMuted ? 'Unmute' : 'Mute'}
              type="button"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
            </button>
            <button
              onClick={onPause}
              className="w-10 h-10 rounded-lg bg-gray-900/80 border border-gray-700/60 hover:border-cyan-400 text-gray-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
              title="Pause Game (Esc)"
              type="button"
            >
              <Pause className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Area: Speedometer Gauges + Mobile Pedals */}
      <div className="w-full flex items-end justify-between mt-auto">
        {/* Mobile Left / Right Steering Buttons */}
        <div className="flex gap-2.5 sm:gap-4 pointer-events-auto pb-2">
          <button
            onPointerDown={(e) => handleTouchStart('steerLeft', e)}
            onPointerUp={(e) => handleTouchEnd('steerLeft', e)}
            onPointerLeave={(e) => handleTouchEnd('steerLeft', e)}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-900/85 active:bg-cyan-600/40 border-2 border-gray-700/70 active:border-cyan-400 flex items-center justify-center shadow-2xl transition-transform active:scale-90"
            type="button"
            aria-label="Steer Left"
          >
            <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
            </svg>
          </button>
          <button
            onPointerDown={(e) => handleTouchStart('steerRight', e)}
            onPointerUp={(e) => handleTouchEnd('steerRight', e)}
            onPointerLeave={(e) => handleTouchEnd('steerRight', e)}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-900/85 active:bg-cyan-600/40 border-2 border-gray-700/70 active:border-cyan-400 flex items-center justify-center shadow-2xl transition-transform active:scale-90"
            type="button"
            aria-label="Steer Right"
          >
            <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </button>
        </div>

        {/* Center/Cockpit Cluster: Speedometer & Nitro */}
        <div className="flex flex-col items-center bg-gray-950/85 border border-cyan-500/30 px-5 py-3 rounded-2xl shadow-2xl mb-1">
          {/* Circular Speed Arc */}
          <div className="relative w-28 h-20 flex items-center justify-center overflow-hidden">
            <svg className="w-28 h-28 transform -rotate-135" viewBox="0 0 100 100">
              {/* Background Arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#1f2937"
                strokeWidth="7"
                strokeDasharray="210"
                strokeDashoffset="55"
              />
              {/* Active Speed Arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={stats.isNitroActive ? '#06b6d4' : '#f59e0b'}
                strokeWidth="7"
                strokeDasharray="210"
                strokeDashoffset={210 - (210 - 55) * speedRatio}
                strokeLinecap="round"
                className="transition-all duration-75"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
              <span className="text-3xl font-extrabold font-stats text-white tabular-nums tracking-tighter leading-none">
                {stats.speed}
              </span>
              <span className="text-[10px] font-racing text-gray-400 tracking-widest font-bold">KM/H</span>
            </div>
          </div>

          {/* Nitro Gauge Bar */}
          <div className="w-36 mt-1 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] font-racing">
              <span className="text-cyan-400 flex items-center gap-1 font-bold">
                <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" /> NITRO
              </span>
              <span className="text-white font-stats font-bold">{Math.floor(stats.nitro)}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-900 rounded-full border border-gray-700 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  stats.isNitroActive
                    ? 'bg-gradient-to-r from-cyan-400 to-sky-200 shadow-sm shadow-cyan-400'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${stats.nitro}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mobile Right Controls: Brake, Accelerate, Nitro */}
        <div className="flex items-end gap-2 sm:gap-3 pointer-events-auto pb-2">
          {/* Brake Pedal */}
          <button
            onPointerDown={(e) => handleTouchStart('brake', e)}
            onPointerUp={(e) => handleTouchEnd('brake', e)}
            onPointerLeave={(e) => handleTouchEnd('brake', e)}
            className="w-14 h-16 sm:w-16 sm:h-20 rounded-2xl bg-gray-900/85 active:bg-red-600/40 border-2 border-red-500/50 active:border-red-400 flex flex-col items-center justify-center shadow-2xl transition-transform active:scale-90"
            type="button"
            aria-label="Brake"
          >
            <span className="text-xs font-racing font-bold text-red-400">BRAKE</span>
            <svg className="w-5 h-5 text-red-400 fill-current mt-1" viewBox="0 0 24 24">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </button>

          {/* Accelerate Gas Pedal */}
          <button
            onPointerDown={(e) => handleTouchStart('accelerate', e)}
            onPointerUp={(e) => handleTouchEnd('accelerate', e)}
            onPointerLeave={(e) => handleTouchEnd('accelerate', e)}
            className="w-14 h-20 sm:w-16 sm:h-24 rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 active:from-amber-600/40 active:to-amber-700/40 border-2 border-amber-500/60 active:border-amber-400 flex flex-col items-center justify-center shadow-2xl transition-transform active:scale-90"
            type="button"
            aria-label="Gas / Accelerate"
          >
            <svg className="w-6 h-6 text-amber-400 fill-current" viewBox="0 0 24 24">
              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/>
            </svg>
            <span className="text-xs font-racing font-bold text-amber-400 mt-1">GAS</span>
          </button>

          {/* Nitro Rocket Button */}
          <button
            onPointerDown={(e) => handleTouchStart('nitro', e)}
            onPointerUp={(e) => handleTouchEnd('nitro', e)}
            onPointerLeave={(e) => handleTouchEnd('nitro', e)}
            disabled={stats.nitro < 5}
            className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center shadow-2xl transition-transform active:scale-90 border-2 ${
              stats.nitro >= 5
                ? 'bg-cyan-600/30 active:bg-cyan-500/60 border-cyan-400 text-cyan-300'
                : 'bg-gray-900/60 border-gray-800 text-gray-600 opacity-50'
            }`}
            type="button"
            aria-label="Nitro Boost"
          >
            <Zap className="w-5 h-5 fill-current" />
            <span className="text-[10px] font-racing font-extrabold mt-0.5">BOOST</span>
          </button>
        </div>
      </div>
    </div>
  );
};
