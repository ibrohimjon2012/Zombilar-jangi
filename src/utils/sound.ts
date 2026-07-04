// Web Audio API Sound Synthesizer for retro game sound effects
class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle(enabled: boolean) {
    this.enabled = enabled;
    if (enabled) {
      this.init();
    }
  }

  isEnabled() {
    return this.enabled;
  }

  // Play a simple retro synth shot sound
  playShoot(type: 'pistol' | 'shotgun' | 'machinegun' | 'sniper') {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    switch (type) {
      case 'pistol': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }
      case 'machinegun': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'shotgun': {
        // White noise-like gunshot
        const bufferSize = this.ctx.sampleRate * 0.25; // 0.25 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + 0.2);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
        break;
      }
      case 'sniper': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
        
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
    }
  }

  // Play hit / damage sound
  playHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(30, now + 0.1);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Play zombie sound
  playZombieRoar() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.4);
    
    // Add distortion / low pitch sweep
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Play item pickup sound
  playPickup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(450, now);
    osc2.frequency.exponentialRampToValueAtTime(900, now + 0.15);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.15);
    osc2.stop(now + 0.15);
  }

  // Play wave completed / round success sound
  playWaveComplete() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(330, now + 0.15);
    osc.frequency.setValueAtTime(440, now + 0.3);
    osc.frequency.setValueAtTime(660, now + 0.45);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Play player downed alert
  playPlayerDowned() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.4);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Play player revived sound
  playPlayerRevived() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const sound = new SoundManager();
