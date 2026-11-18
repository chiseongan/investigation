// 엔딩 판정과 문구. 교사가 자유롭게 고칠 수 있습니다. 모든 인물은 가상입니다.
// 문구는 "~할 수 있다"처럼 가능성으로 쓰고, 단정하지 않는다. {이름} 은 지목된 학생 이름으로 바뀝니다.
import type { CharId } from './characters';
import { CLUES } from './clues';
import { EVIDENCE_NEEDED, TRUST_NEEDED } from './config';

export type EndingId = 'resolved' | 'insufficient' | 'misidentified' | 'participant';

/** 최종 보고서: 제출한 단서와 지목한 학생 */
export interface Report {
  evidence: string[];
  picked: CharId;
}

export interface Verdict {
  ending: EndingId;
  real: number; // 제출한 진짜 단서 수
  traps: number; // 제출한 함정 단서 수
  reasons: string[];
}

/** 지목할 수 있는 학생 (정답은 민준) */
export const CANDIDATES: CharId[] = ['minjun', 'taeo', 'seoyeon', 'doyun', 'daeun'];
export const CULPRIT: CharId = 'minjun';

export function judge(report: Report, shared: boolean, jiwooTrust: number): Verdict {
  const isTrap = (id: string) => !!CLUES.find((c) => c.id === id)?.trap;
  const real = report.evidence.filter((id) => !isTrap(id)).length;
  const traps = report.evidence.filter(isTrap).length;
  const reasons: string[] = [];

  if (report.picked !== CULPRIT) {
    reasons.push('보고서가 사건을 처음 시작한 학생을 가리키지 못했다.');
    return { ending: 'misidentified', real, traps, reasons };
  }
  if (shared) {
    reasons.push('수사 중 사진 공유 버튼을 눌러, 수사관도 사진을 전달한 사람이 되었다.');
    return { ending: 'participant', real, traps, reasons };
  }
  if (real < EVIDENCE_NEEDED) reasons.push(`제출한 진짜 단서가 ${real}개로, 사실을 확인하기에 부족했다.`);
  if (traps > 0) reasons.push('장난이나 평범한 일상이 증거에 섞여 보고서의 신뢰가 흔들렸다.');
  if (jiwooTrust < TRUST_NEEDED) reasons.push('지우가 수사관을 믿고 이야기할 만큼 관계를 쌓지 못했다.');
  if (reasons.length) return { ending: 'insufficient', real, traps, reasons };
  return { ending: 'resolved', real, traps, reasons };
}

export interface EndingDef {
  no: number;
  title: string;
  tone: 'good' | 'mid' | 'bad';
  summary: string[];
}

export const ENDINGS: Record<EndingId, EndingDef> = {
  resolved: {
    no: 1,
    title: '멈춘 괴롭힘',
    tone: 'good',
    summary: [
      '보고서는 학교와 보호자에게 전달되었고, 지우를 보호하는 절차가 곧바로 시작되었다.',
      '혼자 견디던 지우는 어른과 친구들이 사실을 믿어 준 덕분에 조금씩 숨을 돌릴 수 있다.',
    ],
  },
  insufficient: {
    no: 2,
    title: '늦어진 도움',
    tone: 'mid',
    summary: [
      '보고서는 접수되었지만 근거가 부족해 조치가 미뤄졌다. 그동안 괴롭힘은 조용히 이어질 수 있다.',
      '다시 한 번 시간을 거슬러 가서, 놓친 단서와 사람을 확인할 수 있다.',
    ],
  },
  misidentified: {
    no: 3,
    title: '엉뚱한 지목',
    tone: 'bad',
    summary: [
      '{이름}이(가) 사건의 중심으로 지목되어 조사를 받게 되었다. 하지만 이 보고서가 가리킨 사람은 처음 시작한 학생이 아니다.',
      '진짜 이유를 놓친 사이, 지우에 대한 괴롭힘은 계속될 수 있다.',
    ],
  },
  participant: {
    no: 4,
    title: '전달한 손',
    tone: 'bad',
    summary: [
      '보고서는 올바른 사람을 가리켰지만, 수사관이 사진을 다른 방으로 전달한 기록도 함께 남았다.',
      '보기만 한 사람도, 전달한 사람도 사진이 퍼지는 데 힘을 보탠다. 증거를 남기는 일과 퍼뜨리는 일은 전혀 다르다.',
    ],
  },
};

