// 결과 코드와 구글폼 사전 입력 링크. 개인정보는 들어가지 않는다 (엔딩·단서 수·공유 여부·함정 수·지목 번호).
import { CANDIDATES, ENDINGS, type EndingId, type Verdict } from '../data/endings';
import type { CharId } from '../data/characters';
import { GOOGLE_FORM } from '../data/config';

export interface ResultInput {
  ending: EndingId;
  verdict: Verdict;
  shared: boolean;
  picked: CharId;
}

const check = (s: string) => ([...s].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 36).toString(36).toUpperCase();

/** 예) E2-C07-S0-T1-P0-K : 엔딩2, 진짜 단서 7개, 공유 안 함, 함정 1개, 지목 0번(민준) */
export function buildCode(r: ResultInput): string {
  const body = `E${ENDINGS[r.ending].no}-C${String(r.verdict.real).padStart(2, '0')}-S${r.shared ? 1 : 0}-T${r.verdict.traps}-P${Math.max(0, CANDIDATES.indexOf(r.picked))}`;
  return `${body}-${check(body)}`;
}

export const formConfigured = () => GOOGLE_FORM.formId !== 'FORM_ID_HERE';

/** 구글폼 사전 입력 링크. 폼 ID 가 바뀌기 전에는 null */
export function formUrl(r: ResultInput): string | null {
  if (!formConfigured()) return null;
  const e = GOOGLE_FORM.entries;
  const q = new URLSearchParams({
    usp: 'pp_url',
    [e.code]: buildCode(r),
    [e.ending]: `${ENDINGS[r.ending].no}. ${ENDINGS[r.ending].title}`,
    [e.shared]: r.shared ? '예' : '아니오',
    [e.trapPicked]: String(r.verdict.traps),
    [e.clues]: String(r.verdict.real),
  });
  return `https://docs.google.com/forms/d/e/${GOOGLE_FORM.formId}/viewform?${q.toString()}`;
}
