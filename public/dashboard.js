
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
function displayImageList() {
    imageList.replaceChildren();

    if (images.length === 0) {
        imageList.textContent = "No images saved yet.";
        return;
    }

    images.forEach((image) => {
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

// Logout current device only
function logout() {
    window.location.replace("/logout");
}

// Initialize dashboard
loadImages();
startAutoplay();
