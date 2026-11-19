import { describe, expect, it } from 'vitest';
import { IMPRESSIONS } from '../src/data/impressions';
import { SCENES } from '../src/data/rooms';

describe('대화 뒤 느낀 점(대화형)', () => {
  it('대화형에서 마주치는 모든 상대에게 1~3줄이 있고, 비어 있는 줄이 없다', () => {
    for (const sc of Object.values(SCENES)) {
      if (sc.kind === 'messenger') continue;
      for (const it of sc.items.filter((i) => i.knot)) {
        const lines = IMPRESSIONS[`${sc.id}:${it.id}`];
        expect(lines, `${sc.id}:${it.id}`).toBeDefined();
        expect(lines.length).toBeGreaterThanOrEqual(1);
        expect(lines.length).toBeLessThanOrEqual(3);
        for (const l of lines) expect(l.trim().length).toBeGreaterThan(0);
      }
    }
  });
  it('장면에 없는 상대의 문구는 없다', () => {
    const ids = new Set(Object.values(SCENES).flatMap((sc) => sc.items.filter((i) => i.knot).map((i) => `${sc.id}:${i.id}`)));
    for (const k of Object.keys(IMPRESSIONS)) expect(ids.has(k), k).toBe(true);
  });
});
