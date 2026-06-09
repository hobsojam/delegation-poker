<script>
  let { onJoin } = $props();

  let mode = $state('home'); // 'home' | 'create' | 'join'
  let nameInput = $state('');
  let codeInput = $state('');
  let error = $state('');
  let loading = $state(false);

  async function handleCreate() {
    const name = nameInput.trim();
    if (!name) { error = 'Enter your name'; return; }
    loading = true;
    error = '';
    try {
      const res = await fetch('/api/sessions', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create session');
      const { id } = await res.json();
      onJoin(id, name, true);
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function handleJoin() {
    const code = codeInput.trim().toUpperCase();
    const name = nameInput.trim();
    if (!code) { error = 'Enter a session code'; return; }
    if (!name) { error = 'Enter your name'; return; }
    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/sessions/${code}`);
      if (!res.ok) throw new Error('Session not found — check the code');
      onJoin(code, name, false);
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="screen">
  {#if mode === 'home'}
    <div class="hero">
      <h1>Delegation Poker</h1>
      <p>A Management 3.0 team exercise for agreeing on delegation levels for key decisions.</p>
    </div>
    <div class="btn-row">
      <button class="btn-primary" onclick={() => { mode = 'create'; error = ''; nameInput = ''; }}>
        Create Session
      </button>
      <button class="btn-secondary" onclick={() => { mode = 'join'; error = ''; nameInput = ''; codeInput = ''; }}>
        Join Session
      </button>
    </div>

  {:else if mode === 'create'}
    <h2>Create Session</h2>
    <p>You'll become the facilitator and control when the round starts and votes are revealed.</p>
    <div class="field">
      <label for="name-create">Your name</label>
      <input
        id="name-create"
        type="text"
        placeholder="e.g. Alex"
        maxlength="50"
        bind:value={nameInput}
        onkeydown={(e) => e.key === 'Enter' && handleCreate()}
      />
    </div>
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <div class="btn-row">
      <button class="btn-secondary" onclick={() => { mode = 'home'; error = ''; }}>← Back</button>
      <button class="btn-primary" onclick={handleCreate} disabled={loading || !nameInput.trim()}>
        {loading ? 'Creating…' : 'Create & Start'}
      </button>
    </div>

  {:else if mode === 'join'}
    <h2>Join Session</h2>
    <p>Enter the 4-letter code shared by your facilitator.</p>
    <div class="field">
      <label for="code">Session code</label>
      <input
        id="code"
        type="text"
        placeholder="e.g. ABCD"
        maxlength="4"
        bind:value={codeInput}
        oninput={() => { codeInput = codeInput.toUpperCase(); error = ''; }}
        onkeydown={(e) => e.key === 'Enter' && handleJoin()}
      />
    </div>
    <div class="field">
      <label for="name-join">Your name</label>
      <input
        id="name-join"
        type="text"
        placeholder="e.g. Alex"
        maxlength="50"
        bind:value={nameInput}
        onkeydown={(e) => e.key === 'Enter' && handleJoin()}
      />
    </div>
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <div class="btn-row">
      <button class="btn-secondary" onclick={() => { mode = 'home'; error = ''; }}>← Back</button>
      <button class="btn-primary" onclick={handleJoin} disabled={loading || !codeInput.trim() || !nameInput.trim()}>
        {loading ? 'Joining…' : 'Join Session'}
      </button>
    </div>
  {/if}
</div>

<style>
  .screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    height: 100%;
    padding: 32px;
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  h1 {
    font-size: 32px;
    font-weight: 900;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  h2 {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  p {
    color: #94a3b8;
    text-align: center;
    max-width: 400px;
    line-height: 1.6;
    font-size: 14px;
  }

  .btn-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn-primary, .btn-secondary {
    padding: 10px 24px;
    border-radius: 8px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.1s, transform 0.1s;
  }

  .btn-primary:active, .btn-secondary:active { transform: scale(0.97); }
  .btn-primary { background: #3b82f6; color: white; }
  .btn-primary:hover:not(:disabled) { background: #2563eb; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-secondary { background: #334155; color: #e2e8f0; }
  .btn-secondary:hover { background: #475569; }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 360px;
  }

  label {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  input {
    padding: 10px 14px;
    background: #1e293b;
    border: 1.5px solid #334155;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 16px;
    outline: none;
    width: 100%;
  }

  #code {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    text-align: center;
  }

  input:focus-visible { border-color: #60a5fa; outline: 2px solid #60a5fa; outline-offset: 2px; }

  .error {
    color: #f87171;
    font-size: 13px;
    text-align: center;
  }
</style>
