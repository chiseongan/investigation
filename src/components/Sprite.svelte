<script lang="ts">
  // 스프라이트 시트 재생. 프레임 이동은 CSS steps() + transform 만 사용한다.
  import { MANIFEST, type SpriteState } from '../assets/manifest';

  let { id, state = 'idle', flip = false }: { id: string; state?: SpriteState; flip?: boolean } = $props();

  const def = $derived(MANIFEST[id]);
  const sheet = $derived(def.sheets[state] ?? def.sheets.idle);
</script>

<div
  class="sprite"
  class:flip
  class:bob={state === 'walk' && sheet.frames === 1}
  class:talk={state === 'talk' && sheet.frames === 1}
  style="width:{def.frameW}px;height:{def.frameH}px"
>
  <img
    class="sheet"
    class:anim={sheet.frames > 1}
    src={sheet.src}
    alt=""
    draggable="false"
    style="width:{def.frameW * sheet.frames}px;height:{def.frameH}px;--n:{sheet.frames};--dur:{sheet.frames / sheet.fps}s"
  />
</div>

<style>
  .sprite {
    overflow: hidden;
    pointer-events: none;
    transform-origin: 50% 100%;
  }
  .flip {
    transform: scaleX(-1);
  }
  .sheet {
    display: block;
    max-width: none;
    user-select: none;
  }
  .anim {
    animation: sheet var(--dur) steps(var(--n)) infinite;
  }
  @keyframes sheet {
    to {
      transform: translateX(-100%);
    }
  }
  /* 시트가 1프레임인 플레이스홀더용 보조 연출 (transform 만 사용) */
  .bob .sheet {
    animation: bob 0.34s ease-in-out infinite;
  }
  .talk .sheet {
    animation: talk 0.9s ease-in-out infinite;
  }
  @keyframes bob {
    50% {
      transform: translateY(-3px);
    }
  }
  @keyframes talk {
    50% {
      transform: translateY(-1.5px);
    }
  }
</style>
