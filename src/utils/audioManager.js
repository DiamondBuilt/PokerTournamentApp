let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency, duration, startTime, type = 'sine', gain = 0.3) {
  const ctx = getCtx();
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
  const now = ctx.currentTime;
  playTone(880, 0.15, now);
}

export function playDoubleBeep() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  playTone(880, 0.12, now);
  playTone(880, 0.12, now + 0.2);
}

export function playTripleBeep() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  playTone(880, 0.1, now);
  playTone(880, 0.1, now + 0.18);
  playTone(880, 0.1, now + 0.36);
}

export function playLevelUpChime() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Rising chord: C E G C
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    playTone(freq, 0.4, now + i * 0.15, 'sine', 0.25);
  });
}

export function playBreakChime() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Relaxed descending: G E C
  const notes = [784, 659, 523];
  notes.forEach((freq, i) => {
    playTone(freq, 0.5, now + i * 0.2, 'sine', 0.2);
  });
}

export function playAlertForTime(secondsRemaining) {
  switch (secondsRemaining) {
    case 60:
    case 30:
      playBeep();
      break;
    case 10:
      playDoubleBeep();
      break;
    case 5:
    case 4:
    case 3:
    case 2:
    case 1:
      playTripleBeep();
      break;
    default:
      break;
  }
}
