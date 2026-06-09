<script>
  import { LEVELS, levelById } from './levels.js';

  let { session, isFacilitator, onPlayAgain, onReset } = $props();

  let choices = $derived(
    session.participants
      .filter(p => p.choice !== null)
      .map(p => p.choice)
  );

  let hasConsensus = $derived(
    choices.length > 0 && new Set(choices).size === 1
  );

  let consensusLevel = $derived(hasConsensus ? choices[0] : null);

  let sortedParticipants = $derived(
    [...session.participants].sort((a, b) => {
      if (a.choice === null && b.choice !== null) return 1;
      if (a.choice !== null && b.choice === null) return -1;
      return (a.choice ?? 0) - (b.choice ?? 0);
    })
  );
</script>

<div class="revealed">
  {#if session.scenario}
    <div class="scenario-box">
      <span class="scenario-label">Decision to delegate</span>
      <p class="scenario-text">{session.scenario}</p>
    </div>
  {/if}

  <div class="results-section">
    <span class="section-label">Round {session.round} results</span>

    <div class="results-list">
      {#each sortedParticipants as p}
        <div class="result-row">
          <div class="player-info">
            <span class="avatar">{p.name[0].toUpperCase()}</span>
            <span class="player-name">{p.name}</span>
            {#if p.isFacilitator}<span class="fac-tag">facilitator</span>{/if}
          </div>
          {#if p.choice !== null}
            {@const lvl = levelById(p.choice)}
            <div class="choice-badge" style="--color: {lvl.color}; --bg: {lvl.bg}">
              <span class="choice-num">{p.choice}</span>
              <span class="choice-name">{lvl.name}</span>
            </div>
          {:else}
            <div class="no-choice">No vote</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div class="consensus-box" class:success={hasConsensus} class:warning={!hasConsensus}>
    {#if hasConsensus}
      {@const lvl = levelById(consensusLevel)}
      <span class="consensus-icon">✓</span>
      <span class="consensus-text">
        Consensus: <strong>Level {consensusLevel} — {lvl.name}</strong>
      </span>
    {:else}
      <span class="consensus-icon">○</span>
      <span class="consensus-text">No consensus — discuss and vote again</span>
    {/if}
  </div>

  {#if isFacilitator}
    <div class="controls">
      <button class="btn-again" onclick={onPlayAgain}>
        Play Again
      </button>
      <button class="btn-reset" onclick={onReset}>
        New Scenario
      </button>
    </div>
  {/if}
</div>

<style>
  .revealed {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    max-width: 640px;
    margin: 0 auto;
    width: 100%;
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

  .results-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .result-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 10px;
  }

  .player-info {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #334155;
    color: #e2e8f0;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .player-name {
    font-size: 14px;
    font-weight: 600;
    color: #e2e8f0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fac-tag {
    font-size: 11px;
    font-weight: 600;
    color: #3b82f6;
    background: #172033;
    border: 1px solid #1e3a5f;
    border-radius: 99px;
    padding: 2px 8px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .choice-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: var(--bg);
    border: 2px solid var(--color);
    border-radius: 8px;
    flex-shrink: 0;
  }

  .choice-num {
    font-size: 20px;
    font-weight: 900;
    color: var(--color);
    line-height: 1;
  }

  .choice-name {
    font-size: 13px;
    font-weight: 700;
    color: #e2e8f0;
  }

  .no-choice {
    font-size: 13px;
    color: #94a3b8;
    padding: 6px 14px;
  }

  .consensus-box {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 10px;
    border: 1.5px solid;
  }

  .consensus-box.success {
    background: #052e16;
    border-color: #22c55e;
  }

  .consensus-box.warning {
    background: #1c1404;
    border-color: #eab308;
  }

  .consensus-icon {
    font-size: 18px;
  }

  .consensus-box.success .consensus-icon { color: #22c55e; }
  .consensus-box.warning .consensus-icon { color: #eab308; }

  .consensus-text {
    font-size: 14px;
    color: #e2e8f0;
    line-height: 1.4;
  }

  .consensus-text strong { font-weight: 700; }

  .controls {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .btn-again {
    padding: 10px 24px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-again:hover { background: #2563eb; }
  .btn-again:active { transform: scale(0.97); }

  .btn-reset {
    padding: 10px 24px;
    background: #334155;
    color: #e2e8f0;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-reset:hover { background: #475569; }
  .btn-reset:active { transform: scale(0.97); }
</style>
