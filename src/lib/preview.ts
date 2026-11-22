// 엔딩 연출만 바로 보기 (수업 준비·확인용). 주소 끝에 붙여서 쓴다.
//   ?ending=1        엔딩 1(멈춘 괴롭힘) 결과 화면부터
//   ?ending=1&at=film  엔딩 영상 컷부터 바로
//   ?ending=3&pick=daeun  엔딩 3에서 지목된 학생을 바꿔 보기 (taeo, seoyeon, doyun, daeun)
// 엔딩 번호는 1 멈춘 괴롭힘 / 2 늦어진 도움 / 3 엉뚱한 지목 / 4 전달한 손. 저장 기록은 건드리지 않는다.
import type { CharId } from '../data/characters';
import { CANDIDATES, CULPRIT, type EndingId } from '../data/endings';
import { initialState, type GameState } from './gameState';

export type EndingStep = 'result' | 'penalty' | 'timeline' | 'film' | 'exit';

const BY_NO: Record<string, EndingId> = { '1': 'resolved', '2': 'insufficient', '3': 'misidentified', '4': 'participant' };
const STEPS: EndingStep[] = ['result', 'penalty', 'timeline', 'film', 'exit'];

export function endingPreview(search: string): { state: GameState; at: EndingStep } | null {
  const q = new URLSearchParams(search);
  const ending = BY_NO[q.get('ending') ?? ''];
  if (!ending) return null;
  const pickParam = q.get('pick') as CharId | null;
  const picked: CharId = ending === 'misidentified' ? (pickParam && CANDIDATES.includes(pickParam) && pickParam !== CULPRIT ? pickParam : 'taeo') : CULPRIT;
  let at = STEPS.find((s) => s === q.get('at')) ?? 'result';
  if (ending === 'resolved' && at === 'timeline') at = 'film'; // 엔딩 1은 10년 후 글 단계가 없다
  const shared = ending === 'participant';
  const state: GameState = {
    ...initialState(),
    mode: 'novel',
    phase: 'ending',
    shared,
    report: { evidence: [], picked },
    verdict: { ending, real: ending === 'resolved' ? 8 : 4, traps: 0, reasons: [] },
  };
  return { state, at };
}
