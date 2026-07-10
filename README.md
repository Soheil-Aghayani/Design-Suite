# Design Suite — Web Tools Workspace Hub 🛠️

A highly polished, premium collection of local web utilities designed for daily development, calculators, and designer resources. Built using vanilla JavaScript, CSS variables, and clean HTML, all wrapped in a responsive, theme-synchronized workspace launcher.

---

## Featured Application: Steam Key Arbitrage Planner 🔑

Located in `apps/Steam Calculator`, this tool acts as a financial planner for purchasing Steam games by buying Team Fortress 2 (TF2) keys outside Steam and selling them on the Steam Community Market to load your wallet. 

### Key Features
*   **Dual-Currency System**: Calculate game prices and Steam listing figures in Steam currencies (such as UAH `₴`, EUR `€`, USD `$`, etc.), while tracking out-of-pocket costs and net savings in **Iranian Tomans**.
*   **Existing Wallet Balance Inclusion**: Factor in existing Steam wallet balances to only calculate key requirements for the remaining deficit.
*   **Autocomplete Search & Regional Details**:
    *   **Debounced Type-Ahead**: Instant results appear as you type (400ms debounce) with escape-to-close keys.
    *   **Direct Stores Scraper**: Queries AppIDs, retrieves exact package editions (e.g. Standard vs. Deluxe), parses live sales/discounts, and displays direct links to SteamDB.
    *   **Resilient Proxy Fallback**: Uses client-side proxy failovers (`corsproxy.io` ➔ `codetabs` ➔ `allorigins`) with a 2.5-second request timeout to guarantee fast response times without getting stuck.
*   **Accurate Steam Market Fee Logic**: Implements the precise Steam community market fees (`Steam Fee` + `TF2 Fee` ≈ 15%) to output listing prices and exact payouts.
*   **Actionable Flow Timeline**: Generates a sequential 3-step guide detailing how many keys to buy, listing prices on the market, and final game checkout details.

---

## Workspace Hub Architecture 🛠️

The root `index.html` acts as a unified launcher for 15+ micro-apps.

### Unified Navigation & Switcher
*   **High-Performance iFrames**: Loads individual sub-apps instantly without page refreshes.
*   **Theme Synchronization**: Seamlessly relays active UI themes (dark/light modes) from the hub to loaded apps via standard window events.

### Built-in Micro-Apps (`/apps`):
1.  **Steam Calculator** (Arbitrage planner)
2.  **Color Studio** (Palette design)
3.  **Flowchart** (Node-based diagrams)
4.  **Gradient Maker** (CSS gradient controls)
5.  **Typography** (Font preview and scaling)
6.  **Secure** (Hash/Password utility)
7.  **Slicer** (Slicing tool)
8.  **Clock** (Chiming visual clock)
9.  **Angle Drawer** (Geometry tool)
10. **Convert** (Unit converter)
11. **Grid** (CSS Grid editor)
12. **Mesh** (Mesh gradient generator)
13. **Percentage Bar** (Visual progress bars)
14. **Plotter v2** (1D/2D Plotter helper)
15. **Puzzle** (Visual puzzle app)

---

## Getting Started 🚀

1.  Clone this repository:
    ```bash
    git clone https://github.com/Soheil-Aghayani/Design-Suite.git
    ```
2.  Open `index.html` at the root folder directly in your browser, or serve it using any local HTTP server (e.g. Live Server, `python -m http.server`, or `npx serve`).
