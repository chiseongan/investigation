import { describe, it, expect } from 'vitest';
import { InkSession, parseTags } from '../src/lib/inkEngine';
import { SCENES } from '../src/data/rooms';

const hooks = (clues: string[] = []) => ({ hasClue: (id: string) => clues.includes(id), trust: () => 0 });

describe('tags', () => {
  it('parses', () => {
    expect(parseTags(['말:지우', '신뢰:지우+1', '단서:C1', '함정:T1'])).toEqual({
      speaker: 'jiwoo',
      photo: false,
      effects: [
        { kind: 'trust', who: 'jiwoo', delta: 1 },
        { kind: 'clue', id: 'C1', trap: false },
        { kind: 'clue', id: 'T1', trap: true },
      ],
    });
    expect(parseTags(['신뢰:서연-1']).effects).toEqual([{ kind: 'trust', who: 'seoyeon', delta: -1 }]);
  });
});

describe('mon.ink', () => {
  it('every knot used by scenes runs to an end', () => {
    for (const scene of ['mon_arrive', 'mon_break', 'mon_lunch']) {
      for (const it of SCENES[scene].items.filter((i) => i.knot)) {
        const s = new InkSession('mon', hooks());
        s.begin(it.knot!);
        for (let guard = 0; guard < 40; guard++) {
          const b = s.step();
          if (b.type === 'end') break;
          if (b.type === 'choices') s.choose(b.choices[0].index);
          if (guard === 39) throw new Error('no end: ' + it.knot);
        }
      }
    }
  });
  it('choice effects and clue tags', () => {
    const s = new InkSession('mon', hooks());
    s.begin('arrive_jiwoo');
    let b = s.step();
    while (b.type === 'line') b = s.step();
    expect(b.type).toBe('choices');
    if (b.type === 'choices') {
      expect(b.choices[0].effects).toEqual([{ kind: 'trust', who: 'jiwoo', delta: 1 }]);
      expect(b.choices[1].effects).toEqual([{ kind: 'trust', who: 'jiwoo', delta: -1 }]);
      s.choose(0);
      const l = s.step();
      expect(l.type === 'line' && l.speaker).toBe('me');
    }
    const c = new InkSession('mon', hooks());
    c.begin('lunch_corner');
    let cb = c.step();
    while (cb.type === 'line') cb = c.step();
    expect(cb.type === 'choices' && cb.choices[0].effects).toEqual([{ kind: 'clue', id: 'C1', trap: false }]);
  });
  it('second visit shows the "again" branch', () => {
    const s = new InkSession('mon', hooks(['C1']));
    s.begin('lunch_corner'); while (s.step().type !== 'choices'); s.choose(1); while (s.step().type !== 'end');
    s.begin('lunch_corner');
    const l = s.step();
    expect(l.type === 'line' && l.text).toContain('이미 수첩에 기록했다');
  });
});
