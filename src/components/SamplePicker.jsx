import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function SamplePicker({ currentFileName, samples, onSelect }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  const triggerRef  = useRef(null);
  const dropdownRef = useRef(null);

  const handleToggle = () => {
    if (!open) {
      const rect = triggerRef.current.getBoundingClientRect();
      const maxH = 240;
      const top  = rect.bottom + 4 + maxH > window.innerHeight
        ? rect.top - maxH - 4
        : rect.bottom + 4;
      setStyle({ top, left: rect.left, minWidth: Math.max(rect.width, 180) });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!triggerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      <button ref={triggerRef} className={`editor__filename-btn ${open ? 'editor__filename-btn--open' : ''}`} onClick={handleToggle}>
        <span className="editor__filename">{currentFileName || '—'}</span>
        <span className="editor__filename-caret">▾</span>
      </button>

      {open && createPortal(
        <div ref={dropdownRef} className="sample-picker" style={style}>
          {samples.map(s => (
            <button
              key={s.fileName}
              className={`sample-picker__item ${s.fileName === currentFileName ? 'sample-picker__item--active' : ''}`}
              onClick={() => { onSelect(s.url, s.fileName); setOpen(false); }}>
              {s.name}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
