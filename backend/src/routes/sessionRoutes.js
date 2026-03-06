const express = require("express");
const router = express.Router();

const {
  createSession,
  joinSession,
  getSession
} = require("../controllers/sessionController");

router.post("/create-session", createSession);
router.post("/join-session", joinSession);
router.get("/session/:id", getSession);

module.exports = router;