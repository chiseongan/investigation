<script lang="ts">
  // 대화형 배경: 장소마다 다른 그림(SVG, 멈춘 그림) + 시간에 따라 바뀌는 빛깔 덮개.
  // 빛깔은 새 덮개를 위에 올려 투명도로 서서히 드러낸다 (움직이는 속성은 opacity 뿐).
  import { untrack } from 'svelte';
  import { daylight } from '../lib/daylight';
  import classroom from '../assets/backgrounds/classroom.webp';
  import hallway from '../assets/backgrounds/hallway.webp';
  import cafeteria from '../assets/backgrounds/cafeteria.webp';
  import gym from '../assets/backgrounds/gym.webp';
  import counseling from '../assets/backgrounds/counseling.webp';
  import gate from '../assets/backgrounds/gate.webp';
  import playground from '../assets/backgrounds/playground.webp';

  // 그림 파일이 있는 장소는 그림을 쓴다. 그림이 없는 장소가 생기면 아래 SVG 임시 그림이 대신한다.
  const PICTURES: Record<string, string> = { classroom, hallway, cafeteria, gym, counseling, gate, playground };

  let { room, t }: { room: string; t: number } = $props();

  const tint = $derived(daylight(t));
  let layers = $state<{ id: number; color: string }[]>([]);
  let seq = 0;
  $effect(() => {
    const color = tint;
    untrack(() => {
      layers = [...layers.slice(-1), { id: seq++, color }];
    });
  });
</script>

