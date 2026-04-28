import { useRef, useCallback, useState } from 'react';

export function Knob({ value, min, max, step = 0.001, label, unit = '', onChange, decimals = 2, defaultValue }) {
  const startY = useRef(null);
  const startVal = useRef(null);
  const [draft, setDraft] = useState(null); // null = display mode

  const range = max - min;
  const normalized = (value - min) / range;
  const angle = -135 + normalized * 270;
  const displayStr = typeof value === 'number' ? value.toFixed(decimals) : String(value);

  const onMouseDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT') return;
    e.preventDefault();
    startY.current = e.clientY;
    startVal.current = value;

    const onMove = (ev) => {
      const delta = (startY.current - ev.clientY) / 150;
      const newVal = Math.min(max, Math.max(min, startVal.current + delta * range));
      const snapped = step ? Math.round(newVal / step) * step : newVal;
      onChange(parseFloat(snapped.toFixed(decimals)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [value, min, max, step, range, onChange, decimals]);

  const onDoubleClick = useCallback((e) => {
    if (e.target.tagName === 'INPUT') return;
    if (defaultValue !== undefined) onChange(defaultValue);
  }, [defaultValue, onChange]);

  const handleFocus = () => {
    setDraft('');
  };

  const commit = () => {
    if (draft !== null) {
      const parsed = parseFloat(draft);
      if (!isNaN(parsed) && parsed !== 0) {
        onChange(parseFloat(Math.max(min, Math.min(max, parsed)).toFixed(decimals)));
      }
    }
    setDraft(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { commit(); e.target.blur(); }
    if (e.key === 'Escape') { setDraft(null); e.target.blur(); }
  };

  const title = defaultValue !== undefined
    ? `${label}: ${displayStr}${unit} — dbl-click to reset`
    : `${label}: ${displayStr}${unit}`;

  return (
    <div className="knob-wrap">
      <div className="knob-ring">
        <div
          className="knob"
          onMouseDown={onMouseDown}
          onDoubleClick={onDoubleClick}
          title={title}
          style={{ '--angle': `${angle}deg` }}
        >
          <div className="knob__indicator" />
        </div>
      </div>
      <div className="knob__label">{label}</div>
      <input
        className="knob__value"
        value={draft !== null ? draft : `${displayStr}${unit}`}
        onFocus={handleFocus}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
