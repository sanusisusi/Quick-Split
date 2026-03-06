const { v4: uuidv4 } = require("uuid");
const sessions = require("../storage/sessionStore");

const {
  equalSplit,
  itemSplit,
  paymentProgress
} = require("../utils/calculateSplit");

/**
 * Create new session
 */
function createSession(hostName, totalBill, items = []) {

  const sessionId = uuidv4();

  const session = {
    id: sessionId,
    hostName,
    totalBill,
    items,
    participants: [],
    createdAt: new Date()
  };

  sessions.set(sessionId, session);

  return session;
}

/**
 * Join session
 */
function joinSession(sessionId, name) {

  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  const participant = {
    id: uuidv4(),
    name,
    items: [],
    share: 0,
    paid: false
  };

  session.participants.push(participant);

  return participant;
}

/**
 * Select items for participant
 */
function selectItems(sessionId, participantId, items) {

  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  const participant = session.participants.find(
    (p) => p.id === participantId
  );

  if (!participant) {
    throw new Error("Participant not found");
  }

  participant.items = items;

  const updated = itemSplit(session.participants);

  session.participants = updated;

  return participant;
}

/**
 * Equal split for session
 */
function splitEqually(sessionId) {

  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  session.participants = equalSplit(
    session.totalBill,
    session.participants
  );

  return session.participants;
}

/**
 * Confirm payment
 */
function confirmPayment(sessionId, participantId) {

  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  const participant = session.participants.find(
    (p) => p.id === participantId
  );

  if (!participant) {
    throw new Error("Participant not found");
  }

  participant.paid = true;

  return paymentProgress(session.participants);
}

/**
 * Get session
 */
function getSession(sessionId) {

  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  return session;
}

module.exports = {
  createSession,
  joinSession,
  selectItems,
  splitEqually,
  confirmPayment,
  getSession
};