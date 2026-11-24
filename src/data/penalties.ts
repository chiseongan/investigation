// 가해 학생이 받을 수 있는 조치(학교폭력예방법 제17조 안내용 요약)와 통계.
//
// !!! 수업 전 최신 기준 확인 !!!
// 법령·교육부 지침·대입 반영 방식은 해마다 바뀝니다. 수업에 쓰기 전에 아래 내용을 최신 기준과 맞춰 보세요.
// - 조치의 종류와 순서, 생활기록부 기재·삭제 기준
// - 의무교육(중학교) 단계에서의 조치 가능 범위
// - 근거를 확인하지 못한 통계는 verified:false 이며, SHOW_UNVERIFIED_STATS 를 true 로 바꾸기 전에는 화면에 나오지 않습니다.
//
// 문구 원칙: 단정하지 않고 "이런 조치를 받을 수 있다"로 쓴다. 실제 조치는 학교폭력대책심의위원회가
// 사안의 정도·반성·화해 노력 등을 따져 결정한다.
import type { EndingId } from './endings';

export interface PenaltyCard {
  id: string;
  no: string; // 호수
  name: string;
  desc: string;
  level: 1 | 2 | 3; // 무게 (표시용 점 개수)
}

export const PENALTIES: PenaltyCard[] = [
  { id: 'p1', no: '1호', name: '서면 사과', desc: '피해 학생에게 글로 사과하는 조치를 받을 수 있다.', level: 1 },
  { id: 'p2', no: '2호', name: '접촉·협박·보복 금지', desc: '피해 학생에게 접근하거나 연락하는 것이 금지되는 조치를 받을 수 있다.', level: 1 },
  { id: 'p3', no: '3호', name: '학교에서의 봉사', desc: '학교 안에서 봉사 활동을 하는 조치를 받을 수 있다.', level: 1 },
  { id: 'p4', no: '4호', name: '사회봉사', desc: '학교 밖 기관에서 봉사 활동을 하는 조치를 받을 수 있다.', level: 2 },
  { id: 'p5', no: '5호', name: '특별교육·심리치료', desc: '학교 안팎의 전문가에게 특별교육이나 심리치료를 받는 조치를 받을 수 있다.', level: 2 },
  { id: 'p6', no: '6호', name: '출석정지', desc: '일정 기간 학교에 나오지 못하는 조치를 받을 수 있다.', level: 2 },
  { id: 'p7', no: '7호', name: '학급교체', desc: '같은 학교 안에서 다른 반으로 옮겨지는 조치를 받을 수 있다.', level: 3 },
  { id: 'p8', no: '8호', name: '전학', desc: '다른 학교로 옮겨 가는 조치를 받을 수 있다.', level: 3 },
];

/** 같은 효과: 가해 학생이 아닌 경우 겪을 수 있는 일 (조치가 아니라 영향) */
export const IMPACT_CARDS: PenaltyCard[] = [
  { id: 'i1', no: '영향', name: '근거 없는 지목', desc: '증거 없이 지목된 학생은 조사와 의심, 소문을 겪을 수 있다.', level: 2 },
  { id: 'i2', no: '영향', name: '전달한 사람의 책임', desc: '사진을 전달한 사람도 사안의 일부로 조사 대상이 될 수 있다.', level: 2 },
  { id: 'i3', no: '영향', name: '조치의 지연', desc: '근거가 부족하면 조치가 늦어지고, 그동안 피해가 이어질 수 있다.', level: 2 },
];

/** 엔딩마다 보여 줄 카드 */
export function cardsFor(ending: EndingId): { heading: string; cards: PenaltyCard[] } {
  const by = (ids: string[]) => [...PENALTIES, ...IMPACT_CARDS].filter((c) => ids.includes(c.id));
  switch (ending) {
    case 'resolved':
      return { heading: '사안의 정도에 따라 이런 조치를 받을 수 있다', cards: by(['p1', 'p2', 'p3', 'p5']) };
    case 'insufficient':
      return { heading: '이런 일이 생길 수 있다', cards: by(['i3']) };
    case 'misidentified':
      return { heading: '이런 일이 생길 수 있다', cards: by(['i1', 'i3']) };
    case 'participant':
      return { heading: '사진을 전달한 경우 이런 조치를 받을 수 있다', cards: by(['i2', 'p1', 'p2', 'p5']) };
  }
}

