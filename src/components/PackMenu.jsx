import { useState, useEffect, useRef } from 'react';
import { SAMPLE_PACKS } from '../samplePacks';

export function PackMenu({ activePack, onLoadPack }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const packs = Object.values(SAMPLE_PACKS);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="pack-menu" ref={ref}>
      {open && (
        <div className="pack-menu__dropdown">
          <div className="pack-menu__section-label">SAMPLE PACKS</div>
          {packs.map(pack => (
            <button
              key={pack.id}
              className={`pack-menu__item ${activePack === pack.id ? 'pack-menu__item--active' : ''}`}
              onClick={() => { onLoadPack(pack.id); setOpen(false); }}>
              {pack.label}
            </button>
          ))}
          <div className="pack-menu__divider" />
          <button
            className="pack-menu__item pack-menu__item--action"
            onClick={() => { if (activePack) onLoadPack(activePack); setOpen(false); }}>
            ↺ &nbsp;RANDOMIZE ALL
          </button>
        </div>
      )}
      <button
        className={`pack-menu__trigger ${open ? 'pack-menu__trigger--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Sample packs">
        ▤
      </button>
    </div>
  );
}
