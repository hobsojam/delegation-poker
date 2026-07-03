<script>
  import { levelById } from './levels.js';
  import DecisionSummary from './DecisionSummary.svelte';

  let { entry, onClose } = $props();

  let choices = $derived(entry.votes.filter(v => v.choice !== null).map(v => v.choice));
  let hasConsensus = $derived(choices.length > 0 && new Set(choices).size === 1);
  let sortedVotes = $derived([...entry.votes].sort((a, b) => (a.choice ?? 99) - (b.choice ?? 99)));

  let modalEl = $state(null);

  $effect(() => {
    modalEl?.focus();
  });

  function handleModalKeydown(e) {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key !== 'Tab') return;
    const focusable = modalEl?.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
</script>

<div class="overlay">
  <button class="backdrop" onclick={onClose} aria-label="Close dialog"></button>
  <div class="modal" role="dialog" aria-modal="true" tabindex="-1" bind:this={modalEl} onkeydown={handleModalKeydown}>
    <div class="modal-header">
      <span class="modal-title">Round {entry.round}</span>
      <button class="close-btn" onclick={onClose}>×</button>
    </div>

    {#if entry.scenario}
      <p class="modal-scenario">{entry.scenario}</p>
    {:else}
      <p class="modal-scenario muted">No scenario set</p>
    {/if}

    {#if entry.decision}
      <DecisionSummary decision={entry.decision} />
    {/if}

    <div class="vote-list">
      {#each sortedVotes as v}
        <div class="vote-row">
          <span class="vote-name">{v.name}</span>
          {#if v.choice !== null}
            {@const lvl = levelById(v.choice)}
            <span class="vote-badge" style="--color: {lvl.color}; --bg: {lvl.bg}">
              <span class="vote-num">{v.choice}</span>
              <span class="vote-lname">{lvl.name}</span>
            </span>
          {:else}
            <span class="no-vote">No vote</span>
          {/if}
        </div>
      {/each}
    </div>

    <div class="consensus" class:success={hasConsensus} class:warning={!hasConsensus}>
      {#if hasConsensus}
        {@const lvl = levelById(choices[0])}
        <span>✓</span>
        <span>Consensus: <strong>Level {choices[0]} — {lvl.name}</strong></span>
      {:else}
        <span>○</span>
        <span>No consensus</span>
      {/if}
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500;
    padding: 16px;
  }

  .backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    cursor: default;
  }

  .modal {
    position: relative;
    background: var(--surface-solid);
    border: 1px solid var(--border);
    border-radius: 20px;
    width: 100%;
    max-width: 440px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px;
    box-shadow: var(--shadow);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-title {
    font-size: 16px;
    font-weight: 700;
    color: #e2e8f0;
  }

  .close-btn {
    width: 28px;
    height: 28px;
    background: #334155;
    border: none;
    border-radius: 6px;
    color: #94a3b8;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover { background: #475569; color: #e2e8f0; }

  .modal-scenario {
    font-size: 14px;
    color: #94a3b8;
    line-height: 1.5;
    margin: 0;
    padding: 10px 14px;
    background: rgba(8,13,26,.52);
    border-radius: 10px;
    font-style: italic;
  }

  .modal-scenario.muted { color: #94a3b8; }

  .vote-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .vote-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .vote-name {
    font-size: 14px;
    font-weight: 500;
    color: #e2e8f0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vote-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: var(--bg);
    border: 1.5px solid var(--color);
    border-radius: 6px;
    flex-shrink: 0;
  }

  .vote-num {
    font-size: 16px;
    font-weight: 900;
    color: var(--color);
    line-height: 1;
  }

  .vote-lname {
    font-size: 12px;
    font-weight: 700;
    color: #e2e8f0;
  }

  .no-vote {
    font-size: 12px;
    color: #94a3b8;
    padding: 4px 12px;
  }

  .consensus {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid;
    font-size: 13px;
    color: #e2e8f0;
  }

  .consensus.success { background: #052e16; border-color: #22c55e; }
  .consensus.warning { background: #1c1404; border-color: #eab308; }
  .consensus strong { font-weight: 700; }
</style>
