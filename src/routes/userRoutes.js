const express = require('express');
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const path = require("path");
const fs = require('fs');
const router = express.Router();

const {verifyUserJWT} = require("../middlewares/jwtAuthMiddleware");
const {login, sessionLogin} = require("../auth/user/userAuth");
const {generateApp, getBuilds, getAgentAdminDetails, updateAgentAdminDetails} = require("../controllers/user/userActions");

const limiter = rateLimit({
    max: 20, windowMs: 15 * 60 * 1000, message: {
        status: "failed", code: "1002"
    }
});

const uploadsPath = path.join(__dirname, "../../data/uploads/");
const finalApplicationPath = path.join(__dirname, "../../data/temp/")

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folderPath = uploadsPath + req.user.key;
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, {recursive: true});
        }
        cb(null, folderPath);
    }, filename: (req, file, cb) => {
        let tempFilename = file.originalname;
        let type = tempFilename.substring(tempFilename.lastIndexOf(".") + 1);
        req.body.type = type;
        let randomName;
        if (file.fieldname === "appIcon") {
            randomName = "app_icon." + type;
            req.body.iconFilename = randomName;
        }

        cb(null, randomName);
    },
});

// Multer upload configuration for multiple files
const upload = multer({storage});

router.post("/login", limiter, login)
router.post("/sessionLogin", verifyUserJWT, sessionLogin)
router.post("/getBuilds", verifyUserJWT, getBuilds)
router.post("/getAgentAdminDetails/:appID", verifyUserJWT, getAgentAdminDetails)
router.post("/updateAgentAdminDetails/:appID", verifyUserJWT, updateAgentAdminDetails)
router.post("/generateApp", verifyUserJWT, upload.fields([{name: 'appIcon', maxCount: 1}]), generateApp);

router.get("/download/:key/:path", (req, res) => {
        res.sendFile(finalApplicationPath + req.params.key + "/" + req.params.path + "/app/build/outputs/apk/release/app-release.apk", (err) => {
            if (err) {
                throw err;
            }
        });
    }
)
module.exports = router;