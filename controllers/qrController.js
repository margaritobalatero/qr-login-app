
const QRCode = require("qrcode");
const { generateUniqueToken } = require("../utils/token.js");

const activeTokens = new Map();

const DUMMY_USER = {
    id: 1,
    username: "demoUser"
};

const BASE_URL =
    process.env.APP_BASE_URL || "http://192.168.10.179:3000";

function createToken(mode) {
    const token = generateUniqueToken();

    activeTokens.set(token, {
        approved: false,
        mode,
        expiresAt: Date.now() + 2 * 60 * 1000
    });

    return token;
}

// PC generates the original login QR
async function generateQR(req, res) {
    try {
        const token = createToken("initial");

        req.session.loginRequest = token;

        const loginUrl = `${BASE_URL}/api/verify/${token}`;
        const qrDataUrl = await QRCode.toDataURL(loginUrl);

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

// Any logged-in device generates a QR for another device
async function generateDeviceQR(req, res) {
    try {
        const token = createToken("device");

        const loginUrl = `${BASE_URL}/api/verify/${token}`;
        const qrDataUrl = await QRCode.toDataURL(loginUrl);

        console.log("New device QR generated:", token);

        res.json({
            token,
            qrDataUrl,
            loginUrl,
            expiresIn: 120
        });

    } catch (error) {
        console.error("Device QR generation error:", error);
        res.status(500).json({
            message: "Could not generate device QR code"
        });
    }
}

// Phone scans and logs in
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

    req.session.user = DUMMY_USER;

    req.session.save((error) => {
        if (error) {
            console.error("Phone session error:", error);
            record.approved = false;
            return res.status(500).send("Phone login failed.");
        }

        console.log("A device logged in successfully.");

        // Device QR codes are single-use.
        // Original QR codes stay available for PC approval polling.
        if (record.mode === "device") {
            activeTokens.delete(token);
        }

        res.redirect("/dashboard");
    });
}

// Original PC checks whether its QR was approved
function checkStatus(req, res) {
    const token = req.params.token;

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
    generateDeviceQR,
    verifyQR,
    checkStatus
};
