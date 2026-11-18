import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { judge, type Report } from '../src/data/endings';
import { buildCode, formUrl } from '../src/lib/result';
import { addClue, addTrust, game, initialState, markShared, newGame, nextDay, rewindTo, startDay, submitReport } from '../src/lib/gameState';

const REAL = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'];
const rep = (evidence: string[], picked: Report['picked'] = 'minjun'): Report => ({ evidence, picked });

describe('judge', () => {
  it('resolved: enough real clues, no traps, culprit picked, jiwoo trusts', () => {
    expect(judge(rep(REAL.slice(0, 7)), false, 2).ending).toBe('resolved');
  });
  it('insufficient: too few clues / traps mixed in / low trust', () => {
    expect(judge(rep(REAL.slice(0, 6)), false, 3).ending).toBe('insufficient');
    expect(judge(rep([...REAL.slice(0, 7), 'T1']), false, 3).ending).toBe('insufficient');
    expect(judge(rep(REAL.slice(0, 8)), false, 1).ending).toBe('insufficient');
  });
  it('misidentified wins over everything when the wrong student is picked', () => {
    expect(judge(rep(REAL, 'taeo'), true, 5).ending).toBe('misidentified');
  });
  it('participant when shared but culprit is right', () => {
    expect(judge(rep(REAL), true, 5).ending).toBe('participant');
  });
});

describe('result code', () => {
  it('has no personal data and a stable checksum', () => {
    const v = judge(rep(REAL.slice(0, 7)), false, 2);
    const code = buildCode({ ending: v.ending, verdict: v, shared: false, picked: 'minjun' });
    expect(code).toMatch(/^E1-C07-S0-T0-P0-[0-9A-Z]$/);
  });
  it('form link is hidden until a form id is configured', () => {
    const v = judge(rep(REAL), false, 2);
    expect(formUrl({ ending: v.ending, verdict: v, shared: false, picked: 'minjun' })).toBeNull();
  });
});

describe('rewind', () => {
  beforeEach(() => {
    game.set({ ...initialState(), phase: 'briefing' });
  });
  it('keeps clues gained before the chosen day and drops the rest', () => {
    startDay(); // 월
    addClue('C1');
    nextDay(); // 화
    addClue('C3');
    addTrust('jiwoo', 2);
    nextDay(); // 수
    addClue('C5');
    markShared();
    rewindTo(2); // 수요일 아침으로
    const g = get(game);
    expect(g.dayIndex).toBe(2);
    expect(g.clues).toEqual(['C1', 'C3']);
    expect(g.shared).toBe(false);
    expect(g.trust.jiwoo).toBe(2);
    expect(g.phase).toBe('slot');
  });
  it('submitReport stores the verdict and moves to ending', () => {
    newGame();
    startDay();
    submitReport(rep(REAL.slice(0, 7)));
    expect(get(game).phase).toBe('ending');
    expect(get(game).verdict?.ending).toBeDefined();
  });
});
