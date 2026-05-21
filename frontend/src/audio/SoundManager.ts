type SoundName = 'click' | 'reveal' | 'flag' | 'unflag' | 'explosion' | 'victory';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private muted = false;
  private volume = 0.5;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', gain = 0.3) {
    if (this.muted) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(gain * this.volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  private playNoise(duration: number, gain = 0.3) {
    if (this.muted) return;
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(gain * this.volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();
  }

  play(sound: SoundName): void {
    switch (sound) {
      case 'click':
        this.playTone(600, 0.08, 'square', 0.15);
        break;
      case 'reveal':
        this.playTone(800, 0.1, 'sine', 0.2);
        break;
      case 'flag':
        this.playTone(500, 0.15, 'triangle', 0.25);
        setTimeout(() => this.playTone(700, 0.1, 'triangle', 0.2), 80);
        break;
      case 'unflag':
        this.playTone(700, 0.1, 'triangle', 0.2);
        setTimeout(() => this.playTone(500, 0.15, 'triangle', 0.25), 80);
        break;
      case 'explosion':
        this.playNoise(0.5, 0.5);
        this.playTone(100, 0.4, 'sawtooth', 0.4);
        break;
      case 'victory':
        [0, 100, 200, 300, 400].forEach((delay, i) => {
          setTimeout(() => this.playTone(523 + i * 80, 0.3, 'sine', 0.3), delay);
        });
        break;
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
  }
}

export const soundManager = new SoundManager();
