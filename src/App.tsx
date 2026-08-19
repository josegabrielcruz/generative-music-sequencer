import './App.css'
import { Grid } from './components/Grid'
import { Controls } from './components/Controls'
import { useSequencer } from './hooks/useSequencer'
import { RULE_LABELS } from './types'

export default function App() {
  const {
    config, setConfig,
    isPlaying, generation, liveCount,
    gridRef, ghostRef, playheadRef, analyserRef,
    handleStart, handleStop, handleSeed, toggleCell,
  } = useSequencer()

  const ruleName = RULE_LABELS[config.ruleId]?.split(' ')[0] ?? config.ruleId

  return (
    <div className="app">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="app-title-group">
          <span className="app-dot" />
          <h1 className="app-title">Cellular Sequencer</h1>
        </div>
        <div className="app-readouts">
          <Readout label="BPM"   value={config.bpm} />
          <Readout label="GEN"   value={String(generation).padStart(3, '0')} />
          <Readout label="LIVE"  value={String(liveCount).padStart(3, '0')} />
          <Readout label="SCALE" value={`${config.rootNote} ${config.scaleName}`} />
          <Readout label="RULE"  value={ruleName.toUpperCase()} />
        </div>
      </header>

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      <main className="app-grid">
        <Grid
          gridRef={gridRef}
          ghostRef={ghostRef}
          playheadRef={playheadRef}
          analyserRef={analyserRef}
          isPlaying={isPlaying}
          onCellToggle={toggleCell}
        />
      </main>

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <Controls
        config={config}
        setConfig={setConfig}
        isPlaying={isPlaying}
        onStart={handleStart}
        onStop={handleStop}
        onSeed={handleSeed}
      />

    </div>
  )
}

// ── Readout sub-component ─────────────────────────────────────────────────────

function Readout({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="readout">
      <span className="readout__label">{label}</span>
      <span className="readout__value">{value}</span>
    </div>
  )
}
