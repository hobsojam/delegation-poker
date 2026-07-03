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
    <div class="landing-copy">
      <span class="eyebrow"><i></i> Management 3.0 workshop tool</span>
      <h1>Make delegation<br /><em>crystal clear.</em></h1>
      <p class="lead">Turn fuzzy ownership into shared decisions. Vote privately, reveal together, and leave with an agreement everyone understands.</p>
      <div class="btn-row landing-actions">
        <button class="btn-primary" onclick={() => { mode = 'create'; error = ''; nameInput = ''; }}>
          Create a session <span aria-hidden="true">→</span>
        </button>
        <button class="btn-secondary" onclick={() => { mode = 'join'; error = ''; nameInput = ''; codeInput = ''; }}>
          Join with a code
        </button>
      </div>
      <div class="trust-row" aria-label="Product benefits">
        <span>Free to use</span><span>No sign-up</span><span>Real-time</span>
      </div>
    </div>
    <div class="level-preview" aria-hidden="true">
      <div class="preview-head">
        <span>Delegation levels</span>
        <span class="live-pill"><i></i> Live session</span>
      </div>
      <div class="preview-card featured">
        <span class="preview-number">4</span>
        <div><strong>Agree</strong><small>We decide together</small></div>
        <span class="check">✓</span>
      </div>
      <div class="preview-card offset-one">
        <span class="preview-number">5</span>
        <div><strong>Advise</strong><small>I advise, they decide</small></div>
      </div>
      <div class="preview-card offset-two">
        <span class="preview-number">6</span>
        <div><strong>Inquire</strong><small>They decide, then inform me</small></div>
      </div>
      <div class="preview-footer">
        <div><b>6/6</b><span>votes are in</span></div>
        <span class="reveal-chip">Ready to reveal</span>
      </div>
    </div>

  {:else if mode === 'create'}
    <div class="form-card">
      <button class="back-link" onclick={() => { mode = 'home'; error = ''; }}>← Back</button>
      <span class="form-kicker">Facilitator setup</span>
      <h2>Create a session</h2>
      <p>You'll guide the room, start rounds, and reveal votes when everyone is ready.</p>
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
      <button class="btn-primary" onclick={handleCreate} disabled={loading || !nameInput.trim()}>
        {loading ? 'Creating…' : 'Create session →'}
      </button>
    </div>
    </div>

  {:else if mode === 'join'}
    <div class="form-card">
    <button class="back-link" onclick={() => { mode = 'home'; error = ''; }}>← Back</button>
    <span class="form-kicker">Participant access</span>
    <h2>Join a session</h2>
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
      <button class="btn-primary" onclick={handleJoin} disabled={loading || !codeInput.trim() || !nameInput.trim()}>
        {loading ? 'Joining…' : 'Join session →'}
      </button>
    </div>
    </div>
  {/if}
</div>

