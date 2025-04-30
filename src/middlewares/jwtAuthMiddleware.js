const jwt = require('jsonwebtoken');
const {respondFailed, RESPONSE_MESSAGES, throwError} = require("../managers/responseManager");
const {verifyKey} = require("../auth/user/userAuth");
const {AdminModel} = require("../models/adminModels");
const {verifyAgentAdminKey} = require("../auth/agent-admin/agentAdminAuth");

const verifyUserJWT = async (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
        return respondFailed(res, RESPONSE_MESSAGES.MISSING_PARAMETERS)
    }

    token = req.headers.authorization.replace("Bearer ", "");

    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    try {
        const verified = jwt.verify(token, jwtSecretKey);
        if (!verified) {
            return respondFailed(res, RESPONSE_MESSAGES.SESSION_EXPIRED);
        }

        let user = await verifyKey(res, verified.key, verified.deviceID, true);
        if (!user) {
            return;
        }
        req.user = user;
        next();

    } catch (e) {
        if (e.message === "jwt expired") {
            return respondFailed(res, RESPONSE_MESSAGES.SESSION_EXPIRED);
        }
        throwError(res, e);
    }
}

const verifyAgentAdminJWT = async (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
        return respondFailed(res, RESPONSE_MESSAGES.MISSING_PARAMETERS)
    }

    token = req.headers.authorization.replace("Bearer ", "");

    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    try {
        const verified = jwt.verify(token, jwtSecretKey);
        if (!verified) {
            return respondFailed(res, RESPONSE_MESSAGES.SESSION_EXPIRED);
        }

        let user = await verifyAgentAdminKey(res, verified.key, verified.deviceID);
        if (!user) {
            return;
        }
        req.user = user;
        next();

    } catch (e) {
        if (e.message === "jwt expired") {
            return respondFailed(res, RESPONSE_MESSAGES.SESSION_EXPIRED);
        }
        throwError(res, e);
    }
}

const verifyAdmin = async (req, res, next) => {
    let {key} = req.params;
    if (!key) {
        return respondFailed(res, RESPONSE_MESSAGES.MISSING_PARAMETERS);
    }
    let superAdmin = await AdminModel.findOne({key}).lean();

    if (!superAdmin) {
        return respondFailed(res, RESPONSE_MESSAGES.ACCOUNT_NOT_EXISTS)
    }

    next();
}

module.exports = {
    verifyUserJWT,verifyAgentAdminJWT, verifyAdmin
}