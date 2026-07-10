document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let state = {
    // Header settings
    headerFont: "Outfit",
    headerWeight: "700",
    headerSize: 32,
    headerLineHeight: 1.2,
    headerLetterSpacing: -0.5,
    
    // Body settings
    bodyFont: "Inter",
    bodyWeight: "400",
    bodySize: 14,
    bodyLineHeight: 1.6,
    bodyLetterSpacing: 0,

    // Scale Calculator
    scaleBase: 16,
    scaleRatio: 1.200,
    
    // UI state
    gridVisible: false,
    loadedFonts: new Set(["Outfit", "Inter"])
  };

  // DOM Elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const sidebarContents = document.querySelectorAll('.sidebar-tab-content');

  // Preview elements
  const articleTitle = document.getElementById('article-title-el');
  const articleBody = document.getElementById('article-body-el');
  const baselineGrid = document.getElementById('baseline-grid');
  const btnToggleGrid = document.getElementById('btn-toggle-grid');

  // Header selectors
  const selectHeaderFont = document.getElementById('header-font-select');
  const selectHeaderWeight = document.getElementById('header-weight-select');
  const inputHeaderSize = document.getElementById('header-size');
  const valHeaderSize = document.getElementById('header-size-lbl');
  const inputHeaderLineHeight = document.getElementById('header-lineheight');
  const valHeaderLineHeight = document.getElementById('header-lineheight-lbl');
  const inputHeaderLetterSpacing = document.getElementById('header-letterspacing');
  const valHeaderLetterSpacing = document.getElementById('header-letterspacing-lbl');

  // Body selectors
  const selectBodyFont = document.getElementById('body-font-select');
  const selectBodyWeight = document.getElementById('body-weight-select');
  const inputBodySize = document.getElementById('body-size');
  const valBodySize = document.getElementById('body-size-lbl');
  const inputBodyLineHeight = document.getElementById('body-lineheight');
  const valBodyLineHeight = document.getElementById('body-lineheight-lbl');
  const inputBodyLetterSpacing = document.getElementById('body-letterspacing');
  const valBodyLetterSpacing = document.getElementById('body-letterspacing-lbl');

  // Scale selectors
  const inputScaleBase = document.getElementById('scale-base');
  const selectScaleRatio = document.getElementById('scale-ratio');
  const typoScaleTable = document.getElementById('typo-scale-table').querySelector('tbody');
  const btnCopyTypoCss = document.getElementById('btn-copy-typo-css');

  const appToast = document.getElementById('app-toast');

  // --- TAB NAVIGATION SWITCHER ---
  tabButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      sidebarContents.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      sidebarContents[index].classList.add('active');
    });
  });

  // --- DYNAMIC GOOGLE FONTS LOADER ---
  function loadGoogleFont(fontFamily) {
    if (fontFamily === "System-fallback" || state.loadedFonts.has(fontFamily)) return;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(link);
    
    state.loadedFonts.add(fontFamily);
  }

  // --- PREVIEW RENDER SYNCS ---
  
  function updateHeaderPreview() {
    loadGoogleFont(state.headerFont);
    
    const fontFamilyStr = state.headerFont === "System-fallback" 
      ? "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      : `'${state.headerFont}', sans-serif`;
      
    articleTitle.style.fontFamily = fontFamilyStr;
    articleTitle.style.fontWeight = state.headerWeight;
    articleTitle.style.fontSize = `${state.headerSize}px`;
    articleTitle.style.lineHeight = state.headerLineHeight;
    articleTitle.style.letterSpacing = `${state.headerLetterSpacing}px`;

    // Update labels
    valHeaderSize.textContent = `${state.headerSize}px`;
    valHeaderLineHeight.textContent = state.headerLineHeight;
    valHeaderLetterSpacing.textContent = `${state.headerLetterSpacing}px`;
  }

  function updateBodyPreview() {
    loadGoogleFont(state.bodyFont);

    const fontFamilyStr = state.bodyFont === "System-fallback"
      ? "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      : `'${state.bodyFont}', sans-serif`;

    articleBody.style.fontFamily = fontFamilyStr;
    articleBody.style.fontWeight = state.bodyWeight;
    articleBody.style.fontSize = `${state.bodySize}px`;
    articleBody.style.lineHeight = state.bodyLineHeight;
    articleBody.style.letterSpacing = `${state.bodyLetterSpacing}px`;

    // Update labels
    valBodySize.textContent = `${state.bodySize}px`;
    valBodyLineHeight.textContent = state.bodyLineHeight;
    valBodyLetterSpacing.textContent = `${state.bodyLetterSpacing}px`;
  }

  // --- TYPE SCALE COMPUTATIONS ---
  function renderTypeScaleTable() {
    const base = state.scaleBase;
    const ratio = state.scaleRatio;
    
    // Scale items mapping (from h4 down to small)
    const items = [
      { name: "h1", power: 3, formula: `Base × Ratio³` },
      { name: "h2", power: 2, formula: `Base × Ratio²` },
      { name: "h3", power: 1, formula: `Base × Ratio¹` },
      { name: "body", power: 0, formula: `Base` },
      { name: "small", power: -1, formula: `Base / Ratio¹` }
    ];

    typoScaleTable.innerHTML = "";

    items.forEach(item => {
      const val = Math.round(base * Math.pow(ratio, item.power));
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>&lt;${item.name}&gt;</strong></td>
        <td><code>${item.formula}</code></td>
        <td><strong>${val}px</strong></td>
      `;
      typoScaleTable.appendChild(row);
    });
  }

  // --- REGISTER INPUT ADJUSTMENTS ---
  function registerInputEvents() {
    // Header controls
    selectHeaderFont.addEventListener('change', () => {
      state.headerFont = selectHeaderFont.value;
      updateHeaderPreview();
    });
    selectHeaderWeight.addEventListener('change', () => {
      state.headerWeight = selectHeaderWeight.value;
      updateHeaderPreview();
    });
    inputHeaderSize.addEventListener('input', () => {
      state.headerSize = parseInt(inputHeaderSize.value, 10);
      updateHeaderPreview();
    });
    inputHeaderLineHeight.addEventListener('input', () => {
      state.headerLineHeight = parseFloat(inputHeaderLineHeight.value) / 10.0;
      updateHeaderPreview();
    });
    inputHeaderLetterSpacing.addEventListener('input', () => {
      state.headerLetterSpacing = parseFloat(inputHeaderLetterSpacing.value) / 10.0;
      updateHeaderPreview();
    });

    // Body controls
    selectBodyFont.addEventListener('change', () => {
      state.bodyFont = selectBodyFont.value;
      updateBodyPreview();
    });
    selectBodyWeight.addEventListener('change', () => {
      state.bodyWeight = selectBodyWeight.value;
      updateBodyPreview();
    });
    inputBodySize.addEventListener('input', () => {
      state.bodySize = parseInt(inputBodySize.value, 10);
      updateBodyPreview();
    });
    inputBodyLineHeight.addEventListener('input', () => {
      state.bodyLineHeight = parseFloat(inputBodyLineHeight.value) / 10.0;
      updateBodyPreview();
    });
    inputBodyLetterSpacing.addEventListener('input', () => {
      state.bodyLetterSpacing = parseFloat(inputBodyLetterSpacing.value) / 10.0;
      updateBodyPreview();
    });

    // Scale controls
    inputScaleBase.addEventListener('input', () => {
      state.scaleBase = parseInt(inputScaleBase.value, 10) || 16;
      renderTypeScaleTable();
    });
    selectScaleRatio.addEventListener('change', () => {
      state.scaleRatio = parseFloat(selectScaleRatio.value) || 1.2;
      renderTypeScaleTable();
    });

    // Baseline grid toggle
    btnToggleGrid.addEventListener('click', () => {
      state.gridVisible = !state.gridVisible;
      btnToggleGrid.classList.toggle('active', state.gridVisible);
      baselineGrid.classList.toggle('visible', state.gridVisible);
      showToast(state.gridVisible ? "Typographic grid visible" : "Typographic grid hidden");
    });
  }

  // --- CSS EXPORT COMPILER ---
  btnCopyTypoCss.addEventListener('click', () => {
    let css = "";
    
    // Inject fonts imports
    if (state.headerFont !== "System-fallback" || state.bodyFont !== "System-fallback") {
      css += `/* Import Web Fonts */\n`;
      if (state.headerFont !== "System-fallback") {
        css += `@import url('https://fonts.googleapis.com/css2?family=${state.headerFont.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap');\n`;
      }
      if (state.bodyFont !== "System-fallback" && state.bodyFont !== state.headerFont) {
        css += `@import url('https://fonts.googleapis.com/css2?family=${state.bodyFont.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap');\n`;
      }
      css += `\n`;
    }

    css += `/* Typographic layout rules */
:root {
  --header-font: ${state.headerFont === "System-fallback" ? 'system-ui' : `'${state.headerFont}'`}, sans-serif;
  --body-font: ${state.bodyFont === "System-fallback" ? 'system-ui' : `'${state.bodyFont}'`}, sans-serif;
}

h1.editorial-title {
  font-family: var(--header-font);
  font-weight: ${state.headerWeight};
  font-size: ${state.headerSize}px;
  line-height: ${state.headerLineHeight};
  letter-spacing: ${state.headerLetterSpacing}px;
  color: #1c1c1e;
}

p.editorial-body {
  font-family: var(--body-font);
  font-weight: ${state.bodyWeight};
  font-size: ${state.bodySize}px;
  line-height: ${state.bodyLineHeight};
  letter-spacing: ${state.bodyLetterSpacing}px;
  color: #6e6e73;
}`;

    navigator.clipboard.writeText(css).then(() => {
      showToast("Typography CSS copied to Clipboard!");
    });
  });

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

  // Initial Run
  registerInputEvents();
  updateHeaderPreview();
  updateBodyPreview();
  renderTypeScaleTable();
});