<div class="bg" aria-hidden="true">
  {#if PICTURES[room]}
    <img class="pic" src={PICTURES[room]} alt="" draggable="false" />
  {:else}
  <svg viewBox="0 0 430 380" preserveAspectRatio="xMidYMax slice">
    {#if room === 'classroom'}
      <rect width="430" height="236" fill="#E4EAF2" />
      <rect y="236" width="430" height="144" fill="#D9C7A3" />
      <path d="M0 264H430M0 296H430M0 334H430" stroke="#CDB98F" stroke-width="2" />
      <rect x="112" y="52" width="206" height="96" rx="4" fill="#2F4A43" stroke="#8B6B43" stroke-width="6" />
      <path d="M130 80h70M130 98h110M246 80h52" stroke="#DDE8E2" stroke-width="3" stroke-linecap="round" opacity=".7" />
      <rect x="140" y="148" width="150" height="6" fill="#A98558" />
      <circle cx="215" cy="30" r="17" fill="#fff" stroke="#8B93A5" stroke-width="3" />
      <path d="M215 30V19M215 30l8 4" stroke="#3A4560" stroke-width="2.5" stroke-linecap="round" />
      {#each [14, 346] as x}
        <rect {x} y="48" width="70" height="98" fill="#BFE0FF" stroke="#8B93A5" stroke-width="4" />
        <path d={`M${x + 35} 48V146M${x} 97H${x + 70}`} stroke="#8B93A5" stroke-width="3" />
      {/each}
      {#each [38, 148, 258, 352] as x}
        <rect {x} y="258" width="62" height="10" fill="#B98A56" />
        <path d={`M${x + 8} 268v22M${x + 54} 268v22`} stroke="#8E6A3F" stroke-width="4" />
      {/each}
    {:else if room === 'hallway'}
      <rect width="430" height="236" fill="#E6E1D6" />
      <rect y="236" width="430" height="144" fill="#D8D2C4" />
      <path d="M0 268H430M0 308H430M120 236L40 380M215 236V380M310 236L390 380" stroke="#C9C2B1" stroke-width="2" />
      <rect y="0" width="430" height="18" fill="#F4F1EA" />
      {#each [0, 1, 2, 3, 4, 5, 6, 7] as i}
        <rect x={i * 54 + 2} y="92" width="50" height="144" rx="3" fill="#6F8FB5" stroke="#55739A" stroke-width="3" />
        <path d={`M${i * 54 + 12} 108h30M${i * 54 + 12} 114h30M${i * 54 + 12} 120h30`} stroke="#55739A" stroke-width="2" />
        <circle cx={i * 54 + 40} cy="170" r="3" fill="#E8EEF6" />
      {/each}
      <rect x="150" y="30" width="130" height="46" fill="#F9F6EE" stroke="#BDB6A6" stroke-width="3" />
      <path d="M162 46h60M162 58h92" stroke="#B23A48" stroke-width="3" stroke-linecap="round" opacity=".6" />
    {:else if room === 'cafeteria'}
      <rect width="430" height="236" fill="#EFE4CE" />
      <rect y="236" width="430" height="144" fill="#E6D9BC" />
      <path d="M0 264H430M0 300H430M0 342H430" stroke="#D8C8A3" stroke-width="2" />
      <rect x="0" y="120" width="430" height="116" fill="#B8C2CF" />
      <rect x="0" y="112" width="430" height="14" fill="#D6DDE6" />
      {#each [20, 120, 220, 320] as x}
        <rect {x} y="134" width="86" height="40" rx="3" fill="#9DA9B8" />
        <rect x={x + 6} y="140" width="32" height="14" rx="2" fill="#E8A33D" />
        <rect x={x + 44} y="140" width="32" height="14" rx="2" fill="#C98A7A" />
      {/each}
      <rect x="150" y="26" width="130" height="58" fill="#F9F6EE" stroke="#BDB6A6" stroke-width="3" />
      <path d="M164 44h64M164 58h100" stroke="#3B6FD8" stroke-width="3" stroke-linecap="round" opacity=".6" />
      <rect x="14" y="30" width="86" height="60" fill="#BFE0FF" stroke="#8B93A5" stroke-width="4" />
      <rect x="330" y="30" width="86" height="60" fill="#BFE0FF" stroke="#8B93A5" stroke-width="4" />
      {#each [20, 175, 320] as x}
        <rect {x} y="250" width="92" height="12" fill="#B98A56" />
        <path d={`M${x + 10} 262v26M${x + 82} 262v26`} stroke="#8E6A3F" stroke-width="4" />
      {/each}
    {:else if room === 'gym'}
      <rect width="430" height="236" fill="#D8DEEA" />
      <rect y="170" width="430" height="66" fill="#6F86B8" />
      <rect y="236" width="430" height="144" fill="#E2C48F" />
      <path d="M0 236H430M0 330H430M215 236V380" stroke="#fff" stroke-width="3" opacity=".8" />
      <path d="M150 236a65 40 0 0 0 130 0" fill="none" stroke="#fff" stroke-width="3" opacity=".8" />
      <rect x="0" y="22" width="430" height="42" fill="#BFE0FF" opacity=".8" />
      <path d="M0 43H430M70 22V64M140 22V64M210 22V64M280 22V64M350 22V64" stroke="#8B93A5" stroke-width="3" />
      <rect x="186" y="88" width="58" height="42" fill="#fff" stroke="#3A4560" stroke-width="4" />
      <rect x="205" y="110" width="20" height="14" fill="none" stroke="#B23A48" stroke-width="3" />
      <ellipse cx="215" cy="138" rx="16" ry="5" fill="none" stroke="#E8751D" stroke-width="4" />
      <path d="M215 130v6" stroke="#3A4560" stroke-width="4" />
    {:else if room === 'counseling'}
      <rect width="430" height="236" fill="#EADFCF" />
      <rect y="236" width="430" height="144" fill="#D8C7AA" />
      <ellipse cx="215" cy="318" rx="170" ry="40" fill="#9DB4D8" opacity=".75" />
      <rect x="24" y="44" width="92" height="104" fill="#BFE0FF" stroke="#8B93A5" stroke-width="4" />
      <path d="M70 44V148M24 96H116" stroke="#8B93A5" stroke-width="3" />
      <path d="M16 38c10 30 6 80-4 120h26c-6-40-4-90 8-120zM124 38c-10 30-6 80 4 120h-26c6-40 4-90-8-120z" fill="#C98A7A" opacity=".85" />
      <rect x="170" y="62" width="92" height="66" fill="#F9F6EE" stroke="#BDB6A6" stroke-width="3" />
      <circle cx="216" cy="94" r="16" fill="#E8A33D" opacity=".75" />
      <rect x="300" y="178" width="106" height="58" rx="10" fill="#6F8FB5" />
      <rect x="292" y="196" width="22" height="46" rx="8" fill="#55739A" />
      <rect x="392" y="196" width="22" height="46" rx="8" fill="#55739A" />
      <rect x="150" y="196" width="100" height="10" fill="#B98A56" />
      <path d="M162 206v32M238 206v32" stroke="#8E6A3F" stroke-width="4" />
      <rect x="22" y="196" width="26" height="40" rx="4" fill="#C98A7A" />
      <path d="M35 196c-14-20 4-34 0-44 14 10 14 26 0 44zM35 196c16-16 30-14 34-30-18 2-30 12-34 30z" fill="#5E9A66" />
    {:else if room === 'gate'}
      <defs>
        <linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#A9D3F5" />
          <stop offset="1" stop-color="#E6F2FB" />
        </linearGradient>
      </defs>
      <rect width="430" height="236" fill="url(#gsky)" />
      <rect x="70" y="64" width="290" height="172" fill="#E9E2D3" />
      <rect x="62" y="56" width="306" height="12" fill="#CFC6B2" />
      {#each [0, 1, 2, 3, 4] as i}
        <rect x={92 + i * 54} y="92" width="34" height="38" fill="#BFE0FF" stroke="#8B93A5" stroke-width="3" />
        <rect x={92 + i * 54} y="146" width="34" height="38" fill="#BFE0FF" stroke="#8B93A5" stroke-width="3" />
      {/each}
      <rect x="190" y="192" width="50" height="44" fill="#8B93A5" />
      <rect y="236" width="430" height="144" fill="#CFC8B8" />
      <path d="M0 270H430M0 316H430" stroke="#BDB6A6" stroke-width="2" />
      <path d="M150 236L90 380M280 236L340 380" stroke="#BDB6A6" stroke-width="2" />
      <rect x="0" y="196" width="430" height="6" fill="#8B93A5" />
      {#each Array(22) as _, i}
        <rect x={i * 20 + 6} y="196" width="4" height="40" fill="#8B93A5" />
      {/each}
      <rect x="6" y="130" width="42" height="106" fill="#B9C2D1" stroke="#9AA4B5" stroke-width="3" />
      <rect x="382" y="130" width="42" height="106" fill="#B9C2D1" stroke="#9AA4B5" stroke-width="3" />
      <circle cx="404" cy="104" r="34" fill="#5E9A66" />
      <rect x="400" y="130" width="8" height="12" fill="#8E6A3F" />
    {:else if room === 'playground'}
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8EC5F5" />
          <stop offset="1" stop-color="#DCEEFB" />
        </linearGradient>
      </defs>
      <rect width="430" height="236" fill="url(#sky)" />
      <rect x="20" y="108" width="390" height="128" fill="#E9E2D3" />
      <path d="M20 108h390M20 108v128M410 108v128" stroke="#CFC6B2" stroke-width="3" fill="none" />
      {#each [0, 1, 2, 3, 4, 5] as i}
        <rect x={52 + i * 62} y="134" width="38" height="46" fill="#BFE0FF" stroke="#8B93A5" stroke-width="3" />
      {/each}
      <rect x="190" y="190" width="50" height="46" fill="#8B93A5" />
      <rect y="236" width="430" height="144" fill="#8DBB74" />
      <path d="M-20 380Q215 230 450 380" fill="none" stroke="#C9684F" stroke-width="38" opacity=".9" />
      <path d="M-20 380Q215 250 450 380" fill="none" stroke="#fff" stroke-width="3" opacity=".7" />
      <path d="M360 236v-52M410 236v-52M360 184h50" stroke="#fff" stroke-width="5" stroke-linecap="round" />
      <path d="M70 236v-36" stroke="#8E6A3F" stroke-width="6" />
      <circle cx="70" cy="190" r="26" fill="#5E9A66" />
    {/if}
  </svg>
  {/if}
  {#each layers as l (l.id)}
    <div class="tint" style="background: {l.color}"></div>
  {/each}
</div>

<style>
  .bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  /* 아래쪽을 기준으로 맞추고 위쪽이 잘린다: 인물이 서는 바닥이 늘 보인다 */
  .pic {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center bottom;
    display: block;
    pointer-events: none;
  }
  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  .tint {
    position: absolute;
    inset: 0;
    animation: fade 1.6s ease-out;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tint {
      animation: none;
    }
  }
</style>
