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
import { LEGAL, LEGAL_FORWARD, LEGAL_NOTE } from './penalties';

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
      /** 조치·책임 목록. 항목이 하나씩 나타난다 */
      kind: 'ledger';
      title: string;
      items: { no: string; name: string; text: string; level: 1 | 2 | 3 }[];
      note?: string;
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

/** 엔딩 1: 함께 웃고, 퍼뜨리고, 지켜본 친구들(태오·다은과 주변 아이들)의 책임과 반성 */
const BYSTANDERS: Shot[] = [
  { kind: 'card', text: '함께 웃던 친구들은\n어떻게 됐을까?', hold: 4200 },
  {
    kind: 'scene', bg: 'classroom', t: 0.7, me: null, place: '교실 · 사안 조사 이후',
    right: [{ who: 'daeun', face: 'awkward' }, { who: 'taeo', face: 'worried' }],
    lines: [
      L(null, '조사는 민준에게서 끝나지 않을 수 있다. 사진을 전달하고, 함께 놀리고, 웃어 준 아이들도 확인 대상이 된다.'),
      L('daeun', '나는 먼저 올린 것도 아닌데… 그냥 다른 방에 보낸 것뿐이야.', 'awkward'),
      L('taeo', '난 웃기만 했어. 다들 웃길래….', 'worried'),
      L(null, '하지만 퍼뜨린 손과 따라 웃은 소리는, 지우에게 "아무도 내 편이 아니다"라는 말이 되었을 수 있다.'),
    ],
  },
  {
    kind: 'ledger',
    title: '함께한 친구들이 질 수 있는 책임',
    items: [
      { no: '전달', name: '사진을 퍼뜨린 경우', text: '학교폭력 조치를 받을 수 있고, 나이와 사안에 따라 보호처분·형사처벌·손해배상 책임까지 이어질 수 있다.', level: 3 },
      { no: '동조', name: '함께 놀리고 부추긴 경우', text: '가담한 것으로 보아 서면 사과, 접촉 금지, 특별교육 같은 조치를 사안의 정도에 따라 받을 수 있다.', level: 2 },
      { no: '방관', name: '보고도 지켜만 본 경우', text: '지켜본 것만으로 처벌받는 것은 보통 아니다. 하지만 침묵은 괴롭힘이 이어지게 하는 힘이 될 수 있어, 돌아보고 배우는 시간이 필요하다.', level: 1 },
    ],
    note: LEGAL_NOTE,
  },
  {
    kind: 'scene', bg: 'counseling', t: 0.75, me: null, place: '상담실 · 특별교육 시간',
    right: [{ who: 'teacher', face: 'serious' }, { who: 'daeun', face: 'apathetic' }, { who: 'taeo', face: 'wary' }],
    lines: [
      L('teacher', '그때 지우 자리에 있었다면, 그 웃음소리가 어떻게 들렸을까요?', 'serious'),
      L('daeun', '……나만 보낸 게 아니라고 생각했어요. 그런데 내가 보낸 한 번 때문에 더 많은 사람이 봤어요.', 'apathetic'),
      L('taeo', '장난인 줄 알았는데… 지우는 한 번도 같이 웃은 적이 없었어요.', 'worried'),
      L('teacher', '잘못을 알았다면, 다음에 할 수 있는 행동을 생각해 봐요.', 'encourage'),
    ],
  },
  {
    kind: 'scene', bg: 'hallway', t: 0.5, me: null, place: '복도 · 몇 주 뒤',
    right: [{ who: 'jiwoo', face: 'guarded' }, { who: 'daeun', face: 'apathetic' }, { who: 'taeo', face: 'worried' }],
    lines: [
      L('daeun', '지우야, 미안해. 사진 보낸 거… 지워 달라고 다 연락했어.', 'apathetic'),
      L('taeo', '웃어서 미안해. 이제 그런 말 나오면 하지 말라고 할게.', 'worried'),
      L('jiwoo', '……바로 괜찮다고는 못 하겠어.', 'guarded'),
      L(null, '사과했다고 바로 용서받는 것은 아니다. 받아 줄지는 지우가 정한다. 달라진 행동을 이어 가는 것이 반성이다.'),
    ],
  },
];

