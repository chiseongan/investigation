import { describe, expect, it } from 'vitest';
import { endingPreview } from '../src/lib/preview';

describe('엔딩 바로 보기', () => {
  it('주소에 ending 이 없으면 쓰지 않는다', () => {
    expect(endingPreview('')).toBeNull();
    expect(endingPreview('?ending=9')).toBeNull();
  });
  it('엔딩 번호에 맞는 판정과 지목 학생을 만든다', () => {
    expect(endingPreview('?ending=1&at=film')).toMatchObject({ at: 'film', state: { phase: 'ending', verdict: { ending: 'resolved' }, report: { picked: 'minjun' } } });
    expect(endingPreview('?ending=3&pick=daeun')?.state.report?.picked).toBe('daeun');
    expect(endingPreview('?ending=3&pick=minjun')?.state.report?.picked).toBe('taeo'); // 정답 지목은 엔딩 3이 아니다
    expect(endingPreview('?ending=4')?.state.shared).toBe(true);
    expect(endingPreview('?ending=1&at=timeline')?.at).toBe('film');
  });
});
