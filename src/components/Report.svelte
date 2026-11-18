<script lang="ts">
  // 금요일 최종 보고서: 증거로 낼 단서를 고르고, 처음 시작한 학생을 지목한다. 정답 표시는 없다.
  import { CHARACTERS, type CharId } from '../data/characters';
  import { CANDIDATES, type Report } from '../data/endings';
  import { clueById } from '../data/clues';
  import { MANIFEST } from '../assets/manifest';
  import type { GameState } from '../lib/gameState';

  let { gs, onSubmit }: { gs: GameState; onSubmit: (r: Report) => void } = $props();

  const cards = $derived(gs.clues.map((id) => clueById(id)!).filter(Boolean));
  let chosen: string[] = $state([]);
  let picked: CharId | null = $state(null);
  let confirming = $state(false);

  const portrait = (id: CharId) => MANIFEST[CHARACTERS[id].sprite].sheets.idle.src;

  function toggle(id: string) {
    confirming = false;
    chosen = chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id];
  }
  function pick(id: CharId) {
    confirming = false;
    picked = id;
  }
  function submit() {
    if (!picked || !chosen.length) return;
    if (!confirming) {
      confirming = true;
      return;
    }
    onSubmit({ evidence: chosen, picked });
  }
</script>

<main class="screen">
  <p class="eyebrow">금요일 · 최종 보고</p>
  <h2>보고서를 작성하세요</h2>
  <p class="sub">증거로 낼 단서를 고르고, 이 일을 처음 시작한 학생을 지목하세요. 제출한 보고서는 학교와 보호자에게 전달됩니다.</p>

  <h3>1. 증거로 제출할 단서 <small>{chosen.length}개 선택</small></h3>
  {#if !cards.length}
    <p class="empty">수첩에 적은 단서가 없습니다.</p>
  {:else}
    <ul class="cards">
      {#each cards as c (c.id)}
        <li>
          <button class="card" class:on={chosen.includes(c.id)} aria-pressed={chosen.includes(c.id)} onclick={() => toggle(c.id)}>
            <span class="check" aria-hidden="true">{chosen.includes(c.id) ? '✓' : ''}</span>
            <span class="txt">
              <span class="badge">{c.type}</span>
              <strong>{c.title}</strong>
              <span class="desc">{c.desc}</span>
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <h3>2. 처음 시작한 학생</h3>
  <div class="who">
    {#each CANDIDATES as id}
      <button class="person" class:on={picked === id} aria-pressed={picked === id} onclick={() => pick(id)}>
        <img src={portrait(id)} alt="" draggable="false" />
        <span>{CHARACTERS[id].name}</span>
      </button>
    {/each}
  </div>

  <div class="actions">
    {#if confirming}
      <p class="warn">이 보고서를 제출할까요? 제출한 뒤에도 결과를 보고 이전 요일로 되감을 수 있어요.</p>
    {/if}
    <button class="btn primary" disabled={!picked || !chosen.length} onclick={submit}>
      {confirming ? '제출하기' : '보고서 제출'}
    </button>
    {#if confirming}<button class="btn ghost" onclick={() => (confirming = false)}>다시 고르기</button>{/if}
    {#if !picked || !chosen.length}<p class="hint">단서를 하나 이상 고르고 학생을 지목해야 제출할 수 있어요.</p>{/if}
  </div>
</main>

<style>
  .screen {
    flex: 1;
    padding: 24px 16px calc(22px + env(safe-area-inset-bottom));
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
    margin: 0 0 6px;
    font-size: 14px;
    color: #5b6781;
    line-height: 1.5;
  }
  h3 {
    margin: 20px 0 8px;
    font-size: 15px;
    color: #1f2a44;
  }
  h3 small {
    font-size: 12px;
    font-weight: 600;
    color: #3b6fd8;
    margin-left: 6px;
  }
  .empty,
  .hint {
    font-size: 13px;
    color: #5b6781;
    margin: 0;
  }
  .cards {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .card {
    width: 100%;
    min-height: 56px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 10px 12px;
    border: 2px solid #d5dce8;
    border-radius: 12px;
    background: #fff;
    color: #1f2a44;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .card.on {
    border-color: #3b6fd8;
    background: #eef3ff;
  }
  .check {
    flex: none;
    width: 24px;
    height: 24px;
    margin-top: 2px;
    border: 2px solid #b4bfd4;
    border-radius: 6px;
    background: #fff;
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    line-height: 20px;
    text-align: center;
  }
  .card.on .check {
    background: #3b6fd8;
    border-color: #3b6fd8;
  }
  .txt {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .txt strong {
    font-size: 15px;
  }
  .desc {
    font-size: 13px;
    line-height: 1.45;
    color: #4a5670;
  }
  .badge {
    align-self: flex-start;
    padding: 1px 8px;
    border-radius: 999px;
    background: #fff1d9;
    color: #b8741a;
    font-size: 11px;
    font-weight: 700;
  }
  .who {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
  }
  .person {
    min-height: 88px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 2px;
    border: 2px solid #d5dce8;
    border-radius: 12px;
    background: #fff;
    color: #1f2a44;
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }
  .person img {
    width: 40px;
    height: 48px;
    object-fit: contain;
  }
  .person.on {
    border-color: #e8a33d;
    background: #fff8ec;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 22px;
  }
  .warn {
    margin: 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: #fbe6e9;
    color: #b23a48;
    font-size: 14px;
    font-weight: 700;
  }
  .btn {
    min-height: 52px;
    border: 0;
    border-radius: 14px;
    font: inherit;
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
  }
  .primary {
    background: #3b6fd8;
    color: #fff;
  }
  .primary:disabled {
    background: #b4bfd4;
    cursor: default;
  }
  .ghost {
    background: #fff;
    color: #1f2a44;
    border: 2px solid #cfd7e5;
  }
</style>
