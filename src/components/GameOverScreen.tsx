import React from 'react';
import { Skull, Trophy, RefreshCw, Award, LogOut, ChevronRight } from 'lucide-react';

interface GameOverScreenProps {
  stats: {
    wave: number;
    score: number;
    playerKills: number[];
    mvpName: string;
    mvpKills: number;
  };
  activePlayers: boolean[];
  onRestart: () => void;
}

export default function GameOverScreen({ stats, activePlayers, onRestart }: GameOverScreenProps) {
  const playersData = [
    { id: 1, name: "1-O'yinchi", color: "text-blue-400", borderCol: "border-blue-500/30", bgCol: "bg-blue-950/20" },
    { id: 2, name: "2-O'yinchi", color: "text-red-400", borderCol: "border-red-500/30", bgCol: "bg-red-950/20" },
    { id: 3, name: "3-O'yinchi", color: "text-green-400", borderCol: "border-green-500/30", bgCol: "bg-green-950/20" },
    { id: 4, name: "4-O'yinchi", color: "text-yellow-400", borderCol: "border-yellow-500/30", bgCol: "bg-yellow-950/20" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-950 border-2 border-red-600/30 rounded-2xl p-6 md:p-8 shadow-[0_0_60px_rgba(220,38,38,0.15)] backdrop-blur-md text-center animate-scale-in">
      
      {/* Skull Icon Header */}
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse">
          <Skull size={44} className="animate-wiggle" />
        </div>
      </div>

      {/* Primary Death Callout */}
      <h1 className="text-4xl md:text-5xl font-black text-red-600 font-mono tracking-widest uppercase mb-1 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">
        Sizlar Halok Bo'ldingiz!
      </h1>
      <p className="text-gray-400 text-sm tracking-wider uppercase font-sans font-semibold">
        — Jamoa butunlay yo'q qilindi —
      </p>

      {/* Combined Highscore Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto my-8 font-mono">
        <div className="bg-gray-900/60 border border-gray-800 p-4 rounded-xl flex flex-col justify-center items-center">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">MUVAFFAQIYATLI TO'LQINLAR</span>
          <span className="text-3xl font-black text-red-500">{stats.wave - 1}</span>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 p-4 rounded-xl flex flex-col justify-center items-center">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">JAMOA TO'PLAGAN BALLI</span>
          <span className="text-3xl font-black text-yellow-500 flex items-center gap-1.5">
            <Trophy className="text-yellow-500 w-7 h-7 shrink-0" />
            {stats.score}
          </span>
        </div>
      </div>

      {/* MVP Highlight Box */}
      {stats.mvpKills > 0 && (
        <div className="relative max-w-xl mx-auto bg-gradient-to-r from-yellow-950/20 via-yellow-950/40 to-yellow-950/20 border-2 border-yellow-500/40 rounded-2xl p-5 mb-8 overflow-hidden shadow-lg shadow-yellow-900/10">
          <div className="absolute top-0 right-0 -translate-y-2 translate-x-2 w-16 h-16 bg-yellow-500/5 rotate-45 blur-md"></div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)] shrink-0">
              <Award size={28} />
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-yellow-500 font-bold font-mono text-sm uppercase tracking-widest">
                ENG KO'P ZOMBI O'LDIRGAN O'YINCHI (MVP)
              </h4>
              <p className="text-gray-100 text-lg font-black font-mono mt-1">
                {stats.mvpName} — <span className="text-yellow-400">{stats.mvpKills} ta zombi</span> yo'q qildi!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Individual player stats list */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-400 font-mono tracking-widest mb-4 uppercase">
          INDIVIDUAL STATISTIKA
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {playersData.map((p, idx) => {
            const isActive = activePlayers[idx];
            const isMvp = isActive && stats.mvpName === p.name && stats.mvpKills > 0;
            const kills = isActive ? stats.playerKills[idx] || 0 : 0;
            
            return (
              <div
                key={p.id}
                className={`p-4 rounded-xl border font-mono transition-all duration-300 ${
                  isActive
                    ? isMvp
                      ? 'border-yellow-500 bg-yellow-950/10 scale-102 shadow-md shadow-yellow-900/5'
                      : `${p.borderCol} ${p.bgCol}`
                    : 'border-gray-900/35 bg-gray-950/10 opacity-30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-black text-sm tracking-wide ${isActive ? p.color : 'text-gray-600'}`}>
                    {p.name}
                  </span>
                  {isActive ? (
                    isMvp ? (
                      <span className="text-[10px] font-black text-yellow-500 bg-yellow-950 px-1.5 py-0.5 rounded border border-yellow-500/20 uppercase tracking-wider">
                        MVP
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-bold">FAOLLAR</span>
                    )
                  ) : (
                    <span className="text-[10px] text-gray-600">O'CHIQ</span>
                  )}
                </div>

                <div className="text-left mt-3">
                  <div className="flex justify-between text-xs py-1 border-b border-gray-900">
                    <span className="text-gray-500">Kills:</span>
                    <span className={`font-bold ${isActive ? 'text-gray-200' : 'text-gray-600'}`}>
                      {isActive ? kills : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs py-1 mt-1">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-semibold ${isActive ? 'text-red-500' : 'text-gray-600'}`}>
                      {isActive ? "HALOK BO'LDI" : "O'YNADI"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Restart Button */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onRestart}
          id="replay-game-btn"
          className="flex items-center gap-2 px-8 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest uppercase transition-all duration-300 font-mono shadow-lg shadow-red-700/30 hover:shadow-red-600/50 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-5 h-5" />
          Qayta O'ynash
        </button>
      </div>
    </div>
  );
}
