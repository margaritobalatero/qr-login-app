
async function loadQRCode() {
    const qrImage = document.getElementById("qrImage");
    const status = document.getElementById("status");

    let checking = true;

    try {
        status.textContent = "Generating QR code...";

        const response = await fetch("/api/generate");

        if (!response.ok) {
            throw new Error("QR generation failed");
        }

        const data = await response.json();

        qrImage.src = data.qrDataUrl;

        status.textContent = "Scan this QR code with your phone.";

        const token = data.token;

        async function checkLogin() {
            if (!checking) return;

            try {
                const response = await fetch(
                    `/api/status/${token}`,
                    {
                        method: "GET",
                        credentials: "same-origin",
                        cache: "no-store"
                    }
                );

                const result = await response.json();

                if (result.status === "approved") {
                    checking = false;

                    status.textContent =
                        "Login approved! Opening PC dashboard...";

                    // PC opens its own dashboard
                    window.location.replace("/dashboard");
                    return;
                }

                if (result.status === "expired") {
                    checking = false;
                    status.textContent =
                        "QR code expired. Refresh to generate a new QR.";
                    return;
                }

                if (result.status === "unauthorized") {
                    checking = false;
                    status.textContent =
                        "Unauthorized login request. Refresh the page.";
                    return;
                }

                if (result.status === "error") {
                    checking = false;
                    status.textContent =
                        "Unable to create PC login session.";
                    return;
                }

                // Continue checking every 2 seconds
                setTimeout(checkLogin, 2000);

            } catch (error) {
                console.error("PC login check error:", error);
                status.textContent =
                    "Connection error. Retrying...";
                setTimeout(checkLogin, 3000);
            }
        }

        checkLogin();

    } catch (error) {
        console.error(error);
        status.textContent = error.message;
    }
}

loadQRCode();
