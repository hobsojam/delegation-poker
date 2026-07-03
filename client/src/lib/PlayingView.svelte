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
    gap: 20px;
    padding: clamp(18px, 3vw, 34px);
    height: 100%;
    overflow-y: auto;
    width: min(1280px, 100%);
    margin: 0 auto;
  }

  .scenario-box {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 18px 22px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    flex-shrink: 0;
  }

  .scenario-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .scenario-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
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
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
  }

  .level-card {
    min-width: 0;
    min-height: 190px;
    background: linear-gradient(160deg, color-mix(in srgb, var(--color) 11%, #141d30), #0c1322 72%);
    border: 1px solid var(--border);
    border-top-color: color-mix(in srgb, var(--color) 45%, transparent);
    border-radius: 16px;
    padding: 18px 10px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    text-align: center;
    transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
  }

  .level-card:hover {
    border-color: var(--color);
    transform: translateY(-4px);
    box-shadow: 0 16px 28px rgba(0,0,0,.2);
  }

  .level-card:active { transform: scale(0.97); }

  .level-card.selected {
    border-color: var(--color);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color) 70%, transparent), 0 18px 34px rgba(0,0,0,.26);
    transform: translateY(-4px);
  }

  .level-num {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: color-mix(in srgb, var(--color) 12%, transparent);
    font-size: 28px;
    font-weight: 900;
    color: var(--color);
    line-height: 1;
  }

  .level-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
  }

  .level-desc {
    font-size: 11px;
    color: var(--muted);
    line-height: 1.4;
  }

  .status-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-shrink: 0;
    flex-wrap: wrap;
    padding: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
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
    color: var(--muted);
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
    background: rgba(8,13,26,.45);
    border: 1px solid var(--border);
    border-radius: 99px;
    font-size: 13px;
    color: var(--muted);
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
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    flex-shrink: 0;
  }

  .btn-reveal:hover { background: #16a34a; color: white; }
  .btn-reveal:active { transform: scale(0.97); }

  .voted-badge {
    padding: 10px 18px;
    background: rgba(8,13,26,.45);
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 13px;
    color: var(--muted);
    flex-shrink: 0;
  }

  @media (max-width: 1050px) {
    .cards-grid { grid-template-columns: repeat(4, 1fr); }
    .level-card { min-height: 160px; }
  }

  @media (max-width: 620px) {
    .playing { padding: 14px; }
    .cards-grid { grid-template-columns: repeat(2, 1fr); }
    .level-card { min-height: 150px; }
    .level-card:last-child { grid-column: 1 / -1; }
    .status-row, .btn-reveal, .voted-badge { width: 100%; }
  }
</style>
