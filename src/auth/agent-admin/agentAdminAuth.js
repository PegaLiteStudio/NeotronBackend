const {
    respondFailed, RESPONSE_MESSAGES, respondSuccessWithData, respondSuccess
} = require("../../managers/responseManager");
const {getJWT} = require("../../helpers/authHelper");
const {AgentAdminModel} = require("../../models/adminModels");

const login = async (req, res) => {
    let {key, appID} = req.body;

    if (!key || !appID) {
        return respondFailed(res, RESPONSE_MESSAGES.MISSING_PARAMETERS);
    }

    const isValid = await verifyAgentAdminKey(res, key, appID);
    if (!isValid) return;

    const token = getJWT(key, appID);
    respondSuccessWithData(res, {token});
}

const sessionLogin = (req, res) => {
    respondSuccessWithData(res, {
        exp: req.user.exp
    });
}

const verifyAgentAdminKey = async (res, key, appID) => {

    // Fetch the user from the database
    const user = await AgentAdminModel.findOne({key, appID}).lean();

    // Check if user exists
    if (!user) {
        respondFailed(res, RESPONSE_MESSAGES.ACCOUNT_NOT_EXISTS);
        return null;
    }

    const [datePart, timePart] = user.exp.split(" ");
    const [day, month, year] = datePart.split("/").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);
    const expirationDate = new Date(year, month - 1, day, hour, minute);
    const now = new Date();

    if (user.status === "banned") {
        respondFailed(res, RESPONSE_MESSAGES.ACCOUNT_BANNED);
        return null;
    }

    if (expirationDate < now) {
        respondFailed(res, RESPONSE_MESSAGES.SUBSCRIPTION_EXPIRED);
        return null;
    }

    return user;
}


module.exports = {
    login, verifyAgentAdminKey, sessionLogin
}