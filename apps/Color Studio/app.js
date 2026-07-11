document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let state = {
    harmonySeed: "#3b82f6",
    harmonyRule: "analogous",
    contrastText: "#1c1c1e",
    contrastBg: "#ffffff",
    activeTab: "view-harmony"
  };

  let activeSwatches = []; // Holds current generated palette hexes

  // DOM Elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.workspace-panel');
  const sidebarContents = document.querySelectorAll('.sidebar-tab-content');

  // Harmony elements
  const harmonyPicker = document.getElementById('harmony-color-picker');
  const harmonyText = document.getElementById('harmony-color-text');
  const selectHarmonyRule = document.getElementById('harmony-rule-select');
  const swatchesGrid = document.getElementById('harmony-swatches-grid');
  const shadesGrid = document.getElementById('shades-row-list');
  const harmonyModeTitle = document.getElementById('harmony-mode-title-display');
  const btnLockPalette = document.getElementById('btn-lock-palette');

  // Contrast elements
  const contrastTextPicker = document.getElementById('contrast-text-picker');
  const contrastTextVal = document.getElementById('contrast-text-val');
  const contrastBgPicker = document.getElementById('contrast-bg-picker');
  const contrastBgVal = document.getElementById('contrast-bg-val');
  
  const contrastPreviewCard = document.getElementById('contrast-preview-card');
  const mockupHeading = document.getElementById('mockup-heading');
  const mockupParagraph = document.getElementById('mockup-paragraph');
  
  const scoreRatioVal = document.getElementById('score-ratio-val');
  const badgeNormalAA = document.getElementById('badge-normal-aa');
  const badgeNormalAAA = document.getElementById('badge-normal-aaa');
  const badgeLargeAA = document.getElementById('badge-large-aa');
  const badgeLargeAAA = document.getElementById('badge-large-aaa');
  const contrastRecommendationBox = document.getElementById('contrast-recommendation-box');
  const btnContrastSwap = document.getElementById('btn-contrast-swap');

  // Export elements
  const btnExportCss = document.getElementById('btn-export-css');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnExportSvg = document.getElementById('btn-export-svg');
  const btnQuickCss = document.getElementById('btn-quick-css');
  const btnQuickJson = document.getElementById('btn-quick-json');

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
      
      if (targetId === "view-harmony") {
        document.getElementById('panel-harmony-settings').classList.add('active');
      } else if (targetId === "view-contrast") {
        document.getElementById('panel-contrast-settings').classList.add('active');
      } else if (targetId === "view-export") {
        document.getElementById('panel-export-settings').classList.add('active');
      }
    });
  });

  // --- COLOR FORMATTING HELPERS (HEX / RGB / HSL) ---
  
  function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  function rgbToHex(r, g, b) {
    const componentToHex = (x) => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  function hexToHsl(hex) {
    const rgb = hexToRgb(hex);
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
  }

  function hslToHex(h, s, l) {
    const rgb = hslToRgb(h, s, l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  // --- HARMONY ENGINE ---

  function generatePalette() {
    const hex = state.harmonySeed;
    const rule = state.harmonyRule;
    const hsl = hexToHsl(hex);
    
    let colors = []; // Array of HSL values

    if (rule === 'monochromatic') {
      // 5 steps of lightness variation
      const lSteps = [
        Math.max(10, hsl.l - 30),
        Math.max(20, hsl.l - 15),
        hsl.l,
        Math.min(85, hsl.l + 15),
        Math.min(95, hsl.l + 30)
      ];
      lSteps.forEach(l => colors.push({ h: hsl.h, s: hsl.s, l }));
      harmonyModeTitle.textContent = "Monochromatic Harmony";
    } else if (rule === 'analogous') {
      // 5 adjacent hue points on color wheel (separated by 15 deg)
      const hOffsets = [-30, -15, 0, 15, 30];
      hOffsets.forEach(o => {
        const h = (hsl.h + o + 360) % 360;
        colors.push({ h, s: hsl.s, l: hsl.l });
      });
      harmonyModeTitle.textContent = "Analogous (Adjacent) Harmony";
    } else if (rule === 'complementary') {
      // Direct opposite point (180 deg) + shades
      colors.push({ h: hsl.h, s: hsl.s, l: Math.max(20, hsl.l - 20) });
      colors.push({ h: hsl.h, s: hsl.s, l: hsl.l });
      const compH = (hsl.h + 180) % 360;
      colors.push({ h: compH, s: hsl.s, l: Math.max(20, hsl.l - 15) });
      colors.push({ h: compH, s: hsl.s, l: hsl.l });
      colors.push({ h: compH, s: hsl.s, l: Math.min(85, hsl.l + 20) });
      harmonyModeTitle.textContent = "Complementary Harmony";
    } else if (rule === 'split') {
      // Direct base + two splits (150 and 210 deg offsets)
      colors.push({ h: hsl.h, s: hsl.s, l: Math.max(25, hsl.l - 15) });
      colors.push({ h: hsl.h, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 150) % 360, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 210) % 360, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 210) % 360, s: hsl.s, l: Math.min(85, hsl.l + 15) });
      harmonyModeTitle.textContent = "Split Complementary Harmony";
    } else if (rule === 'triadic') {
      // 3 equilateral points (120 and 240 deg offsets)
      colors.push({ h: hsl.h, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 120) % 360, s: hsl.s, l: Math.max(20, hsl.l - 15) });
      colors.push({ h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 240) % 360, s: hsl.s, l: Math.min(85, hsl.l + 15) });
      harmonyModeTitle.textContent = "Triadic (3-Points) Harmony";
    } else if (rule === 'tetradic') {
      // 4 points forming a square (90, 180, 270 deg offsets)
      colors.push({ h: hsl.h, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 270) % 360, s: hsl.s, l: Math.max(25, hsl.l - 15) });
      harmonyModeTitle.textContent = "Tetradic (Square) Harmony";
    }

    activeSwatches = colors.map(c => hslToHex(c.h, c.s, c.l));
    renderHarmonyUI();
  }

  function renderHarmonyUI() {
    swatchesGrid.innerHTML = "";
    activeSwatches.forEach(hex => {
      const card = document.createElement('div');
      card.className = 'swatch-card';
      
      const box = document.createElement('div');
      box.className = 'swatch-color-box';
      box.style.backgroundColor = hex;
      
      const info = document.createElement('div');
      info.className = 'swatch-info';
      
      const hexVal = document.createElement('span');
      hexVal.className = 'swatch-hex';
      hexVal.textContent = hex.toUpperCase();
      
      const nameVal = document.createElement('span');
      nameVal.className = 'swatch-name';
      nameVal.textContent = getColorDescription(hex);

      info.appendChild(hexVal);
      info.appendChild(nameVal);
      card.appendChild(box);
      card.appendChild(info);

      // Click swatch to copy or load into Contrast Checker
      card.addEventListener('click', () => {
        navigator.clipboard.writeText(hex).then(() => {
          showToast(`Copied ${hex.toUpperCase()}!`);
        });
      });

      swatchesGrid.appendChild(card);
    });

    // Render Shades list for the Seed Color
    shadesGrid.innerHTML = "";
    const seedHsl = hexToHsl(state.harmonySeed);
    
    // Vary Lightness from 10% to 90% in 9 steps
    for (let i = 1; i <= 9; i++) {
      const targetL = i * 10;
      const hex = hslToHex(seedHsl.h, seedHsl.s, targetL);

      const chip = document.createElement('div');
      chip.className = 'shade-chip';
      chip.style.backgroundColor = hex;
      chip.textContent = hex.toUpperCase();
      chip.title = `Click to copy ${hex.toUpperCase()}`;

      chip.addEventListener('click', () => {
        navigator.clipboard.writeText(hex).then(() => {
          showToast(`Copied ${hex.toUpperCase()}!`);
        });
      });
      shadesGrid.appendChild(chip);
    }
  }

  // Simple descriptive layout names based on Hue angle
  function getColorDescription(hex) {
    const hsl = hexToHsl(hex);
    let desc = "Hue " + hsl.h + "°";
    if (hsl.h >= 340 || hsl.h < 20) desc = "Warm Red";
    else if (hsl.h >= 20 && hsl.h < 50) desc = "Orange / Gold";
    else if (hsl.h >= 50 && hsl.h < 80) desc = "Yellow Tint";
    else if (hsl.h >= 80 && hsl.h < 160) desc = "Botanical Green";
    else if (hsl.h >= 160 && hsl.h < 200) desc = "Teal / Cyan";
    else if (hsl.h >= 200 && hsl.h < 260) desc = "Ocean Blue";
    else if (hsl.h >= 260 && hsl.h < 300) desc = "Violet / Purple";
    else if (hsl.h >= 300 && hsl.h < 340) desc = "Deep Magenta";
    
    if (hsl.l < 25) desc = "Dark " + desc;
    else if (hsl.l > 75) desc = "Pale " + desc;
    return desc;
  }

  // Lock selected swatch to Clipboard
  btnLockPalette.addEventListener('click', () => {
    const cssVars = getPaletteCSS();
    navigator.clipboard.writeText(cssVars).then(() => {
      showToast("Color variables locked to clipboard!");
    });
  });

  // --- WCAG CONTRAST CHECKER ALGORITHM ---
  
  function getLuminance(rgbObj) {
    const r = rgbObj.r / 255;
    const g = rgbObj.g / 255;
    const b = rgbObj.b / 255;

    const r_srgb = (r <= 0.03928) ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const g_srgb = (g <= 0.03928) ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const b_srgb = (b <= 0.03928) ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * r_srgb + 0.7152 * g_srgb + 0.0722 * b_srgb;
  }

  function calculateContrast() {
    const rgbText = hexToRgb(state.contrastText);
    const rgbBg = hexToRgb(state.contrastBg);

    const l1 = getLuminance(rgbText);
    const l2 = getLuminance(rgbBg);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    const ratio = (lighter + 0.05) / (darker + 0.05);
    
    // Update ratio score UI
    scoreRatioVal.textContent = ratio.toFixed(2) + ":1";

    // WCAG 2.1 pass indicators
    // Normal text limits: AA >= 4.5, AAA >= 7.0
    const passNormalAA = ratio >= 4.5;
    const passNormalAAA = ratio >= 7.0;
    
    // Large text limits: AA >= 3.0, AAA >= 4.5
    const passLargeAA = ratio >= 3.0;
    const passLargeAAA = ratio >= 4.5;

    const setBadgeStatus = (el, passed) => {
      el.textContent = passed ? "Pass" : "Fail";
      el.className = `badge-status ${passed ? 'status-pass' : 'status-fail'}`;
    };

    setBadgeStatus(badgeNormalAA, passNormalAA);
    setBadgeStatus(badgeNormalAAA, passNormalAAA);
    setBadgeStatus(badgeLargeAA, passLargeAA);
    setBadgeStatus(badgeLargeAAA, passLargeAAA);

    // Apply live style preview changes to the mockup card
    contrastPreviewCard.style.backgroundColor = state.contrastBg;
    mockupHeading.style.color = state.contrastText;
    mockupParagraph.style.color = state.contrastText;

    // Recommendation Text info
    if (ratio < 3.0) {
      contrastRecommendationBox.textContent = "[CAUTION] Contrast ratio is extremely poor. Text is barely readable. Swap or adjust colors.";
      contrastRecommendationBox.style.backgroundColor = "rgba(220, 38, 38, 0.05)";
      contrastRecommendationBox.style.color = "#dc2626";
    } else if (ratio >= 3.0 && ratio < 4.5) {
      contrastRecommendationBox.textContent = "[AA LARGE] Good contrast for large headers (18pt+), but body text (normal font sizes) will fail standard AA compliance.";
      contrastRecommendationBox.style.backgroundColor = "rgba(217, 119, 6, 0.05)";
      contrastRecommendationBox.style.color = "#d97706";
    } else if (ratio >= 4.5 && ratio < 7.0) {
      contrastRecommendationBox.textContent = "[AA PASS] Excellent contrast ratio! Conforms to AA standards. Recommended for body text, blogs, and layouts.";
      contrastRecommendationBox.style.backgroundColor = "rgba(22, 163, 74, 0.05)";
      contrastRecommendationBox.style.color = "#16a34a";
    } else {
      contrastRecommendationBox.textContent = "[AAA ENHANCED] Perfect contrast compliance. Exceeds standard AAA compliance requirements. Ultimate accessibility.";
      contrastRecommendationBox.style.backgroundColor = "rgba(22, 163, 74, 0.05)";
      contrastRecommendationBox.style.color = "#16a34a";
    }
  }

  btnContrastSwap.addEventListener('click', () => {
    const textVal = state.contrastText;
    state.contrastText = state.contrastBg;
    state.contrastBg = textVal;

    contrastTextPicker.value = state.contrastText;
    contrastTextVal.value = state.contrastText;
    
    contrastBgPicker.value = state.contrastBg;
    contrastBgVal.value = state.contrastBg;

    calculateContrast();
  });

  // --- CONNECT REGISTER INPUTS ---
  function registerInputEvents() {
    // Harmony seed picker
    harmonyPicker.addEventListener('input', () => {
      state.harmonySeed = harmonyPicker.value;
      harmonyText.value = harmonyPicker.value;
      generatePalette();
    });

    harmonyText.addEventListener('input', () => {
      const val = harmonyText.value.trim();
      if (val.startsWith('#') && val.length === 7) {
        harmonyPicker.value = val;
        state.harmonySeed = val;
        generatePalette();
      }
    });

    selectHarmonyRule.addEventListener('change', () => {
      state.harmonyRule = selectHarmonyRule.value;
      generatePalette();
    });

    // Contrast checkers sync pickers
    const connectContrastInput = (picker, text, stateProp) => {
      picker.addEventListener('input', () => {
        state[stateProp] = picker.value;
        text.value = picker.value;
        calculateContrast();
      });
      text.addEventListener('input', () => {
        const val = text.value.trim();
        if (val.startsWith('#') && val.length === 7) {
          picker.value = val;
          state[stateProp] = val;
          calculateContrast();
        }
      });
    };
    connectContrastInput(contrastTextPicker, contrastTextVal, 'contrastText');
    connectContrastInput(contrastBgPicker, contrastBgVal, 'contrastBg');
  }

  // --- EXPORT SCHEME BUILDERS ---

  function getPaletteCSS() {
    let css = ":root {\n";
    activeSwatches.forEach((hex, i) => {
      css += `  --swatch-color-${i + 1}: ${hex.toUpperCase()};\n`;
    });
    css += "}";
    return css;
  }

  function getPaletteJSON() {
    return JSON.stringify(activeSwatches.map(hex => hex.toUpperCase()), null, 2);
  }

  btnExportCss.addEventListener('click', () => {
    const css = getPaletteCSS();
    navigator.clipboard.writeText(css).then(() => {
      showToast("CSS variables copied to Clipboard!");
    });
  });

  btnQuickCss.addEventListener('click', () => {
    const css = getPaletteCSS();
    navigator.clipboard.writeText(css).then(() => {
      showToast("CSS variables copied to Clipboard!");
    });
  });

  btnExportJson.addEventListener('click', () => {
    const json = getPaletteJSON();
    navigator.clipboard.writeText(json).then(() => {
      showToast("JSON palette copied to Clipboard!");
    });
  });

  btnQuickJson.addEventListener('click', () => {
    const json = getPaletteJSON();
    navigator.clipboard.writeText(json).then(() => {
      showToast("JSON palette copied to Clipboard!");
    });
  });

  // Vector SVG swatch grid download exporter
  btnExportSvg.addEventListener('click', () => {
    const size = 120;
    const gap = 15;
    const padding = 20;
    const count = activeSwatches.length;
    
    const svgW = count * size + (count - 1) * gap + 2 * padding;
    const svgH = size + 2 * padding + 40;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">\n`;
    svg += `  <!-- Background -->\n`;
    svg += `  <rect width="100%" height="100%" fill="#ffffff" />\n`;
    
    activeSwatches.forEach((hex, i) => {
      const x = padding + i * (size + gap);
      const y = padding;
      
      // Color swatches box
      svg += `  <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="8" fill="${hex}" stroke="#e2e2e5" stroke-width="1" />\n`;
      
      // Hex label text
      svg += `  <text x="${x + size / 2}" y="${y + size + 22}" font-family="monospace" font-size="12" font-weight="bold" fill="#1c1c1e" text-anchor="middle">${hex.toUpperCase()}</text>\n`;
    });
    
    svg += `</svg>`;
    
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `palette_${state.harmonyRule}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("SVG Swatches saved!");
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

  // ── Mobile sidebar toggle wiring ──
  const _btnToggleLeft = document.getElementById('btn-toggle-left');
  const _btnToggleRight = document.getElementById('btn-toggle-right');
  const _mobileSidebarOverlay = document.getElementById('mobile-sidebar-overlay');
  const _leftToolbar = document.querySelector('.left-toolbar');
  const _rightSidebar = document.querySelector('.right-sidebar');

  if (_btnToggleLeft && _btnToggleRight && _mobileSidebarOverlay) {
    _btnToggleLeft.addEventListener('click', (e) => {
      e.stopPropagation();
      _leftToolbar.classList.toggle('open');
      _rightSidebar.classList.remove('open');
      _mobileSidebarOverlay.style.display = _leftToolbar.classList.contains('open') ? 'block' : 'none';
    });
    _btnToggleRight.addEventListener('click', (e) => {
      e.stopPropagation();
      _rightSidebar.classList.toggle('open');
      _leftToolbar.classList.remove('open');
      _mobileSidebarOverlay.style.display = _rightSidebar.classList.contains('open') ? 'block' : 'none';
    });
    _mobileSidebarOverlay.addEventListener('click', () => {
      _leftToolbar.classList.remove('open');
      _rightSidebar.classList.remove('open');
      _mobileSidebarOverlay.style.display = 'none';
    });
  }

    // Navigation pill buttons logic removed safely


  // Initial Run
  registerInputEvents();
  generatePalette();
  calculateContrast();
});
