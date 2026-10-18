// js/audio/sfx.js - Unified Web Audio Synthesizer & Procedural Sound Engine
// Generates authentic retro arcade tones, crisp noise bursts, and melodic chimes without external audio assets.

let audioCtx = null;
const lastPlayed = {};

export function getAudioContext() {
  if (!audioCtx) {
    const AudioCtx = (typeof window !== "undefined") ? (window.AudioContext || window.webkitAudioContext) : null;
    if (AudioCtx) audioCtx = new AudioCtx();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function attachUnlockListeners(targetWin = (typeof window !== "undefined" ? window : null)) {
  if (!targetWin || targetWin._totoroAudioUnlocked) return;
  targetWin._totoroAudioUnlocked = true;
  const unlock = () => { getAudioContext(); };
  ["pointerdown", "touchstart", "keydown", "click"].forEach(ev => {
    targetWin.addEventListener(ev, unlock, { passive: true, once: false });
  });
}

if (typeof window !== "undefined") {
  attachUnlockListeners(window);
}

export function canPlay(name, cooldownMs = 35) {
  const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  if (now - (lastPlayed[name] || 0) < cooldownMs) return false;
  lastPlayed[name] = now;
  return true;
}

export function playTone(freqStart, freqEnd, type, duration, volume = 0.11, delay = 0) {
  const c = getAudioContext();
  if (!c) return;
  const start = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, start);
  if (freqEnd && freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(12, freqEnd), start + duration);
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(start);
  osc.stop(start + duration + 0.01);
}

export function playNoise(duration, volume = 0.14, filterFreqStart = 900, filterFreqEnd = 110) {
  const c = getAudioContext();
  if (!c) return;
  const now = c.currentTime;
  const bufferSize = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

  const noise = c.createBufferSource();
  noise.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFreqStart, now);
  filter.frequency.linearRampToValueAtTime(filterFreqEnd, now + duration);

  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);

  noise.start(now);
}

export const sfx = {
  jump() {
    if (!canPlay("jump", 70)) return;
    playTone(190, 590, "square", 0.13, 0.09);
  },
  land() {
    if (!canPlay("land", 100)) return;
    playTone(120, 60, "triangle", 0.06, 0.07);
  },
  coin() {
    if (!canPlay("coin", 40)) return;
    playTone(987.77, 987.77, "square", 0.08, 0.07); // B5
    playTone(1318.51, 1318.51, "square", 0.22, 0.08, 0.06); // E6
  },
  hit() {
    if (!canPlay("hit", 150)) return;
    playNoise(0.25, 0.18, 550, 40);
    playTone(180, 50, "sawtooth", 0.18, 0.11);
  },
  win() {
    if (!canPlay("win", 300)) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      playTone(freq, freq, "triangle", 0.28, 0.12, idx * 0.11);
    });
  },
  munch() {
    if (!canPlay("munch", 40)) return;
    playTone(280 + Math.random() * 80, 440 + Math.random() * 80, "triangle", 0.06, 0.08);
    playNoise(0.04, 0.06, 1800, 400);
  },
  powerup() {
    if (!canPlay("powerup", 120)) return;
    const freqs = [330, 392, 494, 587, 659, 784];
    freqs.forEach((f, idx) => {
      playTone(f, f, "triangle", 0.18, 0.09, idx * 0.045);
    });
  },
  ghost() {
    if (!canPlay("ghost", 100)) return;
    playTone(480, 920, "sine", 0.22, 0.12);
    playTone(320, 640, "triangle", 0.18, 0.08, 0.05);
  },
  stomp() {
    if (!canPlay("stomp", 60)) return;
    playTone(320, 110, "square", 0.12, 0.1);
    playNoise(0.08, 0.12, 800, 150);
  },
  bump() {
    if (!canPlay("bump", 60)) return;
    playTone(180, 90, "triangle", 0.09, 0.12);
  },
  checkpoint() {
    if (!canPlay("checkpoint", 200)) return;
    playTone(440, 440, "sine", 0.14, 0.09); // A4
    playTone(554.37, 554.37, "sine", 0.14, 0.09, 0.08); // C#5
    playTone(659.25, 659.25, "sine", 0.28, 0.11, 0.16); // E5
  }
};

if (typeof window !== "undefined") {
  window.totoroSfx = sfx;
}
