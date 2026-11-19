<script lang="ts">
  // 시작 인트로: 교문 앞. 왼쪽에 나, 한 줄씩 넘기며 전학생 연기를 연습하고 들어간다.
  import { INTRO } from '../data/intro';
  import { MANIFEST } from '../assets/manifest';
  import VNBackground from './VNBackground.svelte';

  let { onDone }: { onDone: () => void } = $props();

  let i = $state(0);
  const line = $derived(INTRO[i]);
  const last = $derived(i + 1 >= INTRO.length);
  const me = MANIFEST.me.sheets.idle.src;

  function next() {
    if (last) onDone();
    else i++;
  }
</script>

<section class="intro">
  <div class="stage">
    <VNBackground room="gate" t={0} />
    <p class="place">교문 앞 · 월요일 아침</p>
    <div class="cast">
      <div class="who" class:front={line.who === 'me'}>
        <img src={me} alt="" draggable="false" />
        <span class="tag">나</span>
      </div>
    </div>
  </div>

  <div class="box">
    <div class="namerow">{#if line.who === 'me'}<p class="name">나</p>{/if}</div>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="textwrap" onclick={next}>
      {#key i}
        <p class="text" class:narr={!line.who}>{line.text}</p>
      {/key}
    </div>
    <div class="foot">
      <button class="skip" onclick={onDone}>건너뛰기</button>
      <button class="btn next" onclick={next}>{last ? '수사 시작' : '다음'}</button>
    </div>
  </div>
</section>

<style>
  .intro {
    --boxh: clamp(300px, 48dvh, 400px);
    --figh: calc(100dvh - 64px - var(--boxh) - 52px);
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .stage {
    position: relative;
    flex: 1;
    min-height: 160px;
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
  .cast {
    position: relative;
    display: flex;
    align-items: flex-end;
    min-height: 220px;
    padding: 0 12px 14px;
  }
  .who {
    flex: 0 1 140px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.2s;
    animation: appear 0.65s ease-out;
  }
  .who.front {
    transform: translateY(-8px);
  }
  .who img {
    width: 100%;
    max-width: calc(var(--figh) * 0.5714);
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
  }
  @keyframes appear {
    from {
      opacity: 0;
    }
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
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
  .foot {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .skip {
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    background: none;
    color: #5b6781;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
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
  .next {
    min-width: 96px;
    background: #1f2a44;
    color: #fff;
  }
  @media (prefers-reduced-motion: reduce) {
    .who,
    .text {
      animation: none;
    }
  }
</style>
