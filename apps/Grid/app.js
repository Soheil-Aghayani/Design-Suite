document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let state = {
    // Grid settings
    cols: 12,
    gutter: 20,
    margin: 24,
    containerW: 1140,
    
    // Aspect Ratio settings
    ratioPreset: "16:9",
    ratioVal: 16 / 9,
    wPx: 1920,
    hPx: 1080,
    
    // Spacing settings
    spacingBase: 8,
    
    activeTab: "view-grid"
  };

  // DOM Elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.workspace-panel');
  const sidebarContents = document.querySelectorAll('.sidebar-tab-content');

  // Grid elements
  const inputCols = document.getElementById('grid-cols-count');
  const valCols = document.getElementById('grid-cols-count-lbl');
  const inputGutter = document.getElementById('grid-gutter');
  const valGutter = document.getElementById('grid-gutter-lbl');
  const inputMargin = document.getElementById('grid-margin');
  const valMargin = document.getElementById('grid-margin-lbl');
  const inputContainerW = document.getElementById('grid-container-width');
  
  const gridOverlay = document.getElementById('grid-columns-overlay');
  const gridStatsText = document.getElementById('grid-stats-text');
  const btnCopyCssGrid = document.getElementById('btn-copy-css-grid');
  const btnQuickCssGrid = document.getElementById('btn-quick-css-grid');

  // Aspect elements
  const selectAspectPreset = document.getElementById('aspect-preset');
  const inputW = document.getElementById('ratio-w');
  const inputH = document.getElementById('ratio-h');
  const ratioBox = document.getElementById('ratio-box');
  const ratioBoxDims = document.getElementById('ratio-box-dimensions-lbl');
  const ratioActiveLbl = document.getElementById('ratio-active-lbl');

  // Spacing elements
  const inputSpacingBase = document.getElementById('spacing-base');
  const spacingGuidesTable = document.getElementById('spacing-guides-table').querySelector('tbody');
  const btnCopyTailwind = document.getElementById('btn-copy-tailwind');

  const appToast = document.getElementById('app-toast');

  // --- TAB NAVIGATION SWITCHER ---
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      state.activeTab = targetId;

      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      sidebarContents.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetId).classList.add('active');
      
      if (targetId === "view-grid") {
        document.getElementById('panel-grid-settings').classList.add('active');
      } else if (targetId === "view-aspect") {
        document.getElementById('panel-aspect-settings').classList.add('active');
        scaleAspectVisualizer();
      } else if (targetId === "view-spacing") {
        document.getElementById('panel-spacing-settings').classList.add('active');
      }
    });
  });

  // --- GRID CALCULATIONS AND RENDER ---
  function renderLayoutGrid() {
    gridOverlay.innerHTML = "";
    
    // Update labels
    valCols.textContent = state.cols;
    valGutter.textContent = `${state.gutter}px`;
    valMargin.textContent = `${state.margin}px`;

    // Max container width inside workspace
    gridOverlay.style.maxWidth = `${state.containerW}px`;
    gridOverlay.style.paddingLeft = `${state.margin}px`;
    gridOverlay.style.paddingRight = `${state.margin}px`;
    
    // Calculate column width
    const netWidth = state.containerW - (2 * state.margin);
    const totalGutterWidth = (state.cols - 1) * state.gutter;
    const colWidth = (netWidth - totalGutterWidth) / state.cols;

    gridStatsText.textContent = `Container: ${state.containerW}px | Columns: ${state.cols} (${colWidth.toFixed(1)}px width) | Gutter: ${state.gutter}px | Margin: ${state.margin}px`;

    // Render pink column guides
    gridOverlay.style.display = 'grid';
    gridOverlay.style.gridTemplateColumns = `repeat(${state.cols}, 1fr)`;
    gridOverlay.style.gap = `${state.gutter}px`;

    for (let i = 0; i < state.cols; i++) {
      const bar = document.createElement('div');
      bar.className = 'grid-column-bar';
      gridOverlay.appendChild(bar);
    }
  }

  function getCSSGridCode() {
    return `.grid-container {
  display: grid;
  grid-template-columns: repeat(${state.cols}, 1fr);
  gap: ${state.gutter}px;
  max-width: ${state.containerW}px;
  margin: 0 auto;
  padding: 0 ${state.margin}px;
}`;
  }

  const copyCssGridHandler = () => {
    const code = getCSSGridCode();
    navigator.clipboard.writeText(code).then(() => {
      showToast("CSS Grid code copied!");
    });
  };
  btnCopyCssGrid.addEventListener('click', copyCssGridHandler);
  btnQuickCssGrid.addEventListener('click', copyCssGridHandler);

  // --- ASPECT RATIO CALCULATOR ---
  function updateRatioVal() {
    const preset = selectAspectPreset.value;
    state.ratioPreset = preset;
    if (preset === '16:9') state.ratioVal = 16 / 9;
    else if (preset === '4:3') state.ratioVal = 4 / 3;
    else if (preset === '1:1') state.ratioVal = 1;
    else if (preset === '1.618:1') state.ratioVal = 1.618;
    else if (preset === '21:9') state.ratioVal = 21 / 9;
    else if (preset === '9:16') state.ratioVal = 9 / 16;
  }

  function scaleAspectVisualizer() {
    // Find largest box that fits 500x260 parent bounds
    const maxW = 500;
    const maxH = 260;
    
    let boxW = maxW;
    let boxH = boxW / state.ratioVal;

    if (boxH > maxH) {
      boxH = maxH;
      boxW = boxH * state.ratioVal;
    }

    ratioBox.style.width = `${boxW}px`;
    ratioBox.style.height = `${boxH}px`;
    
    // Label
    ratioBoxDims.textContent = `${Math.round(state.wPx)} × ${Math.round(state.hPx)}`;
    ratioActiveLbl.textContent = `Aspect Ratio: ${state.ratioPreset} (${state.ratioVal.toFixed(3)})`;
  }

  // Width / Height input calculations
  inputW.addEventListener('input', () => {
    state.wPx = parseFloat(inputW.value) || 0;
    state.hPx = state.wPx / state.ratioVal;
    inputH.value = Math.round(state.hPx);
    scaleAspectVisualizer();
  });

  inputH.addEventListener('input', () => {
    state.hPx = parseFloat(inputH.value) || 0;
    state.wPx = state.hPx * state.ratioVal;
    inputW.value = Math.round(state.wPx);
    scaleAspectVisualizer();
  });

  selectAspectPreset.addEventListener('change', () => {
    updateRatioVal();
    if (state.ratioPreset !== 'custom') {
      state.hPx = state.wPx / state.ratioVal;
      inputH.value = Math.round(state.hPx);
    }
    scaleAspectVisualizer();
  });

  // --- SPACING BUILDER MODULE ---
  function renderSpacingTable() {
    const base = state.spacingBase;
    spacingGuidesTable.innerHTML = "";
    
    // Tailwind spacing intervals
    const steps = [
      { name: "0.5", multiplier: 0.5 },
      { name: "1", multiplier: 1 },
      { name: "2", multiplier: 2 },
      { name: "3", multiplier: 3 },
      { name: "4", multiplier: 4 },
      { name: "5", multiplier: 5 },
      { name: "6", multiplier: 6 },
      { name: "8", multiplier: 8 },
      { name: "10", multiplier: 10 },
      { name: "12", multiplier: 12 },
      { name: "16", multiplier: 16 },
      { name: "20", multiplier: 20 },
      { name: "24", multiplier: 24 },
      { name: "32", multiplier: 32 }
    ];

    steps.forEach(step => {
      const px = step.multiplier * base;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>Spacing ${step.name}</strong></td>
        <td>
          ${px}px
          <span class="spacing-preview-block" style="width: ${Math.min(180, px)}px;"></span>
        </td>
        <td><code>padding: ${px}px;</code></td>
        <td><code>p-${step.name}</code></td>
      `;
      spacingGuidesTable.appendChild(row);
    });
  }

  function getTailwindConfigCode() {
    const base = state.spacingBase;
    return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        '0.5': '${base * 0.5}px',
        '1': '${base * 1}px',
        '2': '${base * 2}px',
        '3': '${base * 3}px',
        '4': '${base * 4}px',
        '5': '${base * 5}px',
        '6': '${base * 6}px',
        '8': '${base * 8}px',
        '10': '${base * 10}px',
        '12': '${base * 12}px',
        '16': '${base * 16}px',
        '20': '${base * 20}px',
        '24': '${base * 24}px',
        '32': '${base * 32}px',
      }
    }
  }
}`;
  }

  btnCopyTailwind.addEventListener('click', () => {
    const code = getTailwindConfigCode();
    navigator.clipboard.writeText(code).then(() => {
      showToast("Tailwind config copied to Clipboard!");
    });
  });

  // --- CONNECT REGISTER INPUTS ---
  function registerInputEvents() {
    // Grid sliders
    const connectGridSlider = (input, stateProp, action) => {
      input.addEventListener('input', () => {
        state[stateProp] = parseInt(input.value, 10);
        action();
      });
    };
    connectGridSlider(inputCols, 'cols', renderLayoutGrid);
    connectGridSlider(inputGutter, 'gutter', renderLayoutGrid);
    connectGridSlider(inputMargin, 'margin', renderLayoutGrid);

    inputContainerW.addEventListener('input', () => {
      state.containerW = parseInt(inputContainerW.value, 10) || 1140;
      renderLayoutGrid();
    });

    // Spacing slider
    inputSpacingBase.addEventListener('input', () => {
      state.spacingBase = parseInt(inputSpacingBase.value, 10) || 8;
      renderSpacingTable();
    });
  }

  // Toast notifier
  let toastTimer = null;
  function showToast(message) {
    appToast.textContent = message;
    appToast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      appToast.classList.remove('visible');
    }, 2000);
  }

  // Sync theme inside iframe
  window.addEventListener('themeChanged', (e) => {
    document.documentElement.setAttribute('data-theme', e.detail);
  });
  const parentTheme = localStorage.getItem('hub_ui_theme') || 'light';
  document.documentElement.setAttribute('data-theme', parentTheme);

  // ResizeObserver for Aspect Ratio Box
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        if (state.activeTab === 'view-aspect') scaleAspectVisualizer();
      }
    }
  });
  resizeObserver.observe(document.querySelector('.canvas-viewport'));

  // Initial Run
  registerInputEvents();
  renderLayoutGrid();
  renderSpacingTable();
  updateRatioVal();
  scaleAspectVisualizer();
});
