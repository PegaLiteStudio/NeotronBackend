const mongoose = require('mongoose');

// MongoDB URI from environment variables
const mongoDBUri = process.env.MONGO_URI;

if (!mongoDBUri) {
    console.error("\x1b[31m%s\x1b[0m", "MONGO_URI is not defined in environment variables.");
    process.exit(1); // Exit if the URI is missing
}

/**
 * Connect to the MongoDB database.
 */
const connect = async () => {
    try {
        await mongoose.connect(mongoDBUri);  // ✅ Removed deprecated options
        console.log("\x1b[32m%s\x1b[0m", "MongoDB is connected successfully.");
    } catch (err) {
        console.error("\x1b[31m%s\x1b[0m", "Error connecting to MongoDB:", err.message);
        process.exit(1); // Exit the process on connection failure
    }
};

module.exports = {
    connect,
};
