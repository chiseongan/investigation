import { describe, it, expect } from 'vitest';
import { ROOMS, SCENES, DAYS, availableSlots } from '../src/data/rooms';
import { findPath, key, nearestStandCell, pointToCell, cellCenter } from '../src/lib/iso';

describe('rooms', () => {
  for (const scene of Object.values(SCENES).filter((s) => s.kind !== 'messenger')) {
    it(`${scene.id}: no overlaps, everything reachable`, () => {
      const room = ROOMS[scene.room];
      const items = [...room.furniture, ...scene.items];
      const keys = items.map((i) => key(i.c, i.r));
      expect(new Set(keys).size).toBe(keys.length);
      expect(keys).not.toContain(key(scene.start.c, scene.start.r));
      const blocked = new Set(keys);
      for (const it of scene.items.filter((i) => i.knot)) {
        expect(nearestStandCell(it, scene.start, blocked, room.size), it.id).not.toBeNull();
      }
      expect(findPath(scene.start, { c: 0, r: 0 }, blocked, room.size)).not.toBeNull();
    });
  }
  it('10x10 projection round-trips', () => {
    for (let c = 0; c < 10; c++) for (let r = 0; r < 10; r++) {
      const p = cellCenter(c, r, 10);
      expect(pointToCell(p.x, p.y, 10)).toEqual({ c, r });
    }
  });
  it('slots only move forward', () => {
    const mon = DAYS[0];
    expect(availableSlots(mon, [])).toEqual(['arrive']);
    expect(availableSlots(mon, ['arrive'])).toEqual(['break']);
    expect(availableSlots(mon, ['arrive', 'break', 'lunch'])).toEqual([]);
  });
});
