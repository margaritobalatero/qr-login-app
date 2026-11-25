
const express = require("express");
const router = express.Router();

const {
    generateQR,
    verifyQR,
    checkStatus
} = require("../controllers/qrController.js");

// PC generates QR code
router.get("/generate", generateQR);

// Phone scans QR code
router.get("/verify/:token", verifyQR);

// PC checks phone approval
router.get("/status/:token", checkStatus);

module.exports = router;
