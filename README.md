<div align="center">

# Design Suite

### A focused workspace for diagrams, graphics, number lines, and everyday visual tools.

[![Live Demo](https://img.shields.io/badge/Launch_Design_Suite-0A0A0A?style=for-the-badge&logo=githubpages&logoColor=white)](https://soheil-aghayani.github.io/Design-Suite/)
[![Vanilla JS](https://img.shields.io/badge/Vanilla_JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111)](https://developer.mozilla.org/docs/Web/JavaScript)
[![No Build Step](https://img.shields.io/badge/No_Build_Step-22C55E?style=for-the-badge&logo=html5&logoColor=white)](#run-locally)

One responsive hub. Sixteen independent creative utilities. No account, framework, or installation required.

</div>

---

## What is Design Suite?

Design Suite is a collection of browser-based tools presented inside one consistent workspace. Each app remains a small, self-contained HTML/CSS/JavaScript project, while the root hub provides navigation, responsive framing, and a shared light/dark experience.

It is designed for fast, practical work:

- create publication-ready flowcharts and number lines;
- generate gradients, palettes, mesh backgrounds, and typography systems;
- inspect archives, convert formats, and create secure values;
- export or copy visual results without leaving the browser.

## Featured: Plotter

Plotter creates tightly cropped, export-ready number lines for lessons, diagrams, and technical documents.

### Multiple vector arrows

Vector intervals now work as an editable layer stack:

1. Choose **Plotter** from the workspace.
2. In **Scale → Vector Arrows**, select **+ Add**.
3. Select any vector card to edit its start, end, label, path, height, thickness, and color.
4. Use the eye control to hide an individual vector.
5. Duplicate or delete the selected vector from its editor header.

Every vector is included in live preview, SVG copying, PNG copying, PNG export, presets, undo/redo, and saved browser memory. Older saved Plotter settings with one vector are migrated automatically.

## App catalog

| Workspace | Purpose |
| --- | --- |
| **Flowchart Builder** | Create node-based diagrams with custom shapes, typography, anchors, and exports. |
| **Plotter** | Design number lines, pointing arrows, rulers, and layered vector intervals. |
| **Clock Designer** | Build configurable clock faces and timing visuals. |
| **Color Studio** | Explore and assemble reusable color palettes. |
| **Gradient Maker** | Create controlled CSS gradients with a visual editor. |
| **Mesh** | Compose modern mesh-gradient backgrounds. |
| **Typography** | Preview type systems, scales, and combinations. |
| **Slicer** | Prepare visual slicing layouts and measurements. |
| **Grid** | Design and inspect CSS grid arrangements. |
| **Angle Drawer** | Construct clear angle and geometry illustrations. |
| **Percentage Bar** | Generate styled progress and percentage graphics. |
| **Puzzle** | Create visual puzzle layouts. |
| **Format Converter** | Convert common values and formats. |
| **Security Suite** | Work with hashes, passwords, and security-oriented utilities. |
| **Steam Calculator** | Plan Steam wallet funding and TF2 key-market scenarios. |
| **Archive Studio** | Inspect and work with browser-supported archive files. |

## Highlights

- **Unified workspace** — launch every utility from a searchable sidebar.
- **Standalone apps** — open tools directly or run them inside the hub.
- **Persistent memory** — supported apps restore settings using local browser storage.
- **Light and dark themes** — consistent workspace styling across desktop and mobile.
- **Export-first workflows** — copy SVG, copy images, or export files where supported.
- **Responsive controls** — sidebars become mobile drawers on smaller screens.
- **Zero dependencies at runtime** — the core suite uses browser-native HTML, CSS, and JavaScript.

## Run locally

Clone the repository:

```bash
git clone https://github.com/Soheil-Aghayani/Design-Suite.git
cd Design-Suite
```

Start any static web server. For example:

```bash
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

You can also open the root `index.html` directly, but a local server gives iframe-based workspaces and browser APIs a more consistent origin.

## Project structure

```text
Design-Suite/
├── index.html              # Workspace hub and navigation
├── README.md
└── apps/
    ├── Flowchart/
    ├── Plotter/
    ├── Color Studio/
    ├── Gradient Maker/
    └── ...                 # Remaining standalone utilities
```

Each app owns its interface, styles, state, and export logic. This keeps changes isolated and makes an individual utility easy to open, test, or embed.

## Browser support

Use a current release of Chrome, Edge, Firefox, or Safari. Clipboard and download behavior can vary by browser security policy; running through `localhost` or the hosted site provides the most reliable experience.

## Contributing

Contributions are welcome. Keep additions consistent with the existing approach:

- prefer browser-native APIs and small, dependency-free implementations;
- preserve standalone operation for each app;
- verify both light and dark themes;
- test responsive sidebar behavior;
- include export and saved-state paths when adding editable properties.

Open an issue for a proposal or submit a pull request with a concise description and validation notes.

---

<div align="center">

Built as a practical visual toolbox by [Soheil Aghayani](https://github.com/Soheil-Aghayani).

</div>
