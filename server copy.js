
const express = require("express");
const path = require("path");
const session = require("express-session");
const qrRoutes = require("./routes/qrRoutes.js");

const app = express();

const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/");
    }

    next();
};

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

// Independent logout
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

// Listen on all network interfaces
const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("QR Login Server Started!");
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`LAN: http://192.168.10.179:${PORT}`);
});
