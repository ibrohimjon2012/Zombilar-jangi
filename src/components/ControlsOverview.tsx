import React from 'react';
import { Shield, Skull, Heart, Sword, Crosshair, Users, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../utils/sound';

interface ControlsOverviewProps {
  activePlayers: boolean[];
  togglePlayer: (index: number) => void;
  onStartGame: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export default function ControlsOverview({
  activePlayers,
  togglePlayer,
  onStartGame,
  soundEnabled,
  setSoundEnabled,
}: ControlsOverviewProps) {
  const playersInfo = [
    {
      id: 1,
      name: "1-O'YINCHI",
      color: "from-blue-600 to-indigo-800",
      textCol: "text-blue-400",
      borderCol: "border-blue-500",
      bgCol: "bg-blue-950/40",
      keys: {
        up: "W",
        left: "A",
        down: "S",
        right: "D",
        shoot: "E / Space",
      },
      description: "Jamoa yetakchisi, muvozanatlashgan jangchi."
    },
    {
      id: 2,
      name: "2-O'YINCHI",
      color: "from-red-600 to-rose-800",
      textCol: "text-red-400",
      borderCol: "border-red-500",
      bgCol: "bg-red-950/40",
      keys: {
        up: "▲ (Strelka)",
        left: "◀ (Strelka)",
        down: "▼ (Strelka)",
        right: "▶ (Strelka)",
        shoot: "Enter / /",
      },
      description: "O'ng qanot himoyachisi, tajribali mergan."
    },
    {
      id: 3,
      name: "3-O'YINCHI",
      color: "from-green-600 to-emerald-800",
      textCol: "text-green-400",
      borderCol: "border-green-500",
      bgCol: "bg-green-950/40",
      keys: {
        up: "I",
        left: "J",
        down: "K",
        right: "L",
        shoot: "U",
      },
      description: "Tezkor manyovrchi, yaqin jang ustasi."
    },
    {
      id: 4,
      name: "4-O'YINCHI",
      color: "from-yellow-500 to-amber-700",
      textCol: "text-yellow-400",
      borderCol: "border-yellow-500",
      bgCol: "bg-yellow-950/40",
      keys: {
        up: "T",
        left: "F",
        down: "G",
        right: "H",
        shoot: "R",
      },
      description: "Orqa qanotni tozalovchi, og'ir artilleriya."
    }
  ];

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    sound.toggle(newVal);
    if (newVal) {
      sound.playPickup();
    }
  };

  const activeCount = activePlayers.filter(Boolean).length;

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-950 border-2 border-red-900/50 rounded-2xl shadow-2xl p-6 md:p-8 backdrop-blur-md">
      {/* Title */}
      <div className="text-center mb-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-40 h-10 bg-red-600/10 blur-xl rounded-full"></div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-wider text-red-600 uppercase drop-shadow-[0_0_15px_rgba(220,38,38,0.4)] animate-pulse font-mono">
          Zombi Qamali
        </h1>
        <p className="text-gray-400 text-sm mt-2 tracking-widest uppercase font-sans">
          — 4 O'YINCHI CO-OP APPOKALIPSIS —
        </p>

        {/* Sound Toggle Button */}
        <button
          onClick={toggleSound}
          id="sound-toggle-btn"
          className="absolute top-0 right-0 p-2 rounded-lg bg-gray-900 border border-gray-800 hover:border-red-600 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
          title={soundEnabled ? "Tovushni o'chirish" : "Tovushni yoqish"}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* Narrative */}
      <div className="bg-red-950/15 border border-red-900/30 rounded-xl p-4 mb-8 text-center text-gray-300 max-w-3xl mx-auto">
        <p className="text-sm md:text-base italic leading-relaxed">
          "Dunyo vayron bo'ldi. Zombilar to'lqini har tomondan yopirilib kelmoqda. Omon qolishning yagona yo'li — birgalikda kurashish! Do'stlaringizni to'plang va oxirgi o'qgacha jang qiling!"
        </p>
      </div>

      {/* Player Join Controls */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center justify-center gap-2 font-mono">
          <Users size={20} className="text-red-500" />
          O'YINCHILARNI TANLASH ({activeCount} ta faol)
        </h3>
        <p className="text-center text-xs text-gray-400 mb-6">
          Har bir o'yinchini qo'shish yoki o'chirish uchun katakchani bosing. Kamida 1 ta o'yinchi faol bo'lishi kerak.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {playersInfo.map((player, idx) => {
            const isActive = activePlayers[idx];
            return (
              <button
                key={player.id}
                id={`player-toggle-${player.id}`}
                onClick={() => togglePlayer(idx)}
                className={`relative overflow-hidden p-4 rounded-xl border-2 transition-all duration-300 text-left flex flex-col justify-between cursor-pointer group ${
                  isActive
                    ? `${player.borderCol} bg-gradient-to-b ${player.bgCol} shadow-lg shadow-black/50 scale-102`
                    : 'border-gray-900 bg-gray-900/20 text-gray-500 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold tracking-wider font-mono ${isActive ? player.textCol : 'text-gray-500'}`}>
                    {player.name}
                  </span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    isActive ? `${player.borderCol} bg-red-600/25` : 'border-gray-700'
                  }`}>
                    {isActive && <div className="w-2 h-2 bg-red-500 rounded-sm"></div>}
                  </div>
                </div>
                
                {/* Visual player token */}
                <div className="flex items-center gap-3 my-2">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
                    isActive 
                      ? `${player.borderCol} bg-gradient-to-tr ${player.color} text-white shadow-[0_0_10px_rgba(239,68,68,0.2)]` 
                      : 'border-gray-800 bg-gray-950 text-gray-600'
                  }`}>
                    P{player.id}
                  </div>
                  <div className="text-[11px] leading-tight font-sans">
                    <div className={`font-semibold ${isActive ? 'text-gray-200' : 'text-gray-600'}`}>
                      {isActive ? "TAYYOR" : "FAOLLASHTIRILMAGAN"}
                    </div>
                    <div className="text-gray-500">
                      {isActive ? player.keys.shoot + " otadi" : "O'ynash uchun bosing"}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Layout Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {playersInfo.map((player, idx) => {
          const isActive = activePlayers[idx];
          return (
            <div
              key={player.id}
              className={`p-4 rounded-xl border transition-all ${
                isActive 
                  ? `${player.borderCol} bg-gray-900/40` 
                  : 'border-gray-950 bg-gray-950/20 opacity-35'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full bg-gradient-to-tr ${player.color}`}></span>
                <h4 className={`font-bold font-mono text-sm tracking-wider ${isActive ? player.textCol : 'text-gray-500'}`}>
                  {player.name} BOSHQARUVI
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-gray-950/80 p-2 rounded border border-gray-900 flex justify-between items-center">
                  <span className="text-gray-500">Harakatlanish:</span>
                  <span className={`font-bold ${isActive ? 'text-gray-200' : 'text-gray-600'}`}>
                    {player.keys.up}/{player.keys.left}/{player.keys.down}/{player.keys.right}
                  </span>
                </div>
                <div className="bg-gray-950/80 p-2 rounded border border-gray-900 flex justify-between items-center">
                  <span className="text-gray-500">Otish:</span>
                  <span className={`font-bold ${isActive ? 'text-gray-200' : 'text-gray-600'}`}>
                    {player.keys.shoot}
                  </span>
                </div>
              </div>
              <p className="text-gray-500 text-[11px] mt-2 italic font-sans">
                {player.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Gameplay Mechanics Guideline Cards (Bento-like style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-xs text-gray-400">
        <div className="bg-gray-900/30 border border-gray-900 p-3 rounded-lg flex items-start gap-2.5">
          <Heart size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-gray-200 mb-1 font-mono uppercase">Hamkorlik (Revive)</h5>
            <p>Siz yoki do'stingiz yiqilsa (HP=0), o'yin tugamaydi. Tirik o'yinchi yiqilgan o'yinchining yoniga borib tursa, u avtomatik ravishda qayta tiklanadi!</p>
          </div>
        </div>
        <div className="bg-gray-900/30 border border-gray-900 p-3 rounded-lg flex items-start gap-2.5">
          <Sword size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-gray-200 mb-1 font-mono uppercase">Zombi turlari va Lootlar</h5>
            <p>Zombilardan aptechka (HP), yangi kuchli qurol o'qlari va tezlik oshiruvchilar tushadi. Har 3-to'lqinda jamoaviy doimiy yaxshilanishlar taqdim etiladi!</p>
          </div>
        </div>
        <div className="bg-gray-900/30 border border-gray-900 p-3 rounded-lg flex items-start gap-2.5">
          <Skull size={18} className="text-purple-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-gray-200 mb-1 font-mono uppercase">Xavfli dushmanlar</h5>
            <p>Tezkor zombilar chaqqon va xavfli. Katta tank zombilar esa sekin bo'lsa-da, ulkan HPga va bir zarbada katta shikast yetkazish kuchiga ega.</p>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="text-center">
        {activeCount === 0 ? (
          <div className="text-yellow-500 text-sm mb-4 font-mono font-bold animate-bounce">
            Davom etish uchun kamida bitta o'yinchini tanlang!
          </div>
        ) : null}
        <button
          onClick={onStartGame}
          id="start-game-btn"
          disabled={activeCount === 0}
          className={`px-8 py-4 rounded-xl text-lg font-bold tracking-widest uppercase transition-all duration-300 font-mono cursor-pointer ${
            activeCount > 0
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-700/30 hover:shadow-red-600/50 hover:scale-105 active:scale-95'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          O'yinni boshlash
        </button>
      </div>
    </div>
  );
}
