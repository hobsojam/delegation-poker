<script>
  import { levelById } from './levels.js';

  let { decision } = $props();
  let level = $derived(levelById(decision.level));
</script>

<div class="decision-summary" style="--color: {level.color}; --bg: {level.bg}">
  <span class="decision-label">Saved decision</span>
  <div class="decision-level">
    <span class="decision-num">{level.level}</span>
    <div>
      <strong>{level.name}</strong>
      <span>{level.desc}</span>
    </div>
  </div>
  {#if decision.notes}
    <p>{decision.notes}</p>
  {:else}
    <p class="muted">No notes recorded.</p>
  {/if}
</div>

<style>
  .decision-summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 14px;
    background: var(--bg);
    border: 1.5px solid var(--color);
    border-radius: 8px;
  }

  .decision-label {
    color: #94a3b8;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .decision-level {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .decision-num {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--color);
    color: white;
    font-size: 20px;
    font-weight: 900;
    flex-shrink: 0;
  }

  .decision-level div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .decision-level strong {
    color: #e2e8f0;
    font-size: 15px;
  }

  .decision-level span:last-child,
  p {
    color: #cbd5e1;
    font-size: 12px;
    line-height: 1.4;
  }

  p {
    margin: 0;
  }

  .muted {
    color: #94a3b8;
  }
</style>
