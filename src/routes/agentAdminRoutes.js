const express = require('express');
const rateLimit = require("express-rate-limit");
const router = express.Router();

const {verifyAgentAdminJWT} = require("../middlewares/jwtAuthMiddleware");
const {login, sessionLogin} = require("../auth/agent-admin/agentAdminAuth");
const {
    getAgents,
    getMessages,
    getContacts,
    getDetails, getNotification, deleteMessage
} = require("../controllers/agent-admin/agentAdminActions");

const limiter = rateLimit({
    max: 15, windowMs: 15 * 60 * 1000, message: {
        status: "failed", code: "1002"
    }
});

router.post("/login", limiter, login)
router.post("/sessionLogin", verifyAgentAdminJWT, sessionLogin)
router.post("/getAgents", verifyAgentAdminJWT, getAgents)
router.post("/getMessages/:agentID", verifyAgentAdminJWT, getMessages)
router.post("/getNotification/:agentID", verifyAgentAdminJWT, getNotification)
router.post("/getContacts/:agentID", verifyAgentAdminJWT, getContacts)
router.post("/getDetails/:agentID", verifyAgentAdminJWT, getDetails)
router.post("/deleteMessage/:agentID", verifyAgentAdminJWT, deleteMessage)

module.exports = router;