export interface TimelineEntry { when: string; text: string }
export interface Timeline { track: string; entries: TimelineEntry[] }

const T = (when: string, text: string): TimelineEntry => ({ when, text });

/** 10년 후까지의 가능한 흐름. 사실이 아니라 가능성을 보여 주는 글이다. */
export const TIMELINES: Record<EndingId, Timeline[]> = {
  resolved: [
    { track: '지우', entries: [
      T('지금', '학교와 보호자가 사실을 확인하고 지우를 보호하는 조치를 시작할 수 있다.'),
      T('1년 후', '상담을 이어 가며 학교에 다시 마음을 붙이기 시작할 수 있다.'),
      T('3년 후', '친구 한두 명과 천천히 신뢰를 쌓을 수 있다.'),
      T('5년 후', '그때의 일을 말로 꺼낼 수 있게 될 수도 있다.'),
      T('10년 후', '도움을 요청해도 된다는 경험이 어른이 된 뒤의 관계에도 힘이 될 수 있다.'),
    ] },
    { track: '민준', entries: [
      T('지금', '사안 조사를 받고, 사안의 정도에 따라 조치를 받을 수 있다.'),
      T('1년 후', '사과와 교육을 받으며 자신의 행동이 어떤 영향을 주었는지 배울 수 있다.'),
      T('3년 후', '조치 기록이 남을 수 있어 진학과 진로에 영향을 줄 수 있다.'),
      T('5년 후', '달라진 모습을 보이면 관계를 다시 쌓을 수 있다.'),
      T('10년 후', '그때의 일을 책임으로 기억하며 살아갈 수 있다.'),
    ] },
    { track: '지켜보던 친구들', entries: [
      T('지금', '말하지 못한 것을 후회하지만, 이제 어른에게 말할 수 있게 될 수 있다.'),
      T('5년 후', '한 번 용기를 낸 경험이 다음 번에도 나서는 힘이 될 수 있다.'),
    ] },
  ],
  insufficient: [
    { track: '지우', entries: [
      T('지금', '보고가 받아들여지지 않아 괴롭힘이 이어질 수 있다.'),
      T('1년 후', '혼자 버티는 시간이 길어질 수 있다.'),
      T('3년 후', '학교에 가는 일이 점점 힘들어질 수 있다.'),
      T('5년 후', '늦게라도 도움을 받으면 회복이 시작될 수 있다.'),
      T('10년 후', '"그때 누군가 믿어 줬다면" 하는 마음이 오래 남을 수도 있다.'),
    ] },
    { track: '민준', entries: [
      T('지금', '아무도 멈추지 않으면 행동이 "장난"으로 굳어질 수 있다.'),
      T('3년 후', '더 큰 사안으로 이어져 그때 더 무거운 조치를 받을 수 있다.'),
      T('10년 후', '일찍 멈췄더라면 달라졌을지 모른다는 생각이 남을 수 있다.'),
    ] },
  ],
  misidentified: [
    { track: '{이름}', entries: [
      T('지금', '근거 없이 지목되어 조사와 의심을 겪을 수 있다.'),
      T('1년 후', '소문과 오해로 친구 관계가 흔들릴 수 있다.'),
      T('3년 후', '해명이 되었더라도 신뢰를 되찾는 데 시간이 걸릴 수 있다.'),
      T('10년 후', '억울했던 기억이 사람을 대하는 방식에 영향을 줄 수 있다.'),
    ] },
    { track: '지우', entries: [
      T('지금', '진짜 이유가 가려지지 않아 괴롭힘이 이어질 수 있다.'),
      T('3년 후', '"아무도 사실을 보지 않는다"는 생각이 굳어질 수 있다.'),
      T('10년 후', '늦게라도 사실이 바로잡히면 회복이 시작될 수 있다.'),
    ] },
  ],
  participant: [
    { track: '사진을 전달한 사람들', entries: [
      T('지금', '"보기만 했다"고 해도 전달했다면 사안의 일부로 조사받을 수 있다.'),
      T('1년 후', '디지털 기록은 지워도 남을 수 있어, 한 번의 클릭이 오래 따라올 수 있다.'),
      T('5년 후', '그때의 선택을 돌아보며 후회할 수 있다.'),
    ] },
    { track: '지우', entries: [
      T('지금', '사진이 더 많은 사람에게 퍼져 상처가 더 커질 수 있다.'),
      T('3년 후', '사진이 다시 나타날까 하는 불안이 오래갈 수 있다.'),
      T('10년 후', '증거를 지키고 도와준 사람을 기억하며 회복해 나갈 수 있다.'),
    ] },
  ],
};

