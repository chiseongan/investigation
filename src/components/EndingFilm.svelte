<script lang="ts">
  // 엔딩 영상: 대화형 화면과 같은 방식으로 배경·인물·표정·자막을 보여 주는 컷을 차례로 재생한다.
  // 컷과 컷 사이는 검은 화면으로 이어지고, 큰 글씨 컷은 잠깐 머문 뒤 저절로 넘어간다(눌러서 넘겨도 된다).
  // 움직임은 투명도와 이동·크기 변화만 쓴다.
  import { CHARACTERS } from '../data/characters';
  import type { CharId } from '../data/characters';
  import type { FilmLine, Shot } from '../data/epilogue';
  import { portrait, warm } from '../assets/portraits';
  import VNBackground from './VNBackground.svelte';

  let { shots, onDone }: { shots: Shot[]; onDone: () => void } = $props();

  // svelte-ignore state_referenced_locally
  const list = shots;
  let si = $state(0);
  let li = $state(0);
  let black = $state(false);
  let moving = false;
  // 고른 선택지의 반응 줄이 이어 붙는다
  let extra = $state<FilmLine[]>([]);
  let asking = $state(false);
  let faces = $state<Record<string, string>>({});
  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(timer));

  const reduce = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FADE = 450;

  const shot = $derived(list[si]);
  const lines = $derived(shot?.kind === 'scene' ? [...shot.lines, ...extra] : []);
  const line = $derived(lines[li] ?? null);

  function enter(n: number) {
    si = n;
    li = 0;
    extra = [];
    asking = false;
    const s = list[n];
    if (!s) return onDone();
    if (s.kind === 'scene') {
      faces = Object.fromEntries(s.right.map((f) => [f.who, f.face]));
      if (s.me) faces.me = s.me;
      for (const f of s.right) warm(f.who);
      warm('me');
      applyFace(0);
    } else if (s.kind === 'card') {
      clearTimeout(timer);
      timer = setTimeout(() => go(n + 1), reduce() ? Math.min(s.hold ?? 3000, 1500) : (s.hold ?? 3000));
    }
  }

  // 지금 줄에 표정 지정이 있으면 그 인물 표정을 바꾼다
  function applyFace(i: number) {
    const l = (shot?.kind === 'scene' ? [...shot.lines, ...extra] : [])[i];
    if (l?.who && l.face) faces = { ...faces, [l.who]: l.face };
  }

  /** 검은 화면으로 가렸다가 다음 컷으로 */
  function go(n: number) {
    if (moving) return;
    moving = true;
    clearTimeout(timer);
    black = true;
    timer = setTimeout(
      () => {
        moving = false;
        enter(n);
        black = false;
      },
      reduce() ? 0 : FADE,
    );
  }

  function next() {
    if (moving) return;
    if (shot?.kind === 'card' || shot?.kind === 'ledger') return go(si + 1);
    if (li + 1 < lines.length) {
      li++;
      applyFace(li);
      return;
    }
    if (shot?.kind === 'scene' && shot.choices && !extra.length) {
      asking = true;
      return;
    }
    go(si + 1);
  }

  function choose(i: number) {
    if (shot?.kind !== 'scene' || !shot.choices) return;
    extra = shot.choices[i].reply;
    asking = false;
    li = shot.lines.length;
    applyFace(li);
  }

  enter(0);

  const art = (key: string, face: string) => portrait(key, face);
  const speaker = $derived<CharId | null>(line?.who ?? null);
  const tagOn = $derived(shot?.kind === 'scene' && !!shot.tag && li >= (shot.tagFrom ?? 0));
  const place = $derived(shot?.kind === 'scene' ? shot.place : undefined);
</script>

