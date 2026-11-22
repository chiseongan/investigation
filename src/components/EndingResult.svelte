<script lang="ts">
  // 엔딩 결과 화면: 배경 위에 엔딩 번호 → 제목 → 설명이 차례로 나타나고, 마지막에 버튼이 나온다.
  // 움직임은 투명도와 이동·크기 변화만 쓴다 (움직임 줄이기 설정이면 한꺼번에 보인다).
  import { ENDINGS } from '../data/endings';
  import { DAYS } from '../data/rooms';
  import type { GameState } from '../lib/gameState';
  import VNBackground from './VNBackground.svelte';

  let {
    gs,
    name,
    onNext,
    onRewind,
  }: { gs: GameState; name: string; onNext: () => void; onRewind: (dayIndex: number) => void } = $props();

  const verdict = $derived(gs.verdict!);
  const def = $derived(ENDINGS[verdict.ending]);
  const fill = (s: string) => s.replaceAll('{이름}', name);
  let rewinding = $state(false);

  // 엔딩의 분위기에 맞는 배경과 시각
  const scene = $derived(
    def.tone === 'good' ? { room: 'gate', t: 0.12 } : def.tone === 'mid' ? { room: 'hallway', t: 0.85 } : { room: 'classroom', t: 0.95 },
  );
  // 나타나는 순서: 번호 0.2s → 제목 0.8s → 설명 줄마다 0.7s 간격 → 이유 → 버튼
  const T_TITLE = 0.8;
  const T_BODY = 1.6;
  const GAP = 0.8;
  const tReason = $derived(T_BODY + def.summary.length * GAP);
  const tActions = $derived(tReason + (verdict.reasons.length || gs.shared ? 0.9 : 0.2));
</script>

<section class="result {def.tone}">
  <div class="bg" aria-hidden="true"><VNBackground room={scene.room} t={scene.t} /></div>
  <div class="veil" aria-hidden="true"></div>
  <div class="inner">
    <div class="badge" style:--d="0.2s">
      <span class="ring" aria-hidden="true"></span>
      <span class="no">{def.no}</span>
    </div>
    <p class="eyebrow seq" style:--d="0.5s">엔딩 {def.no} / 4</p>
    <h2 class="title" style:--d="{T_TITLE}s">{def.title}</h2>
    <div class="paper">
      {#each def.summary as p, i}
        <p class="body seq" style:--d="{T_BODY + i * GAP}s">{fill(p)}</p>
      {/each}
      {#if verdict.reasons.length}
        <div class="why seq" style:--d="{tReason}s">
          <h3>이렇게 되었어요</h3>
          <ul>{#each verdict.reasons as r}<li>{fill(r)}</li>{/each}</ul>
        </div>
      {/if}
      {#if gs.shared && verdict.ending !== 'participant'}
        <p class="warn seq" style:--d="{tReason + 0.4}s">수사 중 사진 공유 버튼을 누른 기록이 남아 있어요.</p>
      {/if}
    </div>
    <div class="actions seq" style:--d="{tActions}s">
      <button class="btn primary" onclick={onNext}>다음</button>
      {#if verdict.ending !== 'resolved'}
        <button class="btn ghost" onclick={() => (rewinding = !rewinding)}>{rewinding ? '되감기 닫기' : '시간을 되감는다'}</button>
      {/if}
      {#if rewinding}
        <div class="days">
          <p>어느 날 아침으로 돌아갈까요? 그 전에 모은 단서는 그대로 남아요.</p>
          {#each DAYS as d, i}
            {#if gs.snapshots[i]}<button class="btn day" onclick={() => onRewind(i)}>{d.label} 아침</button>{/if}
          {/each}
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  .result {
    --tone: #3b6fd8;
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background: #1f2a44;
  }
  .result.mid {
    --tone: #e8a33d;
  }
  .result.bad {
    --tone: #b23a48;
  }
  .bg {
    position: absolute;
    inset: 0;
    animation: drift 18s ease-in-out infinite alternate;
  }
  .veil {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(31, 42, 68, 0.55), rgba(31, 42, 68, 0.88));
  }
  .inner {
    position: relative;
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: calc(30px + env(safe-area-inset-top)) 20px calc(24px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  /* 엔딩 번호 배지: 동그라미가 커지며 자리 잡는다 */
  .badge {
    position: relative;
    flex: none;
    width: 64px;
    height: 64px;
    display: grid;
    place-items: center;
    animation: pop 0.7s cubic-bezier(0.2, 1.3, 0.4, 1) var(--d) both;
  }
  .ring {
    position: absolute;
    inset: 0;
    border: 4px solid var(--tone);
    border-radius: 50%;
    background: rgba(31, 42, 68, 0.6);
  }
  .no {
    position: relative;
    font-size: 30px;
    font-weight: 800;
    color: #fff;
  }
  .eyebrow {
    margin: 10px 0 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #cfd7e5;
  }
  .title {
    margin: 4px 0 14px;
    font-size: clamp(32px, 9vw, 42px);
    line-height: 1.2;
    text-align: center;
    color: #fff;
    text-shadow: 0 2px 14px rgba(0, 0, 0, 0.5);
    animation: title 0.9s cubic-bezier(0.2, 1, 0.3, 1) var(--d) both;
  }
  .title::after {
    content: '';
    display: block;
    width: 56px;
    height: 4px;
    margin: 10px auto 0;
    border-radius: 2px;
    background: var(--tone);
  }
  .paper {
    width: min(420px, 100%);
    padding: 14px 16px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .body {
    margin: 0;
    font-size: 16px;
    line-height: 1.65;
    color: #2d3858;
    word-break: keep-all;
  }
  .why {
    padding: 10px 12px;
    border-radius: 10px;
    background: #eef1f5;
  }
  .why h3 {
    margin: 0 0 4px;
    font-size: 14px;
    color: #1f2a44;
  }
  .why ul {
    margin: 0;
    padding-left: 18px;
    font-size: 14px;
    line-height: 1.55;
    color: #3a4560;
  }
  .warn {
    margin: 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: #fbe6e9;
    color: #b23a48;
    font-weight: 700;
    font-size: 14px;
  }
  .actions {
    width: min(420px, 100%);
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 18px;
  }
  .btn {
    min-height: 52px;
    border: 0;
    border-radius: 14px;
    font: inherit;
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
  }
  .primary {
    background: #3b6fd8;
    color: #fff;
  }
  .ghost {
    background: rgba(255, 255, 255, 0.95);
    color: #1f2a44;
  }
  .days {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .days p {
    margin: 0;
    font-size: 13px;
    color: #dbe3f5;
  }
  .day {
    background: #e4edff;
    color: #2a56b3;
    min-height: 48px;
  }
  .seq {
    animation: rise 0.6s ease-out var(--d) both;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
  }
  @keyframes title {
    from {
      opacity: 0;
      transform: scale(1.18);
    }
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.3);
    }
  }
  @keyframes drift {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(1.06);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .bg,
    .badge,
    .title,
    .seq {
      animation: none;
    }
  }
</style>
