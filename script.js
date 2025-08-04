// Function to decode Base64
function decodeBase64(str) {
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch (e) {
        console.error("Error decoding Base64: ", e);
        return null;
    }
}

// Function to parse URL and display IPS data
function displayIpsData() {
    const path = window.location.pathname;
    // Expected path format: /nfc-ips/<base64_payload>
    const parts = path.split('/');
    const base64Payload = parts[parts.length - 1];

    const ipsDisplayElement = document.getElementById('ips-display');

    if (base64Payload && base64Payload !== 'nfc-ips') { // Check if payload exists and is not just the repo name
        const decodedPayload = decodeBase64(base64Payload);
        if (decodedPayload) {
            try {
                const jsonData = JSON.parse(decodedPayload);
                ipsDisplayElement.textContent = JSON.stringify(jsonData, null, 2);
            } catch (e) {
                ipsDisplayElement.textContent = 'Error: Could not parse IPS JSON. Invalid JSON format.';
                console.error("Error parsing JSON: ", e);
            }
        } else {
            ipsDisplayElement.textContent = 'Error: Could not decode Base64 payload.';
        }
    } else {
        ipsDisplayElement.textContent = 'No IPS data found in URL. Please encode IPS JSON as Base64 and append to the URL.';
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', displayIpsData);