import React, { useState } from 'react';
import { CAR_MODELS } from '../game/constants';
import { CarCustomization } from '../game/types';
import { ArrowLeft, Play, Sparkles, Gauge, Activity, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface GarageScreenProps {
  currentCar: CarCustomization;
  onSelectCar: (car: CarCustomization) => void;
  onStartRace: () => void;
  onBackToMenu: () => void;
  totalCoins: number;
}

const NEON_PRESETS = [
  { name: 'Neon Cyan', color: '#06b6d4' },
  { name: 'Laser Crimson', color: '#ef4444' },
  { name: 'Hyper Gold', color: '#f59e0b' },
  { name: 'Acid Emerald', color: '#10b981' },
  { name: 'Ultra Violet', color: '#8b5cf6' },
  { name: 'Ghost White', color: '#f8fafc' },
];

export const GarageScreen: React.FC<GarageScreenProps> = ({
  currentCar,
  onSelectCar,
  onStartRace,
  onBackToMenu,
  totalCoins,
}) => {
  const [activeCarId, setActiveCarId] = useState(currentCar.id);
  const [selectedNeon, setSelectedNeon] = useState(currentCar.neonColor);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  const selectedModel = CAR_MODELS.find(c => c.id === activeCarId) || CAR_MODELS[0];

  const handlePickCar = (car: CarCustomization) => {
    setActiveCarId(car.id);
    const updated = { ...car, neonColor: selectedNeon };
    onSelectCar(updated);
  };

  const handlePickNeon = (neonColor: string) => {
    setSelectedNeon(neonColor);
    const updated = { ...selectedModel, neonColor };
    onSelectCar(updated);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Top Header Navigation */}
      <div className="w-full flex items-center justify-between pointer-events-auto">
        <button
          onClick={onBackToMenu}
          className="px-4 py-2 bg-gray-900/85 hover:bg-gray-800 text-gray-200 hover:text-white rounded-xl border border-gray-700/70 hover:border-cyan-400 flex items-center gap-2 font-racing text-sm transition-all shadow-xl active:scale-95 cursor-pointer"
          type="button"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>MAIN MENU</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="bg-gray-950/85 border border-cyan-500/30 px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-xl">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs uppercase font-racing text-gray-300">TURBO SHOWROOM</span>
          </div>
          <div className="bg-gray-950/85 border border-amber-500/30 px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-xl">
            <span className="text-amber-400 font-bold font-stats text-sm">${totalCoins}</span>
          </div>
        </div>
      </div>

      {/* Center 3D Viewport is completely unobstructed! The car rotates smoothly in the scene */}

      {/* Consolidated Ergonomic Bottom Dock (Collapsible as per Three.js constitution) */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center pointer-events-auto transition-transform duration-300 ease-in-out">
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="mb-1 px-4 py-1 bg-gray-900/90 border border-gray-700 hover:border-cyan-400 rounded-t-lg text-xs font-racing text-gray-300 hover:text-cyan-400 flex items-center gap-1.5 cursor-pointer shadow-lg"
          type="button"
        >
          {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isDockCollapsed ? 'SHOW CUSTOMIZER' : 'HIDE HUD (CINEMA VIEW)'}</span>
        </button>

        {!isDockCollapsed && (
          <div className="w-full bg-gray-950/92 border border-gray-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 backdrop-blur-none">
            {/* 1. Car Model Selection Cards */}
            <div>
              <span className="text-xs font-racing font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                SELECT SUPERCAR MODEL & PAINT
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {CAR_MODELS.map(car => {
                  const isSelected = car.id === activeCarId;
                  return (
                    <button
                      key={car.id}
                      onClick={() => handlePickCar(car)}
                      className={`relative p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20'
                          : 'border-gray-800 bg-gray-900/60 hover:border-gray-700 hover:bg-gray-800/60'
                      }`}
                      type="button"
                    >
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white/60 shadow-md"
                        style={{ backgroundColor: car.primaryColor }}
                      />
                      <span className="text-[11px] font-racing font-bold text-gray-200 text-center leading-tight truncate w-full">
                        {car.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Specs & Underglow Neon Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 border-t border-gray-800/80">
              {/* Vehicle Performance Specs */}
              <div className="flex flex-col justify-center gap-2">
                <div className="flex items-center justify-between text-xs font-racing">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" /> TOP SPEED
                  </span>
                  <span className="text-white font-stats font-bold">{selectedModel.topSpeed} KM/H</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${(selectedModel.topSpeed / 250) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-racing">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" /> ACCELERATION
                  </span>
                  <span className="text-white font-stats font-bold">{selectedModel.acceleration} / 100</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${selectedModel.acceleration}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-racing">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> HANDLING
                  </span>
                  <span className="text-white font-stats font-bold">{selectedModel.handling} / 100</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${selectedModel.handling}%` }}
                  />
                </div>
              </div>

              {/* Underglow Neon Kit Selection & Race CTA */}
              <div className="flex flex-col justify-between gap-3">
                <div>
                  <span className="text-xs font-racing font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    UNDERGLOW NEON SYSTEM
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {NEON_PRESETS.map(n => (
                      <button
                        key={n.name}
                        onClick={() => handlePickNeon(n.color)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                          selectedNeon === n.color ? 'scale-125 border-white shadow-lg' : 'border-gray-700 opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: n.color }}
                        title={n.name}
                        type="button"
                      />
                    ))}
                  </div>
                </div>

                {/* Primary Race CTA */}
                <button
                  onClick={onStartRace}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 hover:from-amber-400 hover:to-red-400 text-white font-racing font-extrabold text-base rounded-xl border border-amber-300 shadow-xl shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
                  type="button"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>LOCK IN & RACE</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
