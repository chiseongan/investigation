// 이어하기: sessionStorage 에만 저장한다. 탭을 닫으면 사라지고, 서버로는 아무것도 보내지 않는다.
// 공유 태블릿을 위해 "새 수사 시작"을 누르면 즉시 지운다. 저장소를 못 쓰는 환경에서는 조용히 건너뛴다.
import { get } from 'svelte/store';
import { game, type GameState } from './gameState';
import { exportSessions } from './session';

const KEY = 'undercover-2-2.save.v1';

interface Saved {
  v: 1;
  game: GameState;
  ink: Record<string, string>;
}

export function writeSave() {
  try {
    const g = get(game);
    if (g.phase === 'title' || g.phase === 'briefing') return;
    const data: Saved = { v: 1, game: g, ink: exportSessions() };
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* 저장 불가 환경: 이어하기만 못 쓴다 */
  }
}

export function readSave(): Saved | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Saved;
    if (s.v !== 1 || !s.game || typeof s.game.dayIndex !== 'number') return null;
    return s;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}

/** 상태가 바뀔 때마다, 그리고 탭이 숨겨질 때 저장한다. 해제 함수를 돌려준다. */
export function startAutosave(): () => void {
  const unsub = game.subscribe(() => writeSave());
  const onHide = () => writeSave();
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', onHide);
  return () => {
    unsub();
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', onHide);
  };
}
