const {
  createSession,
  joinSession,
  selectItems,
  confirmPayment,
  getSession
} = require("../services/sessionService");

const { emitSessionUpdate } = require("../sockets/socketService");

/**
 * Create Bill Session
 */
exports.createSession = (req, res) => {

  try {

    const { hostName, totalBill, items } = req.body;

    const session = createSession(hostName, totalBill, items);

    // Notify frontend (host dashboard)
    emitSessionUpdate(session.id, {
      type: "SESSION_CREATED",
      session
    });

    res.json({
      message: "Session created",
      session
    });

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};


/**
 * Join Session
 */
exports.joinSession = (req, res) => {

  try {

    const { sessionId, name } = req.body;

    const participant = joinSession(sessionId, name);

    // Emit real-time update
    emitSessionUpdate(sessionId, {
      type: "USER_JOINED",
      participant
    });

    res.json({
      message: "Joined session",
      participant
    });

  } catch (error) {

    res.status(400).json({ error: error.message });

  }

};


/**
 * Get Session Details
 */
exports.getSession = (req, res) => {

  try {

    const session = getSession(req.params.id);

    res.json(session);

  } catch (error) {

    res.status(404).json({ error: error.message });

  }

};


/**
 * Select Items
 */
exports.selectItems = (req, res) => {

  try {

    const { sessionId, participantId, items } = req.body;

    const participant = selectItems(sessionId, participantId, items);

    emitSessionUpdate(sessionId, {
      type: "ITEMS_SELECTED",
      participantId,
      items
    });

    res.json({
      message: "Items selected",
      participant
    });

  } catch (error) {

    res.status(400).json({ error: error.message });

  }

};


/**
 * Confirm Payment
 */
exports.confirmPayment = (req, res) => {

  try {

    const { sessionId, participantId } = req.body;

    const progress = confirmPayment(sessionId, participantId);

    emitSessionUpdate(sessionId, {
      type: "PAYMENT_CONFIRMED",
      participantId,
      progress
    });

    res.json({
      message: "Payment confirmed",
      progress
    });

  } catch (error) {

    res.status(400).json({ error: error.message });

  }

};