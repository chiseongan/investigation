<script lang="ts">
  import DayTimer from './DayTimer.svelte';
  import type { DayClock } from '../lib/clock';

  let {
    dayNo,
    dayLabel,
    place,
    actionsLeft,
    slotTotal,
    clueCount,
    bump,
    clock,
    onNotebook,
  }: {
    dayNo: number;
    dayLabel: string;
    place: string;
    actionsLeft: number;
    slotTotal: number;
    clueCount: number;
    bump: number;
    clock: DayClock | null;
    onNotebook: () => void;
  } = $props();
</script>

<header class="hud">
  <div class="row">
    <div class="where">
      <strong>잠입 수사 {dayNo}일차</strong>
      <span>{dayLabel} · {place}</span>
    </div>
    <div class="dots" aria-label="남은 시간대 {actionsLeft}/{slotTotal}">
      {#each Array(slotTotal) as _, i}
        <i class:on={i < actionsLeft}></i>
      {/each}
    </div>
    <button class="notebook" onclick={onNotebook} aria-label="수사 수첩 열기">
      {#key bump}<span class="count">단서 {clueCount}</span>{/key}
    </button>
  </div>
  <DayTimer {clock} />
</header>

<style>
  .hud {
    flex: none;
    height: 72px;
    padding: 8px 12px 0;
    background: #1f2a44;
    color: #fff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
  }
  .where {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    font-size: 12px;
    color: #b9c4dc;
    line-height: 1.35;
  }
  .where strong {
    font-size: 15px;
    color: #fff;
  }
  .dots {
    display: flex;
    gap: 5px;
  }
  .dots i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid #5b6b91;
  }
  .dots i.on {
    background: #e8a33d;
    border-color: #e8a33d;
  }
  .notebook {
    min-width: 84px;
    min-height: 44px;
    padding: 0 12px;
    border: 2px solid #e8a33d;
    border-radius: 12px;
    background: transparent;
    color: #fff;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }
  .count {
    display: inline-block;
    animation: bump 0.45s ease-out;
  }
  @keyframes bump {
    30% {
      transform: scale(1.3);
    }
  }
</style>
