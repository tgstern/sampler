const DEFAULT_SETTINGS = {
  pitch:      0,
  reverse:    false,
  filterType: 'lowpass',
  filterFreq: 20000,
  filterQ:    1,
  volume:     1.0,
  pan:        0,
  start:      0,
  end:        1,
};

export function createDefaultSettings() {
  return { ...DEFAULT_SETTINGS };
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.pads = {};
    this.activeSources = {};
  }

  _ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  async loadBuffer(arrayBuffer) {
    this._ensureContext();
    return await this.ctx.decodeAudioData(arrayBuffer);
  }

  setPad(key, buffer, settings) {
    this.pads[key] = { buffer, reversedBuffer: null, settings: { ...DEFAULT_SETTINGS, ...settings } };
  }

  _getReversed(key) {
    const pad = this.pads[key];
    if (!pad.reversedBuffer) pad.reversedBuffer = this._reverseBuffer(pad.buffer);
    return pad.reversedBuffer;
  }

  updateSettings(key, patch) {
    if (this.pads[key]) {
      this.pads[key].settings = { ...this.pads[key].settings, ...patch };
    }
  }

  trigger(key) {
    this._ensureContext();
    const pad = this.pads[key];
    if (!pad?.buffer) return;

    this._stopActive(key);

    const { buffer, settings } = pad;
    const {
      pitch, reverse, start, end,
      filterType, filterFreq, filterQ,
      volume, pan,
    } = settings;

    const playBuffer = reverse ? this._getReversed(key) : buffer;
    const now = this.ctx.currentTime;
    const dur = playBuffer.duration;
    const st  = Math.max(0, start) * dur;
    const et  = Math.min(1, end)   * dur;
    const playDur = Math.max(0.001, et - st);

    const source = this.ctx.createBufferSource();
    source.buffer = playBuffer;
    source.playbackRate.value = Math.pow(2, pitch / 12);

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;

    // Stereo panner
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = pan;

    // Gain — small ramp to prevent clicks, no amplitude envelope
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.003);

    source.connect(filter);
    filter.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(now, st, playDur);
    source.stop(now + playDur + 0.05);

    this.activeSources[key] = { source, gainNode };
    source.onended = () => {
      if (this.activeSources[key]?.source === source) delete this.activeSources[key];
    };
  }

  _stopActive(key) {
    const active = this.activeSources[key];
    if (!active) return;
    const { source, gainNode } = active;
    const now = this.ctx.currentTime;
    const fade = 0.005; // 5ms fade to prevent clicks
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + fade);
    try { source.stop(now + fade + 0.001); } catch (_) {}
    delete this.activeSources[key];
  }

  _reverseBuffer(buffer) {
    const reversed = this.ctx.createBuffer(
      buffer.numberOfChannels, buffer.length, buffer.sampleRate
    );
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const data = new Float32Array(buffer.length);
      buffer.copyFromChannel(data, ch);
      reversed.copyToChannel(data.reverse(), ch);
    }
    return reversed;
  }

  setMasterVolume(v) {
    this._ensureContext();
    this.masterGain.gain.value = v;
  }
}

export const audioEngine = new AudioEngine();
