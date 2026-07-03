<script>
  import { sessionState, wsError, fatalWsError, connect, send, disconnect } from './ws.js';
  import JoinForm from './lib/JoinForm.svelte';
  import LobbyView from './lib/LobbyView.svelte';
  import PlayingView from './lib/PlayingView.svelte';
  import RevealedView from './lib/RevealedView.svelte';
  import RoundSummaryModal from './lib/RoundSummaryModal.svelte';

  let page = $state('home'); // 'home' | 'session'
  let joiningName = $state(null);
  let joiningIsFacilitator = $state(false);
  let hasJoined = $state(false);
  let selectedRound = $state(null);
  let liveAnnouncement = $state('');

  let lastAnnouncedPhase = null;
  $effect(() => {
    if (!session || session.phase === lastAnnouncedPhase) return;
    lastAnnouncedPhase = session.phase;
    const msgs = {
      lobby: 'Session reset. Waiting in lobby.',
      playing: `Round ${session.round} started. Choose your delegation level.`,
      revealed: `Votes revealed for round ${session.round}.`,
    };
    liveAnnouncement = msgs[session.phase] ?? '';
  });

  let session = $derived($sessionState);
  let error = $derived($wsError);
  let fatalError = $derived($fatalWsError);
  let myParticipant = $derived(
    session?.participants?.find(p => p.isSelf) ?? null
  );

  let isFacilitator = $derived(
    myParticipant?.isFacilitator ?? joiningIsFacilitator
  );

  let myChoice = $derived(
    myParticipant?.myChoice ?? null
  );

  let phaseBadge = $derived.by(() => {
    if (!session) return '';
    const labels = {
      lobby: 'Lobby',
      playing: 'Voting',
      revealed: 'Results',
    };
    return labels[session.phase] || '';
  });

  function handleJoin(sessionId, name, isFacilitator) {
    joiningName = name;
    joiningIsFacilitator = isFacilitator;
    page = 'session';
    connect(sessionId);
  }

  $effect(() => {
    if (session && joiningName && (!hasJoined || !myParticipant)) {
      hasJoined = true;
      send({ type: 'join', name: joiningName, isFacilitator: joiningIsFacilitator });
    }
  });

  function handleLeave() {
    selectedRound = null;
    disconnect();
    page = 'home';
    joiningName = null;
    joiningIsFacilitator = false;
    hasJoined = false;
  }
</script>

