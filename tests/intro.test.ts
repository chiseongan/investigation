import { describe, expect, it } from 'vitest';
import { INTRO } from '../src/data/intro';

describe('시작 인트로', () => {
  it('줄이 있고, 한 줄이 대화창에 들어갈 만큼 짧고, 전학생 연기 대사가 있다', () => {
    expect(INTRO.length).toBeGreaterThan(4);
    for (const l of INTRO) {
      expect(l.text.trim().length).toBeGreaterThan(0);
      expect(l.text.length).toBeLessThanOrEqual(70);
      expect(['me', null]).toContain(l.who);
    }
    expect(INTRO.some((l) => l.who === 'me' && l.text.includes('전학'))).toBe(true);
  });
});
