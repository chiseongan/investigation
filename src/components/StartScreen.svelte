<script lang="ts">
  // 시작 화면 + 수사관 임명(브리핑, 규칙 1장)
  import { DAY_SECONDS } from '../data/config';
  import type { Mode } from '../lib/gameState';
  import { portrait } from '../assets/portraits';
  import VNBackground from './VNBackground.svelte';

  let {
    phase,
    canResume = false,
    onResume = () => {},
    onNew,
    onBegin,
  }: { phase: 'title' | 'briefing'; canResume?: boolean; onResume?: () => void; onNew: () => void; onBegin: (mode: Mode) => void } = $props();

  // 타이틀 화면: 왼편에 나만 서고, 오른편에는 수사 기록지가 놓인다
  // x: 가로 위치(%), h: 그림 높이(화면 폭 대비 %), up: 위로 올림(%)
  const CROWD = [
    { key: 'me', face: 'warm', x: 27, h: 86, up: 0 },
  ].flatMap((c, i) => {
    const p = portrait(c.key, c.face);
    return p ? [{ ...c, src: p.src, i, dim: false, apart: false }] : [];
  });
</script>

<main class="screen" class:title={phase === 'title'} class:brief={phase === 'briefing'}>
  {#if phase === 'title'}
    <div class="bg" aria-hidden="true"><VNBackground room="gate" t={0.1} /></div>
    <div class="shade" aria-hidden="true"></div>
    <div class="head">
      <p class="eyebrow">학교 안전 수사관</p>
      <h1>잠입 수사<br /><small>1학년 1반의 일주일</small></h1>
      <p class="sub">이 이야기의 학교와 인물은 모두 가상입니다.</p>
    </div>
    <!-- 교문 앞: 왼쪽에 나, 오른쪽에 수사 기록지 -->
    <div class="crowd">
      {#each CROWD as c (c.key)}
        <img
          class="fig"
          class:dim={c.dim}
          class:apart={c.apart}
          src={c.src}
          alt=""
          draggable="false"
          style:--x="{c.x}%"
          style:--h={c.h}
          style:--up={c.up}
          style:--d="{0.15 + c.i * 0.12}s"
        />
      {/each}
      <div class="file rec">
        <p class="tab">수사 기록지 · 1학년 1반</p>
        <dl class="rows">
          <div><dt>접수</dt><dd>익명 제보</dd></div>
          <div><dt>대상</dt><dd>1학년 1반 (가상)</dd></div>
          <div><dt>담당</dt><dd>전학생으로 위장한 수사관</dd></div>
          <div><dt>기간</dt><dd>월요일 ~ 금요일</dd></div>
        </dl>
        <p class="memo">“누군가 괴롭힘을 당하고 있다. 누가, 어떻게인지는 모른다.”</p>
        <span class="stamp">제보 접수</span>
      </div>
    </div>
    <div class="actions">
      {#if canResume}<button class="btn primary" onclick={onResume}>이어서 하기</button>{/if}
      <button class="btn" class:primary={!canResume} class:ghost={canResume} onclick={onNew}>새 수사 시작</button>
      <p class="fine">소리 없음 · 로그인 없음 · 개인정보를 수집하지 않아요{canResume ? ' · 이어하기는 이 탭에만 남아요' : ''}</p>
    </div>
  {:else}
    <div class="bg" aria-hidden="true"><VNBackground room="gate" t={0.1} /></div>
    <div class="shade heavy" aria-hidden="true"></div>
    <div class="center left">
      <p class="eyebrow">수사관 임명</p>
      <h2>제보가 들어왔습니다</h2>
      <div class="file big">
        <p class="tab">사건 파일 · 1학년 1반</p>
        <p class="memo">“1반에서 누군가 괴롭힘을 당하고 있다.”<br />누가, 어떻게인지는 모른다.</p>
        <span class="stamp">제보 접수</span>
      </div>
      <p class="order">당신은 교육청이 보낸 학교 안전 수사관입니다. 1학년 1반에 <b>전학생</b>으로 위장해 잠입하세요. 월요일부터 목요일까지 관찰하고, 금요일에 최종 보고를 합니다.</p>
      <div class="rules paper">
        <h3>수사 규칙</h3>
        <ul>
          <li>하루는 등교, 쉬는 시간, 점심처럼 아침부터 차례로 흘러가요. 탐색형은 앞 시간대를 관찰해야 다음이 열리고, 대화형은 자동으로 이어집니다.</li>
          <li>탐색형은 하루가 약 <b>{Math.round(DAY_SECONDS / 60)}분</b>이고, 종이 울리면 하루가 끝납니다.</li>
          <li>탐색형은 바닥을 탭해 이동하고 인물 옆에서, 대화형은 시간이 흐르며 마주치는 인물들과 차례로 대화합니다. 이야기와 단서는 같아요.</li>
          <li>어떻게 말을 걸지는 <b>스스로 판단</b>하세요. 표시나 점수는 없습니다. 사람들은 당신의 말과 태도에 따라 반응할 거예요.</li>
          <li>거칠어 보여도 장난일 수 있고, 평범해 보여도 신호일 수 있어요. 신중하게 판단하세요.</li>
        </ul>
      </div>
    </div>
    <div class="actions">
      <button class="btn primary" onclick={() => onBegin('explore')}>
        탐색형으로 시작<small>교실을 걸어 다니며 인물에게 다가가요</small>
      </button>
      <button class="btn primary alt" onclick={() => onBegin('novel')}>
        대화형으로 시작<small>시간이 흐르며 만나는 사람들과 차례로 대화해요</small>
      </button>
    </div>
  {/if}
</main>

<style>
  .screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 28px 22px calc(22px + env(safe-area-inset-bottom));
    background: #1f2a44;
    color: #fff;
    overflow-y: auto;
  }
  /* 타이틀: 교문 배경 + 인물 구도 + 아래 남색 판 */
  .screen.title {
    position: relative;
    padding: 0;
    overflow: hidden;
  }
  .bg {
    position: absolute;
    inset: 0;
  }
  .shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(31, 42, 68, 0.92) 0%, rgba(31, 42, 68, 0.55) 32%, rgba(31, 42, 68, 0.05) 55%, rgba(31, 42, 68, 0) 100%);
    pointer-events: none;
  }
  /* 수사관 임명: 같은 교문 배경 위에 서류 느낌 */
  .screen.brief {
    position: relative;
    padding: 0;
    overflow: hidden;
  }
  .shade.heavy {
    background: linear-gradient(180deg, rgba(31, 42, 68, 0.9), rgba(31, 42, 68, 0.78) 60%, rgba(31, 42, 68, 0.9));
  }
  .screen.brief .center {
    position: relative;
    z-index: 1;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: calc(26px + env(safe-area-inset-top)) 22px 14px;
  }
  .file.big {
    width: min(340px, 92%);
    margin: 10px 0 6px;
  }
  .file.big .memo {
    font-size: 15px;
  }
  .order {
    margin: 4px 0 0;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
  }
  .rules.paper {
    background: #f4edda;
    color: #1f2a44;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }
  .rules.paper h3 {
    color: #b23a48;
  }
  .rules.paper ul {
    color: #1f2a44;
  }
  .head {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: calc(30px + env(safe-area-inset-top)) 22px 0;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
  }
  .head h1 {
    font-size: 46px;
  }
  .file {
    position: relative;
    align-self: flex-start;
    width: min(300px, 82%);
    margin-top: 6px;
    padding: 20px 14px 12px;
    background: #f4edda;
    color: #1f2a44;
    border-radius: 4px 4px 8px 4px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
    transform: rotate(-1.5deg);
    text-shadow: none;
    animation: slidein 0.6s ease-out 0.1s both;
  }
  /* 테이프 */
  .file::before {
    content: '';
    position: absolute;
    top: -9px;
    left: 50%;
    width: 64px;
    height: 18px;
    margin-left: -32px;
    background: rgba(232, 163, 61, 0.55);
    transform: rotate(2deg);
  }
  .tab {
    position: absolute;
    top: 6px;
    left: 14px;
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #8a6a2a;
  }
  .memo {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    font-weight: 600;
  }
  .stamp {
    position: absolute;
    right: -8px;
    bottom: -14px;
    padding: 4px 10px;
    border: 3px solid #b23a48;
    border-radius: 6px;
    background: rgba(244, 237, 218, 0.7);
    color: #b23a48;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.08em;
    transform: rotate(-9deg);
    animation: stamp 0.35s cubic-bezier(0.2, 1.4, 0.4, 1) 1s both;
  }
  /* 오른편 수사 기록지 */
  .file.rec {
    position: absolute;
    right: 12px;
    bottom: 5cqw;
    width: calc(50% - 8px);
    margin: 0;
    padding: 22px 12px 14px;
    z-index: 1;
  }
  .rows {
    margin: 0 0 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    line-height: 1.35;
  }
  .rows div {
    display: flex;
    gap: 6px;
    padding-bottom: 3px;
    border-bottom: 1px dashed rgba(31, 42, 68, 0.3);
  }
  .rows dt {
    flex: none;
    width: 2.2em;
    font-weight: 800;
    color: #8a6a2a;
  }
  .rows dd {
    margin: 0;
    font-weight: 600;
    overflow-wrap: anywhere;
    word-break: keep-all;
  }
  .file.rec .memo {
    font-size: 12.5px;
    font-weight: 500;
    color: #3a4560;
  }
  @keyframes slidein {
    from {
      opacity: 0;
      transform: translateY(10px) rotate(-1.5deg);
    }
  }
  @keyframes stamp {
    from {
      opacity: 0;
      transform: scale(1.8) rotate(-9deg);
    }
  }
  .crowd {
    position: relative;
    z-index: 1;
    flex: 1;
    min-height: 120px;
    container-type: size;
    overflow: hidden;
  }
  .fig {
    position: absolute;
    left: var(--x);
    /* 그림 아래 10%는 아래 판 뒤로 가려 상반신만 보인다 */
    height: min(calc(var(--h) * 1cqw), 128cqh);
    bottom: calc(var(--up) * 1cqw - 0.1 * min(calc(var(--h) * 1cqw), 128cqh));
    width: auto;
    max-width: none;
    transform: translateX(-50%);
    pointer-events: none;
    animation: gather 0.7s ease-out both;
    animation-delay: var(--d);
  }
  .fig.dim {
    filter: brightness(0.9);
  }
  .fig.apart {
    filter: saturate(0.75) brightness(0.92);
  }
  @keyframes gather {
    from {
      opacity: 0;
    }
  }
  .screen.title .actions,
  .screen.brief .actions {
    position: relative;
    z-index: 2;
    padding: 18px 22px calc(18px + env(safe-area-inset-bottom));
    background: linear-gradient(180deg, rgba(31, 42, 68, 0.88), #1f2a44 40%);
    box-shadow: 0 -10px 24px rgba(31, 42, 68, 0.6);
  }
  @media (prefers-reduced-motion: reduce) {
    .fig,
    .file,
    .stamp {
      animation: none;
    }
  }
  .center {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 12px;
  }
  .center.left {
    justify-content: flex-start;
    line-height: 1.6;
  }
  .eyebrow {
    margin: 0;
    font-size: 14px;
    letter-spacing: 0.08em;
    color: #e8a33d;
    font-weight: 700;
  }
  h1 {
    margin: 0;
    font-size: 44px;
    line-height: 1.15;
  }
  h1 small {
    font-size: 20px;
    font-weight: 500;
    color: #b9c4dc;
  }
  h2 {
    margin: 0;
    font-size: 26px;
  }
  .sub,
  .fine {
    margin: 0;
    font-size: 13px;
    color: #9aa8c6;
  }
  .rules {
    background: #2a3757;
    border-radius: 14px;
    padding: 14px 16px;
  }
  .rules h3 {
    margin: 0 0 6px;
    font-size: 15px;
    color: #e8a33d;
  }
  .rules ul {
    margin: 0;
    padding-left: 18px;
    font-size: 14px;
    color: #dbe3f5;
  }
  .rules li + li {
    margin-top: 4px;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    padding-top: 14px;
  }
  .btn {
    width: 100%;
    min-height: 52px;
    border: 0;
    border-radius: 14px;
    font: inherit;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
  }
  .primary {
    background: #3b6fd8;
    color: #fff;
  }
  .primary.alt {
    background: #2a3757;
    border: 2px solid #3b6fd8;
  }
  .btn small {
    display: block;
    margin-top: 2px;
    font-size: 13px;
    font-weight: 500;
    color: #dbe3f5;
  }
  .ghost {
    background: transparent;
    color: #dbe3f5;
    border: 2px solid #5b6b91;
  }
</style>
