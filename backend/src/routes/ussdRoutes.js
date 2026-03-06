const express = require("express");
const router = express.Router();

const { handleUSSD } = require("./controllers/ussdController");

router.post("/ussd/callback", handleUSSD);

module.exports = router;