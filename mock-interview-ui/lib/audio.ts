// Browser audio helpers for the Gemini Live session. Client-only.

export const toBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
};

/** Maps RMS (0..1) to a perceptual 0..1 level for UI meters. */
const toLevel = (rms: number) => Math.min(1, Math.sqrt(rms) * 2.2);

export const fromBase64 = (b64: string): ArrayBuffer => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
};

/** Streams mic audio as 16 kHz 16-bit mono PCM chunks. */
export class MicCapture {
  private ctx?: AudioContext;
  private stream?: MediaStream;
  private node?: AudioWorkletNode;
  private _level = 0;

  /** Latest mic loudness (0..1), refreshed every 100 ms chunk. For UI only. */
  get level() {
    return this._level;
  }

  async start(onChunk: (pcm: ArrayBuffer) => void) {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    });
    this.ctx = new AudioContext({ sampleRate: 16000 });
    await this.ctx.audioWorklet.addModule("/pcm-capture.js");
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, "pcm-capture");
    this.node.port.onmessage = (e) => {
      const pcm = e.data as ArrayBuffer;
      const a = new Int16Array(pcm);
      let sum = 0;
      for (let i = 0; i < a.length; i++) sum += a[i] * a[i];
      this._level = a.length ? toLevel(Math.sqrt(sum / a.length) / 32768) : 0;
      onChunk(pcm);
    };
    src.connect(this.node); // no connection to destination: no mic monitoring
  }

  stop() {
    this.node?.port.close();
    this.node?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
    this.node = undefined;
    this.stream = undefined;
    this.ctx = undefined;
    this._level = 0;
  }
}

/** Queues 24 kHz 16-bit PCM chunks for gapless playback; clear() cuts the bot off. */
export class PcmPlayer {
  private ctx = new AudioContext({ sampleRate: 24000 });
  private analyser: AnalyserNode;
  private samples: Float32Array<ArrayBuffer>;
  private nextTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  onIdle?: () => void;

  constructor() {
    // All playback runs through an analyser so the UI can animate to Ava's real voice.
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.connect(this.ctx.destination);
    this.samples = new Float32Array(this.analyser.fftSize);
  }

  /** Current output loudness (0..1). For UI only. */
  level() {
    if (this.ctx.state !== "running" || this.sources.size === 0) return 0;
    this.analyser.getFloatTimeDomainData(this.samples);
    let sum = 0;
    for (let i = 0; i < this.samples.length; i++) sum += this.samples[i] * this.samples[i];
    return toLevel(Math.sqrt(sum / this.samples.length));
  }

  async resume() {
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  enqueue(pcm: ArrayBuffer) {
    const i16 = new Int16Array(pcm);
    const f32 = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x8000;
    const buf = this.ctx.createBuffer(1, f32.length, 24000);
    buf.copyToChannel(f32, 0);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.analyser);
    const at = Math.max(this.ctx.currentTime + 0.02, this.nextTime);
    src.start(at);
    this.nextTime = at + buf.duration;
    this.sources.add(src);
    src.onended = () => {
      this.sources.delete(src);
      if (this.sources.size === 0) this.onIdle?.();
    };
  }

  /** Drop everything queued (user interrupted). */
  clear() {
    this.sources.forEach((s) => {
      s.onended = null;
      try { s.stop(); } catch {}
    });
    this.sources.clear();
    this.nextTime = 0;
  }

  get playing() {
    return this.sources.size > 0;
  }

  close() {
    this.clear();
    void this.ctx.close();
  }
}
