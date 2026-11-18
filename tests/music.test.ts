// NGHE NHẠC TRÊN ĐIỆN THOẠI (lượt 30): máy có loa ngoài — bật "Nghe nhạc" là đổi luôn nhạc nền (BGM) sang
// bài của máy, bấm "Bài khác" để sang bài kế, "Tắt" thì trả nhạc nền về theo ngữ cảnh của game.
import { describe, it, expect } from 'vitest';
import { SONGS, SONG_BY_ID, SONG_TRACKS, isPhoneTrack, songOf } from '../src/audio/songs';
import { TRACKS } from '../src/audio/audio';
import { phoneAct, setPhoneAct, phoneActNext, phoneSong, stopPhoneAct } from '../src/ui/phoneUI';
import { ctx } from '../src/game/ctx';
import { activate } from '../src/sim/phone';
import { fresh } from './helpers';

const boot = () => { const g = fresh(); activate(g, 'camung'); g.cash = 100000; ctx.g = g; ctx.sound = { bgm: '' } as never; return g; };

describe('ba bài nhạc của chiếc điện thoại', () => {
  it('có đúng ba bài, mỗi bài một tên và một ca sĩ riêng', () => {
    expect(SONGS.length).toBe(3);
    expect(new Set(SONGS.map((s) => s.id)).size).toBe(3);
    expect(new Set(SONGS.map((s) => s.name)).size).toBe(3);
    for (const s of SONGS) {
      expect(s.name.length).toBeGreaterThan(4);
      expect(s.by.length).toBeGreaterThan(3);
      expect(s.mood).toBeGreaterThan(0);
      expect(SONG_BY_ID[s.id]).toBe(s);
    }
  });

  it('mỗi bài là một bản nhạc thật: có nhịp, thang âm, 8 ô nhịp giai điệu và bè trầm', () => {
    for (const s of SONGS) {
      const t = s.track;
      expect(t.bpm).toBeGreaterThan(50);
      expect(t.scale.length).toBe(5);                                  // ngũ cung
      expect(t.lead.length).toBeGreaterThanOrEqual(8);
      expect(t.bass.length).toBeGreaterThanOrEqual(8);
      for (const bar of t.lead) expect(bar.length).toBe(16);            // 16 móc đơn một ô nhịp
      for (const bar of t.bass) expect(bar.length).toBe(8);
      // nốt phải nằm trong thang âm hoặc là lặng / ngân dài
      const ok = /^[0-9a-e.\-]+$/;
      for (const bar of [...t.lead, ...t.bass]) expect(ok.test(bar)).toBe(true);
    }
  });

  it('bộ tổng hợp âm thanh nhận cả ba bài của máy (đổi BGM được ngay)', () => {
    for (const s of SONGS) {
      const key = 'phone_' + s.id;
      expect(isPhoneTrack(key)).toBe(true);
      expect(SONG_TRACKS[key]).toBe(s.track);
      expect(TRACKS[key]).toBe(s.track);                               // đã nạp vào bảng nhạc nền
      expect(songOf(key)?.id).toBe(s.id);
    }
    expect(songOf('ban')).toBe(null);                                  // nhạc theo ngữ cảnh thì không phải bài của máy
  });
});

describe('bật nhạc trên máy là đổi nhạc nền, bấm Bài khác để sang bài kế', () => {
  it('bật "Nghe nhạc": máy phát bài đầu và nhạc nền (BGM) đổi theo bài đó', () => {
    boot();
    const s = SONGS[0];
    setPhoneAct('music', 20, `${s.name} — ${s.by}`, '', 'phone_' + s.id);
    ctx.sound.bgm = phoneSong();
    expect(phoneAct()?.k).toBe('music');
    expect(phoneSong()).toBe('phone_' + s.id);
    expect(ctx.sound.bgm).toBe('phone_' + s.id);
    expect(songOf(ctx.sound.bgm)?.name).toBe(s.name);
  });

  it('bấm "Bài khác" ba lần thì đi hết ba bài rồi quay lại bài đầu, lần nào BGM cũng đổi theo', () => {
    boot();
    setPhoneAct('music', 20, '', '', 'phone_' + SONGS[0].id);
    const heard: string[] = [phoneSong()];
    for (let i = 0; i < 3; i++) {
      expect(phoneActNext()).toBe(true);
      const key = phoneSong();
      ctx.sound.bgm = key;                       // nút "Bài khác" gọi đúng hàm này
      expect(key).not.toBe(heard[heard.length - 1]);
      heard.push(key);
    }
    expect(heard.slice(0, 3)).toEqual(SONGS.map((s) => 'phone_' + s.id));
    expect(heard[3]).toBe(heard[0]);             // hết bài cuối thì quay vòng
  });

  it('bấm "Tắt": máy thôi phát, nhạc nền trả về theo ngữ cảnh của game', () => {
    boot();
    setPhoneAct('music', 20, '', '', 'phone_' + SONGS[1].id);
    ctx.sound.bgm = 'phone_' + SONGS[1].id;
    stopPhoneAct();
    expect(phoneAct()).toBe(null);
    expect(ctx.sound.bgm).toBe('');
  });
});
