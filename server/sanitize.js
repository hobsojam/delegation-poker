function sanitizeSession(session, participantId) {
  function participantBase(p) {
    return {
      name: p.name,
      isFacilitator: p.isFacilitator,
      isSelf: p.id === participantId,
    };
  }

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
        participants: session.participants.map(participantBase),
      };

    case 'playing':
      return {
        ...base,
        participants: session.participants.map(p => ({
          ...participantBase(p),
          hasVoted: p.choice !== null,
          ...(p.id === participantId && { myChoice: p.choice }),
        })),
      };

    case 'revealed':
      return {
        ...base,
        participants: session.participants.map(p => ({
          ...participantBase(p),
          choice: p.choice,
        })),
      };

    default:
      return base;
  }
}

module.exports = { sanitizeSession };
