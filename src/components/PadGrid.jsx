import { Pad } from './Pad';

export function PadGrid({ pads, activeKeys, selectedKey, keys, onTrigger, onSelect, onLoad }) {
  return (
    <div className="pad-grid">
      {keys.map((key) => (
        <Pad
          key={key}
          padKey={key}
          pad={pads[key]}
          isActive={activeKeys.has(key)}
          isSelected={selectedKey === key}
          onTrigger={onTrigger}
          onSelect={onSelect}
          onDrop={onLoad}
        />
      ))}
    </div>
  );
}
