// 엔딩 영상(애니메이션 장면) 대본. 배경·인물·표정·자막을 순서대로 보여 주는 '컷'의 목록입니다.
//
// !!! 수업 전 최신 기준 확인 !!!
// 민준의 이후 장면에는 학교폭력 조치와 기록이 진학·사회생활에 미칠 수 있는 영향이 나옵니다.
// 조치의 종류, 학교생활기록부 기재와 보존 기간, 대입·취업에서의 반영 방식은 해마다 바뀝니다.
// 수업에 쓰기 전에 penalties.ts 의 안내와 함께 최신 기준과 맞춰 보세요.
// 문구 원칙: 단정하지 않고 "~할 수 있다"로 쓴다. 폭력 장면은 그리지 않는다.
import type { CharId } from './characters';
import type { EndingId } from './endings';
import { RECOVERY } from './endings';

export interface FilmLine {
  who: CharId | null;
  text: string;
  /** 말하는 사람(또는 who 로 지정한 인물)의 표정을 이 줄부터 바꾼다 */
  face?: string;
}

export interface FilmChoice {
  text: string;
  reply: FilmLine[];
}

export interface FilmFigure {
  who: CharId;
  face: string;
}

export type Shot =
  | {
      kind: 'card';
      /** 큰 글씨 (줄바꿈은 \n) */
      text: string;
      sub?: string;
      /** 화면에 머무는 시간(ms). 눌러서 넘길 수도 있다 */
      hold?: number;
    }
  | {
      kind: 'scene';
      /** 배경(VNBackground 의 장소 이름)과 하루 중 시각(0 아침 ~ 1 저녁) */
      bg: string;
      t: number;
      /** 왼쪽의 나. 표정, 없으면 나오지 않는다 */
      me?: string | null;
      /** 오른쪽 인물들. 첫 번째가 맨 오른쪽 앞, 다음 인물은 그 왼쪽 뒤에 반쯤 가려져 선다 */
      right: FilmFigure[];
      /** 왼쪽 위 장소·시간 표시 */
      place?: string;
      /** 오른쪽 맨 앞 인물에 붙는 딱지(가해 기록 등). tagFrom 번째 줄부터 찍힌다 */
      tag?: string;
      tagFrom?: number;
      /** 오래 지난 느낌으로 색을 빼기 */
      faded?: boolean;
      lines: FilmLine[];
      choices?: FilmChoice[];
    };

const L = (who: CharId | null, text: string, face?: string): FilmLine => ({ who, text, ...(face ? { face } : {}) });

