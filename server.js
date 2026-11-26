
require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const connectDB = require("./config/db.js");
const qrRoutes = require("./routes/qrRoutes.js");
const imageRoutes = require("./routes/imageRoutes.js");

const app = express();
const PORT = 3000;

app.use(express.json());

// Session configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET || "change-this-secret",
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            maxAge: 365 * 24 * 60 * 60 * 1000,
            httpOnly: true,
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

// Protected dashboard
app.get("/dashboard", requireLogin, (req, res) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0"
    });

    res.sendFile(
        path.join(__dirname, "public", "dashboard.html")
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

        res.clearCookie("connect.sid");

        res.set({
            "Cache-Control": "no-store, no-cache, must-revalidate, private"
        });

        res.redirect("/");
    });
});

// Public files
app.use(express.static(path.join(__dirname, "public")));

// Start only after MongoDB connects
async function startServer() {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
        console.log("--------------------------------");
        console.log("QR LOGIN SERVER STARTED");
        console.log("--------------------------------");
        console.log(`Local: http://localhost:${PORT}`);
        console.log(`LAN: http://192.168.10.179:${PORT}`);
        console.log("--------------------------------");
    });
}

startServer();
