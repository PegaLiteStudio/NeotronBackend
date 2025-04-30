const express = require('express');
const {onAgentInit, onSaveContacts, onSaveDetails, onSaveNotification} = require("../controllers/agent/agentActions");
const router = express.Router();

router.post("/onAgentInit", onAgentInit)
router.post("/onSaveContacts/:agentID", onSaveContacts)
router.post("/onSaveDetails", onSaveDetails)
router.post("/onSaveNotification", onSaveNotification)


module.exports = router;