import { useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { COLS, ROWS } from '../../types'
import './Grid.css'

// ── Drawing constants ─────────────────────────────────────────────────────────

const GHOST_DECAY     = 0.91   // multiplied per frame (~20 frames to fade)
const WAVEFORM_H      = 48     // px — oscilloscope strip height
const CELL_PAD        = 1      // px — gap between cells

const C = {
  BG:          '#06090f',
  CELL_DEAD:   'rgba(0, 229, 255, 0.04)',
  CELL_ALIVE:  'rgba(0, 229, 255, 0.85)',
  CELL_GLOW:   'rgba(0, 229, 255, 0.15)',
  CELL_GHOST:  (a: number) => `rgba(0, 229, 255, ${a * 0.50})`,
  PLAYHEAD_MID:'rgba(0, 229, 255, 0.30)',
  PLAYHEAD_EDGE:'rgba(0, 229, 255, 0)',
  WAVEFORM:    '#00e5ff',
  WAVEFORM_BG: '#0c1220',
  ROW_LINE:    'rgba(0, 229, 255, 0.04)',
  COL_LINE:    'rgba(0, 229, 255, 0.04)',
} as const

// ── Component ─────────────────────────────────────────────────────────────────

interface GridProps {
  gridRef:      React.MutableRefObject<Uint8Array>
  ghostRef:     React.MutableRefObject<Float32Array>
  playheadRef:  React.MutableRefObject<number>
  analyserRef:  React.MutableRefObject<Tone.Analyser | null>
  isPlaying:    boolean
  onCellToggle: (row: number, col: number) => void
}

export function Grid({
  gridRef, ghostRef, playheadRef, analyserRef, isPlaying, onCellToggle,
}: GridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ── RAF draw loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let rafId = 0

    const draw = () => {
      const W   = canvas.offsetWidth
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2)

      // ── Cell metrics ──────────────────────────────────────────────────────
      const cellW = W / COLS
      const cellH = cellW   // square cells
      const gridH = cellH * ROWS
      const H     = gridH + WAVEFORM_H

      // Resize backing store if needed
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width  = Math.round(W * dpr)
        canvas.height = Math.round(H * dpr)
        canvas.style.height = `${H}px`
      }

      const ctx = canvas.getContext('2d')!
      ctx.save()
      ctx.scale(dpr, dpr)

      // ── Background ────────────────────────────────────────────────────────
      ctx.fillStyle = C.BG
      ctx.fillRect(0, 0, W, H)

      // ── Subtle grid lines ─────────────────────────────────────────────────
      ctx.strokeStyle = C.ROW_LINE
      ctx.lineWidth   = 0.5
      for (let r = 1; r < ROWS; r++) {
        const y = r * cellH
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }
      for (let c = 1; c < COLS; c++) {
        const x = c * cellW
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, gridH); ctx.stroke()
      }

      // ── Decay ghost state ─────────────────────────────────────────────────
      const ghost = ghostRef.current
      for (let i = 0; i < ghost.length; i++) {
        if (ghost[i] > 0.001) ghost[i] *= GHOST_DECAY
        else ghost[i] = 0
      }

      // ── Draw cells ────────────────────────────────────────────────────────
      const grid = gridRef.current
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const idx   = r * COLS + c
          const x     = c * cellW + CELL_PAD
          const y     = r * cellH + CELL_PAD
          const w     = cellW - CELL_PAD * 2
          const h     = cellH - CELL_PAD * 2
          const alive = grid[idx]
          const g     = ghost[idx]

          if (alive) {
            // Outer glow
            ctx.fillStyle = C.CELL_GLOW
            ctx.fillRect(x - 2, y - 2, w + 4, h + 4)
            // Cell body
            ctx.fillStyle = C.CELL_ALIVE
            ctx.fillRect(x, y, w, h)
          } else if (g > 0.01) {
            ctx.fillStyle = C.CELL_GHOST(g)
            ctx.fillRect(x, y, w, h)
          } else {
            ctx.fillStyle = C.CELL_DEAD
            ctx.fillRect(x, y, w, h)
          }
        }
      }

      // ── Playhead ──────────────────────────────────────────────────────────
      if (isPlaying && playheadRef.current >= 0) {
        const ph    = playheadRef.current
        const phX   = ph * cellW
        const grad  = ctx.createLinearGradient(phX - cellW, 0, phX + cellW * 2, 0)
        grad.addColorStop(0,    C.PLAYHEAD_EDGE)
        grad.addColorStop(0.35, C.PLAYHEAD_MID)
        grad.addColorStop(0.5,  'rgba(0, 229, 255, 0.45)')
        grad.addColorStop(0.65, C.PLAYHEAD_MID)
        grad.addColorStop(1,    C.PLAYHEAD_EDGE)
        ctx.fillStyle = grad
        ctx.fillRect(phX - cellW, 0, cellW * 3, gridH)
      }

      // ── Waveform strip ────────────────────────────────────────────────────
      const wy = gridH
      ctx.fillStyle = C.WAVEFORM_BG
      ctx.fillRect(0, wy, W, WAVEFORM_H)

      // Separator
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)'
      ctx.lineWidth   = 0.5
      ctx.beginPath(); ctx.moveTo(0, wy); ctx.lineTo(W, wy); ctx.stroke()

      const analyser = analyserRef.current
      if (analyser) {
        const values = analyser.getValue() as Float32Array
        const cy     = wy + WAVEFORM_H / 2
        const amp    = WAVEFORM_H / 2 - 6

        // Centre line
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)'
        ctx.lineWidth   = 0.5
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()

        // Waveform
        ctx.strokeStyle = C.WAVEFORM
        ctx.lineWidth   = 1.5
        ctx.lineJoin    = 'round'
        ctx.globalAlpha = 0.75
        ctx.beginPath()
        for (let i = 0; i < values.length; i++) {
          const x = (i / (values.length - 1)) * W
          const y = cy - values[i] * amp
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
      } else {
        // Flat line when not playing
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)'
        ctx.lineWidth   = 0.5
        const cy = wy + WAVEFORM_H / 2
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
      }

      ctx.restore()
      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [gridRef, ghostRef, playheadRef, analyserRef, isPlaying])

  // ── Cell click / touch toggle ──────────────────────────────────────────────
  const getCell = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect  = canvas.getBoundingClientRect()
    const cellW = rect.width / COLS
    const cellH = cellW   // square
    const col   = Math.floor((clientX - rect.left) / cellW)
    const row   = Math.floor((clientY - rect.top)  / cellH)
    return { row, col }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { row, col } = getCell(e.currentTarget, e.clientX, e.clientY)
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      onCellToggle(row, col)
    }
  }

  return (
    <div className="grid-wrapper">
      <canvas
        ref={canvasRef}
        className="grid-canvas"
        onPointerDown={handlePointerDown}
        aria-label="Cellular automaton sequencer grid. Click cells to toggle notes."
      />
    </div>
  )
}
