import React from 'react';
import { GameStats } from '../game/types';
import { RotateCcw, Wrench, Trophy, Sparkles, Zap, Award } from 'lucide-react';

interface GameOverScreenProps {
  stats: GameStats;
  onRestart: () => void;
  onOpenGarage: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  stats,
  onRestart,
  onOpenGarage,
}) => {
  const isNewHighScore = stats.score > 0 && stats.score >= stats.highScore;

  return (
    <div className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-4 select-none">
      <div className="bg-gray-950 border-2 border-red-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-red-500/20 flex flex-col items-center gap-6">
        {/* Header Title */}
        <div className="text-center">
          <div className="inline-block px-3 py-1 bg-red-950 border border-red-500/40 rounded-full text-red-400 font-racing text-xs font-bold uppercase tracking-widest mb-1.5">
            WRECKED
          </div>
          <h2 className="text-3xl sm:text-4xl font-racing font-extrabold text-white tracking-wide">
            RACE OVER
          </h2>
        </div>

        {/* New High Score Golden Callout Banner */}
        {isNewHighScore && (
          <div className="w-full bg-gradient-to-r from-amber-600/30 via-amber-500/40 to-amber-600/30 border border-amber-400/60 rounded-xl py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
            <Trophy className="w-5 h-5 text-amber-300" />
            <span className="font-racing font-extrabold text-amber-200 tracking-wider text-sm sm:text-base">
              NEW PERSONAL RECORD!
            </span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
        )}

        {/* Stats Grid Matrix */}
        <div className="w-full grid grid-cols-2 gap-3 font-stats">
          {/* Final Score */}
          <div className="bg-gray-900/90 border border-gray-800 p-3.5 rounded-xl flex flex-col">
            <span className="text-[11px] font-racing text-gray-400 uppercase tracking-wider">FINAL SCORE</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 tabular-nums">
              {stats.score.toLocaleString()}
            </span>
          </div>

          {/* Distance */}
          <div className="bg-gray-900/90 border border-gray-800 p-3.5 rounded-xl flex flex-col">
            <span className="text-[11px] font-racing text-gray-400 uppercase tracking-wider">DISTANCE</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
              {stats.distance >= 1000
                ? `${(stats.distance / 1000).toFixed(2)} km`
                : `${Math.floor(stats.distance)} m`}
            </span>
          </div>

          {/* Coins Collected */}
          <div className="bg-gray-900/90 border border-gray-800 p-3 rounded-xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-racing text-gray-400 uppercase">COINS</span>
              <span className="text-xl font-bold text-amber-300 tabular-nums">+{stats.coins}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-sm">
              $
            </div>
          </div>

          {/* Top Speed */}
          <div className="bg-gray-900/90 border border-gray-800 p-3 rounded-xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-racing text-gray-400 uppercase">TOP SPEED</span>
              <span className="text-xl font-bold text-white tabular-nums">{stats.maxSpeed} <span className="text-xs font-racing text-gray-400">KM/H</span></span>
            </div>
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        {/* Close Call Bonus Info */}
        {stats.nearMisses > 0 && (
          <div className="w-full flex items-center justify-between px-3 py-2 bg-gray-900/60 rounded-lg text-xs font-stats text-gray-300 border border-gray-800">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" /> Close Call Overtakes:
            </span>
            <span className="font-bold text-amber-300 font-racing">+{stats.nearMisses} ({stats.nearMisses * 250} pts)</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3 font-racing">
          <button
            onClick={onRestart}
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 hover:from-amber-400 hover:to-red-400 text-white font-extrabold text-lg rounded-xl shadow-xl shadow-red-500/30 border border-amber-300 flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
            type="button"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN (SPACE)</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-cyan-400 hover:text-cyan-300 border border-cyan-500/40 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors active:scale-95 cursor-pointer"
            type="button"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>VISIT GARAGE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
