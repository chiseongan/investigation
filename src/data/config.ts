// 게임 설정 — 교사가 바꿀 수 있는 값들

export const DAY_SECONDS = 300; // 하루 시간(초). 약 5분
export const TRUST_MIN = -3;
export const TRUST_MAX = 5;
export const STEP_MS = 170; // 한 칸 이동 시간(ms)

export const REAL_CLUE_TOTAL = 10;
export const TOTAL_CLUE_CARDS = 12; // 진짜 10 + 함정 2 (HUD 표시용)

// 최종 보고 판정 기준
export const EVIDENCE_NEEDED = 7; // 제출해야 하는 진짜 단서 수
export const TRUST_NEEDED = 2; // 지우의 (숨은) 신뢰 기준

// 근거를 확인하지 못한 통계는 verified:false 로 표시되어 있고, 기본적으로 화면에 보이지 않는다.
export const SHOW_UNVERIFIED_STATS = false;

// 구글폼 사전 입력. 폼 ID와 entry ID를 교체하세요. (formId 를 바꾸기 전에는 링크가 만들어지지 않고 결과 코드만 보여 준다)
export const GOOGLE_FORM = {
  formId: 'FORM_ID_HERE',
  entries: {
    code: 'entry.0000000001',
    ending: 'entry.0000000002',
    shared: 'entry.0000000003',
    trapPicked: 'entry.0000000004',
    clues: 'entry.0000000005',
  },
};
