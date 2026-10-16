<script>
  import { fly } from 'svelte/transition';
  import { LEVELS, levelById } from './levels.js';
  import DecisionSummary from './DecisionSummary.svelte';
  import { downloadDecisionPoster } from './poster.js';

  let { session, isFacilitator, onPlayAgain, onReset, onSaveDecision } = $props();

  let decisionLevel = $state('');
  let decisionNotes = $state('');
  let exportError = $state('');
  let isExporting = $state(false);
  let barsGrown = $state(false);

  $effect(() => {
    const t = setTimeout(() => { barsGrown = true; }, 30);
    return () => clearTimeout(t);
  });

  let choices = $derived(
    session.participants
      .filter(p => p.choice !== null)
      .map(p => p.choice)
  );

  let voteCounts = $derived(
    LEVELS.map(lvl => ({ ...lvl, count: choices.filter(c => c === lvl.level).length }))
  );

  let maxVoteCount = $derived(Math.max(1, ...voteCounts.map(l => l.count)));

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

  <div class="spread-section">
    <span class="section-label">Vote spread</span>
    <div class="spread-bars">
      {#each voteCounts as lvl}
        <div class="spread-col">
          <span class="spread-count" class:zero={!lvl.count} style="color: {lvl.count ? lvl.color : 'var(--muted)'}">{lvl.count}</span>
          <div class="spread-track">
            <div
              class="spread-bar"
              style="--color: {lvl.color}; height: {barsGrown ? Math.max(6, (lvl.count / maxVoteCount) * 100) : 0}%"
            ></div>
          </div>
          <span class="spread-level" style="color: {lvl.color}">{lvl.level}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="results-section">
    <span class="section-label">Round {session.round} results</span>

    <div class="results-list">
      {#each sortedParticipants as p, i}
        <div class="result-row" in:fly={{ y: 10, duration: 280, delay: i * 50 }}>
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

  <div
    class="consensus-box"
    class:success={hasConsensus}
    class:warning={!hasConsensus}
    in:fly={{ y: 10, duration: 280, delay: sortedParticipants.length * 50 + 60 }}
  >
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

  .spread-section {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px 18px 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
  }

  .spread-bars {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px;
    align-items: end;
  }

  .spread-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .spread-count {
    font-size: 15px;
    font-weight: 800;
  }

  .spread-count.zero { opacity: 0.4; }

  .spread-track {
    width: 100%;
    height: 96px;
    display: flex;
    align-items: flex-end;
    border-radius: 8px;
    background: rgba(8, 13, 26, 0.4);
    overflow: hidden;
  }

  .spread-bar {
    width: 100%;
    border-radius: 6px 6px 0 0;
    background: linear-gradient(180deg, var(--color), color-mix(in srgb, var(--color) 60%, transparent));
    box-shadow: 0 0 16px color-mix(in srgb, var(--color) 45%, transparent);
    transition: height 0.55s cubic-bezier(0.16, 0.84, 0.44, 1);
  }

  .spread-level {
    font-size: 12px;
    font-weight: 800;
  }

  .results-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
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
    background: linear-gradient(145deg, #273655, #1e2a45);
    color: var(--text);
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
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fac-tag {
    font-size: 11px;
    font-weight: 600;
    color: var(--blue);
    background: rgba(124, 169, 255, .09);
    border: 1px solid rgba(124, 169, 255, .22);
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
    color: var(--text);
  }

  .no-choice {
    font-size: 13px;
    color: var(--muted);
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
    background: var(--success-bg);
    border-color: var(--success);
  }

  .consensus-box.warning {
    background: var(--warning-bg);
    border-color: var(--warning);
  }

  .consensus-icon {
    font-size: 18px;
  }

  .consensus-box.success .consensus-icon { color: var(--success); }
  .consensus-box.warning .consensus-icon { color: var(--warning); }

  .consensus-text {
    font-size: 14px;
    color: var(--text);
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
    background: var(--success-bg);
    border: 1px solid var(--success-strong);
    border-radius: 99px;
    color: var(--success);
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
    color: var(--muted);
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
    color: var(--muted);
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
    border-color: var(--accent);
    outline: 3px solid var(--accent-soft);
    outline-offset: 1px;
  }

  .char-count {
    color: var(--muted);
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
    background: var(--success);
    color: var(--success-bg);
  }

  .btn-save:hover:not(:disabled) { background: var(--success-strong); color: white; }

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
    background: rgba(255, 255, 255, .035);
    border: 1px solid var(--border-strong);
    color: var(--text);
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

  .btn-again:hover { background: var(--accent-hover); }
  .btn-again:active { transform: scale(0.97); }

  .btn-reset {
    padding: 10px 24px;
    background: rgba(255, 255, 255, .035);
    color: var(--text);
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-reset:hover { background: rgba(255, 255, 255, .07); }
  .btn-reset:active { transform: scale(0.97); }
</style>