<style>
  .screen {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(360px, .95fr);
    align-items: center;
    gap: clamp(40px, 8vw, 120px);
    height: 100%;
    width: min(1180px, 100%);
    margin: 0 auto;
    padding: clamp(32px, 6vw, 72px);
  }

  .landing-copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 22px;
  }

  .eyebrow, .form-kicker {
    color: #b7c2d4;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .13em;
    text-transform: uppercase;
  }

  .eyebrow { display: inline-flex; align-items: center; gap: 8px; }
  .eyebrow i { width: 7px; height: 7px; border-radius: 50%; background: var(--mint); box-shadow: 0 0 0 5px rgba(82, 211, 161, .1); }

  h1 {
    font-size: clamp(42px, 6vw, 72px);
    line-height: .98;
    font-weight: 780;
    letter-spacing: -0.055em;
    color: var(--text);
  }

  h1 em { color: var(--accent); font-style: normal; }

  .lead {
    color: var(--muted);
    max-width: 560px;
    font-size: clamp(16px, 1.5vw, 19px);
    line-height: 1.65;
    text-align: left;
  }

  h2 {
    font-size: 32px;
    font-weight: 760;
    letter-spacing: -0.035em;
  }

  p {
    color: #94a3b8;
    text-align: center;
    max-width: 430px;
    line-height: 1.6;
    font-size: 14px;
  }

  .btn-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .landing-actions { justify-content: flex-start; }

  .btn-primary, .btn-secondary {
    padding: 12px 20px;
    min-height: 48px;
    border-radius: 11px;
    border: 1px solid transparent;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.1s, transform 0.1s;
  }

  .btn-primary:active, .btn-secondary:active { transform: scale(0.97); }
  .btn-primary { background: var(--accent); color: white; box-shadow: 0 10px 28px rgba(255, 107, 74, .18); }
  .btn-primary:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-secondary { background: rgba(255,255,255,.035); border-color: var(--border-strong); color: var(--text); }
  .btn-secondary:hover { background: rgba(255,255,255,.07); }

  .trust-row { display: flex; flex-wrap: wrap; gap: 18px; color: #75849d; font-size: 12px; }
  .trust-row span::before { content: '✓'; color: var(--mint); margin-right: 6px; font-weight: 800; }

  .level-preview {
    position: relative;
    width: 100%;
    max-width: 480px;
    padding: 24px;
    border: 1px solid var(--border);
    border-radius: 24px;
    background: linear-gradient(145deg, rgba(27, 38, 63, .92), rgba(14, 22, 39, .95));
    box-shadow: var(--shadow);
    transform: rotate(1deg);
  }

  .level-preview::before { content: ''; position: absolute; inset: -1px; border-radius: inherit; padding: 1px; background: linear-gradient(145deg, rgba(255,255,255,.18), transparent 45%); pointer-events: none; }
  .preview-head, .preview-footer, .preview-card { display: flex; align-items: center; }
  .preview-head { justify-content: space-between; margin-bottom: 22px; color: #d7deea; font-size: 12px; font-weight: 750; }
  .live-pill { padding: 6px 9px; border: 1px solid var(--border); border-radius: 999px; color: var(--muted); font-size: 10px; }
  .live-pill i { display: inline-block; width: 6px; height: 6px; background: var(--mint); border-radius: 50%; margin-right: 5px; }
  .preview-card { position: relative; gap: 14px; padding: 16px 18px; margin-top: 10px; border: 1px solid var(--border); border-radius: 14px; background: rgba(8, 13, 26, .62); }
  .preview-card.featured { border-color: rgba(82, 211, 161, .58); background: rgba(82, 211, 161, .08); transform: translateX(-12px); box-shadow: 0 12px 28px rgba(0,0,0,.2); }
  .preview-card.offset-one { transform: translateX(8px); opacity: .85; }
  .preview-card.offset-two { transform: translateX(20px); opacity: .62; }
  .preview-number { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 11px; background: rgba(124,169,255,.12); color: var(--blue); font-size: 20px; font-weight: 850; }
  .featured .preview-number { color: var(--mint); background: rgba(82,211,161,.13); }
  .preview-card div { display: flex; flex-direction: column; gap: 3px; }
  .preview-card strong { font-size: 14px; }
  .preview-card small { color: var(--muted); font-size: 11px; }
  .check { margin-left: auto; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; background: var(--mint); color: #082217; font-weight: 900; }
  .preview-footer { justify-content: space-between; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--border); }
  .preview-footer div { display: flex; flex-direction: column; }
  .preview-footer b { font-size: 16px; }
  .preview-footer div span { color: var(--muted); font-size: 10px; }
  .reveal-chip { color: #9de7cc; font-size: 11px; font-weight: 750; }

  .form-card {
    grid-column: 1 / -1;
    justify-self: center;
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: min(460px, 100%);
    padding: clamp(26px, 5vw, 42px);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 22px;
    box-shadow: var(--shadow);
    backdrop-filter: blur(18px);
  }
  .form-card p { text-align: left; }
  .form-card .btn-row { justify-content: stretch; }
  .form-card .btn-primary { width: 100%; }
  .back-link { align-self: flex-start; background: none; border: 0; color: var(--muted); font: inherit; font-size: 13px; cursor: pointer; margin-bottom: 4px; }
  .back-link:hover { color: var(--text); }

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
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  input {
    padding: 10px 14px;
    background: rgba(8, 13, 26, .68);
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    color: var(--text);
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

  input:focus-visible { border-color: var(--accent); outline: 3px solid var(--accent-soft); outline-offset: 1px; }

  .error {
    color: #f87171;
    font-size: 13px;
    text-align: center;
  }

  @media (max-width: 800px) {
    .screen { grid-template-columns: 1fr; align-content: start; overflow-y: auto; gap: 44px; padding: 42px 22px 60px; }
    .landing-copy { align-items: center; text-align: center; }
    .lead { text-align: center; }
    .landing-actions { justify-content: center; }
    .level-preview { max-width: 420px; justify-self: center; transform: none; }
  }

  @media (max-width: 480px) {
    h1 { font-size: 42px; }
    .landing-actions, .landing-actions button { width: 100%; }
    .level-preview { padding: 18px; }
    .preview-card.featured, .preview-card.offset-one, .preview-card.offset-two { transform: none; }
    .trust-row { justify-content: center; }
  }
</style>
