document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let activeIndex = 0;
  let batchList = [];
  let state = {
    batch_count: 12,
    export_size: "1024x1024"
  };

  // Zoom & Pan viewport state
  let zoomScale = 1.0;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  // DOM Elements
  const canvas = document.getElementById('gradient-canvas');
  const ctx = canvas.getContext('2d');
  const previewContainer = document.getElementById('preview-container');
  const viewport = document.querySelector('.canvas-viewport');

  const inputBatchCount = document.getElementById('batch-count');
  const btnReRandom = document.getElementById('btn-re-random');
  const galleryGridList = document.getElementById('gallery-grid-list');

  // Editor elements
  const colorAPicker = document.getElementById('color-a-picker');
  const colorAText = document.getElementById('color-a-text');
  const colorBPicker = document.getElementById('color-b-picker');
  const colorBText = document.getElementById('color-b-text');
  const colorCPicker = document.getElementById('color-c-picker');
  const colorCText = document.getElementById('color-c-text');

  const inputLinearAngle = document.getElementById('linear-angle');
  const valLinearAngle = document.getElementById('linear-angle-lbl');

  const inputHl1X = document.getElementById('hl1-x');
  const valHl1X = document.getElementById('hl1-x-lbl');
  const inputHl1Y = document.getElementById('hl1-y');
  const valHl1Y = document.getElementById('hl1-y-lbl');
  
  const inputHl2X = document.getElementById('hl2-x');
  const valHl2X = document.getElementById('hl2-x-lbl');
  const inputHl2Y = document.getElementById('hl2-y');
  const valHl2Y = document.getElementById('hl2-y-lbl');

  const inputGrainOpacity = document.getElementById('grain-opacity');
  const valGrainOpacity = document.getElementById('grain-opacity-lbl');
  const inputVignetteOpacity = document.getElementById('vignette-opacity');
  const valVignetteOpacity = document.getElementById('vignette-opacity-lbl');

  const selectExportSize = document.getElementById('export-size');
  const btnExportPng = document.getElementById('btn-export-png');
  const btnQuickExport = document.getElementById('btn-quick-export');
  const btnReset = document.getElementById('btn-reset');
  const appToast = document.getElementById('app-toast');

  const hudGradientLbl = document.getElementById('hud-gradient-lbl');
  const hudParamsLbl = document.getElementById('hud-params-lbl');
  const hudZoomVal = document.getElementById('hud-zoom-val');

  // Zoom buttons
  const btnZoomIn = document.getElementById('zoom-in-btn');
  const btnZoomOut = document.getElementById('zoom-out-btn');
  const btnZoomReset = document.getElementById('zoom-reset-btn');
  const zoomDisplayText = document.getElementById('zoom-display-text');

  // Tab Buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.sidebar-tab-content');

  // --- PALETTE CONSTANTS ---
  const PALETTE = [
    [6, 12, 34],       // Deep navy
    [76, 44, 152],     // Purple
    [0, 164, 192],     // Teal
    [255, 64, 129],    // Pink
    [255, 153, 51],    // Orange
    [255, 215, 80],    // Warm yellow
    [92, 107, 192],    // Indigo
    [186, 104, 200],   // Lavender
    [120, 144, 156],   // Blue-grey
    [236, 64, 122],    // Magenta
    [22, 163, 74],     // Emerald Green
    [14, 116, 144]     // Cyan
  ];

  // Helper utility
  const randRange = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(randRange(min, max + 1));
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  function rgbToString(c) {
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  function rgbToHex(c) {
    const componentToHex = (x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + componentToHex(c[0]) + componentToHex(c[1]) + componentToHex(c[2]);
  }

  function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }

  // --- GRADIENT GENERATOR LOGIC ---
  function generateRandomGradient() {
    const c1 = PALETTE[randInt(0, PALETTE.length - 1)];
    const c2 = PALETTE[randInt(0, PALETTE.length - 1)];
    const c3 = PALETTE[randInt(0, PALETTE.length - 1)];
    
    return {
      colorA: rgbToHex(c1),
      colorB: rgbToHex(c2),
      colorC: rgbToHex(c3),
      angle: Math.round(randRange(0, 360)),
      hl1X: Math.round(randRange(10, 90)),
      hl1Y: Math.round(randRange(10, 90)),
      hl2X: Math.round(randRange(10, 90)),
      hl2Y: Math.round(randRange(10, 90)),
      grain: 4, // default 4%
      vignette: 25 // default 25%
    };
  }

  function generateBatch() {
    const count = parseInt(inputBatchCount.value, 10) || 12;
    state.batch_count = count;
    
    batchList = [];
    for (let i = 0; i < count; i++) {
      batchList.push(generateRandomGradient());
    }
    
    activeIndex = 0;
    renderGalleryList();
    loadActiveGradient();
  }

  function renderGalleryList() {
    galleryGridList.innerHTML = "";
    batchList.forEach((grad, index) => {
      const thumb = document.createElement('div');
      thumb.className = `gallery-thumb ${index === activeIndex ? 'active' : ''}`;
      thumb.dataset.index = index;
      
      // Approximate background preview using quick CSS gradient
      thumb.style.backgroundImage = `linear-gradient(${grad.angle}deg, ${grad.colorA} 0%, ${grad.colorB} 100%)`;
      
      const numLabel = document.createElement('div');
      numLabel.className = 'thumb-num';
      numLabel.textContent = `#${index + 1}`;
      
      thumb.appendChild(numLabel);
      
      thumb.addEventListener('click', () => {
        // Remove active class from old thumbnail
        const oldActive = galleryGridList.querySelector('.gallery-thumb.active');
        if (oldActive) oldActive.classList.remove('active');
        
        activeIndex = index;
        thumb.classList.add('active');
        loadActiveGradient();
      });
      
      galleryGridList.appendChild(thumb);
    });
  }

  function loadActiveGradient() {
    const grad = batchList[activeIndex];
    if (!grad) return;

    // Load colors
    colorAPicker.value = grad.colorA;
    colorAText.value = grad.colorA;
    colorBPicker.value = grad.colorB;
    colorBText.value = grad.colorB;
    colorCPicker.value = grad.colorC;
    colorCText.value = grad.colorC;

    // Load range parameters
    inputLinearAngle.value = grad.angle;
    valLinearAngle.textContent = `${grad.angle}°`;

    inputHl1X.value = grad.hl1X;
    valHl1X.textContent = `${grad.hl1X}%`;
    inputHl1Y.value = grad.hl1Y;
    valHl1Y.textContent = `${grad.hl1Y}%`;

    inputHl2X.value = grad.hl2X;
    valHl2X.textContent = `${grad.hl2X}%`;
    inputHl2Y.value = grad.hl2Y;
    valHl2Y.textContent = `${grad.hl2Y}%`;

    inputGrainOpacity.value = grad.grain;
    valGrainOpacity.textContent = `${grad.grain}%`;

    inputVignetteOpacity.value = grad.vignette;
    valVignetteOpacity.textContent = `${grad.vignette}%`;

    renderPreview();
  }

  // Save current range adjustments back to the active state index
  function saveCurrentToActive() {
    const grad = batchList[activeIndex];
    if (!grad) return;

    grad.colorA = colorAPicker.value;
    grad.colorB = colorBPicker.value;
    grad.colorC = colorCPicker.value;
    grad.angle = parseInt(inputLinearAngle.value, 10);
    grad.hl1X = parseInt(inputHl1X.value, 10);
    grad.hl1Y = parseInt(inputHl1Y.value, 10);
    grad.hl2X = parseInt(inputHl2X.value, 10);
    grad.hl2Y = parseInt(inputHl2Y.value, 10);
    grad.grain = parseInt(inputGrainOpacity.value, 10);
    grad.vignette = parseInt(inputVignetteOpacity.value, 10);

    // Update gallery thumbnail bg preview
    const thumbs = galleryGridList.querySelectorAll('.gallery-thumb');
    if (thumbs[activeIndex]) {
      thumbs[activeIndex].style.backgroundImage = `linear-gradient(${grad.angle}deg, ${grad.colorA} 0%, ${grad.colorB} 100%)`;
    }
  }

  // --- DRAWING CANVAS ENGINE ---
  function drawGradient(targetCanvas, scale = 1.0) {
    const targetCtx = targetCanvas.getContext('2d');
    const width = targetCanvas.width;
    const height = targetCanvas.height;
    
    targetCtx.clearRect(0, 0, width, height);

    const grad = batchList[activeIndex];
    if (!grad) return;

    const angleRad = (grad.angle * Math.PI) / 180;
    const rgbC = hexToRgb(grad.colorC);

    // 1. Draw linear gradient from Color A to Color B
    // Compute linear gradient vector inside canvas box
    const x0 = width / 2 - Math.cos(angleRad) * (width / 2);
    const y0 = height / 2 - Math.sin(angleRad) * (height / 2);
    const x1 = width / 2 + Math.cos(angleRad) * (width / 2);
    const y1 = height / 2 + Math.sin(angleRad) * (height / 2);

    const lg = targetCtx.createLinearGradient(x0, y0, x1, y1);
    lg.addColorStop(0, grad.colorA);
    lg.addColorStop(0.45, rgbToString(mixColors(hexToRgb(grad.colorA), hexToRgb(grad.colorB), 0.5)));
    lg.addColorStop(1, grad.colorB);

    targetCtx.fillStyle = lg;
    targetCtx.fillRect(0, 0, width, height);

    // 2. Layer Highlight 1 (Radial Gradient with Color C)
    const hl1X_px = (grad.hl1X / 100.0) * width;
    const hl1Y_px = (grad.hl1Y / 100.0) * height;
    const hl1Radius = Math.max(width, height) * 0.9;
    
    const rg1 = targetCtx.createRadialGradient(hl1X_px, hl1Y_px, 0, hl1X_px, hl1Y_px, hl1Radius);
    rg1.addColorStop(0, `rgba(${rgbC[0]}, ${rgbC[1]}, ${rgbC[2]}, 0.65)`);
    rg1.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
    
    targetCtx.fillStyle = rg1;
    targetCtx.fillRect(0, 0, width, height);

    // 3. Layer Highlight 2 (Radial Gradient with Soft White Highlight)
    const hl2X_px = (grad.hl2X / 100.0) * width;
    const hl2Y_px = (grad.hl2Y / 100.0) * height;
    const hl2Radius = Math.max(width, height) * 0.7;
    
    const rg2 = targetCtx.createRadialGradient(hl2X_px, hl2Y_px, 0, hl2X_px, hl2Y_px, hl2Radius);
    rg2.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    rg2.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
    
    targetCtx.fillStyle = rg2;
    targetCtx.fillRect(0, 0, width, height);

    // 4. Vignette Shadows
    if (grad.vignette > 0) {
      const cx = width / 2;
      const cy = height / 2;
      const rInner = Math.max(width, height) * 0.2;
      const rOuter = Math.max(width, height) * 0.85;
      
      const vg = targetCtx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
      const vignAlpha = grad.vignette / 100.0;
      vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vg.addColorStop(0.7, `rgba(0, 0, 0, ${vignAlpha * 0.48})`);
      vg.addColorStop(1, `rgba(0, 0, 0, ${vignAlpha})`);
      
      targetCtx.fillStyle = vg;
      targetCtx.fillRect(0, 0, width, height);
    }

    // 5. Pixel Noise Grain
    if (grad.grain > 0) {
      const img = targetCtx.getImageData(0, 0, width, height);
      const arr = img.data;
      const amp = grad.grain * 2.5; // Scale noise amplitude
      
      for (let i = 0; i < arr.length; i += 4) {
        const n = (Math.random() * 2 - 1) * amp;
        arr[i] = clamp(arr[i] + n, 0, 255);       // R
        arr[i + 1] = clamp(arr[i + 1] + n, 0, 255); // G
        arr[i + 2] = clamp(arr[i + 2] + n, 0, 255); // B
      }
      targetCtx.putImageData(img, 0, 0);
    }
  }

  function mixColors(rgb1, rgb2, t) {
    return [
      Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t),
      Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t),
      Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t)
    ];
  }

  function renderPreview() {
    drawGradient(canvas, 1.0);
    
    hudGradientLbl.textContent = `Active: Gradient #${activeIndex + 1}`;
    hudParamsLbl.textContent = `Angle: ${inputLinearAngle.value}°`;
  }

  // --- EXPORT PNG ---
  function exportPNG() {
    const sizeStr = selectExportSize.value || "1024x1024";
    const [w, h] = sizeStr.split('x').map(x => parseInt(x, 10));
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;
    
    drawGradient(exportCanvas, w / 400); // Scale factor based on baseline 400px
    
    const url = exportCanvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `soft_gradient_${activeIndex + 1}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    showToast("PNG Wallpaper exported!");
  }

  // --- PHOTOSHOP ZOOM & PAN VIEWPORT ENGINE ---
  function applyTransform() {
    previewContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    zoomDisplayText.textContent = `${Math.round(zoomScale * 100)}%`;
    hudZoomVal.textContent = `Zoom: ${Math.round(zoomScale * 100)}%`;
  }

  function centerCanvas() {
    const viewRect = viewport.getBoundingClientRect();
    const w = 400;
    const h = 400;
    zoomScale = Math.min(1.0, Math.min((viewRect.width - 40) / w, (viewRect.height - 40) / h));
    panX = (viewRect.width - w * zoomScale) / 2;
    panY = (viewRect.height - h * zoomScale) / 2;
    applyTransform();
  }

  function zoomCentered(factor) {
    const viewRect = viewport.getBoundingClientRect();
    const cX = viewRect.width / 2;
    const cY = viewRect.height / 2;
    
    const canvX = (cX - panX) / zoomScale;
    const canvY = (cY - panY) / zoomScale;
    
    zoomScale = Math.max(0.1, Math.min(8.0, zoomScale * factor));
    
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
    zoomScale = Math.max(0.1, Math.min(8.0, zoomScale * factor));
    
    panX = mX - canvX * zoomScale;
    panY = mY - canvY * zoomScale;
    
    applyTransform();
  });

  // --- CONNECT INPUT EVENTS ---
  function registerInputEvents() {
    // Generate Count
    inputBatchCount.addEventListener('change', () => {
      state.batch_count = parseInt(inputBatchCount.value, 10) || 12;
    });

    btnReRandom.addEventListener('click', () => {
      generateBatch();
      showToast("Generated new random gradients!");
    });

    // Color Pickers sync
    const connectColor = (picker, text) => {
      picker.addEventListener('input', () => {
        text.value = picker.value;
        saveCurrentToActive();
        renderPreview();
      });
      text.addEventListener('input', () => {
        const val = text.value.trim();
        if (val.startsWith('#') && val.length === 7) {
          picker.value = val;
        }
        saveCurrentToActive();
        renderPreview();
      });
    };
    connectColor(colorAPicker, colorAText);
    connectColor(colorBPicker, colorBText);
    connectColor(colorCPicker, colorCText);

    // Range Inputs
    const connectRange = (input, lbl, suffix = "") => {
      input.addEventListener('input', () => {
        lbl.textContent = `${input.value}${suffix}`;
        saveCurrentToActive();
        renderPreview();
      });
    };
    connectRange(inputLinearAngle, valLinearAngle, "°");
    connectRange(inputHl1X, valHl1X, "%");
    connectRange(inputHl1Y, valHl1Y, "%");
    connectRange(inputHl2X, valHl2X, "%");
    connectRange(inputHl2Y, valHl2Y, "%");
    connectRange(inputGrainOpacity, valGrainOpacity, "%");
    connectRange(inputVignetteOpacity, valVignetteOpacity, "%");

    // Export Size
    selectExportSize.addEventListener('change', () => {
      state.export_size = selectExportSize.value;
    });

    // Export Actions
    btnExportPng.addEventListener('click', exportPNG);
    btnQuickExport.addEventListener('click', exportPNG);

    // Zoom Buttons
    btnZoomIn.addEventListener('click', () => zoomCentered(1.2));
    btnZoomOut.addEventListener('click', () => zoomCentered(1 / 1.2));
    btnZoomReset.addEventListener('click', centerCanvas);

    // Reset button (loads defaults to active index)
    btnReset.addEventListener('click', () => {
      if (batchList[activeIndex]) {
        batchList[activeIndex] = {
          colorA: "#4f46e5",
          colorB: "#06b6d4",
          colorC: "#ff6b6b",
          angle: 135,
          hl1X: 50,
          hl1Y: 50,
          hl2X: 20,
          hl2Y: 80,
          grain: 4,
          vignette: 25
        };
        loadActiveGradient();
        showToast("Reset active gradient parameters");
      }
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
  registerInputEvents();
  generateBatch();
});
