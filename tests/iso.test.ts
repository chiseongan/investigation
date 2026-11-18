import { describe, it, expect } from 'vitest';
import { cellCenter, pointToCell, findPath, isAdjacent, nearestStandCell, depthActor, depthObject, key } from '../src/lib/iso';

describe('iso', () => {
  it('projects per spec', () => {
    expect(cellCenter(0, 0)).toEqual({ x: 195, y: 215 });
    expect(cellCenter(2, 1)).toEqual({ x: 225, y: 260 });
  });
  it('inverse projection round-trips every cell', () => {
    for (let c = 0; c < 6; c++) for (let r = 0; r < 6; r++) {
      const p = cellCenter(c, r);
      expect(pointToCell(p.x, p.y)).toEqual({ c, r });
      expect(pointToCell(p.x + 8, p.y - 4)).toEqual({ c, r });
    }
    expect(pointToCell(5, 50)).toBeNull();
  });
  it('depth ordering', () => {
    expect(depthObject(2, 3)).toBe(10);
    expect(depthActor(2, 3)).toBe(11);
  });
  it('path avoids blocked cells', () => {
    const blocked = new Set([key(1, 0), key(1, 1)]);
    const p = findPath({ c: 0, r: 0 }, { c: 2, r: 0 }, blocked)!;
    expect(p.at(-1)).toEqual({ c: 2, r: 0 });
    for (const s of p) expect(blocked.has(key(s.c, s.r))).toBe(false);
    expect(findPath({ c: 0, r: 0 }, { c: 1, r: 0 }, blocked)).toBeNull();
  });
  it('adjacent + stand cell', () => {
    expect(isAdjacent({ c: 1, r: 1 }, { c: 2, r: 2 })).toBe(true);
    expect(isAdjacent({ c: 1, r: 1 }, { c: 1, r: 1 })).toBe(false);
    const s = nearestStandCell({ c: 3, r: 3 }, { c: 5, r: 5 }, new Set([key(3, 3)]))!;
    expect(isAdjacent(s, { c: 3, r: 3 })).toBe(true);
  });
});
