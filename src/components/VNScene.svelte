<script lang="ts">
  // 대화형(비주얼노벨) 장면: 배경 + 인물 그림 + 대사창. 걷기 없이 인물을 눌러 대화한다.
  // 대본·단서·신뢰 처리는 탐색형(Scene.svelte)과 같다.
  import { CHARACTERS } from '../data/characters';
  import { MANIFEST } from '../assets/manifest';
  import { clueById } from '../data/clues';
  import { ROOMS, SCENES, SLOT_LABEL, type Placed } from '../data/rooms';
  import type { Beat, ChoiceView, Effect, InkSession } from '../lib/inkEngine';
  import { sessionFor } from '../lib/session';
  import { addClue, addTrust, game, markSeen, markShared } from '../lib/gameState';
  import type { Clue } from '../data/clues';
  import type { CharId } from '../data/characters';
  import { get } from 'svelte/store';

  let {
    sceneId,
    dayId,
    onFinish,
    onBusy,
  }: { sceneId: string; dayId: string; onFinish: () => void; onBusy: (busy: boolean) => void } = $props();

  // 장면은 {#key} 로 매번 새로 만들어지므로 초기값만 읽어도 된다
  // svelte-ignore state_referenced_locally
  const scene = SCENES[sceneId];
  const room = ROOMS[scene.room];
  // 왼쪽부터 오른쪽 순서로 세운다 (교실 안의 열 번호 기준). 장식용 친구들은 세우지 않는다.
  const targets: Placed[] = scene.items.filter((i) => i.knot).sort((a, b) => a.c - b.c);

  const wallColor = room.wall?.right ?? '#DDE5EF';
  const floorColor = room.floor?.[0] ?? '#D9C9A6';

  let doneIds: string[] = $state(
    get(game).seen.filter((s) => s.startsWith(sceneId + ':')).map((s) => s.slice(sceneId.length + 1)),
  );

  let session: InkSession | null = $state(null);
  let current = $state<Placed | null>(null);
  let line = $state<{ speaker: CharId | null; text: string } | null>(null);
  let choices = $state<ChoiceView[] | null>(null);
  let clueCard = $state<Clue | null>(null);
  let pendingClues: string[] = [];

  const sprite = (key: string) => MANIFEST[key]?.sheets.idle.src;

  function apply(effects: Effect[]) {
    for (const e of effects) {
      if (e.kind === 'trust') addTrust(e.who, e.delta); // 숨은 값: 화면에 보여 주지 않는다
      else if (e.kind === 'shared') markShared();
      else if (addClue(e.id)) pendingClues.push(e.id);
    }
  }

  function start(it: Placed) {
    if (!it.knot || session) return;
    current = it;
    pendingClues = [];
    line = null;
    choices = null;
    onBusy(true);
    session = sessionFor(dayId);
    session.begin(it.knot);
    advance();
  }

  function advance() {
    if (!session) return;
    const beat: Beat = session.step();
    if (beat.type === 'end') return finishInteraction();
    if (beat.type === 'line') {
      apply(beat.effects);
      line = { speaker: beat.speaker, text: beat.text };
      choices = null;
    } else if (beat.type === 'choices') {
      choices = beat.choices;
    }
  }

  function choose(i: number) {
    if (!session || !choices) return;
    const picked = choices.find((c) => c.index === i);
    if (picked) apply(picked.effects);
    session.choose(i);
    choices = null;
    line = null;
    advance();
  }

  function finishInteraction() {
    if (current) {
      markSeen(`${sceneId}:${current.id}`);
      if (!doneIds.includes(current.id)) doneIds = [...doneIds, current.id];
    }
    session = null;
    line = null;
    choices = null;
    nextClueOrExit();
  }

  function nextClueOrExit() {
    const id = pendingClues.shift();
    if (id) {
      clueCard = clueById(id) ?? null;
      return;
    }
    clueCard = null;
    current = null;
    onBusy(false);
  }

  const talking = $derived(!!session);
  const speakerName = $derived(line?.speaker ? CHARACTERS[line.speaker].name : null);
  /** 말하는 사람이 장면에 서 있는 인물이면 앞으로 나온다 */
  const speakingId = $derived(line?.speaker ? targets.find((t) => t.char === line!.speaker)?.id ?? null : null);
</script>

