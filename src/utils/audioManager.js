let audioCtx = null;
let muted = false;

function getCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Called on the first user gesture (see main.jsx) so later programmatic
// alerts from the timer are allowed to play under browser autoplay policy.
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function setMuted(value) {
  muted = !!value;
}

export function isMuted() {
  return muted;
}

function playTone(frequency, duration, startTime, type = 'sine', gain = 0.3) {
  const ctx = getCtx();
  if (!ctx || muted) return;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

export function playBeep() {
  const ctx = getCtx();
  if (!ctx || muted) return;
  playTone(880, 0.15, ctx.currentTime);
}

export function playDoubleBeep() {
  const ctx = getCtx();
  if (!ctx || muted) return;
  const now = ctx.currentTime;
  playTone(880, 0.12, now);
  playTone(880, 0.12, now + 0.2);
}

export function playTripleBeep() {
  const ctx = getCtx();
  if (!ctx || muted) return;
  const now = ctx.currentTime;
  playTone(880, 0.1, now);
  playTone(880, 0.1, now + 0.18);
  playTone(880, 0.1, now + 0.36);
}

export function playLevelUpChime() {
  const ctx = getCtx();
  if (!ctx || muted) return;
  const now = ctx.currentTime;
  // Rising chord: C E G C
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    playTone(freq, 0.4, now + i * 0.15, 'sine', 0.25);
  });
}

export function playBreakChime() {
  const ctx = getCtx();
  if (!ctx || muted) return;
  const now = ctx.currentTime;
  // Relaxed descending: G E C
  const notes = [784, 659, 523];
  notes.forEach((freq, i) => {
    playTone(freq, 0.5, now + i * 0.2, 'sine', 0.2);
  });
}

// Alert thresholds (seconds remaining), most urgent last.
const ALERT_THRESHOLDS = [
  { at: 60, play: playBeep },
  { at: 30, play: playBeep },
  { at: 10, play: playDoubleBeep },
  { at: 5, play: playTripleBeep },
  { at: 4, play: playTripleBeep },
  { at: 3, play: playTripleBeep },
  { at: 2, play: playTripleBeep },
  { at: 1, play: playTripleBeep },
];

// Fires the alert for any threshold crossed between the previous and new
// time. Range-based (not exact-match) so a tab that was throttled in the
// background and skips a second still gets its warning when it catches up.
export function playAlertForTime(newSeconds, prevSeconds = newSeconds + 1) {
  if (muted) return;
  // Crossed threshold T when newSeconds <= T < prevSeconds. Pick the most
  // urgent (lowest) crossed threshold so we play a single, appropriate cue.
  let chosen = null;
  for (const t of ALERT_THRESHOLDS) {
    if (newSeconds <= t.at && t.at < prevSeconds) chosen = t;
  }
  if (chosen) chosen.play();
}
