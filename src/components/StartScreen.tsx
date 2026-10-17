import React, { useState } from 'react';
import { CarCustomization, GameStats } from '../game/types';
import { Play, Wrench, HelpCircle, Volume2, VolumeX, Trophy, Coins, Zap } from 'lucide-react';

interface StartScreenProps {
  onStartGame: () => void;
  onOpenGarage: () => void;
  selectedCar: CarCustomization;
  stats: GameStats;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartGame,
  onOpenGarage,
  selectedCar,
  stats,
  isMuted,
  onToggleMute,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-6 sm:p-10">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between pointer-events-auto">
        {/* High Score & Coins Record Pills */}
        <div className="flex items-center gap-3">
          <div className="bg-gray-950/85 border border-amber-500/30 px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-xl">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-racing font-bold">BEST SCORE</span>
              <span className="text-base sm:text-lg font-bold font-stats text-amber-300 tabular-nums">
                {stats.highScore.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-gray-950/85 border border-cyan-500/30 px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-xl">
            <Coins className="w-4 h-4 text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-racing font-bold">TOTAL BANK</span>
              <span className="text-base sm:text-lg font-bold font-stats text-cyan-300 tabular-nums">
                {stats.totalCoins.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Audio Mute & Help Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowHowToPlay(true)}
            className="w-10 h-10 rounded-lg bg-gray-900/80 border border-gray-700/70 hover:border-cyan-400 text-gray-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
            title="How to Play"
            type="button"
          >
            <HelpCircle className="w-5 h-5 text-gray-300" />
          </button>
          <button
            onClick={onToggleMute}
            className="w-10 h-10 rounded-lg bg-gray-900/80 border border-gray-700/70 hover:border-cyan-400 text-gray-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
            title={isMuted ? 'Unmute' : 'Mute'}
            type="button"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Hero Center Lockup: Inline SVG Title Logo over 35% negative space */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-auto">
        <div className="max-w-2xl w-full px-4 text-center">
          {/* Custom SVG Title Lockup */}
          <svg className="w-full h-auto max-h-36 drop-shadow-[0_10px_25px_rgba(6,182,212,0.4)]" viewBox="0 0 800 190">
            <defs>
              <linearGradient id="turboGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="rushGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Backing speed streaks */}
            <path d="M 60,60 L 740,60" stroke="#06b6d4" strokeWidth="2" strokeDasharray="20 15" opacity="0.4" />
            <path d="M 120,135 L 680,135" stroke="#f59e0b" strokeWidth="2" strokeDasharray="30 20" opacity="0.4" />

            {/* TURBO RUSH Text with dynamic slant */}
            <text
              x="400"
              y="95"
              textAnchor="middle"
              fontFamily="Orbitron, sans-serif"
              fontWeight="900"
              fontSize="82"
              fontStyle="italic"
              fill="url(#turboGrad)"
              letterSpacing="8"
              filter="url(#glow)"
            >
              TURBO RUSH
            </text>

            {/* RACING Subtitle banner */}
            <text
              x="400"
              y="155"
              textAnchor="middle"
              fontFamily="Orbitron, sans-serif"
              fontWeight="800"
              fontSize="34"
              letterSpacing="18"
              fill="url(#rushGrad)"
            >
              RACING
            </text>
          </svg>

          {/* Current Car Badge */}
          <div className="inline-flex items-center gap-2.5 mt-2 bg-gray-950/80 border border-gray-800 px-4 py-1.5 rounded-full shadow-lg">
            <span className="text-xs uppercase font-racing text-gray-400">Current Ride:</span>
            <div className="flex items-center gap-2">
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/50"
                style={{ backgroundColor: selectedCar.primaryColor }}
              />
              <span className="text-sm font-racing font-bold text-white">{selectedCar.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA & Controls Hint */}
      <div className="w-full flex flex-col items-center gap-4 pointer-events-auto">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Main Start Button */}
          <button
            onClick={onStartGame}
            className="group relative px-10 py-4 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 hover:from-amber-400 hover:to-red-400 text-white font-racing font-extrabold text-lg sm:text-xl rounded-xl shadow-2xl shadow-red-500/30 border border-amber-300 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            type="button"
          >
            <Play className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
            <span>START RACE</span>
          </button>

          {/* Garage Tuning Button */}
          <button
            onClick={onOpenGarage}
            className="px-6 py-4 bg-gray-900/90 hover:bg-gray-800/90 text-cyan-400 hover:text-cyan-300 font-racing font-bold text-base sm:text-lg rounded-xl border border-cyan-500/40 hover:border-cyan-400 flex items-center gap-2.5 shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
            type="button"
          >
            <Wrench className="w-5 h-5 text-cyan-400" />
            <span>GARAGE</span>
          </button>
        </div>

        {/* Single flat control-hint line conforming to Game Craft Constitution */}
        <div className="text-center">
          <p className="text-xs sm:text-sm font-stats text-gray-400 tracking-wider">
            <span className="text-gray-200">WASD / Arrows</span> Steer & Drive · <span className="text-cyan-300 font-bold">Space</span> Nitro Boost · <span className="text-gray-200">Esc</span> Pause
          </p>
        </div>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-gray-950 border border-cyan-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-xl font-racing font-extrabold text-cyan-400 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" /> RULES OF THE ROAD
              </h2>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-gray-400 hover:text-white text-lg font-bold px-2 py-1"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-sm text-gray-300 font-stats">
              <div className="flex items-start gap-3 bg-gray-900/70 p-3 rounded-lg border border-gray-800">
                <div className="w-7 h-7 rounded-full bg-cyan-950 text-cyan-400 font-racing font-bold flex items-center justify-center shrink-0 border border-cyan-500/30">1</div>
                <p>Dodge dynamic highway traffic (sedans, trucks, SUVs). Avoid crashes at all costs!</p>
              </div>

              <div className="flex items-start gap-3 bg-gray-900/70 p-3 rounded-lg border border-gray-800">
                <div className="w-7 h-7 rounded-full bg-amber-950 text-amber-400 font-racing font-bold flex items-center justify-center shrink-0 border border-amber-500/30">2</div>
                <p>Collect gold coins to build your garage bank and grab cyan nitro canisters for instant boost.</p>
              </div>

              <div className="flex items-start gap-3 bg-gray-900/70 p-3 rounded-lg border border-gray-800">
                <div className="w-7 h-7 rounded-full bg-red-950 text-red-400 font-racing font-bold flex items-center justify-center shrink-0 border border-red-500/30">3</div>
                <p>Overtake traffic closely without hitting them to trigger <strong className="text-amber-300">CLOSE CALL (+250 PTS)</strong> combo bonuses!</p>
              </div>

              <div className="flex items-start gap-3 bg-gray-900/70 p-3 rounded-lg border border-gray-800">
                <div className="w-7 h-7 rounded-full bg-purple-950 text-purple-400 font-racing font-bold flex items-center justify-center shrink-0 border border-purple-500/30">4</div>
                <p>On mobile devices, use the responsive on-screen steering buttons, gas, brake, and boost pedals.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-racing font-bold rounded-xl transition-colors cursor-pointer"
              type="button"
            >
              GOT IT, LET'S RACE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
