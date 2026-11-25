
const express = require("express");
const path = require("path");
const session = require("express-session");
const qrRoutes = require("./routes/qrRoutes.js");

const app = express();

app.use(express.json());

// Session configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET || "change-this-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 10 * 60 * 1000,
            httpOnly: true,
            sameSite: "lax"
        }
    })
);

// Static files
app.use(express.static(path.join(__dirname, "public")));

// QR API routes
app.use("/api", qrRoutes);

// Protected dashboard
app.get("/dashboard", (req, res) => {
    if (req.session.user) {
        return res.sendFile(
            path.join(__dirname, "public", "dashboard.html")
        );
    }

    res.redirect("/");
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

// Listen on all network interfaces
const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("QR Login Server Started!");
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`LAN: http://192.168.10.179:${PORT}`);
});
