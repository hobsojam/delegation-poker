function sanitizeSession(session, participantId) {
  const base = {
    id: session.id,
    phase: session.phase,
    scenario: session.scenario,
    round: session.round,
    history: session.history,
  };

  switch (session.phase) {
    case 'lobby':
      return {
        ...base,
        participants: session.participants.map(p => ({
          id: p.id,
          name: p.name,
          isFacilitator: p.isFacilitator,
        })),
      };

    case 'playing':
      return {
        ...base,
        participants: session.participants.map(p => ({
          id: p.id,
          name: p.name,
          isFacilitator: p.isFacilitator,
          hasVoted: p.choice !== null,
          ...(p.id === participantId && { myChoice: p.choice }),
        })),
      };

    case 'revealed':
      return {
        ...base,
        participants: session.participants.map(p => ({
          id: p.id,
          name: p.name,
          isFacilitator: p.isFacilitator,
          choice: p.choice,
        })),
      };

    default:
      return base;
  }
}

module.exports = { sanitizeSession };
