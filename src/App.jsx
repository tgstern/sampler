import { useState, useCallback } from 'react';
import { useSampler } from './hooks/useSampler';
import { useKeyboard } from './hooks/useKeyboard';
import { PadGrid } from './components/PadGrid';
import { SampleEditor } from './components/SampleEditor';
import { PackMenu } from './components/PackMenu';
import './App.css';

export default function App() {
  const {
    pads, activeKeys, lastKey, activePack, packSamples,
    triggerPad, loadSample, loadSampleFromUrl, loadPackRandom, randomizePad, updateSettings, keys,
  } = useSampler();
  const [selectedKey, setSelectedKey] = useState(null);

  const handleSelect = (key) => {
    setSelectedKey(prev => (prev === key ? null : key));
  };

  const handleArrowUp = useCallback(() => {
    setSelectedKey(prev => {
      if (prev) return null;
      if (!lastKey || !pads[lastKey]?.buffer) return null;
      return lastKey;
    });
  }, [lastKey, pads]);

  // Navigate to the nearest loaded pad in direction, skipping empty pads
  const navigatePad = useCallback((dir) => {
    if (!selectedKey) return;
    const idx = keys.indexOf(selectedKey);
    const len = keys.length;
    for (let step = 1; step < len; step++) {
      const next = keys[(idx + dir * step + len) % len];
      if (pads[next]?.buffer) { setSelectedKey(next); return; }
    }
  }, [selectedKey, keys, pads]);

  const handleArrowLeft  = useCallback(() => navigatePad(-1), [navigatePad]);
  const handleArrowRight = useCallback(() => navigatePad(1),  [navigatePad]);

  useKeyboard(triggerPad, keys, handleArrowUp, handleArrowLeft, handleArrowRight);

  const editorOpen = !!(selectedKey && pads[selectedKey]?.buffer);

  return (
    <div className="app">
      <main className="app__main">
        <div className="pad-section">
          {editorOpen && (
            <SampleEditor
              padKey={selectedKey}
              pad={pads[selectedKey]}
              packSamples={packSamples}
              onUpdateSettings={updateSettings}
              onSelectSample={loadSampleFromUrl}
              onRandomize={randomizePad}
              onClose={() => setSelectedKey(null)}
            />
          )}
          <div className="pad-bay">
            <PadGrid
              pads={pads}
              activeKeys={activeKeys}
              selectedKey={selectedKey}
              keys={keys}
              onTrigger={triggerPad}
              onSelect={handleSelect}
              onLoad={loadSample}
            />
          </div>
        </div>
      </main>

      <div className="key-hint">
        <span className="key-hint__line">
          <kbd>↑</kbd> {editorOpen ? 'close edit' : 'open edit'}
        </span>
        {editorOpen && (
          <span className="key-hint__line">
            <kbd>←</kbd><kbd>→</kbd> navigate pads
          </span>
        )}
      </div>

      <PackMenu activePack={activePack} onLoadPack={loadPackRandom} />
    </div>
  );
}
