<script module lang="ts">
  import type { CharId } from '../data/characters';
  import type { Clue } from '../data/clues';
  import type { Placed } from '../data/rooms';
  import type { ChoiceView } from '../lib/inkEngine';

  export type PanelView =
    | { mode: 'idle' }
    | { mode: 'adjacent'; targets: Placed[] }
    | { mode: 'dialogue'; kind: 'npc' | 'object'; title: string; speaker: CharId | null; text: string; choices: ChoiceView[] | null; note: string | null }
    | { mode: 'clue'; clue: Clue };
</script>

<script lang="ts">
  // 하단 패널: 기본 안내 / 인접(말 걸기·살펴보기) / 대화·관찰 / 단서 획득 카드
  import { CHARACTERS } from '../data/characters';
  import { MANIFEST } from '../assets/manifest';
  import type { Effect } from '../lib/inkEngine';

  let {
    view,
    slotLabel,
    onStart,
    onNext,
    onChoose,
    onClueDone,
    onFinishSlot,
  }: {
    view: PanelView;
    slotLabel: string;
    onStart: (it: Placed) => void;
    onNext: () => void;
    onChoose: (i: number) => void;
    onClueDone: () => void;
    onFinishSlot: () => void;
  } = $props();

  const portrait = (id: CharId) => MANIFEST[CHARACTERS[id].sprite].sheets.idle.src;
</script>

<section class="panel">
  {#if view.mode === 'idle'}
    <div class="body">
      <p class="eyebrow">{slotLabel}</p>
      <p class="guide">바닥을 탭해 이동하세요. 드래그로 화면을 옮기고, 두 손가락(또는 + − 버튼)으로 확대·축소할 수 있어요. 머리 위 <b class="bang">!</b> 는 대화, 반짝이는 물건은 관찰할 수 있어요. 말을 걸 대상 바로 옆으로 가면 선택지가 열립니다.</p>
    </div>
    <button class="btn ghost" onclick={onFinishSlot}>이 시간대 마치기</button>
  {:else if view.mode === 'adjacent'}
    <div class="body">
      <p class="eyebrow">바로 옆에 있어요</p>
      <div class="targets">
        {#each view.targets as t (t.id)}
          <button class="btn primary" onclick={() => onStart(t)}>
            {t.kind === 'npc' ? '말 걸기' : '살펴보기'} · {t.label}
          </button>
        {/each}
      </div>
    </div>
    <button class="btn ghost" onclick={onFinishSlot}>이 시간대 마치기</button>
  {:else if view.mode === 'dialogue'}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="dialogue" onclick={() => !view.choices && onNext()}>
      <div class="who">
        {#if view.speaker}
          <span class="portrait"><img src={portrait(view.speaker)} alt="" draggable="false" /></span>
          <span class="name">{CHARACTERS[view.speaker].name}</span>
        {:else}
          <span class="name narr">{view.kind === 'object' ? view.title : '관찰'}</span>
        {/if}
      </div>
      {#key view.text}
        <p class="text" class:narr={!view.speaker}>{view.text}</p>
      {/key}
    </div>
    {#if view.choices}
      <div class="choices">
        {#each view.choices as c (c.index)}
          <button class="btn choice" onclick={() => onChoose(c.index)}>
            <span>{c.text}</span>
          </button>
        {/each}
      </div>
    {:else}
      <button class="btn next" onclick={onNext}>다음</button>
    {/if}
  {:else}
    <div class="card" role="status">
      <p class="eyebrow clue">단서 획득 · {view.clue.type}</p>
      <h3>{view.clue.title}</h3>
      <p class="desc">{view.clue.desc}</p>
    </div>
    <button class="btn primary" onclick={onClueDone}>수사 수첩에 기록됨 · 계속</button>
  {/if}
</section>

<style>
  .panel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px calc(14px + env(safe-area-inset-bottom));
    background: #fff;
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -2px 0 #dfe4ec;
    overflow-y: auto;
  }
  .body {
    flex: 1;
  }
  .eyebrow {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 700;
    color: #5b6781;
  }
  .eyebrow.clue {
    color: #b8741a;
  }
  .guide {
    margin: 0;
    font-size: 15px;
    line-height: 1.55;
    color: #2a3550;
  }
  .bang {
    display: inline-block;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #e8a33d;
    color: #1f2a44;
    text-align: center;
    line-height: 18px;
    font-size: 12px;
  }
  .targets {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .btn {
    min-height: 48px;
    padding: 10px 14px;
    border: 0;
    border-radius: 12px;
    font: inherit;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
  }
  .primary {
    background: #3b6fd8;
    color: #fff;
  }
  .ghost {
    background: #eef1f5;
    color: #2a3550;
    font-size: 14px;
  }
  .next {
    align-self: flex-end;
    background: #1f2a44;
    color: #fff;
    min-width: 96px;
  }
  .dialogue {
    flex: 1;
    min-height: 0;
  }
  .who {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .portrait {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #dde4ef;
    overflow: hidden;
    display: block;
    flex: none;
  }
  .portrait img {
    width: 96px;
    margin-left: -24px;
    margin-top: -4px;
    display: block;
  }
  .name {
    font-weight: 800;
    color: #1f2a44;
    font-size: 16px;
  }
  .name.narr {
    font-size: 13px;
    color: #5b6781;
  }
  .text {
    margin: 0;
    font-size: 17px;
    line-height: 1.6;
    color: #1d2438;
    animation: rise 0.22s ease-out;
  }
  .text.narr {
    color: #4a5670;
    padding-left: 10px;
    border-left: 3px solid #cfd7e5;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .choice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    text-align: left;
    background: #eef1f5;
    color: #1d2438;
    border: 2px solid #d5dce8;
  }
  .card {
    flex: 1;
    padding: 14px;
    border: 2px solid #e8a33d;
    border-radius: 14px;
    background: #fff8ec;
    animation: pop 0.35s cubic-bezier(0.2, 1.2, 0.4, 1);
  }
  .card h3 {
    margin: 0 0 6px;
    font-size: 19px;
    color: #1f2a44;
  }
  .desc {
    margin: 0;
    font-size: 15px;
    line-height: 1.55;
    color: #2a3550;
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(16px) scale(0.96);
    }
  }
</style>
