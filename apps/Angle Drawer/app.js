document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let state = {
    deg: 135.0,
    stroke_px: 12,
    arc_px: 9,
    arc_radius_ratio: 0.22,
    hand_drawn: false,
    show_label: false,
    show_checkerboard: true,
    stroke_color: "#0f0f10",
    export_size: "1600x900"
  };

  // Zoom & Pan viewport state
  let zoomScale = 1.0;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  // DOM Elements
  const canvas = document.getElementById('angle-canvas');
  const ctx = canvas.getContext('2d');
  const previewContainer = document.getElementById('preview-container');
  const viewport = document.querySelector('.canvas-viewport');

  const inputAngleDeg = document.getElementById('angle-degrees');
  const valAngleDeg = document.getElementById('angle-degrees-lbl');
  const inputAngleText = document.getElementById('angle-text');
  
  const inputStrokeWidth = document.getElementById('stroke-width');
  const valStrokeWidth = document.getElementById('stroke-width-lbl');
  const inputArcThickness = document.getElementById('arc-thickness');
  const valArcThickness = document.getElementById('arc-thickness-lbl');
  const inputArcRadius = document.getElementById('arc-radius');
  const valArcRadius = document.getElementById('arc-radius-lbl');

  const inputHandDrawn = document.getElementById('hand-drawn');
  const inputShowLabel = document.getElementById('show-label');
  const inputShowCheckerboard = document.getElementById('show-checkerboard');
  const colorStrokePicker = document.getElementById('stroke-color-picker');
  const colorStrokeText = document.getElementById('stroke-color-text');

  const selectExportSize = document.getElementById('export-size');
  const btnExportPng = document.getElementById('btn-export-png');
  const btnQuickExport = document.getElementById('btn-quick-export');
  const btnReset = document.getElementById('btn-reset');
  const appToast = document.getElementById('app-toast');

  const hudDegVal = document.getElementById('hud-deg-val');
  const hudStyleVal = document.getElementById('hud-style-val');
  const hudZoomVal = document.getElementById('hud-zoom-val');

  // Zoom buttons
  const btnZoomIn = document.getElementById('zoom-in-btn');
  const btnZoomOut = document.getElementById('zoom-out-btn');
  const btnZoomReset = document.getElementById('zoom-reset-btn');
  const zoomDisplayText = document.getElementById('zoom-display-text');

  // Tab Buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.sidebar-tab-content');

  // --- GEOMETRY TRANSFORMATION ---
  function geometryTransform(width, height, pad = 24.0) {
    // Normalize degree to range [0, 360)
    const normDeg = (state.deg % 360 + 360) % 360;
    const theta = normDeg * Math.PI / 180;
    const L = 1.0;
    const r = state.arc_radius_ratio * L;
    
    const Ox = 0, Oy = 0;
    const Bx = L, By = 0;
    const Rx = L * Math.cos(theta), Ry = -L * Math.sin(theta);
    
    // Bounds of shapes
    const minx = Math.min(Ox, Bx, Rx, -r);
    const maxx = Math.max(Ox, Bx, Rx,  r);
    const miny = Math.min(Oy, By, Ry, -r);
    const maxy = Math.max(Oy, By, Ry,  r);
    
    const bbox_w = maxx - minx;
    const bbox_h = maxy - miny;
    
    const avail_w = Math.max(1.0, width - 2 * pad);
    const avail_h = Math.max(1.0, height - 2 * pad);
    
    const scale = 0.95 * Math.min(avail_w / bbox_w, avail_h / bbox_h);
    
    const bbox_cx = (minx + maxx) * 0.5;
    const bbox_cy = (miny + maxy) * 0.5;
    
    const target_cx = width / 2;
    const target_cy = height / 2;
    
    const tx = target_cx - scale * bbox_cx;
    const ty = target_cy - scale * bbox_cy;
    
    return { scale, tx, ty, r: r * scale, theta };
  }

  // --- HAND-DRAWN SKETCHY DRAW helper ---
  function drawJitteryLine(targetCtx, x1, y1, x2, y2, strokeW, color, isHandDrawn) {
    if (isHandDrawn) {
      for (let i = 0; i < 3; i++) {
        targetCtx.save();
        targetCtx.strokeStyle = color;
        const w = strokeW * (0.8 + 0.15 * Math.random());
        targetCtx.lineWidth = w;
        targetCtx.globalAlpha = i === 0 ? 1.0 : 0.7;
        targetCtx.lineCap = 'round';
        targetCtx.lineJoin = 'round';
        
        // Midpoint offset jitter
        const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * strokeW * 0.5;
        const my = (y1 + y2) / 2 + (Math.random() - 0.5) * strokeW * 0.5;
        
        targetCtx.beginPath();
        targetCtx.moveTo(x1, y1);
        targetCtx.quadraticCurveTo(mx, my, x2, y2);
        targetCtx.stroke();
        targetCtx.restore();
      }
    } else {
      targetCtx.save();
      targetCtx.strokeStyle = color;
      targetCtx.lineWidth = strokeW;
      targetCtx.lineCap = 'round';
      targetCtx.lineJoin = 'round';
      targetCtx.beginPath();
      targetCtx.moveTo(x1, y1);
      targetCtx.lineTo(x2, y2);
      targetCtx.stroke();
      targetCtx.restore();
    }
  }

  function drawJitteryArc(targetCtx, cx, cy, r, startAngle, endAngle, strokeW, color, isHandDrawn) {
    // Semicircle arc draw
    if (isHandDrawn) {
      for (let i = 0; i < 3; i++) {
        targetCtx.save();
        targetCtx.strokeStyle = color;
        const w = strokeW * (0.8 + 0.15 * Math.random());
        targetCtx.lineWidth = w;
        targetCtx.globalAlpha = i === 0 ? 1.0 : 0.7;
        targetCtx.lineCap = 'round';
        
        const jitterR = r + (Math.random() - 0.5) * strokeW * 0.3;
        targetCtx.beginPath();
        targetCtx.arc(cx, cy, jitterR, startAngle, endAngle, true);
        targetCtx.stroke();
        targetCtx.restore();
      }
    } else {
      targetCtx.save();
      targetCtx.strokeStyle = color;
      targetCtx.lineWidth = strokeW;
      targetCtx.lineCap = 'round';
      targetCtx.beginPath();
      targetCtx.arc(cx, cy, r, startAngle, endAngle, true);
      targetCtx.stroke();
      targetCtx.restore();
    }
  }

  // --- DRAW ANGLE FUNCTION ---
  function drawAngle(targetCanvas, exportMode = false) {
    const targetCtx = targetCanvas.getContext('2d');
    const width = targetCanvas.width;
    const height = targetCanvas.height;
    
    // Clear
    targetCtx.clearRect(0, 0, width, height);
    
    // Background card (Only in preview)
    if (!exportMode) {
      targetCtx.save();
      targetCtx.fillStyle = 'rgba(250, 250, 250, 0.94)';
      targetCtx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      targetCtx.shadowBlur = 15;
      targetCtx.shadowOffsetY = 4;
      
      // Draw rounded card
      targetCtx.beginPath();
      const radius = 18;
      targetCtx.roundRect(18, 18, width - 36, height - 36, radius);
      targetCtx.fill();
      targetCtx.restore();
    }
    
    // Geometry bounds calculation
    const pad = exportMode ? 40.0 : 42.0;
    const { scale, tx, ty, r, theta } = geometryTransform(width, height, pad);
    
    // Transform coordinates
    const Ox = tx;
    const Oy = ty;
    const Bx = tx + scale * 1.0;
    const By = ty;
    const Rx = tx + scale * Math.cos(theta);
    const Ry = ty - scale * Math.sin(theta);
    
    const strokeColor = state.stroke_color;
    
    // Draw lines
    drawJitteryLine(targetCtx, Ox, Oy, Bx, By, state.stroke_px, strokeColor, state.hand_drawn);
    drawJitteryLine(targetCtx, Ox, Oy, Rx, Ry, state.stroke_px, strokeColor, state.hand_drawn);
    
    // Draw arc
    drawJitteryArc(targetCtx, Ox, Oy, r, 0, -theta, state.arc_px, strokeColor, state.hand_drawn);
    
    // Center point anchor circle
    targetCtx.save();
    targetCtx.fillStyle = strokeColor;
    targetCtx.beginPath();
    const anchorR = Math.max(2.0, state.stroke_px * 0.35);
    targetCtx.arc(Ox, Oy, anchorR, 0, 2 * Math.PI);
    targetCtx.fill();
    targetCtx.restore();
    
    // Show degree label
    if (state.show_label) {
      const mid = -theta / 2.0;
      const labelRadius = r * 1.25;
      const lx = Ox + labelRadius * Math.cos(mid);
      const ly = Oy + labelRadius * Math.sin(mid); // Canvas y is inverted in trigonometry representation
      
      targetCtx.save();
      targetCtx.fillStyle = strokeColor;
      targetCtx.font = '600 18px "Outfit", sans-serif';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      targetCtx.fillText(`${state.deg.toFixed(1)}°`, lx, ly);
      targetCtx.restore();
    }
  }

  function renderPreview() {
    drawAngle(canvas, false);
    hudDegVal.textContent = `Angle: ${state.deg.toFixed(1)}°`;
    hudStyleVal.textContent = state.hand_drawn ? "Style: Sketchy" : "Style: Standard";
  }

  // --- EXPORT PNG ---
  function exportPNG() {
    const sizeStr = state.export_size || "1600x900";
    const [w, h] = sizeStr.split('x').map(x => parseInt(x, 10));
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;
    
    drawAngle(exportCanvas, true);
    
    const url = exportCanvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `angle_${state.deg.toFixed(1)}deg.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    showToast("Transparent PNG file exported!");
  }

  // --- PHOTOSHOP ZOOM & PAN VIEWPORT ENGINE ---
  function applyTransform() {
    previewContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    zoomDisplayText.textContent = `${Math.round(zoomScale * 100)}%`;
    hudZoomVal.textContent = `Zoom: ${Math.round(zoomScale * 100)}%`;
  }

  function centerCanvas() {
    const viewRect = viewport.getBoundingClientRect();
    const w = 720;
    const h = 420;
    zoomScale = 1.0;
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
    // Angle Sliders & text inputs
    inputAngleDeg.addEventListener('input', () => {
      const val = parseFloat(inputAngleDeg.value) || 0;
      state.deg = val;
      valAngleDeg.textContent = `${val.toFixed(1)}°`;
      inputAngleText.value = val;
      renderPreview();
    });

    inputAngleText.addEventListener('input', () => {
      const val = parseFloat(inputAngleText.value) || 0;
      state.deg = val;
      valAngleDeg.textContent = `${val.toFixed(1)}°`;
      inputAngleDeg.value = val;
      renderPreview();
    });

    // Quick snaps
    document.querySelectorAll('.snap-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.getAttribute('data-val'));
        state.deg = val;
        valAngleDeg.textContent = `${val.toFixed(1)}°`;
        inputAngleDeg.value = val;
        inputAngleText.value = val;
        renderPreview();
      });
    });

    // Style adjustments
    inputStrokeWidth.addEventListener('input', () => {
      const val = parseInt(inputStrokeWidth.value, 10);
      state.stroke_px = val;
      valStrokeWidth.textContent = `${val}px`;
      renderPreview();
    });

    inputArcThickness.addEventListener('input', () => {
      const val = parseInt(inputArcThickness.value, 10);
      state.arc_px = val;
      valArcThickness.textContent = `${val}px`;
      renderPreview();
    });

    inputArcRadius.addEventListener('input', () => {
      const val = parseInt(inputArcRadius.value, 10);
      state.arc_radius_ratio = val / 100.0;
      valArcRadius.textContent = `${val}%`;
      renderPreview();
    });

    // Checkboxes
    inputHandDrawn.addEventListener('change', () => {
      state.hand_drawn = inputHandDrawn.checked;
      renderPreview();
    });

    inputShowLabel.addEventListener('change', () => {
      state.show_label = inputShowLabel.checked;
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

    // Color pickers
    const connectColor = (picker, text, prop) => {
      picker.addEventListener('input', () => {
        text.value = picker.value;
        state[prop] = picker.value;
        renderPreview();
      });
      text.addEventListener('input', () => {
        const val = text.value.trim();
        if (val.startsWith('#') && val.length === 7) {
          picker.value = val;
        }
        state[prop] = val;
        renderPreview();
      });
    };
    connectColor(colorStrokePicker, colorStrokeText, 'stroke_color');

    // Export Size
    selectExportSize.addEventListener('change', () => {
      state.export_size = selectExportSize.value;
    });

    btnExportPng.addEventListener('click', exportPNG);
    btnQuickExport.addEventListener('click', exportPNG);

    // Zoom Buttons
    btnZoomIn.addEventListener('click', () => zoomCentered(1.2));
    btnZoomOut.addEventListener('click', () => zoomCentered(1 / 1.2));
    btnZoomReset.addEventListener('click', centerCanvas);

    // Reset button
    btnReset.addEventListener('click', () => {
      state = {
        deg: 135.0,
        stroke_px: 12,
        arc_px: 9,
        arc_radius_ratio: 0.22,
        hand_drawn: false,
        show_label: false,
        show_checkerboard: true,
        stroke_color: "#0f0f10",
        export_size: "1600x900"
      };

      inputAngleDeg.value = state.deg;
      valAngleDeg.textContent = `${state.deg.toFixed(1)}°`;
      inputAngleText.value = state.deg;
      
      inputStrokeWidth.value = state.stroke_px;
      valStrokeWidth.textContent = `${state.stroke_px}px`;
      inputArcThickness.value = state.arc_px;
      valArcThickness.textContent = `${state.arc_px}px`;
      inputArcRadius.value = Math.round(state.arc_radius_ratio * 100);
      valArcRadius.textContent = `${Math.round(state.arc_radius_ratio * 100)}%`;

      inputHandDrawn.checked = state.hand_drawn;
      inputShowLabel.checked = state.show_label;
      inputShowCheckerboard.checked = state.show_checkerboard;
      colorStrokePicker.value = state.stroke_color;
      colorStrokeText.value = state.stroke_color;

      previewContainer.classList.add('show-checkerboard');
      renderPreview();
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

  // Initial Run
  registerInputEvents();
  renderPreview();

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

});
