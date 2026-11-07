// Browser audio helpers for the Gemini Live session. Client-only.

export const toBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
};

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

  async start(onChunk: (pcm: ArrayBuffer) => void) {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    });
    this.ctx = new AudioContext({ sampleRate: 16000 });
    await this.ctx.audioWorklet.addModule("/pcm-capture.js");
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, "pcm-capture");
    this.node.port.onmessage = (e) => onChunk(e.data as ArrayBuffer);
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
  }
}

/** Queues 24 kHz 16-bit PCM chunks for gapless playback; clear() cuts the bot off. */
export class PcmPlayer {
  private ctx = new AudioContext({ sampleRate: 24000 });
  private nextTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  onIdle?: () => void;

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
    src.connect(this.ctx.destination);
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
