import { describe, expect, it } from 'vitest';
import { daylight, dayProgress } from '../src/lib/daylight';

describe('하루의 빛깔', () => {
  it('항상 올바른 rgba 값을 돌려주고 범위를 벗어난 값은 잘라 낸다', () => {
    for (const t of [-1, 0, 0.1, 0.45, 0.8, 1, 2]) expect(daylight(t)).toMatch(/^rgba\(\d+, \d+, \d+, [01]\.?\d*\)$/);
    expect(daylight(-1)).toBe(daylight(0));
    expect(daylight(2)).toBe(daylight(1));
  });
  it('한낮에는 덮개가 거의 없고 저녁에는 가장 짙다', () => {
    const a = (t: number) => Number(daylight(t).match(/([\d.]+)\)$/)![1]);
    expect(a(0.45)).toBe(0);
    expect(a(1)).toBeGreaterThan(a(0));
  });
  it('시간대 순서와 그 안의 진행이 하루 위치로 합쳐진다', () => {
    expect(dayProgress(0, 5, 0)).toBe(0);
    expect(dayProgress(2, 5, 0.5)).toBeCloseTo(0.5);
    expect(dayProgress(4, 5, 1)).toBe(1);
  });
});
