
const QRCode = require("qrcode");
const { generateUniqueToken } = require("../utils/token.js");

const activeTokens = new Map();

const DUMMY_USER = {
    id: 1,
    username: "demoUser"
};

// PC generates QR code
async function generateQR(req, res) {
    try {
        const token = generateUniqueToken();

        activeTokens.set(token, {
            approved: false,
            expiresAt: Date.now() + 2 * 60 * 1000
        });

        // Remember the QR token in this PC's session
        req.session.loginRequest = token;

        const baseUrl = "http://192.168.10.179:3000";
        const loginUrl = `${baseUrl}/api/verify/${token}`;

        const qrDataUrl = await QRCode.toDataURL(loginUrl);

        console.log("QR generated:", token);

        res.json({
            token,
            qrDataUrl,
            loginUrl
        });

    } catch (error) {
        console.error("QR generation error:", error);
        res.status(500).json({
            message: "QR generation failed"
        });
    }
}

// Phone scans QR code and approves PC login
function verifyQR(req, res) {
    const token = req.params.token;
    const record = activeTokens.get(token);

    if (!record || record.expiresAt < Date.now()) {
        activeTokens.delete(token);
        return res.status(400).send("QR code expired or invalid.");
    }

    if (record.approved) {
        return res.status(400).send("QR code already used.");
    }

    record.approved = true;

    // Create the phone's independent session
    req.session.user = DUMMY_USER;

    req.session.save((error) => {
        if (error) {
            console.error("Phone session error:", error);
            return res.status(500).send("Phone login failed.");
        }

        console.log("Phone logged in. PC approval sent.");

        res.redirect("/dashboard");
    });
}

// PC checks whether phone approved the QR
function checkStatus(req, res) {
    const token = req.params.token;

    // Make sure this is the PC session that generated the QR
    if (req.session.loginRequest !== token) {
        return res.status(403).json({
            status: "unauthorized"
        });
    }

    const record = activeTokens.get(token);

    if (!record || record.expiresAt < Date.now()) {
        activeTokens.delete(token);

        return res.json({
            status: "expired"
        });
    }

    if (record.approved) {
        // Create the PC's independent session
        req.session.user = DUMMY_USER;
        delete req.session.loginRequest;

        return req.session.save((error) => {
            if (error) {
                console.error("PC session error:", error);

                return res.status(500).json({
                    status: "error"
                });
            }

            activeTokens.delete(token);

            console.log("PC logged in successfully.");

            res.json({
                status: "approved"
            });
        });
    }

    res.json({
        status: "pending"
    });
}

module.exports = {
    generateQR,
    verifyQR,
    checkStatus
};
