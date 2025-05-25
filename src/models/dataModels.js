const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema({
    agentID: {type: String, required: true, unique: true},
    adminID: {type: String, required: true},
    deviceName: {type: String},
    agentName: {type: String},
    apiLevel: {type: String},
    time: {type: String}
});

const messageSchema = new mongoose.Schema({
    agentID: {type: String, required: true},
    sender: {type: String, required: true},
    message: {type: String, required: true},
    time: {type: String}
});

const notificationSchema = new mongoose.Schema({
    agentID: {type: String, required: true},
    appName: {type: String,},
    title: {type: String,},
    text: {type: String,},
    time: {type: String}
});

const contactSchema = new mongoose.Schema({
    name: {type: String, required: true},
    phone: {type: String, required: true},
    agentID: {type: String, required: true},
});
contactSchema.index({phone: 1, agentID: 1}, {unique: true});

const detailModel = new mongoose.Schema({
    agentID: {type: String, required: true},
    submissionId: {type: String, required: true},
    time: {type: String},
    details: {type: Object, required: true},
})

const AgentModel = new mongoose.model("agents", agentSchema);
const MessageModel = new mongoose.model("message", messageSchema);
const NotificationModel = new mongoose.model("notification", notificationSchema);
const ContactsModel = new mongoose.model("contacts", contactSchema);
const DetailsModel = new mongoose.model("details", detailModel);

module.exports = {
    AgentModel, MessageModel, NotificationModel, ContactsModel, DetailsModel
}