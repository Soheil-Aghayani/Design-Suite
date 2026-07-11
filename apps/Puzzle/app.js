document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let state = {
    rows: 5,
    cols: 8,
    units: "px",
    pw: 120,
    ph: 120,
    dpi: 300,
    tab_style: "round",
    tab_pattern: "alternating",
    tab_ratio: 0.20,
    tab_jitter: 0,
    page_margin: 20,
    seam_th: 1.4,
    frame_th: 1.8,
    draw_frame: true,
    show_checkerboard: true,
    imageSrc: null,
    
    // Stable random matrices populated on init
    hDirections: [],
    vDirections: [],
    hJitters: [],
    vJitters: []
  };

  // Zoom & Pan viewport state
  let zoomScale = 1.0;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  // DOM Elements
  const previewContainer = document.getElementById('preview-container');
  const viewport = document.querySelector('.canvas-viewport');

  const inputRows = document.getElementById('puzzle-rows');
  const inputCols = document.getElementById('puzzle-cols');
  const selectUnits = document.getElementById('puzzle-units');
  const inputPieceWidth = document.getElementById('piece-width');
  const labelPieceWidth = document.getElementById('label-piece-width');
  const inputPieceHeight = document.getElementById('piece-height');
  const labelPieceHeight = document.getElementById('label-piece-height');
  const dpiWrapper = document.getElementById('dpi-wrapper');
  const inputDpi = document.getElementById('puzzle-dpi');

  const selectTabStyle = document.getElementById('tab-style-select');
  const selectTabPattern = document.getElementById('tab-pattern-select');
  const btnReshuffleTabs = document.getElementById('btn-reshuffle-tabs');
  const inputTabRatio = document.getElementById('tab-ratio');
  const valTabRatio = document.getElementById('tab-ratio-lbl');
  const inputTabJitter = document.getElementById('tab-jitter');
  const valTabJitter = document.getElementById('tab-jitter-lbl');

  const inputPageMargin = document.getElementById('page-margin');
  const valPageMargin = document.getElementById('page-margin-lbl');
  const inputSeamThickness = document.getElementById('seam-thickness');
  const valSeamThickness = document.getElementById('seam-thickness-lbl');
  const inputFrameThickness = document.getElementById('frame-thickness');
  const valFrameThickness = document.getElementById('frame-thickness-lbl');

  const inputDrawFrame = document.getElementById('draw-frame');
  const inputShowCheckerboard = document.getElementById('show-checkerboard');

  const inputImgUpload = document.getElementById('puzzle-img-upload');
  const btnClearImg = document.getElementById('btn-clear-img');

  const btnExportSvg = document.getElementById('btn-export-svg');
  const btnExportPng = document.getElementById('btn-export-png');
  const btnQuickExport = document.getElementById('btn-quick-export');
  const btnQuickCopy = document.getElementById('btn-quick-copy');
  const btnReset = document.getElementById('btn-reset');
  const appToast = document.getElementById('app-toast');

  const hudDimsVal = document.getElementById('hud-dims-val');
  const hudPiecesVal = document.getElementById('hud-pieces-val');
  const hudZoomVal = document.getElementById('hud-zoom-val');

  // Zoom buttons
  const btnZoomIn = document.getElementById('zoom-in-btn');
  const btnZoomOut = document.getElementById('zoom-out-btn');
  const btnZoomReset = document.getElementById('zoom-reset-btn');
  const zoomDisplayText = document.getElementById('zoom-display-text');

  // Tab Buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.sidebar-tab-content');

  // --- INITIALIZE STABLE RANDOM MATRICES ---
  function initializeRandomMatrices() {
    const size = 150 * 150; // Safety bounds
    state.hDirections = [];
    state.vDirections = [];
    state.hJitters = [];
    state.vJitters = [];
    for (let i = 0; i < size; i++) {
      state.hDirections.push(Math.random() > 0.5 ? 1 : -1);
      state.vDirections.push(Math.random() > 0.5 ? 1 : -1);
      state.hJitters.push(Math.random() * 2.0 - 1.0); // Range [-1.0, 1.0]
      state.vJitters.push(Math.random() * 2.0 - 1.0);
    }
  }

  // --- UNIT CONVERSIONS ---
  function getSizesPx() {
    let pw = state.pw;
    let ph = state.ph;
    let margin = state.page_margin;
    let seam = state.seam_th;
    let frame = state.frame_th;
    
    if (state.units === 'mm') {
      const dpi = state.dpi;
      pw = (state.pw * dpi) / 25.4;
      ph = (state.ph * dpi) / 25.4;
      margin = (state.page_margin * dpi) / 25.4;
    }
    return { pw, ph, margin, seam, frame };
  }

  // --- SEAM CALCULATORS ---
  function getHSeamPath(left, right, y, r, direction, style, xm) {
    if (style === 'square') {
      const h = r * direction;
      return `M ${left.toFixed(2)} ${y.toFixed(2)} L ${(xm - r).toFixed(2)} ${y.toFixed(2)} L ${(xm - r/2).toFixed(2)} ${(y + h).toFixed(2)} L ${(xm + r/2).toFixed(2)} ${(y + h).toFixed(2)} L ${(xm + r).toFixed(2)} ${y.toFixed(2)} L ${right.toFixed(2)} ${y.toFixed(2)}`;
    } else if (style === 'triangle') {
      const h = r * direction;
      // Dovetail shape
      return `M ${left.toFixed(2)} ${y.toFixed(2)} L ${(xm - r/2).toFixed(2)} ${y.toFixed(2)} L ${(xm - r).toFixed(2)} ${(y + h).toFixed(2)} L ${(xm + r).toFixed(2)} ${(y + h).toFixed(2)} L ${(xm + r/2).toFixed(2)} ${y.toFixed(2)} L ${right.toFixed(2)} ${y.toFixed(2)}`;
    } else { // round
      const sweepFlag = direction > 0 ? 0 : 1;
      return `M ${left.toFixed(2)} ${y.toFixed(2)} L ${(xm - r).toFixed(2)} ${y.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 ${sweepFlag} ${(xm + r).toFixed(2)} ${y.toFixed(2)} L ${right.toFixed(2)} ${y.toFixed(2)}`;
    }
  }

  function getVSeamPath(x, top, bottom, r, direction, style, ym) {
    if (style === 'square') {
      const w = r * direction;
      return `M ${x.toFixed(2)} ${top.toFixed(2)} L ${x.toFixed(2)} ${(ym - r).toFixed(2)} L ${(x + w).toFixed(2)} ${(ym - r/2).toFixed(2)} L ${(x + w).toFixed(2)} ${(ym + r/2).toFixed(2)} L ${x.toFixed(2)} ${(ym + r).toFixed(2)} L ${x.toFixed(2)} ${bottom.toFixed(2)}`;
    } else if (style === 'triangle') {
      const w = r * direction;
      // Dovetail shape
      return `M ${x.toFixed(2)} ${top.toFixed(2)} L ${x.toFixed(2)} ${(ym - r/2).toFixed(2)} L ${(x + w).toFixed(2)} ${(ym - r).toFixed(2)} L ${(x + w).toFixed(2)} ${(ym + r).toFixed(2)} L ${x.toFixed(2)} ${(ym + r/2).toFixed(2)} L ${x.toFixed(2)} ${bottom.toFixed(2)}`;
    } else { // round
      const sweepFlag = direction > 0 ? 0 : 1;
      return `M ${x.toFixed(2)} ${top.toFixed(2)} L ${x.toFixed(2)} ${(ym - r).toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 ${sweepFlag} ${x.toFixed(2)} ${(ym + r).toFixed(2)} L ${x.toFixed(2)} ${bottom.toFixed(2)}`;
    }
  }

  // --- GENERATE PUZZLE OUTLINE ---
  function buildPuzzleSVG() {
    const { pw, ph, margin, seam, frame } = getSizesPx();
    const rows = state.rows;
    const cols = state.cols;
    const tab_r = Math.min(pw, ph) * state.tab_ratio;
    
    const puzzle_w = cols * pw;
    const puzzle_h = rows * ph;
    const px0 = margin;
    const py0 = margin;
    
    const total_w = puzzle_w + 2 * margin;
    const total_h = puzzle_h + 2 * margin;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${total_w.toFixed(1)}" height="${total_h.toFixed(1)}" viewBox="0 0 ${total_w.toFixed(1)} ${total_h.toFixed(1)}" style="background-color: transparent;">\n`;
    
    // 1. Output Background Photo Layer if loaded
    if (state.imageSrc) {
      svg += `  <defs>
    <clipPath id="puzzle-clip">
      <rect x="${px0.toFixed(2)}" y="${py0.toFixed(2)}" width="${puzzle_w.toFixed(2)}" height="${puzzle_h.toFixed(2)}" rx="4" />
    </clipPath>
  </defs>
  <image href="${state.imageSrc}" x="${px0.toFixed(2)}" y="${py0.toFixed(2)}" width="${puzzle_w.toFixed(2)}" height="${puzzle_h.toFixed(2)}" preserveAspectRatio="none" clip-path="url(#puzzle-clip)" />\n`;
    }

    // 2. Build Internal Seams Paths
    let seamsD = "";
    
    // Internal horizontal seams
    for (let r = 1; r < rows; r++) {
      const y = py0 + r * ph;
      for (let c = 0; c < cols; c++) {
        const x0 = px0 + c * pw;
        const x1 = x0 + pw;
        
        const idx = r * cols + c;
        let direction = 1;
        if (state.tab_pattern === 'alternating') {
          direction = ((c % 2 === 0) ? 1 : -1);
        } else if (state.tab_pattern === 'random') {
          direction = state.hDirections[idx] || 1;
        }
        
        // Jitter offsets
        const jitterOffsetVal = (state.hJitters[idx] || 0) * (state.tab_jitter / 100.0) * pw * 0.4;
        const xm = (x0 + x1) / 2.0 + jitterOffsetVal;

        seamsD += getHSeamPath(x0, x1, y, tab_r, direction, state.tab_style, xm) + " ";
      }
    }
    
    // Internal vertical seams
    for (let c = 1; c < cols; c++) {
      const x = px0 + c * pw;
      for (let r = 0; r < rows; r++) {
        const y0 = py0 + r * ph;
        const y1 = y0 + ph;
        
        const idx = r * cols + c;
        let direction = 1;
        if (state.tab_pattern === 'alternating') {
          direction = ((r % 2 === 0) ? 1 : -1);
        } else if (state.tab_pattern === 'random') {
          direction = state.vDirections[idx] || 1;
        }

        // Jitter offsets
        const jitterOffsetVal = (state.vJitters[idx] || 0) * (state.tab_jitter / 100.0) * ph * 0.4;
        const ym = (y0 + y1) / 2.0 + jitterOffsetVal;

        seamsD += getVSeamPath(x, y0, y1, tab_r, direction, state.tab_style, ym) + " ";
      }
    }
    
    // Output seams path
    svg += `  <path d="${seamsD.trim()}" fill="none" stroke="#000000" stroke-width="${seam}" stroke-linecap="round" stroke-linejoin="round" />\n`;
    
    // 3. Output outer border frame rect
    if (state.draw_frame) {
      svg += `  <rect x="${px0.toFixed(2)}" y="${py0.toFixed(2)}" width="${puzzle_w.toFixed(2)}" height="${puzzle_h.toFixed(2)}" fill="none" stroke="#000000" stroke-width="${frame}" stroke-linecap="round" stroke-linejoin="round" />\n`;
    }
    
    svg += `</svg>`;
    return { svg, total_w, total_h, puzzle_w, puzzle_h, tab_r };
  }

  function renderPreview() {
    const { svg, total_w, total_h } = buildPuzzleSVG();
    previewContainer.innerHTML = svg;
    
    // Set actual preview container bounds
    previewContainer.style.width = `${total_w}px`;
    previewContainer.style.height = `${total_h}px`;
    
    // Update HUD
    hudDimsVal.textContent = `Canvas: ${Math.round(total_w)} × ${Math.round(total_h)} px`;
    hudPiecesVal.textContent = `Pieces: ${state.rows * state.cols} (${state.rows} × ${state.cols})`;
  }

  // --- EXPORT VECTOR SVG & PNG ---
  function exportSVG() {
    const { svg } = buildPuzzleSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `puzzle_${state.rows}x${state.cols}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    showToast("SVG outline file saved!");
  }

  function exportPNG() {
    const { svg, total_w, total_h } = buildPuzzleSVG();
    
    const img = new Image();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = total_w;
      canvas.height = total_h;
      const ctx = canvas.getContext('2d');
      
      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, total_w, total_h);
      
      ctx.drawImage(img, 0, 0, total_w, total_h);
      
      canvas.toBlob((pngBlob) => {
        const pngUrl = URL.createObjectURL(pngBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `puzzle_${state.rows}x${state.cols}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(pngUrl);
        showToast("PNG jigsaw saved!");
      }, 'image/png');
      
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      showToast("PNG export failed!");
    };
    img.src = url;
  }

  function copySVGToClipboard() {
    const { svg } = buildPuzzleSVG();
    navigator.clipboard.writeText(svg).then(() => {
      showToast("SVG Code copied to Clipboard!");
    }).catch(() => {
      showToast("Clipboard copy failed!");
    });
  }

  // --- PHOTOSHOP ZOOM & PAN VIEWPORT ENGINE ---
  function applyTransform() {
    previewContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    zoomDisplayText.textContent = `${Math.round(zoomScale * 100)}%`;
    hudZoomVal.textContent = `Zoom: ${Math.round(zoomScale * 100)}%`;
  }

  function centerCanvas() {
    const viewRect = viewport.getBoundingClientRect();
    const { total_w, total_h } = buildPuzzleSVG();
    
    zoomScale = Math.min(1.0, Math.min(viewRect.width / (total_w + 40), viewRect.height / (total_h + 40)));
    panX = (viewRect.width - total_w * zoomScale) / 2;
    panY = (viewRect.height - total_h * zoomScale) / 2;
    applyTransform();
  }

  function zoomCentered(factor) {
    const viewRect = viewport.getBoundingClientRect();
    const cX = viewRect.width / 2;
    const cY = viewRect.height / 2;
    
    const canvX = (cX - panX) / zoomScale;
    const canvY = (cY - panY) / zoomScale;
    
    zoomScale = Math.max(0.05, Math.min(8.0, zoomScale * factor));
    
    panX = cX - canvX * zoomScale;
    panY = cY - canvY * zoomScale;
    
    applyTransform();
  }

  // Drag Panning Event Handlers
  viewport.addEventListener('mousedown', (e) => {
    if (e.button === 0 || e.button === 1) { // Left or Middle
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

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const viewRect = viewport.getBoundingClientRect();
    const mX = e.clientX - viewRect.left;
    const mY = e.clientY - viewRect.top;
    
    const canvX = (mX - panX) / zoomScale;
    const canvY = (mY - panY) / zoomScale;
    
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    zoomScale = Math.max(0.05, Math.min(8.0, zoomScale * factor));
    
    panX = mX - canvX * zoomScale;
    panY = mY - canvY * zoomScale;
    
    applyTransform();
  });

  // --- CONNECT INPUT EVENTS ---
  function registerInputEvents() {
    // Grid rows/cols
    inputRows.addEventListener('change', () => {
      state.rows = parseInt(inputRows.value, 10) || 5;
      renderPreview();
    });

    inputCols.addEventListener('change', () => {
      state.cols = parseInt(inputCols.value, 10) || 8;
      renderPreview();
    });

    // Measurement Units dropdown
    selectUnits.addEventListener('change', () => {
      state.units = selectUnits.value;
      if (state.units === 'mm') {
        dpiWrapper.style.display = 'flex';
        labelPieceWidth.textContent = "Piece Width (mm)";
        labelPieceHeight.textContent = "Piece Height (mm)";
      } else {
        dpiWrapper.style.display = 'none';
        labelPieceWidth.textContent = "Piece Width (px)";
        labelPieceHeight.textContent = "Piece Height (px)";
      }
      renderPreview();
    });

    inputPieceWidth.addEventListener('input', () => {
      state.pw = parseFloat(inputPieceWidth.value) || 120;
      renderPreview();
    });

    inputPieceHeight.addEventListener('input', () => {
      state.ph = parseFloat(inputPieceHeight.value) || 120;
      renderPreview();
    });

    inputDpi.addEventListener('input', () => {
      state.dpi = parseInt(inputDpi.value, 10) || 300;
      renderPreview();
    });

    // Tab Style & Pattern selectors
    selectTabStyle.addEventListener('change', () => {
      state.tab_style = selectTabStyle.value;
      renderPreview();
    });

    selectTabPattern.addEventListener('change', () => {
      state.tab_pattern = selectTabPattern.value;
      if (state.tab_pattern === 'random') {
        btnReshuffleTabs.style.display = 'block';
      } else {
        btnReshuffleTabs.style.display = 'none';
      }
      renderPreview();
    });

    btnReshuffleTabs.addEventListener('click', () => {
      initializeRandomMatrices();
      renderPreview();
      showToast("Directions reshuffled!");
    });

    // Ratios & Sliders
    inputTabRatio.addEventListener('input', () => {
      const val = parseInt(inputTabRatio.value, 10);
      state.tab_ratio = val / 100.0;
      valTabRatio.textContent = `${val}%`;
      renderPreview();
    });

    inputTabJitter.addEventListener('input', () => {
      const val = parseInt(inputTabJitter.value, 10);
      state.tab_jitter = val;
      valTabJitter.textContent = `${val}%`;
      renderPreview();
    });

    inputPageMargin.addEventListener('input', () => {
      const val = parseInt(inputPageMargin.value, 10);
      state.page_margin = val;
      valPageMargin.textContent = `${val}px`;
      renderPreview();
      centerCanvas(); // Recenter as margin changes bounding box
    });

    inputSeamThickness.addEventListener('input', () => {
      const val = parseInt(inputSeamThickness.value, 10) / 10.0;
      state.seam_th = val;
      valSeamThickness.textContent = `${val.toFixed(1)}px`;
      renderPreview();
    });

    inputFrameThickness.addEventListener('input', () => {
      const val = parseInt(inputFrameThickness.value, 10) / 10.0;
      state.frame_th = val;
      valFrameThickness.textContent = `${val.toFixed(1)}px`;
      renderPreview();
    });

    // Image Upload Handler
    inputImgUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        state.imageSrc = event.target.result;
        btnClearImg.style.display = 'block';
        renderPreview();
        showToast("Background Photo Loaded!");
      };
      reader.readAsDataURL(file);
    });

    btnClearImg.addEventListener('click', () => {
      state.imageSrc = null;
      inputImgUpload.value = "";
      btnClearImg.style.display = 'none';
      renderPreview();
      showToast("Background Photo Cleared!");
    });

    // Viewport options
    inputDrawFrame.addEventListener('change', () => {
      state.draw_frame = inputDrawFrame.checked;
      renderPreview();
    });

    inputShowCheckerboard.addEventListener('change', () => {
      state.show_checkerboard = inputShowCheckerboard.checked;
      if (state.show_checkerboard) {
        previewContainer.classList.add('show-checkerboard');
      } else {
        previewContainer.classList.remove('show-checkerboard');
      }
    });

    // Action buttons
    btnExportSvg.addEventListener('click', exportSVG);
    btnExportPng.addEventListener('click', exportPNG);
    btnQuickExport.addEventListener('click', exportPNG);
    btnQuickCopy.addEventListener('click', copySVGToClipboard);

    // Zoom Buttons
    btnZoomIn.addEventListener('click', () => zoomCentered(1.2));
    btnZoomOut.addEventListener('click', () => zoomCentered(1 / 1.2));
    btnZoomReset.addEventListener('click', centerCanvas);

    // Reset button
    btnReset.addEventListener('click', () => {
      state = {
        rows: 5,
        cols: 8,
        units: "px",
        pw: 120,
        ph: 120,
        dpi: 300,
        tab_style: "round",
        tab_pattern: "alternating",
        tab_ratio: 0.20,
        tab_jitter: 0,
        page_margin: 20,
        seam_th: 1.4,
        frame_th: 1.8,
        draw_frame: true,
        show_checkerboard: true,
        imageSrc: null,
        hDirections: [],
        vDirections: [],
        hJitters: [],
        vJitters: []
      };

      initializeRandomMatrices();

      inputRows.value = state.rows;
      inputCols.value = state.cols;
      selectUnits.value = state.units;
      
      dpiWrapper.style.display = 'none';
      labelPieceWidth.textContent = "Piece Width (px)";
      labelPieceHeight.textContent = "Piece Height (px)";
      inputPieceWidth.value = state.pw;
      inputPieceHeight.value = state.ph;
      inputDpi.value = state.dpi;

      selectTabStyle.value = state.tab_style;
      selectTabPattern.value = state.tab_pattern;
      btnReshuffleTabs.style.display = 'none';

      inputTabRatio.value = Math.round(state.tab_ratio * 100);
      valTabRatio.textContent = `${Math.round(state.tab_ratio * 100)}%`;
      
      inputTabJitter.value = state.tab_jitter;
      valTabJitter.textContent = `${state.tab_jitter}%`;

      inputPageMargin.value = state.page_margin;
      valPageMargin.textContent = `${state.page_margin}px`;

      inputSeamThickness.value = Math.round(state.seam_th * 10);
      valSeamThickness.textContent = `${state.seam_th.toFixed(1)}px`;
      inputFrameThickness.value = Math.round(state.frame_th * 10);
      valFrameThickness.textContent = `${state.frame_th.toFixed(1)}px`;

      inputDrawFrame.checked = state.draw_frame;
      inputShowCheckerboard.checked = state.show_checkerboard;
      
      inputImgUpload.value = "";
      btnClearImg.style.display = 'none';

      previewContainer.classList.add('show-checkerboard');
      renderPreview();
      centerCanvas();
      showToast("Reset to defaults");
    });
  }

  // --- TAB NAVIGATION SWITCHER ---
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(targetTabId).classList.add('active');
    });
  });

  // Toast
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

  // ResizeObserver for Centering
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        centerCanvas();
      }
    }
  });
  resizeObserver.observe(viewport);

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

  // ── Nav pill: hub vs standalone ──
  const _isEmbedded = window.self !== window.top;
  const _btnNavHub = document.getElementById('btn-nav-hub');
  const _btnNavStandalone = document.getElementById('btn-nav-standalone');
  if (_isEmbedded) {
    if (_btnNavHub) {
      _btnNavHub.style.display = 'flex';
      _btnNavHub.addEventListener('click', () => {
        try {
          window.parent.postMessage({ action: 'hub_navigate', tool: 'home' }, '*');
        } catch (e) {
          window.parent.location.href = '../../index.html';
        }
      });
    }
    if (_btnNavStandalone) {
      _btnNavStandalone.style.display = 'flex';
      _btnNavStandalone.addEventListener('click', () => {
        window.open(window.location.href, '_blank');
      });
    }
  }

  // Initial Run
  initializeRandomMatrices();
  registerInputEvents();
  renderPreview();
});
