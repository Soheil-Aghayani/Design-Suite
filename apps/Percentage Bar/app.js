document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let state = {
    value: 95,
    targetValue: 95,
    label: "Performance",
    fg_color: "#16a34a",
    bg_color: "#e6e9ef",
    percent_color: "#0f172a",
    label_color: "#64748b",
    gap: 46,
    thickness_ratio: 0.12,
    percent_font: "Inter",
    percent_size_override: 0, // 0 = Auto
    label_font: "Inter",
    label_size_override: 0, // 0 = Auto
    label_spacing_ratio: 0.02,
    use_fa_digits: false,
    animate: true,
    show_checkerboard: true,
    export_scale: 3.0
  };

  // Zoom & Pan viewport state
  let zoomScale = 1.0;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  // Animation variables
  let animationFrameId = null;
  let animStart = null;
  let animStartVal = 0;

  // DOM Elements
  const canvas = document.getElementById('gauge-canvas');
  const previewContainer = document.getElementById('preview-container');
  const viewport = document.querySelector('.canvas-viewport');

  const inputPercent = document.getElementById('gauge-percent');
  const inputLabel = document.getElementById('gauge-label');
  const inputAnimate = document.getElementById('gauge-animate');
  const inputShowCheckerboard = document.getElementById('show-checkerboard');
  
  const inputGap = document.getElementById('gauge-gap');
  const valGap = document.getElementById('gauge-gap-lbl');
  const inputThickness = document.getElementById('gauge-thickness');
  const valThickness = document.getElementById('gauge-thickness-lbl');

  const colorArcPicker = document.getElementById('color-arc-picker');
  const colorArcText = document.getElementById('color-arc-text');
  const colorTrackPicker = document.getElementById('color-track-picker');
  const colorTrackText = document.getElementById('color-track-text');
  const colorPercentPicker = document.getElementById('color-percent-picker');
  const colorPercentText = document.getElementById('color-percent-text');
  const colorLabelPicker = document.getElementById('color-label-picker');
  const colorLabelText = document.getElementById('color-label-text');

  const selectPercentFont = document.getElementById('percent-font');
  const inputPercentSize = document.getElementById('percent-size');
  const valPercentSize = document.getElementById('percent-size-lbl');

  const selectLabelFont = document.getElementById('label-font');
  const inputLabelSize = document.getElementById('label-size');
  const valLabelSize = document.getElementById('label-size-lbl');
  const inputLabelSpacing = document.getElementById('label-spacing');
  const valLabelSpacing = document.getElementById('label-spacing-lbl');

  const inputExportScale = document.getElementById('export-scale');
  const valExportScale = document.getElementById('export-scale-lbl');
  const btnExportPng = document.getElementById('btn-export-png');
  const btnQuickExport = document.getElementById('btn-quick-export');
  const btnReset = document.getElementById('btn-reset');
  const appToast = document.getElementById('app-toast');

  const hudValueVal = document.getElementById('hud-value-val');
  const hudLabelVal = document.getElementById('hud-label-val');
  const hudZoomVal = document.getElementById('hud-zoom-val');

  // Zoom buttons
  const btnZoomIn = document.getElementById('zoom-in-btn');
  const btnZoomOut = document.getElementById('zoom-out-btn');
  const btnZoomReset = document.getElementById('zoom-reset-btn');
  const zoomDisplayText = document.getElementById('zoom-display-text');

  // Tab Buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.sidebar-tab-content');

  // --- FA DIGIT TRANSLATOR ---
  const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  function toFarsi(str) {
    return str.toString().replace(/\d/g, x => FA_DIGITS[parseInt(x)]);
  }

  function hasFarsiDigits(str) {
    return /[\u06F0-\u06F9]/.test(str);
  }

  function farsiToEnglishDigits(str) {
    return str.replace(/[\u06F0-\u06F9]/g, d => (d.charCodeAt(0) - 1776).toString());
  }

  // --- CANVAS PAINTER ---
  function drawGaugeContent(targetCanvas, scale = 1.0) {
    const ctx = targetCanvas.getContext('2d');
    const width = targetCanvas.width;
    const height = targetCanvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Geometry bounds
    const s = Math.min(width, height);
    const cx = width / 2;
    const cy = height / 2;
    const thickness = Math.max(8.0 * scale, s * state.thickness_ratio);
    const arcRadius = (s - thickness) / 2;

    // Angle conversions: straight up is -90 degrees in canvas.
    // The gap is symmetrically open at the bottom.
    // QPainter equivalent calculation:
    const startAngleRad = -(90 + state.gap / 2) * Math.PI / 180;
    const totalSpanRad = (360 - state.gap) * Math.PI / 180;
    
    const endAngleRad_bg = startAngleRad + totalSpanRad;
    const endAngleRad_fg = startAngleRad + totalSpanRad * (state.value / 100.0);

    // 1. Draw Track Arc
    ctx.save();
    ctx.strokeStyle = state.bg_color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, arcRadius, startAngleRad, endAngleRad_bg, false);
    ctx.stroke();
    ctx.restore();

    // 2. Draw Progress Arc
    ctx.save();
    ctx.strokeStyle = state.fg_color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, arcRadius, startAngleRad, endAngleRad_fg, false);
    ctx.stroke();
    ctx.restore();

    // 3. Draw Percentage Text
    ctx.save();
    ctx.fillStyle = state.percent_color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const pctFontSize = state.percent_size_override > 0 
      ? state.percent_size_override * scale 
      : s * 0.14;
    ctx.font = `bold ${pctFontSize}px "${state.percent_font}", sans-serif`;
    
    let percentText = `${Math.round(state.value)}%`;
    if (state.use_fa_digits) {
      percentText = toFarsi(percentText);
    }
    
    ctx.fillText(percentText, cx, cy);
    ctx.restore();

    // 4. Draw Label Inscription
    if (state.label) {
      ctx.save();
      ctx.fillStyle = state.label_color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const labelFontSize = state.label_size_override > 0 
        ? state.label_size_override * scale 
        : s * 0.06;
      ctx.font = `${labelFontSize}px "${state.label_font}", sans-serif`;
      
      // Calculate vertical spacing offset based on percent text height
      const spacing = s * state.label_spacing_ratio;
      const pctHeight = pctFontSize; // approximation
      const labelY = cy + pctHeight / 2 + spacing;
      
      ctx.fillText(state.label, cx, labelY);
      ctx.restore();
    }
  }

  function renderPreview() {
    drawGaugeContent(canvas, 1.0);
    hudValueVal.textContent = `Value: ${Math.round(state.value)}%`;
    hudLabelVal.textContent = `Label: ${state.label}`;
  }

  // --- ANIMATE VALUES ---
  function animateValue(target) {
    if (!state.animate) {
      state.value = target;
      renderPreview();
      return;
    }

    animStart = null;
    animStartVal = state.value;
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    function step(timestamp) {
      if (!animStart) animStart = timestamp;
      const progress = Math.min(1.0, (timestamp - animStart) / 600); // 600ms
      
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      state.value = animStartVal + (target - animStartVal) * ease;
      
      renderPreview();
      
      if (progress < 1.0) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        animationFrameId = null;
      }
    }
    
    animationFrameId = requestAnimationFrame(step);
  }

  // --- EXPORT TRANSPARENT PNG ---
  function exportPNG() {
    const scale = state.export_scale;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width * scale;
    exportCanvas.height = canvas.height * scale;
    
    drawGaugeContent(exportCanvas, scale);
    
    const url = exportCanvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `gauge_${state.label.toLowerCase().replace(/\s+/g, '_') || 'progress'}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    showToast("Transparent PNG exported!");
  }

  // --- PHOTOSHOP ZOOM & PAN VIEWPORT ENGINE ---
  function applyTransform() {
    previewContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    zoomDisplayText.textContent = `${Math.round(zoomScale * 100)}%`;
    hudZoomVal.textContent = `Zoom: ${Math.round(zoomScale * 100)}%`;
  }

  function centerCanvas() {
    const viewRect = viewport.getBoundingClientRect();
    const w = 340;
    const h = 340;
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
    // Percent input handler
    inputPercent.addEventListener('input', () => {
      const rawText = inputPercent.value.trim();
      state.use_fa_digits = hasFarsiDigits(rawText);
      
      const parsedText = farsiToEnglishDigits(rawText);
      const digits = parsedText.replace(/\D/g, '');
      const val = parseInt(digits, 10) || 0;
      
      state.targetValue = Math.max(0, Math.min(100, val));
      animateValue(state.targetValue);
    });

    inputLabel.addEventListener('input', () => {
      state.label = inputLabel.value;
      renderPreview();
    });

    inputAnimate.addEventListener('change', () => {
      state.animate = inputAnimate.checked;
    });

    inputShowCheckerboard.addEventListener('change', () => {
      state.show_checkerboard = inputShowCheckerboard.checked;
      if (state.show_checkerboard) {
        previewContainer.classList.add('show-checkerboard');
      } else {
        previewContainer.classList.remove('show-checkerboard');
      }
    });

    // Geometry
    inputGap.addEventListener('input', () => {
      const val = parseInt(inputGap.value, 10);
      state.gap = val;
      valGap.textContent = `${val}°`;
      renderPreview();
    });

    inputThickness.addEventListener('input', () => {
      const val = parseInt(inputThickness.value, 10);
      state.thickness_ratio = val / 100.0;
      valThickness.textContent = `${val}%`;
      renderPreview();
    });

    // Typography overrides
    selectPercentFont.addEventListener('change', () => {
      state.percent_font = selectPercentFont.value;
      renderPreview();
    });

    inputPercentSize.addEventListener('input', () => {
      const val = parseInt(inputPercentSize.value, 10);
      state.percent_size_override = val;
      valPercentSize.textContent = val === 0 ? "Auto" : `${val}px`;
      renderPreview();
    });

    selectLabelFont.addEventListener('change', () => {
      state.label_font = selectLabelFont.value;
      renderPreview();
    });

    inputLabelSize.addEventListener('input', () => {
      const val = parseInt(inputLabelSize.value, 10);
      state.label_size_override = val;
      valLabelSize.textContent = val === 0 ? "Auto" : `${val}px`;
      renderPreview();
    });

    inputLabelSpacing.addEventListener('input', () => {
      const val = parseInt(inputLabelSpacing.value, 10);
      state.label_spacing_ratio = val / 100.0;
      valLabelSpacing.textContent = val >= 0 ? `+${val}%` : `${val}%`;
      renderPreview();
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
    connectColor(colorArcPicker, colorArcText, 'fg_color');
    connectColor(colorTrackPicker, colorTrackText, 'bg_color');
    connectColor(colorPercentPicker, colorPercentText, 'percent_color');
    connectColor(colorLabelPicker, colorLabelText, 'label_color');

    // Export scale
    inputExportScale.addEventListener('input', () => {
      const val = parseFloat(inputExportScale.value) / 10.0;
      state.export_scale = val;
      valExportScale.textContent = `${val.toFixed(1)}x`;
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
        value: 95,
        targetValue: 95,
        label: "Performance",
        fg_color: "#16a34a",
        bg_color: "#e6e9ef",
        percent_color: "#0f172a",
        label_color: "#64748b",
        gap: 46,
        thickness_ratio: 0.12,
        percent_font: "Inter",
        percent_size_override: 0,
        label_font: "Inter",
        label_size_override: 0,
        label_spacing_ratio: 0.02,
        use_fa_digits: false,
        animate: true,
        show_checkerboard: true,
        export_scale: 3.0
      };

      inputPercent.value = state.value;
      inputLabel.value = state.label;
      inputAnimate.checked = state.animate;
      inputShowCheckerboard.checked = state.show_checkerboard;
      
      inputGap.value = state.gap;
      valGap.textContent = `${state.gap}°`;
      inputThickness.value = Math.round(state.thickness_ratio * 100);
      valThickness.textContent = `${Math.round(state.thickness_ratio * 100)}%`;

      colorArcPicker.value = state.fg_color;
      colorArcText.value = state.fg_color;
      colorTrackPicker.value = state.bg_color;
      colorTrackText.value = state.bg_color;
      colorPercentPicker.value = state.percent_color;
      colorPercentText.value = state.percent_color;
      colorLabelPicker.value = state.label_color;
      colorLabelText.value = state.label_color;

      selectPercentFont.value = state.percent_font;
      inputPercentSize.value = state.percent_size_override;
      valPercentSize.textContent = "Auto";

      selectLabelFont.value = state.label_font;
      inputLabelSize.value = state.label_size_override;
      valLabelSize.textContent = "Auto";
      inputLabelSpacing.value = Math.round(state.label_spacing_ratio * 100);
      valLabelSpacing.textContent = `+${Math.round(state.label_spacing_ratio * 100)}%`;

      inputExportScale.value = Math.round(state.export_scale * 10);
      valExportScale.textContent = `${state.export_scale.toFixed(1)}x`;

      previewContainer.classList.add('show-checkerboard');
      animateValue(state.targetValue);
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
  registerInputEvents();
  animateValue(state.targetValue);
});
