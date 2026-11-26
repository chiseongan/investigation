import { describe, expect, it } from 'vitest';
import meta from '../src/assets/portraits/meta.json';
import { filmFor } from '../src/data/epilogue';
import type { EndingId } from '../src/data/endings';

const FACES = meta as Record<string, { faces: string[] }>;
const ROOMS = ['classroom', 'hallway', 'cafeteria', 'gym', 'counseling', 'gate', 'playground'];
const ENDINGS: EndingId[] = ['resolved', 'insufficient', 'misidentified', 'participant'];

describe('엔딩 영상 대본', () => {
  for (const e of ENDINGS) {
    it(`${e}: 장소·인물·표정이 모두 실제로 있고, 줄이 비어 있지 않다`, () => {
      for (const p of e === 'misidentified' ? (['taeo', 'seoyeon', 'doyun', 'daeun'] as const) : (['taeo'] as const)) check(filmFor(e, p, '이름'));
    });
  }
  function check(shots: ReturnType<typeof filmFor>) {
    {
      expect(shots.length).toBeGreaterThan(0);
      for (const s of shots) {
        if (s.kind === 'card') {
          expect(s.text.trim().length).toBeGreaterThan(0);
          continue;
        }
        if (s.kind === 'ledger') {
          expect(s.items.length).toBeGreaterThan(0);
          for (const it of s.items) expect(it.text.trim().length).toBeGreaterThan(0);
          continue;
        }
        expect(ROOMS).toContain(s.bg);
        expect(s.t).toBeGreaterThanOrEqual(0);
        expect(s.t).toBeLessThanOrEqual(1);
        if (s.me) expect(FACES.me.faces).toContain(s.me);
        for (const f of s.right) expect(FACES[f.who]?.faces, f.who).toContain(f.face);
        expect(s.lines.length).toBeGreaterThan(0);
        const all = [...s.lines, ...(s.choices?.flatMap((c) => c.reply) ?? [])];
        for (const l of all) {
          expect(l.text.trim().length).toBeGreaterThan(0);
          expect(l.text).not.toContain('{이름}');
          if (l.who && l.face) expect(FACES[l.who]?.faces, `${l.who}:${l.face}`).toContain(l.face);
        }
      }
    }
  }
  it('엔딩 1은 지우의 회복 뒤 "그렇다면 민준이는 어떻게 됐을까?" 카드와 가해 딱지 장면이 이어진다', () => {
    const shots = filmFor('resolved', 'minjun', '민준');
    const q = shots.findIndex((s) => s.kind === 'card' && s.text.replace(/\s+/g, ' ').includes('그렇다면 민준이는 어떻게 됐을까?'));
    expect(q).toBeGreaterThan(0);
    const before = shots.slice(0, q);
    const b = shots.findIndex((s) => s.kind === 'card' && s.text.includes('함께 웃던 친구들'));
    expect(b).toBeGreaterThan(q);
    const after = shots.slice(q + 1, b);
    expect(before.some((s) => s.kind === 'scene' && s.right.some((f) => f.who === 'jiwoo'))).toBe(true);
    expect(after.some((s) => s.kind === 'scene' && !!s.tag)).toBe(true);
    expect(after.every((s) => s.kind !== 'scene' || s.right.every((f) => f.who === 'minjun'))).toBe(true);
    // 가해 학생이 받을 수 있는 법적 책임(학교 조치, 소년법, 형사, 민사)이 영상에 나온다
    const ledger = after.find((s) => s.kind === 'ledger');
    expect(ledger && ledger.kind === 'ledger' && ledger.items.map((i) => i.no)).toEqual(expect.arrayContaining(['학교', '소년법', '형사', '민사']));
  });
  it('엔딩 1·4는 동조·전달한 친구들(태오·다은)의 반성까지 보여 준다', () => {
    for (const e of ['resolved', 'participant'] as const) {
      const shots = filmFor(e, 'minjun', '민준');
      const said = shots.flatMap((s) => (s.kind === 'scene' && s.place?.includes('특별교육') ? s.lines.map((l) => l.who) : []));
      expect(said).toEqual(expect.arrayContaining(['daeun', 'taeo']));
    }
    const ledgers = filmFor('resolved', 'minjun', '민준').flatMap((s) => (s.kind === 'ledger' ? s.items.map((i) => i.no) : []));
    expect(ledgers).toEqual(expect.arrayContaining(['전달', '동조', '방관']));
  });
});
