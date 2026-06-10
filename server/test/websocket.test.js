const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const WebSocket = require('ws');
const { server, wss } = require('../index');
const { createSession } = require('../sessions');
const { WEBSOCKET_MESSAGE_ERRORS } = require('../../shared/errors.json');

let baseUrl;

before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `ws://127.0.0.1:${port}/ws`;
});

after(async () => {
  for (const client of wss.clients) {
    closeSocket(client);
  }
  await new Promise((resolve) => wss.close(resolve));
  await new Promise((resolve, reject) => {
    server.close((err) => err ? reject(err) : resolve());
  });
});

function closeSocket(ws) {
  if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
    ws.close();
  }
}

async function connect(sessionId, participantId) {
  const ws = new WebSocket(`${baseUrl}?sessionId=${sessionId}&participantId=${participantId}`);
  const initialState = waitForMessage(ws, (msg) => msg.type === 'state', 'initial state');
  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
  await initialState;
  return ws;
}

function sendJson(ws, payload) {
  ws.send(JSON.stringify(payload));
}

function waitForMessage(ws, predicate, label = 'message') {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for WebSocket ${label}`));
    }, 1000);

    function cleanup() {
      clearTimeout(timeout);
      ws.off('message', onMessage);
      ws.off('error', onError);
      ws.off('close', onClose);
    }

    function onError(err) {
      cleanup();
      reject(err);
    }

    function onClose() {
      cleanup();
      reject(new Error('Socket closed while waiting for message'));
    }

    function onMessage(raw) {
      const msg = JSON.parse(raw);
      if (!predicate(msg)) return;
      cleanup();
      resolve(msg);
    }

    ws.on('message', onMessage);
    ws.on('error', onError);
    ws.on('close', onClose);
  });
}

function waitForState(ws, predicate, label = 'state') {
  return waitForMessage(ws, (msg) => msg.type === 'state' && predicate(msg.session), label);
}

test('only one facilitator can join a session', async () => {
  const session = createSession();
  const facilitator = await connect(session.id, 'facilitator');
  const secondFacilitator = await connect(session.id, 'second-facilitator');

  try {
    const facilitatorJoined = waitForState(facilitator, (state) => state.participants.some(p => p.isFacilitator), 'facilitator join state');
    sendJson(facilitator, { type: 'join', name: 'Ari', isFacilitator: true });
    await facilitatorJoined;

    const rejected = waitForMessage(secondFacilitator, (msg) => msg.type === 'error', 'second facilitator rejection');
    sendJson(secondFacilitator, { type: 'join', name: 'Blair', isFacilitator: true });
    const error = await rejected;

    assert.equal(error.code, WEBSOCKET_MESSAGE_ERRORS.NOT_FACILITATOR);
  } finally {
    closeSocket(facilitator);
    closeSocket(secondFacilitator);
  }
});

test('votes stay hidden during play and are visible after reveal', async () => {
  const session = createSession();
  const facilitator = await connect(session.id, 'facilitator-vote-test');
  const player = await connect(session.id, 'player-vote-test');

  try {
    const facilitatorJoined = waitForState(facilitator, (state) => state.participants.length === 1, 'facilitator joined');
    sendJson(facilitator, { type: 'join', name: 'Casey', isFacilitator: true });
    await facilitatorJoined;

    const playerJoined = waitForState(facilitator, (state) => state.participants.length === 2, 'player joined');
    sendJson(player, { type: 'join', name: 'Devon', isFacilitator: false });
    await playerJoined;

    const roundStarted = waitForState(player, (state) => state.phase === 'playing', 'round started');
    sendJson(facilitator, { type: 'start_round', scenario: 'Approve budget' });
    await roundStarted;

    const voteRecorded = waitForState(facilitator, (state) => {
      const voter = state.participants.find(p => p.id === 'player-vote-test');
      return state.phase === 'playing' && voter?.hasVoted;
    }, 'hidden vote state');
    sendJson(player, { type: 'vote', level: 4 });
    const hiddenState = await voteRecorded;
    const hiddenVoter = hiddenState.session.participants.find(p => p.id === 'player-vote-test');

    assert.equal(hiddenVoter.hasVoted, true);
    assert.equal(hiddenVoter.choice, undefined);
    assert.equal(hiddenVoter.myChoice, undefined);

    const votesRevealed = waitForState(player, (state) => state.phase === 'revealed', 'revealed state');
    sendJson(facilitator, { type: 'reveal' });
    const revealedState = await votesRevealed;
    const revealedVoter = revealedState.session.participants.find(p => p.id === 'player-vote-test');

    assert.equal(revealedVoter.choice, 4);
  } finally {
    closeSocket(facilitator);
    closeSocket(player);
  }
});
