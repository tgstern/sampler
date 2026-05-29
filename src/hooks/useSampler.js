import { useState, useCallback, useEffect } from 'react';
import { audioEngine, createDefaultSettings } from '../engine/AudioEngine';
import { SAMPLE_PACKS, DEFAULT_KIT } from '../samplePacks';

const KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
const DEFAULT_PACK = Object.keys(SAMPLE_PACKS)[0] ?? null;

const DEFAULT_PADS = KEYS.reduce((acc, key) => ({
  ...acc,
  [key]: { label: key.toUpperCase(), buffer: null, fileName: null, settings: createDefaultSettings() },
}), {});

// Module-level dedup guard for default_kit_loaded (fires once per session)
const defaultKitTracked = { current: false };

export function useSampler() {
  const [pads, setPads]             = useState(DEFAULT_PADS);
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [lastKey, setLastKey]       = useState(null);
  const [activePack, setActivePack] = useState(DEFAULT_PACK);

  const loadSampleFromUrl = useCallback(async (key, url, fileName) => {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = await audioEngine.loadBuffer(arrayBuffer);
    setPads(prev => {
      const pad = prev[key];
      audioEngine.setPad(key, buffer, pad.settings);
      return { ...prev, [key]: { ...pad, buffer, fileName } };
    });
  }, []);

  const loadKit = useCallback(async (packId, assignments) => {
    const pack = SAMPLE_PACKS[packId];
    if (!pack) return;
    setActivePack(packId);
    await Promise.all(assignments.map((fileName, i) => {
      const sample = pack.samples.find(s => s.fileName === fileName);
      return sample ? loadSampleFromUrl(KEYS[i], sample.url, sample.fileName) : Promise.resolve();
    }));
    if (typeof pendo !== 'undefined') {
      pendo.track('sample_pack_loaded', {
        packId,
        packName: pack.label,
        sampleCount: assignments.length,
        assignedSamples: assignments.join(', '),
      });
    }
  }, [loadSampleFromUrl]);

  const loadPackRandom = useCallback(async (packId) => {
    const pack = SAMPLE_PACKS[packId];
    if (!pack) return;
    const shuffled = [...pack.samples].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, KEYS.length);
    setActivePack(packId);
    await Promise.all(picks.map((sample, i) => loadSampleFromUrl(KEYS[i], sample.url, sample.fileName)));
    if (typeof pendo !== 'undefined') {
      pendo.track('all_pads_randomized', {
        packId,
        packName: pack.label,
        selectedSamples: picks.map(s => s.fileName).join(', '),
        totalSamplesInPack: pack.samples.length,
      });
    }
  }, [loadSampleFromUrl]);

  const randomizePad = useCallback((key) => {
    const pack = SAMPLE_PACKS[activePack];
    if (!pack) return;
    const usedNames = new Set(Object.values(pads).map(p => p.fileName).filter(Boolean));
    const available = pack.samples.filter(s => !usedNames.has(s.fileName));
    if (!available.length) return;
    const previousSample = pads[key]?.fileName || null;
    const pick = available[Math.floor(Math.random() * available.length)];
    loadSampleFromUrl(key, pick.url, pick.fileName);
    if (typeof pendo !== 'undefined') {
      pendo.track('pad_sample_randomized', {
        padKey: key,
        packId: activePack,
        previousSample,
        newSample: pick.fileName,
        availableSamplesCount: available.length,
      });
    }
  }, [activePack, pads, loadSampleFromUrl]);

  // Load default drum kit on mount; fall back to random if pack not found
  useEffect(() => {
    const { packId, assignments } = DEFAULT_KIT;
    const loadDefault = async () => {
      let loadMethod;
      let loadedCount;
      if (SAMPLE_PACKS[packId]) {
        await loadKit(packId, assignments);
        loadMethod = 'loadKit';
        loadedCount = assignments.length;
      } else if (DEFAULT_PACK) {
        await loadPackRandom(DEFAULT_PACK);
        loadMethod = 'loadPackRandom';
        loadedCount = KEYS.length;
      }
      if (!defaultKitTracked.current && typeof pendo !== 'undefined') {
        defaultKitTracked.current = true;
        const pack = SAMPLE_PACKS[packId] || SAMPLE_PACKS[DEFAULT_PACK];
        pendo.track('default_kit_loaded', {
          packId: packId || DEFAULT_PACK,
          packName: pack?.label || 'unknown',
          loadedSampleCount: loadedCount,
          loadMethod,
        });
      }
    };
    loadDefault();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSample = useCallback(async (key, file) => {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = await audioEngine.loadBuffer(arrayBuffer);
    setPads(prev => {
      const pad = prev[key];
      audioEngine.setPad(key, buffer, pad.settings);
      return { ...prev, [key]: { ...pad, buffer, fileName: file.name } };
    });
    if (typeof pendo !== 'undefined') {
      pendo.track('custom_sample_uploaded', {
        padKey: key,
        fileName: file.name,
        fileType: file.type || file.name.split('.').pop(),
        fileSize: file.size,
      });
    }
  }, []);

  const triggerPad = useCallback((key) => {
    audioEngine.trigger(key);
    setLastKey(key);
    setActiveKeys(prev => { const n = new Set(prev); n.add(key); return n; });
    setTimeout(() => {
      setActiveKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
    }, 120);
  }, []);

  const updateSettings = useCallback((key, patch) => {
    setPads(prev => {
      const pad = prev[key];
      const merged = { ...pad.settings, ...patch };
      audioEngine.setPad(key, pad.buffer, merged);
      return { ...prev, [key]: { ...pad, settings: merged } };
    });
  }, []);

  const packSamples = activePack ? (SAMPLE_PACKS[activePack]?.samples ?? []) : [];

  return {
    pads, activeKeys, lastKey, activePack, packSamples,
    triggerPad, loadSample, loadSampleFromUrl, loadPackRandom, loadKit, randomizePad, updateSettings,
    keys: KEYS,
  };
}
