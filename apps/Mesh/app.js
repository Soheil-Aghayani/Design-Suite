document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let state = {
    nodes: [
      { x: 100, y: 100, color: "#ff5e62", r: 380, vx: 0.8, vy: 0.6 },
      { x: 500, y: 120, color: "#ff9966", r: 360, vx: -0.7, vy: 0.9 },
      { x: 120, y: 300, color: "#4f46e5", r: 420, vx: 0.6, vy: -0.8 },
      { x: 520, y: 320, color: "#06b6d4", r: 400, vx: -0.9, vy: -0.5 }
    ],
    motionFloat: true,
    motionSpeed: 1.5,
    noiseGrain: 12,
    exportPreset: "1.0", // 1x, HD, 4K
    
    // UI state
    isDragging: false,
    activeDragIndex: null
  };

  // DOM Elements
  const canvas = document.getElementById('mesh-canvas');
  const ctx = canvas.getContext('2d');
  const meshWrapper = document.getElementById('mesh-wrapper');
  const dragHandles = [
    document.getElementById('handle-0'),
    document.getElementById('handle-1'),
    document.getElementById('handle-2'),
    document.getElementById('handle-3')
  ];

  // Tab switcher
  const tabButtons = document.querySelectorAll('.tab-btn');
  const sidebarContents = document.querySelectorAll('.sidebar-tab-content');

  // Node inputs
  const nodePickers = [
    document.getElementById('node-color-0'),
    document.getElementById('node-color-1'),
    document.getElementById('node-color-2'),
    document.getElementById('node-color-3')
  ];
  const nodeTexts = [
    document.getElementById('node-text-0'),
    document.getElementById('node-text-1'),
    document.getElementById('node-text-2'),
    document.getElementById('node-text-3')
  ];
  const nodeSliders = [
    document.getElementById('node-radius-0'),
    document.getElementById('node-radius-1'),
    document.getElementById('node-radius-2'),
    document.getElementById('node-radius-3')
  ];
  const nodeLabels = [
    document.getElementById('node-radius-lbl-0'),
    document.getElementById('node-radius-lbl-1'),
    document.getElementById('node-radius-lbl-2'),
    document.getElementById('node-radius-lbl-3')
  ];

  // Motion & effects inputs
  const motionFloatToggle = document.getElementById('motion-float-toggle');
  const motionSpeedSlider = document.getElementById('motion-speed');
  const motionSpeedLbl = document.getElementById('motion-speed-lbl');
  const noiseGrainSlider = document.getElementById('noise-grain');
  const noiseGrainLbl = document.getElementById('noise-grain-lbl');

  // Export elements
  const selectExportScale = document.getElementById('export-scale');
  const btnExportMesh = document.getElementById('btn-export-mesh');
  const btnQuickPlay = document.getElementById('btn-quick-play');
  
  const appToast = document.getElementById('app-toast');

  // Set up repeating noise tile canvas for super-fast renders
  let noiseTile = null;
  function createNoiseTile() {
    const tile = document.createElement('canvas');
    tile.width = 128;
    tile.height = 128;
    const tCtx = tile.getContext('2d');
    const imgData = tCtx.createImageData(128, 128);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const val = Math.random() * 255;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 20; // very low opacity base
    }

    tCtx.putImageData(imgData, 0, 0);
    noiseTile = tile;
  }
  createNoiseTile();

  // --- TAB NAVIGATION SWITCHER ---
  tabButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      sidebarContents.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      sidebarContents[index].classList.add('active');
    });
  });

  // --- CANVAS RESIZING ---
  let canvasW = 600;
  let canvasH = 380;

  function resizeCanvas() {
    canvasW = meshWrapper.clientWidth;
    canvasH = meshWrapper.clientHeight;
    
    // Match device pixel ratio for sharp renders
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    ctx.scale(dpr, dpr);
    
    // Boundary check node coordinates
    state.nodes.forEach(node => {
      if (node.x > canvasW) node.x = canvasW - 20;
      if (node.y > canvasH) node.y = canvasH - 20;
    });
  }

  // --- RENDERING PIPELINE ---

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  function drawMeshGradientOnContext(targetCtx, w, h, scaleFactor = 1.0) {
    // Fill solid base color (use first color)
    targetCtx.fillStyle = state.nodes[0].color;
    targetCtx.fillRect(0, 0, w, h);

    // Draw overlapping radial gradients
    state.nodes.forEach(node => {
      const scaledX = node.x * scaleFactor;
      const scaledY = node.y * scaleFactor;
      const scaledR = node.r * scaleFactor;

      const grad = targetCtx.createRadialGradient(scaledX, scaledY, 0, scaledX, scaledY, scaledR);
      const rgb = hexToRgb(node.color);
      
      grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85)`);
      grad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
      grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

      targetCtx.fillStyle = grad;
      targetCtx.fillRect(0, 0, w, h);
    });

    // Add noise grain overlay
    if (state.noiseGrain > 0 && noiseTile) {
      targetCtx.save();
      targetCtx.globalAlpha = state.noiseGrain / 100.0;
      targetCtx.globalCompositeOperation = 'overlay';
      
      const pattern = targetCtx.createPattern(noiseTile, 'repeat');
      targetCtx.fillStyle = pattern;
      targetCtx.fillRect(0, 0, w, h);
      targetCtx.restore();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvasW, canvasH);
    drawMeshGradientOnContext(ctx, canvasW, canvasH, 1.0);
    
    // Sync DOM drag handle indicators if not being manually dragged
    if (!state.isDragging) {
      state.nodes.forEach((node, i) => {
        dragHandles[i].style.left = `${(node.x / canvasW) * 100}%`;
        dragHandles[i].style.top = `${(node.y / canvasH) * 100}%`;
      });
    }
  }

  // --- FLOATING ANIMATION LOOP ---
  function updateAnimation() {
    if (state.motionFloat && !state.isDragging) {
      const speed = state.motionSpeed;
      state.nodes.forEach(node => {
        node.x += node.vx * speed;
        node.y += node.vy * speed;

        // Bounce boundaries
        if (node.x < 0) { node.x = 0; node.vx *= -1; }
        if (node.x > canvasW) { node.x = canvasW; node.vx *= -1; }
        if (node.y < 0) { node.y = 0; node.vy *= -1; }
        if (node.y > canvasH) { node.y = canvasH; node.vy *= -1; }
      });
    }

    draw();
    requestAnimationFrame(updateAnimation);
  }

  // --- DRAG HANDLE INTERACTIONS ---
  
  dragHandles.forEach((handle, index) => {
    handle.addEventListener('mousedown', (e) => {
      state.isDragging = true;
      state.activeDragIndex = index;
      handle.style.cursor = 'grabbing';
      e.preventDefault();
    });
    
    // Touch support
    handle.addEventListener('touchstart', (e) => {
      state.isDragging = true;
      state.activeDragIndex = index;
      e.preventDefault();
    });
  });

  window.addEventListener('mousemove', (e) => {
    if (!state.isDragging || state.activeDragIndex === null) return;
    
    const rect = meshWrapper.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Clamp coordinates
    x = Math.max(0, Math.min(canvasW, x));
    y = Math.max(0, Math.min(canvasH, y));

    const node = state.nodes[state.activeDragIndex];
    node.x = x;
    node.y = y;

    // Sync handle visual position
    dragHandles[state.activeDragIndex].style.left = `${(x / canvasW) * 100}%`;
    dragHandles[state.activeDragIndex].style.top = `${(y / canvasH) * 100}%`;
  });

  window.addEventListener('mouseup', () => {
    if (state.isDragging) {
      state.isDragging = false;
      if (state.activeDragIndex !== null) {
        dragHandles[state.activeDragIndex].style.cursor = 'grab';
      }
      state.activeDragIndex = null;
    }
  });

  // Touch move support
  window.addEventListener('touchmove', (e) => {
    if (!state.isDragging || state.activeDragIndex === null) return;
    
    const rect = meshWrapper.getBoundingClientRect();
    const touch = e.touches[0];
    let x = touch.clientX - rect.left;
    let y = touch.clientY - rect.top;

    x = Math.max(0, Math.min(canvasW, x));
    y = Math.max(0, Math.min(canvasH, y));

    const node = state.nodes[state.activeDragIndex];
    node.x = x;
    node.y = y;

    dragHandles[state.activeDragIndex].style.left = `${(x / canvasW) * 100}%`;
    dragHandles[state.activeDragIndex].style.top = `${(y / canvasH) * 100}%`;
  });

  window.addEventListener('touchend', () => {
    if (state.isDragging) {
      state.isDragging = false;
      state.activeDragIndex = null;
    }
  });

  // --- CONNECT INPUTS AND SYNC LABELS ---
  
  function registerInputEvents() {
    state.nodes.forEach((node, i) => {
      // Pickers
      nodePickers[i].addEventListener('input', () => {
        node.color = nodePickers[i].value;
        nodeTexts[i].value = nodePickers[i].value;
        dragHandles[i].style.backgroundColor = node.color;
      });

      nodeTexts[i].addEventListener('input', () => {
        const val = nodeTexts[i].value.trim();
        if (val.startsWith('#') && val.length === 7) {
          nodePickers[i].value = val;
          node.color = val;
          dragHandles[i].style.backgroundColor = val;
        }
      });

      // Radii sliders
      nodeSliders[i].addEventListener('input', () => {
        node.r = parseInt(nodeSliders[i].value, 10);
        nodeLabels[i].textContent = `${node.r}px`;
      });
    });

    // Speed slider
    motionSpeedSlider.addEventListener('input', () => {
      const val = parseInt(motionSpeedSlider.value, 10) / 10.0;
      state.motionSpeed = val;
      motionSpeedLbl.textContent = `${val.toFixed(1)}x`;
    });

    // Floating animation toggler
    motionFloatToggle.addEventListener('change', () => {
      state.motionFloat = motionFloatToggle.checked;
      btnQuickPlay.innerHTML = state.motionFloat 
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    });

    btnQuickPlay.addEventListener('click', () => {
      state.motionFloat = !state.motionFloat;
      motionFloatToggle.checked = state.motionFloat;
      btnQuickPlay.innerHTML = state.motionFloat 
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    });

    // Noise Grain slider
    noiseGrainSlider.addEventListener('input', () => {
      state.noiseGrain = parseInt(noiseGrainSlider.value, 10);
      noiseGrainLbl.textContent = `${state.noiseGrain}%`;
    });
  }

  // --- PNG WALLPAPER EXPORTER ---
  
  btnExportMesh.addEventListener('click', () => {
    showToast("Generating wallpaper...");
    
    // Choose dimensions
    let outW = canvasW;
    let outH = canvasH;
    const preset = selectExportScale.value;

    if (preset === "2.0") {
      outW = 1920;
      outH = 1080;
    } else if (preset === "3.0") {
      outW = 3840;
      outH = 2160;
    }

    const scaleFactor = outW / canvasW;

    // Create high-res offline canvas
    const exportCv = document.createElement('canvas');
    exportCv.width = outW;
    exportCv.height = outH;
    const exportCtx = exportCv.getContext('2d');

    // Draw scale gradient
    drawMeshGradientOnContext(exportCtx, outW, outH, scaleFactor);

    // Save download
    exportCv.toBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `mesh_wallpaper_${preset === "3.0" ? "4k" : "hd"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      showToast("Wallpaper saved successfully!");
    }, 'image/png');
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

  // Resize listener
  window.addEventListener('resize', () => {
    resizeCanvas();
    draw();
  });

  // Initial Run
  resizeCanvas();
  registerInputEvents();
  
  // Set play toggle state icon
  btnQuickPlay.innerHTML = state.motionFloat 
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;

  updateAnimation(); // Start float loop

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
