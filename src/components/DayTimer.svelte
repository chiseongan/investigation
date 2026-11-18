<script lang="ts">
  // 하루 타이머 막대. 매 프레임 transform(scaleX)만 직접 갱신하고, 숫자는 초가 바뀔 때만 갱신한다.
  import type { DayClock } from '../lib/clock';

  let { clock }: { clock: DayClock | null } = $props();
  let bar: HTMLDivElement | undefined = $state();
  let label: HTMLSpanElement | undefined = $state();

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  $effect(() => {
    if (!clock) return;
    let lastSec = -1;
    return clock.onFrame((frac, remain) => {
      if (bar) {
        bar.style.transform = `scaleX(${1 - frac})`;
        bar.classList.toggle('low', remain <= 30);
      }
      if (label && remain !== lastSec) {
        lastSec = remain;
        label.textContent = fmt(remain);
      }
    });
  });
</script>

<div class="timer" aria-label="오늘 남은 시간">
  <div class="track"><div class="bar" bind:this={bar}></div></div>
  <span class="label" bind:this={label}>5:00</span>
</div>

<style>
  .timer {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 16px;
  }
  .track {
    flex: 1;
    height: 5px;
    border-radius: 3px;
    background: #34456d;
    overflow: hidden;
  }
  .bar {
    height: 100%;
    background: #e8a33d;
    transform-origin: left center;
    will-change: transform;
  }
  :global(.bar.low) {
    background: #b23a48;
  }
  .label {
    font-size: 11px;
    color: #b9c4dc;
    font-variant-numeric: tabular-nums;
    min-width: 28px;
    text-align: right;
  }
</style>