export interface RecoveryBeat { speaker: CharId | null; text: string }
export interface Recovery {
  beats: RecoveryBeat[];
  /** 마지막에 지우(또는 지목된 학생)에게 건넬 말. 점수는 없다. */
  choices: { text: string; reply: RecoveryBeat[] }[];
}

/** 회복 장면: 결과가 어떻든 마지막에는 사람에게 말을 건다 */
export const RECOVERY: Record<EndingId, Recovery> = {
  resolved: {
    beats: [
      { speaker: null, text: '며칠 뒤, 상담실. 지우가 담임 선생님과 함께 앉아 있다.' },
      { speaker: 'teacher', text: '말해 줘서 고마웠어요. 앞으로는 혼자 견디지 않아도 돼요.' },
      { speaker: 'jiwoo', text: '……아직은 잘 모르겠지만, 말하길 잘한 것 같아요.' },
    ],
    choices: [
      { text: '천천히 해도 돼. 언제든 같이 있을게.', reply: [{ speaker: 'jiwoo', text: '……응. 고마워.' }] },
      { text: '무슨 일이든 어른에게 바로 말해 줘.', reply: [{ speaker: 'jiwoo', text: '……그럴게. 이번엔 그럴 수 있을 것 같아.' }] },
    ],
  },
  insufficient: {
    beats: [
      { speaker: null, text: '며칠 뒤, 복도. 지우가 창가에 혼자 서 있다.' },
      { speaker: 'jiwoo', text: '……보고서 어떻게 됐어?' },
      { speaker: null, text: '근거가 모자라 조치가 미뤄졌다는 말이 입에서 쉽게 나오지 않는다.' },
    ],
    choices: [
      { text: '아직 끝난 게 아니야. 더 확인해 볼게.', reply: [{ speaker: 'jiwoo', text: '……그래. 기다릴게.' }] },
      { text: '미안해. 더 빨리 알았어야 했어.', reply: [{ speaker: 'jiwoo', text: '……괜찮아. 와 줘서 고마워.' }] },
    ],
  },
  misidentified: {
    beats: [
      { speaker: null, text: '복도 끝에서 {이름}이(가) 혼자 서 있다. 조사를 받고 나온 얼굴이다.' },
      { speaker: null, text: '근거 없이 지목당한 일은 사람에게 오래 남을 수 있다.' },
    ],
    choices: [
      { text: '내가 잘못 짚었어. 정말 미안해.', reply: [{ speaker: null, text: '{이름}이(가) 한참 있다가 작게 고개를 끄덕인다.' }] },
      { text: '내가 직접 선생님께 바로잡아 말씀드릴게.', reply: [{ speaker: null, text: '{이름}의 어깨에서 조금 힘이 빠진다.' }] },
    ],
  },
  participant: {
    beats: [
      { speaker: null, text: '며칠 뒤, 교실. 사진이 돌았다는 사실을 지우도 알게 되었다.' },
      { speaker: 'jiwoo', text: '……그 사진, 너도 봤어?' },
    ],
    choices: [
      { text: '사실대로 말할게. 내가 전달했어. 정말 미안해.', reply: [{ speaker: 'jiwoo', text: '……말해 줘서 고마워. 그래도 쉽지는 않아.' }] },
      { text: '전달한 건 잘못이야. 지금 같이 삭제 요청하러 가자.', reply: [{ speaker: 'jiwoo', text: '……응. 같이 가 줄래?' }] },
    ],
  },
};
