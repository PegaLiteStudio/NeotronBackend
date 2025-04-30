const {respondFailed, respondSuccess, RESPONSE_MESSAGES} = require("../../managers/responseManager");
const {AdminModel} = require("../../models/adminModels");

const adminLogin = async (req, res) => {
    let {key, deviceID} = req.body;
    if (!key || !deviceID) {
        return respondFailed(res, RESPONSE_MESSAGES.MISSING_PARAMETERS);
    }

    let superAdmin = await AdminModel.findOne({key}).lean();

    if (!superAdmin) {
        return respondFailed(res, RESPONSE_MESSAGES.ACCOUNT_NOT_EXISTS);
    }

    if (superAdmin.isActive !== true) {
        return respondFailed(res, RESPONSE_MESSAGES.ACCOUNT_BANNED);
    }

    if (superAdmin.hasOwnProperty("deviceID")) {
        if (superAdmin.deviceID !== deviceID) {
            return respondFailed(res, RESPONSE_MESSAGES.ACCOUNT_LINKED_WITH_OTHER_DEVICE);
        }
    } else {
        await AdminModel.updateOne({key}, {$set: {deviceID}})
    }

    respondSuccess(res);
}

module.exports = {
    adminLogin
}