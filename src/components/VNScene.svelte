<script lang="ts">
  // 대화형(비주얼노벨) 장면: 배경 + 인물 그림 + 대사창.
  // 학생을 고르지 않는다. 시간대가 흐르면서 그 자리의 인물들을 차례로 마주치고, 대화가 이어진다.
  // 대본·단서·신뢰 처리는 탐색형(Scene.svelte)과 같다.
  import { onMount } from 'svelte';
  import { CHARACTERS } from '../data/characters';
  import { MANIFEST } from '../assets/manifest';
  import { clueById } from '../data/clues';
  import { DAYS, ROOMS, SCENES, SLOT_LABEL, SLOT_ORDER, type Placed } from '../data/rooms';
  import VNBackground from './VNBackground.svelte';
  import { dayProgress } from '../lib/daylight';
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
  const slotIdx = SLOT_ORDER.indexOf(scene.slot);
  const hasLater = SLOT_ORDER.some((s) => s in DAYS.find((d) => d.id === dayId)!.scenes && SLOT_ORDER.indexOf(s) > slotIdx);

  // 만나는 순서는 장면에 적힌 순서. 이미 마친 상대는 건너뛴다.
  const seen = get(game).seen.filter((s) => s.startsWith(sceneId + ':')).map((s) => s.slice(sceneId.length + 1));
  const queue: Placed[] = scene.items.filter((i) => i.knot && !seen.includes(i.id));

  type Step = 'talking' | 'clue' | 'between' | 'over';
  let step: Step = $state('over');
  let idx = $state(0);
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

  onMount(() => {
    if (queue.length) {
      onBusy(true);
      meet(0);
    } else {
      step = 'over';
    }
  });

  function meet(i: number) {
    const it = queue[i];
    if (!it?.knot) return finish();
    idx = i;
    current = it;
    pendingClues = [];
    line = null;
    choices = null;
    session = sessionFor(dayId);
    session.begin(it.knot);
    step = 'talking';
    advance();
  }

  function advance() {
    if (!session) return;
    const beat: Beat = session.step();
    if (beat.type === 'end') return endEncounter();
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

  function endEncounter() {
    if (current) markSeen(`${sceneId}:${current.id}`);
    session = null;
    line = null;
    choices = null;
    nextClueOrOn();
  }

  function nextClueOrOn() {
    const id = pendingClues.shift();
    if (id) {
      clueCard = clueById(id) ?? null;
      step = 'clue';
      return;
    }
    clueCard = null;
    if (idx + 1 < queue.length) step = 'between';
    else finish();
  }

  function finish() {
    step = 'over';
    current = null;
    onBusy(false);
  }

  const speakerName = $derived(line?.speaker ? CHARACTERS[line.speaker].name : null);
  const next = $derived(queue[idx + 1] ?? null);
  /** 하루 안의 시각: 시간대 순서 + 그 안에서 몇 번째 만남인지. 만날 때마다 빛깔이 조금씩 바뀐다. */
  const t = $derived(dayProgress(slotIdx, SLOT_ORDER.length, step === 'over' ? 1 : idx / Math.max(1, queue.length)));
</script>

<section class="vn">
  <div class="stage">
    <VNBackground room={room.id} {t} />
    <p class="place">{room.name} · {SLOT_LABEL[scene.slot]}</p>
    {#if queue.length}<p class="count">만남 {Math.min(idx + 1, queue.length)} / {queue.length}</p>{/if}
    <div class="cast">
      {#if current && step !== 'over'}
        {#key current.id}
          <div class="who" class:front={!!line?.speaker && line.speaker === current.char}>
            <img src={sprite(current.sprite)} alt="" draggable="false" />
            <span class="tag">{current.label}</span>
          </div>
        {/key}
      {/if}
    </div>
  </div>

  <div class="box">
    {#if step === 'clue' && clueCard}
      <div class="card" role="status">
        <p class="eyebrow clue">단서 획득 · {clueCard.type}</p>
        <h3>{clueCard.title}</h3>
        <p class="desc">{clueCard.desc}</p>
      </div>
      <button class="btn primary" onclick={nextClueOrOn}>수사 수첩에 기록됨 · 계속</button>
    {:else if step === 'talking'}
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
    {:else if step === 'between' && next}
      <p class="guide">잠시 뒤, 다음에 마주친 상대는 <b>{next.label}</b>.</p>
      <button class="btn primary" onclick={() => meet(idx + 1)}>계속</button>
    {:else}
      <p class="guide">{queue.length ? '이 시간대에 마주칠 사람은 모두 만났어요.' : '이 시간대에는 더 마주칠 사람이 없어요.'}</p>
      <button class="btn primary" onclick={onFinish}>{hasLater ? '시간이 흐른다 · 계속' : '하루 마무리'}</button>
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
    background: #dde5ef;
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
  .count {
    position: absolute;
    top: 10px;
    right: 12px;
    margin: 0;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.9);
    color: #1f2a44;
    font-size: 13px;
    font-weight: 700;
  }
  .cast {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    min-height: 220px;
    padding: 0 8px 14px;
  }
  .who {
    width: 150px;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.2s;
    animation: enter 0.35s ease-out;
  }
  .who.front {
    transform: translateY(-8px);
  }
  @keyframes enter {
    from {
      opacity: 0;
      transform: translateX(40px);
    }
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
    .who,
    .text,
    .card {
      animation: none;
    }
  }
</style>
