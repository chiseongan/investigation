import { describe, expect, it } from 'vitest';
import { SCENES } from '../src/data/rooms';
import type { CharId } from '../src/data/characters';
import { InkSession, parseTags } from '../src/lib/inkEngine';

const hooks = { hasClue: () => false, trust: () => 0 };
const DAY_OF = (sceneId: string) => sceneId.split('_')[0] as 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
// 월요일 장면 id 는 mon_ 으로 시작하고, 화~금도 같은 규칙이다.

/** knot 하나를 첫 번째 선택지만 골라 끝까지 재생하고, 등장·퇴장·말한 사람을 모은다. */
function play(day: string, knot: string) {
  const s = new InkSession(day, hooks);
  s.begin(knot);
  const out = { entered: [] as CharId[], left: [] as CharId[], speakers: new Set<CharId>() };
  for (let guard = 0; guard < 80; guard++) {
    const b = s.step();
    if (b.type === 'end') return out;
    if (b.type === 'choices') s.choose(b.choices[0].index);
    else {
      b.enter?.forEach((c) => out.entered.push(c));
      b.leave?.forEach((c) => out.left.push(c));
      if (b.speaker) out.speakers.add(b.speaker);
    }
  }
  throw new Error('끝나지 않는 knot: ' + knot);
}

describe('끼어들기(등장/퇴장) 태그', () => {
  it('등장·퇴장을 읽고, 알 수 없는 이름이나 나는 무시한다', () => {
    expect(parseTags(['말:민준', '등장:민준', '퇴장:태오'])).toMatchObject({ speaker: 'minjun', enter: ['minjun'], leave: ['taeo'] });
    expect(parseTags(['등장:나']).enter).toBeUndefined();
  });

  it('대본에 끼어들기가 여러 곳 있고, 퇴장하는 사람은 먼저 등장했거나 말한 사람이다', () => {
    let withGuest = 0;
    const seenScenes = new Set<string>();
    for (const sc of Object.values(SCENES)) {
      if (sc.kind === 'messenger') continue;
      const day = DAY_OF(sc.id);
      for (const it of sc.items.filter((i) => i.knot)) {
        if (seenScenes.has(it.knot!)) continue;
        seenScenes.add(it.knot!);
        const r = play(day, it.knot!);
        if (r.entered.length) withGuest++;
        for (const c of r.left) expect(r.entered.includes(c) || r.speakers.has(c), `${it.knot}: ${c}`).toBe(true);
        for (const c of r.entered) expect(c).not.toBe(it.char);
      }
    }
    expect(withGuest).toBeGreaterThanOrEqual(10);
  });
});
