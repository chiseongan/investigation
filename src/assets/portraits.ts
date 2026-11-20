// 대화형 화면에서 쓰는 인물 그림(배경 제거한 WebP). 표정마다 한 장씩.
// 탐색형은 manifest.ts 의 스프라이트를 그대로 쓴다. 인물 그림이 들어온 인물만 여기에 적는다.
// 파일은 모두 같은 틀(같은 높이, 몸 중심 맞춤)이라 표정만 바꿔 끼워도 자세가 흔들리지 않는다.
import meDefault from './portraits/me_default.webp';
import meSmile from './portraits/me_smile.webp';
import meSurprised from './portraits/me_surprised.webp';
import meThinking from './portraits/me_thinking.webp';

export type Face = 'default' | 'smile' | 'surprised' | 'thinking';

export interface Portrait {
  /** 가로 / 세로. 그림 틀 비율 */
  ratio: number;
  faces: Partial<Record<Face, string>> & { default: string };
}

export const PORTRAITS: Record<string, Portrait> = {
  // 나: 원본을 좌우 반전해서 오른쪽(상대 쪽)을 바라본다
  me: { ratio: 270 / 836, faces: { default: meDefault, smile: meSmile, surprised: meSurprised, thinking: meThinking } },
};

/** 인물 그림과 표정. 없는 표정은 기본 표정으로 대신한다. 인물 그림이 없으면 null. */
export function portrait(key: string, face: Face = 'default'): { src: string; ratio: number } | null {
  const p = PORTRAITS[key];
  return p ? { src: p.faces[face] ?? p.faces.default, ratio: p.ratio } : null;
}

// 표정이 바뀔 때 그림이 깜빡이지 않도록 미리 받아 둔다 (작은 파일 몇 장)
if (typeof Image !== 'undefined') {
  for (const p of Object.values(PORTRAITS)) for (const src of Object.values(p.faces)) new Image().src = src;
}
