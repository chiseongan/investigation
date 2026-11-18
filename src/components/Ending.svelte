<script lang="ts">
  // 엔딩: 결과 → 조치 카드 → 10년 후 → 회복 장면 → 게임에서 나오기
  import { CHARACTERS } from '../data/characters';
  import { ENDINGS, RECOVERY, TIMELINES } from '../data/endings';
  import { cardsFor, STATS } from '../data/penalties';
  import { SHOW_UNVERIFIED_STATS } from '../data/config';
  import { DAYS } from '../data/rooms';
  import { buildCode, formUrl, formConfigured } from '../lib/result';
  import type { GameState } from '../lib/gameState';

  let {
    gs,
    onRewind,
    onRestart,
  }: { gs: GameState; onRewind: (dayIndex: number) => void; onRestart: () => void } = $props();

  type Step = 'result' | 'penalty' | 'timeline' | 'recovery' | 'exit';
  let step: Step = $state('result');
  let rewinding = $state(false);
  let copied = $state(false);

  const verdict = $derived(gs.verdict!);
  const report = $derived(gs.report!);
  const def = $derived(ENDINGS[verdict.ending]);
  const name = $derived(CHARACTERS[report.picked].name);
  const fill = (s: string) => s.replaceAll('{이름}', name);
  const penalty = $derived(cardsFor(verdict.ending));
  const stats = $derived(STATS.filter((s) => s.verified || SHOW_UNVERIFIED_STATS));
  const timelines = $derived(TIMELINES[verdict.ending]);
  const recovery = $derived(RECOVERY[verdict.ending]);

  // 회복 장면
  let beatNo = $state(0);
  let reply: number | null = $state(null);
  const beatsShown = $derived(recovery.beats.slice(0, beatNo + 1));
  const atLast = $derived(beatNo >= recovery.beats.length - 1);

  const input = $derived({ ending: verdict.ending, verdict, shared: gs.shared, picked: report.picked });
  const code = $derived(buildCode(input));
  const link = $derived(formUrl(input));

  const order: Step[] = ['result', 'penalty', 'timeline', 'recovery', 'exit'];
  function next() {
    step = order[order.indexOf(step) + 1];
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
    } catch {
      copied = false;
    }
  }
  const speakerName = (id: string | null) => (id ? CHARACTERS[id as keyof typeof CHARACTERS].name : '');
</script>

