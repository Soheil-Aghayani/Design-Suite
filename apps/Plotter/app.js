document.addEventListener('DOMContentLoaded', () => {
  // Elements: Axis Config & Scale Tab
  const startValEl = document.getElementById('start-val');
  const endValEl = document.getElementById('end-val');
  const stepValEl = document.getElementById('step-val');
  const leftExtEl = document.getElementById('left-ext');
  const rightExtEl = document.getElementById('right-ext');
  const axisYEl = document.getElementById('axis-y');
  const labelFrequencyEl = document.getElementById('label-frequency');
  const minorSubdivisionsEl = document.getElementById('minor-subdivisions');
  
  // Elements: Style / Geometry Tab
  const lineWidthEl = document.getElementById('line-width');
  const tickHeightEl = document.getElementById('tick-height');
  const tickWidthEl = document.getElementById('tick-width');
  const arrowTypeEl = document.getElementById('arrow-type');
  const tickAlignmentEl = document.getElementById('tick-alignment');
  
  const colorLineEl = document.getElementById('color-line');
  const colorLineTextEl = document.getElementById('color-line-text');
  
  // Elements: Typography Tab
  const fontFamilyEl = document.getElementById('font-family');
  const customFontEl = document.getElementById('custom-font-family');
  const customFontWrapper = document.getElementById('custom-font-wrapper');
  const persianNumbersEl = document.getElementById('persian-numbers');
  const fontSizeEl = document.getElementById('font-size');
  const fontWeightEl = document.getElementById('font-weight');
  const fontStyleItalicEl = document.getElementById('font-style-italic');
  const letterSpacingEl = document.getElementById('letter-spacing');
  const labelOffsetEl = document.getElementById('label-offset');
  const labelPrefixEl = document.getElementById('label-prefix');
  const labelSuffixEl = document.getElementById('label-suffix');
  
  const colorTextEl = document.getElementById('color-text');
  const colorTextTextEl = document.getElementById('color-text-text');

  // Elements: Pointing Arrow Section
  const showArrowEl = document.getElementById('show-arrow');
  const arrowControlsContainer = document.getElementById('arrow-controls-container');
  const arrowValEl = document.getElementById('arrow-val');
  const arrowValSliderEl = document.getElementById('arrow-val-slider');
  const arrowValCustomEl = document.getElementById('arrow-val-custom');
  const arrowValAutoWrapper = document.getElementById('arrow-val-auto-wrapper');
  const arrowValCustomWrapper = document.getElementById('arrow-val-custom-wrapper');
  const arrowLabelEl = document.getElementById('arrow-label');
  const arrowPlacementEl = document.getElementById('arrow-placement');
  const colorArrowEl = document.getElementById('color-arrow');
  const colorArrowTextEl = document.getElementById('color-arrow-text');
  const arrowLengthEl = document.getElementById('arrow-length');
  const arrowThicknessEl = document.getElementById('arrow-thickness');
  const arrowHeadSizeEl = document.getElementById('arrow-head-size');
  const arrowOffsetEl = document.getElementById('arrow-offset');

  // Elements: Ruler Mode Body Section
  const rulerStyleEl = document.getElementById('ruler-style');
  const rulerControlsContainer = document.getElementById('ruler-controls-container');
  const rulerHeightEl = document.getElementById('ruler-height');
  const rulerPlacementEl = document.getElementById('ruler-placement');

  // Elements: Vector Arrow (Interval) Section
  const showVectorEl = document.getElementById('show-vector');
  const vectorControlsContainer = document.getElementById('vector-controls-container');
  const vectorValAEl = document.getElementById('vector-val-a');
  const vectorValASliderEl = document.getElementById('vector-val-a-slider');
  const vectorValACustomEl = document.getElementById('vector-val-a-custom');
  const vectorValBEl = document.getElementById('vector-val-b');
  const vectorValBSliderEl = document.getElementById('vector-val-b-slider');
  const vectorValBCustomEl = document.getElementById('vector-val-b-custom');
  const vectorAAutoWrapper = document.getElementById('vector-a-auto-wrapper');
  const vectorACustomWrapper = document.getElementById('vector-a-custom-wrapper');
  const vectorBAutoWrapper = document.getElementById('vector-b-auto-wrapper');
  const vectorBCustomWrapper = document.getElementById('vector-b-custom-wrapper');
  const vectorLabelEl = document.getElementById('vector-label');
  const vectorStyleEl = document.getElementById('vector-style');
  const vectorHeightEl = document.getElementById('vector-height');
  const vectorThicknessEl = document.getElementById('vector-thickness');
  const colorVectorEl = document.getElementById('color-vector');
  const colorVectorTextEl = document.getElementById('color-vector-text');

  // Elements: Custom Labels & Rotation & HUD References
  const labelModeEl = document.getElementById('label-mode');
  const customLabelsInputEl = document.getElementById('custom-labels-input');
  const customLabelsWrapper = document.getElementById('custom-labels-wrapper');
  const labelFrequencyWrapper = document.getElementById('label-frequency-wrapper');
  
  const labelRotationEl = document.getElementById('label-rotation');
  const labelRotationValEl = document.getElementById('label-rotation-val');
  
  const btnCopyPng = document.getElementById('btn-copy-png');
  
  const hudDimsValEl = document.getElementById('hud-dims-val');
  const hudTicksValEl = document.getElementById('hud-ticks-val');
  const hudZoomValEl = document.getElementById('hud-zoom-val');

  // Elements: UI Containers, Buttons, Presets
  const previewContainer = document.getElementById('preview-container');
  const btnExportPng = document.getElementById('btn-export-png');
  const btnCopySvg = document.getElementById('btn-copy-svg');
  const appToast = document.getElementById('app-toast');
  
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');
  
  const newPresetNameEl = document.getElementById('new-preset-name');
  const btnSavePreset = document.getElementById('btn-save-preset');
  const customPresetsListEl = document.getElementById('custom-presets-list');

  // Elements: Left Toolbar Action Buttons
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnReset = document.getElementById('btn-reset');
  const btnRandomize = document.getElementById('btn-randomize');
  const btnQuickExport = document.getElementById('btn-quick-export');
  const btnQuickCopy = document.getElementById('btn-quick-copy');

  // Elements: Left Toolbar Zoom Buttons
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const zoomResetBtn = document.getElementById('zoom-reset-btn');
  const zoomDisplayTextText = document.getElementById('zoom-display-text');

  // State Variables
  let currentTheme = 'light';
  let isUpdatingFromPreset = false; // Flag to prevent saving intermediate states to history
  let inRandomSession = false;
  
  // Photoshop Panning & Zoom state
  let zoomScale = 1.0;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let isSpacePressed = false;
  let isFirstRender = true;
  
  // --- Mobile Sidebar Toggles ---
  const btnToggleLeft = document.getElementById('btn-toggle-left');
  const btnToggleRight = document.getElementById('btn-toggle-right');
  const mobileSidebarOverlay = document.getElementById('mobile-sidebar-overlay');
  const leftToolbar = document.querySelector('.left-toolbar');
  const rightSidebar = document.querySelector('.right-sidebar');

  if (btnToggleLeft && btnToggleRight && mobileSidebarOverlay) {
    const closeMobileDrawers = () => {
      leftToolbar.classList.remove('open');
      rightSidebar.classList.remove('open');
      mobileSidebarOverlay.style.display = 'none';
    };

    btnToggleLeft.addEventListener('click', (e) => {
      e.stopPropagation();
      leftToolbar.classList.toggle('open');
      rightSidebar.classList.remove('open');
      mobileSidebarOverlay.style.display = leftToolbar.classList.contains('open') ? 'block' : 'none';
    });

    btnToggleRight.addEventListener('click', (e) => {
      e.stopPropagation();
      rightSidebar.classList.toggle('open');
      leftToolbar.classList.remove('open');
      mobileSidebarOverlay.style.display = rightSidebar.classList.contains('open') ? 'block' : 'none';
    });

    mobileSidebarOverlay.addEventListener('click', closeMobileDrawers);

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        if (!leftToolbar.contains(e.target) && !rightSidebar.contains(e.target)
          && e.target !== btnToggleLeft && e.target !== btnToggleRight) {
          closeMobileDrawers();
        }
      }
    });
  }
  // --- End Mobile Toggles ---
  
  // Undo/Redo History Stack
  let historyStack = [];
  let historyPointer = -1;

  // --- SAFE NUMBER PARSING HELPERS ---
  function parseFloatDefault(val, def) {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? def : parsed;
  }

  function parseIntDefault(val, def) {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? def : parsed;
  }

  // --- TAB NAVIGATION SWITCHER ---
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.sidebar-tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(targetTabId).classList.add('active');
    });
  });

  // --- PHOTOSHOP ZOOM & PAN CONTROLS ---
  const viewport = document.querySelector('.canvas-viewport');
  
  function updateContainerSize() {
    const svgEl = previewContainer.querySelector('svg');
    if (svgEl) {
      const contentWidth = parseFloat(svgEl.getAttribute('data-width')) || 1000;
      const contentHeight = parseFloat(svgEl.getAttribute('data-height')) || 220;
      previewContainer.style.width = contentWidth + 'px';
      previewContainer.style.height = contentHeight + 'px';
    }
  }

  function centerCanvas() {
    const viewportRect = viewport.getBoundingClientRect();
    const svgEl = previewContainer.querySelector('svg');
    if (svgEl) {
      const contentWidth = parseFloat(svgEl.getAttribute('data-width')) || 1000;
      const contentHeight = parseFloat(svgEl.getAttribute('data-height')) || 220;
      
      previewContainer.style.width = contentWidth + 'px';
      previewContainer.style.height = contentHeight + 'px';
      
      panX = (viewportRect.width - contentWidth * zoomScale) / 2;
      panY = (viewportRect.height - contentHeight * zoomScale) / 2;
      applyTransform();
    }
  }

  function zoomCentered(factor) {
    const rect = viewport.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const canvasX = (centerX - panX) / zoomScale;
    const canvasY = (centerY - panY) / zoomScale;
    
    zoomScale = Math.max(0.1, Math.min(10.0, zoomScale * factor));
    
    panX = centerX - canvasX * zoomScale;
    panY = centerY - canvasY * zoomScale;
    
    applyTransform();
  }

  viewport.addEventListener('mousedown', (e) => {
    // Start panning if Left click (button 0) or Middle click (button 1)
    if (e.button === 0 || e.button === 1) {
      isPanning = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      viewport.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isPanning) {
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      applyTransform();
    }
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      viewport.style.cursor = 'grab';
    }
  });

  // Wheel Zoom (Figma/Photoshop scroll zoom focused under cursor)
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const canvasX = (mouseX - panX) / zoomScale;
    const canvasY = (mouseY - panY) / zoomScale;
    
    // Zoom sensitivity factor
    const zoomFactor = 1.12;
    
    if (e.deltaY < 0) {
      // Zoom in
      zoomScale = Math.min(10.0, zoomScale * zoomFactor);
    } else {
      // Zoom out
      zoomScale = Math.max(0.1, zoomScale / zoomFactor);
    }
    
    panX = mouseX - canvasX * zoomScale;
    panY = mouseY - canvasY * zoomScale;
    
    applyTransform();
  }, { passive: false });

  // Zoom Button triggers
  zoomInBtn.addEventListener('click', () => {
    zoomCentered(1.2);
  });

  zoomOutBtn.addEventListener('click', () => {
    zoomCentered(1 / 1.2);
  });

  zoomResetBtn.addEventListener('click', () => {
    zoomScale = 1.0;
    centerCanvas();
  });

  // Double click to reset zoom & center
  viewport.addEventListener('dblclick', (e) => {
    if (e.target === viewport || e.target.id === 'preview-container' || e.target.closest('#preview-container')) {
      zoomScale = 1.0;
      centerCanvas();
    }
  });

  function applyTransform() {
    const zoomPct = `${Math.round(zoomScale * 100)}%`;
    zoomDisplayTextText.textContent = zoomPct;
    if (hudZoomValEl) {
      hudZoomValEl.textContent = `Zoom: ${zoomPct}`;
    }
    previewContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
  }

  // --- TEXT & COLOR PICKER SYNCHRONIZATION ---
  function syncColorPicker(picker, textEl) {
    picker.addEventListener('input', () => {
      textEl.value = picker.value.toUpperCase();
      updateRender();
    });
    textEl.addEventListener('change', () => {
      pushHistoryState();
    });
    textEl.addEventListener('input', () => {
      const val = textEl.value.trim();
      if (/^#[0-9A-F]{6}$/i.test(val)) {
        picker.value = val;
        updateRender();
      }
    });
    textEl.addEventListener('change', () => {
      pushHistoryState();
    });
  }
  syncColorPicker(colorLineEl, colorLineTextEl);
  syncColorPicker(colorTextEl, colorTextTextEl);
  syncColorPicker(colorArrowEl, colorArrowTextEl);
  syncColorPicker(colorVectorEl, colorVectorTextEl);

  // --- FONT FAMILY CUSTOM INPUT CONTROL ---
  fontFamilyEl.addEventListener('change', () => {
    if (fontFamilyEl.value === 'custom') {
      customFontWrapper.style.display = 'flex';
    } else {
      customFontWrapper.style.display = 'none';
    }
    updateRender();
  });

  // --- PERSIAN NUMERAL TRANSLATION HELPERS ---
  function toPersianDigits(text) {
    const digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return text.toString().replace(/[0-9]/g, w => digits[+w]);
  }

  // --- SLIDER NUMERIC LABEL SYNC ---
  function updateRangeLabels() {
    document.getElementById('left-ext-val').textContent = leftExtEl.value;
    document.getElementById('right-ext-val').textContent = rightExtEl.value;
    document.getElementById('axis-y-val').textContent = axisYEl.value;
    document.getElementById('line-width-val').textContent = lineWidthEl.value;
    document.getElementById('tick-height-val').textContent = tickHeightEl.value;
    document.getElementById('tick-width-val').textContent = tickWidthEl.value;
    document.getElementById('font-size-val').textContent = fontSizeEl.value;
    document.getElementById('letter-spacing-val').textContent = letterSpacingEl.value;
    document.getElementById('label-offset-val').textContent = labelOffsetEl.value;
    
    // Pointing Arrow Values
    document.getElementById('arrow-length-val').textContent = arrowLengthEl.value;
    document.getElementById('arrow-thickness-val').textContent = arrowThicknessEl.value;
    document.getElementById('arrow-head-size-val').textContent = arrowHeadSizeEl.value;
    document.getElementById('arrow-offset-val').textContent = arrowOffsetEl.value;
    
    // Ruler and Vector Values
    document.getElementById('ruler-height-val').textContent = rulerHeightEl.value;
    document.getElementById('vector-height-val').textContent = vectorHeightEl.value;
    document.getElementById('vector-thickness-val').textContent = vectorThicknessEl.value;
  }

  // --- POINTING ARROW CONTROLS & VISIBILITY HELPERS ---
  function toggleArrowControlsVisibility() {
    if (showArrowEl.checked) {
      arrowControlsContainer.style.display = 'flex';
    } else {
      arrowControlsContainer.style.display = 'none';
    }
  }
  showArrowEl.addEventListener('change', toggleArrowControlsVisibility);

  function toggleArrowModeWrapper() {
    const labelMode = labelModeEl.value;
    if (labelMode === 'custom') {
      arrowValAutoWrapper.style.display = 'none';
      arrowValCustomWrapper.style.display = 'block';
    } else {
      arrowValAutoWrapper.style.display = 'flex';
      arrowValCustomWrapper.style.display = 'none';
    }
  }

  function updateCustomArrowDropdown() {
    const customLabelsText = customLabelsInputEl.value.trim();
    const labels = customLabelsText.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const currentSelected = arrowValCustomEl.value;
    
    arrowValCustomEl.innerHTML = '';
    labels.forEach((label, index) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.textContent = label;
      arrowValCustomEl.appendChild(opt);
    });
    
    if (currentSelected !== "" && parseInt(currentSelected) < labels.length) {
      arrowValCustomEl.value = currentSelected;
    }
  }

  function updateArrowSliderLimits() {
    const startVal = parseFloat(startValEl.value) || 0;
    const endVal = parseFloat(endValEl.value) || 100;
    const minVal = Math.min(startVal, endVal);
    const maxVal = Math.max(startVal, endVal);
    
    arrowValSliderEl.min = minVal;
    arrowValSliderEl.max = maxVal;
    
    const minorSubdivisions = parseInt(minorSubdivisionsEl.value) || 1;
    const stepVal = parseFloat(stepValEl.value) || 10;
    const subdivisionStep = stepVal / minorSubdivisions;
    arrowValSliderEl.step = subdivisionStep > 0 ? subdivisionStep : 1;
    
    // Clamp current value to min/max
    let currentArrowVal = parseFloat(arrowValEl.value);
    if (isNaN(currentArrowVal)) currentArrowVal = 500;
    if (currentArrowVal < minVal) currentArrowVal = minVal;
    if (currentArrowVal > maxVal) currentArrowVal = maxVal;
    arrowValEl.value = currentArrowVal;
    arrowValSliderEl.value = currentArrowVal;
  }

  arrowValEl.addEventListener('input', () => {
    arrowValSliderEl.value = arrowValEl.value;
  });
  arrowValSliderEl.addEventListener('input', () => {
    arrowValEl.value = arrowValSliderEl.value;
  });

  // --- RULER MODE CONTROLS & VISIBILITY HELPERS ---
  function toggleRulerControlsVisibility() {
    if (rulerStyleEl.value !== 'none') {
      rulerControlsContainer.style.display = 'flex';
    } else {
      rulerControlsContainer.style.display = 'none';
    }
  }
  rulerStyleEl.addEventListener('change', toggleRulerControlsVisibility);

  // --- VECTOR ARROW CONTROLS & VISIBILITY HELPERS ---
  function toggleVectorControlsVisibility() {
    if (showVectorEl.checked) {
      vectorControlsContainer.style.display = 'flex';
    } else {
      vectorControlsContainer.style.display = 'none';
    }
  }
  showVectorEl.addEventListener('change', toggleVectorControlsVisibility);

  function toggleVectorModeWrapper() {
    const labelMode = labelModeEl.value;
    if (labelMode === 'custom') {
      vectorAAutoWrapper.style.display = 'none';
      vectorACustomWrapper.style.display = 'block';
      vectorBAutoWrapper.style.display = 'none';
      vectorBCustomWrapper.style.display = 'block';
    } else {
      vectorAAutoWrapper.style.display = 'flex';
      vectorACustomWrapper.style.display = 'none';
      vectorBAutoWrapper.style.display = 'flex';
      vectorBCustomWrapper.style.display = 'none';
    }
  }

  function updateCustomVectorDropdowns() {
    const customLabelsText = customLabelsInputEl.value.trim();
    const labels = customLabelsText.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    const currentSelectedA = vectorValACustomEl.value;
    const currentSelectedB = vectorValBCustomEl.value;
    
    vectorValACustomEl.innerHTML = '';
    vectorValBCustomEl.innerHTML = '';
    
    labels.forEach((label, index) => {
      const optA = document.createElement('option');
      optA.value = index;
      optA.textContent = label;
      vectorValACustomEl.appendChild(optA);
      
      const optB = document.createElement('option');
      optB.value = index;
      optB.textContent = label;
      vectorValBCustomEl.appendChild(optB);
    });
    
    if (currentSelectedA !== "" && parseInt(currentSelectedA) < labels.length) {
      vectorValACustomEl.value = currentSelectedA;
    } else if (labels.length > 0) {
      vectorValACustomEl.value = 0;
    }
    
    if (currentSelectedB !== "" && parseInt(currentSelectedB) < labels.length) {
      vectorValBCustomEl.value = currentSelectedB;
    } else if (labels.length > 0) {
      vectorValBCustomEl.value = Math.min(labels.length - 1, 1);
    }
  }

  function updateVectorSliderLimits() {
    const startVal = parseFloat(startValEl.value) || 0;
    const endVal = parseFloat(endValEl.value) || 100;
    const minVal = Math.min(startVal, endVal);
    const maxVal = Math.max(startVal, endVal);
    
    vectorValASliderEl.min = minVal;
    vectorValASliderEl.max = maxVal;
    vectorValBSliderEl.min = minVal;
    vectorValBSliderEl.max = maxVal;
    
    const minorSubdivisions = parseInt(minorSubdivisionsEl.value) || 1;
    const stepVal = parseFloat(stepValEl.value) || 10;
    const subdivisionStep = stepVal / minorSubdivisions;
    const step = subdivisionStep > 0 ? subdivisionStep : 1;
    
    vectorValASliderEl.step = step;
    vectorValBSliderEl.step = step;
    
    let valA = parseFloat(vectorValAEl.value);
    if (isNaN(valA)) valA = 200;
    if (valA < minVal) valA = minVal;
    if (valA > maxVal) valA = maxVal;
    vectorValAEl.value = valA;
    vectorValASliderEl.value = valA;
    
    let valB = parseFloat(vectorValBEl.value);
    if (isNaN(valB)) valB = 700;
    if (valB < minVal) valB = minVal;
    if (valB > maxVal) valB = maxVal;
    vectorValBEl.value = valB;
    vectorValBSliderEl.value = valB;
  }

  vectorValAEl.addEventListener('input', () => {
    vectorValASliderEl.value = vectorValAEl.value;
  });
  vectorValASliderEl.addEventListener('input', () => {
    vectorValAEl.value = vectorValASliderEl.value;
  });
  vectorValBEl.addEventListener('input', () => {
    vectorValBSliderEl.value = vectorValBEl.value;
  });
  vectorValBSliderEl.addEventListener('input', () => {
    vectorValBEl.value = vectorValBSliderEl.value;
  });

  // --- GENERATE SVG STRING (TIGHT CROP MATH + ADVANCED FEATURES) ---
  function generateSVGString() {
    const labelMode = labelModeEl.value;
    const customLabelsText = customLabelsInputEl.value.trim();
    const labelRotation = parseFloat(labelRotationEl.value) || 0;
    
    let labels = [];
    if (labelMode === 'custom') {
      labels = customLabelsText.split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (labels.length === 0) labels = ['0'];
    }
    
    const startVal = parseFloatDefault(startValEl.value, 0);
    const endVal = parseFloatDefault(endValEl.value, 100);
    const stepVal = parseFloatDefault(stepValEl.value, 10);
    
    if (labelMode === 'auto' && (stepVal <= 0 || startVal >= endVal)) {
      return `<svg viewBox="0 0 1000 220" xmlns="http://www.w3.org/2000/svg"><text x="500" y="110" text-anchor="middle" fill="red">Error: Start value must be less than end value and step must be > 0</text></svg>`;
    }
    
    const leftExt = parseFloat(leftExtEl.value);
    const rightExt = parseFloat(rightExtEl.value);
    const axisY = parseFloat(axisYEl.value);
    const lineWidth = parseFloat(lineWidthEl.value);
    const tickHeight = parseFloat(tickHeightEl.value);
    const tickWidth = parseFloat(tickWidthEl.value);
    const arrowType = arrowTypeEl.value;
    const tickAlignment = tickAlignmentEl.value;
    const labelFrequency = labelFrequencyEl.value;
    const minorSubdivisions = parseInt(minorSubdivisionsEl.value) || 1;
    
    let fontFamily = fontFamilyEl.value;
    if (fontFamily === 'custom') {
      fontFamily = customFontEl.value.trim() || 'sans-serif';
    }
    const fontSize = parseFloat(fontSizeEl.value);
    const fontWeight = fontWeightEl.value;
    const fontStyle = fontStyleItalicEl.checked ? 'italic' : 'normal';
    const letterSpacing = parseFloat(letterSpacingEl.value);
    const labelOffset = parseFloat(labelOffsetEl.value);
    
    const prefix = labelPrefixEl.value;
    const suffix = labelSuffixEl.value;
    const isPersian = persianNumbersEl.checked;
    
    const colorBg = 'transparent';
    const colorLine = colorLineEl.value;
    const colorText = colorTextEl.value;

    // Arrow options
    const showArrow = showArrowEl.checked;
    const arrowVal = parseFloatDefault(arrowValEl.value, 0);
    const arrowValCustomIndex = parseIntDefault(arrowValCustomEl.value, 0);
    const arrowLabelText = arrowLabelEl.value.trim();
    const arrowPlacement = arrowPlacementEl.value;
    const arrowColor = colorArrowEl.value;
    const arrowLength = parseFloatDefault(arrowLengthEl.value, 28);
    const arrowThickness = parseFloatDefault(arrowThicknessEl.value, 2.5);
    const arrowHeadSize = parseFloatDefault(arrowHeadSizeEl.value, 7);
    const arrowOffset = parseFloatDefault(arrowOffsetEl.value, 5);
    const arrowHeadHalfWidth = arrowHeadSize * 0.6;

    // Ruler options
    const rulerStyle = rulerStyleEl.value;
    const rulerHeight = parseFloatDefault(rulerHeightEl.value, 60);
    const rulerPlacement = rulerPlacementEl.value;

    // Vector options
    const showVector = showVectorEl.checked;
    const vectorValA = parseFloatDefault(vectorValAEl.value, 0);
    const vectorValB = parseFloatDefault(vectorValBEl.value, 0);
    const vectorValACustomIndex = parseIntDefault(vectorValACustomEl.value, 0);
    const vectorValBCustomIndex = parseIntDefault(vectorValBCustomEl.value, 0);
    const vectorLabelText = vectorLabelEl.value.trim();
    const vectorStyle = vectorStyleEl.value;
    const vectorHeight = parseFloatDefault(vectorHeightEl.value, 30);
    const vectorThickness = parseFloatDefault(vectorThicknessEl.value, 2.5);
    const vectorColor = colorVectorEl.value;

    const axisStart = 50;
    const axisEnd = 950;
    
    const tickStart = axisStart + leftExt;
    const tickEnd = axisEnd - rightExt;
    const spacingSpan = tickEnd - tickStart;
    
    const arrowSize = 10;
    let actualLineStart = axisStart;
    let actualLineEnd = axisEnd;
    
    let leftArrowPolygon = '';
    let rightArrowPolygon = '';
    
    if (arrowType === 'both' || arrowType === 'left') {
      actualLineStart = axisStart + arrowSize;
      leftArrowPolygon = `<polygon points="${axisStart + arrowSize + 2},${axisY - arrowSize} ${axisStart},${axisY} ${axisStart + arrowSize + 2},${axisY + arrowSize}" fill="${colorLine}" />`;
    }
    
    if (arrowType === 'both' || arrowType === 'right') {
      actualLineEnd = axisEnd - arrowSize;
      rightArrowPolygon = `<polygon points="${axisEnd - arrowSize - 2},${axisY - arrowSize} ${axisEnd},${axisY} ${axisEnd - arrowSize - 2},${axisY + arrowSize}" fill="${colorLine}" />`;
    }

    let ticksMarkup = '';
    let labelsMarkup = '';
    
    // Bounds tracking variables
    let xMin = (arrowType === 'both' || arrowType === 'left') ? axisStart : actualLineStart;
    let xMax = (arrowType === 'both' || arrowType === 'right') ? axisEnd : actualLineEnd;
    let yMin = axisY - lineWidth / 2;
    let yMax = axisY + lineWidth / 2;
    
    if (arrowType === 'both' || arrowType === 'left' || arrowType === 'right') {
      yMin = Math.min(yMin, axisY - arrowSize);
      yMax = Math.max(yMax, axisY + arrowSize);
    }

    // Ruler Bounds
    if (rulerStyle !== 'none') {
      let rulerY = axisY - rulerHeight / 2;
      if (rulerPlacement === 'top') {
        rulerY = axisY;
      } else if (rulerPlacement === 'bottom') {
        rulerY = axisY - rulerHeight;
      }
      yMin = Math.min(yMin, rulerY);
      yMax = Math.max(yMax, rulerY + rulerHeight);
      xMin = Math.min(xMin, axisStart - 20);
      xMax = Math.max(xMax, axisEnd + 20);
    }

    // Helper to track y-ticks bounds
    function trackTickBounds(x, y1, y2) {
      yMin = Math.min(yMin, y1);
      yMax = Math.max(yMax, y2);
      xMin = Math.min(xMin, x - tickWidth / 2);
      xMax = Math.max(xMax, x + tickWidth / 2);
    }

    // Helper to track label bounds
    function trackLabelBounds(x, labelY, labelStr) {
      const w = labelStr.length * fontSize * 0.52;
      const h = fontSize;
      if (labelRotation !== 0) {
        const angleRad = Math.abs(labelRotation) * Math.PI / 180;
        const wProj = w * Math.cos(angleRad) + h * Math.sin(angleRad);
        const hProj = w * Math.sin(angleRad) + h * Math.cos(angleRad);
        xMin = Math.min(xMin, x - wProj / 2);
        xMax = Math.max(xMax, x + wProj / 2);
        yMax = Math.max(yMax, labelY + hProj);
      } else {
        xMin = Math.min(xMin, x - w / 2);
        xMax = Math.max(xMax, x + w / 2);
        yMax = Math.max(yMax, labelY + h);
      }
    }

    let totalTicksDrawn = 0;

    if (labelMode === 'custom') {
      const n = labels.length;
      totalTicksDrawn = n;
      for (let i = 0; i < n; i++) {
        const pct = n > 1 ? (i / (n - 1)) : 0.5;
        const x = tickStart + pct * spacingSpan;
        
        let y1 = axisY - tickHeight / 2;
        let y2 = axisY + tickHeight / 2;
        if (tickAlignment === 'above') {
          y1 = axisY - tickHeight;
          y2 = axisY;
        } else if (tickAlignment === 'below') {
          y1 = axisY;
          y2 = axisY + tickHeight;
        }
        
        ticksMarkup += `  <line x1="${x.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y2.toFixed(1)}" class="tick" />\n`;
        trackTickBounds(x, y1, y2);
        
        if (minorSubdivisions > 1 && i < n - 1) {
          for (let m = 1; m < minorSubdivisions; m++) {
            const minorPct = (i + m / minorSubdivisions) / (n - 1);
            const minorX = tickStart + minorPct * spacingSpan;
            const minorTickHeight = tickHeight * 0.5;
            let my1 = axisY - minorTickHeight / 2;
            let my2 = axisY + minorTickHeight / 2;
            if (tickAlignment === 'above') {
              my1 = axisY - minorTickHeight;
              my2 = axisY;
            } else if (tickAlignment === 'below') {
              my1 = axisY;
              my2 = axisY + minorTickHeight;
            }
            ticksMarkup += `  <line x1="${minorX.toFixed(1)}" y1="${my1.toFixed(1)}" x2="${minorX.toFixed(1)}" y2="${my2.toFixed(1)}" stroke="${colorLine}" stroke-width="${(tickWidth * 0.65).toFixed(1)}" stroke-linecap="butt" />\n`;
            trackTickBounds(minorX, my1, my2);
          }
        }
        
        let drawLabel = true;
        if (labelFrequency === 'ends') {
          drawLabel = (i === 0 || i === n - 1);
        } else if (labelFrequency === 'every2nd') {
          drawLabel = (i % 2 === 0);
        }
        
        if (drawLabel) {
          let rawText = labels[i];
          if (isPersian) rawText = toPersianDigits(rawText);
          const formattedLabel = `${prefix}${rawText}${suffix}`;
          const labelY = axisY + labelOffset;
          const transformAttr = labelRotation !== 0 ? ` transform="rotate(${labelRotation} ${x.toFixed(1)} ${labelY.toFixed(1)})"` : '';
          labelsMarkup += `  <text x="${x.toFixed(1)}" y="${labelY.toFixed(1)}"${transformAttr} class="label">${formattedLabel}</text>\n`;
          trackLabelBounds(x, labelY, formattedLabel);
        }
      }
    } else {
      const rangeSpan = endVal - startVal;
      let tickIndex = 0;
      for (let val = startVal; val <= endVal; val += stepVal) {
        totalTicksDrawn++;
      }
      for (let val = startVal; val <= endVal; val += stepVal) {
        const pct = (val - startVal) / rangeSpan;
        const x = tickStart + pct * spacingSpan;
        let y1 = axisY - tickHeight / 2;
        let y2 = axisY + tickHeight / 2;
        if (tickAlignment === 'above') {
          y1 = axisY - tickHeight;
          y2 = axisY;
        } else if (tickAlignment === 'below') {
          y1 = axisY;
          y2 = axisY + tickHeight;
        }
        ticksMarkup += `  <line x1="${x.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y2.toFixed(1)}" class="tick" />\n`;
        trackTickBounds(x, y1, y2);
        if (minorSubdivisions > 1 && val < endVal) {
          const minorStep = stepVal / minorSubdivisions;
          for (let m = 1; m < minorSubdivisions; m++) {
            const minorVal = val + m * minorStep;
            const minorPct = (minorVal - startVal) / rangeSpan;
            const minorX = tickStart + minorPct * spacingSpan;
            const minorTickHeight = tickHeight * 0.5;
            let my1 = axisY - minorTickHeight / 2;
            let my2 = axisY + minorTickHeight / 2;
            if (tickAlignment === 'above') {
              my1 = axisY - minorTickHeight;
              my2 = axisY;
            } else if (tickAlignment === 'below') {
              my1 = axisY;
              my2 = axisY + minorTickHeight;
            }
            ticksMarkup += `  <line x1="${minorX.toFixed(1)}" y1="${my1.toFixed(1)}" x2="${minorX.toFixed(1)}" y2="${my2.toFixed(1)}" stroke="${colorLine}" stroke-width="${(tickWidth * 0.65).toFixed(1)}" stroke-linecap="butt" />\n`;
            trackTickBounds(minorX, my1, my2);
          }
        }
        let drawLabel = true;
        if (labelFrequency === 'ends') {
          drawLabel = (val === startVal || val === endVal);
        } else if (labelFrequency === 'every2nd') {
          drawLabel = (tickIndex % 2 === 0);
        }
        if (drawLabel) {
          let rawText = val.toString();
          if (isPersian) rawText = toPersianDigits(rawText);
          const formattedLabel = `${prefix}${rawText}${suffix}`;
          const labelY = axisY + labelOffset;
          const transformAttr = labelRotation !== 0 ? ` transform="rotate(${labelRotation} ${x.toFixed(1)} ${labelY.toFixed(1)})"` : '';
          labelsMarkup += `  <text x="${x.toFixed(1)}" y="${labelY.toFixed(1)}"${transformAttr} class="label">${formattedLabel}</text>\n`;
          trackLabelBounds(x, labelY, formattedLabel);
        }
        tickIndex++;
      }
    }

    let arrowMarkup = '';
    if (showArrow) {
      let yTip = axisY;
      let tickOffset = 0;
      if (arrowPlacement === 'above') {
        if (tickAlignment === 'centered') tickOffset = tickHeight / 2;
        else if (tickAlignment === 'above') tickOffset = tickHeight;
        yTip = axisY - tickOffset - arrowOffset;
      } else {
        if (tickAlignment === 'centered') tickOffset = tickHeight / 2;
        else if (tickAlignment === 'below') tickOffset = tickHeight;
        yTip = axisY + tickOffset + arrowOffset;
      }
      let arrowPct = 0.5;
      if (labelMode === 'custom') {
        const n = labels.length;
        if (n > 1) arrowPct = Math.max(0, Math.min(n - 1, arrowValCustomIndex)) / (n - 1);
      } else {
        const rangeSpan = endVal - startVal;
        if (rangeSpan !== 0) arrowPct = (arrowVal - startVal) / rangeSpan;
        arrowPct = Math.max(0, Math.min(1, arrowPct));
      }
      const arrowX = tickStart + arrowPct * spacingSpan;
      xMin = Math.min(xMin, arrowX - arrowHeadHalfWidth - 2);
      xMax = Math.max(xMax, arrowX + arrowHeadHalfWidth + 2);
      let rawArrowLabel = arrowLabelText;
      if (isPersian) rawArrowLabel = toPersianDigits(rawArrowLabel);
      if (arrowPlacement === 'above') {
        const yTail = yTip - arrowLength;
        const yLabel = yTail - 6;
        yMin = Math.min(yMin, yLabel - fontSize);
        arrowMarkup = `  <!-- Pointing Arrow (Above) -->
  <polygon points="${arrowX.toFixed(1)},${yTip.toFixed(1)} ${(arrowX - arrowHeadHalfWidth).toFixed(1)},${(yTip - arrowHeadSize).toFixed(1)} ${(arrowX + arrowHeadHalfWidth).toFixed(1)},${(yTip - arrowHeadSize).toFixed(1)}" fill="${arrowColor}" />
  <line x1="${arrowX.toFixed(1)}" y1="${(yTip - arrowHeadSize).toFixed(1)}" x2="${arrowX.toFixed(1)}" y2="${yTail.toFixed(1)}" stroke="${arrowColor}" stroke-width="${arrowThickness.toFixed(1)}" stroke-linecap="round" />
  ${rawArrowLabel ? `  <text x="${arrowX.toFixed(1)}" y="${yLabel.toFixed(1)}" class="arrow-label-above">${rawArrowLabel}</text>` : ''}\n`;
      } else {
        const yTail = yTip + arrowLength;
        const yLabel = yTail + 6;
        yMax = Math.max(yMax, yLabel + fontSize);
        arrowMarkup = `  <!-- Pointing Arrow (Below) -->
  <polygon points="${arrowX.toFixed(1)},${yTip.toFixed(1)} ${(arrowX - arrowHeadHalfWidth).toFixed(1)},${(yTip + arrowHeadSize).toFixed(1)} ${(arrowX + arrowHeadHalfWidth).toFixed(1)},${(yTip + arrowHeadSize).toFixed(1)}" fill="${arrowColor}" />
  <line x1="${arrowX.toFixed(1)}" y1="${(yTip + arrowHeadSize).toFixed(1)}" x2="${arrowX.toFixed(1)}" y2="${yTail.toFixed(1)}" stroke="${arrowColor}" stroke-width="${arrowThickness.toFixed(1)}" stroke-linecap="round" />
  ${rawArrowLabel ? `  <text x="${arrowX.toFixed(1)}" y="${yLabel.toFixed(1)}" class="arrow-label-below">${rawArrowLabel}</text>` : ''}\n`;
      }
    }

    let rulerMarkup = '';
    if (rulerStyle !== 'none') {
      let rulerY = axisY - rulerHeight / 2;
      if (rulerPlacement === 'top') rulerY = axisY;
      else if (rulerPlacement === 'bottom') rulerY = axisY - rulerHeight;
      const rulerWidth = (axisEnd + 20) - (axisStart - 20);
      const rulerX = axisStart - 20;
      rulerMarkup = `  <!-- Ruler Body -->
  <rect x="${rulerX.toFixed(1)}" y="${rulerY.toFixed(1)}" width="${rulerWidth.toFixed(1)}" height="${rulerHeight.toFixed(1)}" rx="6" ry="6" class="ruler-body ruler-theme-${rulerStyle}" />\n`;
    }

    let vectorDefs = '';
    let vectorMarkup = '';
    if (showVector) {
      let vecTickOffset = 0;
      if (tickAlignment === 'centered') vecTickOffset = tickHeight / 2;
      else if (tickAlignment === 'above') vecTickOffset = tickHeight;
      const yVecBase = axisY - vecTickOffset - 10;
      let vecPctA = 0.5, vecPctB = 0.5;
      if (labelMode === 'custom') {
        const n = labels.length;
        if (n > 1) {
          vecPctA = Math.max(0, Math.min(n - 1, vectorValACustomIndex)) / (n - 1);
          vecPctB = Math.max(0, Math.min(n - 1, vectorValBCustomIndex)) / (n - 1);
        }
      } else {
        const rangeSpan = endVal - startVal;
        if (rangeSpan !== 0) {
          vecPctA = (vectorValA - startVal) / rangeSpan;
          vecPctB = (vectorValB - startVal) / rangeSpan;
        }
        vecPctA = Math.max(0, Math.min(1, vecPctA));
        vecPctB = Math.max(0, Math.min(1, vecPctB));
      }
      const vecXA = tickStart + vecPctA * spacingSpan;
      const vecXB = tickStart + vecPctB * spacingSpan;
      xMin = Math.min(xMin, vecXA, vecXB);
      xMax = Math.max(xMax, vecXA, vecXB);
      const peakY = vectorStyle === 'arc' ? (yVecBase - vectorHeight) : yVecBase;
      const labelY = peakY - 8;
      yMin = Math.min(yMin, labelY - fontSize);
      let rawVectorLabel = vectorLabelText;
      if (isPersian) rawVectorLabel = toPersianDigits(rawVectorLabel);
      vectorDefs = `  <defs>
    <marker id="arrowhead-vec" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 1 2.5 L 8 5 L 1 7.5 Z" fill="${vectorColor}" />
    </marker>
  </defs>\n`;
      if (vectorStyle === 'arc') {
        const xControl = (vecXA + vecXB) / 2;
        const yControl = yVecBase - vectorHeight;
        const pathD = `M ${vecXA.toFixed(1)} ${yVecBase.toFixed(1)} Q ${xControl.toFixed(1)} ${yControl.toFixed(1)} ${vecXB.toFixed(1)} ${yVecBase.toFixed(1)}`;
        vectorMarkup = `  <!-- Vector Curved Arc -->
  <path d="${pathD}" stroke="${vectorColor}" stroke-width="${vectorThickness.toFixed(1)}" fill="none" marker-end="url(#arrowhead-vec)" stroke-linecap="round" />
  ${rawVectorLabel ? `  <text x="${xControl.toFixed(1)}" y="${(yControl - 6).toFixed(1)}" class="vector-label">${rawVectorLabel}</text>` : ''}\n`;
      } else {
        vectorMarkup = `  <!-- Vector Straight Line -->
  <line x1="${vecXA.toFixed(1)}" y1="${yVecBase.toFixed(1)}" x2="${vecXB.toFixed(1)}" y2="${yVecBase.toFixed(1)}" stroke="${vectorColor}" stroke-width="${vectorThickness.toFixed(1)}" marker-end="url(#arrowhead-vec)" stroke-linecap="round" />
  ${rawVectorLabel ? `  <text x="${((vecXA + vecXB) / 2).toFixed(1)}" y="${(yVecBase - 8).toFixed(1)}" class="vector-label">${rawVectorLabel}</text>` : ''}\n`;
      }
    }

    const cropMargin = 5;
    xMin = Math.max(0, xMin - cropMargin);
    xMax = Math.min(1000, xMax + cropMargin);
    yMin = yMin - cropMargin;
    yMax = yMax + cropMargin;
    const contentWidth = xMax - xMin;
    const contentHeight = yMax - yMin;

    if (hudDimsValEl) hudDimsValEl.textContent = `${Math.round(contentWidth)} × ${Math.round(contentHeight)} px`;
    if (hudTicksValEl) {
      const minorCountText = minorSubdivisions > 1 ? ` (+${(totalTicksDrawn - 1) * (minorSubdivisions - 1)} minor)` : '';
      hudTicksValEl.textContent = `${totalTicksDrawn} Major${minorCountText}`;
    }

    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${xMin.toFixed(1)} ${yMin.toFixed(1)} ${contentWidth.toFixed(1)} ${contentHeight.toFixed(1)}" width="100%" height="100%" style="background-color: ${colorBg};" data-width="${contentWidth.toFixed(1)}" data-height="${contentHeight.toFixed(1)}" data-xmin="${xMin.toFixed(1)}" data-ymin="${yMin.toFixed(1)}">
${vectorDefs}  <style>
    .line {
      stroke: ${colorLine};
      stroke-width: ${lineWidth};
      stroke-linecap: butt;
    }
    .tick {
      stroke: ${colorLine};
      stroke-width: ${tickWidth};
      stroke-linecap: butt;
    }
    .label {
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
      font-style: ${fontStyle};
      letter-spacing: ${letterSpacing}px;
      fill: ${colorText};
      text-anchor: middle;
      dominant-baseline: hanging;
    }
    .arrow-label-above {
      font-family: ${fontFamily};
      font-size: ${(fontSize * 0.95).toFixed(1)}px;
      font-weight: 600;
      font-style: ${fontStyle};
      fill: ${arrowColor};
      text-anchor: middle;
      dominant-baseline: auto;
    }
    .arrow-label-below {
      font-family: ${fontFamily};
      font-size: ${(fontSize * 0.95).toFixed(1)}px;
      font-weight: 600;
      font-style: ${fontStyle};
      fill: ${arrowColor};
      text-anchor: middle;
      dominant-baseline: hanging;
    }
    .ruler-body {
      stroke-linejoin: round;
    }
    .ruler-theme-frosted {
      fill: ${currentTheme === 'light' ? 'rgba(235, 240, 245, 0.45)' : 'rgba(35, 35, 35, 0.45)'};
      stroke: ${currentTheme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'};
      stroke-width: 1.5;
    }
    .ruler-theme-yellow {
      fill: rgba(251, 191, 36, 0.22);
      stroke: rgba(245, 158, 11, 0.6);
      stroke-width: 1.5;
    }
    .ruler-theme-wood {
      fill: rgba(180, 110, 50, 0.22);
      stroke: rgba(120, 70, 30, 0.6);
      stroke-width: 1.5;
    }
    .vector-label {
      font-family: ${fontFamily};
      font-size: ${(fontSize * 0.95).toFixed(1)}px;
      font-weight: 600;
      font-style: ${fontStyle};
      fill: ${vectorColor};
      text-anchor: middle;
      dominant-baseline: auto;
    }
  </style>
  
${rulerMarkup}  <!-- Axis Line -->
  <line x1="${actualLineStart.toFixed(1)}" y1="${axisY}" x2="${actualLineEnd.toFixed(1)}" y2="${axisY}" class="line" />
  
  <!-- Arrowheads -->
${leftArrowPolygon ? '  ' + leftArrowPolygon + '\n' : ''}${rightArrowPolygon ? '  ' + rightArrowPolygon + '\n' : ''}
  <!-- Tick Marks -->
${ticksMarkup}
  <!-- Centered Labels -->
${labelsMarkup}
${arrowMarkup}
${vectorMarkup}</svg>`;

    return svgStr;
  }

  // --- UPDATE RENDER VIEW & PERSIST IN STORAGE ---
  function updateRender() {
    updateRangeLabels();
    if (labelModeEl.value === 'custom') {
      updateCustomArrowDropdown();
      updateCustomVectorDropdowns();
    } else {
      updateArrowSliderLimits();
      updateVectorSliderLimits();
    }
    toggleRulerControlsVisibility();
    toggleVectorControlsVisibility();
    const svgStr = generateSVGString();
    
    // Inject rendered SVG into DOM
    previewContainer.innerHTML = svgStr;
    updateContainerSize();
    
    if (isFirstRender) {
      centerCanvas();
      isFirstRender = false;
    }
    
    // Save to LocalStorage memory
    if (!isUpdatingFromPreset) {
      saveStateToLocalStorage();
    }
  }

  // --- SHOW DYNAMIC TOAST ALERTS ---
  function showToast(message) {
    appToast.textContent = message;
    appToast.classList.add('toast-show');
    setTimeout(() => {
      appToast.classList.remove('toast-show');
    }, 2500);
  }

  // --- COPY SVG XML TO CLIPBOARD ---
  function copySvgCode() {
    const svgStr = generateSVGString();
    navigator.clipboard.writeText(svgStr).then(() => {
      showToast('SVG Markup Copied!');
    }).catch(err => {
      console.error('Failed to copy', err);
      showToast('Copy Failed!');
    });
  }
  btnCopySvg.addEventListener('click', copySvgCode);
  btnQuickCopy.addEventListener('click', copySvgCode);

  // --- HIGH-RESOLUTION CROPPED PNG EXPORT VIA HTML5 CANVAS ---
  function exportPngFile() {
    const svgStr = generateSVGString();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgStr, 'image/svg+xml');
    const svgEl = doc.documentElement;
    
    const contentWidth = parseFloat(svgEl.getAttribute('data-width')) || 1000;
    const contentHeight = parseFloat(svgEl.getAttribute('data-height')) || 220;
    
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = function() {
      const scale = 4;
      const width = contentWidth * scale;
      const height = contentHeight * scale;
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Always transparent background, do not fillRect!
      ctx.drawImage(img, 0, 0, width, height);
      
      try {
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        
        const prefixName = labelPrefixEl.value.replace(/[^a-z0-9]/gi, '_');
        const suffixName = labelSuffixEl.value.replace(/[^a-z0-9]/gi, '_');
        downloadLink.download = `number-line-${startValEl.value}-${endValEl.value}${prefixName ? '-' + prefixName : ''}${suffixName ? '-' + suffixName : ''}.png`;
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        showToast('PNG Download Started!');
      } catch (e) {
        console.error(e);
        showToast('PNG Export Failed!');
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    
    img.onerror = function() {
      showToast('Image load error during export');
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  }
  btnExportPng.addEventListener('click', exportPngFile);
  btnQuickExport.addEventListener('click', exportPngFile);

  // --- COPY PNG IMAGE TO CLIPBOARD (HIGH-RES TRANSPARENT) ---
  function copyPngToClipboard() {
    const svgStr = generateSVGString();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgStr, 'image/svg+xml');
    const svgEl = doc.documentElement;
    
    const contentWidth = parseFloat(svgEl.getAttribute('data-width')) || 1000;
    const contentHeight = parseFloat(svgEl.getAttribute('data-height')) || 220;
    
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = function() {
      const scale = 4;
      const width = contentWidth * scale;
      const height = contentHeight * scale;
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      try {
        canvas.toBlob(function(blob) {
          if (!blob) {
            showToast('Failed to create PNG blob');
            return;
          }
          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]).then(function() {
            showToast('PNG Copied to Clipboard!');
          }).catch(function(err) {
            console.error('Clipboard copy error:', err);
            showToast('PNG Copy Failed!');
          });
        }, 'image/png');
      } catch (e) {
        console.error(e);
        showToast('PNG Copy Failed!');
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    
    img.onerror = function() {
      showToast('Image load error during PNG copy');
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  }
  if (btnCopyPng) {
    btnCopyPng.addEventListener('click', copyPngToClipboard);
  }

  // --- THEME TOGGLER (Light/Dark Mode) ---
  themeToggleBtn.addEventListener('click', () => {
    toggleTheme();
  });

  function toggleTheme(targetTheme) {
    if (!targetTheme) {
      targetTheme = currentTheme === 'light' ? 'dark' : 'light';
    }
    
    if (targetTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      currentTheme = 'dark';
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      currentTheme = 'light';
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }

  // --- TOGGLE CUSTOM LABELS VISIBILITY ---
  function toggleLabelModeVisibility() {
    if (labelModeEl.value === 'custom') {
      customLabelsWrapper.style.display = 'flex';
      
      // Hide auto configuration values
      document.getElementById('start-val').closest('.input-field-wrapper').style.display = 'none';
      document.getElementById('end-val').closest('.input-field-wrapper').style.display = 'none';
      document.getElementById('step-val').closest('.input-field-wrapper').style.display = 'none';
    } else {
      customLabelsWrapper.style.display = 'none';
      
      // Show auto configuration values
      document.getElementById('start-val').closest('.input-field-wrapper').style.display = 'flex';
      document.getElementById('end-val').closest('.input-field-wrapper').style.display = 'flex';
      document.getElementById('step-val').closest('.input-field-wrapper').style.display = 'flex';
    }
    toggleArrowModeWrapper();
    updateCustomArrowDropdown();
    toggleVectorModeWrapper();
    updateCustomVectorDropdowns();
  }

  labelModeEl.addEventListener('change', () => {
    toggleLabelModeVisibility();
    updateRender();
  });

  // --- MEMORY SYSTEM: SAVE STATE TO LOCAL STORAGE ---
  function saveStateToLocalStorage() {
    const state = getCurrentStatePayload();
    localStorage.setItem('plotter_v2_settings', JSON.stringify(state));
  }

  function getCurrentStatePayload() {
    return {
      theme: currentTheme,
      startVal: startValEl.value,
      endVal: endValEl.value,
      stepVal: stepValEl.value,
      leftExt: leftExtEl.value,
      rightExt: rightExtEl.value,
      axisY: axisYEl.value,
      labelFrequency: labelFrequencyEl.value,
      minorSubdivisions: minorSubdivisionsEl.value,
      lineWidth: lineWidthEl.value,
      tickHeight: tickHeightEl.value,
      tickWidth: tickWidthEl.value,
      arrowType: arrowTypeEl.value,
      tickAlignment: tickAlignmentEl.value,
      colorLine: colorLineEl.value,
      colorLineText: colorLineTextEl.value,
      fontFamily: fontFamilyEl.value,
      customFont: customFontEl.value,
      persianNumbers: persianNumbersEl.checked,
      fontSize: fontSizeEl.value,
      fontWeight: fontWeightEl.value,
      fontStyleItalic: fontStyleItalicEl.checked,
      letterSpacing: letterSpacingEl.value,
      labelOffset: labelOffsetEl.value,
      labelPrefix: labelPrefixEl.value,
      labelSuffix: labelSuffixEl.value,
      colorText: colorTextEl.value,
      colorTextText: colorTextTextEl.value,
      labelMode: labelModeEl.value,
      customLabels: customLabelsInputEl.value,
      labelRotation: labelRotationEl.value,
      showArrow: showArrowEl.checked,
      arrowVal: arrowValEl.value,
      arrowValSlider: arrowValSliderEl.value,
      arrowValCustom: arrowValCustomEl.value,
      arrowLabel: arrowLabelEl.value,
      arrowPlacement: arrowPlacementEl.value,
      colorArrow: colorArrowEl.value,
      colorArrowText: colorArrowTextEl.value,
      arrowLength: arrowLengthEl.value,
      arrowThickness: arrowThicknessEl.value,
      arrowHeadSize: arrowHeadSizeEl.value,
      arrowOffset: arrowOffsetEl.value,
      rulerStyle: rulerStyleEl.value,
      rulerHeight: rulerHeightEl.value,
      rulerPlacement: rulerPlacementEl.value,
      showVector: showVectorEl.checked,
      vectorValA: vectorValAEl.value,
      vectorValASlider: vectorValASliderEl.value,
      vectorValACustom: vectorValACustomEl.value,
      vectorValB: vectorValBEl.value,
      vectorValBSlider: vectorValBSliderEl.value,
      vectorValBCustom: vectorValBCustomEl.value,
      vectorLabel: vectorLabelEl.value,
      vectorStyle: vectorStyleEl.value,
      vectorHeight: vectorHeightEl.value,
      vectorThickness: vectorThicknessEl.value,
      colorVector: colorVectorEl.value,
      colorVectorText: colorVectorTextEl.value
    };
  }

  // --- MEMORY SYSTEM: LOAD STATE FROM LOCAL STORAGE ---
  function loadStateFromLocalStorage() {
    const saved = localStorage.getItem('plotter_v2_settings');
    if (!saved) return false;
    
    try {
      const state = JSON.parse(saved);
      loadStatePayload(state);
      return true;
    } catch (e) {
      console.error('Error loading config state', e);
      return false;
    }
  }

  function loadStatePayload(state) {
    isUpdatingFromPreset = true;
    
    toggleTheme(state.theme);
    
    startValEl.value = state.startVal;
    endValEl.value = state.endVal;
    stepValEl.value = state.stepVal;
    leftExtEl.value = state.leftExt;
    rightExtEl.value = state.rightExt;
    axisYEl.value = state.axisY;
    
    if (state.labelFrequency) labelFrequencyEl.value = state.labelFrequency;
    if (state.minorSubdivisions) minorSubdivisionsEl.value = state.minorSubdivisions;
    
    lineWidthEl.value = state.lineWidth;
    tickHeightEl.value = state.tickHeight;
    tickWidthEl.value = state.tickWidth;
    arrowTypeEl.value = state.arrowType;
    if (state.tickAlignment) tickAlignmentEl.value = state.tickAlignment;
    
    colorLineEl.value = state.colorLine || '#1A1A1A';
    colorLineTextEl.value = state.colorLineText || '#1A1A1A';
    
    fontFamilyEl.value = state.fontFamily;
    customFontEl.value = state.customFont || '';
    persianNumbersEl.checked = state.persianNumbers || false;
    fontSizeEl.value = state.fontSize;
    fontWeightEl.value = state.fontWeight;
    fontStyleItalicEl.checked = state.fontStyleItalic || false;
    letterSpacingEl.value = state.letterSpacing || 0;
    labelOffsetEl.value = state.labelOffset;
    labelPrefixEl.value = state.labelPrefix || '';
    labelSuffixEl.value = state.labelSuffix || '';
    
    colorTextEl.value = state.colorText || '#1A1A1A';
    colorTextTextEl.value = state.colorTextText || '#1A1A1A';
    
    if (state.labelMode) {
      labelModeEl.value = state.labelMode;
    } else {
      labelModeEl.value = 'auto';
    }
    
    if (state.customLabels) {
      customLabelsInputEl.value = state.customLabels;
    } else {
      customLabelsInputEl.value = '0, 1/4, 1/2, 3/4, 1';
    }
    
    if (state.labelRotation !== undefined) {
      labelRotationEl.value = state.labelRotation;
    } else {
      labelRotationEl.value = 0;
    }

    // Load Pointing Arrow States
    showArrowEl.checked = state.showArrow || false;
    arrowValEl.value = state.arrowVal !== undefined ? state.arrowVal : 500;
    arrowValSliderEl.value = state.arrowValSlider !== undefined ? state.arrowValSlider : 500;
    arrowValCustomEl.value = state.arrowValCustom !== undefined ? state.arrowValCustom : 0;
    arrowLabelEl.value = state.arrowLabel !== undefined ? state.arrowLabel : 'x';
    arrowPlacementEl.value = state.arrowPlacement || 'above';
    colorArrowEl.value = state.colorArrow || '#EF4444';
    colorArrowTextEl.value = state.colorArrowText || '#EF4444';
    arrowLengthEl.value = state.arrowLength !== undefined ? state.arrowLength : 28;
    arrowThicknessEl.value = state.arrowThickness !== undefined ? state.arrowThickness : 2.5;
    arrowHeadSizeEl.value = state.arrowHeadSize !== undefined ? state.arrowHeadSize : 7;
    arrowOffsetEl.value = state.arrowOffset !== undefined ? state.arrowOffset : 5;

    // Load Ruler States
    rulerStyleEl.value = state.rulerStyle || 'none';
    rulerHeightEl.value = state.rulerHeight !== undefined ? state.rulerHeight : 60;
    rulerPlacementEl.value = state.rulerPlacement || 'center';

    // Load Vector States
    showVectorEl.checked = state.showVector || false;
    vectorValAEl.value = state.vectorValA !== undefined ? state.vectorValA : 200;
    vectorValASliderEl.value = state.vectorValASlider !== undefined ? state.vectorValASlider : 200;
    vectorValACustomEl.value = state.vectorValACustom !== undefined ? state.vectorValACustom : 0;
    vectorValBEl.value = state.vectorValB !== undefined ? state.vectorValB : 700;
    vectorValBSliderEl.value = state.vectorValBSlider !== undefined ? state.vectorValBSlider : 700;
    vectorValBCustomEl.value = state.vectorValBCustom !== undefined ? state.vectorValBCustom : 1;
    vectorLabelEl.value = state.vectorLabel !== undefined ? state.vectorLabel : '+5';
    vectorStyleEl.value = state.vectorStyle || 'arc';
    vectorHeightEl.value = state.vectorHeight !== undefined ? state.vectorHeight : 30;
    vectorThicknessEl.value = state.vectorThickness !== undefined ? state.vectorThickness : 2.5;
    colorVectorEl.value = state.colorVector || '#3B82F6';
    colorVectorTextEl.value = state.colorVectorText || '#3B82F6';
    
    toggleArrowControlsVisibility();
    toggleArrowModeWrapper();
    toggleRulerControlsVisibility();
    toggleVectorControlsVisibility();
    toggleVectorModeWrapper();
    toggleLabelModeVisibility();
    
    if (fontFamilyEl.value === 'custom') {
      customFontWrapper.style.display = 'flex';
    } else {
      customFontWrapper.style.display = 'none';
    }
    
    isUpdatingFromPreset = false;
    updateRender();
  }

  // --- CUSTOM SAVED PRESETS SYSTEM (SLOTS IN LOCAL STORAGE) ---
  function getCustomPresets() {
    const list = localStorage.getItem('plotter_v2_custom_presets');
    return list ? JSON.parse(list) : [];
  }

  function saveCustomPresets(presets) {
    localStorage.setItem('plotter_v2_custom_presets', JSON.stringify(presets));
  }

  function loadCustomPresetsList() {
    customPresetsListEl.innerHTML = '';
    const presets = getCustomPresets();
    
    if (presets.length === 0) {
      customPresetsListEl.innerHTML = '<div class="empty-presets-message">No custom presets saved.</div>';
      return;
    }
    
    presets.forEach(p => {
      const item = document.createElement('div');
      item.className = 'custom-preset-item';
      
      item.innerHTML = `
        <span class="preset-item-name" title="${p.name}">${p.name}</span>
        <div class="preset-item-actions">
          <button class="load-preset-btn" data-name="${p.name}">Load</button>
          <button class="delete-preset-btn" data-name="${p.name}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      `;
      
      item.querySelector('.load-preset-btn').addEventListener('click', () => {
        loadStatePayload(p.settings);
        pushHistoryState();
        showToast(`Loaded: ${p.name}`);
      });
      
      item.querySelector('.delete-preset-btn').addEventListener('click', () => {
        deleteCustomPreset(p.name);
      });
      
      customPresetsListEl.appendChild(item);
    });
  }

  function deleteCustomPreset(name) {
    let presets = getCustomPresets();
    presets = presets.filter(p => p.name !== name);
    saveCustomPresets(presets);
    loadCustomPresetsList();
    showToast('Preset Deleted');
  }

  btnSavePreset.addEventListener('click', () => {
    const name = newPresetNameEl.value.trim();
    if (!name) {
      showToast('Enter preset name first');
      return;
    }
    
    const settings = getCurrentStatePayload();
    const presets = getCustomPresets();
    const existingIndex = presets.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
    
    if (existingIndex > -1) {
      presets[existingIndex].settings = settings;
      showToast('Overwrote preset');
    } else {
      presets.push({ name: name, settings: settings });
      showToast('Preset saved');
    }
    
    saveCustomPresets(presets);
    newPresetNameEl.value = '';
    loadCustomPresetsList();
  });

  // --- UNDO / REDO HISTORY STACK SYSTEM ---
  function pushHistoryState() {
    if (isUpdatingFromPreset) return;
    
    inRandomSession = false;
    
    const stateString = JSON.stringify(getCurrentStatePayload());
    
    if (historyPointer >= 0 && historyStack[historyPointer] === stateString) {
      return;
    }
    
    historyStack = historyStack.slice(0, historyPointer + 1);
    historyStack.push(stateString);
    historyPointer = historyStack.length - 1;
    
    if (historyStack.length > 50) {
      historyStack.shift();
      historyPointer--;
    }
    
    updateHistoryButtons();
  }

  function undoAction() {
    inRandomSession = false;
    if (historyPointer > 0) {
      historyPointer--;
      isUpdatingFromPreset = true;
      loadStatePayload(JSON.parse(historyStack[historyPointer]));
      isUpdatingFromPreset = false;
      updateHistoryButtons();
      showToast('Undo');
    }
  }

  function redoAction() {
    inRandomSession = false;
    if (historyPointer < historyStack.length - 1) {
      historyPointer++;
      isUpdatingFromPreset = true;
      loadStatePayload(JSON.parse(historyStack[historyPointer]));
      isUpdatingFromPreset = false;
      updateHistoryButtons();
      showToast('Redo');
    }
  }

  function updateHistoryButtons() {
    btnUndo.disabled = (historyPointer <= 0);
    btnRedo.disabled = (historyPointer >= historyStack.length - 1);
  }

  btnUndo.addEventListener('click', undoAction);
  btnRedo.addEventListener('click', redoAction);

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undoAction();
    } else if (e.ctrlKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault();
      redoAction();
    } else if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
      e.preventDefault();
      zoomCentered(1.15);
    } else if (e.ctrlKey && e.key === '-') {
      e.preventDefault();
      zoomCentered(1 / 1.15);
    } else if (e.ctrlKey && e.key === '0') {
      e.preventDefault();
      zoomScale = 1.0;
      centerCanvas();
    } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      exportPngFile();
    } else if (e.key === ' ' && e.target === document.body) {
      e.preventDefault();
      isSpacePressed = true;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
      isSpacePressed = false;
    }
  });

  // --- RESET TO DEFAULTS ACTION ---
  btnReset.addEventListener('click', () => {
    // Default config values
    isUpdatingFromPreset = true;
    toggleTheme('light');
    
    startValEl.value = 100;
    endValEl.value = 900;
    stepValEl.value = 100;
    leftExtEl.value = 50;
    rightExtEl.value = 50;
    axisYEl.value = 100;
    labelFrequencyEl.value = 'all';
    minorSubdivisionsEl.value = '1';
    
    lineWidthEl.value = 2;
    tickHeightEl.value = 20;
    tickWidthEl.value = 1.5;
    arrowTypeEl.value = 'right';
    tickAlignmentEl.value = 'centered';
    
    colorLineEl.value = '#1A1A1A';
    colorLineTextEl.value = '#1A1A1A';
    
    fontFamilyEl.value = 'system-ui, sans-serif';
    customFontWrapper.style.display = 'none';
    persianNumbersEl.checked = false;
    fontSizeEl.value = 22;
    fontWeightEl.value = '400';
    fontStyleItalicEl.checked = false;
    letterSpacingEl.value = 1;
    labelOffsetEl.value = 25;
    labelPrefixEl.value = '';
    labelSuffixEl.value = '';
    
    colorTextEl.value = '#1A1A1A';
    colorTextTextEl.value = '#1A1A1A';
    
    labelModeEl.value = 'auto';
    customLabelsInputEl.value = '0, 1/4, 1/2, 3/4, 1';
    labelRotationEl.value = 0;

    // Reset pointing arrow properties
    showArrowEl.checked = false;
    arrowValEl.value = 500;
    arrowValSliderEl.value = 500;
    arrowValCustomEl.value = 0;
    arrowLabelEl.value = 'x';
    arrowPlacementEl.value = 'above';
    colorArrowEl.value = '#EF4444';
    colorArrowTextEl.value = '#EF4444';
    arrowLengthEl.value = 28;
    arrowThicknessEl.value = 2.5;
    arrowHeadSizeEl.value = 7;
    arrowOffsetEl.value = 5;

    // Reset ruler properties
    rulerStyleEl.value = 'none';
    rulerHeightEl.value = 60;
    rulerPlacementEl.value = 'center';

    // Reset vector properties
    showVectorEl.checked = false;
    vectorValAEl.value = 200;
    vectorValASliderEl.value = 200;
    vectorValACustomEl.value = 0;
    vectorValBEl.value = 700;
    vectorValBSliderEl.value = 700;
    vectorValBCustomEl.value = 1;
    vectorLabelEl.value = '+5';
    vectorStyleEl.value = 'arc';
    vectorHeightEl.value = 30;
    vectorThicknessEl.value = 2.5;
    colorVectorEl.value = '#3B82F6';
    colorVectorTextEl.value = '#3B82F6';
    
    toggleArrowControlsVisibility();
    toggleArrowModeWrapper();
    toggleRulerControlsVisibility();
    toggleVectorControlsVisibility();
    toggleVectorModeWrapper();
    toggleLabelModeVisibility();
    
    isUpdatingFromPreset = false;
    updateRender();
    pushHistoryState();
    
    showToast('Reset to Defaults');
  });

  // --- RANDOMIZE COLOR ENGINE (TASTEFUL PALETTES ONLY) ---
  const colorPalettes = [
    // Monochromatic / Slate
    { line: '#1A1A1A', text: '#1A1A1A', theme: 'light' },
    { line: '#475569', text: '#334155', theme: 'light' },
    { line: '#F1F5F9', text: '#CBD5E1', theme: 'dark' },
    
    // Forest / Botanical
    { line: '#14532D', text: '#15803D', theme: 'light' },
    { line: '#4ADE80', text: '#F0FDF4', theme: 'dark' },
    
    // Terracotta / Earthy
    { line: '#C2410C', text: '#431407', theme: 'light' },
    { line: '#FDBA74', text: '#FFEDD5', theme: 'dark' },
    
    // Deep Ocean / Indigo
    { line: '#1E3A8A', text: '#3B82F6', theme: 'light' },
    { line: '#38BDF8', text: '#E0F2FE', theme: 'dark' },
    
    // Crimson / Burgundy
    { line: '#991B1B', text: '#7F1D1D', theme: 'light' },
    { line: '#FCA5A5', text: '#FEE2E2', theme: 'dark' },
    
    // Purple Rose
    { line: '#6D28D9', text: '#4C1D95', theme: 'light' },
    { line: '#C084FC', text: '#F3E8FF', theme: 'dark' },
    
    // Teal / Emerald
    { line: '#0F766E', text: '#115E59', theme: 'light' },
    { line: '#2DD4BF', text: '#F0FDFA', theme: 'dark' }
  ];

  btnRandomize.addEventListener('click', () => {
    isUpdatingFromPreset = true;
    
    const p = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
    toggleTheme(p.theme);
    
    colorLineEl.value = p.line;
    colorLineTextEl.value = p.line;
    colorTextEl.value = p.text;
    colorTextTextEl.value = p.text;
    
    isUpdatingFromPreset = false;
    updateRender();
    
    // Overwrite history top if we are inside a randomizing session, otherwise push
    const newState = JSON.stringify(getCurrentStatePayload());
    if (historyPointer > 0 && inRandomSession) {
      historyStack[historyPointer] = newState;
    } else {
      historyStack = historyStack.slice(0, historyPointer + 1);
      historyStack.push(newState);
      historyPointer = historyStack.length - 1;
    }
    
    inRandomSession = true;
    updateHistoryButtons();
    showToast('Colors Randomized (Ctrl+Z to revert)');
  });

  // --- DYNAMIC INPUT LISTENER DISPATCHER ---
  const autoInputs = [
    startValEl, endValEl, stepValEl, leftExtEl, rightExtEl, axisYEl,
    labelFrequencyEl, minorSubdivisionsEl,
    lineWidthEl, tickHeightEl, tickWidthEl, arrowTypeEl, tickAlignmentEl,
    fontFamilyEl, customFontEl, persianNumbersEl, fontSizeEl, fontWeightEl, fontStyleItalicEl,
    letterSpacingEl, labelOffsetEl, labelPrefixEl, labelSuffixEl,
    labelModeEl, customLabelsInputEl, labelRotationEl,
    showArrowEl, arrowValEl, arrowValSliderEl, arrowValCustomEl, arrowLabelEl, arrowPlacementEl,
    colorArrowEl, arrowLengthEl, arrowThicknessEl, arrowHeadSizeEl, arrowOffsetEl,
    rulerStyleEl, rulerHeightEl, rulerPlacementEl,
    showVectorEl, vectorValAEl, vectorValASliderEl, vectorValACustomEl,
    vectorValBEl, vectorValBSliderEl, vectorValBCustomEl,
    vectorLabelEl, vectorStyleEl, vectorHeightEl, vectorThicknessEl,
    colorVectorEl
  ];
  
  autoInputs.forEach(input => {
    input.addEventListener('input', updateRender);
    input.addEventListener('change', pushHistoryState);
  });

  // --- INITIALIZATION ON STARTUP ---
  const hasLoadedSavedMemory = loadStateFromLocalStorage();
  
  if (!hasLoadedSavedMemory) {
    // Manually force initial load configuration defaults
    isUpdatingFromPreset = true;
    startValEl.value = 100;
    endValEl.value = 900;
    stepValEl.value = 100;
    leftExtEl.value = 50;
    rightExtEl.value = 50;
    axisYEl.value = 100;
    labelFrequencyEl.value = 'all';
    minorSubdivisionsEl.value = '1';
    
    lineWidthEl.value = 2;
    tickHeightEl.value = 20;
    tickWidthEl.value = 1.5;
    arrowTypeEl.value = 'right';
    tickAlignmentEl.value = 'centered';
    
    colorLineEl.value = '#1A1A1A';
    colorLineTextEl.value = '#1A1A1A';
    
    fontFamilyEl.value = 'system-ui, sans-serif';
    customFontWrapper.style.display = 'none';
    persianNumbersEl.checked = false;
    fontSizeEl.value = 22;
    fontWeightEl.value = '400';
    fontStyleItalicEl.checked = false;
    letterSpacingEl.value = 1;
    labelOffsetEl.value = 25;
    labelPrefixEl.value = '';
    labelSuffixEl.value = '';
    
    colorTextEl.value = '#1A1A1A';
    colorTextTextEl.value = '#1A1A1A';
    
    labelModeEl.value = 'auto';
    customLabelsInputEl.value = '0, 1/4, 1/2, 3/4, 1';
    labelRotationEl.value = 0;

    // Default pointing arrow properties
    showArrowEl.checked = false;
    arrowValEl.value = 500;
    arrowValSliderEl.value = 500;
    arrowValCustomEl.value = 0;
    arrowLabelEl.value = 'x';
    arrowPlacementEl.value = 'above';
    colorArrowEl.value = '#EF4444';
    colorArrowTextEl.value = '#EF4444';
    arrowLengthEl.value = 28;
    arrowThicknessEl.value = 2.5;
    arrowHeadSizeEl.value = 7;
    arrowOffsetEl.value = 5;

    // Default ruler properties
    rulerStyleEl.value = 'none';
    rulerHeightEl.value = 60;
    rulerPlacementEl.value = 'center';

    // Default vector properties
    showVectorEl.checked = false;
    vectorValAEl.value = 200;
    vectorValASliderEl.value = 200;
    vectorValACustomEl.value = 0;
    vectorValBEl.value = 700;
    vectorValBSliderEl.value = 700;
    vectorValBCustomEl.value = 1;
    vectorLabelEl.value = '+5';
    vectorStyleEl.value = 'arc';
    vectorHeightEl.value = 30;
    vectorThicknessEl.value = 2.5;
    colorVectorEl.value = '#3B82F6';
    colorVectorTextEl.value = '#3B82F6';
    
    toggleArrowControlsVisibility();
    toggleArrowModeWrapper();
    toggleRulerControlsVisibility();
    toggleVectorControlsVisibility();
    toggleVectorModeWrapper();
    toggleLabelModeVisibility();
    
    isUpdatingFromPreset = false;
    updateRender();
  }
  
  historyStack.push(JSON.stringify(getCurrentStatePayload()));
  historyPointer = 0;
  updateHistoryButtons();
  
  loadCustomPresetsList();

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


});
