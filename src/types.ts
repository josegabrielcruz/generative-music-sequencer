// ── Grid dimensions ──────────────────────────────────────────────────────────

export const COLS = 32   // time steps per loop
export const ROWS = 12   // pitches (one scale span)

// ── Sequencer config ─────────────────────────────────────────────────────────

export interface SequencerConfig {
  bpm:          number   // 40–200
  scaleName:    string   // see scales.ts
  rootNote:     string   // 'C' | 'C#' | 'D' | ...
  ruleId:       string   // 'conway' | 'highlife' | 'daynight' | 'seeds'
  mutationRate: number   // 0.0–0.2 probability per cell per generation
  synthType:    string   // 'sine' | 'sawtooth' | 'triangle' | 'square'
  loopsPerGen:  number   // CA evolves every N full playhead sweeps
  volume:       number   // dB, –24 to 0
}

export const DEFAULT_CONFIG: SequencerConfig = {
  bpm:          120,
  scaleName:    'Major',
  rootNote:     'C',
  ruleId:       'conway',
  mutationRate: 0.02,
  synthType:    'sine',
  loopsPerGen:  2,
  volume:       -8,
}

// ── Seed types ────────────────────────────────────────────────────────────────

export type SeedType = 'random' | 'glider' | 'rpentomino' | 'blinkers' | 'clear'

// ── CA rule display names ─────────────────────────────────────────────────────

export const RULE_LABELS: Record<string, string> = {
  conway:   'Conway (B3/S23)',
  highlife: 'HighLife (B36/S23)',
  daynight: 'Day & Night',
  seeds:    'Seeds (B2/S)',
}