/** 엔딩 4: 사진을 전달한 아이들의 반성 */
const FORWARDERS_REFLECT: Shot = {
  kind: 'scene', bg: 'counseling', t: 0.7, me: null, place: '상담실 · 특별교육 시간',
  right: [{ who: 'teacher', face: 'serious' }, { who: 'daeun', face: 'apathetic' }, { who: 'taeo', face: 'wary' }],
  lines: [
    L('teacher', '처음 올린 사람이 아니어도, 보내고 따라 웃은 일은 각자의 선택이에요.', 'serious'),
    L('daeun', '……다들 하니까 괜찮은 줄 알았어요. 받는 사람이 늘어나는 건 생각 못 했어요.', 'apathetic'),
    L('taeo', '웃긴다고 댓글 단 것도… 부추긴 거였네요.', 'worried'),
    L(null, '반성은 "몰랐다"에서 멈추지 않고, 지우고, 사과하고, 다음에는 멈춰 세우는 행동으로 이어져야 한다.'),
  ],
};

/** 엔딩 1: 지우의 회복 → '그렇다면 민준이는?' → 민준의 이후 → 함께 웃던 친구들 */
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
    kind: 'ledger',
    title: '학교 안의 조치와 법적 책임',
    items: [
      { no: '학교', name: '학교폭력 조치', text: '서면 사과, 접촉 금지, 봉사, 특별교육, 출석정지, 학급교체, 전학 등을 사안의 정도에 따라 받을 수 있다.', level: 2 },
      ...LEGAL.map((c) => ({ no: c.no, name: c.name, text: c.desc, level: c.level })),
    ],
    note: LEGAL_NOTE,
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
  ...BYSTANDERS,
  {
    kind: 'card',
    text: '장난이라고 생각한 행동도\n누군가에게는 오래 남는 상처가 됩니다.\n따라 웃거나 퍼뜨리지 않고\n어른에게 알리는 사람이 괴롭힘을 멈춥니다.',
    sub: '이야기 속 학교와 인물은 모두 가상입니다. 실제 조치와 기록 기준은 바뀔 수 있습니다.',
    hold: 6000,
  },
];

/** 엔딩 2·3·4 맨 앞 컷: 기존 회복 장면(마지막에 건넬 말을 고른다) */
function recoveryShot(ending: Exclude<EndingId, 'resolved'>, right: FilmFigure[], bg: string, fill: (s: string) => string): Shot {
  const rec = RECOVERY[ending];
  const conv = (b: { speaker: CharId | null; text: string }): FilmLine => L(b.speaker, fill(b.text));
  return {
    kind: 'scene', bg, t: 0.8, me: 'concerned', right,
    lines: rec.beats.map(conv),
    choices: rec.choices.map((c) => ({ text: fill(c.text), reply: c.reply.map(conv) })),
  };
}

const same = (s: string) => s;

/** 엔딩 2: 늦어진 도움 — 근거가 모자라 조치가 미뤄진 뒤 */
function insufficient(): Shot[] {
  return [
    recoveryShot('insufficient', [{ who: 'jiwoo', face: 'sad' }], 'hallway', same),
    { kind: 'card', text: '한 달 뒤', hold: 1800 },
    {
      kind: 'scene', bg: 'cafeteria', t: 0.5, me: 'concerned', place: '급식실 · 한 달 뒤',
      right: [{ who: 'jiwoo', face: 'headdown' }, { who: 'minjun', face: 'bright' }],
      lines: [
        L(null, '조치가 미뤄진 사이, 달라진 것은 없다. 지우는 다시 구석 자리에서 혼자 먹는다.'),
        L(null, '뒤쪽에서 민준 무리의 웃음소리가 가장 크게 들린다. 아무도 이상하다고 말하지 않는다.'),
        L('me', '……내가 더 확인했어야 했는데.', 'concerned'),
      ],
    },
    {
      kind: 'scene', bg: 'classroom', t: 0.6, me: null, place: '교실 · 얼마 뒤',
      right: [{ who: 'seoyeon', face: 'anxious' }, { who: 'doyun', face: 'gloomy' }],
      lines: [
        L(null, '서연은 말하려다 입을 다물고, 도윤은 눈을 피한다.'),
        L(null, '"혼자 말해 봤자 달라지지 않는다"는 생각은, 지켜보는 사람들을 더 조용하게 만들 수 있다.'),
      ],
    },
    { kind: 'card', text: '1년 뒤', hold: 1800 },
    {
      kind: 'scene', bg: 'hallway', t: 0.9, me: null, place: '복도 · 1년 뒤', faded: true,
      right: [{ who: 'jiwoo', face: 'tired' }],
      lines: [
        L(null, '혼자 버티는 시간이 길어질수록, 학교에 가는 일은 점점 힘들어질 수 있다.'),
        L(null, '한 번 쌓인 "아무도 도와주지 않는다"는 마음은 쉽게 풀리지 않는다.'),
        L('jiwoo', '……그때 누군가 믿어 줬다면 달랐을까.', 'tired'),
      ],
    },
    {
      kind: 'scene', bg: 'counseling', t: 0.7, me: 'determined', place: '상담실',
      right: [{ who: 'teacher', face: 'worried' }],
      lines: [
        L('teacher', '근거가 모자랐어요. 하지만 늦게라도 사실을 다시 확인하면, 도움은 시작될 수 있어요.', 'worried'),
        L('me', '네. 놓친 단서와 사람을 다시 확인하겠습니다.', 'determined'),
        L('teacher', '혼자 판단하지 말고, 어른과 함께요.', 'encourage'),
      ],
    },
    {
      kind: 'card',
      text: '증거를 모으고,\n믿을 수 있는 어른에게 말하는 일은\n빠를수록 좋습니다.',
      sub: '다시 한 번 시간을 거슬러 갈 수 있습니다. 이야기 속 학교와 인물은 모두 가상입니다.',
      hold: 5000,
    },
  ];
}

