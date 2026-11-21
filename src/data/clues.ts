// 단서·함정 정의, 연결 규칙(추론). 문구는 교사가 자유롭게 수정할 수 있습니다.
export type ClueType = '징후' | '목격' | '디지털 증거' | '증언';

export interface Clue {
  id: string;
  type: ClueType;
  title: string;
  desc: string;
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
  trap?: boolean;
}

export const CLUES: Clue[] = [
  { id: 'C1', type: '징후', day: 'mon', title: '혼자 먹는 급식', desc: '점심시간, 지우는 급식실 구석에서 혼자 급식을 먹는다. 아무도 옆자리에 앉지 않는다.' },
  { id: 'C2', type: '징후', day: 'mon', title: '단톡방에 초대되지 않음', desc: '반 단톡방에 지우만 초대되지 않았다. "그냥 안 불렀어"라는 말을 들었다.' },
  { id: 'T1', type: '목격', day: 'mon', trap: true, title: '교실 뒤에서 벌어진 몸싸움', desc: '민준과 태오가 헤드락을 걸며 몸싸움을 하고 있었다. 둘 다 웃고 있었다.' },
  { id: 'C3', type: '목격', day: 'tue', title: '지우를 부르는 비하 별명', desc: '쉬는 시간, 몇몇 학생이 지우를 비하하는 별명으로 부르며 웃었다.' },
  { id: 'C4', type: '징후', day: 'tue', title: '낙서된 체육복', desc: '지우의 체육복에 지워지지 않는 낙서가 있다.' },
  { id: 'T2', type: '목격', day: 'tue', trap: true, title: '서로 놀리는 절친 대화', desc: '두 학생이 서로 별명을 부르며 놀리고 있다. 둘 다 웃으며 받아친다.' },
  { id: 'C5', type: '디지털 증거', day: 'wed', title: '사진 유포 캡처', desc: '단톡방에 지우의 사진이 올라온 화면을 캡처했다.' },
  { id: 'C6', type: '디지털 증거', day: 'wed', title: '사진을 공유한 계정 목록', desc: '사진을 다른 방으로 전달한 계정들의 목록을 확인했다.' },
  { id: 'C7', type: '증언', day: 'thu', title: '서연의 증언', desc: '서연이 털어놓았다. 민준이 지우를 따로 불러 놀리고, 단톡방에서 빼고, 사진도 먼저 올렸다고 한다. 말리고 싶었지만 무서웠다고 했다.' },
  { id: 'C8', type: '증언', day: 'thu', title: '도윤의 증언', desc: '도윤이 본 장면을 이야기했다. 민준이 웃으면서 지우의 체육복에 낙서하는 것을 봤지만, 표적이 될까 봐 지나쳤다고 한다.' },
  { id: 'C9', type: '증언', day: 'thu', title: '지우의 고백', desc: '지우가 처음으로 털어놓았다. 별명, 단톡방 배제, 체육복 낙서, 사진 유포가 이어졌고 민준이 시작했다고 한다.' },
  { id: 'C10', type: '증언', day: 'fri', title: '담임 선생님이 받은 익명 제보', desc: '담임 선생님께 이미 익명 제보가 접수되어 있었다.' },
];

export const clueById = (id: string): Clue | undefined => CLUES.find((c) => c.id === id);

// 수사 보드 추론 규칙 (2단계에서 사용, 초안)
export interface Inference { a: string; b: string; title: string; desc: string }
export const INFERENCES: Inference[] = [
  { a: 'C1', b: 'C2', title: '집단 따돌림', desc: '혼자 먹는 급식과 단톡방 배제는 의도적인 따돌림을 가리킨다.' },
  { a: 'C3', b: 'C4', title: '언어·물건 괴롭힘', desc: '별명 놀림과 낙서된 체육복은 반복되는 괴롭힘의 징후다.' },
  { a: 'C5', b: 'C6', title: '사이버폭력', desc: '사진이 단톡방을 통해 퍼졌고, 전달한 사람이 여럿이다.' },
  { a: 'C7', b: 'C8', title: '방관자의 침묵', desc: '알면서도 말하지 못한 친구들이 있었다.' },
];
INFERENCES.push(
  { a: 'C2', b: 'C5', title: '고립과 사이버폭력', desc: '단톡방에서 빠져 있던 지우의 사진이 그 방에서 돌았다. 배제와 조롱이 이어진다.' },
  { a: 'C9', b: 'C7', title: '피해자와 방관자의 증언 일치', desc: '지우와 서연의 말이 같은 사람과 같은 일을 가리킨다.' },
);
