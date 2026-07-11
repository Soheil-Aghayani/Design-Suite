document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let state = {
    count: 10,
    shape: "circle",
    rot: 0,
    inner: 0,
    offset: 0,
    colorize: true,
    show_labels: true,
    show_checkerboard: true,
    colors: []
  };

  // Zoom & Pan viewport state
  let zoomScale = 1.0;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  // DOM Elements
  const canvas = document.getElementById('slicer-canvas');
  const ctx = canvas.getContext('2d');
  const previewContainer = document.getElementById('preview-container');
  const viewport = document.querySelector('.canvas-viewport');

  const inputCount = document.getElementById('slice-count');
  const valCount = document.getElementById('slice-count-lbl');
  const selectShape = document.getElementById('base-shape');
  
  const inputRot = document.getElementById('shape-rotation');
  const valRot = document.getElementById('shape-rotation-lbl');
  const inputInner = document.getElementById('inner-radius');
  const valInner = document.getElementById('inner-radius-lbl');
  const inputOffset = document.getElementById('explosion-offset');
  const valOffset = document.getElementById('explosion-offset-lbl');

  const inputColorize = document.getElementById('colorize');
  const inputShowLabels = document.getElementById('show-labels');
  const inputShowCheckerboard = document.getElementById('show-checkerboard');
  const btnRandomColors = document.getElementById('btn-random-colors');

  const btnExportPng = document.getElementById('btn-export-png');
  const btnQuickExport = document.getElementById('btn-quick-export');
  const btnReset = document.getElementById('btn-reset');
  const appToast = document.getElementById('app-toast');

  const hudSlicesVal = document.getElementById('hud-slices-val');
  const hudShapeVal = document.getElementById('hud-shape-val');
  const hudZoomVal = document.getElementById('hud-zoom-val');

  // Zoom buttons
  const btnZoomIn = document.getElementById('zoom-in-btn');
  const btnZoomOut = document.getElementById('zoom-out-btn');
  const btnZoomReset = document.getElementById('zoom-reset-btn');
  const zoomDisplayText = document.getElementById('zoom-display-text');

  // Tab Buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.sidebar-tab-content');

  // --- COLOR GENERATOR ---
  function randomizeColors() {
    const rc = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    state.colors = Array.from({ length: 100 }, rc);
  }

  // --- SHAPE DRAWING ---
  function drawSlices(targetCanvas, scale = 1.0) {
    const targetCtx = targetCanvas.getContext('2d');
    const width = targetCanvas.width;
    const height = targetCanvas.height;
    
    targetCtx.clearRect(0, 0, width, height);

    const c = parseInt(state.count) || 2;
    const rotRad = (state.rot * Math.PI) / 180;
    const innerRatio = state.inner / 100.0;
    const offsetDistance = state.offset * scale;
    
    const cx = width / 2;
    const cy = height / 2;
    const outerR = 240 * scale; // Radius of base circle representation
    const step = (2 * Math.PI) / c;

    // 1. Build Base Shape Path (Centered at 0, 0)
    const shapePath = new Path2D();
    const shape = state.shape;
    if (shape === 'circle') {
      shapePath.arc(0, 0, outerR, 0, Math.PI * 2);
      if (innerRatio > 0) {
        const innerR = outerR * innerRatio;
        shapePath.moveTo(innerR, 0);
        shapePath.arc(0, 0, innerR, 0, Math.PI * 2, true); // counterclockwise cutout
      }
    } else {
      const w = (shape === 'square' ? 420 : 510) * scale;
      const h = (shape === 'square' ? 420 : 300) * scale;
      if (shape === 'rectangle' || shape === 'square') {
        shapePath.rect(-w / 2, -h / 2, w, h);
        if (innerRatio > 0) {
          const iw = w * innerRatio;
          const ih = h * innerRatio;
          shapePath.moveTo(-iw / 2, -ih / 2);
          shapePath.lineTo(-iw / 2, ih / 2);
          shapePath.lineTo(iw / 2, ih / 2);
          shapePath.lineTo(iw / 2, -ih / 2);
          shapePath.closePath();
        }
      } else if (shape === 'triangle') {
        // Equilateral triangle
        shapePath.moveTo(0, -252 * scale);
        shapePath.lineTo(218 * scale, 126 * scale);
        shapePath.lineTo(-218 * scale, 126 * scale);
        shapePath.closePath();
        if (innerRatio > 0) {
          const it = innerRatio;
          shapePath.moveTo(0, -252 * scale * it);
          shapePath.lineTo(-218 * scale * it, 126 * scale * it);
          shapePath.lineTo(218 * scale * it, 126 * scale * it);
          shapePath.closePath();
        }
      }
    }

    // 2. Render each slice
    for (let i = 0; i < c; i++) {
      const sA = i * step - Math.PI / 2 + rotRad;
      const eA = (i + 1) * step - Math.PI / 2 + rotRad;
      const mA = sA + step / 2;
      
      const ox = Math.cos(mA) * offsetDistance;
      const oy = Math.sin(mA) * offsetDistance;
      const scx = cx + ox;
      const scy = cy + oy;

      // Define standard Wedge path for this slice
      const wedgePath = new Path2D();
      wedgePath.moveTo(0, 0);
      wedgePath.arc(0, 0, Math.max(width, height) * 2, sA, eA);
      wedgePath.closePath();

      targetCtx.save();
      targetCtx.translate(scx, scy);

      // Shared Stroke Styles (Dark thick cuts)
      targetCtx.lineWidth = Math.max(2, 5 * scale);
      targetCtx.strokeStyle = '#1c1c1e';
      targetCtx.lineJoin = 'round';
      targetCtx.lineCap = 'round';

      // Pass 1: Fill slices (Clipped by both Wedge and Base Shape)
      targetCtx.save();
      targetCtx.clip(wedgePath);
      if (shape !== 'circle') targetCtx.rotate(rotRad);
      targetCtx.clip(shapePath);
      targetCtx.fillStyle = state.colorize ? (state.colors[i % state.colors.length] || '#ffffff') : 'transparent';
      if (state.colorize) {
        targetCtx.fill(shapePath);
      } else {
        // Draw clean white/light grey fill if coloring is off
        targetCtx.fillStyle = '#ffffff';
        targetCtx.fill(shapePath);
      }
      targetCtx.restore();

      // Pass 2: Outer Border Stroke (Clipped by Wedge)
      targetCtx.save();
      targetCtx.clip(wedgePath);
      if (shape !== 'circle') targetCtx.rotate(rotRad);
      targetCtx.lineWidth = Math.max(4, 10 * scale); // double weight for clip clipping
      targetCtx.stroke(shapePath);
      targetCtx.restore();

      // Pass 3: Draw Cut Lines (Clipped by Shape)
      targetCtx.save();
      if (shape !== 'circle') targetCtx.rotate(rotRad);
      targetCtx.clip(shapePath);
      if (shape !== 'circle') targetCtx.rotate(-rotRad); // Return to world angles for spokes
      targetCtx.beginPath();
      targetCtx.moveTo(0, 0);
      targetCtx.lineTo(Math.max(width, height) * 2 * Math.cos(sA), Math.max(width, height) * 2 * Math.sin(sA));
      targetCtx.moveTo(0, 0);
      targetCtx.lineTo(Math.max(width, height) * 2 * Math.cos(eA), Math.max(width, height) * 2 * Math.sin(eA));
      targetCtx.stroke();
      targetCtx.restore();

      targetCtx.restore();

      // Pass 4: Render Angle Marks labels (unclipped)
      if (state.show_labels) {
        targetCtx.save();
        targetCtx.fillStyle = '#1c1c1e';
        targetCtx.font = `bold ${Math.max(10, 15 * scale)}px "JetBrains Mono", var(--font-sans)`;
        targetCtx.textAlign = 'center';
        targetCtx.textBaseline = 'middle';
        const labelRadius = 280 * scale + offsetDistance;
        const lx = cx + labelRadius * Math.cos(mA);
        const ly = cy + labelRadius * Math.sin(mA);
        
        const angleDegVal = (i * (360 / c)).toFixed(1).replace('.0', '');
        targetCtx.fillText(`${angleDegVal}°`, lx, ly);
        targetCtx.restore();
      }
    }
  }

  function renderPreview() {
    drawSlices(canvas, 1.0);
    hudSlicesVal.textContent = `Slices: ${state.count}`;
    const shapeLabel = selectShape.options[selectShape.selectedIndex].text;
    hudShapeVal.textContent = `Shape: ${shapeLabel}`;
  }

  // --- EXPORT PNG ---
  function exportPNG() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1600;
    exportCanvas.height = 1600;
    
    // Draw high quality scales
    drawSlices(exportCanvas, 1600 / 600);
    
    const url = exportCanvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `sliced_${state.shape}_${state.count}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    showToast("Sliced PNG exported!");
  }

  // --- PHOTOSHOP ZOOM & PAN VIEWPORT ENGINE ---
  function applyTransform() {
    previewContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    zoomDisplayText.textContent = `${Math.round(zoomScale * 100)}%`;
    hudZoomVal.textContent = `Zoom: ${Math.round(zoomScale * 100)}%`;
  }

  function centerCanvas() {
    const viewRect = viewport.getBoundingClientRect();
    const w = 600;
    const h = 600;
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
    inputCount.addEventListener('input', () => {
      const val = parseInt(inputCount.value, 10);
      state.count = val;
      valCount.textContent = val;
      renderPreview();
    });

    selectShape.addEventListener('change', () => {
      state.shape = selectShape.value;
      renderPreview();
    });

    inputRot.addEventListener('input', () => {
      const val = parseInt(inputRot.value, 10);
      state.rot = val;
      valRot.textContent = `${val}°`;
      renderPreview();
    });

    inputInner.addEventListener('input', () => {
      const val = parseInt(inputInner.value, 10);
      state.inner = val;
      valInner.textContent = `${val}%`;
      renderPreview();
    });

    inputOffset.addEventListener('input', () => {
      const val = parseInt(inputOffset.value, 10);
      state.offset = val;
      valOffset.textContent = `${val}px`;
      renderPreview();
    });

    // Checkboxes
    inputColorize.addEventListener('change', () => {
      state.colorize = inputColorize.checked;
      renderPreview();
    });

    inputShowLabels.addEventListener('change', () => {
      state.show_labels = inputShowLabels.checked;
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

    // Actions
    btnRandomColors.addEventListener('click', () => {
      randomizeColors();
      renderPreview();
      showToast("Colors Randomized!");
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
        count: 10,
        shape: "circle",
        rot: 0,
        inner: 0,
        offset: 0,
        colorize: true,
        show_labels: true,
        show_checkerboard: true,
        colors: []
      };

      randomizeColors();

      inputCount.value = state.count;
      valCount.textContent = state.count;
      selectShape.value = state.shape;
      
      inputRot.value = state.rot;
      valRot.textContent = `${state.rot}°`;
      inputInner.value = state.inner;
      valInner.textContent = `${state.inner}%`;
      inputOffset.value = state.offset;
      valOffset.textContent = `${state.offset}px`;

      inputColorize.checked = state.colorize;
      inputShowLabels.checked = state.show_labels;
      inputShowCheckerboard.checked = state.show_checkerboard;

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
  randomizeColors();
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
