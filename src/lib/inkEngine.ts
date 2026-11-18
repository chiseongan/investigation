// inkjs 실행과 태그 처리. 게임 상태는 직접 바꾸지 않고 "효과"만 돌려준다.
import { Story } from 'inkjs';
import { charByName, type CharId, type TrustId } from '../data/characters';
import mon from '../story/mon.ink';
import tue from '../story/tue.ink';
import wed from '../story/wed.ink';
import thu from '../story/thu.ink';

export type Effect =
  | { kind: 'trust'; who: TrustId; delta: number }
  | { kind: 'clue'; id: string; trap: boolean }
  | { kind: 'shared' }; // 수요일 공유 버튼 함정

export interface ChoiceView {
  index: number;
  text: string;
  effects: Effect[];
}

export type Beat =
  | { type: 'line'; speaker: CharId | null; text: string; effects: Effect[]; photo: boolean }
  | { type: 'choices'; choices: ChoiceView[] }
  | { type: 'end' };

const TRUST_WHO = new Set(['jiwoo', 'minjun', 'seoyeon', 'doyun']);

/** 태그 한 개를 해석한다. 말:이름 은 speaker 로, 나머지는 효과로. */
export function parseTags(tags: string[] | null | undefined): { speaker: CharId | null; effects: Effect[]; photo: boolean } {
  let speaker: CharId | null = null;
  let photo = false;
  const effects: Effect[] = [];
  for (const raw of tags ?? []) {
    const tag = raw.trim();
    let m: RegExpMatchArray | null;
    if (tag === '사진') {
      photo = true;
    } else if (tag === '공유') {
      effects.push({ kind: 'shared' });
    } else if ((m = tag.match(/^말:(.*)$/))) {
      speaker = charByName(m[1].trim());
    } else if ((m = tag.match(/^(단서|함정):(\w+)$/))) {
      effects.push({ kind: 'clue', id: m[2], trap: m[1] === '함정' });
    } else if ((m = tag.match(/^신뢰:(.+?)([+-]\d+)$/))) {
      const id = charByName(m[1].trim());
      if (id && TRUST_WHO.has(id)) effects.push({ kind: 'trust', who: id as TrustId, delta: parseInt(m[2], 10) });
      else console.warn('[ink] 알 수 없는 신뢰 대상:', tag);
    } else if (tag) {
      console.warn('[ink] 알 수 없는 태그:', tag);
    }
  }
  return { speaker, effects, photo };
}

const STORIES: Record<string, string> = { mon, tue, wed, thu };

export interface InkHooks {
  hasClue: (id: string) => boolean;
  trust: (who: string) => number;
}

export class InkSession {
  private story: Story;

  constructor(day: string, hooks: InkHooks) {
    const json = STORIES[day];
    if (!json) throw new Error(`대본이 없습니다: ${day}`);
    this.story = new Story(json);
    this.story.BindExternalFunction('has_clue', (id: string) => hooks.hasClue(id), true);
    this.story.BindExternalFunction('trust', (who: string) => hooks.trust(who), true);
  }

  /** knot 에서 시작 */
  begin(knot: string) {
    this.story.ChoosePathString(knot);
  }

  /** 다음 비트 하나 */
  step(): Beat {
    if (this.story.canContinue) {
      const text = (this.story.Continue() ?? '').trim();
      const { speaker, effects, photo } = parseTags(this.story.currentTags);
      if (!text) return this.step();
      return { type: 'line', speaker, text, effects, photo };
    }
    if (this.story.currentChoices.length) {
      return {
        type: 'choices',
        choices: this.story.currentChoices.map((c) => ({
          index: c.index,
          text: c.text,
          effects: parseTags(c.tags).effects,
        })),
      };
    }
    return { type: 'end' };
  }

  choose(index: number) {
    this.story.ChooseChoiceIndex(index);
  }
}
