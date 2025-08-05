# Project-Specific Gemini Notes (NFC IPS Viewer)

This document records ongoing learning, architectural decisions, and specific to-dos related to the NFC IPS Viewer project.

## Learning & Insights:

*   **Dynamic Flexbox Spacing (Ghost Items):** To ensure consistent wrapping and dynamic spacing with `justify-content: space-between`, implemented the "ghost item" technique. Invisible flex items are added to the container, forcing proper space distribution even on lines with fewer elements. This also involved refining the `gap` property on the flex container for consistent horizontal and vertical spacing.
*   **Dynamic Flexbox Spacing:** Implemented dynamic horizontal spacing for wrapping detail components using `justify-content: space-between` on the flex container. This ensures the first item is left-aligned and the last item is right-aligned, with remaining space distributed evenly between items on each line.
*   **Component Styling:** Iteratively refined the patient detail component styling to match a visual target, creating a "pill" shape with distinct, configurable background colors and font weights for the label and value.
*   **Layout Evolution (Grid to Flexbox):** For the patient detail components, the layout was evolved from a CSS Grid (`repeat(auto-fit,...)`) to a `display: flex` with `flex-wrap: wrap`. This better achieves a continuous, wrapping line of details rather than a structured grid, improving the natural flow of information.
*   **Dynamic Component Generation:** Refactored the main info boxes to be dynamically generated from a JavaScript configuration array. This cleans up the `index.html`, centralizes the UI structure in the script, and makes the layout more scalable and maintainable.
*   **Fiddly Alignment Fix:** Corrected a minor alignment issue with detail components (label/value pairs) by applying a specific, asymmetrical margin (`margin: 0 2px 0 3px;`) to the container. This counteracts subtle spacing inconsistencies caused by font rendering and flexbox gaps.
*   **GitHub Pages Deployment:** Learned the importance of including all necessary files (like `default-ips.json`) in the `build` directory and updating the `package.json` `build` script accordingly. Browser caching can also cause display issues.
*   **CSS Flexbox for Layout:** Utilized flexbox extensively for dynamic vertical and horizontal alignment, including `flex-grow`, `align-items: stretch`, `justify-content: flex-start`, and `margin-top: auto` for pushing elements to the bottom.
*   **CSS Variables:** Implemented `--standard-padding` and `--half-padding` for modular and consistent spacing across the design.
*   **Box Sizing:** Confirmed the importance of `box-sizing: border-box` on elements (especially `body` and containers) to ensure padding is included within specified dimensions, preventing unwanted scrollbars.
*   **README.md Management:** Established a pattern for distinct `README.md` files for `main` and `gh-pages` branches with cross-linking.

## Architectural Approaches:

*   **Client-Side SPA:** The project is a single-page application (SPA) with all logic handled client-side via JavaScript, suitable for NFC URI parsing.
*   **Static Site Deployment:** Leveraged GitHub Pages for hosting, with `gh-pages` npm package for automated deployment from a `build` directory.
*   **Modular CSS:** Organized CSS into logical sections and used variables for maintainability.

## To-Dos:

*   Implement IPS JSON parsing and display in the main content area.
*   Add functionality to dynamically update other boxes based on IPS data.
*   Consider adding a mechanism to handle Base64 encoded IPS data from the URL (re-introduce previous logic).
*   Improve error handling and user feedback for data loading.
*   Explore options for NFC tag encoding and testing.
*   **Global GEMINI.md Update:** Remember to manually update the global `/.gemini/GEMINI.md` with relevant general context and learning from this project.
*   **CLAUDE.md Update:** Cannot directly update `CLAUDE.md` as it is outside the project directory. User needs to manually update or change working directory.