<div class="app">
  <header class:landing={page === 'home'}>
    <div class="brand">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="title">Delegation Poker</span>
    </div>
    {#if session}
      <span class="badge">{phaseBadge}</span>
      {#if session.round > 0}
        <div class="round-history">
          {#each (session.history ?? []) as entry}
            <button class="round-link" onclick={() => selectedRound = entry}>R{entry.round}</button>
          {/each}
          {#if session.phase === 'playing'}
            <span class="round-current">R{session.round}</span>
          {/if}
        </div>
      {/if}
      <span class="session-id">#{session.id}</span>
    {/if}
    {#if page === 'session'}
      <button class="leave-btn" onclick={handleLeave}>Leave</button>
    {/if}
  </header>

  <main>
    {#if page === 'home'}
      <JoinForm onJoin={handleJoin} />

    {:else if fatalError}
      <div class="screen">
        <p class="error">{fatalError}</p>
        <button class="btn-primary" onclick={handleLeave}>Back to home</button>
      </div>

    {:else if !session}
      <div class="screen"><p class="muted">Connecting…</p></div>

    {:else if session.phase === 'lobby'}
      <LobbyView
        {session}
        {isFacilitator}
        onStartRound={(scenario) => send({ type: 'start_round', scenario })}
        onReset={() => send({ type: 'reset' })}
      />

    {:else if session.phase === 'playing'}
      <PlayingView
        {session}
        {isFacilitator}
        {myChoice}
        onVote={(level) => send({ type: 'vote', level })}
        onReveal={() => send({ type: 'reveal' })}
      />

    {:else if session.phase === 'revealed'}
      <RevealedView
        {session}
        {isFacilitator}
        onSaveDecision={(decision) => send({ type: 'save_decision', ...decision })}
        onPlayAgain={() => send({ type: 'play_again' })}
        onReset={() => send({ type: 'reset' })}
      />
    {/if}

    {#if error && !fatalError}
      <div class="toast" role="alert">{error}</div>
    {/if}

    <div class="sr-only" aria-live="polite" aria-atomic="true">{liveAnnouncement}</div>
  </main>

  {#if selectedRound}
    <RoundSummaryModal entry={selectedRound} onClose={() => selectedRound = null} />
  {/if}
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }

  :global(:root) {
    color-scheme: dark;
    --canvas: #080d1a;
    --canvas-soft: #0d1425;
    --surface: rgba(20, 29, 48, 0.82);
    --surface-solid: #141d30;
    --surface-raised: #1a2540;
    --border: rgba(148, 163, 184, 0.16);
    --border-strong: rgba(148, 163, 184, 0.28);
    --text: #f4f7fb;
    --muted: #98a6bd;
    --accent: #ff6b4a;
    --accent-hover: #ff8266;
    --accent-soft: rgba(255, 107, 74, 0.12);
    --mint: #52d3a1;
    --blue: #7ca9ff;
    --shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
  }

  :global(body) {
    background:
      radial-gradient(circle at 15% 10%, rgba(73, 99, 255, 0.13), transparent 32rem),
      radial-gradient(circle at 88% 82%, rgba(255, 107, 74, 0.10), transparent 30rem),
      var(--canvas);
    color: var(--text);
    font-family: Inter, Aptos, 'Segoe UI', system-ui, -apple-system, sans-serif;
    height: 100dvh;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }

  :global(:focus-visible) {
    outline: 2px solid #60a5fa;
    outline-offset: 2px;
  }

  :global(.sr-only) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .app {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px clamp(16px, 3vw, 36px);
    background: rgba(8, 13, 26, 0.76);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(18px);
    flex-shrink: 0;
    min-height: 62px;
    flex-wrap: wrap;
    z-index: 20;
  }

  header.landing { border-bottom-color: transparent; background: transparent; }

  .brand { display: flex; align-items: center; gap: 10px; }

  .brand-mark {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 3px;
    padding: 7px;
    border-radius: 9px;
    background: linear-gradient(145deg, var(--accent), #ff9b5f);
    box-shadow: 0 8px 22px rgba(255, 107, 74, 0.22);
  }

  .brand-mark i { display: block; width: 3px; border-radius: 3px; background: #fff; }
  .brand-mark i:nth-child(1) { height: 7px; opacity: .7; }
  .brand-mark i:nth-child(2) { height: 11px; opacity: .85; }
  .brand-mark i:nth-child(3) { height: 15px; }

  .title {
    font-size: 14px;
    font-weight: 750;
    letter-spacing: -0.01em;
  }

  .badge {
    padding: 2px 10px;
    background: var(--accent-soft);
    border: 1px solid rgba(255, 107, 74, .3);
    color: #ffab98;
    color: white;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 600;
  }

  .round-history {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .round-link {
    padding: 2px 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 99px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
  }

  .round-link:hover {
    background: var(--surface-raised);
    color: var(--text);
  }

  .round-current {
    padding: 2px 8px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 99px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
  }

  .session-id {
    font-size: 12px;
    color: var(--muted);
    margin-left: auto;
  }

  .leave-btn {
    padding: 5px 12px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 9px;
    color: var(--muted);
    font-size: 12px;
    cursor: pointer;
  }

  .leave-btn:hover { background: var(--surface-raised); color: var(--text); }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    min-height: 0;
  }

  .screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    height: 100%;
    padding: 32px;
    text-align: center;
  }

  .muted { color: var(--muted); font-size: 14px; }
  .error { color: #f87171; font-size: 14px; max-width: 380px; line-height: 1.6; }

  .btn-primary {
    padding: 9px 20px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-primary:hover { background: var(--accent-hover); }

  .toast {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface-solid);
    border: 1px solid var(--border);
    color: #f87171;
    padding: 8px 20px;
    border-radius: 12px;
    font-size: 13px;
    pointer-events: none;
    z-index: 200;
    white-space: nowrap;
  }
</style>
