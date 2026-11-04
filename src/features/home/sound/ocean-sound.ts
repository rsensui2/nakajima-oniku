/**
 * 音源ファイルを使わない潮騒。ブラウン雑音をローパスに通し、
 * 2つの低周波で「寄せては返す」うねりと泡のざわめきを作る。
 */

const BUFFER_SECONDS = 6;
const MASTER_LEVEL = 0.42;
const FADE_SECONDS = 2.4;

function brownNoise(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate * BUFFER_SECONDS;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buffer.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
  }
  return buffer;
}

function lfo(ctx: AudioContext, frequency: number, depth: number, target: AudioParam): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.frequency.value = frequency;
  const gain = ctx.createGain();
  gain.gain.value = depth;
  osc.connect(gain).connect(target);
  osc.start();
  return osc;
}

export class OceanSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  async start(): Promise<void> {
    if (!this.ctx) this.build();
    const ctx = this.ctx!;
    await ctx.resume();
    const now = ctx.currentTime;
    this.master!.gain.cancelScheduledValues(now);
    this.master!.gain.setValueAtTime(this.master!.gain.value, now);
    this.master!.gain.linearRampToValueAtTime(MASTER_LEVEL, now + FADE_SECONDS);
  }

  stop(): void {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.8);
  }

  dispose(): void {
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  private build(): void {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const source = ctx.createBufferSource();
    source.buffer = brownNoise(ctx);
    source.loop = true;

    const body = ctx.createBiquadFilter();
    body.type = "lowpass";
    body.frequency.value = 520;
    body.Q.value = 0.4;
    const swell = ctx.createGain();
    swell.gain.value = 0.55;
    source.connect(body).connect(swell).connect(master);
    lfo(ctx, 0.115, 0.38, swell.gain);
    lfo(ctx, 0.083, 320, body.frequency);

    const foamFilter = ctx.createBiquadFilter();
    foamFilter.type = "bandpass";
    foamFilter.frequency.value = 2400;
    foamFilter.Q.value = 0.6;
    const foam = ctx.createGain();
    foam.gain.value = 0.05;
    source.connect(foamFilter).connect(foam).connect(master);
    lfo(ctx, 0.115, 0.045, foam.gain);

    source.start();
    this.ctx = ctx;
    this.master = master;
  }
}
