// 등장인물 (모두 가상 인물)
export type CharId = 'me' | 'jiwoo' | 'minjun' | 'seoyeon' | 'doyun' | 'teacher' | 'daeun' | 'taeo';
export type TrustId = 'jiwoo' | 'minjun' | 'seoyeon' | 'doyun';

export const CHARACTERS: Record<CharId, { name: string; sprite: string }> = {
  me: { name: '나', sprite: 'me' },
  jiwoo: { name: '지우', sprite: 'jiwoo' },
  minjun: { name: '민준', sprite: 'minjun' },
  seoyeon: { name: '서연', sprite: 'seoyeon' },
  doyun: { name: '도윤', sprite: 'doyun' },
  teacher: { name: '담임', sprite: 'teacher' },
  daeun: { name: '다은', sprite: 'daeun' },
  taeo: { name: '태오', sprite: 'taeo' },
};

export const TRUST_IDS: TrustId[] = ['jiwoo', 'minjun', 'seoyeon', 'doyun'];

export function charByName(name: string): CharId | null {
  const hit = (Object.keys(CHARACTERS) as CharId[]).find((id) => CHARACTERS[id].name === name);
  return hit ?? null;
}
