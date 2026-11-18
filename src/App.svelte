<script lang="ts">
  import Hud from './components/Hud.svelte';
  import Scene from './components/Scene.svelte';
  import Messenger from './components/Messenger.svelte';
  import { resetSessions } from './lib/session';
  import StartScreen from './components/StartScreen.svelte';
  import SlotSelect from './components/SlotSelect.svelte';
  import DayEnd from './components/DayEnd.svelte';
  import Notebook from './components/Notebook.svelte';
  import { DAY_SECONDS } from './data/config';
  import { DAYS, ROOMS, SCENES, SLOT_LABEL } from './data/rooms';
  import { DayClock } from './lib/clock';
  import { enterScene, endDay, game, leaveScene, newGame, nextDay, startDay } from './lib/gameState';

  let clock: DayClock | null = $state(null);
  let busy = $state(false); // 대사·선택 중에는 타이머 정지
  let notebookOpen = $state(false);
  let bell = $state(false);
  let sceneKey = $state(0);

  const day = $derived(DAYS[$game.dayIndex]);
  const scene = $derived($game.sceneId ? SCENES[$game.sceneId] : null);
  const place = $derived(
    $game.phase === 'scene' && scene
      ? `${SLOT_LABEL[scene.slot]} · ${ROOMS[scene.room].name}`
      : $game.phase === 'slot'
        ? '시간대 선택'
        : '하루 종료',
  );
  const hasNext = $derived(!!DAYS[$game.dayIndex + 1] && Object.keys(DAYS[$game.dayIndex + 1].scenes).length > 0);

  function beginDay(first: boolean) {
    clock?.stop();
    bell = false;
    busy = false;
    if (first) startDay();
    else nextDay();
    clock = new DayClock(DAY_SECONDS, () => {
      bell = true;
    });
  }

  function restart() {
    clock?.stop();
    clock = null;
    resetSessions();
    bell = false;
    busy = false;
    notebookOpen = false;
    newGame();
    game.update((g) => ({ ...g, phase: 'title' }));
  }

  function pause(p: boolean) {
    clock?.setPaused(p);
  }
  $effect(() => {
    pause(!($game.phase === 'scene' && !busy && !notebookOpen && !bell));
  });

  function closeBell() {
    bell = false;
    clock?.stop();
    endDay();
  }
  function finishScene() {
    busy = false;
    leaveScene();
    if ($game.phase === 'dayEnd') clock?.stop();
  }

  // 단서 수가 바뀔 때 HUD 숫자 튀는 연출 트리거
  const bump = $derived($game.clues.length);
</script>

<div class="app">
  {#if $game.phase === 'title' || $game.phase === 'briefing'}
    <StartScreen
      phase={$game.phase}
      onNew={() => {
        resetSessions();
        newGame();
      }}
      onBegin={() => beginDay(true)}
    />
  {:else}
    <Hud
      dayNo={$game.dayIndex + 1}
      dayLabel={day.label}
      {place}
      actionsLeft={$game.actionsLeft}
      slotTotal={Object.keys(day.scenes).length}
      clueCount={$game.clues.length}
      {bump}
      {clock}
      onNotebook={() => (notebookOpen = true)}
    />
    {#if $game.phase === 'slot'}
      <SlotSelect
        {day}
        used={$game.slotsUsed}
        actionsLeft={$game.actionsLeft}
        onPick={(slot, id) => {
          sceneKey++;
          enterScene(slot, id);
        }}
      />
    {:else if $game.phase === 'scene' && $game.sceneId}
      {#key sceneKey}
        {#if scene?.kind === 'messenger'}
          <Messenger sceneId={$game.sceneId} knot={scene.knot ?? ''} dayId={day.id} onExit={finishScene} onBusy={(b) => (busy = b)} />
        {:else}
          <Scene sceneId={$game.sceneId} dayId={day.id} onFinish={finishScene} onBusy={(b) => (busy = b)} />
        {/if}
      {/key}
    {:else if $game.phase === 'dayEnd'}
      <DayEnd {day} gs={$game} {hasNext} onNext={() => beginDay(false)} onNotebook={() => (notebookOpen = true)} onRestart={restart} />
    {/if}
  {/if}

  {#if notebookOpen}
    <Notebook gs={$game} onClose={() => (notebookOpen = false)} />
  {/if}

  {#if bell}
    <div class="bell" role="alertdialog" aria-label="종이 울렸습니다">
      <div class="bellcard">
        <div class="ring" aria-hidden="true"></div>
        <h2>땡땡땡 — 종이 울렸어요</h2>
        <p>오늘의 수사 시간이 끝났습니다.</p>
        <button onclick={closeBell}>하루 마무리</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .app {
    position: relative;
    width: 100%;
    max-width: 430px;
    height: 100dvh;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    background: #eef1f5;
    overflow: hidden;
  }
  .bell {
    position: absolute;
    inset: 0;
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(31, 42, 68, 0.7);
  }
  .bellcard {
    width: 100%;
    padding: 24px 20px;
    border-radius: 18px;
    background: #fff;
    text-align: center;
    animation: drop 0.3s ease-out;
  }
  .bellcard h2 {
    margin: 10px 0 4px;
    font-size: 22px;
    color: #b23a48;
  }
  .bellcard p {
    margin: 0 0 16px;
    color: #4a5670;
  }
  .bellcard button {
    width: 100%;
    min-height: 52px;
    border: 0;
    border-radius: 14px;
    background: #3b6fd8;
    color: #fff;
    font: inherit;
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
  }
  .ring {
    width: 36px;
    height: 36px;
    margin: 0 auto;
    border-radius: 50%;
    border: 4px solid #e8a33d;
    animation: shake 0.5s ease-in-out infinite;
  }
  @keyframes shake {
    25% {
      transform: rotate(14deg);
    }
    75% {
      transform: rotate(-14deg);
    }
  }
  @keyframes drop {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
</style>
