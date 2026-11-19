import { get } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import { SCENES } from '../src/data/rooms';
import { game, newGame, nextDay, setMode, startDay } from '../src/lib/gameState';

describe('플레이 방식(탐색형/대화형)', () => {
  it('새 게임은 탐색형이 기본이고, 고른 방식은 하루가 바뀌어도 유지된다', () => {
    newGame();
    expect(get(game).mode).toBe('explore');
    setMode('novel');
    startDay();
    expect(get(game).mode).toBe('novel');
    nextDay();
    expect(get(game).mode).toBe('novel');
  });

  it('대화형에서 누를 수 있는 대상이 없는 대화 장면은 없다', () => {
    for (const s of Object.values(SCENES)) {
      if (s.kind === 'messenger') continue;
      expect(s.items.some((i) => i.knot), s.id).toBe(true);
    }
  });
});
