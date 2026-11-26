
const mongoose = require("mongoose");

const loginTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    mode: {
        type: String,
        enum: ["initial", "device"],
        required: true
    },

    approved: {
        type: Boolean,
        default: false
    },

    expiresAt: {
        type: Date,
        required: true,
        index: {
            expires: 0
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model(
    "LoginToken",
    loginTokenSchema
);
