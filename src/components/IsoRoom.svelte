<script lang="ts">
  // 쿼터뷰 방: 마름모 바닥, 뒷벽 두 개, 가구·인물.
  // 카메라(확대/축소/이동)는 stage 의 transform 만 바꾼다. 이동 로직은 부모(Scene)가 처리한다.
  import Sprite from './Sprite.svelte';
  import { MANIFEST, type SpriteState } from '../assets/manifest';
  import { STEP_MS } from '../data/config';
  import type { Placed, RoomDef } from '../data/rooms';
  import {
    WALL_H, TILE_W, TILE_H, geom, cellCenter, clampPan, depthActor, depthObject, pointToCell, tilePoints, wallQuad, type Cell,
  } from '../lib/iso';

  let {
    room,
    items,
    player,
    playerState,
    flip,
    doneIds,
    destination,
    talkingId,
    onTapCell,
    onTapItem,
  }: {
    room: RoomDef;
    items: Placed[];
    player: Cell;
    playerState: SpriteState;
    flip: boolean;
    doneIds: string[];
    destination: Cell | null;
    talkingId: string | null;
    onTapCell: (cell: Cell) => void;
    onTapItem: (item: Placed) => void;
  } = $props();

  const N = $derived(room.size);
  const g = $derived(geom(room.size));
  const MAX_ZOOM = 2.2;

  let vp: HTMLDivElement | undefined = $state();
  let vw = $state(390);
  let vh = $state(480);
  let zoom = $state(1);
  let tx = $state(0);
  let ty = $state(0);
  let follow = $state(true); // 플레이어를 따라가는 카메라
  let dragging = $state(false);

  const minZoom = $derived(Math.min(1, vw / g.w, vh / g.h));
  const clampZoom = (z: number) => Math.max(minZoom, Math.min(MAX_ZOOM, z));

  function measure() {
    if (!vp?.parentElement) return;
    vw = vp.parentElement.clientWidth;
    vh = Math.max(300, Math.min(500, window.innerHeight - 72 - 250));
    if (zoom < minZoom) zoom = minZoom;
  }
  $effect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (vp?.parentElement) ro.observe(vp.parentElement);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  });

  function clampCam() {
    tx = clampPan(tx, vw, g.w, zoom);
    ty = clampPan(ty, vh, g.h, zoom);
  }

  // 플레이어 따라가기
  $effect(() => {
    if (!follow) return;
    const p = cellCenter(player.c, player.r, N);
    tx = clampPan(vw / 2 - p.x * zoom, vw, g.w, zoom);
    ty = clampPan(vh / 2 - (p.y - 30) * zoom, vh, g.h, zoom);
  });

  function zoomAt(z2: number, sx: number, sy: number) {
    // (sx, sy): 뷰포트 안 좌표. 그 아래 월드 점이 제자리에 있도록 한다.
    const z = clampZoom(z2);
    const wx = (sx - tx) / zoom;
    const wy = (sy - ty) / zoom;
    zoom = z;
    tx = sx - wx * z;
    ty = sy - wy * z;
    clampCam();
  }
  function buttonZoom(factor: number) {
    // 따라가기 상태에서는 플레이어 중심으로 확대/축소된다
    if (follow) zoom = clampZoom(zoom * factor);
    else zoomAt(zoom * factor, vw / 2, vh / 2);
  }
  function recenter() {
    follow = true;
  }

  // --- 포인터: 한 손가락 드래그 = 이동, 두 손가락 = 핀치 확대/축소 ---
  const ptrs = new Map<number, { x: number; y: number }>();
  let moved = false;
  let start = { x: 0, y: 0, tx: 0, ty: 0 };
  let pinch: { dist: number; zoom: number; wx: number; wy: number } | null = null;

  const mid = () => {
    const [a, b] = [...ptrs.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) };
  };

  function onDown(e: PointerEvent) {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) {
      moved = false;
      start = { x: e.clientX, y: e.clientY, tx, ty };
    } else if (ptrs.size === 2 && vp) {
      moved = true;
      follow = false;
      dragging = true;
      const m = mid();
      const rect = vp.getBoundingClientRect();
      pinch = { dist: m.d || 1, zoom, wx: (m.x - rect.left - tx) / zoom, wy: (m.y - rect.top - ty) / zoom };
    }
  }
  function onMove(e: PointerEvent) {
    if (!ptrs.has(e.pointerId) || !vp) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size >= 2 && pinch) {
      const m = mid();
      const rect = vp.getBoundingClientRect();
      zoom = clampZoom(pinch.zoom * (m.d / pinch.dist));
      tx = m.x - rect.left - pinch.wx * zoom;
      ty = m.y - rect.top - pinch.wy * zoom;
      clampCam();
    } else if (ptrs.size === 1) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) > 8) {
        moved = true;
        follow = false;
        dragging = true;
      }
      if (moved) {
        tx = start.tx + dx;
        ty = start.ty + dy;
        clampCam();
      }
    }
  }
  function onUp(e: PointerEvent) {
    ptrs.delete(e.pointerId);
    pinch = null;
    if (ptrs.size === 1) {
      const [p] = [...ptrs.values()];
      start = { x: p.x, y: p.y, tx, ty };
    }
    if (ptrs.size === 0) dragging = false;
  }

  function onWheel(e: WheelEvent) {
    if (!vp) return;
    e.preventDefault();
    const rect = vp.getBoundingClientRect();
    follow = false;
    zoomAt(zoom * Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
  }
  $effect(() => {
    const el = vp;
    el?.addEventListener('wheel', onWheel, { passive: false });
    return () => el?.removeEventListener('wheel', onWheel);
  });

  function onViewportTap(e: MouseEvent) {
    if (moved || !vp) return;
    const rect = vp.getBoundingClientRect();
    const cell = pointToCell((e.clientX - rect.left - tx) / zoom, (e.clientY - rect.top - ty) / zoom, N);
    if (cell) {
      follow = true;
      onTapCell(cell);
    }
  }
  function tapItem(e: MouseEvent, it: Placed) {
    e.stopPropagation();
    if (moved) return;
    follow = true;
    onTapItem(it);
  }

  const tiles = $derived(Array.from({ length: N * N }, (_, i) => ({ c: i % N, r: Math.floor(i / N) })));
  const WALL_FILL = $derived(room.wall ?? { left: '#D5DBE6', right: '#E3E8F0' });
  const FLOOR = $derived(room.floor ?? ['#E6EBF3', '#DDE4EF']);
  const WALL_ITEM: Record<string, string> = {
    window: '#BCD6F0',
    board: '#2F4B45',
    clock: '#F7F7F2',
    notice: '#E8C98B',
    door: '#B98B5E',
    poster: '#F2B5D4',
    hoop: '#E07A5F',
  };

  const pos = (c: number, r: number, ax: number, ay: number) => {
    const p = cellCenter(c, r, N);
    return `translate3d(${p.x - ax}px,${p.y - ay}px,0)`;
  };
  const playerDef = MANIFEST.me;
  const isDone = (id: string) => doneIds.includes(id);
</script>

<div class="outer" style="height:{vh}px">
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="viewport"
    bind:this={vp}
    onpointerdown={onDown}
    onpointermove={onMove}
    onpointerup={onUp}
    onpointercancel={onUp}
    onclick={onViewportTap}
  >
    <div
      class="stage"
      class:still={dragging}
      style="width:{g.w}px;height:{g.h}px;transform:translate3d({tx}px,{ty}px,0) scale({zoom})"
    >
      <svg class="bg" viewBox="0 0 {g.w} {g.h}" width={g.w} height={g.h} aria-hidden="true">
        <polygon points={wallQuad('left', 0, N, 0, WALL_H, N)} fill={WALL_FILL.left} />
        <polygon points={wallQuad('right', 0, N, 0, WALL_H, N)} fill={WALL_FILL.right} />
        {#each room.walls as w}
          <polygon points={wallQuad(w.side, w.s1, w.s2, w.h1, w.h2, N)} fill={WALL_ITEM[w.kind]} stroke="#9AA5B6" stroke-width="2" />
        {/each}
        {#each tiles as t}
          <polygon points={tilePoints(t.c, t.r, N)} fill={FLOOR[(t.c + t.r) % 2]} stroke="#C5CEDC" stroke-width="1" />
        {/each}
        <!-- 바닥 두께 -->
        <polygon
          points="{g.ox - N * (TILE_W / 2)},{g.oy + N * (TILE_H / 2)} {g.ox},{g.oy + N * TILE_H} {g.ox},{g.oy + N * TILE_H + 12} {g.ox - N * (TILE_W / 2)},{g.oy + N * (TILE_H / 2) + 12}"
          fill="#AEB8C8"
        />
        <polygon
          points="{g.ox},{g.oy + N * TILE_H} {g.ox + N * (TILE_W / 2)},{g.oy + N * (TILE_H / 2)} {g.ox + N * (TILE_W / 2)},{g.oy + N * (TILE_H / 2) + 12} {g.ox},{g.oy + N * TILE_H + 12}"
          fill="#9AA6B9"
        />
      </svg>

      {#if destination}
        {#key `${destination.c},${destination.r}`}
          <svg class="dest" width={TILE_W} height={TILE_H} viewBox="0 0 {TILE_W} {TILE_H}" style="transform:{pos(destination.c, destination.r, TILE_W / 2, TILE_H / 2)}" aria-hidden="true">
            <polygon points="30,1 59,15 30,29 1,15" fill="#3B6FD8" fill-opacity=".28" stroke="#3B6FD8" stroke-width="2" />
          </svg>
        {/key}
      {/if}

      {#each items as it (it.id)}
        {@const def = MANIFEST[it.sprite]}
        {@const interactive = !!it.knot}
        {@const fresh = interactive && !isDone(it.id)}
        {#if interactive}
          <button
            class="ent"
            style="z-index:{it.kind === 'npc' ? depthActor(it.c, it.r) : depthObject(it.c, it.r)};width:{def.frameW}px;height:{def.frameH}px;transform:{pos(it.c, it.r, def.anchor.x, def.anchor.y)}"
            aria-label={it.label}
            onclick={(e) => tapItem(e, it)}
          >
            <Sprite id={it.sprite} state={talkingId === it.id ? 'talk' : 'idle'} />
            {#if fresh && it.kind === 'npc'}<span class="bang" aria-hidden="true">!</span>{/if}
            {#if fresh && it.kind === 'object'}<span class="spark" aria-hidden="true"></span>{/if}
          </button>
        {:else}
          <div
            class="ent passive"
            style="z-index:{depthObject(it.c, it.r)};width:{def.frameW}px;height:{def.frameH}px;transform:{pos(it.c, it.r, def.anchor.x, def.anchor.y)}"
          >
            <Sprite id={it.sprite} />
          </div>
        {/if}
      {/each}

      <div
        class="ent passive player"
        style="z-index:{depthActor(player.c, player.r)};width:{playerDef.frameW}px;height:{playerDef.frameH}px;transform:{pos(player.c, player.r, playerDef.anchor.x, playerDef.anchor.y)};--step:{STEP_MS}ms"
      >
        <Sprite id="me" state={playerState} {flip} />
      </div>
    </div>

    <!-- 확대/축소 컨트롤 -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="zoomctl" onpointerdown={(e) => e.stopPropagation()} onclick={(e) => e.stopPropagation()}>
      <button aria-label="확대" onclick={() => buttonZoom(1.25)} disabled={zoom >= MAX_ZOOM - 0.01}>+</button>
      <button aria-label="축소" onclick={() => buttonZoom(0.8)} disabled={zoom <= minZoom + 0.01}>−</button>
      <button aria-label="내 위치로" class:on={follow} onclick={recenter}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2.5" /><path d="M12 2v5M12 17v5M2 12h5M17 12h5" stroke="currentColor" stroke-width="2.5" /></svg>
      </button>
    </div>
  </div>
</div>

<style>
  .outer {
    position: relative;
    width: 100%;
    overflow: hidden;
    background: #eef1f5;
  }
  .viewport {
    position: absolute;
    inset: 0;
    overflow: hidden;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  .stage {
    position: absolute;
    left: 0;
    top: 0;
    transform-origin: 0 0;
    will-change: transform;
    transition: transform 0.28s ease-out;
  }
  .stage.still {
    transition: none;
  }
  .zoomctl {
    position: absolute;
    right: 10px;
    top: 10px;
    z-index: 5000;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .zoomctl button {
    width: 44px;
    height: 44px;
    padding: 0;
    border: 2px solid #1f2a44;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.92);
    color: #1f2a44;
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .zoomctl button:disabled {
    opacity: 0.4;
  }
  .zoomctl button.on {
    border-color: #3b6fd8;
    color: #3b6fd8;
  }
  .bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .ent {
    position: absolute;
    left: 0;
    top: 0;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    will-change: transform;
  }
  .passive {
    pointer-events: none;
  }
  .player {
    transition: transform var(--step) linear;
  }
  .dest {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;
    pointer-events: none;
    animation: pulse 0.9s ease-in-out infinite;
  }
  @keyframes pulse {
    50% {
      opacity: 0.45;
    }
  }
  /* 말을 걸 수 있는 인물 머리 위 "!" */
  .bang {
    position: absolute;
    left: 50%;
    top: -22px;
    margin-left: -11px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #e8a33d;
    color: #1f2a44;
    font-weight: 800;
    font-size: 15px;
    line-height: 22px;
    text-align: center;
    animation: hop 1s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes hop {
    50% {
      transform: translateY(-4px);
    }
  }
  /* 살펴볼 물건의 반짝임 */
  .spark {
    position: absolute;
    left: 50%;
    top: 4px;
    margin-left: -7px;
    width: 14px;
    height: 14px;
    background: #e8a33d;
    clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
    animation: twinkle 1.4s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.35;
      transform: scale(0.7);
    }
    50% {
      opacity: 1;
      transform: scale(1.2);
    }
  }
</style>
