<script lang="ts">
  // 시작 인트로: 교문 앞. 왼쪽에 나, 한 줄씩 넘기며 전학생 연기를 연습하고 들어간다.
  import { INTRO } from '../data/intro';
  import { MANIFEST } from '../assets/manifest';
  import { portrait } from '../assets/portraits';
  import VNBackground from './VNBackground.svelte';

  let { onDone }: { onDone: () => void } = $props();

  let i = $state(0);
  const line = $derived(INTRO[i]);
  const last = $derived(i + 1 >= INTRO.length);
  // 인물 그림이 있으면 그 그림. 전학생 연기를 하는 대사에서는 웃는 얼굴을 쓴다
  const fallback = MANIFEST.me.sheets.idle.src;
  const art = $derived(portrait('me', line.who === 'me' ? 'smile' : 'default') ?? { src: fallback, ratio: null });

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
      <div class="who" class:bust={!!art.ratio} style:--ar={art.ratio} class:front={line.who === 'me'}>
        <img src={art.src} alt="" draggable="false" />
        {#if !art.ratio}<span class="tag">나</span>{/if}
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
    --boxh: clamp(230px, calc(var(--app-h, 100dvh) * 0.34), 300px);
    --figh: calc(var(--app-h, 100dvh) - 64px - var(--boxh) - 52px);
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
  /* 인물 그림이 있는 인물: 상반신 위주로 보여 주고, 아래쪽은 대화창 뒤로 내려 숨긴다.
     그림은 인물 전체 높이의 약 2/3만 담겨 있다. 무대 높이만큼의 전신을 기준으로 크기를 잡는다. */
  .who.bust {
    flex: 0 0 auto;
    --fh: calc(var(--app-h, 100dvh) - 64px - var(--boxh));
    --ih: calc(var(--fh) * 0.667);
    /* 그림 아래 7%는 무대 밖으로 내려 가린다. 무대 아래쪽 여백(14px)만큼도 더 내린다 */
    margin-bottom: calc(var(--ih) * -0.07 - 14px);
  }
  .who.bust img {
    width: auto;
    height: calc(var(--ih) * 1.154);
    max-width: none;
  }
  .who img {
    width: 100%;
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
  /* 태블릿·노트북 가로 화면: 화면 가득, 인물과 대화창만 가운데 영역에 모은다 */
  @media (min-width: 900px) and (min-aspect-ratio: 11/10) {
    .intro {
      --boxh: clamp(200px, calc(var(--app-h, 100dvh) * 0.27), 250px);
    }
    .cast {
      padding-inline: max(12px, calc((100% - 960px) / 2));
    }
    .box {
      padding-inline: max(16px, calc((100% - 880px) / 2));
    }
    .text {
      font-size: 20px;
    }
    .place {
      left: max(12px, calc((100% - 960px) / 2));
      font-size: 15px;
    }
  }
</style>

