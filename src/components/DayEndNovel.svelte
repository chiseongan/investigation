<script lang="ts">
  // 대화형 하루 끝: 오늘 수첩에 적은 단서를 '나' 옆에 선택지처럼 띄우고, 눌러서 다시 확인해 볼 수 있다.
  import { clueById } from '../data/clues';
  import { SCENES, type DayDef } from '../data/rooms';
  import type { GameState } from '../lib/gameState';
  import { portrait } from '../assets/portraits';
  import VNBackground from './VNBackground.svelte';

  let {
    day,
    gs,
    hasNext,
    onNext,
    onReport,
    onNotebook,
  }: { day: DayDef; gs: GameState; hasNext: boolean; onNext: () => void; onReport: () => void; onNotebook: () => void } = $props();

  // svelte-ignore state_referenced_locally
  const got = gs.clues.map((id) => clueById(id)).filter((c) => !!c && c.day === day.id) as NonNullable<ReturnType<typeof clueById>>[];
  // 오늘 마지막으로 있던 장소를 배경으로. 단톡방은 그림이 없으므로 교실로 대신한다
  // svelte-ignore state_referenced_locally
  const lastScene = SCENES[Object.values(day.scenes).at(-1) ?? ''];
  const room = lastScene && lastScene.room !== 'chat' ? lastScene.room : 'classroom';

  let picked = $state<string | null>(null);
  const card = $derived(got.find((c) => c.id === picked) ?? null);
  // 나의 표정: 단서를 보면 생각하는 얼굴, 단서가 없으면 걱정스러운 얼굴
  const face = $derived(card ? 'thinking' : got.length ? 'determined' : 'concerned');
  const art = $derived(portrait('me', face));

  const pick = (id: string) => (picked = picked === id ? null : id);
</script>

<section class="vn">
  <div class="stage">
    <VNBackground {room} t={0.95} />
    <div class="blur" aria-hidden="true"></div>
    <p class="place">{day.label} · 오늘의 기록</p>
    <div class="cast">
      {#if art}
        <div class="who bust">
          <img src={art.src} alt="" draggable="false" />
        </div>
      {/if}
    </div>
    <!-- 단서는 '나' 옆에 선택지처럼 놓인다. 누르면 아래 대화창에 자세한 내용이 나온다 -->
    <div class="choices" role="group" aria-label="오늘 적은 단서">
      {#each got as c (c.id)}
        <button class="choice" class:on={picked === c.id} aria-pressed={picked === c.id} onclick={() => pick(c.id)}>
          <span class="type">{c.type}</span>
          <span class="title">{c.title}</span>
        </button>
      {/each}
      {#if !got.length}<p class="empty">오늘은 적어 둔 단서가 없다.</p>{/if}
    </div>
  </div>

  <div class="box">
    <div class="textwrap">
      {#if card}
        {#key card.id}
          <p class="eyebrow">{card.type}</p>
          <h3>{card.title}</h3>
          <p class="desc">{card.desc}</p>
        {/key}
      {:else}
        <p class="eyebrow">{day.label} 수사 종료</p>
        <p class="desc">{got.length ? `오늘 수첩에 적은 단서는 ${got.length}개다. 눌러서 다시 확인해 보자.` : '오늘은 수첩에 적은 단서가 없다. 내일은 더 살펴보자.'}</p>
      {/if}
    </div>
    <div class="actions">
      <button class="btn ghost" onclick={onNotebook}>수사 수첩 보기</button>
      {#if hasNext}
        <button class="btn primary" onclick={onNext}>다음 날로</button>
      {:else}
        <button class="btn primary" onclick={onReport}>최종 보고서 작성</button>
      {/if}
    </div>
  </div>
</section>

<style>
  .vn {
    --boxh: clamp(250px, calc(var(--app-h, 100dvh) * 0.38), 330px);
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
    container-type: inline-size;
  }
  .blur {
    position: absolute;
    inset: 0;
    backdrop-filter: blur(3px);
    background: rgba(31, 42, 68, 0.12);
    pointer-events: none;
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
    align-items: flex-end;
    min-height: 220px;
    padding: 0 0 14px;
  }
  /* 인물 그림: 상반신 위주, 아래쪽은 대화창 뒤로 (대화 화면과 같은 크기·자리) */
  .who {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-left: -4cqw;
    animation: appear 0.65s ease-out;
  }
  .who.bust {
    flex: 0 0 auto;
    --fh: calc(var(--app-h, 100dvh) - 64px - var(--boxh));
    --ih: min(calc(var(--fh) * 0.667), 62cqw);
    width: calc(var(--ih) * 0.72);
    margin-bottom: calc(var(--ih) * -0.07 - 14px);
  }
  .who img {
    width: auto;
    height: calc(var(--ih) * 1.154);
    max-width: none;
    display: block;
    pointer-events: none;
  }
  /* 단서 선택지: 나의 오른쪽 */
  .choices {
    position: absolute;
    right: 10px;
    top: 44px;
    bottom: 10px;
    width: min(56%, 280px);
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    overflow-y: auto;
    overscroll-behavior: contain;
    animation: rise 0.3s ease-out;
  }
  .choice {
    flex: none;
    min-height: 44px;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    font: inherit;
    text-align: left;
    background: rgba(255, 255, 255, 0.96);
    color: #1d2438;
    border: 2px solid #e8a33d;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(31, 42, 68, 0.25);
    cursor: pointer;
  }
  .choice.on {
    background: #fff8ec;
    border-color: #3b6fd8;
  }
  .type {
    font-size: 12px;
    font-weight: 700;
    color: #b8741a;
  }
  .title {
    font-size: 15px;
    font-weight: 700;
    overflow-wrap: anywhere;
    word-break: keep-all;
  }
  .empty {
    margin: 0;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    color: #5b6781;
  }
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
  .textwrap {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .eyebrow {
    margin: 0 0 2px;
    font-size: 13px;
    font-weight: 700;
    color: #b8741a;
  }
  h3 {
    margin: 0 0 4px;
    font-size: 18px;
    color: #1f2a44;
  }
  .desc {
    margin: 0;
    font-size: 16px;
    line-height: 1.55;
    color: #1d2438;
    overflow-wrap: anywhere;
    word-break: keep-all;
    animation: rise 0.22s ease-out;
  }
  .actions {
    flex: none;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .btn {
    min-height: 48px;
    border: 0;
    border-radius: 14px;
    font: inherit;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
  }
  .primary {
    background: #3b6fd8;
    color: #fff;
  }
  .ghost {
    background: #fff;
    color: #1f2a44;
    border: 2px solid #cfd7e5;
  }
  @keyframes appear {
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
  @media (prefers-reduced-motion: reduce) {
    .who,
    .choices,
    .desc {
      animation: none;
    }
  }
  /* 태블릿·노트북 가로 화면: 화면 가득, 인물과 대화창만 가운데 영역에 모은다 */
  @media (min-width: 900px) and (min-aspect-ratio: 11/10) {
    .cast {
      padding-inline: max(12px, calc((100% - 1100px) / 2));
    }
    .box {
      padding-inline: max(16px, calc((100% - 880px) / 2));
    }
    .place {
      left: max(12px, calc((100% - 1100px) / 2));
      font-size: 15px;
    }
  }
</style>

