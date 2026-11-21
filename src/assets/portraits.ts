// 대화형 화면에서 쓰는 인물 그림(배경 제거한 WebP, 상반신 위주). 표정마다 한 장씩.
// 탐색형은 manifest.ts 의 스프라이트를 그대로 쓴다. 이 폴더에 파일이 있는 인물만 그림을 쓰고, 없으면 임시 그림을 쓴다.
// 파일 이름은 `인물_표정.webp`, 인물마다 모든 표정이 같은 틀(같은 키, 몸 중심 맞춤)이라 표정만 바꿔 끼워도 자세가 흔들리지 않는다.
// meta.json 은 인물별 가로/세로 비율과 표정 목록이다.
import meta from './portraits/meta.json';

const files = import.meta.glob('./portraits/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export interface Portrait {
  /** 가로 / 세로. 그림 틀 비율 */
  ratio: number;
  faces: Record<string, string>;
}

export const PORTRAITS: Record<string, Portrait> = {};
for (const [key, m] of Object.entries(meta as Record<string, { ratio: number; faces: string[] }>)) {
  const faces: Record<string, string> = {};
  for (const f of m.faces) {
    const url = files[`./portraits/${key}_${f}.webp`];
    if (url) faces[f] = url;
  }
  if (faces.default) PORTRAITS[key] = { ratio: m.ratio, faces };
}

export type Face = string;

/** 인물 그림과 표정. 없는 표정은 기본 표정으로 대신한다. 인물 그림이 없으면 null. */
export function portrait(key: string, face: Face = 'default'): { src: string; ratio: number } | null {
  const p = PORTRAITS[key];
  return p ? { src: p.faces[face] ?? p.faces.default, ratio: p.ratio } : null;
}

// 첫 화면에서 기본 표정과 나의 표정은 미리 받아 둔다 (표정이 바뀔 때 깜빡이지 않도록). 나머지는 필요할 때 받는다.
if (typeof Image !== 'undefined') {
  for (const [key, p] of Object.entries(PORTRAITS)) {
    const list = key === 'me' ? Object.values(p.faces) : [p.faces.default];
    for (const src of list) new Image().src = src;
  }
}

/** 한 인물의 모든 표정을 미리 받아 둔다 (대화 도중 표정이 바뀔 때 깜빡이지 않도록) */
const warmed = new Set<string>();
export function warm(key: string) {
  const p = PORTRAITS[key];
  if (!p || warmed.has(key) || typeof Image === 'undefined') return;
  warmed.add(key);
  for (const src of Object.values(p.faces)) new Image().src = src;
}
