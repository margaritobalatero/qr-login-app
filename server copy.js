const express = require("express");
const path = require("path");
const session = require("express-session");
const qrRoutes = require("./routes/qrRoutes.js");

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Session setup
app.use(
  session({
    secret: "supersecretkey", // Change to env var in production
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 600000 }, // 10 min
  })
);

// Routes
app.use("/api", qrRoutes);

// Protected route for dashboard
app.get("/dashboard", (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
  } else {
    res.redirect("/");
  }
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));