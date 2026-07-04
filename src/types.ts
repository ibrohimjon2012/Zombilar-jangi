export type WeaponType = 'pistol' | 'shotgun' | 'machinegun' | 'sniper';

export interface WeaponInfo {
  name: string;
  type: WeaponType;
  damage: number;
  fireRate: number; // ms between shots
  bulletSpeed: number;
  ammo: number; // -1 for infinite
  maxAmmo: number; // -1 for infinite
  color: string;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  isDowned: boolean;
  reviveProgress: number; // 0 to 100
  kills: number;
  score: number;
  angle: number;
  active: boolean;
  weapon: WeaponType;
  weapons: { [key in WeaponType]: WeaponInfo };
  lastShotTime: number;
  speedMultiplier: number;
  damageMultiplier: number;
  fireRateMultiplier: number;
}

export type ZombieType = 'normal' | 'fast' | 'tank';

export interface Zombie {
  id: string;
  type: ZombieType;
  x: number;
  y: number;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  damage: number;
  color: string;
  scoreValue: number;
  angle: number;
  colorFlashMs: number; // for damage flash
}

export interface Bullet {
  id: string;
  playerId: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  range: number;
  distanceTraveled: number;
}

export type LootType = 'medkit' | 'ammo_shotgun' | 'ammo_machinegun' | 'ammo_sniper' | 'speed_boost';

export interface Loot {
  id: string;
  type: LootType;
  x: number;
  y: number;
  radius: number;
  duration?: number; // for transient items
  createdAt: number;
}

export interface BloodSplatter {
  id: string;
  x: number;
  y: number;
  size: number;
  angle: number;
  opacity: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  decay: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
}

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  effect: (players: Player[]) => void;
}
