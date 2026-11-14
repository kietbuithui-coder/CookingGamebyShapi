// ÂM THANH — tổng hợp hoàn toàn bằng Web Audio (không dùng tệp ghi âm): hiệu ứng, tiếng môi trường (phố xá, mưa, gió,
// đám đông rì rầm) và 6 bản nhạc nền tự soạn theo ngũ cung, tự chuyển theo ngữ cảnh chơi.
import { clamp } from '../core/util';

type Wave = OscillatorType;
interface Track { bpm: number; scale: number[]; root: number; lead: string[]; bass: string[]; perc: string; inst: 'pluck' | 'flute' | 'bell'; pad: boolean; swing?: number; }
// Ký hiệu: mỗi ký tự là một nốt móc đơn. 0–9,a–e = bậc trong thang âm · '.' = lặng · '-' = ngân tiếp.
// Bộ gõ: k = trống trầm, s = mõ/trống con, h = nhịp nhẹ, . = lặng.
const PENTA_MAJ = [0, 2, 4, 7, 9], PENTA_MIN = [0, 3, 5, 7, 10], OAN = [0, 3, 5, 7, 9], BAC = [0, 2, 5, 7, 9];
export const TRACKS: Record<string, Track> = {
  // Buổi sáng yên bình: sáo trúc thong thả trên nền đàn tranh
  sang: { bpm: 84, scale: BAC, root: 62, inst: 'flute', pad: true, perc: '................',
    lead: ['4-..5-4.2-..0-..', '2-4.5-..7-5.4-..', '4-..5-4.2-..0-2.', '4-2.0-..2-..-...', '7-..9-7.5-..4-..', '5-7.9-..a-9.7-..', '7-5.4-..5-4.2-..', '0-..2-..4-..-...'],
    bass: ['0...4...', '2...4...', '0...4...', '0...2...', '3...4...', '3...4...', '2...4...', '0...0...'] },
  // Giờ bán hàng: rộn ràng, đàn gảy nhanh + mõ
  ban: { bpm: 116, scale: PENTA_MAJ, root: 60, inst: 'pluck', pad: false, swing: 0.12, perc: 'k.h.s.h.k.hks.h.',
    lead: ['0.2.4.5.4.2.4...', '5.4.2.0.2.4.2...', '0.2.4.5.7.5.4.5.', '7.5.4.2.0...0...', '5.5.7.5.4.4.5.4.', '2.2.4.2.0.2.4...', '5.7.9.7.5.4.2.4.', '2.0.2.4.0...-...'],
    bass: ['0.0.4.4.', '3.3.4.4.', '0.0.4.4.', '2.2.0.0.', '3.3.2.2.', '1.1.0.0.', '3.3.4.4.', '0.4.0...'] },
  // Đêm khuya: chậm, vắng, hơi buồn (điệu Oán)
  dem: { bpm: 62, scale: OAN, root: 57, inst: 'bell', pad: true, perc: '................',
    lead: ['4-----..2---....', '5-----..4---....', '2---4---5---4...', '2-------........', '7-----..5---....', '4---5---4---2...', '0---2---4---....', '2-------0-------'],
    bass: ['0.......', '3.......', '2.......', '0.......', '3.......', '2.......', '0.......', '0.......'] },
  // Trời mưa: đàn gảy rơi tí tách như giọt nước
  mua: { bpm: 76, scale: PENTA_MIN, root: 59, inst: 'pluck', pad: true, perc: '....h.......h...',
    lead: ['7.4.2.4.7.4.2.4.', '5.4.2.0.2...-...', '7.4.2.4.9.7.4.7.', '5.4.2.4.2...-...', '9.7.5.7.9.7.5.4.', '5.4.2.0.2.4.5...', '4.2.0.2.4.2.0...', '2...0...-.......'],
    bass: ['0...2...', '3...0...', '0...2...', '3...4...', '3...2...', '1...0...', '2...3...', '0...0...'] },
  // Nguy hiểm / căng thẳng: trống dồn, nốt trầm lặp
  nguy: { bpm: 104, scale: PENTA_MIN, root: 52, inst: 'pluck', pad: true, perc: 'k..k..k.k..k.sk.',
    lead: ['0.0.3.0.0.0.4.3.', '0.0.3.0.5.4.3...', '0.0.3.0.0.0.4.3.', '7.5.4.3.0...0...', '5.5.7.5.5.5.8.7.', '5.5.7.5.4.3.0...', '0.3.4.5.7.5.4.3.', '0...0...0.......'],
    bass: ['0..0..0.', '0..0..3.', '0..0..0.', '2..2..0.', '3..3..3.', '3..3..2.', '0..2..3.', '0..0....'] },
  // Lễ hội: tưng bừng, trống hội
  lehoi: { bpm: 132, scale: PENTA_MAJ, root: 64, inst: 'flute', pad: false, swing: 0.08, perc: 'k.s.k.sskks.k.s.',
    lead: ['4.5.7.5.4.2.4.5.', '7.9.7.5.4...4...', '4.5.7.5.4.2.0.2.', '4.2.0.2.4...-...', '7.7.9.7.5.5.7.5.', '4.4.5.4.2.2.4.2.', '7.9.a.9.7.5.4.5.', '7.5.4.2.0...0...'],
    bass: ['0.4.0.4.', '3.4.3.4.', '0.4.0.4.', '2.4.0.4.', '3.3.4.4.', '1.1.2.2.', '3.4.3.4.', '0.4.0.0.'] },
};
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
const deg = (t: Track, ch: string, oct = 0) => { const d = parseInt(ch, 16), n = t.scale.length; return t.root + t.scale[d % n] + 12 * Math.floor(d / n) + oct * 12; };

