<script>
  import { LEVELS } from './levels.js';

  let { session, isFacilitator, myChoice, onVote, onReveal } = $props();

  let votedCount = $derived(session.participants.filter(p => p.hasVoted).length);
  let totalCount = $derived(session.participants.length);
</script>

<div class="playing">
  {#if session.scenario}
    <div class="scenario-box">
      <span class="scenario-label">Decision to delegate</span>
      <p class="scenario-text">{session.scenario}</p>
    </div>
  {/if}

  <div class="cards-section">
    <span class="cards-label">Choose your delegation level</span>
    <div class="cards-grid">
      {#each LEVELS as lvl}
        <button
          class="level-card"
          class:selected={myChoice === lvl.level}
          style="--color: {lvl.color}; --bg: {lvl.bg}"
          onclick={() => onVote(lvl.level)}
          aria-pressed={myChoice === lvl.level}
          aria-label="Level {lvl.level}: {lvl.name} — {lvl.desc}"
        >
          <span class="level-num">{lvl.level}</span>
          <span class="level-name">{lvl.name}</span>
          <span class="level-desc">{lvl.desc}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="status-row">
    <div class="voters">
      <span class="voters-label">Votes: {votedCount} / {totalCount}</span>
      <div class="voter-list">
        {#each session.participants as p}
          <div
            class="voter"
            class:voted={p.hasVoted}
            aria-label="{p.name}{p.isFacilitator ? ' (facilitator)' : ''}: {p.hasVoted ? 'voted' : 'waiting'}"
          >
            <span class="voter-indicator" aria-hidden="true">{p.hasVoted ? '✓' : '○'}</span>
            <span class="voter-name">{p.name}</span>
            {#if p.isFacilitator}<span class="fac-tag" aria-hidden="true">F</span>{/if}
          </div>
        {/each}
      </div>
    </div>

    {#if isFacilitator}
      <button class="btn-reveal" onclick={onReveal}>
        Reveal Votes
      </button>
    {:else if myChoice !== null}
      <div class="voted-badge">
        Voted — waiting for reveal
      </div>
    {/if}
  </div>
</div>

<style>
  .playing {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    height: 100%;
    overflow-y: auto;
  }

  .scenario-box {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 18px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .scenario-label {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .scenario-text {
    font-size: 16px;
    font-weight: 600;
    color: #e2e8f0;
    line-height: 1.5;
    margin: 0;
  }

  .cards-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
    min-height: 0;
  }

  .cards-label {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .cards-grid {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .level-card {
    flex: 1 1 0;
    min-width: 90px;
    max-width: 180px;
    min-height: 140px;
    background: var(--bg);
    border: 2px solid #334155;
    border-radius: 12px;
    padding: 14px 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    text-align: center;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  }

  .level-card:hover {
    border-color: var(--color);
    transform: translateY(-2px);
  }

  .level-card:active { transform: scale(0.97); }

  .level-card.selected {
    border-color: var(--color);
    box-shadow: 0 0 0 2px var(--color);
  }

  .level-num {
    font-size: 36px;
    font-weight: 900;
    color: var(--color);
    line-height: 1;
  }

  .level-name {
    font-size: 13px;
    font-weight: 700;
    color: #e2e8f0;
  }

  .level-desc {
    font-size: 11px;
    color: #94a3b8;
    line-height: 1.4;
  }

  .status-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .voters {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .voters-label {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .voter-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .voter {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 99px;
    font-size: 13px;
    color: #94a3b8;
    transition: border-color 0.15s;
  }

  .voter.voted {
    border-color: #22c55e;
    color: #e2e8f0;
  }

  .voter-indicator {
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
    color: #475569;
    width: 14px;
    text-align: center;
  }

  .voter.voted .voter-indicator { color: #22c55e; }

  .voter-name { font-size: 13px; font-weight: 500; }

  .fac-tag {
    font-size: 11px;
    font-weight: 700;
    color: #3b82f6;
    background: #0f1f3d;
    border-radius: 4px;
    padding: 1px 5px;
  }

  .btn-reveal {
    padding: 10px 24px;
    background: #22c55e;
    color: #052e16;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    flex-shrink: 0;
  }

  .btn-reveal:hover { background: #16a34a; color: white; }
  .btn-reveal:active { transform: scale(0.97); }

  .voted-badge {
    padding: 10px 18px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    font-size: 13px;
    color: #94a3b8;
    flex-shrink: 0;
  }
</style>
