
const express = require("express");
const router = express.Router();

const {
    getImages,
    createImage,
    updateImage,
    deleteImage
} = require("../controllers/imageController.js");

router.get("/", getImages);
router.post("/", createImage);
router.put("/:id", updateImage);
router.delete("/:id", deleteImage);

module.exports = router;
