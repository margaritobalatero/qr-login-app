
const Image = require("../models/Image.js");

// Validate image URL
function isValidImageUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

// READ: Get all images
async function getImages(req, res) {
    try {
        const images = await Image.find().sort({ createdAt: -1 });
        res.json(images);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to load images" });
    }
}

// CREATE: Add image
async function createImage(req, res) {
    try {
        const { title, imageUrl } = req.body;

        if (!title || !imageUrl) {
            return res.status(400).json({
                message: "Title and image URL are required"
            });
        }

        if (!isValidImageUrl(imageUrl)) {
            return res.status(400).json({
                message: "Please enter a valid HTTP or HTTPS image URL"
            });
        }

        const image = await Image.create({
            title: title.trim(),
            imageUrl: imageUrl.trim()
        });

        res.status(201).json(image);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to save image" });
    }
}

// UPDATE: Edit image
async function updateImage(req, res) {
    try {
        const { title, imageUrl } = req.body;

        if (!title || !imageUrl) {
            return res.status(400).json({
                message: "Title and image URL are required"
            });
        }

        if (!isValidImageUrl(imageUrl)) {
            return res.status(400).json({
                message: "Please enter a valid HTTP or HTTPS image URL"
            });
        }

        const image = await Image.findByIdAndUpdate(
            req.params.id,
            {
                title: title.trim(),
                imageUrl: imageUrl.trim()
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!image) {
            return res.status(404).json({
                message: "Image not found"
            });
        }

        res.json(image);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update image" });
    }
}

// DELETE: Remove image
async function deleteImage(req, res) {
    try {
        const image = await Image.findByIdAndDelete(req.params.id);

        if (!image) {
            return res.status(404).json({
                message: "Image not found"
            });
        }

        res.json({
            message: "Image deleted successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete image" });
    }
}

module.exports = {
    getImages,
    createImage,
    updateImage,
    deleteImage
};
