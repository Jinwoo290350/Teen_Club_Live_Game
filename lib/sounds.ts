'use client'

// ─── AudioContext singleton ─────────────────────────────────
let ctx: AudioContext | null = null
let masterGain: GainNode | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.5
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function getMaster(): GainNode {
  getCtx()
  return masterGain!
}

// ─── Low-level helpers ──────────────────────────────────────
function tone(
  freq: number,
  type: OscillatorType,
  startOffset: number,
  duration: number,
  volume = 0.4,
  freqEnd?: number,
) {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(getMaster())
  osc.type = type
  osc.frequency.value = freq
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, c.currentTime + startOffset + duration)
  }
  const t = c.currentTime + startOffset
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(volume, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.start(t)
  osc.stop(t + duration + 0.01)
}

// ─── Sound Effects ──────────────────────────────────────────
export function playClick() {
  tone(700, 'sine', 0, 0.07, 0.18)
}

export function playCorrect() {
  // C5 → E5 → G5 ascending ding
  ;[523, 659, 784].forEach((f, i) => tone(f, 'sine', i * 0.1, 0.22, 0.3))
}

export function playWrong() {
  // descending sawtooth buzz
  tone(280, 'sawtooth', 0, 0.35, 0.22, 90)
}

export function playCombo() {
  // quick ascending fanfare
  ;[523, 587, 659, 784, 1047].forEach((f, i) => tone(f, 'sine', i * 0.07, 0.18, 0.35))
}

export function playGameStart() {
  ;[392, 523, 659, 784].forEach((f, i) => tone(f, 'sine', i * 0.12, 0.28, 0.3))
}

export function playResultFanfare() {
  ;[523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
    tone(f, 'sine', i * 0.1, 0.3, 0.38),
  )
}

// ─── Background Music ───────────────────────────────────────
// Upbeat C-major pentatonic melody loop
const BGM_NOTES = [
  523, 659, 784, 659,   // C5 E5 G5 E5
  523, 440, 523, 659,   // C5 A4 C5 E5
  784, 880, 784, 659,   // G5 A5 G5 E5
  523, 659, 523, 392,   // C5 E5 C5 G4
]
const BGM_NOTE_DUR = 0.22   // seconds per note
const BGM_BEAT      = 0.28  // spacing

let bgmTimeout: ReturnType<typeof setTimeout> | null = null
let bgmPlaying = false
let bgmGain: GainNode | null = null

function scheduleBgmBar(startOffset: number) {
  if (!bgmPlaying) return
  const c = getCtx()

  if (!bgmGain) {
    bgmGain = c.createGain()
    bgmGain.gain.value = 0.12
    bgmGain.connect(getMaster())
  }

  BGM_NOTES.forEach((freq, i) => {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.connect(g)
    g.connect(bgmGain!)
    osc.type = 'triangle'
    osc.frequency.value = freq
    const t = c.currentTime + startOffset + i * BGM_BEAT
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(1, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, t + BGM_NOTE_DUR)
    osc.start(t)
    osc.stop(t + BGM_NOTE_DUR + 0.05)
  })

  const barDuration = BGM_NOTES.length * BGM_BEAT
  bgmTimeout = setTimeout(() => scheduleBgmBar(0), barDuration * 1000 - 100)
}

export function startBgm() {
  if (bgmPlaying) return
  bgmPlaying = true
  scheduleBgmBar(0.1)
}

export function stopBgm() {
  bgmPlaying = false
  if (bgmTimeout) {
    clearTimeout(bgmTimeout)
    bgmTimeout = null
  }
  if (bgmGain) {
    try {
      const c = getCtx()
      bgmGain.gain.setValueAtTime(bgmGain.gain.value, c.currentTime)
      bgmGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3)
    } catch {/* ignore */}
    bgmGain = null
  }
}

export function isBgmPlaying() {
  return bgmPlaying
}