/** 엔딩 1: 지우의 회복 → '그렇다면 민준이는?' → 민준의 이후 */
const RESOLVED: Shot[] = [
  {
    kind: 'scene', bg: 'counseling', t: 0.55, me: 'warm', place: '상담실 · 며칠 뒤',
    right: [{ who: 'jiwoo', face: 'blank' }, { who: 'teacher', face: 'warm' }],
    lines: [
      L(null, '며칠 뒤, 상담실. 지우가 담임 선생님과 함께 앉아 있다.'),
      L('teacher', '말해 줘서 고마웠어요. 앞으로는 혼자 견디지 않아도 돼요.', 'warm'),
      L('jiwoo', '……아직은 잘 모르겠지만, 말하길 잘한 것 같아요.', 'faint'),
    ],
    choices: [
      { text: '천천히 해도 돼. 언제든 같이 있을게.', reply: [L('jiwoo', '……응. 고마워.', 'smile')] },
      { text: '무슨 일이든 어른에게 바로 말해 줘.', reply: [L('jiwoo', '……그럴게. 이번엔 그럴 수 있을 것 같아.', 'faint')] },
    ],
  },
  { kind: 'card', text: '몇 달 뒤', hold: 1800 },
  {
    kind: 'scene', bg: 'cafeteria', t: 0.45, me: 'warm', place: '급식실 · 몇 달 뒤',
    right: [{ who: 'jiwoo', face: 'smile' }, { who: 'seoyeon', face: 'shy' }, { who: 'doyun', face: 'cautious' }],
    lines: [
      L(null, '급식실. 구석 자리였던 지우의 식판 옆에 서연이 앉아 있다. 도윤도 조심스럽게 맞은편에 앉는다.'),
      L('seoyeon', '……오늘 국은 안 짜더라.', 'shy'),
      L('jiwoo', '……진짜? 그럼 먹어 볼게.', 'smile'),
      L('doyun', '다음에도 같이 먹자.', 'grateful'),
      L(null, '혼자 먹던 자리에, 이제는 이야기 소리가 있다.'),
    ],
  },
  { kind: 'card', text: '1년 뒤', hold: 1800 },
  {
    kind: 'scene', bg: 'playground', t: 0.35, me: 'warm', place: '운동장 · 1년 뒤',
    right: [{ who: 'jiwoo', face: 'smile' }],
    lines: [
      L(null, '지우는 천천히 학교에 마음을 붙여 갔다. 도움을 요청해도 된다는 것을 알게 된 뒤로.'),
      L('jiwoo', '그때 말하길 잘한 것 같아.', 'smile'),
      L('jiwoo', '……고마워. 믿어 줘서.', 'smile'),
    ],
  },
  { kind: 'card', text: '그렇다면\n민준이는 어떻게 됐을까?', hold: 4200 },
  {
    kind: 'scene', bg: 'counseling', t: 0.85, me: null, place: '사안 조사 이후', tag: '학교폭력 가해', tagFrom: 2,
    right: [{ who: 'minjun', face: 'cold' }],
    lines: [
      L(null, '사안 조사와 심의를 거쳐, 민준은 사안의 정도에 따라 조치를 받을 수 있다.'),
      L('minjun', '장난이었어요… 그렇게까지 될 줄 몰랐어요.', 'dejected'),
      L(null, '하지만 장난이라는 말은, 지우가 받은 상처를 지워 주지 못한다.'),
      L(null, '조치 기록이 남고, 민준에게는 이제 "학교폭력 가해" 꼬리표가 따라붙을 수 있다.'),
    ],
  },
  {
    kind: 'scene', bg: 'hallway', t: 0.9, me: null, place: '복도 · 얼마 뒤', tag: '학교폭력 가해', tagFrom: 0,
    right: [{ who: 'minjun', face: 'alone' }],
    lines: [
      L(null, '웃으며 둘러싸던 친구들이 하나둘 거리를 둘 수 있다.'),
      L('minjun', '……전엔 복도가 이렇게 길지 않았는데.', 'alone'),
      L(null, '사람들은 가해 기록이 있는 사람을 쉽게 믿어 주지 않을 수 있다.'),
    ],
  },
  {
    kind: 'scene', bg: 'gate', t: 0.95, me: null, place: '교문 앞 · 졸업 즈음', tag: '학교폭력 가해', tagFrom: 0,
    right: [{ who: 'minjun', face: 'dejected' }],
    lines: [
      L(null, '진학과 진로를 정할 때마다, 조치 기록이 발목을 잡을 수 있다.'),
      L(null, '원하던 길이 닫히고, 다른 길을 찾아야 할 수도 있다.'),
    ],
  },
  { kind: 'card', text: '10년 뒤', hold: 2000 },
  {
    kind: 'scene', bg: 'gate', t: 1, me: null, place: '10년 뒤', faded: true, tag: '학교폭력 가해', tagFrom: 0,
    right: [{ who: 'minjun', face: 'forced' }],
    lines: [
      L(null, '면접 자리에서 과거의 일이 알려지면, 사람들은 쉽게 믿어 주지 않을 수 있다.'),
      L(null, '자리를 잡는 데 오래 걸리고, 사과할 기회조차 찾기 어려울 수 있다.'),
      L('minjun', '그때 웃고 넘긴 일이… 한 사람의 삶을 바꿨고, 내 삶도 바꿨어.', 'dejected'),
    ],
  },
  {
    kind: 'card',
    text: '장난이라고 생각한 행동도\n누군가에게는 오래 남는 상처가 되고,\n하는 사람의 삶에도 기록으로 남을 수 있습니다.',
    sub: '이야기 속 학교와 인물은 모두 가상입니다. 실제 조치와 기록 기준은 바뀔 수 있습니다.',
    hold: 6000,
  },
];

/** 엔딩 2·3·4: 기존 회복 장면을 같은 방식의 컷으로 */
function fromRecovery(ending: Exclude<EndingId, 'resolved'>, picked: CharId, name: string): Shot[] {
  const rec = RECOVERY[ending];
  const fill = (s: string) => s.replaceAll('{이름}', name);
  const conv = (b: { speaker: CharId | null; text: string }, face?: string): FilmLine => L(b.speaker, fill(b.text), face);
  const pickedFace: Record<string, string> = { taeo: 'worried', seoyeon: 'guilty', doyun: 'gloomy', daeun: 'apathetic', minjun: 'dejected' };
  const right: FilmFigure[] =
    ending === 'misidentified' ? [{ who: picked, face: pickedFace[picked] ?? 'default' }] : [{ who: 'jiwoo', face: ending === 'insufficient' ? 'sad' : 'headdown' }];
  const bg = ending === 'participant' ? 'classroom' : 'hallway';
  return [
    {
      kind: 'scene', bg, t: 0.8, me: 'concerned', right,
      lines: rec.beats.map((b) => conv(b)),
      choices: rec.choices.map((c) => ({ text: fill(c.text), reply: c.reply.map((b) => conv(b)) })),
    },
  ];
}

export function filmFor(ending: EndingId, picked: CharId, name: string): Shot[] {
  return ending === 'resolved' ? RESOLVED : fromRecovery(ending, picked, name);
}
