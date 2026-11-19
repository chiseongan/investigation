// 게임 상태 (Svelte store). 로그인·서버 없음. 공유 태블릿을 위해 저장하지 않는다.
import { derived, writable, get } from 'svelte/store';
import { TRUST_MAX, TRUST_MIN } from '../data/config';
import { CLUES, INFERENCES, type Inference } from '../data/clues';
import type { TrustId } from '../data/characters';
import { DAYS, availableSlots, type SlotId } from '../data/rooms';

import { judge, type EndingId, type Report, type Verdict } from '../data/endings';

export type Phase = 'title' | 'briefing' | 'slot' | 'scene' | 'dayEnd' | 'report' | 'ending';

/** 하루를 시작할 때의 기록. 되감기 하면 이 시점으로 돌아간다. (그날 이후 얻은 단서만 사라진다) */
export interface DaySnapshot {
  clues: string[];
  trust: Record<TrustId, number>;
  seen: string[];
  shared: boolean;
  inferred: string[];
}

/** explore: 쿼터뷰 방을 걸어 다니는 탐색형 / novel: 배경·인물 그림과 대사창만 있는 대화형(비주얼노벨) */
export type Mode = 'explore' | 'novel';

export interface GameState {
  mode: Mode;
  phase: Phase;
  dayIndex: number; // 0 = 월
  actionsLeft: number;
  slotsUsed: SlotId[]; // 오늘 이미 본 시간대
  sceneId: string | null;
  clues: string[]; // 얻은 순서대로
  trust: Record<TrustId, number>;
  seen: string[]; // 상호작용 완료 기록 "sceneId:itemId"
  shared: boolean; // 수요일 공유 버튼 함정
  inferred: string[]; // 수사 보드에서 만든 추론 ("a+b")
  snapshots: Record<number, DaySnapshot>; // 요일 시작 시점 기록 (되감기용)
  report: Report | null; // 금요일 최종 보고서
  verdict: Verdict | null;
}

export function initialState(): GameState {
  return {
    mode: 'explore',
    phase: 'title',
    dayIndex: 0,
    actionsLeft: 0,
    slotsUsed: [],
    sceneId: null,
    clues: [],
    trust: { jiwoo: 0, minjun: 0, seoyeon: 0, doyun: 0 },
    seen: [],
    shared: false,
    inferred: [],
    snapshots: {},
    report: null,
    verdict: null,
  };
}

export const game = writable<GameState>(initialState());

export const clueCount = derived(game, ($g) => $g.clues.length);
export const realClueCount = derived(game, ($g) => $g.clues.filter((id) => !CLUES.find((c) => c.id === id)?.trap).length);

export function newGame() {
  game.set({ ...initialState(), phase: 'briefing' });
}

export function setMode(mode: Mode) {
  game.update((g) => ({ ...g, mode }));
}

export function setPhase(phase: Phase) {
  game.update((g) => ({ ...g, phase }));
}

/** 하루 시작 */
export function startDay() {
  // 행동 제한 없음: 그날의 모든 시간대를 순서대로 볼 수 있다. (actionsLeft = 남은 시간대 수)
  game.update((g) => ({
    ...g,
    phase: 'slot',
    actionsLeft: Object.keys(DAYS[g.dayIndex].scenes).length,
    slotsUsed: [],
    sceneId: null,
    snapshots: {
      ...g.snapshots,
      [g.dayIndex]: { clues: [...g.clues], trust: { ...g.trust }, seen: [...g.seen], shared: g.shared, inferred: [...g.inferred] },
    },
  }));
}

/** 최종 보고서 작성 화면으로 */
export function openReport() {
  game.update((g) => ({ ...g, phase: 'report', sceneId: null }));
}

/** 최종 보고서 제출 → 엔딩 판정 */
export function submitReport(report: Report): EndingId {
  const g = get(game);
  const verdict = judge(report, g.shared, g.trust.jiwoo);
  game.update((s) => ({ ...s, report, verdict, phase: 'ending' }));
  return verdict.ending;
}

/** 되감기: 고른 요일을 시작하던 때로 돌아간다. 그 전 요일에 얻은 단서와 관계는 그대로 남는다. */
export function rewindTo(dayIndex: number) {
  game.update((g) => {
    const snap = g.snapshots[dayIndex];
    if (!snap) return g;
    const kept: Record<number, DaySnapshot> = {};
    for (const k of Object.keys(g.snapshots)) if (Number(k) <= dayIndex) kept[Number(k)] = g.snapshots[Number(k)];
    return { ...g, ...snap, dayIndex, snapshots: kept, report: null, verdict: null };
  });
  startDay();
}

export function enterScene(slot: SlotId, sceneId: string) {
  game.update((g) => ({
    ...g,
    phase: 'scene',
    sceneId,
    actionsLeft: g.actionsLeft - 1,
    slotsUsed: [...g.slotsUsed, slot],
  }));
}

/** 장면을 마치고 다음 시간대 선택 또는 하루 종료로 */
export function leaveScene() {
  game.update((g) => ({
    ...g,
    sceneId: null,
    phase: g.actionsLeft > 0 && availableSlots(DAYS[g.dayIndex], g.slotsUsed).length > 0 ? 'slot' : 'dayEnd',
  }));
}

export function endDay() {
  game.update((g) => ({ ...g, sceneId: null, phase: 'dayEnd' }));
}

export function nextDay() {
  game.update((g) => ({ ...g, dayIndex: g.dayIndex + 1 }));
  startDay();
}

/** 단서 추가. 새로 얻었으면 true */
export function addClue(id: string): boolean {
  if (get(game).clues.includes(id)) return false;
  game.update((g) => ({ ...g, clues: [...g.clues, id] }));
  return true;
}

export function addTrust(who: TrustId, delta: number) {
  game.update((g) => ({
    ...g,
    trust: { ...g.trust, [who]: Math.max(TRUST_MIN, Math.min(TRUST_MAX, g.trust[who] + delta)) },
  }));
}

export function markSeen(id: string) {
  game.update((g) => (g.seen.includes(id) ? g : { ...g, seen: [...g.seen, id] }));
}

export function markShared() {
  game.update((g) => ({ ...g, shared: true }));
}

const pairKey = (a: string, b: string) => [a, b].sort().join('+');

/** 수사 보드: 두 카드를 이어 본다. 정해진 조합이면 추론이 생긴다. */
export function connectClues(a: string, b: string): { result: 'new' | 'already' | 'none'; inference?: Inference } {
  const found = INFERENCES.find((i) => pairKey(i.a, i.b) === pairKey(a, b));
  if (!found) return { result: 'none' };
  const k = pairKey(found.a, found.b);
  if (get(game).inferred.includes(k)) return { result: 'already', inference: found };
  game.update((g) => ({ ...g, inferred: [...g.inferred, k] }));
  return { result: 'new', inference: found };
}
