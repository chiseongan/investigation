<script lang="ts">
  // 시작 화면 + 수사관 임명(브리핑, 규칙 1장)
  import { DAY_SECONDS } from '../data/config';
  import type { Mode } from '../lib/gameState';

  let {
    phase,
    canResume = false,
    onResume = () => {},
    onNew,
    onBegin,
  }: { phase: 'title' | 'briefing'; canResume?: boolean; onResume?: () => void; onNew: () => void; onBegin: (mode: Mode) => void } = $props();
</script>

<main class="screen">
  {#if phase === 'title'}
    <div class="center">
      <p class="eyebrow">학교 안전 수사관</p>
      <h1>잠입 수사<br /><small>2학년 2반의 일주일</small></h1>
      <p class="sub">이 이야기의 학교와 인물은 모두 가상입니다.</p>
    </div>
    <div class="actions">
      {#if canResume}<button class="btn primary" onclick={onResume}>이어서 하기</button>{/if}
      <button class="btn" class:primary={!canResume} class:ghost={canResume} onclick={onNew}>새 수사 시작</button>
      <p class="fine">소리 없음 · 로그인 없음 · 개인정보를 수집하지 않아요{canResume ? ' · 이어하기는 이 탭에만 남아요' : ''}</p>
    </div>
  {:else}
    <div class="center left">
      <p class="eyebrow">수사관 임명</p>
      <h2>제보가 들어왔습니다</h2>
      <p class="quote">"2반에서 누군가 괴롭힘을 당하고 있다. 누가, 어떻게인지는 모른다."</p>
      <p>당신은 교육청이 보낸 학교 안전 수사관입니다. 2학년 2반에 <b>전학생</b>으로 위장해 잠입하세요. 월요일부터 목요일까지 관찰하고, 금요일에 최종 보고를 합니다.</p>
      <div class="rules">
        <h3>수사 규칙</h3>
        <ul>
          <li>하루는 등교, 쉬는 시간, 점심처럼 아침부터 차례로 흘러가요. 탐색형은 앞 시간대를 관찰해야 다음이 열리고, 대화형은 자동으로 이어집니다.</li>
          <li>탐색형은 하루가 약 <b>{Math.round(DAY_SECONDS / 60)}분</b>이고, 종이 울리면 하루가 끝납니다.</li>
          <li>탐색형은 바닥을 탭해 이동하고 인물 옆에서, 대화형은 시간이 흐르며 마주치는 인물들과 차례로 대화합니다. 이야기와 단서는 같아요.</li>
          <li>어떻게 말을 걸지는 <b>스스로 판단</b>하세요. 표시나 점수는 없습니다. 사람들은 당신의 말과 태도에 따라 반응할 거예요.</li>
          <li>거칠어 보여도 장난일 수 있고, 평범해 보여도 신호일 수 있어요. 신중하게 판단하세요.</li>
        </ul>
      </div>
    </div>
    <div class="actions">
      <button class="btn primary" onclick={() => onBegin('explore')}>
        탐색형으로 시작<small>교실을 걸어 다니며 인물에게 다가가요</small>
      </button>
      <button class="btn primary alt" onclick={() => onBegin('novel')}>
        대화형으로 시작<small>시간이 흐르며 만나는 사람들과 차례로 대화해요</small>
      </button>
    </div>
  {/if}
</main>

<style>
  .screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 28px 22px calc(22px + env(safe-area-inset-bottom));
    background: #1f2a44;
    color: #fff;
    overflow-y: auto;
  }
  .center {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 12px;
  }
  .center.left {
    justify-content: flex-start;
    line-height: 1.6;
  }
  .eyebrow {
    margin: 0;
    font-size: 14px;
    letter-spacing: 0.08em;
    color: #e8a33d;
    font-weight: 700;
  }
  h1 {
    margin: 0;
    font-size: 44px;
    line-height: 1.15;
  }
  h1 small {
    font-size: 20px;
    font-weight: 500;
    color: #b9c4dc;
  }
  h2 {
    margin: 0;
    font-size: 26px;
  }
  .sub,
  .fine {
    margin: 0;
    font-size: 13px;
    color: #9aa8c6;
  }
  .quote {
    margin: 0;
    padding: 12px 14px;
    border-left: 4px solid #e8a33d;
    background: #2a3757;
    border-radius: 8px;
  }
  .rules {
    background: #2a3757;
    border-radius: 14px;
    padding: 14px 16px;
  }
  .rules h3 {
    margin: 0 0 6px;
    font-size: 15px;
    color: #e8a33d;
  }
  .rules ul {
    margin: 0;
    padding-left: 18px;
    font-size: 14px;
    color: #dbe3f5;
  }
  .rules li + li {
    margin-top: 4px;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    padding-top: 14px;
  }
  .btn {
    width: 100%;
    min-height: 52px;
    border: 0;
    border-radius: 14px;
    font: inherit;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
  }
  .primary {
    background: #3b6fd8;
    color: #fff;
  }
  .primary.alt {
    background: #2a3757;
    border: 2px solid #3b6fd8;
  }
  .btn small {
    display: block;
    margin-top: 2px;
    font-size: 13px;
    font-weight: 500;
    color: #dbe3f5;
  }
  .ghost {
    background: transparent;
    color: #dbe3f5;
    border: 2px solid #5b6b91;
  }
</style>
