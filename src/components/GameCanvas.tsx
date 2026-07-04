import React, { useEffect, useRef, useState } from 'react';
import { Player, Zombie, Bullet, Loot, BloodSplatter, Particle, FloatingText, WeaponType, WeaponInfo, ZombieType, LootType } from '../types';
import { sound } from '../utils/sound';
import { ALL_UPGRADE_PRESETS } from './UpgradeScreen';
import { Skull, Heart, Trophy, Zap, ShieldAlert, Play, RefreshCw, Volume2, VolumeX } from 'lucide-react';

interface GameCanvasProps {
  activePlayers: boolean[];
  onGameOver: (stats: {
    wave: number;
    score: number;
    playerKills: number[];
    mvpName: string;
    mvpKills: number;
  }) => void;
  onUpgradeTriggered: (wave: number) => void;
  upgradeIdApplied: string | null;
  clearUpgradeTrigger: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

// Map dimensions
const WIDTH = 1000;
const HEIGHT = 700;

// Obstacles definition
interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const OBSTACLES: Obstacle[] = [
  { x: 450, y: 300, w: 100, h: 100, color: '#1e293b' }, // Center Pillar
  { x: 180, y: 130, w: 80, h: 80, color: '#334155' },   // Top-Left Box
  { x: 740, y: 130, w: 80, h: 80, color: '#334155' },   // Top-Right Box
  { x: 180, y: 490, w: 80, h: 80, color: '#334155' },   // Bottom-Left Box
  { x: 740, y: 490, w: 80, h: 80, color: '#334155' },   // Bottom-Right Box
];

// Weapon initializers
const createWeapons = (): { [key in WeaponType]: WeaponInfo } => ({
  pistol: {
    name: 'Pistolet',
    type: 'pistol',
    damage: 12,
    fireRate: 350,
    bulletSpeed: 9,
    ammo: -1,
    maxAmmo: -1,
    color: '#fbbf24',
  },
  shotgun: {
    name: 'Shotgun',
    type: 'shotgun',
    damage: 11, // per pellet (5 pellets)
    fireRate: 750,
    bulletSpeed: 8,
    ammo: 0,
    maxAmmo: 40,
    color: '#f97316',
  },
  machinegun: {
    name: 'Pulemyot',
    type: 'machinegun',
    damage: 8,
    fireRate: 110,
    bulletSpeed: 10,
    ammo: 0,
    maxAmmo: 150,
    color: '#3b82f6',
  },
  sniper: {
    name: 'Snayper',
    type: 'sniper',
    damage: 65,
    fireRate: 1200,
    bulletSpeed: 16,
    ammo: 0,
    maxAmmo: 15,
    color: '#a855f7',
  }
});

export default function GameCanvas({
  activePlayers,
  onGameOver,
  onUpgradeTriggered,
  upgradeIdApplied,
  clearUpgradeTrigger,
  soundEnabled,
  setSoundEnabled,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Game State Refs to bypass React re-render lag inside gameloop
  const playersRef = useRef<Player[]>([]);
  const zombiesRef = useRef<Zombie[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const lootsRef = useRef<Loot[]>([]);
  const splattersRef = useRef<BloodSplatter[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  
  // Controls Map
  const keysPressed = useRef<Record<string, boolean>>({});

  // Stats / HUD State
  const [wave, setWave] = useState<number>(1);
  const [hudPlayers, setHudPlayers] = useState<Player[]>([]);
  const [globalScore, setGlobalScore] = useState<number>(0);
  const [zombiesLeft, setZombiesLeft] = useState<number>(0);
  const [waveStatusText, setWaveStatusText] = useState<string>("1-TO'LQIN TAYYORLANMOQDA!");
  const [isWaveActive, setIsWaveActive] = useState<boolean>(false);

  // Feedback details
  const screenShake = useRef<number>(0);
  const waveNumber = useRef<number>(1);
  const waveProgress = useRef<'spawning' | 'cleared' | 'waiting'>('waiting');
  const waveTimer = useRef<number>(180); // countdown to start first wave
  const totalZombiesToSpawn = useRef<number>(0);
  const zombiesSpawnedCount = useRef<number>(0);
  const zombieSpawnTimer = useRef<number>(0);
  const teamScore = useRef<number>(0);
  const isLoopRunning = useRef<boolean>(true);

  // Initialize Players
  const initPlayers = () => {
    const playerConfigs = [
      { id: 1, name: "1-O'yinchi", color: '#3b82f6', x: 450, y: 250 },
      { id: 2, name: "2-O'yinchi", color: '#ef4444', x: 550, y: 250 },
      { id: 3, name: "3-O'yinchi", color: '#10b981', x: 450, y: 450 },
      { id: 4, name: "4-O'yinchi", color: '#f59e0b', x: 550, y: 450 },
    ];

    const result: Player[] = [];
    playerConfigs.forEach((cfg, idx) => {
      if (activePlayers[idx]) {
        result.push({
          id: cfg.id,
          name: cfg.name,
          color: cfg.color,
          x: cfg.x,
          y: cfg.y,
          radius: 18,
          speed: 3.2,
          hp: 100,
          maxHp: 100,
          isDowned: false,
          reviveProgress: 0,
          kills: 0,
          score: 0,
          angle: idx * (Math.PI / 2), // face different directions initially
          active: true,
          weapon: 'pistol',
          weapons: createWeapons(),
          lastShotTime: 0,
          speedMultiplier: 1.0,
          damageMultiplier: 1.0,
          fireRateMultiplier: 1.0,
        });
      }
    });
    
    playersRef.current = result;
    setHudPlayers([...result]);
  };

  // Triggered when an upgrade is selected in parent component
  useEffect(() => {
    if (upgradeIdApplied) {
      const preset = ALL_UPGRADE_PRESETS.find(u => u.id === upgradeIdApplied);
      if (preset) {
        preset.effect(playersRef.current);
        // Display floating text for confirmation
        playersRef.current.forEach(p => {
          spawnFloatingText(`TEAM UPGRADE: ${preset.title}!`, p.x, p.y - 30, '#fbbf24');
        });
        sound.playPlayerRevived();
      }
      clearUpgradeTrigger();
      
      // Resume spawn of next wave after upgrade
      waveTimer.current = 150; // brief delay before next wave spawns
      waveProgress.current = 'waiting';
      setWaveStatusText(`${waveNumber.current}-TO'LQIN YAQINLASHMOQDA!`);
    }
  }, [upgradeIdApplied]);

  // Handle keys
  useEffect(() => {
    const preventDefaultKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', '/', 'Enter'];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysPressed.current[e.key] = true;
      keysPressed.current[k] = true;
      keysPressed.current[e.code] = true;

      // Prevent scrolling
      if (preventDefaultKeys.includes(e.key) || preventDefaultKeys.includes(e.code)) {
        e.preventDefault();
      }

      // Allow quick joining from keyboard by pressing shoot keys on start screens if we want,
      // but here we just handle gameplay
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysPressed.current[e.key] = false;
      keysPressed.current[k] = false;
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Initial load
    initPlayers();
    waveNumber.current = 1;
    waveTimer.current = 180;
    waveProgress.current = 'waiting';
    setWave(1);
    setWaveStatusText("1-TO'LQIN TAYYORLANMOQDA!");

    // Start animation loop
    isLoopRunning.current = true;
    requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      isLoopRunning.current = false;
    };
  }, [activePlayers]);

  // Spawners helper
  const spawnFloatingText = (text: string, x: number, y: number, color: string = '#ffffff') => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      alpha: 1,
      vy: -0.8
    });
  };

