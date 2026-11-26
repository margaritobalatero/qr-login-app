
const QRCode = require("qrcode");
const { generateUniqueToken } = require("../utils/token.js");
const LoginToken = require("../models/LoginToken.js");

const DUMMY_USER = {
    id: 1,
    username: "demoUser"
};

const TOKEN_LIFETIME = 2 * 60 * 1000;

function getBaseURL(req) {
    const configuredURL = process.env.APP_BASE_URL;

    if (configuredURL) {
        return configuredURL.replace(/\/+$/, "");
    }

    return `${req.protocol}://${req.get("host")}`;
}

async function createToken(mode) {
    const token = generateUniqueToken();

    await LoginToken.create({
        token,
        mode,
        approved: false,
        expiresAt: new Date(Date.now() + TOKEN_LIFETIME)
    });

    return token;
}

// Original PC generates its login QR
async function generateQR(req, res) {
    try {
        const token = await createToken("initial");

        req.session.loginRequest = token;

        await new Promise((resolve, reject) => {
            req.session.save(error => {
                if (error) reject(error);
                else resolve();
            });
        });

        const loginUrl =
            `${getBaseURL(req)}/api/verify/${token}`;

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

// An already logged-in device generates another QR
async function generateDeviceQR(req, res) {
    try {
        const token = await createToken("device");

        const loginUrl =
            `${getBaseURL(req)}/api/verify/${token}`;

        const qrDataUrl = await QRCode.toDataURL(loginUrl);

        res.json({
            token,
            qrDataUrl,
            loginUrl,
            expiresIn: 120
        });

    } catch (error) {
        console.error("Device QR error:", error);

        res.status(500).json({
            message: "Could not generate device QR code"
        });
    }
}

// Phone scans the QR code
async function verifyQR(req, res) {
    try {
        const token = req.params.token;

        // Atomically approve a valid, unused token
        const record = await LoginToken.findOneAndUpdate(
            {
                token,
                approved: false,
                expiresAt: { $gt: new Date() }
            },
            {
                $set: { approved: true }
            },
            {
                new: true
            }
        );

        if (!record) {
            return res.status(400).send(
                "QR code expired, invalid, or already used."
            );
        }

        req.session.user = DUMMY_USER;

        req.session.save(async error => {
            if (error) {
                console.error("Phone session error:", error);

                await LoginToken.updateOne(
                    { token, approved: true },
                    { $set: { approved: false } }
                );

                return res.status(500).send("Phone login failed.");
            }

            console.log("A device logged in successfully.");

            // Additional-device QR codes are single-use.
            // Original PC QR stays available for PC polling.
            if (record.mode === "device") {
                await LoginToken.deleteOne({ token });
            }

            res.redirect("/dashboard");
        });

    } catch (error) {
        console.error("QR verification error:", error);

        res.status(500).send("QR verification failed.");
    }
}

// Original PC checks whether its QR was approved
async function checkStatus(req, res) {
    try {
        const token = req.params.token;

        if (req.session.loginRequest !== token) {
            return res.status(403).json({
                status: "unauthorized"
            });
        }

        const record = await LoginToken.findOne({
            token,
            mode: "initial",
            expiresAt: { $gt: new Date() }
        });

        if (!record) {
            delete req.session.loginRequest;

            return res.json({
                status: "expired"
            });
        }

        if (record.approved) {
            req.session.user = DUMMY_USER;
            delete req.session.loginRequest;

            return req.session.save(async error => {
                if (error) {
                    console.error("PC session error:", error);

                    return res.status(500).json({
                        status: "error"
                    });
                }

                await LoginToken.deleteOne({ token });

                console.log("PC logged in successfully.");

                res.json({
                    status: "approved"
                });
            });
        }

        res.json({
            status: "pending"
        });

    } catch (error) {
        console.error("QR status error:", error);

        res.status(500).json({
            status: "error"
        });
    }
}

module.exports = {
    generateQR,
    generateDeviceQR,
    verifyQR,
    checkStatus
};
