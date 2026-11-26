
const mongoose = require("mongoose");

let connectionPromise = null;

async function connectDB() {
    // Reuse an existing connection
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    // Reuse a connection attempt already in progress
    if (!connectionPromise) {
        connectionPromise = mongoose.connect(
            process.env.MONGODB_URI,
            {
                dbName: "junjie-mern"
            }
        ).then(() => {
            console.log("--------------------------------");
            console.log("MONGODB ATLAS CONNECTED");
            console.log("Database: junjie-mern");
            console.log("--------------------------------");

            return mongoose.connection;
        }).catch((error) => {
            connectionPromise = null;
            console.error("MongoDB connection failed:", error.message);
            throw error;
        });
    }

    return connectionPromise;
}

module.exports = connectDB;
