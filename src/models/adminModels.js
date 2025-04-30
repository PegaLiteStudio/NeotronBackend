const mongoose = require("mongoose");
const {getPreferredTime} = require("../managers/timeManager");


const adminSchema = new mongoose.Schema({
    name: {type: String},
    key: {type: String, required: true},
    isActive: {type: Boolean, default: true},
    deviceID: {type: String},
});

/** User Schema for Primary User Information
 * */
const agentAdminSchema = new mongoose.Schema({
    name: {type: String, required: true, trim: true, maxLength: 30},
    key: {type: String, required: true, trim: true, maxLength: 10, unique: true},
    adminID : {type: String, required: true},
    appID : {type: String},
    regTime: {type: String, default: getPreferredTime()},
    exp: {type: String}
});


const AdminModel = new mongoose.model("admins", adminSchema);
const AgentAdminModel = new mongoose.model("agent-admin", agentAdminSchema);

module.exports = {
    AdminModel, AgentAdminModel
}