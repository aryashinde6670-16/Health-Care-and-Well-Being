// Procedural Web Audio API sound generator for Mindfulness Hub & Chimes

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a peaceful crystal singing bowl chime for breathwork transitions
 */
export function playChime(freq = 432) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // Fundamental oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Harmonic overtone
    const oscHarmonic = ctx.createOscillator();
    const gainHarmonic = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(freq * 2.01, now);

    // Soft attack, long serene decay
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

    gainHarmonic.gain.setValueAtTime(0.0001, now);
    gainHarmonic.gain.linearRampToValueAtTime(0.06, now + 0.05);
    gainHarmonic.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    oscHarmonic.connect(gainHarmonic);
    gain.connect(ctx.destination);
    gainHarmonic.connect(ctx.destination);

    osc.start(now);
    oscHarmonic.start(now);
    osc.stop(now + 3.0);
    oscHarmonic.stop(now + 2.0);
  } catch (err) {
    console.warn('Audio chime error:', err);
  }
}

// Procedural Ambient Sound Generator
export type SoundscapeType = 'rain' | 'ocean' | 'binaural' | 'forest';

class ProceduralSoundscapeEngine {
  private active = false;
  private currentType: SoundscapeType | null = null;
  private nodes: { stop?: () => void; disconnect?: () => void }[] = [];
  private masterGain: GainNode | null = null;

  start(type: SoundscapeType, volume = 0.5) {
    this.stop();
    const ctx = getAudioContext();
    if (!ctx) return;

    this.active = true;
    this.currentType = type;

    const master = ctx.createGain();
    master.gain.setValueAtTime(volume * 0.35, ctx.currentTime);
    master.connect(ctx.destination);
    this.masterGain = master;

    if (type === 'rain') {
      this.startRain(ctx, master);
    } else if (type === 'ocean') {
      this.startOcean(ctx, master);
    } else if (type === 'binaural') {
      this.startBinaural(ctx, master);
    } else if (type === 'forest') {
      this.startForest(ctx, master);
    }
  }

  setVolume(volume: number) {
    if (this.masterGain && audioCtx) {
      this.masterGain.gain.setValueAtTime(volume * 0.35, audioCtx.currentTime);
    }
  }

  stop() {
    this.active = false;
    this.currentType = null;
    for (const node of this.nodes) {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // ignore cleanup errors
      }
    }
    this.nodes = [];
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {}
      this.masterGain = null;
    }
  }

  isPlaying(type?: SoundscapeType): boolean {
    if (!this.active) return false;
    if (!type) return this.active;
    return this.currentType === type;
  }

  // Generate pink/white noise buffer
  private createNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private startRain(ctx: AudioContext, destination: GainNode) {
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx, 5);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);

    noise.connect(filter);
    filter.connect(destination);
    noise.start();
    this.nodes.push(noise, filter);
  }

  private startOcean(ctx: AudioContext, destination: GainNode) {
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx, 6);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    const waveGain = ctx.createGain();
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 8-second wave cycle

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.4, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    noise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(destination);

    noise.start();
    lfo.start();
    this.nodes.push(noise, filter, waveGain, lfo, lfoGain);
  }

  private startBinaural(ctx: AudioContext, destination: GainNode) {
    // 10Hz Alpha differential: 200Hz left ear, 210Hz right ear
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    oscL.type = 'sine';
    oscR.type = 'sine';
    oscL.frequency.setValueAtTime(200, ctx.currentTime);
    oscR.frequency.setValueAtTime(210, ctx.currentTime);

    const panL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const panR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panL && panR) {
      panL.pan.setValueAtTime(-0.85, ctx.currentTime);
      panR.pan.setValueAtTime(0.85, ctx.currentTime);
      oscL.connect(panL);
      oscR.connect(panR);
      panL.connect(destination);
      panR.connect(destination);
      this.nodes.push(panL, panR);
    } else {
      oscL.connect(destination);
      oscR.connect(destination);
    }

    oscL.start();
    oscR.start();
    this.nodes.push(oscL, oscR);
  }

  private startForest(ctx: AudioContext, destination: GainNode) {
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx, 5);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(200, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(destination);

    noise.start();
    lfo.start();
    this.nodes.push(noise, filter, lfo, lfoGain);
  }
}

export const soundscapeEngine = new ProceduralSoundscapeEngine();
