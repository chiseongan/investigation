<script lang="ts">
  // 수사 보드: 두 카드를 차례로 탭하면 연결을 시도한다. 정해진 조합이면 '추론'이 생긴다. (드래그 없음)
  import { INFERENCES, clueById } from '../data/clues';
  import { connectClues, type GameState } from '../lib/gameState';

  let { gs }: { gs: GameState } = $props();

  let selected: string | null = $state(null);
  let msg: { tone: 'ok' | 'info' | 'no'; text: string } | null = $state(null);
  

  let flash: string[] = $state([]); // 방금 연결된 카드 (강조 연출)

  const cards = $derived(gs.clues.map((id) => clueById(id)!).filter(Boolean));
  const inferences = $derived(
    gs.inferred
      .map((k) => INFERENCES.find((i) => [i.a, i.b].sort().join('+') === k))
      .filter((i): i is NonNullable<typeof i> => !!i),
  );

  function tap(id: string) {
    msg = null;
    flash = [];
    if (!selected) {
      selected = id;
      return;
    }
    if (selected === id) {
      selected = null;
      return;
    }
    const a = selected;
    selected = null;
    const r = connectClues(a, id);
    if (r.result === 'new' && r.inference) {
      flash = [a, id];
      msg = { tone: 'ok', text: `추론 완성: ${r.inference.title}` };
    } else if (r.result === 'already') {
      msg = { tone: 'info', text: '이미 이어 둔 단서예요.' };
    } else {
      msg = { tone: 'no', text: '새로 알게 된 것은 없어요.' };
    }
  }
</script>

<div class="board">
  <p class="how">카드 하나를 탭한 뒤, 이어질 것 같은 카드를 탭해 보세요.</p>
  {#if !cards.length}
    <p class="empty">아직 보드에 올릴 단서가 없어요.</p>
  {:else}
    <div class="grid">
      {#each cards as c (c.id)}
        <button class="card" class:sel={selected === c.id} class:flash={flash.includes(c.id)} onclick={() => tap(c.id)}>
          <span class="badge">{c.type}</span>
          <strong>{c.title}</strong>
        </button>
      {/each}
    </div>
  {/if}

  {#if msg}
    {#key msg.text}<p class="msg {msg.tone}" role="status">{msg.text}</p>{/key}
  {/if}

  <h3>추론 {inferences.length}개</h3>
  {#if !inferences.length}
    <p class="empty">단서를 이어 추론을 만들어 보세요.</p>
  {:else}
    <ul class="inf">
      {#each inferences as i (i.title)}
        <li>
          <strong>{i.title}</strong>
          <span class="pair">{clueById(i.a)?.title} + {clueById(i.b)?.title}</span>
          <p>{i.desc}</p>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .how,
  .empty {
    margin: 0 0 10px;
    font-size: 13px;
    color: #5b6781;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .card {
    min-height: 76px;
    padding: 10px;
    border: 2px solid #d5dce8;
    border-radius: 12px;
    background: #fff;
    color: #1f2a44;
    font: inherit;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 6px;
    cursor: pointer;
  }
  .card strong {
    font-size: 14px;
    line-height: 1.35;
  }
  .card.sel {
    border-color: #e8a33d;
    background: #fff8ec;
    transform: translateY(-3px);
  }
  .card.flash {
    border-color: #3b6fd8;
    animation: pop 0.5s ease-out;
  }
  @keyframes pop {
    40% {
      transform: scale(1.06);
    }
  }
  .badge {
    align-self: flex-start;
    padding: 2px 8px;
    border-radius: 999px;
    background: #fff1d9;
    color: #b8741a;
    font-size: 11px;
    font-weight: 700;
  }
  .msg {
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    animation: rise 0.25s ease-out;
  }
  .msg.ok {
    background: #e4edff;
    color: #2a56b3;
  }
  .msg.info {
    background: #eef1f5;
    color: #3a4560;
  }
  .msg.no {
    background: #fbe6e9;
    color: #b23a48;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
  h3 {
    margin: 18px 0 8px;
    font-size: 14px;
    color: #5b6781;
  }
  .inf {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .inf li {
    padding: 10px 12px;
    border-left: 4px solid #3b6fd8;
    border-radius: 10px;
    background: #fff;
  }
  .inf .pair {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: #5b6781;
  }
  .inf p {
    margin: 6px 0 0;
    font-size: 14px;
    line-height: 1.5;
    color: #3a4560;
  }
</style>
