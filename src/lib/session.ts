// 요일마다 ink 이야기를 하나씩 유지한다. (방문 횟수·한 번만 나오는 선택지가 상호작용 사이에 이어지도록)
import { get } from 'svelte/store';
import { DAYS } from '../data/rooms';
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

/** 이어하기용: 요일별 대본 진행을 문자열로 내보내고 되돌린다. */
export function exportSessions(): Record<string, string> {
  const out: Record<string, string> = {};
  cache.forEach((s, day) => (out[day] = s.saveState()));
  return out;
}

export function importSessions(saved: Record<string, string>) {
  cache.clear();
  for (const [day, json] of Object.entries(saved)) {
    try {
      sessionFor(day).loadState(json);
    } catch {
      cache.delete(day); // 읽을 수 없으면 그 요일은 처음부터
    }
  }
}

/** 되감기: 고른 요일과 그 뒤 요일의 대본 진행만 초기화한다. */
export function resetSessionsFrom(dayIndex: number) {
  DAYS.forEach((d, i) => {
    if (i >= dayIndex) cache.delete(d.id);
  });
}

/** 새 수사를 시작할 때 모든 대본 진행을 초기화한다. */
export function resetSessions() {
  cache.clear();
}
