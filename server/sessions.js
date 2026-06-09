const sessions = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (sessions.has(code));
  return code;
}

function createSession() {
  const id = generateCode();
  const session = {
    id,
    phase: 'lobby',
    scenario: '',
    round: 0,
    history: [],
    participants: [],
    lastActivityAt: Date.now(),
  };
  sessions.set(id, session);
  return session;
}

function getSession(id) {
  return sessions.get(id);
}

function getAllSessions() {
  return Array.from(sessions.values());
}

function markActivity(session) {
  session.lastActivityAt = Date.now();
}

function addParticipant(sessionId, participant) {
  const session = sessions.get(sessionId);
  if (!session) return;
  const existing = session.participants.find(p => p.id === participant.id);
  if (existing) {
    existing.name = participant.name;
    existing.isFacilitator = participant.isFacilitator;
    markActivity(session);
    return;
  }
  session.participants.push(participant);
  markActivity(session);
}

function removeParticipant(sessionId, participantId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.participants = session.participants.filter(p => p.id !== participantId);
}

function setVote(sessionId, participantId, level) {
  const session = sessions.get(sessionId);
  if (!session) return;
  const participant = session.participants.find(p => p.id === participantId);
  if (participant) {
    participant.choice = level;
    markActivity(session);
  }
}

function startRound(sessionId, scenario) {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.scenario = scenario;
  session.round += 1;
  session.phase = 'playing';
  for (const p of session.participants) p.choice = null;
  markActivity(session);
}

function revealVotes(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.history.push({
    round: session.round,
    scenario: session.scenario,
    votes: session.participants.map(p => ({ name: p.name, choice: p.choice })),
  });
  session.phase = 'revealed';
  markActivity(session);
}

function playAgain(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.round += 1;
  session.phase = 'playing';
  for (const p of session.participants) p.choice = null;
  markActivity(session);
}

function resetSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.phase = 'lobby';
  session.scenario = '';
  session.round = 0;
  session.history = [];
  for (const p of session.participants) p.choice = null;
  markActivity(session);
}

function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = {
  createSession,
  getSession,
  getAllSessions,
  addParticipant,
  removeParticipant,
  setVote,
  startRound,
  revealVotes,
  playAgain,
  resetSession,
  deleteSession,
};
