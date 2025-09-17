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
*   **Flexible Header Layout:** The header section, including the "Payload" title and controls, has been refactored from absolute positioning to a flexible `display: flex` layout. This improves layout predictability and simplifies spacing management.
*   **Responsive Control Sizing:** Control elements (toggle switch and parse button) now dynamically size their height based on `calc(var(--standard-padding) * 2)`, ensuring consistent scaling with the overall UI.
*   **Precise Control Alignment:** The toggle switch is precisely aligned with the right-hand side of the left content pane using a combination of flexbox properties and calculated margins.

## Current Development Status

### ✅ Recently Completed
*   **Advanced Payload Processing:** Comprehensive support for multiple payload formats including FHIR Patient resources, legacy indexed payloads, and CodeRef protobuf schemas
*   **Protobuf Integration:** Full codec pipeline with automatic schema detection, compression handling (pako), and legacy format support
*   **Medical Data Visualization:** Color-coded care stages from POI through Role 3 care with detailed vitals, conditions, and events
*   **Interactive Payload Management:** Toggle between demo payloads with custom input parsing and real-time display updates
*   **Resolved: Payload Text Area Stretching:** Layout issues resolved by replacing textarea/pre elements with contenteditable divs

### 🚧 Current Architecture
*   **Modular JavaScript Design:** Separated concerns with codec pipeline, payload service, and rendering functions
*   **State Management:** Global app state handling demo payloads, fragment data, and comparison views
*   **Utility Pipeline:** Comprehensive Base64 handling, date formatting, NHS number formatting, and gender code mapping
*   **CSS Variables System:** Scalable UI with centralized color schemes and responsive design patterns

### 📋 Technical Highlights
*   **Multi-Schema Support:** Automatic detection and parsing of legacy vs. CodeRef protobuf schemas
*   **Compression Handling:** Automatic inflation attempts with pako for compressed payloads
*   **Patient Comparison:** IPS changes visualization comparing reference and current patient data
*   **Error Boundaries:** Comprehensive error handling with user-friendly messaging

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

    *Note: For local testing with URL parameters, you might need to manually append the Base64 string to the URL in your browser (e.g., `file:///path/to/nfc-ips/index.html#eyJrZXkiOiJ2YWxib2x1ZSI=`). However, the script is designed to parse the path directly, so a local web server might be more appropriate for accurate testing (e.g., using `python -m http.server`).*

## Enhanced Local Development

### Prerequisites
```bash
npm install  # Install development dependencies
```

### Development Commands
```bash
npm run dev         # Start live-server with hot reload
npm run build       # Build for production
npm run deploy      # Deploy to GitHub Pages
```

### Development Notes
*   **NFC Testing:** Use development server for URL fragment testing
*   **Demo Payloads:** payload-1.json and payload-2.json provide test data
*   **Custom Input:** Right pane supports JSON and Base64-encoded payloads
*   **Protobuf Schemas:** Located in resources/ for NFC payload decoding

## Code Architecture Overview

### Core Components (script.js - 1,183 lines)
- **Codec Pipeline:** Protobuf decoding with multi-schema support
- **Payload Service:** Builds view models from FHIR, legacy, and CodeRef formats
- **Rendering Functions:** Dynamic DOM generation with medical stage visualization
- **Utility Functions:** Base64 handling, date formatting, gender mapping

### Styling System (style.css - 468 lines)
- **CSS Variables:** Centralized theming with `--size-multiplier` scaling
- **Color-Coded Stages:** Medical care stages from POI through Role 3
- **Responsive Design:** Flexbox layouts with mobile-first approach
- **Interactive Components:** Toggle switches and parse buttons

### Data Flow
1. NFC fragment parsing or manual input
2. Multi-format payload detection and decoding
3. View model generation with patient and stage data
4. Dynamic UI rendering with color-coded medical stages
5. Comparison views for IPS changes tracking

## Return to gh-pages branch

https://github.com/ajdench/NFC-IPS/tree/gh-pages