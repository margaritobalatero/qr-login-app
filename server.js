
require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo").default;

const connectDB = require("./config/db.js");
const qrRoutes = require("./routes/qrRoutes.js");
const imageRoutes = require("./routes/imageRoutes.js");

const app = express();
const PORT = process.env.PORT || 3000;

const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

app.use(express.json());

// Connect to MongoDB before handling requests
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database unavailable:", error.message);
        res.status(503).send("Database temporarily unavailable.");
    }
});

// Share the existing Mongoose MongoDB connection
const mongoClientPromise = connectDB().then(() => {
    return mongoose.connection.getClient();
});

const sessionStore = MongoStore.create({
    clientPromise: mongoClientPromise,
    dbName: "junjie-mern",
    collectionName: "sessions",
    ttl: 365 * 24 * 60 * 60
});

// Browser sessions stored in MongoDB
app.use(
    session({
        name: "connect.sid",
        secret: process.env.SESSION_SECRET ||
            "local-development-secret-change-this",
        resave: false,
        saveUninitialized: false,
        rolling: true,
        store: sessionStore,
        cookie: {
            maxAge: 365 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax"
        }
    })
);

// Check login
function requireLogin(req, res, next) {
    if (!req.session.user) {
        if (req.path.startsWith("/api/")) {
            return res.status(401).json({
                message: "Please log in first"
            });
        }

        return res.redirect("/");
    }

    next();
}

// QR authentication routes
app.use("/api", qrRoutes);

// Protected image CRUD API
app.use("/api/images", requireLogin, imageRoutes);

// Protected dashboard page
app.get("/dashboard", requireLogin, (req, res) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0"
    });

    res.sendFile(
        path.join(__dirname, "views", "dashboard.html")
    );
});

// Prevent direct dashboard HTML access
app.get("/dashboard.html", (req, res) => {
    res.redirect("/dashboard");
});

// Logout only the current device
app.get("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).send("Logout failed");
        }

        res.clearCookie("connect.sid", {
            path: "/",
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax"
        });

        res.set({
            "Cache-Control": "no-store, no-cache, must-revalidate, private"
        });

        res.redirect("/");
    });
});

// Public files (index.html, JavaScript, CSS, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Local development server
if (require.main === module) {
    connectDB()
        .then(() => {
            app.listen(PORT, "0.0.0.0", () => {
                console.log("--------------------------------");
                console.log("QR LOGIN SERVER STARTED");
                console.log("--------------------------------");
                console.log(`Local: http://localhost:${PORT}`);
                console.log(`LAN: http://192.168.10.179:${PORT}`);
                console.log("--------------------------------");
            });
        })
        .catch((error) => {
            console.error("Server startup failed:", error.message);
            process.exitCode = 1;
        });
}

// Vercel will import this Express application
module.exports = app;
