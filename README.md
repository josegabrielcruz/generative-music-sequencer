# Cellular Sequencer

A generative music sequencer powered by Conway's Game of Life. Cells evolve according to cellular automaton rules — when the playhead passes a live cell, it plays a note. Watch the patterns grow, mutate, and die back as the music composes itself.

**[Live Demo](https://josegabrielcruz.github.io/generative-music-sequencer)**

---

## What It Does

A 32×12 grid of cells evolves in real time. Each row maps to a pitch in the active musical scale; each column is a time step. A playhead sweeps left to right at the chosen BPM — every live cell it touches triggers a note via the Web Audio API. After a configurable number of sweeps, the cellular automaton rules are applied and the grid evolves into the next generation.

The result is music that emerges from mathematics: stable oscillators produce repeating melodic motifs, glider patterns migrate across the grid shifting pitch and timing, and chaotic seeds generate dense evolving textures that gradually settle.

---

## Controls

| Control | Description |
|---|---|
| **▶ START** | Enable audio (required user gesture) and begin playback |
| **◼ STOP** | Pause playback and reset the playhead |
| **BPM** | Tempo — 40 to 200 beats per minute |
| **Volume** | Master output level in dB |
| **Scale** | Musical scale: Major, Minor, Pentatonic, Dorian, Whole Tone, Chromatic |
| **Root** | Root note of the scale (C through B) |
| **Synth** | Oscillator waveform: sine, triangle, sawtooth, square |
| **Rule** | Cellular automaton ruleset (see below) |
| **Evolve every** | How many playhead loops between CA generations (1 = very fast, 8 = slow) |
| **Mutation** | Probability of random cell flips per generation — prevents the grid from going silent |
| **Seed buttons** | Start with a preset pattern or clear/randomize the grid |

**Click any cell** to toggle it while the sequencer is running.

---

## CA Rules

| Rule | Description |
|---|---|
| **Conway (B3/S23)** | Classic Game of Life — sparse, tends toward silence without mutation |
| **HighLife (B36/S23)** | Denser and self-sustaining — more chaotic, complex rhythms |
| **Day & Night (B3678/S34678)** | Highly stable — creates long-running repeating patterns |
| **Seeds (B2/S)** | Every cell dies after one generation — rhythmic bursts, explosive growth |

---

## Seed Patterns

| Seed | Description |
|---|---|
| **Random** | Sparse random scatter (~25% density) |
| **Glider** | Classic 5-cell glider — migrates diagonally, producing a traveling melodic line |
| **R-Pento** | R-pentomino — chaotic growth that eventually settles into complex repeating forms |
| **Blinkers** | Multiple horizontal 3-cell oscillators — immediate stable rhythm |
| **Clear** | Empty grid — start from scratch |

---

## Tech Stack

- **Vite** + **React 19** + **TypeScript**
- **Tone.js 14** — Web Audio API scheduling, PolySynth, waveform analyser
- **Canvas API** — 60fps grid rendering with ghost-cell fade and waveform display
- No external animation libraries

### Architecture

```
src/
├── hooks/
│   └── useSequencer.ts     ← CA state + Tone.js Transport/Sequence/PolySynth
├── components/
│   ├── Grid/               ← Canvas: cells, playhead sweep, waveform strip
│   └── Controls/           ← Sliders, selects, seed buttons
└── utils/
    ├── ca.ts               ← stepCA(), seed patterns, countLive()
    └── scales.ts           ← Scale intervals, MIDI → note name conversion
```

The audio path is entirely ref-based — the Tone.js sequence callback reads `gridRef.current` directly on every 16th-note tick, bypassing React state entirely for zero-latency note triggering.

---

## Running Locally

```bash
npm install
npm run dev
```

Requires Node 18+. No API keys or server needed — all audio synthesis runs in the browser.

---

## License

MIT
