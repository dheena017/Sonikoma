// Web Audio API Synthesizer Engine
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientOscillator: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;
let currentVolume = 1;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = currentVolume;
      masterGain.connect(audioCtx.destination);
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {
        // Ignore auto-play policy failures
      });
    }

    return audioCtx;
  } catch (err) {
    return null;
  }
}

export function setEngineVolume(volume: number, isMuted: boolean = false) {
  currentVolume = isMuted ? 0 : Math.min(Math.max(volume / 100, 0), 1);
  if (masterGain) {
    masterGain.gain.setTargetAtTime(
      currentVolume,
      getAudioContext()?.currentTime || 0,
      0.01
    );
  }
}

export function stopAmbientBackgroundMusic() {
  if (ambientOscillator) {
    ambientOscillator.stop();
    ambientOscillator.disconnect();
    ambientOscillator = null;
  }
  if (ambientGain) {
    ambientGain.disconnect();
    ambientGain = null;
  }
}

export function startAmbientBackgroundMusic(
  theme: string,
  volume: number,
  isMuted: boolean = false
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  stopAmbientBackgroundMusic();

  ambientGain = ctx.createGain();
  ambientGain.gain.value = isMuted ? 0 : (volume / 100) * 0.05;
  ambientGain.connect(masterGain || ctx.destination);

  ambientOscillator = ctx.createOscillator();
  ambientOscillator.type = "sine";
  ambientOscillator.frequency.value = theme.includes("Battle")
    ? 110
    : theme.includes("Synth")
    ? 220
    : theme.includes("Acoustic")
    ? 180
    : 130;
  ambientOscillator.connect(ambientGain);
  ambientOscillator.start();
}

function getSfxFrequency(sfxText: string) {
  const text = sfxText.toLowerCase();
  if (text.includes("drum") || text.includes("boom")) return 80;
  if (text.includes("surge") || text.includes("zap")) return 440;
  if (text.includes("whoosh") || text.includes("swoosh")) return 320;
  if (text.includes("spark") || text.includes("sparkle")) return 880;
  if (text.includes("impact") || text.includes("clash")) return 160;
  return 220;
}

export function playComicSoundEffect(sfxText: string, volume = 1) {
  const ctx = getAudioContext();
  if (!ctx || !sfxText || !sfxText.trim()) return;

  const frequency = getSfxFrequency(sfxText);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const duration = 0.18;
  const now = ctx.currentTime;

  osc.type = "triangle";
  osc.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(
    currentVolume * 0.18 * Math.min(Math.max(volume, 0), 1),
    now + 0.01
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(masterGain || ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}
