# NFC International Patient Summary (IPS) Viewer

This project provides a simple single-page web application designed to display International Patient Summary (IPS) data encoded within an NFC tag. The IPS data is expected to be a Base64 encoded JSON message appended to the URL.

## How it Works

1.  An NFC tag is encoded with a URI Record pointing to `https://ajdench.github.io/nfc-ips/<Base64_Encoded_IPS_JSON>`.
2.  When an NFC-enabled device scans the tag, it opens this web page.
3.  The JavaScript on the page extracts the Base64 encoded string from the URL.
4.  It then decodes the Base64 string and attempts to parse it as a JSON object.
5.  Finally, the parsed IPS JSON data is displayed on the web page.

## Development and Deployment

This project is intended for concept development, refinement, and distribution via GitHub Pages.

**Live Demo:** [https://ajdench.github.io/NFC-IPS/](https://ajdench.github.io/NFC-IPS/)

For information specific to the deployed GitHub Pages branch, see its [README.md](https://github.com/ajdench/NFC-IPS/tree/gh-pages).

## Usage

To use this viewer, you will need an NFC tag encoded with a URI that includes your Base64 encoded IPS JSON. For example:

`https://ajdench.github.io/nfc-ips/eyJrZXkiOiJ2YWx1ZSI=`. (where `eyJrZXkiOiJ2YWx1ZSI=` is Base64 for `{"key":"value"}`)

## Local Development

1.  Clone this repository:
    `git clone https://github.com/ajdench/nfc-ips.git`
2.  Navigate to the project directory:
    `cd nfc-ips`
3.  Open `index.html` in your web browser.

    *Note: For local testing with URL parameters, you might need to manually append the Base64 string to the URL in your browser (e.g., `file:///path/to/nfc-ips/index.html#eyJrZXkiOiJ2YWx1ZSI=`). However, the script is designed to parse the path directly, so a local web server might be more appropriate for accurate testing (e.g., using `python -m http.server`).*