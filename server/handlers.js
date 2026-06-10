const { WEBSOCKET_MESSAGE_ERRORS } = require('../shared/errors.json');
const { WebSocket } = require('ws');
const { addParticipant, removeParticipant, setVote, startRound, revealVotes, saveDecision, playAgain, resetSession } = require('./sessions');
const { validateShortText, shortText } = require('./validate');

const MAX_NAME_LEN = 50;
const MAX_SCENARIO_LEN = 500;
const MAX_DECISION_NOTES_LEN = 1000;
const VALID_LEVELS = new Set([1, 2, 3, 4, 5, 6, 7]);

function send(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function sendError(ws, code, message) {
  send(ws, { type: 'error', code, message });
  return false;
}

function handleJoin(ws, session, data) {
  const nameResult = validateShortText(data.name, MAX_NAME_LEN);
  if (!nameResult.ok) {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.INVALID_NAME, 'Name must be 1–50 characters');
  }
  const name = nameResult.value;
  const isFacilitator = !!data.isFacilitator;

  if (isFacilitator) {
    const takenByOther = session.participants.find(p => p.isFacilitator && p.id !== ws.participantId);
    if (takenByOther) {
      return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.NOT_FACILITATOR, 'This session already has a facilitator');
    }
  }

  addParticipant(session.id, { id: ws.participantId, name, isFacilitator, choice: null });
  ws.name = name;
  ws.isFacilitator = isFacilitator;

  return true;
}

function handleStartRound(ws, session, data) {
  if (!ws.isFacilitator) {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.NOT_FACILITATOR, 'Only the facilitator can start a round');
  }
  if (session.phase !== 'lobby' && session.phase !== 'revealed') {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.WRONG_PHASE, 'Can only start a round from lobby or revealed');
  }
  const scenario = shortText(data.scenario ?? '') ?? '';
  if (scenario.length > MAX_SCENARIO_LEN) {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.INVALID_SCENARIO, `Scenario must be at most ${MAX_SCENARIO_LEN} characters`);
  }
  startRound(session.id, scenario);
  return true;
}

function handleVote(ws, session, data) {
  if (session.phase !== 'playing') {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.WRONG_PHASE, 'Voting is only allowed during a round');
  }
  const level = Number(data.level);
  if (!Number.isInteger(level) || !VALID_LEVELS.has(level)) {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.INVALID_LEVEL, 'Level must be an integer from 1 to 7');
  }
  setVote(session.id, ws.participantId, level);
  return true;
}

function handleReveal(ws, session) {
  if (!ws.isFacilitator) {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.NOT_FACILITATOR, 'Only the facilitator can reveal votes');
  }
  if (session.phase !== 'playing') {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.WRONG_PHASE, 'Can only reveal during a round');
  }
  revealVotes(session.id);
  return true;
}

function handlePlayAgain(ws, session) {
  if (!ws.isFacilitator) {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.NOT_FACILITATOR, 'Only the facilitator can restart the round');
  }
  if (session.phase !== 'revealed') {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.WRONG_PHASE, 'Can only play again after revealing');
  }
  playAgain(session.id);
  return true;
}

function handleReset(ws, session) {
  if (!ws.isFacilitator) {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.NOT_FACILITATOR, 'Only the facilitator can reset the session');
  }
  resetSession(session.id);
  return true;
}

function handleSaveDecision(ws, session, data) {
  if (!ws.isFacilitator) {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.NOT_FACILITATOR, 'Only the facilitator can save decisions');
  }
  if (session.phase !== 'revealed') {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.WRONG_PHASE, 'Can only save a decision after revealing votes');
  }

  const round = Number(data.round ?? session.round);
  if (!Number.isInteger(round)) {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.INVALID_DECISION, 'Decision round is invalid');
  }

  const level = Number(data.level);
  if (!Number.isInteger(level) || !VALID_LEVELS.has(level)) {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.INVALID_LEVEL, 'Level must be an integer from 1 to 7');
  }

  const notes = shortText(data.notes ?? '') ?? '';
  if (notes.length > MAX_DECISION_NOTES_LEN) {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.INVALID_DECISION, `Decision notes must be at most ${MAX_DECISION_NOTES_LEN} characters`);
  }

  const saved = saveDecision(session.id, round, { level, notes });
  if (!saved) {
    return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.INVALID_DECISION, 'Decision round was not found');
  }

  return true;
}

function handleLeave(ws, session, context) {
  if (context?.hasOtherParticipantSocket?.()) return false;
  removeParticipant(session.id, ws.participantId);
  return true;
}

async function handleMessage(ws, session, data, context = {}) {
  switch (data.type) {
    case 'join':        return handleJoin(ws, session, data);
    case 'start_round': return handleStartRound(ws, session, data);
    case 'vote':        return handleVote(ws, session, data);
    case 'reveal':      return handleReveal(ws, session);
    case 'save_decision': return handleSaveDecision(ws, session, data);
    case 'play_again':  return handlePlayAgain(ws, session);
    case 'reset':       return handleReset(ws, session);
    case 'leave':       return handleLeave(ws, session, context);
    default:
      return sendError(ws, WEBSOCKET_MESSAGE_ERRORS.UNKNOWN_MESSAGE_TYPE, `Unknown message type: ${data.type}`);
  }
}

module.exports = { handleMessage };
