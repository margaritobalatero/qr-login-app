
const API = "/api/images";

let images = [];
let currentSlide = 0;
let editingId = null;
let autoplay = true;
let autoplayTimer = null;

const carouselImage = document.getElementById("carouselImage");
const slideTitle = document.getElementById("slideTitle");
const slideCounter = document.getElementById("slideCounter");
const imageList = document.getElementById("imageList");
const message = document.getElementById("message");

const imageForm = document.getElementById("imageForm");
const titleInput = document.getElementById("title");
const imageUrlInput = document.getElementById("imageUrl");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");

const imageSearch = document.getElementById("imageSearch");

// Device QR elements
const generateDeviceQRButton =
    document.getElementById("generateDeviceQRButton");

const deviceQRSection =
    document.getElementById("deviceQRSection");

const deviceQR =
    document.getElementById("deviceQR");

const deviceQRStatus =
    document.getElementById("deviceQRStatus");

let deviceQRTimer = null;

// API helper
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    if (response.status === 401) {
        window.location.replace("/");
        throw new Error("Your session has expired. Please log in again.");
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}

// Generate QR for another device
async function generateDeviceQR() {
    try {
        generateDeviceQRButton.disabled = true;
        generateDeviceQRButton.textContent = "Generating...";

        clearTimeout(deviceQRTimer);

        deviceQRSection.hidden = true;
        deviceQR.removeAttribute("src");

        const data = await apiRequest("/api/device-qr");

        deviceQR.src = data.qrDataUrl;

        deviceQRSection.hidden = false;

        deviceQRStatus.textContent =
            "Waiting for another device to scan...";

        // QR expires after 2 minutes
        deviceQRTimer = setTimeout(() => {
            deviceQR.removeAttribute("src");

            deviceQRStatus.textContent =
                "QR code expired. Generate a new one if needed.";

        }, data.expiresIn * 1000);

    } catch (error) {
        alert(error.message);

    } finally {
        generateDeviceQRButton.disabled = false;
        generateDeviceQRButton.textContent = "Generate QR Code";
    }
}

// Close QR display
function closeDeviceQR() {
    clearTimeout(deviceQRTimer);

    deviceQR.removeAttribute("src");
    deviceQRSection.hidden = true;
    deviceQRStatus.textContent = "";
}

// READ: Load images
async function loadImages() {
    try {
        images = await apiRequest(API);

        if (currentSlide >= images.length) {
            currentSlide = Math.max(0, images.length - 1);
        }

        displaySlide();
        displayImageList();

    } catch (error) {
        message.textContent = error.message;
    }
}

// Display carousel slide
function displaySlide() {
    if (images.length === 0) {
        carouselImage.removeAttribute("src");
        slideTitle.textContent = "No images available";
        slideCounter.textContent = "0 / 0";
        return;
    }

    const image = images[currentSlide];

    carouselImage.src = image.imageUrl;
    carouselImage.alt = image.title;
    slideTitle.textContent = image.title;

    slideCounter.textContent =
        `${currentSlide + 1} / ${images.length}`;
}

function nextSlide() {
    if (images.length === 0) return;

    currentSlide = (currentSlide + 1) % images.length;
    displaySlide();
}

function previousSlide() {
    if (images.length === 0) return;

    currentSlide =
        (currentSlide - 1 + images.length) % images.length;

    displaySlide();
}

// Autoplay
function startAutoplay() {
    clearInterval(autoplayTimer);

    autoplayTimer = setInterval(() => {
        if (autoplay && images.length > 1) {
            nextSlide();
        }
    }, 3000);
}

function toggleAutoplay() {
    autoplay = !autoplay;

    document.getElementById("playButton").textContent =
        autoplay ? "Pause" : "Play";

    if (autoplay) {
        startAutoplay();
    }
}

// CREATE / UPDATE
imageForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const imageUrl = imageUrlInput.value.trim();

    try {
        saveButton.disabled = true;

        const editing = Boolean(editingId);

        const url = editing
            ? `${API}/${editingId}`
            : API;

        await apiRequest(url, {
            method: editing ? "PUT" : "POST",
            body: JSON.stringify({ title, imageUrl })
        });

        message.textContent = editing
            ? "Image updated successfully!"
            : "Image saved successfully!";

        cancelEdit();
        await loadImages();

    } catch (error) {
        message.textContent = error.message;

    } finally {
        saveButton.disabled = false;
    }
});

// Display CRUD list
function displayImageList(list = images) {
    imageList.replaceChildren();

    if (list.length === 0) {
        imageList.textContent = "No images saved yet.";
        return;
    }

    list.forEach((image) => {
        const item = document.createElement("div");
        item.className = "image-item";

        const thumbnail = document.createElement("img");
        thumbnail.src = image.imageUrl;
        thumbnail.alt = image.title;

        const info = document.createElement("div");
        info.className = "image-info";

        const name = document.createElement("strong");
        name.textContent = image.title;

        info.appendChild(name);

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "edit";

        editButton.addEventListener("click", () => {
            editImage(image._id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete";

        deleteButton.addEventListener("click", () => {
            deleteImage(image._id);
        });

        item.append(
            thumbnail,
            info,
            editButton,
            deleteButton
        );

        imageList.appendChild(item);
    });
}

// Load image data into form
function editImage(id) {
    const image = images.find(item => item._id === id);

    if (!image) return;

    editingId = id;

    titleInput.value = image.title;
    imageUrlInput.value = image.imageUrl;

    document.getElementById("formTitle").textContent =
        "Edit Image";

    saveButton.textContent = "Update Image";
    cancelButton.hidden = false;

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Cancel edit
function cancelEdit() {
    editingId = null;

    imageForm.reset();

    document.getElementById("formTitle").textContent =
        "Add New Image";

    saveButton.textContent = "Save Image";
    cancelButton.hidden = true;
}

// DELETE
async function deleteImage(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this image?"
    );

    if (!confirmed) return;

    try {
        await apiRequest(`${API}/${id}`, {
            method: "DELETE"
        });

        message.textContent = "Image deleted successfully!";

        await loadImages();

    } catch (error) {
        message.textContent = error.message;
    }
}

function searchImages() {
    const query = imageSearch.value.trim().toLowerCase();

    const filteredImages = images.filter(image =>
        image.title.toLowerCase().includes(query)
    );

    displayImageList(filteredImages);

    if (filteredImages.length === 0) {
        carouselImage.removeAttribute("src");
        slideTitle.textContent = "No matching images found";
        slideCounter.textContent = "0 / 0";
        return;
    }

    currentSlide = 0;
    displayFilteredSlide(filteredImages);
}

function displayFilteredSlide(filteredImages) {
    const image = filteredImages[currentSlide];

    carouselImage.src = image.imageUrl;
    carouselImage.alt = image.title;
    slideTitle.textContent = image.title;

    slideCounter.textContent =
        `${currentSlide + 1} / ${filteredImages.length}`;
}


function searchImages() {
    const query = imageSearch.value.trim().toLowerCase();

    const filteredImages = images.filter(image =>
        image.title.toLowerCase().includes(query)
    );

    currentSlide = 0;

    displayImageList(filteredImages);

    if (filteredImages.length === 0) {
        carouselImage.removeAttribute("src");
        slideTitle.textContent = "No matching images found";
        slideCounter.textContent = "0 / 0";
        return;
    }

    displayFilteredSlide(filteredImages);
}

function clearImageSearch() {
    imageSearch.value = "";
    currentSlide = 0;
    displayImageList();
    displaySlide();
}


// Logout current device only
function logout() {
    window.location.replace("/logout");
}

// Initialize dashboard
loadImages();
startAutoplay();
