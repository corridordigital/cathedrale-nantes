/**
 * 100% Procedural Web Audio API Autumn Soundscape & Cathedral Bourdon Bell
 * Zero external audio file dependencies.
 */

class CathedralSoundscape {
  private ctx: AudioContext | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private isPlaying = false;
  private chimeInterval: number | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public startAmbient(windIntensity = 0.5): void {
    if (this.isPlaying) return;
    const ctx = this.ensureContext();

    // Create 4-second looping pink/brown noise buffer for autumn wind in trees
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = data[i];
      data[i] *= 1.8;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 320 + windIntensity * 280;
    filter.Q.value = 1.6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.04 + windIntensity * 0.05, ctx.currentTime + 1.2);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noiseSource.start();

    this.windFilter = filter;
    this.windGain = gain;
    this.isPlaying = true;

    // Trigger a soft welcoming cathedral bell strike
    this.ringBourdonBell(0.32);

    // Periodic distant bell chime every 22 seconds while ambient is active
    this.chimeInterval = window.setInterval(() => {
      if (this.isPlaying) {
        this.ringBourdonBell(0.24);
      }
    }, 22000);
  }

  public updateWindIntensity(windIntensity: number): void {
    if (!this.isPlaying || !this.ctx || !this.windFilter || !this.windGain) return;
    const now = this.ctx.currentTime;
    this.windFilter.frequency.setTargetAtTime(300 + windIntensity * 340, now, 0.3);
    this.windGain.gain.setTargetAtTime(0.03 + windIntensity * 0.06, now, 0.3);
  }

  public stopAmbient(): void {
    if (!this.isPlaying || !this.ctx) return;
    if (this.chimeInterval !== null) {
      clearInterval(this.chimeInterval);
      this.chimeInterval = null;
    }
    if (this.windGain) {
      const now = this.ctx.currentTime;
      this.windGain.gain.setTargetAtTime(0.0001, now, 0.25);
    }
    this.isPlaying = false;
  }

  /**
   * Synthesizes the deep resonant bronze Bourdon bell of Nantes Cathedral (G#2 / Ab2 ~ 103.8 Hz)
   * using minor-third / octave / fifth metallic bell partials.
   */
  public ringBourdonBell(volume = 0.4): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const baseFreq = 103.83; // G#2 Bourdon fundamental

    const partials = [
      { ratio: 0.5, amp: 0.35, decay: 6.5 }, // Hum note
      { ratio: 1.0, amp: 1.0, decay: 5.2 }, // Prime
      { ratio: 1.183, amp: 0.65, decay: 4.0 }, // Minor third tierce
      { ratio: 1.5, amp: 0.45, decay: 3.4 }, // Quint
      { ratio: 2.0, amp: 0.75, decay: 2.9 }, // Nominal
      { ratio: 2.51, amp: 0.28, decay: 1.8 }, // Upper tenth
      { ratio: 3.0, amp: 0.2, decay: 1.3 }, // Superquint
    ];

    for (const p of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * p.ratio, now);

      const peak = Math.max(0.001, volume * p.amp * 0.18);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + p.decay + 0.05);
    }
  }
}

export const cathedralSoundscape = new CathedralSoundscape();