<section class="film" aria-live="polite">
  {#if shot?.kind === 'card'}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="card" onclick={next}>
      {#key si}
        <p class="big">{#each shot.text.split('\n') as row}{row}<br />{/each}</p>
        {#if shot.sub}<p class="sub">{shot.sub}</p>{/if}
      {/key}
      <button class="skip" onclick={next}>넘기기</button>
    </div>
  {:else if shot?.kind === 'ledger'}
    <div class="ledger">
      <h3 class="ltitle">{shot.title}</h3>
      <ul class="litems">
        {#each shot.items as it, k}
          <li style:--d="{0.5 + k * 0.7}s">
            <span class="lno">{it.no}</span>
            <strong>{it.name}</strong>
            <span class="ldots" aria-hidden="true">{#each Array(3) as _, d}<i class:on={d < it.level}></i>{/each}</span>
            <p>{it.text}</p>
          </li>
        {/each}
      </ul>
      {#if shot.note}<p class="lnote" style:--d="{0.5 + shot.items.length * 0.7}s">{shot.note}</p>{/if}
      <button class="btn lnext" style:--d="{0.8 + shot.items.length * 0.7}s" onclick={next}>다음</button>
    </div>
  {:else if shot?.kind === 'scene'}
    <div class="stage" class:faded={shot.faded}>
      <VNBackground room={shot.bg} t={shot.t} />
      <div class="blur" class:on={asking} aria-hidden="true"></div>
      {#if place}<p class="place">{place}</p>{/if}
      <div class="cast">
        {#if shot.me}
          <div class="side mine">
            <div class="who bust" class:dim={!!speaker && speaker !== 'me'} class:front={speaker === 'me'}>
              <img src={art('me', faces.me ?? 'default')?.src} alt="" draggable="false" />
            </div>
          </div>
        {/if}
        <div class="side theirs">
          {#each shot.right as f, k (f.who)}
            {@const p = art(f.who, faces[f.who] ?? 'default')}
            {#if p}
              <div class="who bust" class:dim={!!speaker && speaker !== f.who} class:front={speaker === f.who} class:faded={shot.faded}>
                <img src={p.src} alt="" draggable="false" />
                {#if k === 0 && shot.tag && tagOn}
                  {#key shot.tag}<span class="stamp">{shot.tag}</span>{/key}
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>
      {#if asking && shot.choices}
        <div class="choices" role="group" aria-label="선택지">
          {#each shot.choices as c, i}
            <button class="choice" onclick={() => choose(i)}>{c.text}</button>
          {/each}
        </div>
      {/if}
    </div>
    <div class="box">
      <div class="namerow">{#if line?.who}<p class="name">{CHARACTERS[line.who].name}</p>{/if}</div>
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="textwrap" onclick={() => !asking && next()}>
        {#key `${si}-${li}-${extra.length}`}
          <p class="text" class:narr={!line?.who}>{asking ? '어떻게 말할까?' : (line?.text ?? '')}</p>
        {/key}
      </div>
      {#if !asking}
        <button class="btn next" onclick={next}>다음</button>
      {/if}
    </div>
  {/if}
  <div class="black" class:on={black} aria-hidden="true"></div>
</section>

<style>
  .film {
    --boxh: clamp(230px, calc(var(--app-h, 100dvh) * 0.34), 300px);
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: #0e1424;
    overflow: hidden;
  }
  /* 큰 글씨 컷 */
  .card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 28px 26px;
    text-align: center;
    background: #0e1424;
    color: #fff;
    cursor: pointer;
  }
  .big {
    margin: 0;
    font-size: clamp(24px, 7vw, 32px);
    line-height: 1.55;
    font-weight: 800;
    animation: show 1s ease-out 0.15s both;
  }
  .sub {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: #9aa8c6;
    animation: show 1s ease-out 1.2s both;
  }
  /* 조치·책임 목록 */
  .ledger {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: calc(26px + env(safe-area-inset-top)) 18px calc(20px + env(safe-area-inset-bottom));
    background: #0e1424;
    color: #fff;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ltitle {
    margin: 0 0 4px;
    font-size: 20px;
    color: #fff;
    animation: show 0.6s ease-out both;
  }
  .litems {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .litems li {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 4px 10px;
    padding: 12px 14px;
    border-left: 5px solid #b23a48;
    border-radius: 12px;
    background: #1b2440;
    animation: rise 0.6s ease-out var(--d) both;
  }
  .litems .lno {
    font-size: 12px;
    font-weight: 800;
    color: #e8a33d;
  }
  .litems p {
    grid-column: 1 / -1;
    margin: 0;
    font-size: 14px;
    line-height: 1.55;
    color: #dbe3f5;
    word-break: keep-all;
  }
  .ldots {
    display: flex;
    gap: 3px;
  }
  .ldots i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #44507a;
  }
  .ldots i.on {
    background: #b23a48;
  }
  .lnote {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 1.5;
    color: #9aa8c6;
    animation: show 0.6s ease-out var(--d) both;
  }
  .lnext {
    flex: none;
    margin-top: auto;
    animation: show 0.6s ease-out var(--d) both;
  }
  .skip {
    position: absolute;
    right: 14px;
    bottom: calc(14px + env(safe-area-inset-bottom));
    min-height: 44px;
    padding: 0 14px;
    border: 0;
    background: transparent;
    font: inherit;
    font-size: 14px;
    color: #9aa8c6;
    cursor: pointer;
  }
  /* 장면 */
  .stage {
    position: relative;
    flex: 1;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    background: #dde5ef;
    overflow: hidden;
    container-type: inline-size;
  }
  .stage.faded::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(40, 48, 70, 0.35);
    pointer-events: none;
  }
  .blur {
    position: absolute;
    inset: 0;
    backdrop-filter: blur(3px);
    background: rgba(31, 42, 68, 0.12);
    opacity: 0;
    transition: opacity 0.25s;
    pointer-events: none;
  }
  .blur.on {
    opacity: 1;
  }
  .place {
    position: absolute;
    top: 10px;
    left: 12px;
    z-index: 3;
    margin: 0;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(31, 42, 68, 0.78);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    animation: show 0.6s ease-out both;
  }
  .cast {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    min-height: 220px;
    padding: 0 0 14px;
  }
  .side {
    display: flex;
    align-items: flex-end;
    min-width: 0;
  }
  .mine {
    flex: 0 0 auto;
  }
  .mine .who {
    margin-left: -4cqw;
  }
  .theirs {
    flex: 1 1 0;
    flex-direction: row-reverse;
    justify-content: flex-start;
  }
  .theirs .who:first-child {
    margin-right: -4cqw;
    position: relative;
    z-index: 2;
  }
  .theirs .who.bust + .who.bust {
    margin-right: calc(var(--slot) * -0.5);
  }
  .who {
    display: flex;
    flex-direction: column;
    align-items: center;
    transition:
      transform 0.2s,
      opacity 0.2s;
    animation: show 0.65s ease-out both;
  }
  .who.dim {
    opacity: 0.55;
  }
  .who.front {
    transform: translateY(-8px);
    position: relative;
    z-index: 1;
  }
  .who.faded img {
    filter: grayscale(0.7) brightness(0.9);
  }
  .who.bust {
    position: relative;
    flex: 0 0 auto;
    --fh: calc(var(--app-h, 100dvh) - 64px - var(--boxh));
    --ih: min(calc(var(--fh) * 0.667), 62cqw);
    --slot: calc(var(--ih) * 0.72);
    width: var(--slot);
    margin-bottom: calc(var(--ih) * -0.07 - 14px);
  }
  .who img {
    width: auto;
    height: calc(var(--ih) * 1.154);
    max-width: none;
    display: block;
    pointer-events: none;
  }
  /* 가해 기록 딱지: 인물 가슴께에 쾅 찍힌다 */
  .stamp {
    position: absolute;
    left: 50%;
    top: calc(var(--ih) * 1.154 * 0.5);
    z-index: 3;
    padding: 5px 10px;
    border: 3px solid #b23a48;
    border-radius: 6px;
    background: rgba(255, 244, 244, 0.9);
    color: #b23a48;
    font-size: clamp(13px, 3.8cqw, 17px);
    font-weight: 800;
    letter-spacing: 0.06em;
    white-space: nowrap;
    transform: translateX(-50%) rotate(-8deg);
    animation: stamp 0.4s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  }
  .choices {
    position: absolute;
    left: 12px;
    right: 12px;
    top: 44px;
    bottom: 10px;
    z-index: 4;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    overflow-y: auto;
    animation: show 0.25s ease-out both;
  }
  .choice {
    flex: none;
    min-height: 44px;
    padding: 8px 14px;
    font: inherit;
    font-size: 15px;
    text-align: left;
    background: rgba(255, 255, 255, 0.96);
    color: #1d2438;
    border: 2px solid #3b6fd8;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(31, 42, 68, 0.25);
    cursor: pointer;
    word-break: keep-all;
  }
  /* 대화창 */
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
  .text.narr {
    color: #4a5670;
    padding-left: 10px;
    border-left: 3px solid #cfd7e5;
  }
  .btn {
    flex: none;
    min-height: 48px;
    border: 0;
    border-radius: 14px;
    font: inherit;
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
    background: #3b6fd8;
    color: #fff;
  }
  /* 컷 사이 검은 화면 */
  .black {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: #000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.45s ease;
  }
  .black.on {
    opacity: 1;
    pointer-events: auto;
  }
  @keyframes show {
    from {
      opacity: 0;
    }
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
  @keyframes stamp {
    from {
      opacity: 0;
      transform: translateX(-50%) scale(2) rotate(-8deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ltitle,
    .litems li,
    .lnote,
    .lnext,
    .big,
    .sub,
    .place,
    .who,
    .stamp,
    .choices,
    .text {
      animation: none;
    }
    .black {
      transition: none;
    }
  }
</style>
