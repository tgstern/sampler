const modules = import.meta.glob('./assets/**/*.wav', { query: '?url', import: 'default', eager: true });

export const SAMPLE_PACKS = {};

for (const [path, url] of Object.entries(modules)) {
  const segments = path.split('/');
  const packId   = segments[segments.length - 2];
  const fileName = segments[segments.length - 1];
  const name     = fileName.replace(/\.wav$/i, '');

  if (!SAMPLE_PACKS[packId]) {
    // "tr808" → "TR-808", generic fallback → uppercase
    const label = packId.replace(/^([a-zA-Z]+)(\d+)$/, (_, l, n) => `${l.toUpperCase()}-${n}`);
    SAMPLE_PACKS[packId] = { id: packId, label, samples: [] };
  }
  SAMPLE_PACKS[packId].samples.push({ name, fileName, url });
}

for (const pack of Object.values(SAMPLE_PACKS)) {
  pack.samples.sort((a, b) => a.name.localeCompare(b.name));
}

// Classic drum machine default kit — maps to pads a/s/d/f/g/h/j/k
export const DEFAULT_KIT = {
  packId: 'tr808',
  assignments: [
    'Kick Basic.wav',
    'Snare Mid.wav',
    'Rimshot.wav',
    'Hihat.wav',
    'Open Hat Short.wav',
    'Claves.wav',
    'Conga Low.wav',
    'Conga High.wav',
  ],
};
