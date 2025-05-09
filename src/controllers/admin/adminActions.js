const {PrimaryUserModel} = require("../../models/userModels");
const {
    respondSuccessWithData,
    respondFailed,
    RESPONSE_MESSAGES,
    respondSuccess
} = require("../../managers/responseManager");
const {generateRandomID} = require("../../helpers/appHelper");
const {exec} = require('child_process');

const getUsers = async (req, res) => {
    let users = await PrimaryUserModel.find().lean();
    let adminList = [];

    for (let i = 0; i < users.length; i++) {
        let user = users[i];
        adminList.push({
            name: user.name,
            key: user.key,
            status: user.status,
            usedTokens: user.usedTokens,
            maxTokens: user.maxTokens,
        })
    }

    respondSuccessWithData(res, adminList)
}


const addUser = async (req, res) => {
    let {name, key, maxTokens} = req.body;

    if (!name || !key || !maxTokens) {
        return respondFailed(res, RESPONSE_MESSAGES.MISSING_PARAMETERS);
    }

    let checkUser = await PrimaryUserModel.findOne({key});

    if (checkUser) {
        return respondFailed(res, RESPONSE_MESSAGES.ACCOUNT_EXISTS)
    }

    let newUser = new PrimaryUserModel({name, key, maxTokens, adminID: generateRandomID()});
    await newUser.save();
    return respondSuccess(res);
}

const getUserDetails = async (req, res) => {
    let key = req.params["userKey"];
    if (!key) {
        return respondFailed(res, RESPONSE_MESSAGES.MISSING_PARAMETERS);
    }
    let user = await PrimaryUserModel.findOne({key});
    if (!user) {
        return respondSuccess(res);
    }
    respondSuccessWithData(res, user);

}
const editUser = async (req, res) => {
    let changes = req.body;
    let key = req.params["userKey"];
    if (!changes || !key) {
        return respondFailed(res, RESPONSE_MESSAGES.MISSING_PARAMETERS);
    }
    await PrimaryUserModel.updateOne({key}, {$set: changes})
    respondSuccess(res)
}

const deleteUser = async (req, res) => {
    let key = req.params["userKey"];
    if (!key) {
        return respondFailed(res, RESPONSE_MESSAGES.MISSING_PARAMETERS);
    }
    await PrimaryUserModel.deleteOne({key});
    respondSuccess(res)
}

const createUser = async (req, res) => {
    exec('pm2 stop 0', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error stopping process: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }

        console.log(`stdout: ${stdout}`);
    });

    respondSuccess(res);
};

module.exports = {
    getUsers, addUser, getUserDetails, editUser, deleteUser, createUser
}