export interface Stat {
  text: string;
  verified: boolean;
}

/** 근거를 확인해야 하는 통계. verified:false 는 수업 전에 출처를 확인하기 전까지 숨깁니다. */
export const STATS: Stat[] = [
  { text: '2026학년도 대입에서 학교폭력 조치 사항을 반영하는 대학의 비율은 약 75%라는 보도가 있다.', verified: false },
  { text: '조치 기록은 졸업 뒤 일정 기간 학교생활기록부에 남을 수 있다. (기간은 조치 종류에 따라 다르다)', verified: false },
];

// ---- 학교 조치와는 별개로 따를 수 있는 법적 책임 (엔딩 1에서 보여 준다) ----
// !!! 수업 전 최신 기준 확인 !!! 형사미성년자 연령, 소년법 보호처분의 종류와 대상 연령, 관련 법 개정 여부는 바뀔 수 있습니다.
// 이야기 속 인물은 중학교 1학년이라 대개 만 14세 미만(촉법소년)입니다. 학년·나이를 바꾸면 이 문구도 함께 점검하세요.
/** 법적 책임 카드. 학교의 조치와 별개로, 사안에 따라 이런 책임을 질 수 있다 */
export const LEGAL: PenaltyCard[] = [
  {
    id: 'l1',
    no: '소년법',
    name: '보호처분',
    desc: '만 14세 미만(촉법소년)은 형벌 대신 법원 소년부의 보호처분을 받을 수 있다. 사안에 따라 보호관찰이나 소년원 송치까지 이어질 수 있다.',
    level: 3,
  },
  {
    id: 'l2',
    no: '형사',
    name: '형사처벌',
    desc: '만 14세 이상이면 협박·강요·모욕·명예훼손 등으로 형사처벌 대상이 될 수 있다. 사진을 퍼뜨리면 정보통신망 관련 법으로도 처벌받을 수 있다.',
    level: 3,
  },
  {
    id: 'l3',
    no: '민사',
    name: '손해배상',
    desc: '피해 학생의 치료비와 위자료를 물어 줘야 할 수 있고, 보호자가 함께 책임을 질 수 있다.',
    level: 2,
  },
];

/** 사진을 전달한 경우(엔딩 4)의 법적 책임. 직접 올리지 않고 전달만 했어도 책임이 생길 수 있다 */
export const LEGAL_FORWARD: PenaltyCard[] = [
  {
    id: 'f1',
    no: '소년법',
    name: '보호처분',
    desc: '만 14세 미만(촉법소년)이라도 사안에 따라 법원 소년부의 보호처분 대상이 될 수 있다. 사진을 전달만 했다는 이유로 책임이 없어지는 것은 아니다.',
    level: 3,
  },
  {
    id: 'f2',
    no: '형사',
    name: '형사처벌',
    desc: '만 14세 이상이면 사진을 퍼뜨린 행위가 명예훼손·모욕, 정보통신망 관련 법 위반 등으로 처벌 대상이 될 수 있다. 전달한 사람도 조사받을 수 있다.',
    level: 3,
  },
  {
    id: 'f3',
    no: '민사',
    name: '손해배상',
    desc: '사진이 퍼져 피해 학생이 입은 정신적 피해에 대해 위자료를 물어 줘야 할 수 있고, 보호자가 함께 책임을 질 수 있다.',
    level: 2,
  },
];

export const LEGAL_NOTE = '실제 처분은 사안의 정도, 나이, 법 개정에 따라 달라질 수 있어요. 이 이야기의 학교와 인물은 모두 가상이에요.';

/** 법적 책임 카드가 필요한 엔딩 (가해 학생이 밝혀진 엔딩 1, 사진을 전달한 엔딩 4) */
export function legalFor(ending: EndingId): { heading: string; cards: PenaltyCard[]; note: string } | null {
  if (ending === 'resolved') return { heading: '학교 조치와 별개로, 법적으로는 이런 책임을 질 수 있다', cards: LEGAL, note: LEGAL_NOTE };
  if (ending === 'participant') return { heading: '사진을 전달한 경우에도, 법적으로는 이런 책임을 질 수 있다', cards: LEGAL_FORWARD, note: LEGAL_NOTE };
  return null;
}
