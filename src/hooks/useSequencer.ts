import { useCallback, useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import { COLS, ROWS, DEFAULT_CONFIG, SequencerConfig, SeedType } from '../types'
import { stepCA, makeSeed, countLive, randomSeed } from '../utils/ca'
import { buildNotes } from '../utils/scales'

// ── Synth factory ─────────────────────────────────────────────────────────────

function createSynth(type: string, volume: number): Tone.PolySynth {
  const oscType = (['sine','sawtooth','triangle','square'].includes(type)
    ? type
    : 'sine') as Tone.ToneOscillatorType

  const limiter = new Tone.Limiter(-3).toDestination()

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: oscType },
    envelope:   { attack: 0.01, decay: 0.12, sustain: 0.25, release: 1.4 },
    volume,
  })

  synth.connect(limiter)
  return synth
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSequencer() {
  // ── Grid refs (mutated directly for performance — no React re-render per tick)
  const gridRef     = useRef<Uint8Array>(randomSeed(COLS, ROWS))
  const ghostRef    = useRef<Float32Array>(new Float32Array(COLS * ROWS))
  const playheadRef = useRef<number>(0)
  const loopCountRef = useRef<number>(0)

  // ── React state (drives re-renders for readouts/controls)
  const [config, setConfigState] = useState<SequencerConfig>(DEFAULT_CONFIG)
  const [isPlaying, setIsPlaying] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [liveCount,  setLiveCount]  = useState(() => countLive(gridRef.current))

  // ── Tone refs
  const synthRef    = useRef<Tone.PolySynth | null>(null)
  const seqRef      = useRef<Tone.Sequence<number> | null>(null)
  const analyserRef = useRef<Tone.Analyser | null>(null)

  // ── Derived refs (read by Tone callback without stale closure risk)
  const configRef = useRef(config)
  configRef.current = config

  const notesRef = useRef<string[]>(buildNotes(config.scaleName, config.rootNote, ROWS))
  useEffect(() => {
    notesRef.current = buildNotes(config.scaleName, config.rootNote, ROWS)
  }, [config.scaleName, config.rootNote])

  // Sync BPM immediately when changed
  useEffect(() => {
    if (isPlaying) Tone.Transport.bpm.value = config.bpm
  }, [config.bpm, isPlaying])

  // ── Sequence factory ───────────────────────────────────────────────────────
  const buildSequence = useCallback(() => {
    seqRef.current?.dispose()
    seqRef.current = new Tone.Sequence<number>(
      (time, col) => {
        playheadRef.current = col

        const synth = synthRef.current
        if (!synth) return

        const notes = notesRef.current
        const grid  = gridRef.current
        const ghost = ghostRef.current

        // Trigger all live cells in this column
        for (let row = 0; row < ROWS; row++) {
          if (grid[row * COLS + col]) {
            try { synth.triggerAttackRelease(notes[row], '16n', time) }
            catch { /* note out of synth range — ignore */ }
          }
        }

        // End of loop: maybe evolve the CA
        if (col === COLS - 1) {
          loopCountRef.current++
          const { ruleId, mutationRate, loopsPerGen } = configRef.current
          if (loopCountRef.current % loopsPerGen === 0) {
            const cur    = gridRef.current
            const next   = stepCA(cur, COLS, ROWS, ruleId, mutationRate)
            // Set ghost for newly dead cells
            for (let i = 0; i < COLS * ROWS; i++) {
              if (cur[i] === 1 && next[i] === 0) ghost[i] = 1.0
            }
            gridRef.current = next  // update immediately (next Tone tick reads this)
            // Defer React state update to avoid calling setState inside Tone callback
            requestAnimationFrame(() => {
              setGeneration(g => g + 1)
              setLiveCount(countLive(next))
            })
          }
        }
      },
      Array.from({ length: COLS }, (_, i) => i),
      '16n',
    )
  }, [])  // deps are all stable refs

  // ── Synth factory with analyser ────────────────────────────────────────────
  const buildSynth = useCallback((cfg: SequencerConfig) => {
    synthRef.current?.disconnect()
    synthRef.current?.dispose()
    analyserRef.current?.dispose()

    const analyser = new Tone.Analyser('waveform', 256)
    analyserRef.current = analyser

    const synth = createSynth(cfg.synthType, cfg.volume)
    synth.connect(analyser)
    synthRef.current = synth
  }, [])

  // ── Start ──────────────────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    await Tone.start()

    buildSynth(configRef.current)
    buildSequence()

    Tone.Transport.bpm.value = configRef.current.bpm
    seqRef.current!.start(0)
    Tone.Transport.start()
    setIsPlaying(true)
  }, [buildSynth, buildSequence])

  // ── Stop ───────────────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    seqRef.current?.stop()
    Tone.Transport.stop()
    Tone.Transport.position = 0
    playheadRef.current = -1   // -1 = hidden
    setIsPlaying(false)
  }, [])

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      seqRef.current?.dispose()
      synthRef.current?.dispose()
      analyserRef.current?.dispose()
      Tone.Transport.stop()
    }
  }, [])

  // ── Cell toggle ────────────────────────────────────────────────────────────
  const toggleCell = useCallback((row: number, col: number) => {
    const idx     = row * COLS + col
    const newGrid = new Uint8Array(gridRef.current)
    newGrid[idx]  = newGrid[idx] ? 0 : 1
    gridRef.current = newGrid
    setLiveCount(c => c + (newGrid[idx] ? 1 : -1))
  }, [])

  // ── Seeds ──────────────────────────────────────────────────────────────────
  const handleSeed = useCallback((type: SeedType) => {
    const newGrid         = makeSeed(type)
    gridRef.current       = newGrid
    ghostRef.current.fill(0)
    loopCountRef.current  = 0
    setGeneration(0)
    setLiveCount(countLive(newGrid))
  }, [])

  // ── Config update ──────────────────────────────────────────────────────────
  const setConfig = useCallback((update: Partial<SequencerConfig>) => {
    setConfigState(prev => {
      const next = { ...prev, ...update }

      // Rebuild synth when voice or volume changes (if playing)
      if (
        isPlaying &&
        (update.synthType !== undefined || update.volume !== undefined)
      ) {
        requestAnimationFrame(() => buildSynth(next))
      }

      return next
    })
  }, [isPlaying, buildSynth])

  return {
    // State
    config, setConfig,
    isPlaying,
    generation,
    liveCount,
    // Refs for Grid to read directly
    gridRef,
    ghostRef,
    playheadRef,
    analyserRef,
    // Actions
    handleStart,
    handleStop,
    handleSeed,
    toggleCell,
  }
}
