import { SequencerConfig, SeedType, RULE_LABELS } from '../../types'
import { SCALE_NAMES, ROOT_NOTES } from '../../utils/scales'
import './Controls.css'

interface ControlsProps {
  config:      SequencerConfig
  setConfig:   (u: Partial<SequencerConfig>) => void
  isPlaying:   boolean
  onStart:     () => void
  onStop:      () => void
  onSeed:      (t: SeedType) => void
}

export function Controls({
  config, setConfig, isPlaying, onStart, onStop, onSeed,
}: ControlsProps) {
  return (
    <div className="controls">

      {/* ── Transport ──────────────────────────────────────────────────── */}
      <div className="ctrl-row ctrl-row--transport">
        <button
          className={`ctrl-btn ctrl-btn--play${isPlaying ? ' is-active' : ''}`}
          onClick={isPlaying ? onStop : onStart}
        >
          {isPlaying ? '◼ STOP' : '▶ START'}
        </button>

        <div className="ctrl-field ctrl-field--bpm">
          <label className="ctrl-label">BPM</label>
          <input
            type="range"
            className="ctrl-slider"
            min={40} max={200} step={1}
            value={config.bpm}
            onChange={e => setConfig({ bpm: Number(e.target.value) })}
          />
          <span className="ctrl-value">{config.bpm}</span>
        </div>

        <div className="ctrl-field">
          <label className="ctrl-label">Vol</label>
          <input
            type="range"
            className="ctrl-slider"
            min={-24} max={0} step={1}
            value={config.volume}
            onChange={e => setConfig({ volume: Number(e.target.value) })}
          />
          <span className="ctrl-value">{config.volume} dB</span>
        </div>
      </div>

      {/* ── Music ──────────────────────────────────────────────────────── */}
      <div className="ctrl-row">
        <div className="ctrl-field">
          <label className="ctrl-label">Scale</label>
          <select
            className="ctrl-select"
            value={config.scaleName}
            onChange={e => setConfig({ scaleName: e.target.value })}
          >
            {SCALE_NAMES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="ctrl-field">
          <label className="ctrl-label">Root</label>
          <select
            className="ctrl-select"
            value={config.rootNote}
            onChange={e => setConfig({ rootNote: e.target.value })}
          >
            {ROOT_NOTES.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>

        <div className="ctrl-field">
          <label className="ctrl-label">Synth</label>
          <select
            className="ctrl-select"
            value={config.synthType}
            onChange={e => setConfig({ synthType: e.target.value })}
          >
            {['sine','triangle','sawtooth','square'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Generative ─────────────────────────────────────────────────── */}
      <div className="ctrl-row">
        <div className="ctrl-field">
          <label className="ctrl-label">Rule</label>
          <select
            className="ctrl-select"
            value={config.ruleId}
            onChange={e => setConfig({ ruleId: e.target.value })}
          >
            {Object.entries(RULE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>

        <div className="ctrl-field">
          <label className="ctrl-label">Evolve every</label>
          <select
            className="ctrl-select"
            value={config.loopsPerGen}
            onChange={e => setConfig({ loopsPerGen: Number(e.target.value) })}
          >
            {[1, 2, 4, 8].map(n => (
              <option key={n} value={n}>{n === 1 ? '1 loop' : `${n} loops`}</option>
            ))}
          </select>
        </div>

        <div className="ctrl-field">
          <label className="ctrl-label">Mutation</label>
          <input
            type="range"
            className="ctrl-slider"
            min={0} max={0.20} step={0.005}
            value={config.mutationRate}
            onChange={e => setConfig({ mutationRate: Number(e.target.value) })}
          />
          <span className="ctrl-value">{(config.mutationRate * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* ── Seeds ──────────────────────────────────────────────────────── */}
      <div className="ctrl-row ctrl-row--seeds">
        <span className="ctrl-label">Seed:</span>
        {([
          ['random',     'Random'],
          ['glider',     'Glider'],
          ['rpentomino', 'R-Pento'],
          ['blinkers',   'Blinkers'],
          ['clear',      'Clear'],
        ] as [SeedType, string][]).map(([type, label]) => (
          <button
            key={type}
            className="ctrl-btn ctrl-btn--seed"
            onClick={() => onSeed(type)}
          >
            {label}
          </button>
        ))}
      </div>

    </div>
  )
}
