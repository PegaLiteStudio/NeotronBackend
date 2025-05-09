const express = require('express');
const rateLimit = require("express-rate-limit");
const {adminLogin} = require("../auth/admin/adminAuth");
const {getUsers, addUser, editUser, getUserDetails, deleteUser, createUser} = require("../controllers/admin/adminActions");
const {verifyAdmin} = require("../middlewares/jwtAuthMiddleware");
const router = express.Router();

const limiter = rateLimit({
    max: 30,
    windowMs: 15 * 60 * 1000,
    message: {
        status: "failed",
        code: "1002"
    }
});

router.post("/login", limiter, adminLogin)
router.post("/getUsers/:key", verifyAdmin, getUsers)
router.post("/createUser/:key", createUser)
router.post("/addUser/:key", verifyAdmin, addUser)
router.post("/getUserDetails/:key/:userKey", verifyAdmin, getUserDetails)
router.post("/editUser/:key/:userKey", verifyAdmin, editUser)
router.post("/deleteUser/:key/:userKey", verifyAdmin, deleteUser)

module.exports = router;