<script>
  import { LEVELS, levelById } from './levels.js';
  import DecisionSummary from './DecisionSummary.svelte';
  import { downloadDecisionPoster } from './poster.js';

  let { session, isFacilitator, onPlayAgain, onReset, onSaveDecision } = $props();

  let decisionLevel = $state('');
  let decisionNotes = $state('');
  let exportError = $state('');
  let isExporting = $state(false);

  let choices = $derived(
    session.participants
      .filter(p => p.choice !== null)
      .map(p => p.choice)
  );

  let hasConsensus = $derived(
    choices.length > 0 && new Set(choices).size === 1
  );

  let consensusLevel = $derived(hasConsensus ? choices[0] : null);
  let currentEntry = $derived(
    session.history?.find(entry => entry.round === session.round) ?? null
  );
  let currentDecision = $derived(currentEntry?.decision ?? null);
  let savedDecisionCount = $derived(
    (session.history ?? []).filter(entry => entry.decision?.level).length
  );

  let sortedParticipants = $derived(
    [...session.participants].sort((a, b) => {
      if (a.choice === null && b.choice !== null) return 1;
      if (a.choice !== null && b.choice === null) return -1;
      return (a.choice ?? 0) - (b.choice ?? 0);
    })
  );

  $effect(() => {
    if (currentDecision) {
      decisionLevel = String(currentDecision.level);
      decisionNotes = currentDecision.notes ?? '';
    } else if (consensusLevel) {
      decisionLevel = String(consensusLevel);
      decisionNotes = '';
    } else {
      decisionLevel = '';
      decisionNotes = '';
    }
  });

  function saveDecision() {
    const level = Number(decisionLevel);
    if (!level) return;
    onSaveDecision({ round: session.round, level, notes: decisionNotes });
  }

  async function downloadPoster(size) {
    exportError = '';
    isExporting = true;
    try {
      await downloadDecisionPoster(session, size);
    } catch (err) {
      exportError = err.message;
    } finally {
      isExporting = false;
    }
  }
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

  <div class="decision-section">
    <div class="section-heading">
      <span class="section-label">Decision record</span>
      {#if currentDecision}
        <span class="saved-tag">saved</span>
      {/if}
    </div>

    {#if currentDecision}
      <DecisionSummary decision={currentDecision} />
    {:else if !isFacilitator}
      <p class="muted-note">Waiting for the facilitator to save the final delegation decision.</p>
    {/if}

    {#if isFacilitator}
      <div class="decision-editor">
        <div class="field">
          <label for="decision-level">Final delegation level</label>
          <select id="decision-level" bind:value={decisionLevel}>
            <option value="">Choose a level</option>
            {#each LEVELS as lvl}
              <option value={String(lvl.level)}>Level {lvl.level} - {lvl.name}</option>
            {/each}
          </select>
        </div>

        <div class="field">
          <label for="decision-notes">Notes (optional)</label>
          <textarea
            id="decision-notes"
            rows="3"
            maxlength="1000"
            placeholder="Capture the agreed decision, boundaries, or follow-up..."
            bind:value={decisionNotes}
          ></textarea>
          <span class="char-count">{decisionNotes.length}/1000</span>
        </div>

        <button class="btn-save" onclick={saveDecision} disabled={!decisionLevel}>
          {currentDecision ? 'Update Decision' : 'Save Decision'}
        </button>
      </div>
    {/if}
  </div>

  <div class="poster-section">
    <div>
      <span class="section-label">Summary poster</span>
      <p class="poster-help">
        {savedDecisionCount} saved decision{savedDecisionCount === 1 ? '' : 's'} will be included.
      </p>
    </div>
    <div class="poster-actions">
      <button class="btn-poster" onclick={() => downloadPoster('a4')} disabled={!savedDecisionCount || isExporting}>Download A4</button>
      <button class="btn-poster primary" onclick={() => downloadPoster('a3')} disabled={!savedDecisionCount || isExporting}>Download A3</button>
    </div>
    {#if exportError}
      <p class="error-text">{exportError}</p>
    {/if}
  </div>

  {#if isFacilitator}
    <div class="controls">
      <button class="btn-again" onclick={onPlayAgain}>
        Play Again
      </button>
      <button class="btn-reset" onclick={() => {
        if (confirm('Reset session? This clears all round history.')) onReset();
      }}>
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
    max-width: 900px;
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
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
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
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
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

  .decision-section,
  .poster-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
  }

  .section-heading {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .saved-tag {
    padding: 2px 8px;
    background: #052e16;
    border: 1px solid #166534;
    border-radius: 99px;
    color: #86efac;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .muted-note,
  .poster-help,
  .error-text {
    font-size: 13px;
    line-height: 1.5;
  }

  .muted-note,
  .poster-help {
    color: #94a3b8;
  }

  .error-text {
    color: #f87171;
  }

  .decision-editor {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  select,
  textarea {
    padding: 10px 12px;
    background: rgba(8,13,26,.52);
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    color: var(--text);
    font: inherit;
    outline: none;
  }

  textarea {
    resize: vertical;
    min-height: 84px;
  }

  select:focus-visible,
  textarea:focus-visible {
    border-color: #60a5fa;
    outline: 2px solid #60a5fa;
    outline-offset: 2px;
  }

  .char-count {
    color: #94a3b8;
    font-size: 11px;
    text-align: right;
  }

  .btn-save,
  .btn-poster {
    padding: 9px 16px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .btn-save {
    align-self: flex-end;
    background: #22c55e;
    color: #052e16;
  }

  .btn-save:hover:not(:disabled) { background: #16a34a; color: white; }

  .poster-section {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .poster-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .btn-poster {
    background: #334155;
    color: #e2e8f0;
  }

  .btn-poster.primary {
    background: var(--accent);
    color: white;
  }

  .btn-poster:hover:not(:disabled) { filter: brightness(1.1); }

  .btn-save:disabled,
  .btn-poster:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .btn-again {
    padding: 10px 24px;
    background: var(--accent);
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
