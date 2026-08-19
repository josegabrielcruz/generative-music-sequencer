// ── Scale intervals (semitone offsets from root) ──────────────────────────────

export const SCALE_INTERVALS: Record<string, number[]> = {
  'Major':      [0, 2, 4, 5, 7, 9, 11],
  'Minor':      [0, 2, 3, 5, 7, 8, 10],
  'Pentatonic': [0, 2, 4, 7, 9],
  'Dorian':     [0, 2, 3, 5, 7, 9, 10],
  'Whole Tone': [0, 2, 4, 6, 8, 10],
  'Chromatic':  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
}

export const SCALE_NAMES = Object.keys(SCALE_INTERVALS)

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const
export type NoteName = (typeof NOTE_NAMES)[number]
export const ROOT_NOTES = [...NOTE_NAMES]

// ── MIDI ↔ note name helpers ──────────────────────────────────────────────────

function noteNameToSemitone(note: string): number {
  return NOTE_NAMES.indexOf(note as NoteName)
}

function midiToToneName(midi: number): string {
  const oct  = Math.floor(midi / 12) - 1   // C4 = MIDI 60 → oct = 4
  const name = NOTE_NAMES[midi % 12]
  return `${name}${oct}`
}

// ── Note array builder ────────────────────────────────────────────────────────

/**
 * Build an ascending array of `rows` note names starting from rootNote
 * in the given scale, beginning at octave 3.
 *
 * e.g. buildNotes('Major', 'C', 12) →
 *   ['C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4']
 */
export function buildNotes(scaleName: string, rootNote: string, rows: number): string[] {
  const intervals = SCALE_INTERVALS[scaleName] ?? SCALE_INTERVALS['Major']
  // MIDI 48 = C3 (Tone.js convention: C4 = 60)
  const baseMidi  = 48 + noteNameToSemitone(rootNote)
  const notes: string[] = []
  let degree = 0

  while (notes.length < rows) {
    const oct  = Math.floor(degree / intervals.length)
    const semi = intervals[degree % intervals.length]
    notes.push(midiToToneName(baseMidi + oct * 12 + semi))
    degree++
  }

  return notes
}
