// Context-aware UI sounds, synthesized with WebAudio so no audio assets are
// required. Variant matching follows the item name / weight, mirroring the
// pickup/drop/hover behaviour of the reference inventory.
import { getSettings } from '../store/settings';

type SoundEvent = 'hover' | 'pickup' | 'drop';

let ctx: AudioContext | null = null;

const getCtx = () => {
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

interface Voice {
  freq: number;
  type: OscillatorType;
  duration: number;
  gain: number;
  noise?: boolean;
  sweep?: number; // multiply freq towards this over the duration
}

const play = (voices: Voice[]) => {
  const volume = getSettings().volume / 100;
  if (volume <= 0) return;
  const audio = getCtx();
  if (!audio) return;

  const now = audio.currentTime;

  for (const voice of voices) {
    const gainNode = audio.createGain();
    gainNode.gain.setValueAtTime(voice.gain * volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + voice.duration);
    gainNode.connect(audio.destination);

    if (voice.noise) {
      const length = Math.ceil(audio.sampleRate * voice.duration);
      const buffer = audio.createBuffer(1, length, audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = audio.createBufferSource();
      source.buffer = buffer;
      const filter = audio.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = voice.freq;
      source.connect(filter);
      filter.connect(gainNode);
      source.start(now);
      source.stop(now + voice.duration);
    } else {
      const osc = audio.createOscillator();
      osc.type = voice.type;
      osc.frequency.setValueAtTime(voice.freq, now);
      if (voice.sweep) osc.frequency.exponentialRampToValueAtTime(voice.freq * voice.sweep, now + voice.duration);
      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + voice.duration);
    }
  }
};

type ItemLike = { name?: string; weight?: number };

const isWeapon = (item: ItemLike) => !!item.name && /^weapon_/i.test(item.name);
const isAmmo = (item: ItemLike) => !!item.name && /^ammo|_clip|magazine/i.test(item.name);
const isElectronic = (item: ItemLike) => !!item.name && /phone|radio|tablet|laptop|gps|scanner/i.test(item.name);
const isHeavy = (item: ItemLike) => (item.weight || 0) >= 2000;

export const playInventorySound = (event: SoundEvent, item: ItemLike = {}) => {
  switch (event) {
    case 'hover':
      if (isWeapon(item)) return play([{ freq: 320, type: 'triangle', duration: 0.05, gain: 0.05 }]);
      if (isElectronic(item)) return play([{ freq: 1800, type: 'square', duration: 0.025, gain: 0.025 }]);
      return play([{ freq: 950, type: 'triangle', duration: 0.03, gain: 0.03 }]);
    case 'pickup':
      if (isWeapon(item))
        return play([
          { freq: 140, type: 'sine', duration: 0.14, gain: 0.22, sweep: 0.6 },
          { freq: 1200, type: 'triangle', duration: 0.05, gain: 0.06 },
        ]);
      if (isAmmo(item))
        return play([
          { freq: 2400, noise: true, type: 'sine', duration: 0.07, gain: 0.1 },
          { freq: 1600, type: 'triangle', duration: 0.04, gain: 0.05 },
        ]);
      if (isHeavy(item)) return play([{ freq: 110, type: 'sine', duration: 0.16, gain: 0.2, sweep: 0.5 }]);
      return play([{ freq: 700, type: 'triangle', duration: 0.06, gain: 0.08, sweep: 1.3 }]);
    case 'drop':
      if (isWeapon(item) || isHeavy(item))
        return play([
          { freq: 95, type: 'sine', duration: 0.18, gain: 0.24, sweep: 0.45 },
          { freq: 900, noise: true, type: 'sine', duration: 0.06, gain: 0.05 },
        ]);
      if (isAmmo(item)) return play([{ freq: 2000, noise: true, type: 'sine', duration: 0.08, gain: 0.09 }]);
      return play([{ freq: 420, type: 'triangle', duration: 0.08, gain: 0.09, sweep: 0.6 }]);
  }
};