<main class="screen {def.tone}">
  {#if step === 'result'}
    <p class="eyebrow">엔딩 {def.no} / 4</p>
    <h2>{def.title}</h2>
    {#each def.summary as p}<p class="body">{fill(p)}</p>{/each}

    {#if verdict.reasons.length}
      <div class="box">
        <h3>이렇게 되었어요</h3>
        <ul>{#each verdict.reasons as r}<li>{fill(r)}</li>{/each}</ul>
      </div>
    {/if}
    {#if gs.shared && verdict.ending !== 'participant'}
      <div class="box warn"><p>수사 중 사진 공유 버튼을 누른 기록이 남아 있어요.</p></div>
    {/if}

    <div class="actions">
      <button class="btn primary" onclick={next}>다음</button>
      {#if verdict.ending !== 'resolved'}
        <button class="btn ghost" onclick={() => (rewinding = !rewinding)}>{rewinding ? '되감기 닫기' : '시간을 되감는다'}</button>
      {/if}
      {#if rewinding}
        <div class="days">
          <p>어느 날 아침으로 돌아갈까요? 그 전에 모은 단서는 그대로 남아요.</p>
          {#each DAYS as d, i}
            {#if gs.snapshots[i]}<button class="btn day" onclick={() => onRewind(i)}>{d.label} 아침</button>{/if}
          {/each}
        </div>
      {/if}
    </div>
  {:else if step === 'penalty'}
    <p class="eyebrow">그 뒤에 일어날 수 있는 일</p>
    <h2>{penalty.heading}</h2>
    <ul class="pcards">
      {#each penalty.cards as c (c.id)}
        <li>
          <span class="no">{c.no}</span>
          <strong>{c.name}</strong>
          <span class="dots" aria-hidden="true">{#each Array(3) as _, i}<i class:on={i < c.level}></i>{/each}</span>
          <p>{c.desc}</p>
        </li>
      {/each}
    </ul>
    <p class="fine">실제 조치는 학교폭력대책심의위원회가 사안의 정도와 반성·화해 노력 등을 살펴 결정해요. 기준은 바뀔 수 있어요.</p>
    {#each stats as s}<p class="fine">{s.text}</p>{/each}
    <div class="actions"><button class="btn primary" onclick={next}>다음</button></div>
  {:else if step === 'timeline'}
    <p class="eyebrow">10년 뒤</p>
    <h2>이 선택이 이어질 수 있는 시간</h2>
    <p class="fine">실제 예측이 아니라 일어날 수 있는 가능성을 그린 글이에요.</p>
    {#each timelines as t}
      <section class="track">
        <h3>{fill(t.track)}</h3>
        <ol>
          {#each t.entries as e}
            <li><b>{e.when}</b><span>{fill(e.text)}</span></li>
          {/each}
        </ol>
      </section>
    {/each}
    <div class="actions"><button class="btn primary" onclick={next}>다음</button></div>
  {:else if step === 'recovery'}
    <p class="eyebrow">회복</p>
    <h2>마지막 장면</h2>
    <div class="beats">
      {#each beatsShown as b, i (i)}
        <p class="beat" class:narr={!b.speaker}>
          {#if b.speaker}<b>{speakerName(b.speaker)}</b>{/if}
          {fill(b.text)}
        </p>
      {/each}
      {#if reply !== null}
        {#each recovery.choices[reply].reply as b}
          <p class="beat" class:narr={!b.speaker}>
            {#if b.speaker}<b>{speakerName(b.speaker)}</b>{/if}
            {fill(b.text)}
          </p>
        {/each}
      {/if}
    </div>
    <div class="actions">
      {#if !atLast}
        <button class="btn primary" onclick={() => beatNo++}>다음</button>
      {:else if reply === null}
        {#each recovery.choices as c, i}
          <button class="btn choice" onclick={() => (reply = i)}>{fill(c.text)}</button>
        {/each}
      {:else}
        <button class="btn primary" onclick={next}>다음</button>
      {/if}
    </div>
  {:else}
    <p class="eyebrow">게임에서 나오기</p>
    <h2>수고했어요</h2>
    <p class="body">이야기 속 학교와 인물은 모두 가상이에요. 여기서 내린 선택은 실제 누구에게도 영향을 주지 않아요.</p>
    <div class="box">
      <h3>실제로 힘든 일이 있다면</h3>
      <ul>
        <li>혼자 견디지 말고 담임 선생님이나 상담 선생님께 말해요.</li>
        <li>학교폭력 신고·상담: <b>117</b> (24시간)</li>
        <li>청소년 상담: <b>1388</b></li>
      </ul>
    </div>
    <div class="box">
      <h3>결과 코드</h3>
      <p class="code">{code}</p>
      <p class="fine">이름이나 개인정보는 들어 있지 않아요. 선생님께 보여 주거나 설문에 입력해요.</p>
      <button class="btn ghost small" onclick={copy}>{copied ? '복사했어요' : '코드 복사'}</button>
      {#if link}
        <a class="btn primary linkbtn" href={link} target="_blank" rel="noopener noreferrer">설문 작성하기</a>
      {:else if !formConfigured()}
        <p class="fine">설문 링크는 아직 연결되지 않았어요.</p>
      {/if}
    </div>
    <div class="actions">
      <button class="btn ghost" onclick={onRestart}>새 수사 시작</button>
      <p class="fine">이 화면을 닫으면 게임에서 나온 것이 돼요. 기록은 저장되지 않아요.</p>
    </div>
  {/if}
</main>

<style>
  .screen {
    flex: 1;
    padding: 28px 18px calc(22px + env(safe-area-inset-bottom));
    overflow-y: auto;
    border-top: 6px solid #3b6fd8;
  }
  .screen.mid {
    border-top-color: #e8a33d;
  }
  .screen.bad {
    border-top-color: #b23a48;
  }
  .eyebrow {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: #b8741a;
  }
  h2 {
    margin: 6px 0 10px;
    font-size: 28px;
    color: #1f2a44;
  }
  h3 {
    margin: 0 0 6px;
    font-size: 15px;
    color: #1f2a44;
  }
  .body {
    margin: 0 0 10px;
    font-size: 16px;
    line-height: 1.6;
    color: #2d3858;
  }
  .fine {
    margin: 10px 0 0;
    font-size: 12px;
    line-height: 1.5;
    color: #5b6781;
  }
  .box {
    margin-top: 14px;
    padding: 12px 14px;
    border-radius: 12px;
    background: #fff;
  }
  .box.warn {
    background: #fbe6e9;
    color: #b23a48;
    font-weight: 700;
  }
  .box ul {
    margin: 0;
    padding-left: 18px;
    font-size: 14px;
    line-height: 1.55;
    color: #3a4560;
  }
  .box p {
    margin: 0;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 22px;
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
  .btn.small {
    min-height: 44px;
    font-size: 15px;
    margin-top: 8px;
    width: 100%;
  }
  .primary {
    background: #3b6fd8;
    color: #fff;
  }
  .ghost {
    background: #fff;
    color: #1f2a44;
    border: 2px solid #cfd7e5;
  }
  .choice {
    background: #fff;
    color: #1f2a44;
    border: 2px solid #3b6fd8;
    text-align: left;
    padding: 12px 14px;
    line-height: 1.45;
    font-size: 15px;
  }
  .linkbtn {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 8px;
    text-decoration: none;
  }
  .days {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .days p {
    margin: 0;
    font-size: 13px;
    color: #5b6781;
  }
  .day {
    background: #e4edff;
    color: #2a56b3;
    min-height: 48px;
  }
  .pcards {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .pcards li {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 4px 10px;
    padding: 12px 14px;
    border-left: 5px solid #b23a48;
    border-radius: 12px;
    background: #fff;
  }
  .pcards .no {
    font-size: 12px;
    font-weight: 800;
    color: #b23a48;
  }
  .pcards p {
    grid-column: 1 / -1;
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #3a4560;
  }
  .dots {
    display: flex;
    gap: 3px;
  }
  .dots i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d5dce8;
  }
  .dots i.on {
    background: #b23a48;
  }
  .track {
    margin-top: 16px;
  }
  .track ol {
    list-style: none;
    margin: 6px 0 0;
    padding: 0 0 0 14px;
    border-left: 3px solid #cfd7e5;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .track li {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .track li b {
    font-size: 12px;
    color: #3b6fd8;
  }
  .track li span {
    font-size: 14px;
    line-height: 1.5;
    color: #2d3858;
  }
  .beats {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .beat {
    margin: 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: #fff;
    font-size: 15px;
    line-height: 1.55;
    color: #1f2a44;
    animation: rise 0.3s ease-out;
  }
  .beat b {
    margin-right: 6px;
    color: #3b6fd8;
  }
  .beat.narr {
    background: transparent;
    color: #4a5670;
    font-style: italic;
  }
  .code {
    margin: 0;
    padding: 10px;
    border-radius: 8px;
    background: #eef1f5;
    font-family: ui-monospace, Consolas, monospace;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-align: center;
    color: #1f2a44;
    user-select: all;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
</style>