<section class="vn" style="--wall: {wallColor}; --floor: {floorColor}">
  <div class="stage">
    <p class="place">{room.name} · {SLOT_LABEL[scene.slot]}</p>
    <div class="cast">
      {#each targets as t (t.id)}
        {@const dim = talking && current?.id !== t.id}
        <button
          class="who"
          class:dim
          class:front={speakingId === t.id || (talking && !speakingId && current?.id === t.id)}
          disabled={talking || !!clueCard}
          onclick={() => start(t)}
          aria-label="{t.kind === 'npc' ? '말 걸기' : '살펴보기'} {t.label}"
        >
          <img src={sprite(t.sprite)} alt="" draggable="false" />
          <span class="tag">{t.label}{doneIds.includes(t.id) ? ' · 완료' : ''}</span>
          {#if !talking && !clueCard && !doneIds.includes(t.id)}
            <span class="mark" aria-hidden="true">{t.kind === 'npc' ? '!' : '?'}</span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <div class="box">
    {#if clueCard}
      <div class="card" role="status">
        <p class="eyebrow clue">단서 획득 · {clueCard.type}</p>
        <h3>{clueCard.title}</h3>
        <p class="desc">{clueCard.desc}</p>
      </div>
      <button class="btn primary" onclick={nextClueOrExit}>수사 수첩에 기록됨 · 계속</button>
    {:else if talking}
      {#if speakerName}<p class="name">{speakerName}</p>{/if}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="textwrap" onclick={() => !choices && advance()}>
        {#key line?.text}
          <p class="text" class:narr={!line?.speaker}>{line?.text ?? ''}</p>
        {/key}
      </div>
      {#if choices}
        <div class="choices">
          {#each choices as c (c.index)}
            <button class="btn choice" onclick={() => choose(c.index)}>{c.text}</button>
          {/each}
        </div>
      {:else}
        <button class="btn next" onclick={advance}>다음</button>
      {/if}
    {:else}
      <p class="guide">대화하고 싶은 사람이나 물건을 눌러 보세요. 머리 위 <b class="bang">!</b> 는 대화, <b class="bang">?</b> 는 관찰할 수 있다는 뜻이에요.</p>
      <button class="btn ghost" onclick={onFinish}>이 시간대 마치기</button>
    {/if}
  </div>
</section>

<style>
  .vn {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .stage {
    position: relative;
    flex: 1;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    /* 위는 벽, 아래는 바닥 */
    background: linear-gradient(to bottom, var(--wall) 0 62%, var(--floor) 62% 100%);
    overflow: hidden;
  }
  .place {
    position: absolute;
    top: 10px;
    left: 12px;
    margin: 0;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(31, 42, 68, 0.78);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
  }
  .cast {
    display: flex;
    justify-content: space-evenly;
    align-items: flex-end;
    gap: 4px;
    padding: 0 8px 14px;
  }
  .who {
    position: relative;
    flex: 1 1 0;
    max-width: 118px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition:
      opacity 0.2s,
      transform 0.2s;
  }
  .who:disabled {
    cursor: default;
  }
  .who.dim {
    opacity: 0.4;
  }
  .who.front {
    transform: translateY(-8px);
  }
  .who img {
    width: 100%;
    height: auto;
    display: block;
    pointer-events: none;
  }
  .tag {
    margin-top: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.92);
    color: #1f2a44;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
  }
  .mark {
    position: absolute;
    top: -4px;
    left: 50%;
    margin-left: -11px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #e8a33d;
    color: #1f2a44;
    font-size: 14px;
    font-weight: 800;
    line-height: 22px;
    text-align: center;
    animation: bob 1.2s ease-in-out infinite;
  }
  @keyframes bob {
    50% {
      transform: translateY(-4px);
    }
  }
  .box {
    flex: none;
    max-height: 56%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px calc(14px + env(safe-area-inset-bottom));
    background: #fff;
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -2px 0 #dfe4ec;
    overflow-y: auto;
  }
  .name {
    align-self: flex-start;
    margin: 0;
    padding: 3px 12px;
    border-radius: 999px;
    background: #1f2a44;
    color: #fff;
    font-size: 14px;
    font-weight: 800;
  }
  .textwrap {
    min-height: 72px;
  }
  .text {
    margin: 0;
    font-size: 17px;
    line-height: 1.6;
    color: #1d2438;
    animation: rise 0.22s ease-out;
  }
  .text.narr {
    color: #4a5670;
    padding-left: 10px;
    border-left: 3px solid #cfd7e5;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
  .guide {
    margin: 0;
    font-size: 15px;
    line-height: 1.55;
    color: #2a3550;
  }
  .bang {
    display: inline-block;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #e8a33d;
    color: #1f2a44;
    text-align: center;
    line-height: 18px;
    font-size: 12px;
  }
  .btn {
    min-height: 48px;
    padding: 10px 14px;
    border: 0;
    border-radius: 12px;
    font: inherit;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
  }
  .primary {
    background: #3b6fd8;
    color: #fff;
  }
  .ghost {
    background: #eef1f5;
    color: #2a3550;
    font-size: 14px;
  }
  .next {
    align-self: flex-end;
    min-width: 96px;
    background: #1f2a44;
    color: #fff;
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .choice {
    text-align: left;
    background: #eef1f5;
    color: #1d2438;
    border: 2px solid #d5dce8;
  }
  .card {
    padding: 14px;
    border: 2px solid #e8a33d;
    border-radius: 14px;
    background: #fff8ec;
    animation: pop 0.35s cubic-bezier(0.2, 1.2, 0.4, 1);
  }
  .eyebrow {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 700;
    color: #b8741a;
  }
  .card h3 {
    margin: 0 0 6px;
    font-size: 19px;
    color: #1f2a44;
  }
  .desc {
    margin: 0;
    font-size: 15px;
    line-height: 1.55;
    color: #2a3550;
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(16px) scale(0.96);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .mark,
    .text,
    .card {
      animation: none;
    }
  }
</style>
