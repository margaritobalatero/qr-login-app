
const mongoose = require("mongoose");

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("--------------------------------");
        console.log("MONGODB ATLAS CONNECTED");
        console.log("Database: junjie-mern");
        console.log("--------------------------------");

    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

module.exports = connectDB;
