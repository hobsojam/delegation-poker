<script>
  let { session, isFacilitator, onStartRound, onReset } = $props();

  let scenario = $state('');
  let copied = $state(false);

  function handleStart() {
    onStartRound(scenario.trim());
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(session.id);
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    } catch {
      // ignore
    }
  }
</script>

<div class="lobby">
  <div class="code-section">
    <span class="code-label">Session code</span>
    <div class="code-row">
      <span class="code">{session.id}</span>
      <button class="copy-btn" onclick={copyCode}>{copied ? 'Copied!' : 'Copy'}</button>
    </div>
    <span class="code-hint">Share this code so others can join</span>
  </div>

  <div class="participants-section">
    <span class="section-label">Participants ({session.participants.length})</span>
    <div class="participant-list">
      {#if session.participants.length === 0}
        <p class="muted">No one has joined yet…</p>
      {:else}
        {#each session.participants as p}
          <div class="participant">
            <span class="avatar">{p.name[0].toUpperCase()}</span>
            <span class="pname">{p.name}</span>
            {#if p.isFacilitator}<span class="role-tag">facilitator</span>{/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>

  {#if isFacilitator}
    <div class="facilitator-controls">
      <div class="field">
        <label for="scenario">Scenario (optional)</label>
        <textarea
          id="scenario"
          rows="3"
          maxlength="500"
          placeholder="Describe the decision or situation to delegate…"
          bind:value={scenario}
        ></textarea>
        <span class="char-count">{scenario.length}/500</span>
      </div>
      <div class="btn-row">
        <button class="btn-primary" onclick={handleStart} disabled={session.participants.length < 1}>
          Start Round
        </button>
      </div>
    </div>
  {:else}
    <div class="waiting">
      <div class="spinner"></div>
      <p>Waiting for the facilitator to start a round…</p>
    </div>
  {/if}
</div>

<style>
  .lobby {
    display: grid;
    grid-template-columns: minmax(260px, .8fr) minmax(320px, 1.2fr);
    align-content: start;
    gap: 18px;
    padding: clamp(22px, 4vw, 44px);
    max-width: 1040px;
    margin: 0 auto;
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }

  .code-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 28px 32px;
    background: linear-gradient(135deg, rgba(255,107,74,.12), rgba(124,169,255,.06)), var(--surface);
    border: 1px solid rgba(255,107,74,.25);
    border-radius: 20px;
    width: 100%;
    grid-column: 1 / -1;
    box-shadow: 0 18px 48px rgba(0,0,0,.16);
  }

  .code-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .code-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .code {
    font-size: 44px;
    font-weight: 900;
    letter-spacing: 0.15em;
    color: var(--text);
  }

  .copy-btn {
    padding: 5px 12px;
    background: rgba(255,255,255,.06);
    border: 1px solid var(--border);
    border-radius: 9px;
    color: var(--muted);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .copy-btn:hover { background: rgba(255,255,255,.1); color: var(--text); }

  .code-hint {
    font-size: 12px;
    color: var(--muted);
  }

  .participants-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    padding: 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
  }

  .section-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .participant-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .participant {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(8,13,26,.4);
    border: 1px solid var(--border);
    border-radius: 11px;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(145deg, #273655, #1e2a45);
    color: var(--text);
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .pname {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    flex: 1;
  }

  .role-tag {
    font-size: 11px;
    font-weight: 600;
    color: #a9c5ff;
    background: rgba(124,169,255,.09);
    border: 1px solid rgba(124,169,255,.22);
    border-radius: 99px;
    padding: 2px 8px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .muted {
    color: var(--muted);
    font-size: 14px;
    text-align: center;
    padding: 12px 0;
  }

  .facilitator-controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    padding: 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    position: relative;
  }

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  textarea {
    padding: 10px 14px;
    background: rgba(8,13,26,.52);
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    color: var(--text);
    font-size: 14px;
    line-height: 1.5;
    outline: none;
    resize: vertical;
    font-family: inherit;
    width: 100%;
  }

  textarea:focus-visible { border-color: var(--accent); outline: 3px solid var(--accent-soft); outline-offset: 1px; }

  .char-count {
    font-size: 11px;
    color: var(--muted);
    text-align: right;
  }

  .btn-row {
    display: flex;
    justify-content: flex-end;
  }

  .btn-primary {
    padding: 10px 28px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
  .btn-primary:active:not(:disabled) { transform: scale(0.97); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .waiting {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 40px 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
  }

  .waiting p {
    color: var(--muted);
    font-size: 14px;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2.5px solid var(--border-strong);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 720px) {
    .lobby { grid-template-columns: 1fr; padding: 18px; }
    .code-section { grid-column: 1; padding: 24px 18px; }
    .code { font-size: clamp(34px, 12vw, 44px); }
  }
</style>
