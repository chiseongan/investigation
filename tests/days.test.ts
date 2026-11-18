import { describe, it, expect } from 'vitest';
import { InkSession, type Beat } from '../src/lib/inkEngine';
import { SCENES, DAYS } from '../src/data/rooms';
import { CLUES } from '../src/data/clues';

const mk = (day: string, clues: string[] = [], trust: Record<string, number> = {}) =>
  new InkSession(day, { hasClue: (id) => clues.includes(id), trust: (w) => trust[w] ?? 0 });

/** 첫 선택지만 고르며 끝까지 진행, 효과를 모아서 돌려준다 */
function run(s: InkSession, knot: string, pick = (n: number) => 0) {
  s.begin(knot);
  const out: Beat[] = [];
  for (let g = 0; g < 80; g++) {
    const b = s.step();
    out.push(b);
    if (b.type === 'end') return out;
    if (b.type === 'choices') s.choose(b.choices[Math.min(pick(g), b.choices.length - 1)].index);
  }
  throw new Error('no end: ' + knot);
}
const clueIds = (beats: Beat[]) =>
  beats.flatMap((b) => (b.type === 'line' ? b.effects : b.type === 'choices' ? b.choices.flatMap((c) => c.effects) : []))
    .flatMap((e) => (e.kind === 'clue' ? [e.id] : []));

describe('tue/wed/thu scripts', () => {
  it('every interactive knot runs to an end', () => {
    for (const day of DAYS) {
      for (const sceneId of Object.values(day.scenes)) {
        const scene = SCENES[sceneId!];
        const knots = scene.kind === 'messenger' ? [scene.knot!] : scene.items.filter((i) => i.knot).map((i) => i.knot!);
        for (const k of knots) expect(() => run(mk(day.id, [], { seoyeon: 3, doyun: 3, jiwoo: 3 }), k, () => 1), k).not.toThrow();
      }
    }
  });

  it('all 12 clue ids are reachable from some knot', () => {
    const seen = new Set<string>();
    for (const day of DAYS) {
      for (const sceneId of Object.values(day.scenes)) {
        const scene = SCENES[sceneId!];
        const knots = scene.kind === 'messenger' ? [scene.knot!] : scene.items.filter((i) => i.knot).map((i) => i.knot!);
        for (const k of knots) {
          // 선택지를 0..2 번 바꿔 가며 훑는다
          for (const have of [[], ['C5']]) for (const p of [0, 1, 2]) {
            const s = mk(day.id, have, { seoyeon: 3, doyun: 3, jiwoo: 3 });
            try { clueIds(run(s, k, () => p)).forEach((c) => seen.add(c)); } catch { /* ignore */ }
          }
        }
      }
    }
    for (const id of CLUES.map((c) => c.id).filter((id) => id !== 'C10')) expect(seen.has(id), id).toBe(true);
  });

  it('testimonies are locked without trust, open with it', () => {
    const closed = clueIds(run(mk('thu', [], { seoyeon: 0 }), 'thu_break_seoyeon', () => 2));
    expect(closed).toEqual([]);
    const open = clueIds(run(mk('thu', [], { seoyeon: 2 }), 'thu_break_seoyeon'));
    expect(open).toEqual(['C7']);
    expect(clueIds(run(mk('thu', [], { doyun: 1 }), 'thu_lunch_doyun', () => 2))).toEqual([]);
    expect(clueIds(run(mk('thu', [], { doyun: 2 }), 'thu_lunch_doyun'))).toEqual(['C8']);
    expect(clueIds(run(mk('thu', [], { jiwoo: 2 }), 'thu_pe_jiwoo'))).toEqual(['C9']);
  });

  it('empathic choice can unlock within the same talk', () => {
    // 신뢰 1에서 '기다려 준다'(+1) 를 고르면 같은 대화에서 열린다. 신뢰는 호출자가 올려 주는 것을 흉내낸다.
    const t = { seoyeon: 1 };
    const s = new InkSession('thu', { hasClue: () => false, trust: (w) => (t as Record<string, number>)[w] ?? 0 });
    s.begin('thu_break_seoyeon');
    let b = s.step();
    while (b.type === 'line') b = s.step();
    expect(b.type).toBe('choices');
    if (b.type === 'choices') {
      t.seoyeon += 1; // 엔진이 효과를 반영
      s.choose(b.choices[0].index);
    }
    const rest: Beat[] = [];
    for (let i = 0; i < 20; i++) { const x = s.step(); rest.push(x); if (x.type === 'end') break; }
    expect(clueIds(rest)).toEqual(['C7']);
  });

  it('wednesday messenger: share is a flagged trap; capture then list gives C5 then C6', () => {
    const have: string[] = [];
    const s = new InkSession('wed', { hasClue: (id) => have.includes(id), trust: () => 0 });
    s.begin('wed_chat');
    const next = (): Beat => { let b = s.step(); while (b.type === 'line') b = s.step(); return b; };
    let b = next();
    expect(b.type === 'choices' && b.choices.map((c) => c.effects.map((e) => e.kind))).toEqual([['shared'], ['clue'], []]);
    if (b.type !== 'choices') throw new Error();
    s.choose(b.choices[0].index); // 공유 (함정)
    b = next();
    expect(b.type === 'choices' && b.choices.map((c) => c.effects.map((e) => e.kind))).toEqual([['clue'], []]);
    if (b.type !== 'choices') throw new Error();
    have.push('C5');
    s.choose(b.choices[0].index); // 캡처
    b = next();
    expect(b.type === 'choices' && b.choices.some((c) => c.effects.some((e) => e.kind === 'clue' && e.id === 'C6'))).toBe(true);
  });
});
