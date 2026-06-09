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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    padding: 32px 16px;
    max-width: 540px;
    margin: 0 auto;
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }

  .code-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px 32px;
    background: #1e293b;
    border: 1.5px solid #334155;
    border-radius: 14px;
    width: 100%;
  }

  .code-label {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
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
    color: #e2e8f0;
  }

  .copy-btn {
    padding: 5px 12px;
    background: #334155;
    border: none;
    border-radius: 6px;
    color: #94a3b8;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .copy-btn:hover { background: #475569; color: #e2e8f0; }

  .code-hint {
    font-size: 12px;
    color: #94a3b8;
  }

  .participants-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .section-label {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
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
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 10px;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #334155;
    color: #e2e8f0;
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
    color: #e2e8f0;
    flex: 1;
  }

  .role-tag {
    font-size: 11px;
    font-weight: 600;
    color: #3b82f6;
    background: #172033;
    border: 1px solid #1e3a5f;
    border-radius: 99px;
    padding: 2px 8px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .muted {
    color: #94a3b8;
    font-size: 14px;
    text-align: center;
    padding: 12px 0;
  }

  .facilitator-controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
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
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  textarea {
    padding: 10px 14px;
    background: #1e293b;
    border: 1.5px solid #334155;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 14px;
    line-height: 1.5;
    outline: none;
    resize: vertical;
    font-family: inherit;
    width: 100%;
  }

  textarea:focus-visible { border-color: #60a5fa; outline: 2px solid #60a5fa; outline-offset: 2px; }

  .char-count {
    font-size: 11px;
    color: #94a3b8;
    text-align: right;
  }

  .btn-row {
    display: flex;
    justify-content: flex-end;
  }

  .btn-primary {
    padding: 10px 28px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-primary:hover:not(:disabled) { background: #2563eb; }
  .btn-primary:active:not(:disabled) { transform: scale(0.97); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .waiting {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  .waiting p {
    color: #94a3b8;
    font-size: 14px;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2.5px solid #334155;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
