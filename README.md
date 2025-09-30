# NFC International Patient Summary (IPS) Viewer

This application renders International Patient Summary (IPS) payloads inside a single-page web experience. It accepts Base64-encoded payload fragments (FHIR JSON, legacy protobuf, or CodeRef formats), decompresses them when needed, and presents the clinical picture across Point of Injury through STRATEVAC stages with vitals, events, and demographics all generated on the client.

**Live demo:** https://ajdench.github.io/NFC-IPS/nfc/ips/home.html

## Highlights

- **Config-driven UI:** Pane titles, stage metadata, colours, and legend abbreviations all live in `config/constants.js`, so UI changes happen declaratively.
- **IPS codec pipeline:** `script.js` detects payload format, handles optional pako compression, converts protobuf ↔ FHIR, and normalises into a unified view model before rendering.
- **Vitals visualisation:** Chart.js plots operational stages with two-line time ticks, background bands, and a positioned legend that stays aligned using a three-column grid layout.
- **Offline fallback:** If Chart.js fails to load, a bundled mini renderer maintains vitals visibility without external dependencies.
- **Styling system:** CSS custom properties (e.g., `--size-multiplier`) scale typography, spacing, and colour palettes consistently across panes.
- **Autonomous deployment:** GitHub Actions (`Deploy mainCode to mainPages`) builds, tests, and publishes the static bundle to GitHub Pages whenever `mainCode` is pushed.

## Application Pages (`nfc/ips/`)

- `home.html` – Lightweight landing page linking to the viewer and encoding tools.
- `viewer.html` – Primary viewer that loads demo payloads or URL fragments and renders stage-by-stage pill layouts plus the vitals chart.
- `encoding.html` – Four-pane utility for inspecting, encoding, or decoding payload fragments during development.

## How the Viewer Works

1. NFC tags or manual URLs embed a Base64 payload fragment after the `/nfc/ips/viewer.html#` hash.
2. The viewer decodes and (if necessary) inflates the payload, detects schema type, and converts legacy/CodeRef formats into consistent FHIR JSON.
3. A view model synthesises demographics, vitals, conditions, events, and operational stages.
4. Rendering helpers generate patient pills, OPCP sections, and vitals charts with collapsible details.
5. GitHub Pages serves the static bundle, so the experience remains client-side only.

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
                    │ • home / viewer / tools │
                    └─────────────────────────┘
                                │
                                ▼
            ┌─────────────────────────────────────────┐
            │         Core Processing Pipeline         │
            │ URL Fragment → Base64 → (inflate) →      │
            │ Protobuf ↔ FHIR → View Model → UI        │
            └─────────────────────────────────────────┘
```

## Development Workflow

### Requirements
- Node.js 20+ (matching the GitHub Actions runner)
- `npm install` fetched project dependencies (`protobufjs`, `pako`, `live-server`, `gh-pages`)

### Common Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Launch local viewer with `live-server` (no auto commits). |
| `npm run dev:auto-jj` | Start dev server plus Auto-JJ monitor (creates commits while running). |
| `npm run test:no-jj` | Execute utility/unit tests without invoking Auto-JJ hooks. |
| `npm run build:no-jj` | Build the static `build/` bundle used for GitHub Pages. |
| `npm run build` | Build bundle and trigger Auto-JJ build hook. |

### Deployment
- The repo’s `mainCode` branch is the source of truth for active development.
- GitHub Actions workflow `.github/workflows/deploy-mainPages.yml` runs on every `mainCode` push:
  - `npm ci`
  - `npm run test:no-jj`
  - `npm run build:no-jj`
  - Publish `build/` to the `mainPages` branch via `peaceiris/actions-gh-pages`.
- Manual redeployments can be triggered from the Actions tab using the workflow’s `Run workflow` button (`workflow_dispatch`).

## Documentation & Further Reading

- [CODEC.md](CODEC.md) – End-to-end description of the codec pipeline (Base64, protobuf schemas, compression).
- [TERMINOLOGY.md](TERMINOLOGY.md) – Mapping tables and terminology service notes.
- [BRANCH-STRATEGY.md](BRANCH-STRATEGY.md) – Details on `mainCode` / `mainPages` separation and release hygiene.
- [README-JJ.md](README-JJ.md) – JJ version-control usage guide, including Auto-JJ automation.

## Known Issues & Follow-ups

- Patient demographics card still needs spacing refinements and guaranteed Service/NHS identifier pills.
- Vitals legend requires collision-handling improvements when many lines converge near the same value.
- Events renderer should use explicit datetime fields so the first pill shows full date+time reliably.
- POI pane empty-state currently uses the expanded style rather than the condensed variant applied elsewhere.

## License

Released under the MIT License.