  const spawnParticles = (x: number, y: number, color: string, count: number = 8, speedScale: number = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 2.5) * speedScale;
      particlesRef.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 1.5 + Math.random() * 2.5,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  };

  const spawnBloodSplatter = (x: number, y: number) => {
    // limit max splatters on floor to preserve performance (e.g. max 80)
    if (splattersRef.current.length > 80) {
      splattersRef.current.shift();
    }
    splattersRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      size: 15 + Math.random() * 25,
      angle: Math.random() * Math.PI * 2,
      opacity: 0.35 + Math.random() * 0.3
    });
  };

  // Zombie spawner based on wave
  const spawnZombie = () => {
    const currentW = waveNumber.current;
    
    // Decide types based on wave number
    let type: ZombieType = 'normal';
    const rand = Math.random();
    
    if (currentW >= 3 && rand < 0.12) {
      type = 'tank';
    } else if (currentW >= 2 && rand < 0.35) {
      type = 'fast';
    }

    // Spawn around the edges of the map
    let x = 0;
    let y = 0;
    const side = Math.floor(Math.random() * 4);
    const offset = 40; // spawn slightly outside boundary

    switch (side) {
      case 0: // Top
        x = Math.random() * WIDTH;
        y = -offset;
        break;
      case 1: // Right
        x = WIDTH + offset;
        y = Math.random() * HEIGHT;
        break;
      case 2: // Bottom
        x = Math.random() * WIDTH;
        y = HEIGHT + offset;
        break;
      case 3: // Left
        x = -offset;
        y = Math.random() * HEIGHT;
        break;
    }

    // Stats configuration per type
    let hp = 28 + currentW * 6;
    let speed = 0.45 + Math.random() * 0.15 + (currentW * 0.02);
    let damage = 0.4 + (currentW * 0.05);
    let radius = 15;
    let color = '#4ade80'; // normal green
    let scoreValue = 10;

    if (type === 'fast') {
      hp = 14 + currentW * 3;
      speed = 0.8 + Math.random() * 0.2 + (currentW * 0.03);
      damage = 0.25 + (currentW * 0.03);
      radius = 12;
      color = '#f87171'; // light red
      scoreValue = 15;
    } else if (type === 'tank') {
      hp = 140 + currentW * 30;
      speed = 0.2 + Math.random() * 0.05 + (currentW * 0.01);
      damage = 1.2 + (currentW * 0.15);
      radius = 26;
      color = '#78716c'; // stone grey
      scoreValue = 40;
    }

    // Limit maximum speed to keep game playable
    speed = Math.min(speed, 1.8);

    zombiesRef.current.push({
      id: Math.random().toString(),
      type,
      x,
      y,
      radius,
      speed,
      hp,
      maxHp: hp,
      damage,
      color,
      scoreValue,
      angle: 0,
      colorFlashMs: 0,
    });

    zombiesSpawnedCount.current += 1;
    setZombiesLeft(totalZombiesToSpawn.current - zombiesSpawnedCount.current + zombiesRef.current.length);
  };

  // Helper: check circle - rectangle collision and return slide response
  const resolveCircleRectCollision = (circle: { x: number, y: number, radius: number }, rect: Obstacle) => {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));

    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

    if (distanceSquared < circle.radius * circle.radius) {
      const distance = Math.sqrt(distanceSquared);
      if (distance === 0) {
        // center inside block, push out
        return {
          collided: true,
          pushX: 0,
          pushY: -circle.radius,
        };
      }
      
      const overlap = circle.radius - distance;
      const nx = distanceX / distance;
      const ny = distanceY / distance;

      return {
        collided: true,
        pushX: nx * overlap,
        pushY: ny * overlap,
      };
    }
    return { collided: false, pushX: 0, pushY: 0 };
  };

  // Main Gameloop
  const gameLoop = (timestamp: number) => {
    if (!isLoopRunning.current) return;

    updatePhysics();
    renderCanvas();

    requestAnimationFrame(gameLoop);
  };

  const updatePhysics = () => {
    const players = playersRef.current;
    const zombies = zombiesRef.current;
    const bullets = bulletsRef.current;
    const loots = lootsRef.current;
    const particles = particlesRef.current;
    const floatingTexts = floatingTextsRef.current;

    // 1. Screenshake decay
    if (screenShake.current > 0) {
      screenShake.current *= 0.9;
      if (screenShake.current < 0.1) screenShake.current = 0;
    }

    // 2. Wave Management Spawner Logic
    if (waveProgress.current === 'waiting') {
      waveTimer.current -= 1;
      if (waveTimer.current <= 0) {
        // Start Wave
        waveProgress.current = 'spawning';
        totalZombiesToSpawn.current = 8 + waveNumber.current * 4;
        zombiesSpawnedCount.current = 0;
        zombieSpawnTimer.current = 0;
        setIsWaveActive(true);
        setWaveStatusText(`${waveNumber.current}-TO'LQIN BOSHLANDI!`);
        sound.playZombieRoar();
      }
    } else if (waveProgress.current === 'spawning') {
      zombieSpawnTimer.current -= 1;
      if (zombieSpawnTimer.current <= 0 && zombiesSpawnedCount.current < totalZombiesToSpawn.current) {
        spawnZombie();
        // Spawning gets faster in later waves
        zombieSpawnTimer.current = Math.max(30, 110 - waveNumber.current * 8);
      }

      if (zombiesSpawnedCount.current >= totalZombiesToSpawn.current && zombies.length === 0) {
        // Wave cleared!
        waveProgress.current = 'cleared';
        sound.playWaveComplete();
        
        // Show scoreboard
        setWaveStatusText(`${waveNumber.current}-TO'LQIN CLEAR!`);
        
        // Check if next wave is upgrade wave
        // Every 3 waves (3, 6, 9...), trigger Upgrade Screen
        const currentWaveCopy = waveNumber.current;
        setTimeout(() => {
          if (currentWaveCopy % 3 === 0) {
            onUpgradeTriggered(currentWaveCopy);
          } else {
            // Setup next wave immediately with standard timer
            waveTimer.current = 200;
            waveProgress.current = 'waiting';
            setWaveStatusText(`${waveNumber.current}-TO'LQIN YAQINLASHMOQDA!`);
          }
        }, 3000);

        waveNumber.current += 1;
        setWave(waveNumber.current);
      }
    }

    setZombiesLeft(totalZombiesToSpawn.current - zombiesSpawnedCount.current + zombies.length);

    // 3. Update Players
    let alivePlayersCount = 0;

    players.forEach((p, pIdx) => {
      // Setup controls per player index
      let dx = 0;
      let dy = 0;
      let shootPressed = false;

      const keys = keysPressed.current;

      if (p.id === 1) {
        // WASD, shoot: E, Space or F
        if (keys['w'] || keys['W'] || keys['KeyW']) dy -= 1;
        if (keys['s'] || keys['S'] || keys['KeyS']) dy += 1;
        if (keys['a'] || keys['A'] || keys['KeyA']) dx -= 1;
        if (keys['d'] || keys['D'] || keys['KeyD']) dx += 1;
        
        // Shoot keys
        if (keys['e'] || keys['E'] || keys['KeyE'] || keys[' '] || keys['Space']) {
          shootPressed = true;
        } else if (!activePlayers[3] && (keys['f'] || keys['F'] || keys['KeyF'])) {
          // Allow P1 to shoot with F only if P4 is not using F to move left
          shootPressed = true;
        }
      } else if (p.id === 2) {
        // Arrows, shoot: Enter or /
        if (keys['ArrowUp']) dy -= 1;
        if (keys['ArrowDown']) dy += 1;
        if (keys['ArrowLeft']) dx -= 1;
        if (keys['ArrowRight']) dx += 1;
        if (keys['Enter'] || keys['/'] || keys['Slash']) shootPressed = true;
      } else if (p.id === 3) {
        // IJKL, shoot: U
        if (keys['i'] || keys['I'] || keys['KeyI']) dy -= 1;
        if (keys['k'] || keys['K'] || keys['KeyK']) dy += 1;
        if (keys['j'] || keys['J'] || keys['KeyJ']) dx -= 1;
        if (keys['l'] || keys['L'] || keys['KeyL']) dx += 1;
        if (keys['u'] || keys['U'] || keys['KeyU']) shootPressed = true;
      } else if (p.id === 4) {
        // TFGH, shoot: R
        if (keys['t'] || keys['T'] || keys['KeyT']) dy -= 1;
        if (keys['g'] || keys['G'] || keys['KeyG']) dy += 1;
        if (keys['f'] || keys['F'] || keys['KeyF']) dx -= 1;
        if (keys['h'] || keys['H'] || keys['KeyH']) dx += 1;
        if (keys['r'] || keys['R'] || keys['KeyR']) shootPressed = true;
      }

      if (!p.isDowned) {
        alivePlayersCount += 1;

        // Apply movement
        const currentSpeed = p.speed * p.speedMultiplier;
        if (dx !== 0 && dy !== 0) {
          // Normalize diagonal
          const length = Math.sqrt(dx * dx + dy * dy);
          p.x += (dx / length) * currentSpeed;
          p.y += (dy / length) * currentSpeed;
        } else {
          p.x += dx * currentSpeed;
          p.y += dy * currentSpeed;
        }

        // Update angle (Auto-aim at the nearest zombie)
        let closestZombie: any = null;
        let minDistance = Infinity;
        zombies.forEach(z => {
          const dist = Math.hypot(z.x - p.x, z.y - p.y);
          if (dist < minDistance) {
            minDistance = dist;
            closestZombie = z;
          }
        });

        if (closestZombie) {
          p.angle = Math.atan2(closestZombie.y - p.y, closestZombie.x - p.x);
        } else if (dx !== 0 || dy !== 0) {
          p.angle = Math.atan2(dy, dx);
        }

        // Keep inside boundary
        p.x = Math.max(p.radius, Math.min(WIDTH - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(HEIGHT - p.radius, p.y));

        // Slide against obstacles
        OBSTACLES.forEach(obs => {
          const res = resolveCircleRectCollision(p, obs);
          if (res.collided) {
            p.x += res.pushX;
            p.y += res.pushY;
          }
        });

        // Force shooting to be fully automatic
        shootPressed = true;

        // Shooting logic
        if (shootPressed) {
          const now = Date.now();
          const activeWeapon = p.weapons[p.weapon];
          const fireRate = activeWeapon.fireRate / p.fireRateMultiplier;
          
          if (now - p.lastShotTime >= fireRate) {
            // Check ammo
            if (activeWeapon.ammo !== -1 && activeWeapon.ammo <= 0) {
              // Out of ammo, switch back to pistol automatically!
              p.weapon = 'pistol';
              spawnFloatingText("O'Q TUGADI!", p.x, p.y - 25, '#ef4444');
              sound.playHit();
            } else {
              if (activeWeapon.ammo > 0) {
                activeWeapon.ammo -= 1;
              }
              p.lastShotTime = now;
              
              // Shoot weapon
              sound.playShoot(p.weapon);
              const bSpeed = activeWeapon.bulletSpeed;
              const bulletDmg = activeWeapon.damage * p.damageMultiplier;

              if (p.weapon === 'shotgun') {
                // Shoot 5 pellets in a spread
                const spreads = [-0.2, -0.1, 0, 0.1, 0.2];
                spreads.forEach(spreadAngle => {
                  const angle = p.angle + spreadAngle;
                  bullets.push({
                    id: Math.random().toString(),
                    playerId: p.id,
                    x: p.x + Math.cos(p.angle) * p.radius,
                    y: p.y + Math.sin(p.angle) * p.radius,
                    vx: Math.cos(angle) * bSpeed,
                    vy: Math.sin(angle) * bSpeed,
                    radius: 3.5,
                    damage: bulletDmg,
                    color: activeWeapon.color,
                    range: 280, // shotgun has limited range
                    distanceTraveled: 0,
                  });
                });
                screenShake.current = Math.max(screenShake.current, 4);
              } else if (p.weapon === 'sniper') {
                // Single powerful fast bullet
                bullets.push({
                  id: Math.random().toString(),
                  playerId: p.id,
                  x: p.x + Math.cos(p.angle) * p.radius,
                  y: p.y + Math.sin(p.angle) * p.radius,
                  vx: Math.cos(p.angle) * bSpeed,
                  vy: Math.sin(p.angle) * bSpeed,
                  radius: 5,
                  damage: bulletDmg,
                  color: activeWeapon.color,
                  range: 950,
                  distanceTraveled: 0,
                });
                screenShake.current = Math.max(screenShake.current, 8);
              } else {
                // Pistol or Machinegun
                bullets.push({
                  id: Math.random().toString(),
                  playerId: p.id,
                  x: p.x + Math.cos(p.angle) * p.radius,
                  y: p.y + Math.sin(p.angle) * p.radius,
                  vx: Math.cos(p.angle) * bSpeed,
                  vy: Math.sin(p.angle) * bSpeed,
                  radius: 4,
                  damage: bulletDmg,
                  color: activeWeapon.color,
                  range: p.weapon === 'machinegun' ? 500 : 450,
                  distanceTraveled: 0,
                });
                screenShake.current = Math.max(screenShake.current, p.weapon === 'machinegun' ? 2 : 1.5);
              }
            }
          }
        }
      } else {
        // Downed player - handle revival circle check
        // If other alive players stand close to downed player, increase revive progress
        let beingRevived = false;
        players.forEach(other => {
          if (other.id !== p.id && !other.isDowned) {
            const dist = Math.hypot(p.x - other.x, p.y - other.y);
            if (dist < 45) {
              beingRevived = true;
            }
          }
        });

        if (beingRevived) {
          p.reviveProgress += 0.6; // ~3 seconds to revive at 60fps (180 frames)
          // Spawn golden revive sparkles
          if (Math.random() < 0.2) {
            spawnParticles(p.x, p.y, '#fbbf24', 2, 0.4);
          }
          if (p.reviveProgress >= 100) {
            p.isDowned = false;
            p.hp = Math.round(p.maxHp * 0.35); // revive with 35% HP
            p.reviveProgress = 0;
            sound.playPlayerRevived();
            spawnFloatingText("TURDI!", p.x, p.y - 30, '#10b981');
          }
        } else {
          // slowly decay revive progress if left alone
          p.reviveProgress = Math.max(0, p.reviveProgress - 0.2);
        }
      }
    });

    // Check Game Over: if ALL active players are downed
    if (players.length > 0 && alivePlayersCount === 0) {
      // Trigger GameOver
      isLoopRunning.current = false;
      
      // Calculate MVP
      let mvpName = "Hech kim";
      let mvpKills = -1;
      players.forEach(p => {
        if (p.kills > mvpKills) {
          mvpKills = p.kills;
          mvpName = p.name;
        }
      });

      onGameOver({
        wave: waveNumber.current,
        score: teamScore.current,
        playerKills: players.map(p => p.kills),
        mvpName,
        mvpKills
      });
      return;
    }

    // 4. Update Zombies
    zombies.forEach((z, zIdx) => {
      // Find closest alive player
      let targetPlayer: Player | null = null;
      let minDist = 999999;

      players.forEach(p => {
        if (!p.isDowned) {
          const dist = Math.hypot(p.x - z.x, p.y - z.y);
          if (dist < minDist) {
            minDist = dist;
            targetPlayer = p;
          }
        }
      });

      if (z.colorFlashMs > 0) {
        z.colorFlashMs -= 16.6; // approx ms per frame
      }

      if (targetPlayer) {
        // Move towards target
        const p: Player = targetPlayer;
        const angle = Math.atan2(p.y - z.y, p.x - z.x);
        z.angle = angle;
        
        z.x += Math.cos(angle) * z.speed;
        z.y += Math.sin(angle) * z.speed;

        // Slide against obstacles
        OBSTACLES.forEach(obs => {
          const res = resolveCircleRectCollision(z, obs);
          if (res.collided) {
            z.x += res.pushX;
            z.y += res.pushY;
          }
        });

        // Simple flocking: make zombies repel each other slightly so they don't overlap completely
        zombies.forEach((other, otherIdx) => {
          if (zIdx !== otherIdx) {
            const dist = Math.hypot(z.x - other.x, z.y - other.y);
            const minDistApart = z.radius + other.radius - 2;
            if (dist < minDistApart) {
              const pushAngle = Math.atan2(z.y - other.y, z.x - other.x);
              const pushForce = 0.5; // subtle push
              z.x += Math.cos(pushAngle) * pushForce;
              z.y += Math.sin(pushAngle) * pushForce;
            }
          }
        });

        // Check damage to players
        const playerDist = Math.hypot(z.x - p.x, z.y - p.y);
        if (playerDist < z.radius + p.radius) {
          // Damage player
          p.hp -= z.damage;
          // Spawn blood particle splash
          if (Math.random() < 0.15) {
            spawnParticles(p.x, p.y, '#ef4444', 3, 0.8);
            sound.playHit();
          }

          if (p.hp <= 0) {
            p.hp = 0;
            p.isDowned = true;
            p.reviveProgress = 0;
            sound.playPlayerDowned();
            spawnFloatingText("YIQILDI!", p.x, p.y - 30, '#ef4444');
          }
        }
      }
    });

    // 5. Update Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.distanceTraveled += Math.hypot(b.vx, b.vy);

      let deleteBullet = false;

      // Map boundary check
      if (b.x < 0 || b.x > WIDTH || b.y < 0 || b.y > HEIGHT || b.distanceTraveled >= b.range) {
        deleteBullet = true;
      }

      // Obstacle collision check
      OBSTACLES.forEach(obs => {
        const closestX = Math.max(obs.x, Math.min(b.x, obs.x + obs.w));
        const closestY = Math.max(obs.y, Math.min(b.y, obs.y + obs.h));
        const dist = Math.hypot(b.x - closestX, b.y - closestY);
        if (dist < b.radius) {
          deleteBullet = true;
          // spawn spark particles
          spawnParticles(b.x, b.y, '#e2e8f0', 5, 0.6);
        }
      });

      // Zombie collision check
      for (let j = zombies.length - 1; j >= 0; j--) {
        const z = zombies[j];
        const dist = Math.hypot(b.x - z.x, b.y - z.y);
        if (dist < b.radius + z.radius) {
          // Hit!
          z.hp -= b.damage;
          z.colorFlashMs = 120; // flash white
          
          // Spawn blood splatters and flesh sparks
          spawnParticles(z.x, z.y, '#b91c1c', 6, 1.2); // red blood particles
          if (Math.random() < 0.3) {
            spawnBloodSplatter(z.x, z.y);
          }

          // Damage indicator text (only for sniper or critical hits)
          if (b.damage > 20) {
            spawnFloatingText(`-${Math.round(b.damage)}`, z.x, z.y - 15, '#f97316');
          }

          // Bullet deleted, unless sniper rifle which pierces
          if (players.find(p => p.id === b.playerId)?.weapon !== 'sniper') {
            deleteBullet = true;
          }

          // Check Zombie death
          if (z.hp <= 0) {
            sound.playHit();
            // find killer
            const killer = players.find(p => p.id === b.playerId);
            if (killer) {
              killer.kills += 1;
              killer.score += z.scoreValue;
              teamScore.current += z.scoreValue;
              setGlobalScore(teamScore.current);
            }

            // Spawn giant blood explosion
            spawnBloodSplatter(z.x, z.y);
            spawnParticles(z.x, z.y, '#7f1d1d', 15, 1.5);
            spawnParticles(z.x, z.y, '#22c55e', 4, 0.7); // rot flesh

            // Drop Loot?
            const lootChance = 0.16;
            if (Math.random() < lootChance) {
              const types: LootType[] = ['medkit', 'ammo_shotgun', 'ammo_machinegun', 'ammo_sniper', 'speed_boost'];
              // balance shotgun, machinegun, sniper loot spawning
              const randTypeIdx = Math.floor(Math.random() * types.length);
              loots.push({
                id: Math.random().toString(),
                type: types[randTypeIdx],
                x: z.x,
                y: z.y,
                radius: 14,
                createdAt: Date.now()
              });
            }

            // Remove zombie
            zombies.splice(j, 1);
          }
          break; // break zombie iteration for this bullet if it dies
        }
      }

      if (deleteBullet) {
        bullets.splice(i, 1);
      }
    }

    // 6. Update Loots (Loot collections)
    for (let i = loots.length - 1; i >= 0; i--) {
      const l = loots[i];
      
      // Decay after 12 seconds to prevent map clutter
      if (Date.now() - l.createdAt > 12000) {
        loots.splice(i, 1);
        continue;
      }

      // Check collision with any active player
      for (let j = 0; j < players.length; j++) {
        const p = players[j];
        if (!p.isDowned) {
          const dist = Math.hypot(p.x - l.x, p.y - l.y);
          if (dist < p.radius + l.radius) {
            // Collected!
            sound.playPickup();
            applyLoot(p, l.type);
            loots.splice(i, 1);
            break;
          }
        }
      }
    }

    // 7. Particles animation decay
    for (let i = particles.length - 1; i >= 0; i--) {
      const part = particles[i];
      part.x += part.vx;
      part.y += part.vy;
      part.alpha -= part.decay;
      if (part.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    // 8. Floating text decay
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.015;
      if (ft.alpha <= 0) {
        floatingTexts.splice(i, 1);
      }
    }

    // sync HUD
    setHudPlayers([...players]);
  };

  const applyLoot = (player: Player, type: LootType) => {
    switch (type) {
      case 'medkit':
        player.hp = Math.min(player.maxHp, player.hp + 40);
        spawnFloatingText("+40 HP", player.x, player.y - 25, '#10b981');
        break;
      case 'ammo_shotgun':
        player.weapon = 'shotgun';
        player.weapons.shotgun.ammo = Math.min(player.weapons.shotgun.maxAmmo, player.weapons.shotgun.ammo + 12);
        spawnFloatingText("+12 SHOTGUN AMMO", player.x, player.y - 25, '#f97316');
        break;
      case 'ammo_machinegun':
        player.weapon = 'machinegun';
        player.weapons.machinegun.ammo = Math.min(player.weapons.machinegun.maxAmmo, player.weapons.machinegun.ammo + 50);
        spawnFloatingText("+50 PULEMYOT AMMO", player.x, player.y - 25, '#3b82f6');
        break;
      case 'ammo_sniper':
        player.weapon = 'sniper';
        player.weapons.sniper.ammo = Math.min(player.weapons.sniper.maxAmmo, player.weapons.sniper.ammo + 5);
        spawnFloatingText("+5 SNAYPER AMMO", player.x, player.y - 25, '#a855f7');
        break;
      case 'speed_boost':
        spawnFloatingText("TEZLIK OSHDI!", player.x, player.y - 25, '#22d3ee');
        // trigger speed boost particle aura
        spawnParticles(player.x, player.y, '#22d3ee', 15, 0.5);
        player.speedMultiplier = player.speedMultiplier * 1.3;
        // revert speed boost after 7 seconds
        setTimeout(() => {
          player.speedMultiplier = player.speedMultiplier / 1.3;
          spawnFloatingText("Tezlik pasaydi", player.x, player.y - 25, '#94a3b8');
        }, 7000);
        break;
    }
  };

  // Canvas drawing
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // Apply screenshake translation
    if (screenShake.current > 0) {
      const dx = (Math.random() - 0.5) * screenShake.current;
      const dy = (Math.random() - 0.5) * screenShake.current;
      ctx.translate(dx, dy);
    }

    // 1. Clear background
    ctx.fillStyle = '#0f172a'; // slate 900
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 2. Draw subtle grid
    ctx.strokeStyle = '#1e293b'; // slate 800
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    // 3. Draw blood splatters (permanent ground decals)
    splattersRef.current.forEach(s => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.fillStyle = `rgba(136, 19, 19, ${s.opacity})`; // deep dark red
      
      // Draw asymmetric spline splatter blob
      ctx.beginPath();
      ctx.arc(0, 0, s.size, 0, Math.PI * 2);
      ctx.fill();

      // little outer droplet dots
      ctx.fillStyle = `rgba(136, 19, 19, ${s.opacity - 0.15})`;
      for (let i = 0; i < 4; i++) {
        const dist = s.size * (0.8 + Math.random() * 0.7);
        const dotAngle = Math.random() * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(dotAngle) * dist, Math.sin(dotAngle) * dist, s.size * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });

    // 4. Draw Obstacles
    OBSTACLES.forEach(obs => {
      ctx.fillStyle = obs.color;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      
      // dark border shadow outline
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 4;
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

      // cracked inner detailing
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(obs.x + 5, obs.y + 10);
      ctx.lineTo(obs.x + 25, obs.y + 18);
      ctx.lineTo(obs.x + 35, obs.y + 5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(obs.x + obs.w - 15, obs.y + obs.h - 10);
      ctx.lineTo(obs.x + obs.w - 5, obs.y + obs.h - 25);
      ctx.stroke();
    });

    // 5. Draw Loot drops
    lootsRef.current.forEach(l => {
      ctx.save();
      // breathing scale pulse
      const pulseScale = 1 + 0.12 * Math.sin(Date.now() / 150);
      ctx.translate(l.x, l.y);
      ctx.scale(pulseScale, pulseScale);

      // Outer glow circle
      let glowCol = '#10b981';
      let sym = '+';
      switch (l.type) {
        case 'ammo_shotgun':
          glowCol = '#f97316';
          sym = 'SG';
          break;
        case 'ammo_machinegun':
          glowCol = '#3b82f6';
          sym = 'MG';
          break;
        case 'ammo_sniper':
          glowCol = '#a855f7';
          sym = 'SN';
          break;
        case 'speed_boost':
          glowCol = '#22d3ee';
          sym = '⚡';
          break;
      }

      ctx.shadowColor = glowCol;
      ctx.shadowBlur = 10;
      ctx.fillStyle = glowCol;
      ctx.beginPath();
      ctx.arc(0, 0, l.radius, 0, Math.PI * 2);
      ctx.fill();

      // inner block
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(0, 0, l.radius - 3, 0, Math.PI * 2);
      ctx.fill();

      // symbol text
      ctx.fillStyle = glowCol;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sym, 0, 0);

      ctx.restore();
    });

    // 6. Draw Zombies
    zombiesRef.current.forEach(z => {
      ctx.save();
      ctx.translate(z.x, z.y);
      ctx.rotate(z.angle);

      // Flash white if damaged
      if (z.colorFlashMs > 0) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = z.color;
      }

      // Draw Zombie circle
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
      ctx.fill();

      // Black outline
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Glowing zombie hands/eyes facing forward
      ctx.fillStyle = '#fef08a'; // yellow eyes
      if (z.type === 'fast') ctx.fillStyle = '#facc15';
      if (z.type === 'tank') ctx.fillStyle = '#ef4444'; // blood red eyes

      ctx.beginPath();
      ctx.arc(z.radius * 0.4, -z.radius * 0.3, 2.5, 0, Math.PI * 2);
      ctx.arc(z.radius * 0.4, z.radius * 0.3, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // small mouth or scar
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(z.radius * 0.5, -z.radius * 0.1);
      ctx.lineTo(z.radius * 0.5, z.radius * 0.1);
      ctx.stroke();

      ctx.restore();
    });

    // 7. Draw Bullets
    bulletsRef.current.forEach(b => {
      ctx.save();
      ctx.translate(b.x, b.y);
      
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = b.color;
      
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // 8. Draw Players
    playersRef.current.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Draw revival helper ring if player is downed
      if (p.isDowned) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // revive loading slice
        if (p.reviveProgress > 0) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, 42, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (p.reviveProgress / 100)));
          ctx.stroke();
        }
      }

      ctx.rotate(p.angle);

      // Draw weapon barrel
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      
      const activeW = p.weapons[p.weapon];
      let barrelW = 22;
      let barrelH = 5;
      if (p.weapon === 'shotgun') { barrelW = 18; barrelH = 8; }
      if (p.weapon === 'machinegun') { barrelW = 25; barrelH = 6; }
      if (p.weapon === 'sniper') { barrelW = 32; barrelH = 4; }

      ctx.beginPath();
      ctx.rect(0, -barrelH / 2, barrelW, barrelH);
      ctx.fill();
      ctx.stroke();

      // Muzzle flash particle trigger
      const now = Date.now();
      if (now - p.lastShotTime < 45) {
        // muzzle flash circle
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(barrelW + 4, 0, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Player circle
      if (p.isDowned) {
        ctx.fillStyle = '#334155'; // dead greyish
      } else {
        ctx.fillStyle = p.color;
      }

      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.isDowned ? 0 : 12;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Black circle border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Facing/eyes indicators
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.radius * 0.4, -p.radius * 0.3, 3, 0, Math.PI * 2);
      ctx.arc(p.radius * 0.4, p.radius * 0.3, 3, 0, Math.PI * 2);
      ctx.fill();

      // Pupil dots facing the front
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(p.radius * 0.45, -p.radius * 0.3, 1.2, 0, Math.PI * 2);
      ctx.arc(p.radius * 0.45, p.radius * 0.3, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Draw Name tag and Healthbar (not rotated)
      ctx.save();
      ctx.translate(p.x, p.y);

      // Name
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(p.name, 0, -p.radius - 12);

      // Health bar BG
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-22, -p.radius - 8, 44, 4);

      // Health bar progress
      const hpPct = p.hp / p.maxHp;
      let hpCol = '#10b981'; // green
      if (hpPct < 0.3) hpCol = '#ef4444'; // red
      else if (hpPct < 0.6) hpCol = '#f59e0b'; // amber

      ctx.fillStyle = p.isDowned ? '#3b82f6' : hpCol; // blue for downed revive bar
      const barW = p.isDowned ? Math.round(44 * (p.reviveProgress / 100)) : Math.round(44 * hpPct);
      ctx.fillRect(-22, -p.radius - 8, barW, 4);

      // Downed alert banner
      if (p.isDowned) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("YIQILDI! (QUTQARISH)", 0, -p.radius - 15);
      }

      ctx.restore();
    });

    // 9. Draw Particles
    particlesRef.current.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 10. Draw Floating text
    ctx.shadowBlur = 0;
    floatingTextsRef.current.forEach(ft => {
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.globalAlpha = ft.alpha;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // Restore shake translation
    ctx.restore();
  };

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    sound.toggle(newVal);
    if (newVal) {
      sound.playPickup();
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-950 p-4 rounded-2xl border-2 border-gray-900 shadow-2xl w-full max-w-6xl mx-auto">
      {/* Top HUD */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-900/60 border border-gray-800 p-4 rounded-xl mb-4 font-mono">
        
        {/* Left Side: Score & Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500 w-5 h-5 animate-pulse" />
            <div className="text-left leading-tight">
              <span className="text-xs text-gray-400 block uppercase font-bold">UMUMIY BALL:</span>
              <span className="text-xl font-black text-yellow-400">{globalScore}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-gray-800 pl-6">
            <Skull className="text-red-500 w-5 h-5" />
            <div className="text-left leading-tight">
              <span className="text-xs text-gray-400 block uppercase font-bold">QOLGAN ZOMBILAR:</span>
              <span className="text-xl font-black text-red-500">{zombiesLeft}</span>
            </div>
          </div>
        </div>

        {/* Center: Wave Indicator & Announcement Banner */}
        <div className="flex flex-col items-center max-w-sm px-4 text-center">
          <div className="px-4 py-1.5 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 font-extrabold text-sm mb-1 uppercase tracking-wider animate-pulse">
            {wave}-TO'LQIN
          </div>
          <div className="text-xs text-gray-400 font-semibold truncate uppercase">
            {waveStatusText}
          </div>
        </div>

        {/* Right Side: Sound Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            id="sound-hud-toggle"
            className="p-2 rounded bg-gray-950 border border-gray-800 hover:border-red-600 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Canvas Arena container with responsive layout */}
      <div className="relative overflow-hidden rounded-xl border-4 border-gray-900 bg-gray-900/40 shadow-inner flex justify-center items-center">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="bg-slate-900 max-w-full aspect-[1000/700] rounded"
        />

        {/* Intermittent Wave Notification overlay overlaying game */}
        {waveProgress.current === 'waiting' && waveTimer.current > 30 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-500 pointer-events-none">
            <div className="p-6 bg-gray-950/90 border border-red-500/40 rounded-xl max-w-md text-center shadow-2xl animate-pulse">
              <h2 className="text-4xl font-black text-red-600 font-mono tracking-widest uppercase">
                {wave}-TO'LQIN
              </h2>
              <p className="text-gray-300 text-sm mt-2 font-mono">
                {Math.ceil(waveTimer.current / 60)} soniyadan keyin boshlanadi...
              </p>
              <div className="text-[11px] text-gray-500 mt-2 font-sans italic">
                Zombilar har tomondan yopirilishi mumkin. Safda mahkam turing!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Team Players Healthbars Grid & Weapons HUD */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 font-mono">
        {hudPlayers.map((player) => {
          const w = player.weapons[player.weapon];
          const hasLimitedAmmo = w.maxAmmo > 0;
          return (
            <div
              key={player.id}
              className={`p-3 rounded-xl border bg-gray-900/40 flex flex-col justify-between ${
                player.isDowned 
                  ? 'border-red-600/50 bg-red-950/10' 
                  : 'border-gray-800'
              }`}
            >
              {/* Player identity info */}
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                    style={{ color: player.color, backgroundColor: player.color }}
                  ></div>
                  <span className="font-bold text-gray-200 text-sm">{player.name}</span>
                </div>
                <span className="text-[11px] text-gray-500 font-bold">KILLS: {player.kills}</span>
              </div>

              {/* Healthbar progress slider */}
              <div className="w-full bg-gray-950 h-3 rounded-full overflow-hidden mb-2 relative">
                <div
                  className="h-full transition-all duration-100"
                  style={{
                    backgroundColor: player.isDowned ? '#2563eb' : (player.hp < 30 ? '#ef4444' : (player.hp < 60 ? '#f59e0b' : '#10b981')),
                    width: player.isDowned ? `${player.reviveProgress}%` : `${(player.hp / player.maxHp) * 100}%`
                  }}
                ></div>
                {/* Floating health overlay ratio */}
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white mix-blend-difference">
                  {player.isDowned ? `REVIVING: ${Math.round(player.reviveProgress)}%` : `HP: ${Math.round(player.hp)}/${player.maxHp}`}
                </div>
              </div>

              {/* Weapon details */}
              <div className="flex justify-between items-center text-xs bg-gray-950/80 p-1.5 rounded border border-gray-900">
                <span className="text-gray-400 text-[11px]">{w.name}</span>
                <span className="font-extrabold text-gray-100">
                  {hasLimitedAmmo ? `${w.ammo} / ${w.maxAmmo}` : '∞ (Cheksiz)'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
