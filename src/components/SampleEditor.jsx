import { Knob } from './Knob';
import { Waveform } from './Waveform';
import { SamplePicker } from './SamplePicker';

const FILTER_TYPES = ['lowpass', 'bandpass', 'highpass'];

export function SampleEditor({ padKey, pad, packSamples, onUpdateSettings, onSelectSample, onRandomize, onClose }) {
  if (!pad.buffer) return null;

  const s = pad.settings;
  const set = (key) => (val) => onUpdateSettings(padKey, { [key]: val });

  return (
    <div className="editor">
      <div className="editor__header">
        <div className="editor__title">
          <span className="editor__key">{padKey.toUpperCase()}</span>
          <span className="editor__section-label">/ EDIT SAMPLE /</span>
          {packSamples?.length > 0
            ? <SamplePicker
                currentFileName={pad.fileName}
                samples={packSamples}
                onSelect={(url, fileName) => onSelectSample(padKey, url, fileName)}
              />
            : <span className="editor__filename">{pad.fileName}</span>
          }
        </div>
        <div className="editor__header-actions">
          {onRandomize && (
            <button className="editor__randomize" onClick={() => onRandomize(padKey)} title="Pick random sample from pack">↺</button>
          )}
          <button className="editor__close" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="editor__waveform">
        <Waveform
          buffer={pad.buffer}
          start={s.start}
          end={s.end}
          reverse={s.reverse}
          onRangeChange={(start, end) => onUpdateSettings(padKey, { start, end })}
        />
        <div className="editor__waveform-labels">
          <span style={{ color: '#e07818' }}>◀ START</span>
          <span style={{ color: '#e07818' }}>END ▶</span>
        </div>
      </div>

      <div className="editor__sections">

        <section className="editor__section">
          <h3 className="editor__section-title">Sample</h3>
          <div className="editor__sample-inner">
            <div className="editor__knobs">
              <Knob label="Pitch" value={s.pitch} min={-24} max={24} step={0.5} unit=" st" decimals={1} defaultValue={0} onChange={set('pitch')} />
            </div>
            <div className="editor__filter-type">
              <button
                className={`filter-btn ${s.reverse ? 'filter-btn--active' : ''}`}
                onClick={() => onUpdateSettings(padKey, { reverse: !s.reverse })}>
                REV
              </button>
            </div>
          </div>
        </section>

        <section className="editor__section">
          <h3 className="editor__section-title">Filter</h3>
          <div className="editor__filter-inner">
            <div className="editor__knobs">
              <Knob label="Freq" value={s.filterFreq} min={20} max={20000} step={1}   unit=" Hz" decimals={0} defaultValue={20000} onChange={set('filterFreq')} />
              <Knob label="Q"    value={s.filterQ}    min={0.1} max={20}   step={0.1}            decimals={1} defaultValue={1}     onChange={set('filterQ')} />
            </div>
            <div className="editor__filter-type">
              {FILTER_TYPES.map(t => (
                <button key={t}
                  className={`filter-btn ${s.filterType === t ? 'filter-btn--active' : ''}`}
                  onClick={() => onUpdateSettings(padKey, { filterType: t })}>
                  {t === 'lowpass' ? 'LP' : t === 'highpass' ? 'HP' : 'BP'}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="editor__section" style={{ borderRight: 'none' }}>
          <h3 className="editor__section-title">Mix</h3>
          <div className="editor__knobs">
            <Knob label="Vol" value={s.volume} min={0.01} max={2} step={0.01} decimals={2} defaultValue={1.0} onChange={set('volume')} />
            <Knob label="Pan" value={s.pan}    min={-1}   max={1} step={0.01} decimals={2} defaultValue={0}   onChange={set('pan')} />
          </div>
        </section>

      </div>
    </div>
  );
}
