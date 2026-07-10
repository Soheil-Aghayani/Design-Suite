document.addEventListener('DOMContentLoaded', () => {
  // Constants
  const ROMAN_NUMS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  const ROMAN_NUMS_IIII = ["", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

  // Fonts lists
  const fontsByCategory = {
    "Persian / Arabic": ["Vazirmatn", "Amiri", "Tahoma", "Arial"],
    "Monospace": ["JetBrains Mono", "Courier New", "monospace"],
    "Sans-Serif": ["Inter", "Outfit", "Arial", "Helvetica", "sans-serif"],
    "System Fonts": [],
    "Custom Write-In": []
  };

  let savedFonts = null;
  try {
    savedFonts = localStorage.getItem('suite_local_fonts');
  } catch (e) {
    console.warn("Could not read local fonts from localStorage:", e);
  }
  if (savedFonts) {
    try {
      fontsByCategory["System Fonts"] = JSON.parse(savedFonts);
    } catch (e) {
      console.warn("Could not parse local fonts:", e);
    }
  }

  // State Variables
  let state = {
    hour: 10,
    minute: 10,
    second: 0,
    export_size: 1024,
    live_time: true,
    smooth_sweep: true,
    tick_sound: false,
    use_iiii: false,
    tz_offset: 3.5,
    font_category: "Persian / Arabic",
    font_name: "Vazirmatn",
    digit_style: "Persian",
    theme: "Custom",
    dial_color: "#1e40af",
    hands_color: "#dc2626",
    face_color: "rgba(0,0,0,0)",
    face_grad_color: "rgba(0,0,0,0)",
    show_ring: true,
    double_ring: false,
    show_inner_ring: false,
    show_ticks: true,
    show_minute_ticks: true,
    tick_style: "Line Ticks",
    show_numbers: true,
    show_shadow: true,
    use_gradient: false,
    show_checkerboard: true,
    show_hour_hand: true,
    show_minute_hand: true,
    show_second_hand: true,
    show_second_tail: true,
    hands_style: "Straight Line",
    brand_text: "VAZIR",
    sub_text: "AUTOMATIC"
  };

  // Presets Definition (matches Python exactly)
  const presets = {
    "Custom": null,
    "Classic Indigo": {
      dial_color: "#ff1e40af", // Qt Hex Format (#AARRGGBB)
      hands_color: "#ffdc2626",
      face_color: "#00000000",
      face_grad_color: "#00000000",
      use_gradient: false
    },
    "Dark Minimalist": {
      dial_color: "#ffe2e8f0",
      hands_color: "#fff8fafc",
      face_color: "#ff0f172a",
      face_grad_color: "#ff1e293b",
      use_gradient: true
    },
    "Luxury Gold": {
      dial_color: "#ffd97706",
      hands_color: "#ffb45309",
      face_color: "#ff292524",
      face_grad_color: "#ff1c1917",
      use_gradient: true
    },
    "Emerald Premium": {
      dial_color: "#ff047857",
      hands_color: "#ff10b981",
      face_color: "#00000000",
      face_grad_color: "#00000000",
      use_gradient: false
    },
    "Cyberpunk Neon": {
      dial_color: "#ff06b6d4",
      hands_color: "#ffec4899",
      face_color: "#ff0d0b21",
      face_grad_color: "#ff05020c",
      use_gradient: true
    },
    "Soft Rose": {
      dial_color: "#ffbe185d",
      hands_color: "#ffdb2777",
      face_color: "#fffff1f2",
      face_grad_color: "#ffffe4e6",
      use_gradient: true
    }
  };

  // Zoom & Pan state
  let zoomScale = 1.0;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  // History state
  let historyStack = [];
  let historyPointer = -1;
  let isMutingHistory = false;

  // Sound generator
  let audioCtx = null;
  let lastSoundSecond = -1;

  // Timer loop
  let liveTimerInterval = null;

  // DOM Elements
  const previewContainer = document.getElementById('preview-container');
  const viewport = document.querySelector('.canvas-viewport');
  const hudDimsVal = document.getElementById('hud-dims-val');
  const hudThemeVal = document.getElementById('hud-theme-val');
  const hudZoomVal = document.getElementById('hud-zoom-val');

  // Mobile Toggles
  const btnToggleLeft = document.getElementById('btn-toggle-left');
  const btnToggleRight = document.getElementById('btn-toggle-right');
  const mobileSidebarOverlay = document.getElementById('mobile-sidebar-overlay');
  const leftToolbar = document.querySelector('.left-toolbar');
  const rightSidebar = document.querySelector('.right-sidebar');

  if (btnToggleLeft && btnToggleRight && mobileSidebarOverlay) {
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

    mobileSidebarOverlay.addEventListener('click', () => {
      leftToolbar.classList.remove('open');
      rightSidebar.classList.remove('open');
      mobileSidebarOverlay.style.display = 'none';
    });

    // Close overlays when clicking canvas or action buttons on mobile
    viewport.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        leftToolbar.classList.remove('open');
        rightSidebar.classList.remove('open');
        mobileSidebarOverlay.style.display = 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        if (!leftToolbar.contains(e.target) && !rightSidebar.contains(e.target) && e.target !== btnToggleLeft && e.target !== btnToggleRight) {
          leftToolbar.classList.remove('open');
          rightSidebar.classList.remove('open');
          mobileSidebarOverlay.style.display = 'none';
        }
      }
    });
  }

  // Toolbar Elements
  const btnZoomIn = document.getElementById('zoom-in-btn');
  const btnZoomOut = document.getElementById('zoom-out-btn');
  const btnZoomReset = document.getElementById('zoom-reset-btn');
  const zoomDisplayText = document.getElementById('zoom-display-text');
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnReset = document.getElementById('btn-reset');
  const btnRandomize = document.getElementById('btn-randomize');
  const btnQuickExport = document.getElementById('btn-quick-export');
  const btnQuickCopy = document.getElementById('btn-quick-copy');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');

  // Input Field References
  const inputLiveTime = document.getElementById('live-time');
  const inputSmoothSweep = document.getElementById('smooth-sweep');
  const inputTickSound = document.getElementById('tick-sound');
  const inputTzOffset = document.getElementById('tz-offset');
  const inputThemePreset = document.getElementById('theme-preset');
  const inputExportSize = document.getElementById('export-size');

  const containerStaticTime = document.getElementById('static-time-controls');
  const inputManualHour = document.getElementById('manual-hour');
  const valManualHour = document.getElementById('manual-hour-val');
  const inputManualMinute = document.getElementById('manual-minute');
  const valManualMinute = document.getElementById('manual-minute-val');
  const inputManualSecond = document.getElementById('manual-second');
  const valManualSecond = document.getElementById('manual-second-val');

  const inputShowRing = document.getElementById('show-ring');
  const inputDoubleRing = document.getElementById('double-ring');
  const inputShowInnerRing = document.getElementById('show-inner-ring');
  const inputShowTicks = document.getElementById('show-ticks');
  const inputShowMinuteTicks = document.getElementById('show-minute-ticks');
  const inputTickStyle = document.getElementById('tick-style');
  const inputShowNumbers = document.getElementById('show-numbers');
  const inputDigitStyle = document.getElementById('digit-style');
  const inputUseIiii = document.getElementById('use-iiii');
  const inputFontCategory = document.getElementById('font-category');
  const inputFontName = document.getElementById('font-name');
  const inputEnableShadow = document.getElementById('enable-shadow');
  const inputUseGradient = document.getElementById('use-gradient');
  const inputShowCheckerboard = document.getElementById('show-checkerboard');

  const inputShowHourHand = document.getElementById('show-hour-hand');
  const inputShowMinuteHand = document.getElementById('show-minute-hand');
  const inputShowSecondHand = document.getElementById('show-second-hand');
  const inputShowSecondTail = document.getElementById('show-second-tail');
  const inputHandsStyle = document.getElementById('hands-style');

  const colorDialPicker = document.getElementById('dial-color-picker');
  const colorDialText = document.getElementById('dial-color-text');
  const colorHandsPicker = document.getElementById('hands-color-picker');
  const colorHandsText = document.getElementById('hands-color-text');
  const colorFacePicker = document.getElementById('face-color-picker');
  const colorFaceText = document.getElementById('face-color-text');
  const colorFaceGradPicker = document.getElementById('face-grad-picker');
  const colorFaceGradText = document.getElementById('face-grad-text');

  const inputBrandText = document.getElementById('brand-text');
  const inputSubText = document.getElementById('sub-text');

  const inputNewPresetName = document.getElementById('new-preset-name');
  const btnSavePreset = document.getElementById('btn-save-preset');
  const customPresetsList = document.getElementById('custom-presets-list');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnImportJson = document.getElementById('btn-import-json');
  const importJsonFile = document.getElementById('import-json-file');

  // --- COLOR FORMATTING HELPERS ---
  // Convert Qt Hex Color #AARRGGBB to CSS color (rgb, rgba, or hex)
  function qtHexToWeb(colorStr) {
    if (!colorStr) return 'rgba(0,0,0,0)';
    if (colorStr.startsWith('rgb') || colorStr.startsWith('hsl')) return colorStr;
    if (colorStr.startsWith('#')) {
      if (colorStr.length === 9) { // #AARRGGBB
        const a = parseInt(colorStr.substring(1, 3), 16) / 255;
        const r = parseInt(colorStr.substring(3, 5), 16);
        const g = parseInt(colorStr.substring(5, 7), 16);
        const b = parseInt(colorStr.substring(7, 9), 16);
        if (a === 0) return 'rgba(0,0,0,0)';
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
      } else if (colorStr.length === 7) {
        return colorStr;
      }
    }
    return colorStr;
  }

  // Convert Web Color (hex, rgba) to Qt Hex Color #AARRGGBB
  function webToQtHex(colorStr) {
    if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0,0,0,0)') return '#00000000';
    if (colorStr.startsWith('#')) {
      if (colorStr.length === 7) return '#ff' + colorStr.slice(1);
      if (colorStr.length === 9) { // Web #RRGGBBAA to Qt #AARRGGBB
        const rr = colorStr.slice(1, 3);
        const gg = colorStr.slice(3, 5);
        const bb = colorStr.slice(5, 7);
        const aa = colorStr.slice(7, 9);
        return '#' + aa + rr + gg + bb;
      }
      return colorStr;
    }
    if (colorStr.startsWith('rgba') || colorStr.startsWith('rgb')) {
      const parts = colorStr.match(/[\d.]+/g);
      if (parts) {
        const r = parseInt(parts[0]).toString(16).padStart(2, '0');
        const g = parseInt(parts[1]).toString(16).padStart(2, '0');
        const b = parseInt(parts[2]).toString(16).padStart(2, '0');
        let a = 'ff';
        if (parts[3] !== undefined) {
          a = Math.round(parseFloat(parts[3]) * 255).toString(16).padStart(2, '0');
        }
        return '#' + a + r + g + b;
      }
    }
    return '#ff000000';
  }

  // Convert Hex string directly to rgb/rgba
  function hexToRgba(hex, alpha = 1) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function isColorTransparent(colorStr) {
    if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0,0,0,0)' || colorStr === 'rgba(0, 0, 0, 0)') return true;
    if (colorStr.startsWith('rgba')) {
      const parts = colorStr.match(/[\d.]+/g);
      if (parts && parts[3] !== undefined && parseFloat(parts[3]) === 0) {
        return true;
      }
    }
    return false;
  }

  function toPersianDigits(num) {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, x => persianDigits[parseInt(x)]);
  }

  // --- PLAY PROCEDURAL TICK SOUND ---
  function playTickSound(isTock) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const time = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isTock ? 750 : 950, time);
      
      gainNode.gain.setValueAtTime(0.2, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(time);
      osc.stop(time + 0.04);
      
      // Inject click white noise
      const bufferSize = audioCtx.sampleRate * 0.015; // 15ms click
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, time);
      
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.05, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      
      noise.start(time);
      noise.stop(time + 0.015);
    } catch (e) {
      console.warn("Audio Context init/playback failed:", e);
    }
  }

  // --- SVG CLOCK DRAWING ENGINE ---
  function drawClockToSVG(opts) {
    const size = opts.export_size || 1024;
    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.46;
    const ring_w = Math.max(2.0, size * 0.015);
    const num_radius = R * 0.78;
    const inner_R = R * 0.65;
    
    // Parse colors to standard web strings
    const dialColor = qtHexToWeb(opts.dial_color);
    const handsColor = qtHexToWeb(opts.hands_color);
    const faceColor = qtHexToWeb(opts.face_color);
    const faceGradColor = qtHexToWeb(opts.face_grad_color);

    const gradId = `face-gradient-svg`;
    
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">\n`;
    
    svgContent += `  <defs>\n`;
    if (opts.use_gradient) {
      svgContent += `    <radialGradient id="${gradId}" cx="50%" cy="50%" r="50%">\n`;
      svgContent += `      <stop offset="0%" stop-color="${faceColor}" />\n`;
      svgContent += `      <stop offset="100%" stop-color="${faceGradColor}" />\n`;
      svgContent += `    </radialGradient>\n`;
    }
    svgContent += `  </defs>\n`;

    // Helper to draw hands
    function getHandSVG(length, angleRad, baseW, tipW, style, color) {
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);
      if (style === "Minimalist Dots") {
        const tipX = cx + length * cosA;
        const tipY = cy + length * sinA;
        const r = baseW * 0.7;
        return `    <circle cx="${tipX}" cy="${tipY}" r="${r}" fill="${color}" />\n`;
      } else if (style === "Classic Tapered") {
        const backLen = length * 0.12;
        const p1x = cx - backLen * cosA - (baseW / 2) * sinA;
        const p1y = cy - backLen * sinA + (baseW / 2) * cosA;
        const p2x = cx - backLen * cosA + (baseW / 2) * sinA;
        const p2y = cy - backLen * sinA - (baseW / 2) * cosA;
        const p3x = cx + length * cosA + (tipW / 2) * sinA;
        const p3y = cy + length * sinA - (tipW / 2) * cosA;
        const p4x = cx + length * cosA - (tipW / 2) * sinA;
        const p4y = cy + length * sinA + (tipW / 2) * cosA;
        return `    <polygon points="${p1x.toFixed(2)},${p1y.toFixed(2)} ${p2x.toFixed(2)},${p2y.toFixed(2)} ${p3x.toFixed(2)},${p3y.toFixed(2)} ${p4x.toFixed(2)},${p4y.toFixed(2)}" fill="${color}" />\n`;
      } else if (style === "Breguet") {
        const cDist = length * 0.78;
        const cX = cx + cDist * cosA;
        const cY = cy + cDist * sinA;
        const rOuter = baseW * 1.5;
        
        const line1 = `    <line x1="${cx}" y1="${cy}" x2="${(cx + (cDist - rOuter) * cosA).toFixed(2)}" y2="${(cy + (cDist - rOuter) * sinA).toFixed(2)}" stroke="${color}" stroke-width="${tipW.toFixed(2)}" stroke-linecap="round" />\n`;
        const line2 = `    <line x1="${(cx + (cDist + rOuter) * cosA).toFixed(2)}" y1="${(cy + (cDist + rOuter) * sinA).toFixed(2)}" x2="${(cx + length * cosA).toFixed(2)}" y2="${(cy + length * sinA).toFixed(2)}" stroke="${color}" stroke-width="${tipW.toFixed(2)}" stroke-linecap="round" />\n`;
        const circle = `    <circle cx="${cX.toFixed(2)}" cy="${cY.toFixed(2)}" r="${rOuter.toFixed(2)}" stroke="${color}" stroke-width="${tipW.toFixed(2)}" fill="none" />\n`;
        return line1 + line2 + circle;
      } else { // "Straight Line"
        return `    <line x1="${cx}" y1="${cy}" x2="${(cx + length * cosA).toFixed(2)}" y2="${(cy + length * sinA).toFixed(2)}" stroke="${color}" stroke-width="${baseW.toFixed(2)}" stroke-linecap="round" />\n`;
      }
    }

    // Draw face background circle
    if (!isColorTransparent(faceColor)) {
      const fillValue = opts.use_gradient ? `url(#${gradId})` : faceColor;
      svgContent += `  <circle cx="${cx}" cy="${cy}" r="${R.toFixed(2)}" fill="${fillValue}" />\n`;
    }

    // Helper for Dial contents
    function drawDialContent(strokeColor) {
      let content = "";
      
      // 1. Outer Ring
      if (opts.show_ring) {
        if (opts.double_ring) {
          content += `    <circle cx="${cx}" cy="${cy}" r="${R.toFixed(2)}" stroke="${strokeColor}" stroke-width="${(ring_w * 0.3).toFixed(2)}" fill="none" />\n`;
          content += `    <circle cx="${cx}" cy="${cy}" r="${(R - ring_w * 0.6).toFixed(2)}" stroke="${strokeColor}" stroke-width="${(ring_w * 0.3).toFixed(2)}" fill="none" />\n`;
        } else {
          content += `    <circle cx="${cx}" cy="${cy}" r="${R.toFixed(2)}" stroke="${strokeColor}" stroke-width="${ring_w.toFixed(2)}" fill="none" />\n`;
        }
      }
      
      // 2. Inner Track Ring
      if (opts.show_inner_ring) {
        content += `    <circle cx="${cx}" cy="${cy}" r="${inner_R.toFixed(2)}" stroke="${strokeColor}" stroke-width="${Math.max(1.0, size * 0.003).toFixed(2)}" fill="none" />\n`;
      }
      
      // 3. Ticks
      if (opts.show_ticks && opts.tick_style !== "No Ticks") {
        const tickPenW = Math.max(1.0, size * 0.006);
        const majorPenW = Math.max(1.5, size * 0.010);
        
        for (let i = 0; i < 60; i++) {
          if (opts.tick_style === "Cardinal Ticks" && (i % 15 !== 0)) continue;
          if (!opts.show_minute_ticks && (i % 5 !== 0)) continue;
          
          const ang = (-90 + i * 6) * Math.PI / 180;
          const cosA = Math.cos(ang);
          const sinA = Math.sin(ang);
          
          if (opts.tick_style === "Circle Ticks") {
            const dotR = Math.max(1.5, size * (i % 5 === 0 ? 0.009 : 0.004));
            const dotX = cx + (R - ring_w * 1.5) * cosA;
            const dotY = cy + (R - ring_w * 1.5) * sinA;
            content += `    <circle cx="${dotX.toFixed(2)}" cy="${dotY.toFixed(2)}" r="${dotR.toFixed(2)}" fill="${strokeColor}" />\n`;
          } else {
            const outerX = cx + R * cosA;
            const outerY = cy + R * sinA;
            const innerLen = size * (i % 5 === 0 ? 0.03 : 0.015);
            const innerX = cx + (R - innerLen) * cosA;
            const innerY = cy + (R - innerLen) * sinA;
            const strokeW = i % 5 === 0 ? majorPenW : tickPenW;
            content += `    <line x1="${innerX.toFixed(2)}" y1="${innerY.toFixed(2)}" x2="${outerX.toFixed(2)}" y2="${outerY.toFixed(2)}" stroke="${strokeColor}" stroke-width="${strokeW.toFixed(2)}" stroke-linecap="round" />\n`;
          }
        }
      }
      
      // 4. Numbers
      if (opts.show_numbers) {
        const fontSize = (size * 0.10).toFixed(1);
        const romanList = opts.use_iiii ? ROMAN_NUMS_IIII : ROMAN_NUMS;
        
        for (let n = 1; n <= 12; n++) {
          const ang = (-90 + n * 30) * Math.PI / 180;
          const tx = cx + num_radius * Math.cos(ang);
          const ty = cy + num_radius * Math.sin(ang);
          
          let text = "";
          if (opts.digit_style === "Persian") {
            text = toPersianDigits(n);
          } else if (opts.digit_style === "Roman") {
            text = romanList[n];
          } else {
            text = n.toString();
          }
          
          content += `    <text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" font-family="${opts.font_name}" font-size="${fontSize}" fill="${strokeColor}" font-weight="500" text-anchor="middle" dominant-baseline="central">${text}</text>\n`;
        }
      }
      
      // 5. Brand Text (Logo)
      if (opts.brand_text) {
        const brandFontSize = (size * 0.05).toFixed(1);
        const brandY = cy - R * 0.45;
        content += `    <text x="${cx}" y="${brandY.toFixed(2)}" font-family="${opts.font_name}" font-size="${brandFontSize}" font-weight="bold" fill="${strokeColor}" text-anchor="middle" dominant-baseline="central">${opts.brand_text}</text>\n`;
      }
      
      // 6. Subtext
      if (opts.sub_text) {
        const subFontSize = (size * 0.035).toFixed(1);
        const subY = cy + R * 0.45;
        const letterSpacing = (size * 0.005).toFixed(1);
        content += `    <text x="${cx}" y="${subY.toFixed(2)}" font-family="${opts.font_name}" font-size="${subFontSize}" letter-spacing="${letterSpacing}" fill="${strokeColor}" text-anchor="middle" dominant-baseline="central">${opts.sub_text}</text>\n`;
      }
      
      return content;
    }

    // Draw Dial Soft Drop Shadow
    if (opts.show_shadow) {
      const s_offset = Math.max(1.5, size * 0.007);
      const shadowColor = "rgba(0,0,0,0.14)";
      svgContent += `  <g transform="translate(${s_offset.toFixed(2)}, ${s_offset.toFixed(2)})">\n${drawDialContent(shadowColor)}  </g>\n`;
    }

    // Draw Dial Foreground
    svgContent += drawDialContent(dialColor);

    // Hands Geometry
    const h_val = parseFloat(opts.hour);
    const m_val = parseFloat(opts.minute);
    const s_val = parseFloat(opts.second);

    const m_len = R * 0.72;
    const h_len = R * 0.52;
    const s_len = R * 0.85;

    const h_w = Math.max(2.0, size * 0.030);
    const m_w = Math.max(2.0, size * 0.022);
    const s_w = Math.max(1.0, size * 0.008);

    // Helper for Hands content
    function drawHandsContent(color, isSecondOnly) {
      let content = "";
      
      // Minute Hand
      if (opts.show_minute_hand && !isSecondOnly) {
        const m_ang = (-90 + m_val * 6) * Math.PI / 180;
        content += getHandSVG(m_len, m_ang, m_w, m_w * 0.6, opts.hands_style, color);
      }
      
      // Hour Hand
      if (opts.show_hour_hand && !isSecondOnly) {
        const hour12 = (h_val % 12) + (m_val / 60.0);
        const h_ang = (-90 + hour12 * 30) * Math.PI / 180;
        content += getHandSVG(h_len, h_ang, h_w, h_w * 0.6, opts.hands_style, color);
      }
      
      // Second Hand
      if (opts.show_second_hand) {
        const s_ang = (-90 + s_val * 6) * Math.PI / 180;
        content += getHandSVG(s_len, s_ang, s_w, s_w, "Straight Line", color);
        
        // Second hand tail
        if (opts.show_second_tail) {
          const tail_len = s_len * 0.16;
          const tail_ang = s_ang + Math.PI;
          
          content += `    <line x1="${cx}" y1="${cy}" x2="${(cx + tail_len * Math.cos(tail_ang)).toFixed(2)}" y2="${(cy + tail_len * Math.sin(tail_ang)).toFixed(2)}" stroke="${color}" stroke-width="${s_w.toFixed(2)}" stroke-linecap="round" />\n`;
          
          const dotR = Math.max(2.0, size * 0.007);
          const dotX = cx + (tail_len * 0.75) * Math.cos(tail_ang);
          const dotY = cy + (tail_len * 0.75) * Math.sin(tail_ang);
          content += `    <circle cx="${dotX.toFixed(2)}" cy="${dotY.toFixed(2)}" r="${dotR.toFixed(2)}" fill="${color}" />\n`;
        }
      }
      
      // Center Pin
      if (!isSecondOnly) {
        const center_r = Math.max(2.0, size * 0.018);
        content += `    <circle cx="${cx}" cy="${cy}" r="${center_r.toFixed(2)}" stroke="${color}" stroke-width="1" fill="${color}" />\n`;
      }
      
      return content;
    }

    // Draw Hands Shadows
    if (opts.show_shadow) {
      const s_offset = Math.max(2.0, size * 0.012);
      const shadowColor = "rgba(0,0,0,0.18)";
      svgContent += `  <g transform="translate(${s_offset.toFixed(2)}, ${s_offset.toFixed(2)})">\n${drawHandsContent(shadowColor, false)}  </g>\n`;
    }

    // Draw Hands Foreground
    svgContent += drawHandsContent(handsColor, false);

    svgContent += `</svg>`;
    return svgContent;
  }

  // --- TRIGGER SVG RENDER ---
  function renderPreview() {
    // Generate at preview_size = 520 (for layout and zoom precision)
    const renderOpts = { ...state, export_size: 520 };
    const svgCode = drawClockToSVG(renderOpts);
    previewContainer.innerHTML = svgCode;
    
    // Set container dimensions
    previewContainer.style.width = '520px';
    previewContainer.style.height = '520px';
    
    hudDimsVal.textContent = `${state.export_size} × ${state.export_size} px`;
    hudThemeVal.textContent = `Theme: ${state.theme}`;
  }

  // --- TIME ENGINE CLOCK SYNCHRONIZER ---
  function updateTime() {
    if (state.live_time) {
      const now = new Date();
      // Calculate adjusted local timezone offset
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const tzAdjusted = new Date(utc + (state.tz_offset * 3600000));
      
      const ms = tzAdjusted.getMilliseconds();
      const sec = tzAdjusted.getSeconds();
      const min = tzAdjusted.getMinutes();
      const hr = tzAdjusted.getHours();
      
      if (state.smooth_sweep) {
        state.second = sec + (ms / 1000);
        state.minute = min + (state.second / 60);
        state.hour = hr + (state.minute / 60);
      } else {
        state.second = sec;
        state.minute = min + (sec / 60);
        state.hour = hr + (state.minute / 60);
      }

      // Live Audio ticking
      const currentSecInt = Math.floor(state.second);
      if (currentSecInt !== lastSoundSecond) {
        lastSoundSecond = currentSecInt;
        if (state.tick_sound && !state.smooth_sweep) {
          playTickSound(currentSecInt % 2 === 0);
        }
      }

      // Sync disabled Manual Sliders
      inputManualHour.value = hr;
      valManualHour.textContent = hr;
      inputManualMinute.value = min;
      valManualMinute.textContent = min;
      inputManualSecond.value = sec;
      valManualSecond.textContent = sec;
    } else {
      // Manual values
      const hr = parseInt(inputManualHour.value, 10);
      const min = parseInt(inputManualMinute.value, 10);
      const sec = parseInt(inputManualSecond.value, 10);
      
      state.second = sec;
      state.minute = min + (sec / 60);
      state.hour = hr + (state.minute / 60);
    }
    
    renderPreview();
  }

  function startLiveEngine() {
    if (liveTimerInterval) clearInterval(liveTimerInterval);
    const step = state.smooth_sweep ? 30 : 250;
    liveTimerInterval = setInterval(updateTime, step);
  }

  function stopLiveEngine() {
    if (liveTimerInterval) {
      clearInterval(liveTimerInterval);
      liveTimerInterval = null;
    }
  }

  // --- THEME PRESETS HANDLERS ---
  function applyThemePreset(presetName) {
    if (presetName === 'Custom') return;
    const preset = presets[presetName];
    if (!preset) return;
    
    state.theme = presetName;
    state.dial_color = qtHexToWeb(preset.dial_color);
    state.hands_color = qtHexToWeb(preset.hands_color);
    state.face_color = qtHexToWeb(preset.face_color);
    state.face_grad_color = qtHexToWeb(preset.face_grad_color);
    state.use_gradient = preset.use_gradient;

    // Update UI components inputs
    updateColorPickers();
    inputUseGradient.checked = state.use_gradient;
    inputThemePreset.value = presetName;
    
    pushStateToHistory();
    renderPreview();
  }

  function updateColorPickers() {
    colorDialPicker.value = rgbToHex(state.dial_color) || "#1e40af";
    colorDialText.value = state.dial_color;

    colorHandsPicker.value = rgbToHex(state.hands_color) || "#dc2626";
    colorHandsText.value = state.hands_color;

    colorFacePicker.value = rgbToHex(state.face_color) || "#ffffff";
    colorFaceText.value = state.face_color;

    colorFaceGradPicker.value = rgbToHex(state.face_grad_color) || "#f8fafc";
    colorFaceGradText.value = state.face_grad_color;
  }

  // Convert rgba/rgb strings back to HEX for color pickers
  function rgbToHex(colorStr) {
    if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0,0,0,0)') return '#ffffff';
    if (colorStr.startsWith('#')) {
      if (colorStr.length === 9) return '#' + colorStr.slice(3); // Remove Alpha
      return colorStr;
    }
    const match = colorStr.match(/\d+/g);
    if (!match) return '#ffffff';
    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // --- DYNAMIC FONT BUILDER ---
  const fontNameWrapper = document.getElementById('font-name-wrapper');
  const customFontInputWrapper = document.getElementById('custom-font-input-wrapper');
  const customFontNameInput = document.getElementById('custom-font-name');

  function rebuildFontFamiliesList() {
    const cat = state.font_category;
    
    if (cat === "Custom Write-In") {
      fontNameWrapper.style.display = 'none';
      customFontInputWrapper.style.display = 'flex';
      customFontNameInput.value = state.font_name;
    } else {
      fontNameWrapper.style.display = 'flex';
      customFontInputWrapper.style.display = 'none';
      
      const fonts = fontsByCategory[cat] || [];
      inputFontName.innerHTML = "";
      
      if (cat === "System Fonts" && fonts.length === 0) {
        const commonFonts = [
          "Segoe UI", "Tahoma", "Calibri", "Arial", "Times New Roman", "Georgia", 
          "Verdana", "Impact", "Trebuchet MS", "Courier New", "Consolas"
        ];
        fontsByCategory["System Fonts"] = commonFonts;
        rebuildFontFamiliesList();
        return;
      } else {
        fonts.forEach(f => {
          const opt = document.createElement('option');
          opt.value = f;
          opt.textContent = f;
          if (f === state.font_name) opt.selected = true;
          inputFontName.appendChild(opt);
        });
      }
    }
  }

  // --- PHOTOSHOP ZOOM & PAN VIEWPORT ENGINE ---
  function applyTransform() {
    previewContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    zoomDisplayText.textContent = `${Math.round(zoomScale * 100)}%`;
    hudZoomVal.textContent = `Zoom: ${Math.round(zoomScale * 100)}%`;
  }

  function centerCanvas() {
    const viewRect = viewport.getBoundingClientRect();
    const size = 520;
    zoomScale = 1.0;
    panX = (viewRect.width - size * zoomScale) / 2;
    panY = (viewRect.height - size * zoomScale) / 2;
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

  // --- UNDO / REDO CONTROLLERS ---
  function pushStateToHistory() {
    if (isMutingHistory) return;
    
    // Clear future states if we were in the middle of undo stack
    if (historyPointer < historyStack.length - 1) {
      historyStack = historyStack.slice(0, historyPointer + 1);
    }
    
    // Clone state
    historyStack.push(JSON.stringify(state));
    historyPointer++;
    
    if (historyStack.length > 50) {
      historyStack.shift();
      historyPointer--;
    }
    
    updateHistoryButtons();
    // Auto-save current config to localStorage session
    localStorage.setItem('vazir_clock_session', JSON.stringify(state));
  }

  function updateHistoryButtons() {
    btnUndo.disabled = historyPointer <= 0;
    btnRedo.disabled = historyPointer >= historyStack.length - 1;
  }

  function performUndo() {
    if (historyPointer > 0) {
      historyPointer--;
      isMutingHistory = true;
      loadConfigObject(JSON.parse(historyStack[historyPointer]));
      isMutingHistory = false;
      updateHistoryButtons();
      showToast("Undo completed");
    }
  }

  function performRedo() {
    if (historyPointer < historyStack.length - 1) {
      historyPointer++;
      isMutingHistory = true;
      loadConfigObject(JSON.parse(historyStack[historyPointer]));
      isMutingHistory = false;
      updateHistoryButtons();
      showToast("Redo completed");
    }
  }

  // --- LOAD / SYNC ENTIRE CONFIG OBJECT ---
  function loadConfigObject(obj) {
    if (!obj) return;
    state = { ...state, ...obj };

    // Sync input controls
    inputLiveTime.checked = state.live_time;
    inputSmoothSweep.checked = state.smooth_sweep;
    inputTickSound.checked = state.tick_sound;
    inputTzOffset.value = state.tz_offset;
    inputThemePreset.value = state.theme;
    inputExportSize.value = state.export_size;

    inputShowRing.checked = state.show_ring;
    inputDoubleRing.checked = state.double_ring;
    inputShowInnerRing.checked = state.show_inner_ring;
    inputShowTicks.checked = state.show_ticks;
    inputShowMinuteTicks.checked = state.show_minute_ticks;
    inputTickStyle.value = state.tick_style;
    inputShowNumbers.checked = state.show_numbers;
    inputDigitStyle.value = state.digit_style;
    inputUseIiii.checked = state.use_iiii;
    inputFontCategory.value = state.font_category;
    
    rebuildFontFamiliesList();
    if (state.font_category === "Custom Write-In") {
      customFontNameInput.value = state.font_name;
    } else {
      inputFontName.value = state.font_name;
    }

    inputEnableShadow.checked = state.show_shadow;
    inputUseGradient.checked = state.use_gradient;
    inputShowCheckerboard.checked = state.show_checkerboard;

    inputShowHourHand.checked = state.show_hour_hand;
    inputShowMinuteHand.checked = state.show_minute_hand;
    inputShowSecondHand.checked = state.show_second_hand;
    inputShowSecondTail.checked = state.show_second_tail;
    inputHandsStyle.value = state.hands_style;

    inputBrandText.value = state.brand_text;
    inputSubText.value = state.sub_text;

    // Manual Time
    inputManualHour.value = state.hour;
    valManualHour.textContent = state.hour;
    inputManualMinute.value = state.minute;
    valManualMinute.textContent = state.minute;
    inputManualSecond.value = Math.round(state.second);
    valManualSecond.textContent = Math.round(state.second);

    updateColorPickers();
    syncTogglesState();
    
    // Manage background checkerboard preview
    if (state.show_checkerboard) {
      previewContainer.classList.add('show-checkerboard');
    } else {
      previewContainer.classList.remove('show-checkerboard');
    }

    // Engine loop restart if needed
    if (state.live_time) {
      startLiveEngine();
    } else {
      stopLiveEngine();
      updateTime();
    }
  }

  function syncTogglesState() {
    // Disable manual hour/min/sec when live
    if (state.live_time) {
      containerStaticTime.style.display = 'none';
      inputTzOffset.disabled = false;
      inputSmoothSweep.disabled = false;
      inputTickSound.disabled = state.smooth_sweep;
    } else {
      containerStaticTime.style.display = 'flex';
      inputTzOffset.disabled = true;
      inputSmoothSweep.disabled = true;
      inputTickSound.disabled = true;
    }
  }

  // --- RANDOMIZE OPTIONS ---
  function randomizeClock() {
    const colors = [
      "#1e40af", "#dc2626", "#047857", "#d97706", "#be185d", "#7c3aed",
      "#0891b2", "#2563eb", "#ea580c", "#16a34a", "#db2777", "#4f46e5",
      "#111827", "#f3f4f6", "#ffffff", "#000000"
    ];
    
    const choose = arr => arr[Math.floor(Math.random() * arr.length)];
    
    state.theme = "Custom";
    state.dial_color = choose(colors);
    state.hands_color = choose(colors);
    
    // 30% chance for a solid face background
    if (Math.random() < 0.3) {
      state.face_color = choose(colors);
      state.use_gradient = Math.random() < 0.5;
      if (state.use_gradient) {
        state.face_grad_color = choose(colors);
      } else {
        state.face_grad_color = "rgba(0,0,0,0)";
      }
    } else {
      state.face_color = "rgba(0,0,0,0)";
      state.face_grad_color = "rgba(0,0,0,0)";
      state.use_gradient = false;
    }
    
    state.hands_style = choose(["Straight Line", "Classic Tapered", "Breguet", "Minimalist Dots"]);
    state.tick_style = choose(["Line Ticks", "Circle Ticks", "Cardinal Ticks"]);
    state.digit_style = choose(["Persian", "English", "Roman"]);
    
    loadConfigObject(state);
    pushStateToHistory();
    showToast("Randomized styles!");
  }

  // --- RESET DEFAULTS ---
  function resetToDefaults() {
    const defaults = {
      hour: 10,
      minute: 10,
      second: 0,
      export_size: 1024,
      live_time: true,
      smooth_sweep: true,
      tick_sound: false,
      use_iiii: false,
      tz_offset: 3.5,
      font_category: "Persian / Arabic",
      font_name: "Vazirmatn",
      digit_style: "Persian",
      theme: "Custom",
      dial_color: "#1e40af",
      hands_color: "#dc2626",
      face_color: "rgba(0,0,0,0)",
      face_grad_color: "rgba(0,0,0,0)",
      show_ring: true,
      double_ring: false,
      show_inner_ring: false,
      show_ticks: true,
      show_minute_ticks: true,
      tick_style: "Line Ticks",
      show_numbers: true,
      show_shadow: true,
      use_gradient: false,
      show_checkerboard: true,
      show_hour_hand: true,
      show_minute_hand: true,
      show_second_hand: true,
      show_second_tail: true,
      hands_style: "Straight Line",
      brand_text: "VAZIR",
      sub_text: "AUTOMATIC"
    };
    
    loadConfigObject(defaults);
    pushStateToHistory();
    showToast("Reset to defaults");
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

  // --- SVG & PNG EXPORT ACTIONS ---
  function getSVGCode() {
    return drawClockToSVG(state);
  }

  function copySVGToClipboard() {
    const code = getSVGCode();
    navigator.clipboard.writeText(code).then(() => {
      showToast("SVG Code copied to Clipboard!");
    }).catch(err => {
      console.error("Clipboard copy failed", err);
      showToast("Failed to copy SVG!");
    });
  }

  function exportPNG() {
    const size = state.export_size || 1024;
    const svgStr = getSVGCode();
    
    const img = new Image();
    // Convert SVG to dataURL
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(img, 0, 0, size, size);
      
      canvas.toBlob((pngBlob) => {
        const pngUrl = URL.createObjectURL(pngBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${state.brand_text || 'vazir'}_clock.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(pngUrl);
        showToast("PNG exported successfully!");
      }, 'image/png');
      
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      showToast("PNG export failed!");
    };
    img.src = url;
  }

  // Custom Toast Notifier
  const appToast = document.getElementById('app-toast');
  let toastTimer = null;
  function showToast(message) {
    appToast.textContent = message;
    appToast.classList.add('visible');
    
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      appToast.classList.remove('visible');
    }, 2000);
  }

  // --- MEMORY PRESETS MANAGER ---
  let userPresets = {};
  
  function saveUserPreset() {
    const name = inputNewPresetName.value.trim();
    if (!name) {
      showToast("Enter a preset name first!");
      return;
    }
    userPresets[name] = { ...state };
    localStorage.setItem('vazir_clock_user_presets', JSON.stringify(userPresets));
    inputNewPresetName.value = "";
    rebuildUserPresetsList();
    showToast(`Preset "${name}" saved!`);
  }

  function deleteUserPreset(name) {
    if (userPresets[name]) {
      delete userPresets[name];
      localStorage.setItem('vazir_clock_user_presets', JSON.stringify(userPresets));
      rebuildUserPresetsList();
      showToast(`Deleted preset "${name}"`);
    }
  }

  function loadUserPreset(name) {
    if (userPresets[name]) {
      loadConfigObject(userPresets[name]);
      pushStateToHistory();
      showToast(`Preset "${name}" loaded`);
    }
  }

  function rebuildUserPresetsList() {
    customPresetsList.innerHTML = "";
    const keys = Object.keys(userPresets);
    if (keys.length === 0) {
      customPresetsList.innerHTML = `<div class="presets-empty-msg">No custom presets saved.</div>`;
      return;
    }
    
    keys.forEach(k => {
      const item = document.createElement('div');
      item.className = 'preset-item';
      item.innerHTML = `
        <span class="preset-name" title="${k}">${k}</span>
        <div class="preset-actions">
          <button class="preset-btn load" data-name="${k}">Load</button>
          <button class="preset-btn delete" data-name="${k}">Delete</button>
        </div>
      `;
      customPresetsList.appendChild(item);
    });

    // Event delegation
    customPresetsList.querySelectorAll('.preset-btn.load').forEach(b => {
      b.addEventListener('click', () => loadUserPreset(b.getAttribute('data-name')));
    });
    customPresetsList.querySelectorAll('.preset-btn.delete').forEach(b => {
      b.addEventListener('click', () => deleteUserPreset(b.getAttribute('data-name')));
    });
  }

  function exportConfigJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "vazir_clock_config.json");
    dlAnchorElem.click();
    showToast("JSON configuration exported");
  }

  // --- CONNECT EVENT LISTENERS ---
  function registerInputEvents() {
    // Checkbox switches
    const setupSwitch = (el, prop, sideEffect = null) => {
      el.addEventListener('change', () => {
        state[prop] = el.checked;
        if (sideEffect) sideEffect();
        pushStateToHistory();
        updateTime();
      });
    };

    setupSwitch(inputLiveTime, 'live_time', () => {
      syncTogglesState();
      if (state.live_time) startLiveEngine();
      else stopLiveEngine();
    });
    
    setupSwitch(inputSmoothSweep, 'smooth_sweep', () => {
      syncTogglesState();
      if (state.live_time) startLiveEngine();
    });
    
    setupSwitch(inputTickSound, 'tick_sound');
    setupSwitch(inputShowRing, 'show_ring');
    setupSwitch(inputDoubleRing, 'double_ring');
    setupSwitch(inputShowInnerRing, 'show_inner_ring');
    setupSwitch(inputShowTicks, 'show_ticks');
    setupSwitch(inputShowMinuteTicks, 'show_minute_ticks');
    setupSwitch(inputShowNumbers, 'show_numbers');
    setupSwitch(inputUseIiii, 'use_iiii');
    setupSwitch(inputEnableShadow, 'show_shadow');
    setupSwitch(inputUseGradient, 'use_gradient');
    
    setupSwitch(inputShowCheckerboard, 'show_checkerboard', () => {
      if (state.show_checkerboard) {
        previewContainer.classList.add('show-checkerboard');
      } else {
        previewContainer.classList.remove('show-checkerboard');
      }
    });

    setupSwitch(inputShowHourHand, 'show_hour_hand');
    setupSwitch(inputShowMinuteHand, 'show_minute_hand');
    setupSwitch(inputShowSecondHand, 'show_second_hand');
    setupSwitch(inputShowSecondTail, 'show_second_tail');

    // Select dropdowns
    const setupSelect = (el, prop, sideEffect = null) => {
      el.addEventListener('change', () => {
        state[prop] = el.value;
        if (sideEffect) sideEffect();
        pushStateToHistory();
        updateTime();
      });
    };

    setupSelect(inputTickStyle, 'tick_style');
    setupSelect(inputDigitStyle, 'digit_style');
    setupSelect(inputHandsStyle, 'hands_style');
    
    setupSelect(inputFontCategory, 'font_category', () => {
      rebuildFontFamiliesList();
      if (state.font_category === "Custom Write-In") {
        state.font_name = customFontNameInput.value || "Arial";
      } else {
        state.font_name = inputFontName.value;
      }
    });
    
    setupSelect(inputFontName, 'font_name');

    customFontNameInput.addEventListener('input', () => {
      state.font_name = customFontNameInput.value;
      updateTime();
    });

    const btnScanFonts = document.getElementById('btn-scan-fonts');
    btnScanFonts.addEventListener('click', async () => {
      if (!window.queryLocalFonts) {
        alert('Local Font Access API not supported by this browser. Try Chrome/Edge or type a write-in font name!');
        return;
      }
      try {
        const fonts = await window.queryLocalFonts();
        const localFonts = [...new Set(fonts.map(f => f.family))].sort();
        fontsByCategory["System Fonts"] = localFonts;
        try {
          localStorage.setItem('suite_local_fonts', JSON.stringify(localFonts));
        } catch (e) {
          console.warn("Could not save scanned fonts to localStorage:", e);
        }
        
        rebuildFontFamiliesList();
        showToast(`Scanned ${localFonts.length} system fonts!`);
        updateTime();
      } catch (err) {
        alert('Permission to access system fonts was denied.');
      }
    });

    setupSelect(inputThemePreset, 'theme', () => {
      applyThemePreset(inputThemePreset.value);
    });

    // Numbers & Inputs
    inputTzOffset.addEventListener('change', () => {
      state.tz_offset = parseFloat(inputTzOffset.value) || 0;
      pushStateToHistory();
      updateTime();
    });

    inputExportSize.addEventListener('change', () => {
      state.export_size = parseInt(inputExportSize.value, 10) || 1024;
      pushStateToHistory();
      updateTime();
    });

    // Manual sliders
    inputManualHour.addEventListener('input', () => {
      valManualHour.textContent = inputManualHour.value;
      updateTime();
    });
    inputManualHour.addEventListener('change', () => {
      pushStateToHistory();
    });

    inputManualMinute.addEventListener('input', () => {
      valManualMinute.textContent = inputManualMinute.value;
      updateTime();
    });
    inputManualMinute.addEventListener('change', () => {
      pushStateToHistory();
    });

    inputManualSecond.addEventListener('input', () => {
      valManualSecond.textContent = inputManualSecond.value;
      updateTime();
    });
    inputManualSecond.addEventListener('change', () => {
      pushStateToHistory();
    });

    // Texts
    const setupText = (el, prop) => {
      el.addEventListener('input', () => {
        state[prop] = el.value;
        updateTime();
      });
      el.addEventListener('blur', () => {
        pushStateToHistory();
      });
    };
    setupText(inputBrandText, 'brand_text');
    setupText(inputSubText, 'sub_text');

    // Colors connection
    const connectColorPair = (picker, text, prop) => {
      picker.addEventListener('input', () => {
        text.value = picker.value;
        state[prop] = picker.value;
        state.theme = "Custom";
        inputThemePreset.value = "Custom";
        updateTime();
      });
      picker.addEventListener('change', () => {
        pushStateToHistory();
      });

      text.addEventListener('input', () => {
        const val = text.value.trim();
        // Accepts #hex, rgb, rgba
        if (val.startsWith('#') && (val.length === 7 || val.length === 9)) {
          picker.value = rgbToHex(val);
        }
        state[prop] = val;
        state.theme = "Custom";
        inputThemePreset.value = "Custom";
        updateTime();
      });
      text.addEventListener('change', () => {
        pushStateToHistory();
      });
    };

    connectColorPair(colorDialPicker, colorDialText, 'dial_color');
    connectColorPair(colorHandsPicker, colorHandsText, 'hands_color');
    connectColorPair(colorFacePicker, colorFaceText, 'face_color');
    connectColorPair(colorFaceGradPicker, colorFaceGradText, 'face_grad_color');

    // Left toolbar clicks
    btnZoomIn.addEventListener('click', () => zoomCentered(1.2));
    btnZoomOut.addEventListener('click', () => zoomCentered(1 / 1.2));
    btnZoomReset.addEventListener('click', centerCanvas);
    btnUndo.addEventListener('click', performUndo);
    btnRedo.addEventListener('click', performRedo);
    btnReset.addEventListener('click', resetToDefaults);
    btnRandomize.addEventListener('click', randomizeClock);
    btnQuickExport.addEventListener('click', exportPNG);
    btnQuickCopy.addEventListener('click', copySVGToClipboard);

    // Dark theme UI switcher
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('vazir_ui_theme', nextTheme);
      
      if (nextTheme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      }
    });

    // Custom presets buttons
    btnSavePreset.addEventListener('click', saveUserPreset);
    btnExportJson.addEventListener('click', exportConfigJson);
    
    btnImportJson.addEventListener('click', () => importJsonFile.click());
    importJsonFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const imported = JSON.parse(evt.target.result);
          // Convert Qt format properties if found
          for (let key in imported) {
            if (['dial_color', 'hands_color', 'face_color', 'face_grad_color'].includes(key)) {
              imported[key] = qtHexToWeb(imported[key]);
            }
          }
          loadConfigObject(imported);
          pushStateToHistory();
          showToast("Configuration JSON imported!");
        } catch (err) {
          showToast("Failed to parse config JSON!");
        }
      };
      reader.readAsText(file);
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Undo: Ctrl + Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        performUndo();
      }
      // Redo: Ctrl + Y
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        performRedo();
      }
    });
  }

  // --- INITIALIZATION ---
  function init() {
    // 1. Load active UI theme (Light/Dark)
    const activeUITheme = localStorage.getItem('vazir_ui_theme') || 'light';
    document.documentElement.setAttribute('data-theme', activeUITheme);
    if (activeUITheme === 'dark') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }

    // 2. Load custom user presets from storage
    const savedUserPresets = localStorage.getItem('vazir_clock_user_presets');
    if (savedUserPresets) {
      try {
        userPresets = JSON.parse(savedUserPresets);
      } catch (err) {
        userPresets = {};
      }
    }
    rebuildUserPresetsList();

    // 3. Load active design state session or default configuration
    let initialConfig = null;
    const activeSession = localStorage.getItem('vazir_clock_session');
    if (activeSession) {
      try {
        initialConfig = JSON.parse(activeSession);
      } catch (e) {
        initialConfig = null;
      }
    }
    
    // Register events first so elements have callbacks
    registerInputEvents();
    
    // Load config (or defaults if no session exists)
    if (initialConfig) {
      loadConfigObject(initialConfig);
    } else {
      resetToDefaults();
    }

    // Seed initial history
    historyStack = [JSON.stringify(state)];
    historyPointer = 0;
    updateHistoryButtons();

    // Center canvas viewport and track container layout sizes
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          centerCanvas();
        }
      }
    });
    resizeObserver.observe(viewport);
  }

  init();
});
