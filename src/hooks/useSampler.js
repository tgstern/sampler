import { useState, useCallback, useEffect } from 'react';
import { audioEngine, createDefaultSettings } from '../engine/AudioEngine';
import { SAMPLE_PACKS, DEFAULT_KIT } from '../samplePacks';

const KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
const DEFAULT_PACK = Object.keys(SAMPLE_PACKS)[0] ?? null;

const DEFAULT_PADS = KEYS.reduce((acc, key) => ({
  ...acc,
  [key]: { label: key.toUpperCase(), buffer: null, fileName: null, settings: createDefaultSettings() },
}), {});

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
  }, [loadSampleFromUrl]);

  const loadPackRandom = useCallback(async (packId) => {
    const pack = SAMPLE_PACKS[packId];
    if (!pack) return;
    const shuffled = [...pack.samples].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, KEYS.length);
    setActivePack(packId);
    await Promise.all(picks.map((sample, i) => loadSampleFromUrl(KEYS[i], sample.url, sample.fileName)));
    if (typeof pendo !== 'undefined') {
      pendo.track("sample_pack_loaded", {
        packId,
        packLabel: pack.label,
        sampleCount: picks.length,
        padCount: KEYS.length,
      });
    }
  }, [loadSampleFromUrl]);

  const randomizePad = useCallback((key) => {
    const pack = SAMPLE_PACKS[activePack];
    if (!pack) return;
    const usedNames = new Set(Object.values(pads).map(p => p.fileName).filter(Boolean));
    const available = pack.samples.filter(s => !usedNames.has(s.fileName));
    if (!available.length) return;
    const pick = available[Math.floor(Math.random() * available.length)];
    const previousSample = pads[key]?.fileName || null;
    loadSampleFromUrl(key, pick.url, pick.fileName);
    if (typeof pendo !== 'undefined') {
      pendo.track("pad_sample_randomized", {
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
    if (SAMPLE_PACKS[packId]) {
      loadKit(packId, assignments);
    } else if (DEFAULT_PACK) {
      loadPackRandom(DEFAULT_PACK);
    }
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
      pendo.track("sample_file_uploaded", {
        padKey: key,
        fileName: file.name,
        fileType: file.type || "unknown",
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
    if (typeof pendo !== 'undefined') {
      setPads(prev => {
        const pad = prev[key];
        pendo.track("pad_triggered", {
          padKey: key,
          sampleFileName: pad?.fileName || null,
          packId: activePack,
        });
        return prev;
      });
    }
  }, [activePack]);

  const updateSettings = useCallback((key, patch) => {
    setPads(prev => {
      const pad = prev[key];
      const merged = { ...pad.settings, ...patch };
      audioEngine.setPad(key, pad.buffer, merged);
      if (typeof pendo !== 'undefined') {
        pendo.track("sample_settings_modified", {
          padKey: key,
          pitch: merged.pitch,
          reverse: merged.reverse,
          filterType: merged.filterType,
          filterFreq: merged.filterFreq,
          filterQ: merged.filterQ,
          volume: merged.volume,
          pan: merged.pan,
          startRange: merged.start,
          endRange: merged.end,
        });
      }
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
