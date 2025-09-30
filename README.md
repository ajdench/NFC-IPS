# NFC International Patient Summary (IPS) Viewer

Transform emergency medical care through instant patient data access. This web application displays comprehensive medical summaries by simply scanning an NFC tag with any smartphone - no apps required. From battlefield medics to emergency rooms, critical patient information is available in seconds.

**🌐 [Try the Live Demo](https://ajdench.github.io/NFC-IPS/nfc/ips/home.html)**

## What It Does

**Instant Medical Access**: Scan an NFC tag to instantly display a patient's complete medical summary - medications, allergies, conditions, and vital signs throughout their care journey.

**Universal Compatibility**: Works on any NFC-enabled smartphone using the built-in browser. No special apps, no downloads, no internet dependency beyond the initial page load.

**Complete Care Timeline**: Visualizes patient data across the entire medical evacuation chain - from Point of Injury through Strategic Evacuation, with color-coded stages and real-time vitals tracking.

**Interactive Pipeline**: Advanced encoding/decoding tools with visual pipeline stages show exactly how medical data transforms from FHIR standards to compressed NFC-ready formats.

## Key Capabilities

*   **🏥 Medical Stage Visualization**: Color-coded care stages from POI through STRATEVAC with detailed vitals, conditions, and events
*   **📊 Real-time Vitals Charting**: Interactive charts with stage-aware background bands and medical abbreviations
*   **🔄 Multi-format Support**: Handles FHIR Patient resources, protobuf schemas, and legacy payload formats
*   **⚡ Instant Loading**: Processes compressed medical data in milliseconds via optimized codec pipeline
*   **🎯 Medical-first UI**: Designed specifically for emergency medical environments with clear, scannable information
*   **📱 Touch-friendly**: Optimized for use with gloves and in high-stress medical situations

## Current Development Status

### ✅ Recently Completed
*   **Advanced Payload Processing:** Comprehensive support for multiple payload formats including FHIR Patient resources, legacy indexed payloads, and CodeRef protobuf schemas
*   **Protobuf Integration:** Full codec pipeline with automatic schema detection, compression handling (pako), and legacy format support
*   **Medical Data Visualization:** Color-coded care stages from POI through STRATEVAC with detailed vitals, conditions, and events
*   **Interactive Payload Management:** Toggle between demo payloads with custom input parsing and real-time display updates
*   **Resolved: Payload Text Area Stretching:** Layout issues resolved by replacing textarea/pre elements with contenteditable divs
*   **Stage Bands & STRATEVAC Palette:** STRATEVAC stage now renders after R3 with refreshed colour palette, and the vitals chart overlays background bands for each operational stage

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
*   **Stage-Aware Charting:** Vitals chart overlays stage background bands (opacity via `--stage-band-opacity`, default 0.35), enforces half-hour tick alignment, and abbreviates vitals in the legend for quicker scanning
*   **Legend/Grid Layout:** Vitals pane uses a three-column grid (chart | spacer | legend) so the custom legend stays right-aligned without overlapping the canvas; x-axis labels render via a custom Chart.js plugin.
*   **Collapsible Vitals Pills:** Each OPCP stage starts with a "See *Vitals* chart below *or* click to open" pill that collapses/expands the detailed vitals list on demand while keeping the pane tidy by default.
*   **Page Spacing Tokens:** Top/side/bottom gutters configurable via `--page-padding-top`, `--page-padding-side`, and `--page-padding-bottom`

## How it Works

1.  An NFC tag is encoded with a URI Record pointing to `https://ajdench.github.io/nfc-ips/<Base64_Encoded_IPS_JSON>`.
2.  When an NFC-enabled device scans the tag, it opens this web page.
3.  The JavaScript on the page extracts the Base64 encoded string from the URL.
4.  It then decodes the Base64 string and attempts to parse it as a JSON object.
5.  Finally, the parsed IPS JSON data is displayed on the web page.

## Development and Deployment

This project is deployed via GitHub Pages with automated deployment from the mainCode branch.

**🌐 Live Application:** [https://ajdench.github.io/NFC-IPS/nfc/ips/home.html](https://ajdench.github.io/NFC-IPS/nfc/ips/home.html)

**📊 Main Viewer:** [https://ajdench.github.io/NFC-IPS/nfc/ips/viewer.html](https://ajdench.github.io/NFC-IPS/nfc/ips/viewer.html)

**⚙️ Encoding Tools:** [https://ajdench.github.io/NFC-IPS/nfc/ips/encoding.html](https://ajdench.github.io/NFC-IPS/nfc/ips/encoding.html)

## Usage

To use this viewer, you will need an NFC tag encoded with a URI that includes your Base64 encoded IPS JSON. For example:

`https://ajdench.github.io/nfc-ips/eyJrZXkiOiJ2YWx1ZSI=`. (where `eyJrZXkiOiJ2YWx1ZSI=` is Base64 for `{"key":"value"}`)

## Setup Instructions

### Prerequisites
- Modern web browser with JavaScript ES6+ support
- Node.js (optional, for development server)
- Git

### Quick Start
1.  **Clone this repository:**
    ```bash
    git clone https://github.com/ajdench/nfc-ips.git
    cd nfc-ips
    ```

2.  **Install dependencies (optional):**
    ```bash
    npm install  # For development tools
    ```

3.  **Start development server:**
    ```bash
    npm run dev  # Uses live-server with hot reload
    # OR
    python -m http.server 8080  # Simple HTTP server
    ```

4.  **Access the application:**
    - Home: `http://localhost:8080/nfc/ips/home.html`
    - Viewer: `http://localhost:8080/nfc/ips/viewer.html`
    - Encoding: `http://localhost:8080/nfc/ips/encoding.html`

### Environment Variables
No environment variables required for basic operation. Configuration is handled via:
- `config/constants.js` - Application constants and theming
- `style.css` - CSS variables for UI customization

*Note: For NFC fragment testing, use the development server to properly handle URL fragments and routing.*

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
*   **Full IPS Scaffold:** `full-ips-fhir-json-example-scaffold.json` contains a comprehensive, stage-by-stage IPS bundle (Composition, Patient, supporting resources, and POI → STRATEVAC care settings) for end-to-end encode/decode testing
*   **Manual Workflow:** On page load the left pane shows the default IPS FHIR JSON for reference, but no automatic encoding/decoding occurs—use `Encode`/`Parse` to drive the pipeline manually
*   **OPCP Palette:** CASEVAC, AXP, MEDEVAC, R1, Fwd TACEVAC, R2, Rear TACEVAC, and R3 follow a curated colour progression; AXP is tuned between CASEVAC/MEDEVAC hues and R3 carries a richer lavender tone
*   **Empty-state styling:** All OPCP panes (including POI) display a condensed title with “• No data available” when empty and expand only when populated
*   **Custom Input:** Right pane supports JSON and Base64-encoded payloads
*   **Protobuf Schemas:** Located in resources/ for NFC payload decoding

## Architecture Overview

### High-Level System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NFC Device    │    │  Web Browser    │    │  GitHub Pages   │
│                 │────│                 │────│   (Static Host) │
│ • NFC Tag       │    │ • JavaScript    │    │ • HTML/CSS/JS   │
│ • URL Fragment  │    │ • Protobuf      │    │ • Demo Payloads │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │    Application Pages    │
                    │                         │
                    │ • /nfc/ips/home.html    │◄── Entry Point
                    │ • /nfc/ips/viewer.html  │◄── Main Viewer
                    │ • /nfc/ips/encoding.html│◄── 4-Pane Editor
                    └─────────────────────────┘
                                │
                                ▼
            ┌─────────────────────────────────────────┐
            │         Core Processing Pipeline         │
            │                                         │
            │  URL Fragment → Base64 → Protobuf →     │
            │  CodeRef → FHIR → View Model → UI       │
            └─────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │ Terminology  │ │ Compression  │ │   UI Layer   │
        │   Service    │ │   Handler    │ │              │
        │              │ │              │ │ • Medical    │
        │ • SNOMED CT  │ │ • Pako.js    │ │   Stages     │
        │ • LOINC      │ │ • Base64     │ │ • Dynamic    │
        │ • UCUM       │ │ • Protobuf   │ │   Rendering  │
        └──────────────┘ └──────────────┘ └──────────────┘
```

### Core Components

#### 1. **Application Entry Points** (`nfc/ips/` directory)
- **home.html**: Simple landing page with centered title
- **viewer.html**: Main IPS viewer application (2,644 lines total)
- **encoding.html**: 4-pane encoding/decoding editor

#### 2. **Core JavaScript** (`script.js` - 1,914 lines)
- **Terminology Service**: Medical code resolution and validation
- **Codec Pipeline**: Multi-format protobuf processing
- **UI Rendering Engine**: Dynamic DOM generation
- **State Management**: Centralized application state

#### 3. **Configuration System** (`config/constants.js`)
- **Centralized Constants**: Colors, dimensions, routes, medical systems
- **Theme Variables**: Following AI-CODEGEN-SPEC modular design
- **API Configuration**: Terminology services and compression settings

#### 4. **Styling Architecture** (`style.css` - 662 lines)
- **CSS Variable System**: `--size-multiplier` for scalable UI
- **Color-Coded Medical Stages**: POI → CASEVAC → MEDEVAC → R1 → R2 → Rear TACEVAC → R3 → STRATEVAC
- **Responsive Grid Layouts**: Flexbox and CSS Grid hybrid approach

### Data Processing Pipeline

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NFC Fragment  │───►│   Base64 Decode │───►│ Protobuf Decode │
│ URL-safe Base64 │    │ + Decompression │    │  Schema Detection│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌────────▼────────┐
│   UI Rendering  │◄───│   View Model    │◄───│  CodeRef→FHIR   │
│ Medical Stages  │    │   Generation    │    │   Conversion    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Architectural Principles

1. **Modular Design**: Separated concerns with clear single responsibilities
2. **No Hardcoding**: All values centralized in `config/constants.js`
3. **Global CSS Inheritance**: Changes propagate across all pages
4. **Component Reusability**: Shared UI patterns and utility functions
5. **Defensive Programming**: Comprehensive error handling throughout

## Technical Documentation

### Codec Pipeline
For detailed information about the encoding/decoding system, including protobuf schemas, compression handling, and format conversion between FHIR and CodeRef formats, see [CODEC.md](CODEC.md).

### Terminology System
For details about the CodeRef terminology system, medical code mappings, and the migration path to production FHIR terminology services, see [TERMINOLOGY.md](TERMINOLOGY.md).

## Return to gh-pages branch

https://github.com/ajdench/NFC-IPS/tree/gh-pages


## Technical Implementation Details

### Advanced Architecture Features
*   **Dynamic UI Generation**: Core UI components are dynamically generated from JavaScript configurations, leading to cleaner HTML and more maintainable code
*   **Dynamic Spacing with Ghost Items**: Utilizes an advanced flexbox technique with "ghost items" to ensure consistent wrapping and dynamic, even spacing between patient detail components
*   **Scalable Styling with CSS Variables**: Leverages CSS variables for all key styling parameters, with a global `--size-multiplier` variable for easy, uniform UI scaling
*   **Static Site Deployment**: Leverages GitHub Pages for hosting, with automated deployment via GitHub Actions workflow
*   **Flexible Header Layout**: Refactored from absolute positioning to flexible `display: flex` layout for improved predictability
*   **Responsive Control Sizing**: Control elements dynamically size based on `calc(var(--standard-padding) * 2)` for consistent scaling
*   **Precise Control Alignment**: Toggle switch precisely aligned using flexbox properties and calculated margins

## Known Issues
- POI pane does not collapse to the condensed empty-state style (shows default padding/format) while other OPCP panes do.
