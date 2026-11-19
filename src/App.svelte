<script lang="ts">
  import Hud from './components/Hud.svelte';
  import Scene from './components/Scene.svelte';
  import Messenger from './components/Messenger.svelte';
  import Report from './components/Report.svelte';
  import Ending from './components/Ending.svelte';
  import { resetSessions, resetSessionsFrom } from './lib/session';
  import StartScreen from './components/StartScreen.svelte';
  import SlotSelect from './components/SlotSelect.svelte';
  import DayEnd from './components/DayEnd.svelte';
  import Notebook from './components/Notebook.svelte';
  import { DAY_SECONDS } from './data/config';
  import { DAYS, ROOMS, SCENES, SLOT_LABEL, SLOT_ORDER, availableSlots, type SlotId } from './data/rooms';
  import { get } from 'svelte/store';
  import { DayClock } from './lib/clock';
  import VNScene from './components/VNScene.svelte';
  import Intro from './components/Intro.svelte';
  import { enterScene, endDay, game, leaveScene, newGame, nextDay, openReport, rewindTo, setMode, startDay, submitReport } from './lib/gameState';
  import { clearSave, readSave, startAutosave } from './lib/save';
  import { importSessions } from './lib/session';
  import { onMount } from 'svelte';

  // 같은 탭에서 새로고침했다면 이어서 할 수 있다 (sessionStorage, 탭을 닫으면 사라짐)
  let saved = $state(readSave());
  onMount(() => startAutosave());

  function resume() {
    const s = saved;
    if (!s) return;
    saved = null;
    importSessions(s.ink);
    game.set({ ...s.game, mode: s.game.mode ?? 'explore' });
    // 장면 도중이었다면 그 시간대는 마친 것으로 보고 다음으로
    if ($game.phase === 'scene') leaveScene();
    bell = false;
    busy = false;
    if ($game.phase === 'slot') {
      clock = new DayClock(DAY_SECONDS, () => {
        bell = true;
      });
    }
    autoEnter();
  }

  function discardSave() {
    saved = null;
    clearSave();
  }

  let clock: DayClock | null = $state(null);
  let busy = $state(false); // 대사·선택 중에는 타이머 정지
  let notebookOpen = $state(false);
  let bell = $state(false);
  let sceneKey = $state(0);
  let intro = $state(false); // 시작 인트로(교문 앞) 보는 중

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

  /** 대화형: 시간대를 고르지 않고 이른 시간부터 자동으로 다음 장면에 들어간다. */
  function autoEnter() {
    const g = get(game);
    if (g.mode !== 'novel' || g.phase !== 'slot') return;
    const d = DAYS[g.dayIndex];
    const slot = availableSlots(d, g.slotsUsed)[0];
    if (!slot) return;
    sceneKey++;
    enterScene(slot, d.scenes[slot]!);
  }

  function beginDay(first: boolean) {
    clock?.stop();
    bell = false;
    busy = false;
    if (first) startDay();
    else nextDay();
    clock = new DayClock(DAY_SECONDS, () => {
      bell = true;
    });
    autoEnter();
  }

  /** 되감기: 고른 요일 아침으로. 그 전 요일에 모은 단서는 남는다. */
  function rewind(dayIndex: number) {
    clock?.stop();
    bell = false;
    busy = false;
    notebookOpen = false;
    resetSessionsFrom(dayIndex);
    rewindTo(dayIndex);
    clock = new DayClock(DAY_SECONDS, () => {
      bell = true;
    });
    autoEnter();
  }

  function restart() {
    clock?.stop();
    clock = null;
    resetSessions();
    discardSave();
    intro = false;
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

  // 시간이나 장소가 바뀔 때: 화면이 검게 덮였다가 새 장면이 되어 돌아온다 (투명도만 바뀐다)
  // 같은 장소 안에서 대화만 바뀔 때는 짧게, 시간·장소·요일이 바뀔 때는 길게 하면서 어디로 가는지 글로 알려 준다
  type Caption = { title: string; sub?: string };
  let curtain = $state(false);
  let caption = $state<Caption | null>(null);
  let curtainTimer: ReturnType<typeof setTimeout> | undefined;
  let captionTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => {
    clearTimeout(curtainTimer);
    clearTimeout(captionTimer);
  });
  const CURTAIN_MS = 700;
  // 안내 문구: 검은 화면이 된 뒤 조금 있다가 나타나고, 막이 걷히기 전에 빨리 사라진다
  const CAPTION_IN_MS = 700; // 문구가 나타나기 시작하는 때
  const CAPTION_OUT_MS = 2100; // 문구가 사라지기 시작하는 때
  const CAPTION_MS = 2400; // 검은 화면이 걷히기 시작하는 때
  let capShow = $state(false);
  /** 어느 요일 어느 시간대의 장면으로 가는지 안내 문구 */
  function placeCaption(dayIndex: number, slot: SlotId, newDay = false): Caption | undefined {
    const d = DAYS[dayIndex];
    const id = d?.scenes[slot];
    const sc = id ? SCENES[id] : null;
    if (!d || !sc) return newDay && d ? { title: d.label } : undefined;
    const where = `${ROOMS[sc.room].name} · ${SLOT_LABEL[slot]}`;
    return newDay ? { title: d.label, sub: where } : { title: ROOMS[sc.room].name, sub: SLOT_LABEL[slot] };
  }
  function withCurtain(action: () => void, cap?: Caption) {
    if (curtain) {
      // 이미 전환 중이면 끝난 뒤에 다시 시도한다 (장면이 막 열린 순간 바로 넘어가야 하는 경우)
      curtainTimer = setTimeout(() => withCurtain(action, cap), 150);
      return;
    }
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      action();
      return;
    }
    curtain = true;
    clearTimeout(captionTimer);
    caption = cap ?? null;
    capShow = false;
    if (cap) {
      captionTimer = setTimeout(() => {
        capShow = true;
        captionTimer = setTimeout(() => (capShow = false), CAPTION_OUT_MS - CAPTION_IN_MS);
      }, CAPTION_IN_MS);
    }
    curtainTimer = setTimeout(
      () => {
        action();
        // 새 화면이 그려진 다음에 막을 걷는다
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            curtain = false;
            // 막이 걷히는 동안 글자가 먼저 사라지지 않게 잠시 뒤에 지운다
            captionTimer = setTimeout(() => (caption = null), 800);
            capShow = false;
          }),
        );
      },
      cap ? CAPTION_MS : CURTAIN_MS,
    );
  }

  function closeBell() {
    withCurtain(() => {
      bell = false;
      clock?.stop();
      endDay();
    });
  }
  function finishScene() {
    // 다음 시간대가 이어지면 그곳을 알려 준다
    const g = get(game);
    const nextSlot = g.actionsLeft > 0 ? availableSlots(DAYS[g.dayIndex], g.slotsUsed)[0] : undefined;
    const cap = nextSlot && g.mode === 'novel' ? placeCaption(g.dayIndex, nextSlot) : undefined;
    withCurtain(() => {
      busy = false;
      leaveScene();
      if ($game.phase === 'dayEnd') clock?.stop();
      autoEnter();
    }, cap);
  }
  /** 같은 장소 안에서 다음 사람과 대화하러 넘어갈 때의 짧은 화면 전환 */
  function sameplace(action: () => void) {
    withCurtain(action);
  }
  /** 요일 아침의 첫 시간대 안내 */
  function dayCaption(dayIndex: number): Caption | undefined {
    const first = SLOT_ORDER.find((s) => DAYS[dayIndex] && s in DAYS[dayIndex].scenes);
    return first ? placeCaption(dayIndex, first, true) : undefined;
  }

  // 단서 수가 바뀔 때 HUD 숫자 튀는 연출 트리거
  const bump = $derived($game.clues.length);
