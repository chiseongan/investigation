// 게임 설정 — 교사가 바꿀 수 있는 값들

export const DAY_SECONDS = 300; // 하루 시간(초). 약 5분
export const TRUST_MIN = -3;
export const TRUST_MAX = 5;
export const STEP_MS = 170; // 한 칸 이동 시간(ms)

export const REAL_CLUE_TOTAL = 10;
export const TOTAL_CLUE_CARDS = 12; // 진짜 10 + 함정 2 (HUD 표시용)

// 구글폼 사전 입력 (3단계에서 사용). 폼 ID와 entry ID를 교체하세요.
export const GOOGLE_FORM = {
  formId: 'FORM_ID_HERE',
  entries: {
    clues: 'entry.0000000001',
    ending: 'entry.0000000002',
    shared: 'entry.0000000003',
    trapPicked: 'entry.0000000004',
  },
};
