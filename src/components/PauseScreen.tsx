import React from 'react';
import { Play, RotateCcw, Wrench, Volume2, VolumeX } from 'lucide-react';

interface PauseScreenProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenGarage: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseScreen: React.FC<PauseScreenProps> = ({
  onResume,
  onRestart,
  onOpenGarage,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4 select-none">
      <div className="bg-gray-950 border border-cyan-500/40 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center gap-5">
        <h2 className="text-2xl font-racing font-extrabold text-cyan-400 tracking-wider">
          GAME PAUSED
        </h2>

        <div className="w-full flex flex-col gap-3 font-racing">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-lg shadow-cyan-500/20"
            type="button"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>RESUME (ESC)</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-gray-200 hover:text-white border border-gray-700/80 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
            type="button"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>RESTART RACE</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-gray-200 hover:text-white border border-gray-700/80 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
            type="button"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>GARAGE</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
            type="button"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? 'SOUND: MUTED' : 'SOUND: ENABLED'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