/** 엔딩 3: 엉뚱한 지목 — 사건을 처음 시작한 학생이 아닌 사람을 지목한 뒤 */
function misidentified(picked: CharId, name: string): Shot[] {
  const fill = (s: string) => s.replaceAll('{이름}', name);
  const faces: Record<string, { sad: string; calm: string }> = {
    taeo: { sad: 'worried', calm: 'wary' },
    seoyeon: { sad: 'guilty', calm: 'anxious' },
    doyun: { sad: 'gloomy', calm: 'avoid' },
    daeun: { sad: 'apathetic', calm: 'awkward' },
  };
  const pf = faces[picked] ?? { sad: 'default', calm: 'default' };
  return [
    recoveryShot('misidentified', [{ who: picked, face: pf.sad }], 'hallway', fill),
    { kind: 'card', text: '소문', hold: 1800 },
    {
      kind: 'scene', bg: 'classroom', t: 0.55, me: 'concerned', place: '교실 · 다음 날', tag: '근거 없는 지목', tagFrom: 0,
      right: [{ who: picked, face: pf.sad }],
      lines: [
        L(null, fill('근거 없이 지목된 {이름}에 대한 이야기는 순식간에 번질 수 있다.')),
        L(null, '소문은 사실을 확인하기 전에 먼저 도착하고, 한 번 퍼지면 거두기 어렵다.'),
        L(picked, '……나는 아무것도 안 했는데.', pf.sad),
      ],
    },
    {
      kind: 'scene', bg: 'cafeteria', t: 0.5, me: null, place: '급식실 · 같은 시각',
      right: [{ who: 'jiwoo', face: 'cowering' }, { who: 'minjun', face: 'teasing' }],
      lines: [
        L(null, '그 사이, 진짜 이유는 가려진 채로 남아 있다.'),
        L(null, '지우에 대한 괴롭힘은 계속될 수 있고, 지우는 "아무도 사실을 보지 않는다"고 느낄 수 있다.'),
      ],
    },
    { kind: 'card', text: '시간이 흐른 뒤', hold: 1800 },
    {
      kind: 'scene', bg: 'hallway', t: 0.85, me: 'concerned', place: '복도 · 시간이 흐른 뒤',
      right: [{ who: picked, face: pf.calm }],
      lines: [
        L(null, fill('해명이 되었더라도, {이름}이(가) 신뢰를 되찾는 데에는 시간이 걸릴 수 있다.')),
        L(picked, '……이미 소문이 퍼진 뒤였어.', pf.sad),
        L('me', '내가 확인도 하기 전에 짚었어. 사실을 보고 말했어야 했어.', 'concerned'),
      ],
    },
    {
      kind: 'scene', bg: 'counseling', t: 0.7, me: 'determined', place: '상담실',
      right: [{ who: 'teacher', face: 'serious' }],
      lines: [
        L('teacher', '누군가를 가리키려면 눈으로 본 것과 확인된 증거가 있어야 해요.', 'serious'),
        L('teacher', '느낌이나 소문만으로 사람을 지목하면, 또 다른 피해가 생길 수 있어요.', 'worried'),
        L('me', '네. 이번엔 확인된 사실만 가지고 다시 살펴보겠습니다.', 'determined'),
      ],
    },
    {
      kind: 'card',
      text: '확인되지 않은 사실로\n사람을 가리키면,\n또 다른 피해자가 생길 수 있습니다.',
      sub: '다시 한 번 시간을 거슬러 갈 수 있습니다. 이야기 속 학교와 인물은 모두 가상입니다.',
      hold: 5000,
    },
  ];
}

