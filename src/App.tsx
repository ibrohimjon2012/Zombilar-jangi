import React, { useState } from 'react';
import ControlsOverview from './components/ControlsOverview';
import GameCanvas from './components/GameCanvas';
import GameOverScreen from './components/GameOverScreen';
import UpgradeScreen from './components/UpgradeScreen';
import { Sparkles, HelpCircle, Shield, Volume2, VolumeX, Swords } from 'lucide-react';
import { sound } from './utils/sound';

export default function App() {
  const [step, setStep] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [activePlayers, setActivePlayers] = useState<boolean[]>([true, true, false, false]); // Player 1 & 2 default active
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Upgrade choices state
  const [isUpgradeActive, setIsUpgradeActive] = useState<boolean>(false);
  const [upgradeWave, setUpgradeWave] = useState<number>(0);
  const [upgradeIdApplied, setUpgradeIdApplied] = useState<string | null>(null);

  // Final game statistics
  const [finalStats, setFinalStats] = useState<{
    wave: number;
    score: number;
    playerKills: number[];
    mvpName: string;
    mvpKills: number;
  } | null>(null);

  const togglePlayer = (index: number) => {
    const updated = [...activePlayers];
    updated[index] = !updated[index];
    
    // Ensure at least one player is active
    if (updated.filter(Boolean).length >= 1) {
      setActivePlayers(updated);
      if (soundEnabled) {
        sound.playPickup();
      }
    }
  };

  const handleStartGame = () => {
    sound.toggle(soundEnabled);
    if (soundEnabled) {
      sound.playPlayerRevived();
    }
    setStep('playing');
    setIsUpgradeActive(false);
    setUpgradeIdApplied(null);
  };

  const handleUpgradeTriggered = (waveNumber: number) => {
    setUpgradeWave(waveNumber);
    setIsUpgradeActive(true);
  };

  const handleSelectUpgrade = (upgradeId: string) => {
    setUpgradeIdApplied(upgradeId);
    setIsUpgradeActive(false);
  };

  const handleGameOver = (stats: {
    wave: number;
    score: number;
    playerKills: number[];
    mvpName: string;
    mvpKills: number;
  }) => {
    setFinalStats(stats);
    setStep('gameover');
    if (soundEnabled) {
      sound.playPlayerDowned();
    }
  };

  const handleRestart = () => {
    setStep('menu');
    setFinalStats(null);
    setIsUpgradeActive(false);
    setUpgradeIdApplied(null);
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-gray-100 flex flex-col justify-between overflow-x-hidden select-none font-sans relative pb-8">
      
      {/* Ambient background styling */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.06),transparent_40%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(37,99,235,0.04),transparent_50%)] pointer-events-none"></div>

      {/* Main Header / Title Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500">
            <Swords size={18} />
          </div>
          <div>
            <span className="font-mono font-bold tracking-wider text-xs text-red-500 uppercase block leading-none">
              APPOKALIPSIS CO-OP
            </span>
            <span className="font-mono font-extrabold text-sm text-gray-200 uppercase tracking-widest leading-none mt-1 block">
              Zombi Qamali
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-1 text-gray-500">
            <Shield size={14} className="text-red-500/70" />
            <span>Versiya: v1.1.0</span>
          </div>
          <div className="text-gray-400 bg-gray-900/60 border border-gray-800 px-3 py-1 rounded-md">
            🇺🇿 O'zbekcha talqin
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 flex items-center justify-center py-4 z-10">
        {step === 'menu' && (
          <ControlsOverview
            activePlayers={activePlayers}
            togglePlayer={togglePlayer}
            onStartGame={handleStartGame}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
          />
        )}

        {step === 'playing' && (
          <div className="w-full relative">
            <GameCanvas
              activePlayers={activePlayers}
              onGameOver={handleGameOver}
              onUpgradeTriggered={handleUpgradeTriggered}
              upgradeIdApplied={upgradeIdApplied}
              clearUpgradeTrigger={() => setUpgradeIdApplied(null)}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
            />

            {/* In-game upgrade selection overlay */}
            {isUpgradeActive && (
              <UpgradeScreen
                wave={upgradeWave}
                onSelectUpgrade={handleSelectUpgrade}
              />
            )}
          </div>
        )}

        {step === 'gameover' && finalStats && (
          <GameOverScreen
            stats={finalStats}
            activePlayers={activePlayers}
            onRestart={handleRestart}
          />
        )}
      </main>

      {/* Footer copyright credit */}
      <footer className="w-full text-center text-gray-600 text-xs mt-6 z-10 font-mono">
        <p>© 2026 Zombi Qamali. Barcha huquqlar himoyalangan. HTML5 Canvas & React Co-op Engine.</p>
        <p className="text-[10px] mt-1 text-gray-700">Dizayn va dasturlash o'zbek tilida tayyorlandi.</p>
      </footer>
    </div>
  );
}
