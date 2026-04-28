import { useEffect } from 'react';

export function useKeyboard(triggerPad, keys, onArrowUp, onArrowLeft, onArrowRight) {
  useEffect(() => {
    const keySet = new Set(keys);
    const handler = (e) => {
      if (e.repeat) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (keySet.has(key)) {
        e.preventDefault();
        triggerPad(key);
      } else if (e.key === 'ArrowUp')    { e.preventDefault(); onArrowUp?.();    }
        else if (e.key === 'ArrowLeft')  { e.preventDefault(); onArrowLeft?.();  }
        else if (e.key === 'ArrowRight') { e.preventDefault(); onArrowRight?.(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [triggerPad, keys, onArrowUp, onArrowLeft, onArrowRight]);
}
