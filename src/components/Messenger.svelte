<script lang="ts">
  // 방과 후 단톡방: 쿼터뷰가 아니라 휴대폰 메신저 화면. 같은 ink 대본을 읽고, 메시지는 한꺼번에 추가한 뒤
  // CSS 애니메이션 지연(opacity/transform)으로 차례로 나타나게 한다. (타이머 루프 없음)
  import { onMount } from 'svelte';
  import { CHARACTERS, type CharId } from '../data/characters';
  import { clueById } from '../data/clues';
  import type { Effect, InkSession, ChoiceView } from '../lib/inkEngine';
  import { sessionFor } from '../lib/session';
  import { addClue, addTrust, markSeen, markShared } from '../lib/gameState';

  let {
    sceneId,
    knot,
    dayId,
    onExit,
    onBusy,
  }: { sceneId: string; knot: string; dayId: string; onExit: () => void; onBusy: (busy: boolean) => void } = $props();

  type Msg =
    | { id: number; kind: 'msg'; from: CharId | null; text: string; photo: boolean; delay: number }
    | { id: number; kind: 'banner'; tone: 'clue' | 'warn'; text: string; delay: number };

  let feed: Msg[] = $state([]);
  let choices: ChoiceView[] | null = $state(null);
  let ended = $state(false);
  let choiceDelay = $state(0);
  let scroller: HTMLDivElement | undefined = $state();
  let uid = 0;

  let session: InkSession;
  const STEP = 0.55; // 메시지 사이 지연(초)

  function banner(tone: 'clue' | 'warn', text: string, delay: number) {
    feed.push({ id: uid++, kind: 'banner', tone, text, delay });
  }

  function apply(effects: Effect[], delay: number) {
    for (const e of effects) {
      if (e.kind === 'trust') addTrust(e.who, e.delta);
      else if (e.kind === 'shared') {
        markShared(); // 결과는 금요일 이후에만 드러난다
      } else if (addClue(e.id)) {
        banner('clue', `수사 수첩에 기록됨 · ${clueById(e.id)?.title ?? e.id}`, delay);
      }
    }
  }

  function pump() {
    choices = null;
    let n = 0;
    for (let guard = 0; guard < 60; guard++) {
      const beat = session.step();
      if (beat.type === 'line') {
        const delay = n++ * STEP;
        feed.push({ id: uid++, kind: 'msg', from: beat.speaker, text: beat.text, photo: beat.photo, delay });
        apply(beat.effects, delay + 0.2);
      } else if (beat.type === 'choices') {
        choiceDelay = n * STEP;
        choices = beat.choices;
        return;
      } else {
        choiceDelay = n * STEP;
        ended = true;
        markSeen(`${sceneId}:chat`);
        return;
      }
    }
  }

  function choose(c: ChoiceView) {
    // 내가 한 행동을 대화창에 남긴다
    feed.push({ id: uid++, kind: 'msg', from: 'me', text: c.text, photo: false, delay: 0 });
    apply(c.effects, 0.3);
    session.choose(c.index);
    pump();
  }

  onMount(() => {
    onBusy(true);
    session = sessionFor(dayId);
    session.begin(knot);
    pump();
  });

  // 새 메시지가 생기면 맨 아래로
  $effect(() => {
    feed.length;
    choices;
    ended;
    queueMicrotask(() => scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' }));
  });

  const isClue = (c: ChoiceView) => c.effects.some((e) => e.kind === 'clue');
  const nameOf = (id: CharId | null) => (id ? CHARACTERS[id].name : '');
</script>

<div class="phone">
  <header>
    <strong>2-2 우리반</strong>
    <span>27명</span>
  </header>

  <div class="feed" bind:this={scroller}>
    {#each feed as m (m.id)}
      {#if m.kind === 'banner'}
        <div class="banner {m.tone}" style="animation-delay:{m.delay}s">{m.text}</div>
      {:else if m.from === null}
        <div class="sys" style="animation-delay:{m.delay}s">{m.text}</div>
      {:else if m.from === 'me'}
        <div class="row mine" style="animation-delay:{m.delay}s"><div class="bubble">{m.text}</div></div>
      {:else}
        <div class="row" style="animation-delay:{m.delay}s">
          <div class="who">{nameOf(m.from)}</div>
          {#if m.photo}
            <div class="photo" aria-label="사진 (가상 인물의 실루엣)">
              <svg viewBox="0 0 120 90" width="150" height="112" aria-hidden="true">
                <rect width="120" height="90" fill="#C9D2E0" />
                <circle cx="60" cy="38" r="14" fill="#8D99AE" />
                <path d="M30 90c0-22 14-34 30-34s30 12 30 34z" fill="#8D99AE" />
              </svg>
              <span>사진 1장</span>
            </div>
          {:else}
            <div class="bubble">{m.text}</div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>

  <footer>
    {#if choices}
      <div class="choices" style="animation-delay:{choiceDelay}s">
        {#each choices as c (c.index)}
          <button class="choice" class:clue={isClue(c)} onclick={() => choose(c)}>{c.text}</button>
        {/each}
      </div>
    {:else if ended}
      <div class="choices" style="animation-delay:{choiceDelay}s">
        <button class="choice exit" onclick={() => { onBusy(false); onExit(); }}>단톡방에서 나가기</button>
      </div>
    {/if}
  </footer>
</div>

<style>
  .phone {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: #dde4ef;
  }
  header {
    flex: none;
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 10px 16px;
    background: #fff;
    border-bottom: 1px solid #cfd7e5;
  }
  header strong {
    font-size: 17px;
    color: #1f2a44;
  }
  header span {
    font-size: 13px;
    color: #5b6781;
  }
  .feed {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 14px 14px 8px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .row,
  .sys,
  .banner {
    opacity: 0;
    animation: appear 0.35s ease-out forwards;
  }
  @keyframes appear {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .who {
    font-size: 12px;
    color: #5b6781;
    margin: 0 0 3px 4px;
  }
  .bubble {
    display: inline-block;
    max-width: 80%;
    padding: 9px 13px;
    border-radius: 4px 16px 16px 16px;
    background: #fff;
    color: #1d2438;
    font-size: 15px;
    line-height: 1.5;
  }
  .row.mine {
    text-align: right;
  }
  .row.mine .bubble {
    border-radius: 16px 4px 16px 16px;
    background: #3b6fd8;
    color: #fff;
    text-align: left;
  }
  .photo {
    display: inline-flex;
    flex-direction: column;
    border-radius: 4px 16px 16px 16px;
    overflow: hidden;
    background: #fff;
  }
  .photo span {
    padding: 4px 10px;
    font-size: 12px;
    color: #5b6781;
  }
  .sys {
    align-self: center;
    max-width: 92%;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(31, 42, 68, 0.12);
    color: #3a4560;
    font-size: 13px;
    text-align: center;
  }
  .banner {
    align-self: center;
    padding: 8px 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    text-align: center;
  }
  .banner.clue {
    background: #fff1d9;
    color: #8f5a10;
    border: 2px solid #e8a33d;
  }
  .banner.warn {
    background: #fbe6e9;
    color: #b23a48;
    border: 2px solid #b23a48;
  }
  footer {
    flex: none;
    min-height: 120px;
    padding: 10px 14px calc(12px + env(safe-area-inset-bottom));
    background: #fff;
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -2px 0 #cfd7e5;
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 8px;
    opacity: 0;
    animation: appear 0.35s ease-out forwards;
  }
  .choice {
    min-height: 46px;
    padding: 8px 14px;
    border: 2px solid #d5dce8;
    border-radius: 12px;
    background: #eef1f5;
    color: #1d2438;
    font: inherit;
    font-size: 15px;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .choice.clue {
    background: #e8a33d;
    border-color: #e8a33d;
    color: #1f2a44;
  }
  .choice.exit {
    background: #1f2a44;
    border-color: #1f2a44;
    color: #fff;
    text-align: center;
  }
</style>
