const {
    respondFailed, RESPONSE_MESSAGES, respondSuccessWithData, respondSuccess
} = require("../../managers/responseManager");
const {PrimaryUserModel} = require("../../models/userModels");
const {getJWT} = require("../../helpers/authHelper");

const login = async (req, res) => {
    let {key, deviceID} = req.body;

    // Check if parameters are missing
    if (!key || !deviceID) {
        return respondFailed(res, RESPONSE_MESSAGES.MISSING_PARAMETERS);
    }

    // Verify user credentials
    const isValid = await verifyKey(res, key, deviceID);
    if (!isValid) return;

    // Generate JWT token and respond
    const token = getJWT(key, deviceID);
    respondSuccessWithData(res, {token});
}

const sessionLogin = (req, res) => {
    respondSuccessWithData(res, {
        maxTokens: req.user.maxTokens, adminID: req.user.adminID, usedTokens: req.user.usedTokens
    });
}
const verifyKey = async (res, key, deviceID) => {

    // Fetch the user from the database
    const user = await PrimaryUserModel.findOne({key}).lean();

    // Check if user exists
    if (!user) {
        respondFailed(res, RESPONSE_MESSAGES.ACCOUNT_NOT_EXISTS);
        return null;
    }

    if (user.status === "banned") {
        respondFailed(res, RESPONSE_MESSAGES.ACCOUNT_BANNED);
        return null;
    }

    // Handle device ID linking (if provided)
    if (deviceID) {
        // Check if the account is already linked with a different device
        if (user.deviceID && user.deviceID !== deviceID) {
            respondFailed(res, RESPONSE_MESSAGES.ACCOUNT_LINKED_WITH_OTHER_DEVICE);
            return null;
        }

        // Link the account to the new device ID if not already linked
        if (!user.deviceID) {
            await PrimaryUserModel.updateOne({key}, {$set: {deviceID}});
        }
    }
    return user;
}


module.exports = {
    login, verifyKey, sessionLogin
}