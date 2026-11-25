
async function loadQRCode() {
    const qrImage = document.getElementById("qrImage");
    const status = document.getElementById("status");

    try {
        status.textContent = "Generating QR code...";

        const response = await fetch("/api/generate");

        if (!response.ok) {
            throw new Error("Server returned " + response.status);
        }

        const data = await response.json();

        qrImage.src = data.qrDataUrl;

        status.textContent = "Scan this QR code with your phone.";

        console.log("QR Login URL:", data.loginUrl);

    } catch (error) {
        status.textContent = "QR Error: " + error.message;
        console.error(error);
    }
}

loadQRCode();
