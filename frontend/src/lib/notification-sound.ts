/** Pleasant WhatsApp-style notification chime via Web Audio (no asset file). */

type AudioContextType = typeof AudioContext;

let sharedCtx: AudioContext | null = null;
let unlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioContextType })
      .webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx) sharedCtx = new AC();
  return sharedCtx;
}

/** Call once on a user gesture so browsers allow sound later. */
export function unlockNotificationAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  unlocked = true;
}

export function playNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      void ctx.resume().then(() => {
        unlocked = true;
        playChime(ctx);
      });
      return;
    }

    unlocked = true;
    playChime(ctx);
  } catch {
    // Ignore autoplay / unsupported audio failures
  }
}

function playChime(ctx: AudioContext): void {
  const now = ctx.currentTime;

  // Soft ascending two-tone (friendly, not harsh)
  const notes = [
    { freq: 880, start: 0, dur: 0.12 },
    { freq: 1174.66, start: 0.1, dur: 0.22 },
  ];

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.18, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + dur + 0.02);
  });

  // Quiet low “pop” under the chime
  const noiseGain = ctx.createGain();
  const bufferSize = Math.floor(ctx.sampleRate * 0.04);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noiseGain.gain.setValueAtTime(0.05, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
}

export function isNotificationAudioUnlocked(): boolean {
  return unlocked;
}
