<script lang="ts">
  // 한 장면(시간대): 방 + 하단 패널, 이동/상호작용/잉크 진행을 조율한다.
  import IsoRoom from './IsoRoom.svelte';
  import DialoguePanel, { type PanelView } from './DialoguePanel.svelte';
  import { CHARACTERS } from '../data/characters';
  import { clueById } from '../data/clues';
  import { ROOMS, SCENES, SLOT_LABEL, type Placed } from '../data/rooms';
  import { STEP_MS } from '../data/config';
  import type { Beat, Effect, InkSession } from '../lib/inkEngine';
  import { sessionFor } from '../lib/session';
  import { addClue, addTrust, game, markSeen, markShared } from '../lib/gameState';
  import { findPath, isAdjacent, key, nearestStandCell, type Cell } from '../lib/iso';
  import { get } from 'svelte/store';

  let {
    sceneId,
    dayId,
    onFinish,
    onBusy,
  }: { sceneId: string; dayId: string; onFinish: () => void; onBusy: (busy: boolean) => void } = $props();

  // 장면은 {#key} 로 매번 새로 만들어지므로 초기값만 읽어도 된다
  // svelte-ignore state_referenced_locally
  const scene = SCENES[sceneId];
  const room = ROOMS[scene.room];
  const items: Placed[] = [...room.furniture, ...scene.items];
  const blocked = new Set(items.map((i) => key(i.c, i.r)));

  let player: Cell = $state({ ...scene.start });
  let flip = $state(false);
  let walking = $state(false);
  let destination: Cell | null = $state(null);
  let doneIds: string[] = $state(
    get(game).seen.filter((s) => s.startsWith(sceneId + ':')).map((s) => s.slice(sceneId.length + 1)),
  );

  // --- 이동 (requestAnimationFrame 으로 한 칸씩) ---
  let path: Cell[] = [];
  let raf = 0;
  let lastStep = -Infinity;

  function walkTo(target: Cell) {
    const p = findPath(player, target, blocked, room.size);
    if (!p || !p.length) return;
    path = p;
    destination = target;
    if (!walking) {
      walking = true;
      lastStep = -Infinity;
      raf = requestAnimationFrame(loop);
    }
  }
  function loop(t: number) {
    if (t - lastStep >= STEP_MS) {
      const next = path.shift();
      if (next) {
        if (next.c - next.r !== player.c - player.r) flip = next.c - next.r < player.c - player.r;
        player = next;
        lastStep = t;
      }
      if (!path.length) {
        // 마지막 칸으로의 이동 애니메이션이 끝난 뒤 정지 상태로 전환
        raf = requestAnimationFrame((t2) => settle(t2));
        return;
      }
    }
    raf = requestAnimationFrame(loop);
  }
  function settle(t: number) {
    if (t - lastStep < STEP_MS) {
      raf = requestAnimationFrame(settle);
      return;
    }
    walking = false;
    destination = null;
  }
  $effect(() => () => cancelAnimationFrame(raf));

  function onTapCell(c: Cell) {
    if (session) return;
    walkTo(c);
  }
  function onTapItem(it: Placed) {
    if (session) return;
    const stand = nearestStandCell(it, player, blocked, room.size);
    if (stand && !(stand.c === player.c && stand.r === player.r)) walkTo(stand);
  }

  const adjacent = $derived(
    walking ? [] : scene.items.filter((i) => i.knot && isAdjacent(player, i)),
  );

  // --- 상호작용 ---
  let session: InkSession | null = $state(null);
  let current = $state<Placed | null>(null);
  let view: PanelView | null = $state(null);
  let pendingClues: string[] = [];
  let note: string | null = null;
  let lastLine: Extract<PanelView, { mode: 'dialogue' }> | null = null;

  function apply(effects: Effect[]) {
    for (const e of effects) {
      if (e.kind === 'trust') {
        addTrust(e.who, e.delta); // 숨은 값: 화면에 보여 주지 않는다
      } else if (e.kind === 'shared') {
        markShared();
      } else if (addClue(e.id)) {
        pendingClues.push(e.id);
      }
    }
  }

  function start(it: Placed) {
    if (!it.knot) return;
    current = it;
    pendingClues = [];
    note = null;
    onBusy(true);
    session = sessionFor(dayId);
    session.begin(it.knot);
    advance();
  }

  function show(beat: Beat) {
    if (beat.type === 'line') {
      apply(beat.effects);
      lastLine = {
        mode: 'dialogue',
        kind: current!.kind === 'object' ? 'object' : 'npc',
        title: current!.label,
        speaker: beat.speaker,
        text: beat.text,
        choices: null,
        note,
      };
      view = lastLine;
      note = null;
    } else if (beat.type === 'choices') {
      view = { ...(lastLine ?? defaultLine()), choices: beat.choices, note: null };
    }
  }
  const defaultLine = (): Extract<PanelView, { mode: 'dialogue' }> => ({
    mode: 'dialogue',
    kind: current!.kind === 'object' ? 'object' : 'npc',
    title: current!.label,
    speaker: null,
    text: '',
    choices: null,
    note: null,
  });

  function advance() {
    if (!session) return;
    const beat = session.step();
    if (beat.type === 'end') return finishInteraction();
    show(beat);
  }

  function choose(i: number) {
    if (!session || view?.mode !== 'dialogue' || !view.choices) return;
    const picked = view.choices.find((c) => c.index === i);
    if (picked) apply(picked.effects);
    session.choose(i);
    lastLine = null;
    advance();
  }

  function finishInteraction() {
    if (current) {
      markSeen(`${sceneId}:${current.id}`);
      if (!doneIds.includes(current.id)) doneIds = [...doneIds, current.id];
    }
    session = null;
    lastLine = null;
    nextClueOrExit();
  }

  function nextClueOrExit() {
    const id = pendingClues.shift();
    if (id) {
      view = { mode: 'clue', clue: clueById(id)! };
      return;
    }
    view = null;
    current = null;
    onBusy(false);
  }

  const panelView: PanelView = $derived(
    view ?? (adjacent.length ? { mode: 'adjacent', targets: adjacent } : { mode: 'idle' }),
  );
  const talkingId = $derived(session && current ? current.id : null);
</script>

<IsoRoom
  {room}
  {items}
  {player}
  playerState={walking ? 'walk' : session ? 'talk' : 'idle'}
  {flip}
  {doneIds}
  {destination}
  {talkingId}
  {onTapCell}
  {onTapItem}
/>
<DialoguePanel
  view={panelView}
  slotLabel="{room.name} · {SLOT_LABEL[scene.slot]}"
  onStart={start}
  onNext={advance}
  onChoose={choose}
  onClueDone={nextClueOrExit}
  onFinishSlot={onFinish}
/>
