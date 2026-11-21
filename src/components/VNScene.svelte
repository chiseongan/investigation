<script lang="ts">
  // 대화형(비주얼노벨) 장면: 배경 + 인물 그림 + 대사창.
  // 학생을 고르지 않는다. 시간대가 흐르면서 그 자리의 인물들을 차례로 마주치고, 대화가 이어진다.
  // 대본·단서·신뢰 처리는 탐색형(Scene.svelte)과 같다.
  import { onMount } from 'svelte';
  import { CHARACTERS } from '../data/characters';
  import { MANIFEST } from '../assets/manifest';
  import { portrait, type Face } from '../assets/portraits';
  import { clueById } from '../data/clues';
  import { ROOMS, SCENES, SLOT_LABEL, SLOT_ORDER, type Placed } from '../data/rooms';
  import VNBackground from './VNBackground.svelte';
  import { IMPRESSIONS } from '../data/impressions';
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
    onTransition,
  }: {
    sceneId: string;
    dayId: string;
    onFinish: () => void;
    onBusy: (busy: boolean) => void;
    /** 같은 장소에서 다음 사람으로 넘어갈 때 화면 전환을 걸어 준다 */
    onTransition: (action: () => void) => void;
  } = $props();

  // 장면은 {#key} 로 매번 새로 만들어지므로 초기값만 읽어도 된다
  // svelte-ignore state_referenced_locally
  const scene = SCENES[sceneId];
  const room = ROOMS[scene.room];
  const slotIdx = SLOT_ORDER.indexOf(scene.slot);

  // 만나는 순서는 장면에 적힌 순서. 이미 마친 상대는 건너뛴다.
  const seen = get(game).seen.filter((s) => s.startsWith(sceneId + ':')).map((s) => s.slice(sceneId.length + 1));
  const queue: Placed[] = scene.items.filter((i) => i.knot && !seen.includes(i.id));

  type Step = 'talking' | 'leaving' | 'clue' | 'reflect' | 'over';
  let step = $state<Step>('over');
  let idx = $state(0);
  let session: InkSession | null = $state(null);
  let current = $state<Placed | null>(null);
  let line = $state<{ speaker: CharId | null; text: string } | null>(null);
  let choices = $state<ChoiceView[] | null>(null);
  // 대화 도중 끼어든 다른 인물들. 퇴장 표시가 붙은 줄이 지나면 사라진다.
  let guests = $state<CharId[]>([]);
  let leaving: CharId[] = [];
  let clueCard = $state<Clue | null>(null);
  // 대화가 끝나면 인물이 서서히 사라진 뒤 다음으로 넘어간다
  let fadingOut = $state(false);
  // 대화가 끝난 뒤 수사관이 느낀 점 (최대 3줄, 한 줄씩)
  let thoughts = $state<string[]>([]);
  let ti = $state(0);
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(leaveTimer));
  const FADE_MS = 650;
  const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pendingClues: string[] = [];

  const sprite = (key: string) => MANIFEST[key]?.sheets.idle.src;
  /** 인물 그림이 들어온 인물은 그 그림(표정 포함)을, 아니면 임시 그림을 쓴다 */
  const art = (key: string, face: Face = 'default'): { src: string; ratio: number | null } => portrait(key, face) ?? { src: sprite(key) ?? '', ratio: null };
  // 나의 표정: 느낀 점을 말할 땐 생각하는 얼굴, 단서를 얻으면 놀란 얼굴
  const myFace = $derived<Face>(step === 'reflect' ? 'thinking' : step === 'clue' ? 'surprised' : 'default');

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
      finish();
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
    guests = [];
    leaving = [];
    fadingOut = false;
    session = sessionFor(dayId);
    session.begin(it.knot);
    step = 'talking';
    advance();
  }

  function advance() {
    if (!session) return;
    const beat: Beat = session.step();
    // 지난 줄에서 "퇴장"이 표시된 인물은 이제 자리를 뜬다
    if (leaving.length) {
      guests = guests.filter((g) => !leaving.includes(g));
      leaving = [];
    }
    if (beat.type === 'end') return endEncounter();
    if (beat.type === 'line') {
      apply(beat.effects);
      const here = (id: CharId) => id !== 'me' && id !== current?.char && !current?.cast?.includes(id);
      const g = [...guests];
      for (const id of [...(beat.enter ?? []), ...(beat.speaker ? [beat.speaker] : [])]) if (here(id) && !g.includes(id)) g.push(id);
      guests = g.slice(-2);
      leaving = beat.leave ?? [];
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
    leaving = [];
    // 인물이 사라지는 동안 잠시 기다린다 (움직임 줄이기 설정이면 바로 넘어간다)
    fadingOut = true;
    step = 'leaving';
    leaveTimer = setTimeout(nextClueOrOn, reduceMotion() ? 0 : FADE_MS);
  }

  function nextClueOrOn() {
    const id = pendingClues.shift();
    if (id) {
      clueCard = clueById(id) ?? null;
      step = 'clue';
      return;
    }
    clueCard = null;
    startReflect();
  }

  function startReflect() {
    thoughts = current ? (IMPRESSIONS[`${sceneId}:${current.id}`] ?? []).slice(0, 3) : [];
    ti = 0;
    if (thoughts.length) step = 'reflect';
    else proceed();
  }

  function nextThought() {
    if (ti + 1 < thoughts.length) ti++;
    else proceed();
  }

  let moving = false; // 전환이 걸린 동안 중복 클릭 방지
  function proceed() {
    if (moving) return;
    if (idx + 1 < queue.length) {
      moving = true;
      onTransition(() => {
        moving = false;
        thoughts = [];
        meet(idx + 1);
      });
    } else {
      thoughts = [];
      finish();
    }
  }

  /** 마지막 대화가 끝나면 시간을 넘기는 선택 없이 자동으로 다음 시간·장소로 넘어간다 */
  function finish() {
    step = 'over';
    current = null;
    onBusy(false);
    onFinish();
  }

  const speakerName = $derived(line?.speaker ? CHARACTERS[line.speaker].name : null);
  /** 무대 위 인물: 지금 대화 상대 + 끼어든 사람들 */
  const figures = $derived(
    current
      ? [
          // 목격 장면은 대화 상대 대신 지켜보는 인물들이 서 있다
          ...(current.cast
            ? current.cast.map((id) => ({ key: 'c_' + id, sprite: CHARACTERS[id].sprite, label: CHARACTERS[id].name, char: id as CharId | null }))
            : [{ key: current.id, sprite: current.sprite, label: current.label, char: current.char ?? null }]),
          ...guests.map((id) => ({ key: 'g_' + id, sprite: CHARACTERS[id].sprite, label: CHARACTERS[id].name, char: id as CharId | null })),
        ]
      : [],
  );
  const speaker = $derived(step === 'talking' ? (line?.speaker ?? null) : null);
  /** 하루 안의 시각: 시간대 순서 + 그 안에서 몇 번째 만남인지. 만날 때마다 빛깔이 조금씩 바뀐다. */
  const t = $derived(dayProgress(slotIdx, SLOT_ORDER.length, step === 'over' ? 1 : idx / Math.max(1, queue.length)));
</script>

<section class="vn">
  <div class="stage">
    <VNBackground room={room.id} {t} />
    <!-- 선택지가 뜰 때 배경을 살짝 흐리게 (투명도만 바뀐다) -->
    <div class="blur" class:on={!!choices && step === 'talking'} aria-hidden="true"></div>
    <p class="place">{room.name} · {SLOT_LABEL[scene.slot]}</p>
    <div class="cast">
      <!-- 왼쪽은 나, 오른쪽은 대화 상대(와 끼어든 사람들). 느낀 점을 말할 때는 나만 남는다 -->
      {#if step !== 'over'}
        <div class="side mine">
          <div class="who" class:bust={!!art('me').ratio} style:--ar={art('me').ratio} class:front={speaker === 'me' || step === 'reflect'} class:dim={!!speaker && speaker !== 'me'}>
            <img src={art('me', myFace).src} alt="" draggable="false" />
            {#if !art('me').ratio}<span class="tag">나</span>{/if}
          </div>
        </div>
      {/if}
      {#if step === 'talking' || step === 'leaving'}
        <div class="side theirs">
          {#each figures as f (f.key)}
            <div class="who" class:bust={!!art(f.sprite).ratio} style:--ar={art(f.sprite).ratio} class:out={fadingOut} class:front={!!speaker && speaker === f.char} class:dim={speaker === 'me' || (!!speaker && speaker !== f.char)}>
              <img src={art(f.sprite).src} alt="" draggable="false" />
              {#if !art(f.sprite).ratio}<span class="tag">{f.label}</span>{/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
    {#if choices && step === 'talking'}
      <!-- 선택지는 인물이 있는 화면 위에 띄운다 -->
      <div class="choices" role="group" aria-label="선택지">
        {#each choices as c (c.index)}
          <button class="btn choice" onclick={() => choose(c.index)}>{c.text}</button>
        {/each}
      </div>
    {/if}
  </div>

  <div class="box">
    {#if step === 'clue' && clueCard}
      <div class="card" role="status">
        <p class="eyebrow clue">단서 획득 · {clueCard.type}</p>
        <h3>{clueCard.title}</h3>
        <p class="desc">{clueCard.desc}</p>
      </div>
      <button class="btn primary" onclick={nextClueOrOn}>수사 수첩에 기록됨 · 계속</button>
    {:else if step === 'leaving'}
      <div class="textwrap"></div>
    {:else if step === 'talking'}
      <div class="namerow">{#if speakerName}<p class="name">{speakerName}</p>{/if}</div>
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="textwrap" onclick={() => !choices && advance()}>
        {#key line?.text}
          <p class="text" class:narr={!line?.speaker}>{line?.text ?? ''}</p>
        {/key}
      </div>
      {#if !choices}
        <button class="btn next" onclick={advance}>다음</button>
      {/if}
    {:else if step === 'reflect' && thoughts.length}
      <div class="namerow"></div>
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="textwrap" onclick={nextThought}>
        {#key ti}
          <p class="text thought">{thoughts[ti]}</p>
        {/key}
      </div>
      <button class="btn next" onclick={nextThought}>{ti + 1 < thoughts.length ? '다음' : '계속'}</button>
    {:else}
      <div class="textwrap"></div>
    {/if}
  </div>
</section>

<style>
  .vn {
    --boxh: clamp(230px, 34dvh, 300px);
    /* 인물 그림이 무대 높이를 넘지 않게: 화면 높이 - 위 표시줄 - 대화창 - 이름표 */
    --figh: calc(100dvh - 64px - var(--boxh) - 52px);
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
    /* 인물 크기를 화면 폭에도 맞추기 위한 기준 (cqw = 무대 폭의 1%) */
    container-type: inline-size;
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
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    min-height: 220px;
    gap: 8px;
    padding: 0 12px 14px;
  }
  .side {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    min-width: 0;
  }
  .mine {
    flex: 0 0 auto;
  }
  /* 대화 상대는 오른쪽 끝에 고정. 끼어든 사람은 그 왼쪽에 차례로 서고, 기존 인물은 자리를 지킨다 */
  .theirs {
    flex: 1 1 0;
    flex-direction: row-reverse;
    justify-content: flex-start;
    gap: 0;
  }
  .who {
    flex: 0 1 140px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition:
      transform 0.2s,
      opacity 0.2s;
    /* 대화가 시작될 때 서서히 나타난다 (투명도만 사용) */
    animation: appear 0.65s ease-out;
  }
  /* 끼어든 사람은 앞사람 왼쪽에 반쯤 겹쳐 선다 (칸 폭의 절반만큼 떨어짐) */
  .theirs .who.bust + .who.bust {
    margin-right: calc(var(--slot) * -0.5);
  }
  .who.dim {
    opacity: 0.55;
  }
  .who.front {
    transform: translateY(-8px);
    position: relative;
    z-index: 1;
  }
  /* 대화가 끝날 때 서서히 사라진다 */
  .who.out {
    animation: vanish 0.65s ease-in forwards;
  }
  @keyframes appear {
    from {
      opacity: 0;
    }
  }
  @keyframes vanish {
    to {
      opacity: 0;
    }
  }
  /* 인물 그림이 있는 인물: 상반신 위주로 보여 주고, 아래쪽은 대화창 뒤로 내려 숨긴다.
     그림은 인물 전체 높이의 약 2/3만 담겨 있다. 무대 높이만큼의 전신을 기준으로 크기를 잡는다. */
  .who.bust {
    flex: 0 0 auto;
    --fh: calc(100dvh - 64px - var(--boxh));
    /* 키는 무대 높이와 폭 중 작은 쪽에 맞춘다: 폭이 좁아도 '나'와 상대가 겹치지 않게 */
    --ih: min(calc(var(--fh) * 0.667), 62cqw);
    /* 모든 인물이 같은 폭의 칸에 가운데 맞춰 서므로, 인물이 달라도 서는 자리가 같다 */
    --slot: calc(var(--ih) * 0.72);
    width: var(--slot);
    /* 그림 아래 7%는 무대 밖으로 내려 가린다. 무대 아래쪽 여백(14px)만큼도 더 내린다 */
    margin-bottom: calc(var(--ih) * -0.07 - 14px);
  }
  .who.bust img {
    width: auto;
    height: var(--ih);
    max-width: none;
  }
  .who img {
    width: 100%;
    /* 위쪽 장소 표시줄 자리를 비우고, 그림 비율(--ar, 기본 임시 그림 비율)에 맞춘다 */
    max-width: calc((var(--figh) - 36px) * var(--ar, 0.5714));
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
  /* 대화창은 글이 길든 짧든 항상 같은 크기. 넘치면 안쪽에서만 스크롤된다. */
  .box {
    flex: none;
    box-sizing: border-box;
    height: var(--boxh);
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px calc(14px + env(safe-area-inset-bottom));
    background: #fff;
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -2px 0 #dfe4ec;
    overflow: hidden;
  }
  .namerow {
    flex: none;
    height: 28px;
    display: flex;
    align-items: center;
  }
  .name {
    margin: 0;
    padding: 3px 12px;
    border-radius: 999px;
    background: #1f2a44;
    color: #fff;
    font-size: 14px;
    font-weight: 800;
  }
  .textwrap {
    flex: 1 1 auto;
    min-height: 64px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .text {
    margin: 0;
    font-size: 17px;
    line-height: 1.6;
    color: #1d2438;
    overflow-wrap: anywhere;
    word-break: keep-all;
    animation: rise 0.22s ease-out;
  }
  .text.thought {
    color: #2a3550;
    font-style: italic;
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
  .btn {
    flex: none;
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
  /* 배경만 흐리게: 인물보다 아래, 배경보다 위 */
  .blur {
    position: absolute;
    inset: 0;
    background: rgba(31, 42, 68, 0.14);
    -webkit-backdrop-filter: blur(3px);
    backdrop-filter: blur(3px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }
  .blur.on {
    opacity: 1;
  }
  /* 선택지: 인물 화면 위에 띄운다 */
  .choices {
    position: absolute;
    left: 12px;
    right: 12px;
    top: 44px;
    bottom: 10px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    overflow-y: auto;
    overscroll-behavior: contain;
    animation: rise 0.25s ease-out;
  }
  .choice {
    flex: none;
    min-height: 44px;
    padding: 8px 14px;
    font-size: 15px;
    overflow-wrap: anywhere;
    word-break: keep-all;
    text-align: left;
    background: rgba(255, 255, 255, 0.96);
    color: #1d2438;
    border: 2px solid #3b6fd8;
    box-shadow: 0 2px 8px rgba(31, 42, 68, 0.25);
  }
  .card {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
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
    color: #5b6781;
  }
  .eyebrow.clue {
    color: #b8741a;
  }
  .card h3 {
    margin: 0 0 6px;
    font-size: 19px;
    color: #1f2a44;
  }
  .desc {
    overflow-wrap: anywhere;
    word-break: keep-all;
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
    .choices,
    .card {
      animation: none;
    }
  }
</style>