/** 엔딩 4: 전달한 손 — 수사관이 사진을 공유한 뒤 */
function participant(): Shot[] {
  return [
    recoveryShot('participant', [{ who: 'jiwoo', face: 'guarded' }], 'classroom', same),
    { kind: 'card', text: '그날 이후', hold: 1800 },
    {
      kind: 'scene', bg: 'classroom', t: 0.6, me: 'flustered', place: '교실 · 그날 이후',
      right: [{ who: 'jiwoo', face: 'teary' }],
      lines: [
        L(null, '사진은 이미 여러 대화방으로 퍼진 뒤였다. 지워도, 어딘가에 남아 있을 수 있다.'),
        L(null, '"보기만 했다"고 해도, 전달했다면 그 일의 일부가 될 수 있다.'),
        L('jiwoo', '……누가 또 봤을까 생각하면, 학교에 오는 게 무서워.', 'teary'),
      ],
    },
    {
      kind: 'scene', bg: 'hallway', t: 0.65, me: null, place: '복도 · 며칠 뒤',
      right: [{ who: 'daeun', face: 'awkward' }, { who: 'taeo', face: 'worried' }],
      lines: [
        L(null, '사진을 전달한 아이들도 불안해지기 시작한다. 한 번의 클릭은 기록으로 남을 수 있다.'),
        L('daeun', '그냥… 다들 보내니까 나도 보낸 건데.', 'awkward'),
        L('taeo', '이거… 우리도 조사받는 거 아냐?', 'worried'),
      ],
    },
    {
      kind: 'ledger',
      title: '사진을 전달한 사람도 질 수 있는 책임',
      items: [
        { no: '학교', name: '학교폭력 조치', text: '서면 사과, 접촉 금지, 특별교육, 봉사 등 학교의 조치를 사안의 정도에 따라 받을 수 있다.', level: 2 },
        ...LEGAL_FORWARD.map((c) => ({ no: c.no, name: c.name, text: c.desc, level: c.level })),
      ],
      note: LEGAL_NOTE,
    },
    FORWARDERS_REFLECT,
    { kind: 'card', text: '1년 뒤', hold: 1800 },
    {
      kind: 'scene', bg: 'hallway', t: 0.9, me: null, place: '복도 · 1년 뒤', faded: true,
      right: [{ who: 'jiwoo', face: 'tired' }],
      lines: [
        L(null, '사진이 다시 나타날까 하는 불안은 오래갈 수 있다.'),
        L(null, '그래도 증거를 지켜 주고 도와준 사람을 기억하며, 천천히 회복해 나갈 수도 있다.'),
      ],
    },
    {
      kind: 'scene', bg: 'counseling', t: 0.7, me: 'determined', place: '상담실',
      right: [{ who: 'teacher', face: 'serious' }],
      lines: [
        L('teacher', '증거를 남기는 일과 퍼뜨리는 일은 전혀 달라요.', 'serious'),
        L('teacher', '이런 사진을 보게 되면 전달하지 말고, 화면을 캡처해 보관한 뒤 어른에게 알려요.', 'encourage'),
        L('me', '네. 이번에는 전달하지 않고, 증거를 지켜서 알리겠습니다.', 'determined'),
      ],
    },
    {
      kind: 'card',
      text: '사진을 보게 되면\n전달하지 않고, 캡처해서 보관한 뒤\n믿을 수 있는 어른에게 알립니다.',
      sub: '학교폭력 신고·상담 117 · 다시 한 번 시간을 거슬러 갈 수 있습니다. 이야기 속 학교와 인물은 모두 가상입니다.',
      hold: 6000,
    },
  ];
}

export function filmFor(ending: EndingId, picked: CharId, name: string): Shot[] {
  switch (ending) {
    case 'resolved':
      return RESOLVED;
    case 'insufficient':
      return insufficient();
    case 'misidentified':
      return misidentified(picked, name);
    case 'participant':
      return participant();
  }
}
