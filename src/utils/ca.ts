import { COLS, ROWS, SeedType } from '../types'

// ── CA rule definitions ───────────────────────────────────────────────────────

interface CARule {
  birth:   readonly number[]
  survive: readonly number[]
}

const RULES: Record<string, CARule> = {
  conway:   { birth: [3],        survive: [2, 3]      },  // B3/S23
  highlife: { birth: [3, 6],     survive: [2, 3]      },  // B36/S23
  daynight: { birth: [3,6,7,8],  survive: [3,4,6,7,8] },  // B3678/S34678
  seeds:    { birth: [2],        survive: []           },  // B2/S — every cell dies
}

// ── CA step ───────────────────────────────────────────────────────────────────

/**
 * Compute one generation of the cellular automaton.
 * Grid wraps on all edges. Returns a new Uint8Array.
 */
export function stepCA(
  grid:         Uint8Array,
  cols:         number,
  rows:         number,
  ruleId:       string,
  mutationRate: number,
): Uint8Array {
  const rule = RULES[ruleId] ?? RULES.conway
  const next = new Uint8Array(grid.length)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let n = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue
          const nr = (r + dr + rows) % rows
          const nc = (c + dc + cols) % cols
          n += grid[nr * cols + nc]
        }
      }
      const alive = grid[r * cols + c]
      if (alive) {
        next[r * cols + c] = rule.survive.includes(n) ? 1 : 0
      } else {
        next[r * cols + c] = rule.birth.includes(n)   ? 1 : 0
      }
    }
  }

  // Stochastic mutation to prevent grid from dying out
  if (mutationRate > 0) {
    for (let i = 0; i < next.length; i++) {
      if (Math.random() < mutationRate) next[i] ^= 1
    }
  }

  return next
}

// ── Seed patterns ─────────────────────────────────────────────────────────────

export function emptySeed(cols: number, rows: number): Uint8Array {
  return new Uint8Array(cols * rows)
}

export function randomSeed(cols: number, rows: number, density = 0.25): Uint8Array {
  const g = new Uint8Array(cols * rows)
  for (let i = 0; i < g.length; i++) g[i] = Math.random() < density ? 1 : 0
  return g
}

export function gliderSeed(cols: number, rows: number): Uint8Array {
  const g = new Uint8Array(cols * rows)
  // Classic glider (moves right+down one cell per 4 gens)
  const cells: [number, number][] = [[0,1],[1,2],[2,0],[2,1],[2,2]]
  const r0 = 1, c0 = 2
  for (const [dr, dc] of cells) g[(r0+dr)*cols + (c0+dc)] = 1
  return g
}

export function rPentominoSeed(cols: number, rows: number): Uint8Array {
  const g = new Uint8Array(cols * rows)
  // R-pentomino: chaotic growth, active for ~1100 gens
  const cells: [number, number][] = [[0,1],[0,2],[1,0],[1,1],[2,1]]
  const r0 = Math.floor(rows / 2) - 1
  const c0 = Math.floor(cols / 2) - 1
  for (const [dr, dc] of cells) g[(r0+dr)*cols + (c0+dc)] = 1
  return g
}

export function blinkersSeed(cols: number, rows: number): Uint8Array {
  const g = new Uint8Array(cols * rows)
  // Multiple horizontal 3-cell blinkers across the grid
  const starts: [number, number][] = [
    [1,2], [1,10], [1,18], [1,26],
    [5,6], [5,14], [5,22],
    [9,4], [9,12], [9,20], [9,28],
  ]
  for (const [r, c] of starts) {
    if (r < rows && c + 2 < cols) {
      g[r*cols+c] = g[r*cols+c+1] = g[r*cols+c+2] = 1
    }
  }
  return g
}

export function makeSeed(type: SeedType): Uint8Array {
  switch (type) {
    case 'random':     return randomSeed(COLS, ROWS)
    case 'glider':     return gliderSeed(COLS, ROWS)
    case 'rpentomino': return rPentominoSeed(COLS, ROWS)
    case 'blinkers':   return blinkersSeed(COLS, ROWS)
    default:           return emptySeed(COLS, ROWS)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function countLive(grid: Uint8Array): number {
  let n = 0
  for (let i = 0; i < grid.length; i++) n += grid[i]
  return n
}
