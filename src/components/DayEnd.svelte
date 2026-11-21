<script lang="ts">
  import { clueById } from '../data/clues';
  import type { DayDef } from '../data/rooms';
  import type { GameState } from '../lib/gameState';

  let {
    day,
    gs,
    hasNext,
    onNext,
    onReport,
    onNotebook,
  }: { day: DayDef; gs: GameState; hasNext: boolean; onNext: () => void; onReport: () => void; onNotebook: () => void } = $props();

  const got = $derived(gs.clues.map((id) => clueById(id)).filter((c) => c && c.day === day.id));
</script>

<main class="screen">
  <p class="eyebrow">{day.label} 수사 종료</p>
  <h2>오늘의 기록</h2>
  <p class="sub">오늘 수첩에 적은 단서 {got.length}개</p>
  <ul class="clues">
    {#each got as c}<li><span>{c?.type}</span> {c?.title}</li>{/each}
    {#if !got.length}<li class="empty">오늘은 기록한 단서가 없어요.</li>{/if}
  </ul>
  <div class="actions">
    <button class="btn ghost" onclick={onNotebook}>수사 수첩 보기</button>
    {#if hasNext}
      <button class="btn primary" onclick={onNext}>다음 날로</button>
    {:else}
      <button class="btn primary" onclick={onReport}>최종 보고서 작성</button>
    {/if}
  </div>
</main>

<style>
  .screen {
    flex: 1;
    padding: 28px 18px calc(22px + env(safe-area-inset-bottom));
    overflow-y: auto;
  }
  .eyebrow {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: #b8741a;
  }
  h2 {
    margin: 6px 0 4px;
    font-size: 26px;
    color: #1f2a44;
  }
  .sub {
    margin: 12px 0 6px;
    font-size: 14px;
    color: #5b6781;
  }
  .clues {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .clues li {
    background: #fff;
    border-left: 4px solid #e8a33d;
    border-radius: 10px;
    padding: 10px 12px;
    font-weight: 600;
    color: #1f2a44;
  }
  .clues li span {
    font-size: 12px;
    color: #b8741a;
    margin-right: 6px;
  }
  .clues .empty {
    border-left-color: #cfd7e5;
    color: #5b6781;
    font-weight: 400;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 22px;
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
    background: #fff;
    color: #1f2a44;
    border: 2px solid #cfd7e5;
  }
</style>
