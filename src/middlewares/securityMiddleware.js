const verifyApiKey = (req, res, next) => {
    const apiKey = req.header('x-api-key'); // Retrieve API key from headers
    if (!apiKey || apiKey !== process.env.APP_API_KEY) {
        return res.status(403).json({status: false, message: "Forbidden: Invalid API Key"});
    }
    next(); // Proceed if API key is valid
};

module.exports = verifyApiKey;
