// Native Web Audio API Luxury Micro-Haptics
// Engineered for subtle, deep, tactile feedback (MacBook Trackpad / Leica dial feel)
// Completely zero external assets, silky smooth, whisper-quiet.

class HapticSoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastPlayTime = 0;
    try {
      const saved = localStorage.getItem('driverhub_sound_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch {}
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    try {
      localStorage.setItem('driverhub_sound_enabled', String(this.enabled));
    } catch {}
  }

  isEnabled() {
    return this.enabled;
  }

  toggle() {
    this.setEnabled(!this.enabled);
    if (this.enabled) {
      this.tick();
    }
    return this.enabled;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Ultra-subtle, deep mechanical impulse (110Hz -> 65Hz sine pulse)
  // Feels like a physical glass trackpad click, not a shrill electronic beep
  tick(freq = 120, duration = 0.012, volume = 0.016) {
    if (!this.enabled) return;
    const now = Date.now();
    if (now - this.lastPlayTime < 35) return; // Prevent harsh rapid rattling
    this.lastPlayTime = now;

    try {
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(45, freq * 0.55), t + duration);

      // Velvet smooth attack and exponential decay
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + duration);
    } catch {}
  }

  // Soft velvet pop for toggles and checkboxes
  pop(isCheck = true) {
    if (!this.enabled) return;
    const now = Date.now();
    if (now - this.lastPlayTime < 35) return;
    this.lastPlayTime = now;

    try {
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startFreq = isCheck ? 135 : 110;
      const endFreq = isCheck ? 80 : 65;
      const duration = 0.014;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.018, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + duration);
    } catch {}
  }

  // Whisper tab switch (smooth low tactile thump)
  tab() {
    this.tick(105, 0.010, 0.014);
  }

  // Velvet install success chime (warm acoustic triad, like Apple Pay / macOS subtle chime)
  success() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);

        gain.gain.setValueAtTime(0.0001, t + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.018, t + idx * 0.06 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.06 + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.16);
      });
    } catch {}
  }
}

export const haptic = new HapticSoundManager();
