import { describe, it, expect } from 'vitest';
import { InkSession, type Beat } from '../src/lib/inkEngine';

const hooks = { hasClue: () => false, trust: () => 0 };
const drain = (s: InkSession): Beat => {
  let b = s.step();
  while (b.type === 'line') b = s.step();
  return b;
};

describe('ink save/restore', () => {
  it('a once-only choice stays gone after save → load', () => {
    const a = new InkSession('mon', hooks);
    a.begin('arrive_jiwoo');
    const first = drain(a);
    expect(first.type).toBe('choices');
    if (first.type !== 'choices') return;
    a.choose(first.choices[0].index);
    drain(a);
    const json = a.saveState();

    const b = new InkSession('mon', hooks);
    b.loadState(json);
    b.begin('arrive_jiwoo');
    // 두 번째 방문: 선택지 없이 반복 대사로 끝나야 한다
    expect(drain(b).type).toBe('end');
  });
});
