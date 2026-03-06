const express = require("express");
const router = express.Router();

const { handleSMSReply } = require("../controllers/smsController");

router.post("/sms/reply", handleSMSReply);

module.exports = router;