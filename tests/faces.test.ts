import { describe, expect, it } from 'vitest';
import meta from '../src/assets/portraits/meta.json';
import { charByName } from '../src/data/characters';
import { parseTags } from '../src/lib/inkEngine';

const SOURCES = import.meta.glob('../src/story/*.ink', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const FACES = meta as Record<string, { faces: string[] }>;

describe('표정 태그', () => {
  it('대본의 모든 #표정 태그가 실제 그림 파일이 있는 표정을 가리킨다', () => {
    let count = 0;
    for (const [f, text] of Object.entries(SOURCES)) {
      text.split(/\r?\n/).forEach((line: string, i: number) => {
        for (const m of line.matchAll(/#표정:(?:([^=\s#]+)=)?(\w+)/g)) {
          const who = m[1] ?? line.match(/#말:(\S+)/)?.[1];
          const id = who ? charByName(who) : null;
          expect(id, `${f}:${i + 1} 대상`).toBeTruthy();
          expect(FACES[id!]?.faces, `${f}:${i + 1} ${id}`).toContain(m[2]);
          count++;
        }
      });
    }
    expect(count).toBeGreaterThan(100);
  });
  it('말하는 사람의 표정과 이름 지정 표정을 읽는다', () => {
    expect(parseTags(['말:지우', '표정:teary']).faces).toEqual({ jiwoo: 'teary' });
    expect(parseTags(['표정:서연=guilty']).faces).toEqual({ seoyeon: 'guilty' });
  });
});
