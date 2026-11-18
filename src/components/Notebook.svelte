<script lang="ts">
  // 수사 수첩 (1단계: 단서 목록과 인물별 신뢰도. 수사 보드/추론은 2단계)
  import { clueById } from '../data/clues';
  import type { GameState } from '../lib/gameState';
  import ClueBoard from './ClueBoard.svelte';

  let { gs, onClose }: { gs: GameState; onClose: () => void } = $props();
  let tab: 'clues' | 'board' = $state('clues');
  const got = $derived(gs.clues.map((id) => clueById(id)!).filter(Boolean));
</script>

<div class="scrim" role="dialog" aria-modal="true" aria-label="수사 수첩">
  <div class="sheet">
    <header>
      <h2>수사 수첩 <small>단서 {got.length}개</small></h2>
      <button class="close" onclick={onClose}>닫기</button>
    </header>

    <div class="tabs" role="tablist">
      <button role="tab" aria-selected={tab === 'clues'} class:on={tab === 'clues'} onclick={() => (tab = 'clues')}>단서·인물</button>
      <button role="tab" aria-selected={tab === 'board'} class:on={tab === 'board'} onclick={() => (tab = 'board')}>수사 보드 {gs.inferred.length ? `(${gs.inferred.length})` : ''}</button>
    </div>

    {#if tab === 'board'}
      <ClueBoard {gs} />
    {:else}
    <h3>모은 단서</h3>
    {#if !got.length}
      <p class="empty">아직 기록한 단서가 없어요.</p>
    {:else}
      <ul class="clues">
        {#each got as c (c.id)}
          <li>
            <span class="badge">{c.type}</span>
            <strong>{c.title}</strong>
            <p>{c.desc}</p>
          </li>
        {/each}
      </ul>
    {/if}
    {/if}
  </div>
</div>

<style>
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 2000;
    background: rgba(31, 42, 68, 0.55);
    display: flex;
    align-items: flex-end;
    animation: fade 0.2s ease-out;
  }
  .sheet {
    width: 100%;
    max-height: 86%;
    overflow-y: auto;
    background: #eef1f5;
    border-radius: 18px 18px 0 0;
    padding: 16px 16px calc(20px + env(safe-area-inset-bottom));
    animation: slide 0.25s ease-out;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes slide {
    from {
      transform: translateY(40px);
    }
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h2 {
    margin: 0;
    font-size: 20px;
    color: #1f2a44;
  }
  h2 small {
    font-size: 13px;
    color: #b8741a;
    margin-left: 6px;
  }
  .tabs {
    display: flex;
    gap: 6px;
    margin-top: 12px;
  }
  .tabs button {
    flex: 1;
    min-height: 44px;
    border: 2px solid #cfd7e5;
    border-radius: 12px;
    background: #fff;
    color: #3a4560;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
  .tabs button.on {
    border-color: #3b6fd8;
    background: #e4edff;
    color: #2a56b3;
  }
  h3 {
    margin: 18px 0 8px;
    font-size: 14px;
    color: #5b6781;
  }
  .close {
    min-height: 44px;
    padding: 0 16px;
    border: 0;
    border-radius: 12px;
    background: #1f2a44;
    color: #fff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .clues li {
    background: #fff;
    border-left: 4px solid #e8a33d;
    border-radius: 10px;
    padding: 10px 12px;
  }
  .clues p {
    margin: 4px 0 0;
    font-size: 14px;
    line-height: 1.5;
    color: #3a4560;
  }
  .badge {
    display: inline-block;
    margin-right: 6px;
    padding: 2px 8px;
    border-radius: 999px;
    background: #fff1d9;
    color: #b8741a;
    font-size: 12px;
    font-weight: 700;
  }
  .empty {
    font-size: 13px;
    color: #5b6781;
  }
</style>
