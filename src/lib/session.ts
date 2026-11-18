// 요일마다 ink 이야기를 하나씩 유지한다. (방문 횟수·한 번만 나오는 선택지가 상호작용 사이에 이어지도록)
import { get } from 'svelte/store';
import { game } from './gameState';
import { InkSession } from './inkEngine';

const cache = new Map<string, InkSession>();

export function sessionFor(day: string): InkSession {
  let s = cache.get(day);
  if (!s) {
    s = new InkSession(day, {
      hasClue: (id) => get(game).clues.includes(id),
      trust: (who) => (get(game).trust as Record<string, number>)[who] ?? 0,
    });
    cache.set(day, s);
  }
  return s;
}

/** 새 수사를 시작할 때 모든 대본 진행을 초기화한다. */
export function resetSessions() {
  cache.clear();
}
