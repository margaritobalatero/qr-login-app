const express = require("express");
const router = express.Router();
const { generateQR, verifyQR } = require("../controllers/qrController.js");

router.get("/generate", generateQR);
router.get("/verify/:token", verifyQR);

module.exports = router;