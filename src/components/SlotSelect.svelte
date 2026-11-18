<script lang="ts">
  import { SLOT_LABEL, SLOT_ORDER, SCENES, ROOMS, availableSlots, type DayDef, type SlotId } from '../data/rooms';

  let {
    day,
    used,
    actionsLeft,
    onPick,
  }: { day: DayDef; used: SlotId[]; actionsLeft: number; onPick: (slot: SlotId, sceneId: string) => void } = $props();

  const slots = $derived(
    SLOT_ORDER.filter((s) => s in day.scenes).map((s) => [s, day.scenes[s]!] as [SlotId, string]),
  );
  const open = $derived(availableSlots(day, used));
</script>

<main class="screen">
  <p class="eyebrow">{day.label} · 남은 시간대 {actionsLeft}</p>
  <h2>어디를 관찰할까요?</h2>
  <p class="sub">시간은 순서대로 흘러요. 앞 시간대를 관찰해야 다음 시간대가 열려요. 한 번 지나간 시간대로는 돌아갈 수 없습니다.</p>
  <div class="list">
    {#each slots as [slot, sceneId]}
      {@const isUsed = used.includes(slot)}
      {@const locked = !isUsed && !open.includes(slot)}
      <button class="card" disabled={isUsed || locked} onclick={() => onPick(slot, sceneId)}>
        <strong>{SLOT_LABEL[slot]}</strong>
        <span>{locked ? '' : ROOMS[SCENES[sceneId].room].name}</span>
        {#if isUsed}<em>관찰 완료</em>{:else if locked}<em>잠김</em>{/if}
      </button>
    {/each}
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
    margin: 0 0 18px;
    font-size: 14px;
    color: #5b6781;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .card {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 64px;
    padding: 12px 16px;
    border: 2px solid #3b6fd8;
    border-radius: 14px;
    background: #fff;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .card strong {
    flex: 1;
    font-size: 18px;
    color: #1f2a44;
  }
  .card span {
    font-size: 14px;
    color: #5b6781;
  }
  .card em {
    font-size: 12px;
    font-style: normal;
    color: #fff;
    background: #8a94aa;
    padding: 2px 8px;
    border-radius: 999px;
  }
  .card:disabled {
    border-color: #cfd7e5;
    background: #e4e8ef;
    cursor: default;
  }
</style>