export class Sound {
  ac: AudioContext | null = null; private master!: GainNode; private sfxG!: GainNode; private musG!: GainNode; private ambG!: GainNode; private noise!: AudioBuffer; private comp!: DynamicsCompressorNode;
  private loops: Record<string, { g: GainNode; f?: BiquadFilterNode }> = {}; private track = ''; private want = 'sang'; private stepI = 0; private nextT = 0; private trackG: GainNode | null = null; private bar = 0;
  sfxVol = 0.8; musVol = 0.5; ready = false; private lastStep = 0; private birdT = 3; private amb = { crowd: 0, rain: 0, wind: 0, night: 0, city: 0.5, indoor: 0 };
  /** Gọi trong một thao tác chạm đầu tiên của người dùng (trình duyệt di động yêu cầu). */
  unlock() {
    if (this.ac) { if (this.ac.state !== 'running') void this.ac.resume(); return; }
    const AC = window.AudioContext || (window as any).webkitAudioContext; if (!AC) return;
    const ac = (this.ac = new AC({ latencyHint: 'interactive' }));
    this.comp = ac.createDynamicsCompressor(); this.comp.threshold.value = -14; this.comp.ratio.value = 4; this.comp.connect(ac.destination);
    this.master = ac.createGain(); this.master.gain.value = 0.9; this.master.connect(this.comp);
    this.sfxG = ac.createGain(); this.musG = ac.createGain(); this.ambG = ac.createGain(); for (const g of [this.sfxG, this.musG, this.ambG]) g.connect(this.master);
    const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0); let b = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b = b * 0.2 + w * 0.8; d[i] = b; } this.noise = buf;
    // các vòng âm thanh nền (luôn chạy, chỉ đổi âm lượng)
    this.mkLoop('city', 'lowpass', 240, 0.7); this.mkLoop('crowd', 'bandpass', 620, 0.9); this.mkLoop('crowd2', 'bandpass', 1250, 1.4); this.mkLoop('rain', 'highpass', 2600, 0.5); this.mkLoop('rain2', 'bandpass', 900, 0.6);
    this.mkLoop('wind', 'bandpass', 380, 1.6); this.mkLoop('sizzle', 'highpass', 3800, 0.8); this.mkLoop('boil', 'bandpass', 520, 2.2); this.mkLoop('pour', 'bandpass', 1500, 2.5); this.mkLoop('cricket', 'bandpass', 4300, 22);
    this.setVol(this.sfxVol, this.musVol); this.ready = true; this.nextT = ac.currentTime + 0.3;
  }
  setVol(sfx: number, mus: number) { this.sfxVol = sfx; this.musVol = mus; if (!this.ac) return; this.sfxG.gain.value = sfx; this.ambG.gain.value = sfx * 0.8; this.musG.gain.value = mus * 0.55; }
  private mkLoop(name: string, type: BiquadFilterType, freq: number, q: number) {
    const ac = this.ac!, s = ac.createBufferSource(); s.buffer = this.noise; s.loop = true; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ac.createGain(); g.gain.value = 0;
    s.connect(f); f.connect(g); g.connect(name === 'sizzle' || name === 'boil' || name === 'pour' ? this.sfxG : this.ambG); s.start(); this.loops[name] = { g, f };
  }
  loop(name: 'sizzle' | 'boil' | 'pour', level: number) { const l = this.loops[name]; if (!l || !this.ac) return; l.g.gain.setTargetAtTime(clamp(level) * (name === 'boil' ? 0.5 : 0.32), this.ac.currentTime, 0.08); }
  private tone(freq: number, dur: number, type: Wave, vol: number, when = 0, slide = 0, dest?: AudioNode, attack = 0.005) {
    const ac = this.ac!; const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); o.connect(g); g.connect(dest ?? this.sfxG); o.start(t); o.stop(t + dur + 0.02);
  }
  private burst(dur: number, type: BiquadFilterType, freq: number, vol: number, when = 0, q = 1, sweep = 0, dest?: AudioNode) {
    const ac = this.ac!; const t = ac.currentTime + when, s = ac.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = 0.7 + Math.random() * 0.6;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * sweep), t + dur); f.Q.value = q;
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); s.connect(f); f.connect(g); g.connect(dest ?? this.sfxG); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  step(kind: 'dry' | 'wet', vol = 1) { if (!this.ready) return; this.burst(0.07, 'bandpass', kind === 'wet' ? 1700 : 820 + Math.random() * 200, 0.13 * vol, 0, 1.2, 0.5); if (kind === 'wet') this.burst(0.12, 'highpass', 3000, 0.05 * vol, 0.02); }
  play(name: string) {
    if (!this.ready) return; const T = (f: number, d: number, w: Wave = 'sine', v = 0.2, at = 0, sl = 0) => this.tone(f, d, w, v, at, sl), N = (d: number, ty: BiquadFilterType, f: number, v: number, at = 0, q = 1, sw = 0) => this.burst(d, ty, f, v, at, q, sw);
    switch (name) {
      case 'pick': T(520, 0.07, 'triangle', 0.16); T(780, 0.08, 'triangle', 0.12, 0.05); break;
      case 'coin': T(1320, 0.09, 'square', 0.07); T(1760, 0.22, 'square', 0.07, 0.07); break;
      case 'tip': T(1320, 0.08, 'square', 0.07); T(1760, 0.08, 'square', 0.07, 0.07); T(2090, 0.3, 'square', 0.07, 0.14); break;
      case 'buy': case 'learn': case 'quest': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.22, 'triangle', 0.16, i * 0.09)); break;
      case 'good': T(660, 0.1, 'triangle', 0.18); T(990, 0.25, 'triangle', 0.16, 0.09); break;
      case 'ok': T(520, 0.18, 'triangle', 0.15); break;
      case 'bad': case 'nope': T(220, 0.22, 'sawtooth', 0.1, 0, 0.7); T(160, 0.25, 'sawtooth', 0.1, 0.12, 0.7); break;
      case 'boo': T(200, 0.4, 'sawtooth', 0.09, 0, 0.6); break;
      case 'yay': [784, 988, 1175].forEach((f, i) => T(f, 0.16, 'triangle', 0.13, i * 0.07)); break;
      case 'order': T(880, 0.07, 'sine', 0.16); T(1175, 0.14, 'sine', 0.14, 0.07); break;
      case 'ding': T(1568, 0.5, 'sine', 0.16); T(3136, 0.3, 'sine', 0.04); break;
      case 'chop': N(0.05, 'bandpass', 2400, 0.3, 0, 1.5); T(190, 0.07, 'triangle', 0.22, 0.01, 0.6); break;
      case 'toss': N(0.22, 'highpass', 3200, 0.2, 0, 0.8, 1.6); break;
      case 'flip': N(0.12, 'highpass', 4200, 0.2); T(300, 0.05, 'triangle', 0.08); break;
      case 'fan': N(0.18, 'bandpass', 700, 0.22, 0, 0.8, 1.8); break;
      case 'plop': T(420, 0.12, 'sine', 0.2, 0, 0.45); N(0.08, 'bandpass', 1200, 0.08, 0.02); break;
      case 'skim': N(0.1, 'bandpass', 1800, 0.12, 0, 2, 1.5); break;
      case 'hiss': N(0.6, 'highpass', 5000, 0.25); break;
      case 'place': T(130, 0.14, 'triangle', 0.26, 0, 0.6); N(0.08, 'lowpass', 500, 0.2); break;
      case 'open': [523, 784].forEach((f, i) => T(f, 0.2, 'triangle', 0.15, i * 0.1)); break;
      case 'close': [784, 523].forEach((f, i) => T(f, 0.2, 'triangle', 0.13, i * 0.1)); break;
      case 'door': N(0.14, 'lowpass', 420, 0.26); T(95, 0.12, 'triangle', 0.18, 0.05, 0.7); break;
      case 'crash': N(0.5, 'lowpass', 1400, 0.45, 0, 0.7, 0.3); N(0.3, 'highpass', 3000, 0.2, 0.05); break;
      case 'eat': for (let i = 0; i < 3; i++) N(0.07, 'bandpass', 900 + i * 150, 0.16, i * 0.13, 2); break;
      case 'drink': for (let i = 0; i < 3; i++) T(300 + i * 60, 0.1, 'sine', 0.13, i * 0.14, 1.5); break;
      case 'splash': N(0.5, 'bandpass', 1500, 0.25, 0, 0.8, 0.6); break;
      case 'rummage': for (let i = 0; i < 4; i++) N(0.09, 'bandpass', 600 + Math.random() * 1600, 0.16, i * 0.11, 2); break;
      case 'fix': for (let i = 0; i < 3; i++) { T(900, 0.05, 'square', 0.08, i * 0.16); N(0.04, 'bandpass', 2600, 0.14, i * 0.16); } break;
      case 'sleep': [392, 330, 262].forEach((f, i) => T(f, 0.5, 'sine', 0.12, i * 0.3)); break;
      case 'wake': [262, 330, 392, 523].forEach((f, i) => T(f, 0.3, 'sine', 0.12, i * 0.14)); break;
      case 'thunder': N(2.4, 'lowpass', 220, 0.9, 0.25, 0.5, 0.3); N(0.4, 'lowpass', 900, 0.5, 0.2); break;
      case 'ui': T(700, 0.04, 'triangle', 0.08); break;
      // ── đường phố ──
      case 'paper': N(0.09, 'bandpass', 1500, 0.16, 0, 1.8, 0.7); T(300, 0.05, 'triangle', 0.05); break;
      case 'spit': N(0.14, 'highpass', 2800, 0.15, 0, 0.9, 0.5); N(0.07, 'bandpass', 800, 0.07, 0.04); break;
      case 'shout': T(185, 0.26, 'sawtooth', 0.09, 0, 1.25); T(240, 0.2, 'sawtooth', 0.06, 0.07, 1.1); break;
      case 'horn': T(430, 0.1, 'square', 0.07); T(430, 0.09, 'square', 0.05, 0.15); break;
      // ── đấm, nhảy, ngất ──
      case 'thud': N(0.09, 'lowpass', 700, 0.5, 0, 0.7, 0.4); T(95, 0.13, 'triangle', 0.28, 0, 0.6); break;
      case 'whoosh': N(0.16, 'bandpass', 1200, 0.16, 0, 1.6, 1.4); break;
      case 'jump': T(300, 0.09, 'sine', 0.1, 0, 1.8); T(430, 0.06, 'sine', 0.07, 0.05, 2); break;
      // ── xe đạp, xích đu ──
      case 'pedal': N(0.06, 'bandpass', 2600, 0.09, 0, 1.3, 1.2); T(290, 0.04, 'square', 0.05, 0, 0.5); break;
      case 'wind': N(0.8, 'bandpass', 420, 0.11, 0, 0.55, 1.5); N(0.5, 'highpass', 2200, 0.03, 0.1); break;
      case 'siren': for (let i = 0; i < 3; i++) { T(660, 0.16, 'sine', 0.05, i * 0.32, 1.1); T(880, 0.16, 'sine', 0.045, i * 0.32 + 0.16, 1.1); } break;
    }
  }
  // ───────── tiếng môi trường ─────────
  ambient(dt: number, o: { crowd: number; rain: number; wind: number; night: number; indoor: number; morning: boolean }) {
    if (!this.ready) return; const ac = this.ac!, t = ac.currentTime, L = this.loops, k = o.indoor ? 0.45 : 1;
    const set = (n: string, v: number) => L[n].g.gain.setTargetAtTime(v, t, 0.4);
    set('city', (0.05 + 0.05 * (1 - o.night)) * k); set('crowd', clamp(o.crowd) * 0.07 * k * (0.8 + 0.3 * Math.sin(t * 1.7))); set('crowd2', clamp(o.crowd) * 0.03 * k * (0.8 + 0.3 * Math.sin(t * 2.9 + 1)));
    set('rain', o.rain * 0.2 * k); set('rain2', o.rain * 0.14 * (o.indoor ? 1.2 : 1)); set('wind', o.wind * 0.12 * (0.6 + 0.4 * Math.sin(t * 0.7)) * k);
    set('cricket', o.night > 0.6 && o.rain < 0.1 ? 0.012 * (Math.sin(t * 14) > 0 ? 1 : 0.2) : 0);
    // chim hót: sáng sớm rộn hơn, ban ngày lẻ tẻ, mưa thì im. Luôn nhỏ — chỉ đủ để thấy có chim quanh đây.
    this.birdT -= dt;
    if (this.birdT <= 0) {
      this.birdT = (o.morning ? 4 : 9) + Math.random() * 11;
      if (o.rain < 0.1 && !o.indoor && (o.morning || Math.random() < 0.55)) this.chirp(Math.random() < 0.15 ? 'dove' : 'sparrow', o.morning ? 1 : 0.7);
    }
  }
  /** Tiếng chim hót (chim sẻ, gáy, quạ). vol 0–1: càng xa càng nhỏ. */
  chirp(kind: 'sparrow' | 'dove' | 'crow' = 'sparrow', vol = 1) {
    if (!this.ready) return;
    const v = 0.05 * (0.35 + 0.65 * vol);
    if (kind === 'crow') { for (let i = 0; i < 2; i++) this.tone(520, 0.14, 'sawtooth', v * 0.55, i * 0.2, 0.75, this.ambG); }
    else if (kind === 'dove') { for (let i = 0; i < 3; i++) this.tone(430, 0.2, 'sine', v * 0.9, i * 0.24, 1.12, this.ambG); }
    else { const f = 2300 + Math.random() * 1300, n = 2 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) this.tone(f * (1 + i * 0.07), 0.07, 'sine', v * 0.7, i * 0.1, 1.3, this.ambG); }
  }
  // ───────── nhạc nền ─────────
  music(want: string) { this.want = want; }
  private note(t: Track, n: number, when: number, dur: number, vol: number, inst: Track['inst']) {
    const ac = this.ac!, f = midi(n), g = ac.createGain(), o = ac.createOscillator(); g.connect(this.trackG!);
    if (inst === 'pluck') { o.type = 'triangle'; const o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f * 2.003; const g2 = ac.createGain(); g2.gain.setValueAtTime(vol * 0.22, when); g2.gain.exponentialRampToValueAtTime(0.0005, when + 0.12); o2.connect(g2); g2.connect(this.trackG!); o2.start(when); o2.stop(when + 0.16);
      g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + 0.004); g.gain.exponentialRampToValueAtTime(0.0006, when + Math.max(0.5, dur * 1.6)); o.frequency.setValueAtTime(f * 1.012, when); o.frequency.exponentialRampToValueAtTime(f, when + 0.06); o.start(when); o.stop(when + Math.max(0.55, dur * 1.6) + 0.02); }
    else if (inst === 'flute') { o.type = 'sine'; const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 5.2; lg.gain.value = f * 0.008; lfo.connect(lg); lg.connect(o.frequency); lfo.start(when); lfo.stop(when + dur + 0.1);
      const o3 = ac.createOscillator(), g3 = ac.createGain(); o3.type = 'triangle'; o3.frequency.value = f * 2; g3.gain.value = vol * 0.13; o3.connect(g3); g3.connect(g); o3.start(when); o3.stop(when + dur + 0.1);
      g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol * 0.8, when + 0.05); g.gain.setValueAtTime(vol * 0.7, when + Math.max(0.06, dur - 0.06)); g.gain.linearRampToValueAtTime(0, when + dur + 0.05); o.frequency.value = f; o.start(when); o.stop(when + dur + 0.1); }
    else { o.type = 'sine'; const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.type = 'sine'; o2.frequency.value = f * 3.01; g2.gain.setValueAtTime(vol * 0.25, when); g2.gain.exponentialRampToValueAtTime(0.0005, when + 0.5); o2.connect(g2); g2.connect(this.trackG!); o2.start(when); o2.stop(when + 0.6);
      g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol * 0.8, when + 0.008); g.gain.exponentialRampToValueAtTime(0.0006, when + 2.2); o.frequency.value = f; o.start(when); o.stop(when + 2.3); }
    o.connect(g);
  }
  /** Gọi mỗi khung hình: xếp lịch nốt nhạc cho ~0,3 giây tới. */
  tick() {
    if (!this.ready) return; const ac = this.ac!, now = ac.currentTime;
    if (this.want !== this.track && (this.stepI % 16 === 0 || !this.track)) {
      const old = this.trackG; if (old) { old.gain.setTargetAtTime(0, now, 0.5); setTimeout(() => old.disconnect(), 2500); }
      this.track = this.want; this.trackG = ac.createGain(); this.trackG.gain.setValueAtTime(0, now); this.trackG.gain.linearRampToValueAtTime(1, now + 1.5); this.trackG.connect(this.musG); this.stepI = 0; this.bar = 0; this.nextT = Math.max(this.nextT, now + 0.1);
    }
    const t = TRACKS[this.track]; if (!t || this.musVol <= 0.01) { this.nextT = now + 0.1; return; }
    const spb = 60 / t.bpm / 2;   // độ dài một móc đơn
    if (this.nextT < now - 0.5) this.nextT = now + 0.05;
    while (this.nextT < now + 0.3) {
      const s = this.stepI % 16, bar = this.bar % t.lead.length, when = this.nextT + (s % 2 ? (t.swing ?? 0) * spb : 0);
      const lead = t.lead[bar], ch = lead[s];
      if (ch !== '.' && ch !== '-' && ch !== undefined) { let len = 1; while (lead[s + len] === '-') len++; this.note(t, deg(t, ch, t.inst === 'flute' ? 1 : 0), when, len * spb, 0.22, t.inst); }
      if (s % 2 === 0) { const b = t.bass[bar][s / 2]; if (b && b !== '.' && b !== '-') { const f = midi(deg(t, b, -2)); this.tone(f, spb * 2.4, 'triangle', 0.2, when - now, 0, this.trackG!, 0.01); } }
      if (t.pad && s === 0) { for (const d of [0, 2, 4]) { const f = midi(deg(t, String((parseInt(t.bass[bar][0], 16) || 0) + d), -1)); this.tone(f, spb * 16, 'sine', 0.035, when - now, 0, this.trackG!, spb * 3); } }
      const p = t.perc[s];
      if (p === 'k') { this.tone(110, 0.16, 'sine', 0.3, when - now, 0.4, this.trackG!); } else if (p === 's') { this.burst(0.05, 'bandpass', 1900, 0.16, when - now, 3, 0, this.trackG!); this.tone(820, 0.04, 'square', 0.04, when - now, 0, this.trackG!); } else if (p === 'h') this.burst(0.03, 'highpass', 6000, 0.06, when - now, 1, 0, this.trackG!);
      this.nextT += spb; this.stepI++; if (this.stepI % 16 === 0) this.bar++;
    }
  }
}
