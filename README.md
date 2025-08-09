# NFC International Patient Summary (IPS) Viewer

This project provides a single-page web application designed to display International Patient Summary (IPS) data. It can process IPS data encoded as a Base64 JSON message appended to the URL, or load a default IPS file if no URL data is present.

## Key Features and Architectural Highlights:

*   **Dynamic UI Generation:** Core UI components, including the various information boxes, are dynamically generated from JavaScript configurations, leading to cleaner HTML and more maintainable code.
*   **Refined Patient Detail Styling:** Patient details are presented in a visually distinct "pill" format, with clear separation and consistent alignment for labels and values.
*   **Dynamic Spacing with Ghost Items:** Utilizes an advanced flexbox technique with "ghost items" to ensure consistent wrapping and dynamic, even spacing between patient detail components, regardless of the number of items on a line.
*   **Scalable Styling with CSS Variables:** The application leverages CSS variables for all key styling parameters, including colors, padding, and font sizes. A global `--size-multiplier` variable allows for easy, uniform scaling of the entire UI.
*   **Client-Side SPA:** All logic is handled client-side via JavaScript, making it suitable for static site deployment.
*   **Static Site Deployment:** Leverages GitHub Pages for hosting, with automated deployment via `gh-pages`.
*   **Modular CSS:** Styles are organized into logical sections with extensive use of variables for maintainability.

## Ongoing Development / Known Issues

*   **Payload Text Area Stretching:** We are currently facing a persistent layout challenge where the `textarea` and `pre` elements used for displaying and inputting payload data do not consistently stretch to fill 100% of their available vertical space within the Flexbox layout. Multiple CSS-based solutions have been attempted, including adjusting `min-height`, `flex-grow`, and parent container properties. An attempt to replace these elements with `div[contenteditable]` was also made but introduced new layout issues and has been reverted. This remains an active area of investigation to improve the user interface.

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

## Return to gh-pages branch

https://github.com/ajdench/NFC-IPS/tree/gh-pages