
const express = require("express");
const router = express.Router();

const {
    generateQR,
    generateDeviceQR,
    verifyQR,
    checkStatus
} = require("../controllers/qrController.js");

// Require an existing login
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Please log in first"
        });
    }

    next();
}

// Original PC login
router.get("/generate", generateQR);

// Generate QR from an already logged-in device
router.get("/device-qr", requireLogin, generateDeviceQR);

// Phone scans QR
router.get("/verify/:token", verifyQR);

// Original PC checks approval
router.get("/status/:token", checkStatus);

module.exports = router;
