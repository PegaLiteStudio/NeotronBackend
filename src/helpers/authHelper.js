const jwt = require('jsonwebtoken');

const getJWT = (key, deviceID) => {
    let data = {
        time: Date(), key, deviceID
    }

    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    return jwt.sign(data, jwtSecretKey, {
        expiresIn: "30d"
    });
}


module.exports = {
    getJWT
}