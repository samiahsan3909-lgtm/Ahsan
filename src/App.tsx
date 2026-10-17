import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { CAR_MODELS } from './game/constants';
import { CarCustomization, GameMode, GameStats, InputState } from './game/types';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { GarageScreen } from './components/GarageScreen';
import { PauseScreen } from './components/PauseScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { sounds } from './audio/SoundEffects';
import { AlertTriangle } from 'lucide-react';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [mode, setMode] = useState<GameMode>('MENU');
  const [selectedCar, setSelectedCar] = useState<CarCustomization>(() => {
    const saved = localStorage.getItem('turbo_rush_selected_car');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return CAR_MODELS[0];
      }
    }
    return CAR_MODELS[0];
  });

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    distance: 0,
    coins: 0,
    speed: 0,
    maxSpeed: 0,
    nitro: 100,
    isNitroActive: false,
    nearMisses: 0,
    multiplier: 1,
    highScore: 0,
    totalCoins: 0,
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());
  const [nearMissNotice, setNearMissNotice] = useState<string | null>(null);
  const [webGlError, setWebGlError] = useState<string | null>(null);

  // Near miss notice timer
  const nearMissTimerRef = useRef<number | null>(null);

  const handleNearMiss = useCallback((points: number) => {
    if (nearMissTimerRef.current) {
      window.clearTimeout(nearMissTimerRef.current);
    }
    setNearMissNotice(`CLOSE CALL +${points}!`);
    nearMissTimerRef.current = window.setTimeout(() => {
      setNearMissNotice(null);
    }, 1100);
  }, []);

  const handleStatsUpdate = useCallback((newStats: GameStats) => {
    setStats(newStats);
  }, []);

  const handleGameOver = useCallback((finalStats: GameStats) => {
    setStats(finalStats);
    setMode('GAMEOVER');
  }, []);

  const handleCoinCollected = useCallback((totalCoins: number) => {
    setStats(prev => ({ ...prev, totalCoins }));
  }, []);

  // Initialize GameEngine
  useEffect(() => {
    if (!canvasMountRef.current) return;

    try {
      const engine = new GameEngine(canvasMountRef.current, {
        onStatsUpdate: handleStatsUpdate,
        onNearMiss: handleNearMiss,
        onGameOver: handleGameOver,
        onCoinCollected: handleCoinCollected,
      });

      engine.setCarCustomization(selectedCar);
      engine.setMode('MENU');
      engineRef.current = engine;
    } catch (err: unknown) {
      console.error('Failed to initialize 3D Engine:', err);
      setWebGlError(err instanceof Error ? err.message : 'WebGL 3D engine failed to initialize');
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [handleStatsUpdate, handleNearMiss, handleGameOver, handleCoinCollected]);

  // Input bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentMode = engineRef.current ? engineRef.current.getMode() : mode;

      // Global pause toggle
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (currentMode === 'PLAYING') {
          engineRef.current?.setMode('PAUSED');
          setMode('PAUSED');
          return;
        } else if (currentMode === 'PAUSED') {
          engineRef.current?.setMode('PLAYING');
          setMode('PLAYING');
          return;
        }
      }

      // Quick start/restart with Space or Enter
      if ((e.code === 'Space' || e.code === 'Enter') && currentMode === 'MENU') {
        e.preventDefault();
        startGame();
        return;
      }

      if ((e.code === 'Space' || e.code === 'Enter') && currentMode === 'GAMEOVER') {
        e.preventDefault();
        restartGame();
        return;
      }

      // Driving inputs during PLAYING
      if (currentMode === 'PLAYING' && engineRef.current) {
        const input: Partial<InputState> = {};
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          input.steerLeft = true;
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          input.steerRight = true;
        }
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          input.accelerate = true;
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          input.brake = true;
        }
        if (e.code === 'Space') {
          e.preventDefault();
          input.nitro = true;
        }
        engineRef.current.setInput(input);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (engineRef.current) {
        const input: Partial<InputState> = {};
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          input.steerLeft = false;
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          input.steerRight = false;
        }
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          input.accelerate = false;
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          input.brake = false;
        }
        if (e.code === 'Space') {
          input.nitro = false;
        }
        engineRef.current.setInput(input);
      }
    };

    const handleBlur = () => {
      // Clear all inputs on window blur to prevent sticky keys
      engineRef.current?.setInput({
        steerLeft: false,
        steerRight: false,
        accelerate: false,
        brake: false,
        nitro: false,
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [mode]);

  // Actions
  const startGame = () => {
    if (!engineRef.current) return;
    engineRef.current.resetGame();
    setMode('PLAYING');
  };

  const restartGame = () => {
    if (!engineRef.current) return;
    engineRef.current.resetGame();
    setMode('PLAYING');
  };

  const openGarage = () => {
    if (!engineRef.current) return;
    engineRef.current.setMode('GARAGE');
    setMode('GARAGE');
  };

  const backToMenu = () => {
    if (!engineRef.current) return;
    engineRef.current.setMode('MENU');
    setMode('MENU');
  };

  const handleSelectCar = (car: CarCustomization) => {
    setSelectedCar(car);
    localStorage.setItem('turbo_rush_selected_car', JSON.stringify(car));
    engineRef.current?.setCarCustomization(car);
  };

  const toggleMute = () => {
    const newState = sounds.toggleMute();
    setIsMuted(newState);
  };

  const handleInputStateChange = (input: Partial<InputState>) => {
    engineRef.current?.setInput(input);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-racing">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* WebGL Error Fallback */}
      {webGlError && (
        <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-6 text-center">
          <div className="bg-gray-900 border border-red-500 rounded-2xl p-8 max-w-md flex flex-col items-center gap-4">
            <AlertTriangle className="w-12 h-12 text-red-400" />
            <h2 className="text-xl font-bold text-white">3D Graphic Engine Error</h2>
            <p className="text-sm text-gray-300 font-stats">{webGlError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl"
              type="button"
            >
              Reload Game
            </button>
          </div>
        </div>
      )}

      {/* Screen States */}
      {mode === 'MENU' && (
        <StartScreen
          onStartGame={startGame}
          onOpenGarage={openGarage}
          selectedCar={selectedCar}
          stats={stats}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {mode === 'GARAGE' && (
        <GarageScreen
          currentCar={selectedCar}
          onSelectCar={handleSelectCar}
          onStartRace={startGame}
          onBackToMenu={backToMenu}
          totalCoins={stats.totalCoins}
        />
      )}

      {mode === 'PLAYING' && (
        <HUD
          stats={stats}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onPause={() => {
            engineRef.current?.setMode('PAUSED');
            setMode('PAUSED');
          }}
          onInputStateChange={handleInputStateChange}
          nearMissNotice={nearMissNotice}
        />
      )}

      {mode === 'PAUSED' && (
        <PauseScreen
          onResume={() => {
            engineRef.current?.setMode('PLAYING');
            setMode('PLAYING');
          }}
          onRestart={restartGame}
          onOpenGarage={openGarage}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {mode === 'GAMEOVER' && (
        <GameOverScreen
          stats={stats}
          onRestart={restartGame}
          onOpenGarage={openGarage}
        />
      )}
    </div>
  );
}