</script>

<div class="app">
  {#if intro}
    <Intro
      onDone={() =>
        withCurtain(() => {
          intro = false;
          beginDay(true);
        }, dayCaption(0))}
    />
  {:else if $game.phase === 'title' || $game.phase === 'briefing'}
    <StartScreen
      phase={$game.phase}
      canResume={!!saved}
      onResume={resume}
      onNew={() => {
        resetSessions();
        discardSave();
        newGame();
      }}
      onBegin={(mode) => {
        setMode(mode);
        intro = true;
      }}
    />
  {:else if $game.phase === 'report'}
    <Report gs={$game} onSubmit={(r) => submitReport(r)} />
  {:else if $game.phase === 'ending' && $game.verdict}
    <Ending gs={$game} onRewind={(d) => withCurtain(() => rewind(d), dayCaption(d))} onRestart={restart} />
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
        onPick={(slot, id) =>
          withCurtain(
            () => {
              sceneKey++;
              enterScene(slot, id);
            },
            placeCaption($game.dayIndex, slot),
          )}
      />
    {:else if $game.phase === 'scene' && $game.sceneId}
      {#key sceneKey}
        {#if scene?.kind === 'messenger'}
          <Messenger sceneId={$game.sceneId} knot={scene.knot ?? ''} dayId={day.id} onExit={finishScene} onBusy={(b) => (busy = b)} />
        {:else if $game.mode === 'novel'}
          <VNScene sceneId={$game.sceneId} dayId={day.id} onFinish={finishScene} onBusy={(b) => (busy = b)} onTransition={sameplace} />
        {:else}
          <Scene sceneId={$game.sceneId} dayId={day.id} onFinish={finishScene} onBusy={(b) => (busy = b)} />
        {/if}
      {/key}
    {:else if $game.phase === 'dayEnd'}
      <DayEnd {day} gs={$game} {hasNext} onNext={() => withCurtain(() => beginDay(false), dayCaption($game.dayIndex + 1))} onReport={openReport} onNotebook={() => (notebookOpen = true)} onRestart={restart} />
    {/if}
  {/if}

  <div class="curtain" class:on={curtain} aria-hidden="true">
    {#if caption}
      <div class="cap" class:show={capShow}>
        <p class="ctitle">{caption.title}</p>
        {#if caption.sub}<p class="csub">{caption.sub}</p>{/if}
      </div>
    {/if}
  </div>

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
  .curtain {
    position: absolute;
    inset: 0;
    z-index: 4000;
    background: #000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.7s ease;
  }
  .cap {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 24px;
    text-align: center;
    color: #fff;
    opacity: 0;
    transition: opacity 0.2s ease-in; /* 사라질 때는 빠르게 */
  }
  .cap.show {
    opacity: 1;
    transition: opacity 0.6s ease-out; /* 나타날 때는 천천히 */
  }
  .ctitle {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
  }
  .csub {
    margin: 0;
    font-size: 17px;
    color: #cfd7e5;
  }
  .curtain.on {
    opacity: 1;
    pointer-events: auto; /* 전환 중에는 눌러도 반응하지 않게 */
    transition-duration: 0.5s;
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
