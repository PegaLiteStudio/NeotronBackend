const {
    respondSuccess,
    respondFailed,
    RESPONSE_MESSAGES,
    respondSuccessWithData
} = require("../../managers/responseManager");
const ApkGenerator = require("../../managers/apkManager");
const AgentAdminAppGenerator = require("../../managers/agentAdminAppManager");
const {AgentAdminModel} = require("../../models/adminModels");
const {generateRandomString} = require("../../helpers/appHelper");
const {getPreferredTime} = require("../../managers/timeManager");
const {PrimaryUserModel} = require("../../models/userModels");

const apkGenerationQueue = [];
let isGenerating = false;
const processQueue = () => {
    if (isGenerating || apkGenerationQueue.length === 0) return;

    isGenerating = true;
    const {adminID, task} = apkGenerationQueue.shift();

    task().finally(() => {
        isGenerating = false;

        // 🔁 Notify remaining users about their new queue position
        apkGenerationQueue.forEach(({adminID}, index) => {
            io.to(connectedUsers[adminID]).emit(
                "app-update",
                `Your request is in queue. Position: ${index}`
            );
        });

        processQueue(); // Continue with next task
    });
};

const generateApp = async (req, res) => {
    if (!req.files || !req.files.appIcon) {
        return res.status(400).send({status: false, message: "Both APK and icon are required"});
    }

    let adminID = req.user.adminID;
    let doc = await PrimaryUserModel.findOne({adminID}).lean();

    if (doc.maxTokens <= doc.usedTokens) {
        return respondFailed(res, RESPONSE_MESSAGES.INSUFFICIENT_GAME_BALANCE);
    }

    respondSuccess(res);

    const position = apkGenerationQueue.length + (isGenerating ? 1 : 0);

    if (position !== 0) {
        io.to(connectedUsers[adminID]).emit("app-update", `Your request is in queue. Position: ${position}`);
    }

    apkGenerationQueue.push({
        adminID,
        task: async () => {
            try {
                io.to(connectedUsers[adminID]).emit("app-update", "Your app is now being generated...");

                const packageName = getRandomPackage();
                const key = generateRandomString(6);

                const agentAdminDoc = new AgentAdminModel({
                    name: req.body["appName"].replaceAll("\"", ""),
                    key,
                    regTime: getPreferredTime(),
                    adminID,
                    exp: req.body["adminExpire"].replaceAll("\"", ""),
                    status: "active",
                    appID: packageName
                });

                await agentAdminDoc.save();

                io.to(connectedUsers[adminID]).emit("app-update", "ADMIN KEY " + key);

                const adminApkGen = new AgentAdminAppGenerator(
                    adminID,
                    req.body["appName"].replaceAll("\"", ""),
                    req.body["adminConfigs"].slice(1, -1),
                    packageName,
                    req.user.key
                );

                await adminApkGen.apkGenerator();
                console.log("Admin APK generation finished.");

                const apkGen = new ApkGenerator(
                    adminID,
                    req.body["appName"].replaceAll("\"", ""),
                    req.body["appTheme"].replaceAll("\"", ""),
                    req.body["adminConfigs"].slice(1, -1),
                    req.body["amount"].replaceAll("\"", ""),
                    packageName,
                    req.user.key
                );

                await apkGen.apkGenerator();
                console.log("Agent APK generation finished.");

                await PrimaryUserModel.updateOne({adminID}, {$inc: {usedTokens: 1}});

                io.to(connectedUsers[adminID]).emit("token-update", doc.usedTokens + 1);
                io.to(connectedUsers[adminID]).emit("app-update", "App generation completed.");
            } catch (err) {
                console.error("APK Generation Task Error:", err);
                io.to(connectedUsers[adminID]).emit("app-update", "An error occurred during app generation.");
            }
        }
    });

    processQueue();
};

const getBuilds = async (req, res) => {
    let adminID = req.user.adminID;

    let agentAdmins = await AgentAdminModel.find({adminID}).lean();
    let agentAdminList = [];

    for (let i = 0; i < agentAdmins.length; i++) {
        let agent = agentAdmins[i];
        agentAdminList.push({
            name: agent.name,
            key: agent.key
        });
    }

    respondSuccessWithData(res, agentAdminList.reverse());
}
const getRandomPackage = () => {
    const randomPart = () => {
        const letters = "abcdefghijklmnopqrstuvwxyz";
        return Array.from({length: 6}, () =>
            letters[Math.floor(Math.random() * letters.length)]
        ).join("");
    };
    return `com.${randomPart()}.${randomPart()}`;
}


module.exports = {
    generateApp, getBuilds
}