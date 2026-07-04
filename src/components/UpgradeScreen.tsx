import React from 'react';
import { Heart, Shield, Zap, Flame, Award, RefreshCw } from 'lucide-react';
import { UpgradeOption, Player } from '../types';
import { sound } from '../utils/sound';

interface UpgradeScreenProps {
  onSelectUpgrade: (upgradeId: string) => void;
  wave: number;
}

// Define available upgrade cards
const allUpgrades: UpgradeOption[] = [
  {
    id: 'max_hp',
    title: "Titan Saflari (+Max HP)",
    description: "Barcha tirik o'yinchilarning maksimal salomatligi (Max HP) 25% ga oshadi va barchaning joni to'ldiriladi.",
    icon: 'heart',
    effect: (players: Player[]) => {
      players.forEach(p => {
        p.maxHp = Math.round(p.maxHp * 1.25);
        p.hp = p.maxHp;
        p.isDowned = false;
      });
    }
  },
  {
    id: 'damage',
    title: "Og'ir O'qlar (+Zarar)",
    description: "Barcha qurollarning beradigan zarari (Damage) doimiy ravishda 20% ga oshadi.",
    icon: 'flame',
    effect: (players: Player[]) => {
      players.forEach(p => {
        p.damageMultiplier = p.damageMultiplier * 1.2;
      });
    }
  },
  {
    id: 'speed',
    title: "Taktik Etiklar (+Tezlik)",
    description: "Barcha o'yinchilarning harakatlanish tezligi 15% ga oshadi (zombilardan qochish osonlashadi).",
    icon: 'zap',
    effect: (players: Player[]) => {
      players.forEach(p => {
        p.speedMultiplier = p.speedMultiplier * 1.15;
      });
    }
  },
  {
    id: 'fire_rate',
    title: "Adrenalin (+Tezkor Otish)",
    description: "Qurollarning qayta o'qlanish va otish tezligi (Fire Rate) 15% ga tezlashadi.",
    icon: 'shield',
    effect: (players: Player[]) => {
      players.forEach(p => {
        p.fireRateMultiplier = p.fireRateMultiplier * 1.15;
      });
    }
  },
  {
    id: 'supply_drop',
    title: "Gumanitar Yordam (Ammo & Revive)",
    description: "Yiqilgan barcha o'yinchilar darhol qayta tiriltiriladi va barcha qurollarning o'q-dorilari 100% ga to'ldiriladi.",
    icon: 'award',
    effect: (players: Player[]) => {
      players.forEach(p => {
        p.isDowned = false;
        p.hp = Math.max(p.hp, Math.round(p.maxHp * 0.5)); // ensure at least 50% hp
        // refill ammo
        Object.keys(p.weapons).forEach(key => {
          const w = p.weapons[key as any];
          if (w.maxAmmo > 0) {
            w.ammo = w.maxAmmo;
          }
        });
      });
    }
  },
  {
    id: 'bullet_range',
    title: "Super Snayper (Ko'lam va Piercing)",
    description: "O'qlarning uchish masofasi 30% ga uzayadi va snayper o'qlarining teshish qobiliyati kuchayadi.",
    icon: 'refresh',
    effect: (players: Player[]) => {
      players.forEach(p => {
        // Increase player stats slightly for bullet performance
        p.damageMultiplier = p.damageMultiplier * 1.1;
      });
    }
  }
];

export default function UpgradeScreen({ onSelectUpgrade, wave }: UpgradeScreenProps) {
  // Get 3 random unique upgrades
  const getRandomUpgrades = (): UpgradeOption[] => {
    const shuffled = [...allUpgrades].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  const [choices] = React.useState<UpgradeOption[]>(getRandomUpgrades());

  const handleSelect = (upgradeId: string) => {
    sound.playPickup();
    onSelectUpgrade(upgradeId);
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'heart': return <Heart className="w-10 h-10 text-red-500" />;
      case 'flame': return <Flame className="w-10 h-10 text-orange-500" />;
      case 'zap': return <Zap className="w-10 h-10 text-yellow-500" />;
      case 'shield': return <Shield className="w-10 h-10 text-blue-500" />;
      case 'award': return <Award className="w-10 h-10 text-emerald-500" />;
      default: return <RefreshCw className="w-10 h-10 text-purple-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-gray-950 border-2 border-amber-500/40 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] text-center">
        
        {/* Glow header */}
        <div className="mb-6">
          <span className="px-3 py-1 text-xs font-bold font-mono tracking-widest text-amber-500 bg-amber-950/45 border border-amber-500/30 rounded-full uppercase">
            {wave}-TO'LQIN YENGILDI!
          </span>
          <h2 className="text-3xl font-extrabold text-white font-mono mt-3 uppercase tracking-wider">
            JAMOA UCHUN YAXSHILASH TANLANG
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Har 3 to'lqinda jamoangizni yanada kuchaytirish imkoniyati beriladi. Istalgan bitta kartani bosing!
          </p>
        </div>

        {/* Upgrade Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
          {choices.map((upgrade) => (
            <button
              key={upgrade.id}
              onClick={() => handleSelect(upgrade.id)}
              className="group relative flex flex-col items-center justify-between p-6 bg-gray-900/60 hover:bg-gray-900 border-2 border-gray-800 hover:border-amber-500/80 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer text-center h-full min-h-[240px]"
            >
              {/* Card top flare */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex flex-col items-center w-full">
                {/* Icon wrapper */}
                <div className="w-16 h-16 rounded-full bg-gray-950 border border-gray-800 flex items-center justify-center mb-4 group-hover:border-amber-500/30 transition-colors">
                  {renderIcon(upgrade.icon)}
                </div>

                {/* Title */}
                <h4 className="text-lg font-bold text-gray-100 font-mono mb-2 group-hover:text-amber-400 transition-colors">
                  {upgrade.title}
                </h4>

                {/* Description */}
                <p className="text-gray-400 text-xs font-sans leading-relaxed">
                  {upgrade.description}
                </p>
              </div>

              {/* Action Button Label */}
              <div className="w-full mt-6 py-2 px-4 rounded-lg bg-gray-950 text-[11px] font-bold font-mono text-gray-500 group-hover:text-amber-500 group-hover:bg-amber-950/25 border border-gray-800 group-hover:border-amber-500/20 transition-all uppercase tracking-wider">
                Tanlash
              </div>
            </button>
          ))}
        </div>

        {/* Informative text */}
        <p className="text-[11px] text-gray-500 font-sans italic">
          * Ushbu yaxshilanish barcha o'yinchilarga qo'llanadi va keyingi to'lqinlarda saqlanib qoladi.
        </p>
      </div>
    </div>
  );
}
export { allUpgrades as ALL_UPGRADE_PRESETS };
