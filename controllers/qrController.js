
const QRCode = require("qrcode");
const { generateUniqueToken } = require("../utils/token.js");

const activeTokens = new Map();

const DUMMY_USER = {
    id: 1,
    username: "demoUser"
};

async function generateQR(req, res) {
    try {
        const token = generateUniqueToken();

        activeTokens.set(token, {
            user: DUMMY_USER,
            expiresAt: Date.now() + 5 * 60 * 1000
        });

        // Your PC LAN IP address
        const baseUrl = "http://192.168.10.179:3000";

        const loginUrl = `${baseUrl}/api/verify/${token}`;

        const qrDataUrl = await QRCode.toDataURL(loginUrl);

        console.log("Generated QR Login URL:", loginUrl);

        res.json({
            token,
            qrDataUrl,
            loginUrl
        });

    } catch (error) {
        console.error("QR Error:", error);

        res.status(500).json({
            message: "QR generation failed"
        });
    }
}

function verifyQR(req, res) {
    const token = req.params.token;
    const record = activeTokens.get(token);

    if (!record || record.expiresAt < Date.now()) {
        activeTokens.delete(token);
        return res.status(400).send("Invalid or expired QR code.");
    }

    activeTokens.delete(token);
    req.session.user = record.user;

    res.redirect("/dashboard");
}

module.exports = {
    generateQR,
    verifyQR
};
