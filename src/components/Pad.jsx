import { useRef } from 'react';

export function Pad({ padKey, pad, isActive, isSelected, onTrigger, onSelect, onDrop }) {
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      onDrop(padKey, file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onDrop(padKey, file);
  };

  return (
    <div
      className={`pad ${isActive ? 'pad--active' : ''} ${isSelected ? 'pad--selected' : ''} ${pad.buffer ? 'pad--loaded' : ''}`}
      onClick={() => onTrigger(padKey)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="pad__led" />
      <div className="pad__key">{padKey.toUpperCase()}</div>

      <div className="pad__label">
        {pad.fileName
          ? <span className="pad__filename" title={pad.fileName}>{pad.fileName}</span>
          : <span className="pad__empty">drop audio or click +</span>
        }
      </div>

      <div className="pad__actions">
        <button
          className="pad__upload-btn"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          title="Upload sample"
        >
          +
        </button>
        {pad.buffer && (
          <button
            className={`pad__edit-btn ${isSelected ? 'pad__edit-btn--active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onSelect(padKey); }}
            title="Edit sample"
          >
            ✎
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
