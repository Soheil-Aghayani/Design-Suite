// Dynamic Flowchart Designer Logic

// 1. Constants and Dimensions
const BASE_WIDTH = 1400;
const BASE_HEIGHT = 900;
const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;

let currentCanvasWidth = BASE_WIDTH;
let currentCanvasHeight = BASE_HEIGHT;

// Safe localStorage wrapper to prevent crashes in sandboxes/restricted environments
const safeStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access blocked:", e);
      return null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage access blocked:", e);
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("Storage access blocked:", e);
    }
  }
};

// 2. Default Initial State (4-column branching)
// 2. Default Initial State (4-column branching)
const DEFAULT_STATE = {
  columns: [
    {
      id: "col_1",
      nodes: [
        { id: "A", label: "", targets: ["B1", "B2", "B3"] }
      ]
    },
    {
      id: "col_2",
      nodes: [
        { id: "B1", label: "", targets: ["C1", "C2"] },
        { id: "B2", label: "", targets: ["C3", "C4"] },
        { id: "B3", label: "", targets: ["C5", "C6"] }
      ]
    },
    {
      id: "col_3",
      nodes: [
        { id: "C1", label: "", targets: ["D"] },
        { id: "C2", label: "", targets: ["D"] },
        { id: "C3", label: "", targets: ["D"] },
        { id: "C4", label: "", targets: ["D"] },
        { id: "C5", label: "", targets: ["D"] },
        { id: "C6", label: "", targets: ["D"] }
      ]
    },
    {
      id: "col_4",
      nodes: [
        { id: "D", label: "", targets: [] }
      ]
    }
  ],
  strokeWidth: 1.0,
  lineStyle: "solid",
  lineShape: "straight",
  chartTitle: "",
  showColumnTitles: true,
  showColumnGuides: true,
  showSwimlanes: false,
  exportTransparent: false,
  layoutOrientation: "horizontal",
  gridEnabled: false,
  gridSize: 20,
  gridStyle: "dots",
  snapToObjects: false,
  snapSensitivity: 5,
  globalTheme: "classic",
  animatedFlow: "off"
};

// Predefined Flowchart Template Library
const TEMPLATE_BUG_TRIAGE = {
  columns: [
    {
      id: "col_1",
      title: "Bug Intake",
      nodes: [
        { id: "A", label: "New Bug Reported", targets: ["B1", "B2"] }
      ]
    },
    {
      id: "col_2",
      title: "Severity Triage",
      nodes: [
        { id: "B1", label: "Critical Severity?", targets: ["C1"] },
        { id: "B2", label: "Normal Severity?", targets: ["C2", "C3"] }
      ]
    },
    {
      id: "col_3",
      title: "Strategy",
      nodes: [
        { id: "C1", label: "Assign Hotfix Crew", targets: ["D"] },
        { id: "C2", label: "Prioritize Sprint", targets: ["D"] },
        { id: "C3", label: "Send to Backlog", targets: [] }
      ]
    },
    {
      id: "col_4",
      title: "Verification",
      nodes: [
        { id: "D", label: "QA Verify & Close", targets: [] }
      ]
    }
  ]
};

const TEMPLATE_FEEDBACK_LOOP = {
  columns: [
    {
      id: "col_1",
      title: "Collect Feedback",
      nodes: [
        { id: "A", label: "Gather User Feedback", targets: ["B1", "B2"] }
      ]
    },
    {
      id: "col_2",
      title: "Analyze Type",
      nodes: [
        { id: "B1", label: "Positive?", targets: ["C1"] },
        { id: "B2", label: "Negative?", targets: ["C2"] }
      ]
    },
    {
      id: "col_3",
      title: "Action Item",
      nodes: [
        { id: "C1", label: "Share Testimonial", targets: ["D"] },
        { id: "C2", label: "Analyze Root Cause", targets: ["D"] }
      ]
    },
    {
      id: "col_4",
      title: "Review",
      nodes: [
        { id: "D", label: "Measure Impact & Retro", targets: [] }
      ]
    }
  ]
};

const TEMPLATE_USER_LOGIN = {
  columns: [
    {
      id: "col_1",
      title: "Landing",
      nodes: [
        { id: "A", label: "Open Application", targets: ["B1", "B2"] }
      ]
    },
    {
      id: "col_2",
      title: "Account Status",
      nodes: [
        { id: "B1", label: "Existing User?", targets: ["C1"] },
        { id: "B2", label: "New User?", targets: ["C2"] }
      ]
    },
    {
      id: "col_3",
      title: "Validation",
      nodes: [
        { id: "C1", label: "Enter Password", targets: ["D"] },
        { id: "C2", label: "Register Account", targets: ["D"] }
      ]
    },
    {
      id: "col_4",
      title: "Homepage",
      nodes: [
        { id: "D", label: "Redirect to Dashboard", targets: [] }
      ]
    }
  ]
};

function loadFlowchartTemplate(templateVal) {
  pushState();
  let selectedTemplate = null;
  if (templateVal === "bug-triage") {
    selectedTemplate = TEMPLATE_BUG_TRIAGE;
  } else if (templateVal === "feedback-loop") {
    selectedTemplate = TEMPLATE_FEEDBACK_LOOP;
  } else if (templateVal === "user-login") {
    selectedTemplate = TEMPLATE_USER_LOGIN;
  }
  
  if (selectedTemplate) {
    state.columns = JSON.parse(JSON.stringify(selectedTemplate.columns));
    selectedNodeIds.clear();
    selectedNodeId = null;
    selectedConnector = null;
    renderAll();
    saveData();
    showToast(`Loaded ${templateVal} template`);
  }
}

// Curated Global Color Themes
const THEMES = {
  classic: {
    name: "Minimal Classic (Default)",
    fillType: "solid",
    fill: "", // Empty maps to system/theme defaults
    stroke: "",
    textColor: "",
    shadowType: "none",
    borderStyle: "solid"
  },
  midnight: {
    name: "Sleek Midnight",
    fillType: "solid",
    fill: "#262626",
    stroke: "#404040",
    textColor: "#f5f5f5",
    shadowType: "sm",
    borderStyle: "solid"
  },
  nordic: {
    name: "Nordic Forest",
    fillType: "linear",
    fill: "#1e3a1e",
    fillColor2: "#065f46",
    gradientAngle: 45,
    stroke: "#047857",
    textColor: "#ecfdf5",
    shadowType: "md",
    borderStyle: "solid"
  },
  cyberpunk: {
    name: "Cyberpunk Glow",
    fillType: "linear",
    fill: "#180018",
    fillColor2: "#001818",
    gradientAngle: 135,
    stroke: "#ff00ff",
    textColor: "#00ffff",
    shadowType: "custom",
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 10,
    shadowColor: "#ff00ff",
    borderStyle: "solid"
  },
  sunset: {
    name: "Sunset Coral",
    fillType: "linear",
    fill: "#ffedd5",
    fillColor2: "#ff7e5f",
    gradientAngle: 90,
    stroke: "#ea580c",
    textColor: "#7c2d12",
    shadowType: "md",
    borderStyle: "solid"
  },
  glass: {
    name: "Frosted Glass",
    fillType: "solid",
    fill: "rgba(255, 255, 255, 0.12)",
    stroke: "rgba(255, 255, 255, 0.25)",
    textColor: "", // dynamic matching
    shadowType: "lg",
    borderStyle: "solid"
  }
};

// State holding columns, nodes, current styles, and current selection
let state = JSON.parse(JSON.stringify(DEFAULT_STATE));
let selectedNodeIds = new Set();
let selectedNodeId = null; // represents single node selection if set size is 1
let selectedConnector = null; // { sourceId, targetId } when connector is selected
let activeTool = "select"; // "select" or "connect"
let activeSidebarTab = "tab-structure"; // "tab-structure" or "tab-properties"
let connectionSourceId = null; // source node when drawing connection

// Undo / Redo stacks
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 50;

function pushState() {
  undoStack.push(JSON.stringify(state));
  if (undoStack.length > MAX_HISTORY) {
    undoStack.shift();
  }
  redoStack = [];
  updateUndoRedoButtons();
}

function executeUndo() {
  if (undoStack.length === 0) return;
  redoStack.push(JSON.stringify(state));
  state = JSON.parse(undoStack.pop());
  
  // Clean coordinates
  state.columns.forEach(col => {
    col.nodes.forEach(validateAndClampNode);
  });
  
  // Clear active drag/pan states
  isPanning = false;
  isDraggingNode = false;
  isResizingNode = false;
  dragNodeId = null;
  resizeNodeId = null;
  
  selectedNodeIds.clear();
  selectedNodeId = null;
  
  renderAll();
  saveData();
  updateUndoRedoButtons();
  showToast("Undo action");
}

function executeRedo() {
  if (redoStack.length === 0) return;
  undoStack.push(JSON.stringify(state));
  state = JSON.parse(redoStack.pop());
  
  // Clean coordinates
  state.columns.forEach(col => {
    col.nodes.forEach(validateAndClampNode);
  });
  
  // Clear active drag/pan states
  isPanning = false;
  isDraggingNode = false;
  isResizingNode = false;
  dragNodeId = null;
  resizeNodeId = null;
  
  selectedNodeIds.clear();
  selectedNodeId = null;
  
  renderAll();
  saveData();
  updateUndoRedoButtons();
  showToast("Redo action");
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById("undo-btn");
  const redoBtn = document.getElementById("redo-btn");
  
  if (undoBtn) {
    const canUndo = undoStack.length > 0;
    undoBtn.disabled = !canUndo;
    undoBtn.style.opacity = canUndo ? "1" : "0.5";
    undoBtn.style.cursor = canUndo ? "pointer" : "not-allowed";
  }
  if (redoBtn) {
    const canRedo = redoStack.length > 0;
    redoBtn.disabled = !canRedo;
    redoBtn.style.opacity = canRedo ? "1" : "0.5";
    redoBtn.style.cursor = canRedo ? "pointer" : "not-allowed";
  }
}

function registerUndoTrigger(element, eventType = "mousedown") {
  if (!element) return;
  element.addEventListener(eventType, () => {
    pushState();
  }, { passive: true });
}

// Zoom and Pan states
let zoom = 1.0;
let panX = 0;
let panY = 0;
let isPanning = false;
let startX = 0;
let startY = 0;
let isSpacePressed = false;

// Selection Marquee state
let isDraggingSelection = false;
let selectionStart = { x: 0, y: 0 };

// Node coordinates lookup table populated during render
let nodeCoords = {};

// Node dragging states
let isDraggingNode = false;
let dragNodeId = null;
let dragStartCanvasPos = { x: 0, y: 0 };
let dragOriginalPositions = {};
let dragAxisLock = null; // 'x', 'y', or null
let clipboardNodes = [];

// Node resizing states
let isResizingNode = false;
let resizeNodeId = null;
let resizeDirection = null;
let resizeStartMouse = null;
let resizeStartBounds = null;

// 3. DOM Elements
const svgEl = document.getElementById("flowchart-svg");
const connectorsGroup = document.getElementById("connectors-group");
const nodesGroup = document.getElementById("nodes-group");

const structureContainer = document.getElementById("structure-container");
const addColumnBtn = document.getElementById("add-column-btn");
const selectionSettingsContainer = document.getElementById("selection-settings-container");

const columnTitlesSelector = document.getElementById("column-titles-selector");
const columnGuidesSelector = document.getElementById("column-guides-selector");
const layoutDirectionSelector = document.getElementById("layout-direction-selector");
const strokeWidthSelector = document.getElementById("stroke-width-selector");
const lineStyleSelector = document.getElementById("line-style-selector");
const lineShapeSelector = document.getElementById("line-shape-selector");
const globalFlowSelector = document.getElementById("global-flow-selector");
const chartTitleInput = document.getElementById("chart-title-input");
const exportBgSelector = document.getElementById("export-bg-selector");
const clearBtn = document.getElementById("clear-labels-btn");
const resetBtn = document.getElementById("reset-layout-btn");
const exportBtn = document.getElementById("export-svg-btn");
const copyCodeBtn = document.getElementById("copy-code-btn");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const sunIcon = document.getElementById("sun-icon");
const moonIcon = document.getElementById("moon-icon");

// Tool elements
const canvasContainer = document.querySelector(".canvas-container");
const toolSelectBtn = document.getElementById("tool-select");
const toolConnectBtn = document.getElementById("tool-connect");

// Font and Search elements
const fontFamilySelect = document.getElementById("font-family-select");
const resetFontBtn = document.getElementById("reset-font-btn");
const nodeSearchInput = document.getElementById("node-search-input");

// Helper to switch active sidebar tab
function switchTab(tabId) {
  activeSidebarTab = tabId;
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  document.querySelectorAll(".sidebar-tab-content").forEach(content => {
    content.classList.toggle("active", content.id === tabId);
  });
}

// Helper to synchronize a color picker swatch with a hex text field
function wireColorPickerPair(pickerEl, hexEl, updateCallback) {
  if (!pickerEl || !hexEl) return;
  hexEl.value = pickerEl.value.toUpperCase();
  
  pickerEl.addEventListener("input", (e) => {
    const val = e.target.value.toUpperCase();
    hexEl.value = val;
    updateCallback(val);
  });
  
  hexEl.addEventListener("input", (e) => {
    let val = e.target.value.trim().toUpperCase();
    if (val && !val.startsWith("#")) val = "#" + val;
    const reg = /^#[0-9A-F]{6}$|^#[0-9A-F]{3}$/;
    if (reg.test(val)) {
      if (val.length === 4) {
        val = "#" + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
      }
      pickerEl.value = val;
      updateCallback(val);
    }
  });
  
  hexEl.addEventListener("blur", (e) => {
    let val = e.target.value.trim().toUpperCase();
    if (val && !val.startsWith("#")) val = "#" + val;
    const reg = /^#[0-9A-F]{6}$/;
    if (!reg.test(val)) {
      hexEl.value = pickerEl.value.toUpperCase();
    } else {
      hexEl.value = val;
    }
  });
}

// 4. Initial Launch
function init() {
  // Restore typography if saved
  const savedName = safeStorage.getItem("flowchart_font_name");
  const savedSource = safeStorage.getItem("flowchart_font_source") || "system";
  if (savedName) {
    if (fontFamilySelect) {
      for (let i = 0; i < fontFamilySelect.options.length; i++) {
        if (fontFamilySelect.options[i].value === savedName) {
          fontFamilySelect.selectedIndex = i;
          break;
        }
      }
    }
    applyFont(savedName, savedSource);
  }

  loadSavedData();
  renderAll();
  setupEventListeners();
  updateUndoRedoButtons();
  applyTheme(getPreferredTheme());
  resetZoomAndPan();
  switchTab("tab-structure");
}

// 5. Drawing & Geometry Logic

// Compute dynamic canvas dimensions based on columns and nodes
function calculateCanvasDimensions() {
  const isVertical = state.layoutOrientation === "vertical";
  const totalCols = state.columns.length;
  
  // Find maximum nodes in any column
  let maxNodes = 1;
  state.columns.forEach(col => {
    if (col.nodes.length > maxNodes) {
      maxNodes = col.nodes.length;
    }
  });

  if (isVertical) {
    // Height scales with the number of columns (vertical rows)
    const paddingY = 140;
    const rowGap = 240;
    const calculatedHeight = totalCols === 1 ? BASE_HEIGHT : (2 * paddingY + (totalCols - 1) * rowGap);
    currentCanvasHeight = Math.max(BASE_HEIGHT, calculatedHeight);

    // Width scales with maxNodes in a row
    const paddingX = 100;
    const colGap = 220;
    const calculatedWidth = maxNodes === 1 ? BASE_WIDTH : (2 * paddingX + (maxNodes - 1) * colGap);
    currentCanvasWidth = Math.max(BASE_WIDTH, calculatedWidth);
  } else {
    // Width scales with the number of columns (horizontal columns)
    const paddingX = 140;
    const colGap = 320;
    const calculatedWidth = totalCols === 1 ? BASE_WIDTH : (2 * paddingX + (totalCols - 1) * colGap);
    currentCanvasWidth = Math.max(BASE_WIDTH, calculatedWidth);

    // Height scales with maxNodes in a column
    const paddingY = 100;
    const rowGap = 160;
    const calculatedHeight = maxNodes === 1 ? BASE_HEIGHT : (2 * paddingY + (maxNodes - 1) * rowGap);
    currentCanvasHeight = Math.max(BASE_HEIGHT, calculatedHeight);
  }
}

// Compute X coordinate of a column
function getColumnX(colIndex, totalCols) {
  if (totalCols === 1) return currentCanvasWidth / 2;
  const paddingX = 140;
  const availableWidth = currentCanvasWidth - 2 * paddingX;
  return paddingX + colIndex * (availableWidth / (totalCols - 1));
}

// Compute Y coordinate of a node in a column
function getNodeY(nodeIndex, totalNodes) {
  const centerY = currentCanvasHeight / 2;
  if (totalNodes === 1) return centerY;

  const paddingY = 100;
  const availableHeight = currentCanvasHeight - 2 * paddingY;
  const maxSpacing = 160;
  const spacing = Math.min(maxSpacing, availableHeight / (totalNodes - 1));
  
  return centerY + (nodeIndex - (totalNodes - 1) / 2) * spacing;
}

// Compute exit/entry interface points between two boxes, respecting custom anchors
function getConnectionPoints(source, target, sourceAnchor = "auto", targetAnchor = "auto", sourceNode = null, targetNode = null) {
  const sx = Math.round(source.x);
  const sy = Math.round(source.y);
  const tx = Math.round(target.x);
  const ty = Math.round(target.y);

  const sW = Math.round(sourceNode ? (sourceNode.width || NODE_WIDTH) : NODE_WIDTH);
  const sH = Math.round(sourceNode ? (sourceNode.height || NODE_HEIGHT) : NODE_HEIGHT);
  const tW = Math.round(targetNode ? (targetNode.width || NODE_WIDTH) : NODE_WIDTH);
  const tH = Math.round(targetNode ? (targetNode.height || NODE_HEIGHT) : NODE_HEIGHT);

  const sHalfW = sW / 2;
  const sHalfH = sH / 2;
  const tHalfW = tW / 2;
  const tHalfH = tH / 2;

  let resolvedSourceAnchor = sourceAnchor;
  let resolvedTargetAnchor = targetAnchor;

  // 1. Resolve auto anchors based on relative positions
  if (sourceAnchor === "auto" && targetAnchor === "auto") {
    const dx = tx - sx;
    const dy = ty - sy;
    if (Math.abs(dx) >= Math.abs(dy)) {
      resolvedSourceAnchor = dx > 0 ? "right" : "left";
      resolvedTargetAnchor = dx > 0 ? "left" : "right";
    } else {
      resolvedSourceAnchor = dy > 0 ? "bottom" : "top";
      resolvedTargetAnchor = dy > 0 ? "top" : "bottom";
    }
  } else if (sourceAnchor === "auto") {
    let targetX = tx;
    let targetY = ty;
    if (targetAnchor === "top") targetY -= tHalfH;
    else if (targetAnchor === "bottom") targetY += tHalfH;
    else if (targetAnchor === "left") targetX -= tHalfW;
    else if (targetAnchor === "right") targetX += tHalfW;

    const dx = targetX - sx;
    const dy = targetY - sy;
    if (Math.abs(dx) >= Math.abs(dy)) {
      resolvedSourceAnchor = dx > 0 ? "right" : "left";
    } else {
      resolvedSourceAnchor = dy > 0 ? "bottom" : "top";
    }
  } else if (targetAnchor === "auto") {
    let sourceX = sx;
    let sourceY = sy;
    if (sourceAnchor === "top") sourceY -= sHalfH;
    else if (sourceAnchor === "bottom") sourceY += sHalfH;
    else if (sourceAnchor === "left") sourceX -= sHalfW;
    else if (sourceAnchor === "right") sourceX += sHalfW;

    const dx = tx - sourceX;
    const dy = ty - sourceY;
    if (Math.abs(dx) >= Math.abs(dy)) {
      resolvedTargetAnchor = dx > 0 ? "left" : "right";
    } else {
      resolvedTargetAnchor = dy > 0 ? "top" : "bottom";
    }
  }

  // 2. Compute final points using resolved anchors
  let x1, y1, x2, y2;

  if (resolvedSourceAnchor === "top") {
    x1 = sx;
    y1 = sy - sHalfH;
  } else if (resolvedSourceAnchor === "bottom") {
    x1 = sx;
    y1 = sy + sHalfH;
  } else if (resolvedSourceAnchor === "left") {
    x1 = sx - sHalfW;
    y1 = sy;
  } else { // right
    x1 = sx + sHalfW;
    y1 = sy;
  }

  if (resolvedTargetAnchor === "top") {
    x2 = tx;
    y2 = ty - tHalfH;
  } else if (resolvedTargetAnchor === "bottom") {
    x2 = tx;
    y2 = ty + tHalfH;
  } else if (resolvedTargetAnchor === "left") {
    x2 = tx - tHalfW;
    y2 = ty;
  } else { // right
    x2 = tx + tHalfW;
    y2 = ty;
  }

  return {
    x1: Math.round(x1),
    y1: Math.round(y1),
    x2: Math.round(x2),
    y2: Math.round(y2),
    resolvedSourceAnchor,
    resolvedTargetAnchor
  };
}

// Unicode formatting for subscripts/superscripts
const SUPER_MAP = {
  '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
  '+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾',
  'a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ','i':'ⁱ','j':'ʲ','k':'ᵏ','l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ','r':'ʳ','s':'ˢ','t':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ'
};
const SUB_MAP = {
  '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
  '+':'₊','-':'₋','=':'₌','(':'₍',')':'₎',
  'a':'ₐ','e':'ₑ','h':'ₕ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ','o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ'
};
const REVERSE_MAP = {};
Object.keys(SUPER_MAP).forEach(k => REVERSE_MAP[SUPER_MAP[k]] = k);
Object.keys(SUB_MAP).forEach(k => REVERSE_MAP[SUB_MAP[k]] = k);

function toggleUnicodeScript(text, mode) {
  const map = mode === 'super' ? SUPER_MAP : SUB_MAP;
  let allMapped = true;
  for(let i=0; i<text.length; i++) {
    if(!REVERSE_MAP[text[i]]) { allMapped = false; break; }
  }
  if(allMapped) {
    return text.split('').map(c => REVERSE_MAP[c] || c).join('');
  } else {
    return text.split('').map(c => map[c] || c).join('');
  }
}

// Auto-wrap SVG text labels into multi-line tspans dynamically
function wrapSVGText(textEl, label, maxWidth, fontSize, w = NODE_WIDTH, h = NODE_HEIGHT, textAlign = "center", verticalAlign = "middle") {
  textEl.innerHTML = "";
  if (!label || label.trim() === "") return;

  const charWidth = fontSize * 0.55;
  const maxChars = Math.floor(maxWidth / charWidth) || 1;
  const words = label.split(" ");
  const lines = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word.length * charWidth > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      let rem = word;
      while (rem.length > 0) {
        const chunk = rem.substring(0, maxChars);
        lines.push(chunk);
        rem = rem.substring(maxChars);
      }
      continue;
    }

    const testLine = currentLine ? currentLine + " " + word : word;
    if (testLine.length * charWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  const lineHeight = fontSize * 1.25;
  const maxLines = Math.floor((h - 8) / lineHeight) || 1;
  if (lines.length > maxLines) {
    lines.splice(maxLines);
    if (lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      lines[lines.length - 1] = lastLine.substring(0, Math.max(0, lastLine.length - 3)) + "...";
    }
  }

  const totalHeight = lines.length * lineHeight;
  const centerX = parseFloat(textEl.getAttribute("x"));
  const centerY = parseFloat(textEl.getAttribute("y"));
  const left = centerX - w / 2;
  const right = centerX + w / 2;
  const top = centerY - h / 2;
  const bottom = centerY + h / 2;

  let startY;
  const capHeightOffset = fontSize * 0.35;
  if (verticalAlign === "top") {
    startY = top + 8 + capHeightOffset;
  } else if (verticalAlign === "bottom") {
    startY = bottom - totalHeight - 8 + (lineHeight / 2) + capHeightOffset;
  } else {
    startY = centerY - (totalHeight / 2) + (lineHeight / 2) + capHeightOffset;
  }

  let textAnchor = "middle";
  let tspanX = centerX;
  if (textAlign === "left") {
    textAnchor = "start";
    tspanX = left + 10;
  } else if (textAlign === "right") {
    textAnchor = "end";
    tspanX = right - 10;
  }

  lines.forEach((lineText, idx) => {
    const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tspan.setAttribute("x", tspanX);
    tspan.setAttribute("y", startY + idx * lineHeight);
    tspan.setAttribute("text-anchor", textAnchor);
    tspan.setAttribute("dominant-baseline", "alphabetic");
    tspan.textContent = lineText;
    textEl.appendChild(tspan);
  });
}

// Draw path with rounded corners (using Q bezier curves) for a list of points
function drawRoundedPath(points, r = 12) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const len1 = Math.hypot(dx1, dy1);

    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const len2 = Math.hypot(dx2, dy2);

    // Adaptively scale radius if segments are short
    const currentRadius = Math.min(r, len1 / 2, len2 / 2);

    if (currentRadius <= 0.1) {
      path += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    const ax = curr.x - (dx1 / len1) * currentRadius;
    const ay = curr.y - (dy1 / len1) * currentRadius;
    const bx = curr.x + (dx2 / len2) * currentRadius;
    const by = curr.y + (dy2 / len2) * currentRadius;

    path += ` L ${ax} ${ay} Q ${curr.x} ${curr.y} ${bx} ${by}`;
  }

  path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return path;
}

// Generate SVG path for orthogonal elbow lines with custom offsets to prevent overlap
function getConnectorPath(x1, y1, x2, y2, sourceAnchor, targetAnchor, isVerticalLayout, lineOffset = 0) {
  const exitH = (sourceAnchor === "right" || sourceAnchor === "left");
  const entryH = (targetAnchor === "right" || targetAnchor === "left");

  let points = [];
  if (exitH && entryH) {
    const midX = (x1 + x2) / 2 + lineOffset;
    points = [
      { x: x1, y: y1 },
      { x: midX, y: y1 },
      { x: midX, y: y2 },
      { x: x2, y: y2 }
    ];
  } else if (!exitH && !entryH) {
    const midY = (y1 + y2) / 2 + lineOffset;
    points = [
      { x: x1, y: y1 },
      { x: x1, y: midY },
      { x: x2, y: midY },
      { x: x2, y: y2 }
    ];
  } else if (exitH && !entryH) {
    if (lineOffset === 0) {
      points = [
        { x: x1, y: y1 },
        { x: x2, y: y1 },
        { x: x2, y: y2 }
      ];
    } else {
      const midX = x1 + (x2 - x1) / 2 + lineOffset;
      const midY = (y1 + y2) / 2;
      points = [
        { x: x1, y: y1 },
        { x: midX, y: y1 },
        { x: midX, y: midY },
        { x: x2, y: midY },
        { x: x2, y: y2 }
      ];
    }
  } else {
    if (lineOffset === 0) {
      points = [
        { x: x1, y: y1 },
        { x: x1, y: y2 },
        { x: x2, y: y2 }
      ];
    } else {
      const midY = y1 + (y2 - y1) / 2 + lineOffset;
      const midX = (x1 + x2) / 2;
      points = [
        { x: x1, y: y1 },
        { x: x1, y: midY },
        { x: midX, y: midY },
        { x: midX, y: y2 },
        { x: x2, y: y2 }
      ];
    }
  }
  return drawRoundedPath(points, 12);
}

// Generate cubic Bezier path for curved lines
function getCurvedConnectorPath(x1, y1, x2, y2, sourceAnchor, targetAnchor, lineOffset = 0) {
  const getDir = (anchor, isSource) => {
    const mult = isSource ? 1 : -1;
    if (anchor === "top") return { x: 0, y: -1 * mult };
    if (anchor === "bottom") return { x: 0, y: 1 * mult };
    if (anchor === "left") return { x: -1 * mult, y: 0 };
    if (anchor === "right") return { x: 1 * mult, y: 0 };
    return { x: 0, y: 0 };
  };

  const dir1 = getDir(sourceAnchor, true);
  const dir2 = getDir(targetAnchor, false);

  const distance = Math.hypot(x2 - x1, y2 - y1);
  const strength = Math.max(30, Math.min(150, distance * 0.35));

  let ox = 0, oy = 0;
  if (lineOffset !== 0) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      ox = (-dy / len) * lineOffset;
      oy = (dx / len) * lineOffset;
    }
  }

  const cx1 = x1 + dir1.x * strength + ox;
  const cy1 = y1 + dir1.y * strength + oy;
  const cx2 = x2 + dir2.x * strength + ox;
  const cy2 = y2 + dir2.y * strength + oy;

  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

// Calculate midpoint coordinates of straight, elbow, or curved connectors to center the text label
function getConnectorMidpoint(x1, y1, x2, y2, sourceAnchor, targetAnchor, shape, lineOffset = 0) {
  if (shape === "straight") {
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
  } else if (shape === "orthogonal") {
    const exitH = (sourceAnchor === "right" || sourceAnchor === "left");
    const entryH = (targetAnchor === "right" || targetAnchor === "left");
    if (exitH && entryH) {
      const midX = (x1 + x2) / 2 + lineOffset;
      return { x: midX, y: (y1 + y2) / 2 };
    } else if (!exitH && !entryH) {
      const midY = (y1 + y2) / 2 + lineOffset;
      return { x: (x1 + x2) / 2, y: midY };
    } else if (exitH && !entryH) {
      if (lineOffset === 0) {
        return { x: x2, y: y1 };
      } else {
        const midX = x1 + (x2 - x1) / 2 + lineOffset;
        return { x: midX, y: (y1 + y2) / 2 };
      }
    } else {
      if (lineOffset === 0) {
        return { x: x1, y: y2 };
      } else {
        const midY = y1 + (y2 - y1) / 2 + lineOffset;
        return { x: (x1 + x2) / 2, y: midY };
      }
    }
  } else if (shape === "curved") {
    const getDir = (anchor, isSource) => {
      const mult = isSource ? 1 : -1;
      if (anchor === "top") return { x: 0, y: -1 * mult };
      if (anchor === "bottom") return { x: 0, y: 1 * mult };
      if (anchor === "left") return { x: -1 * mult, y: 0 };
      if (anchor === "right") return { x: 1 * mult, y: 0 };
      return { x: 0, y: 0 };
    };

    const dir1 = getDir(sourceAnchor, true);
    const dir2 = getDir(targetAnchor, false);

    const distance = Math.hypot(x2 - x1, y2 - y1);
    const strength = Math.max(30, Math.min(150, distance * 0.35));

    let ox = 0, oy = 0;
    if (lineOffset !== 0) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        ox = (-dy / len) * lineOffset;
        oy = (dx / len) * lineOffset;
      }
    }

    const cx1 = x1 + dir1.x * strength + ox;
    const cy1 = y1 + dir1.y * strength + oy;
    const cx2 = x2 + dir2.x * strength + ox;
    const cy2 = y2 + dir2.y * strength + oy;

    const x12 = (x1 + cx1) / 2;
    const y12 = (y1 + cy1) / 2;
    const x23 = (cx1 + cx2) / 2;
    const y23 = (cy1 + cy2) / 2;
    const x34 = (cx2 + x2) / 2;
    const y34 = (cy2 + y2) / 2;

    const x123 = (x12 + x23) / 2;
    const y123 = (y12 + y23) / 2;
    const x234 = (x23 + x34) / 2;
    const y234 = (y23 + y34) / 2;

    return { x: (x123 + x234) / 2, y: (y123 + y234) / 2 };
  }
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
}

// Master Render loop
function renderAll() {
  calculateCoordinates();
  renderSVG();
  renderSidebarStructure();
  renderSidebarSelection();
  updateStrokeWidthStyles();
  renderMinimap();
}

// Compute Y coordinate of a row in vertical layout
function getVerticalRowY(colIdx, totalCols) {
  if (totalCols === 1) return currentCanvasHeight / 2;
  const paddingY = 140;
  const availableHeight = currentCanvasHeight - 2 * paddingY;
  return paddingY + colIdx * (availableHeight / (totalCols - 1));
}

// Compute X coordinate of a node inside a row in vertical layout
function getVerticalNodeX(nodeIdx, totalNodes) {
  const centerX = currentCanvasWidth / 2;
  if (totalNodes === 1) return centerX;
  const paddingX = 100;
  const availableWidth = currentCanvasWidth - 2 * paddingX;
  const maxSpacing = 220;
  const spacing = Math.min(maxSpacing, availableWidth / (totalNodes - 1));
  return centerX + (nodeIdx - (totalNodes - 1) / 2) * spacing;
}

// Helper to find a node by ID in state
function validateAndClampNode(node) {
  if (!node) return;
  if (node.width !== undefined) {
    if (isNaN(node.width) || typeof node.width !== "number" || node.width <= 0) {
      node.width = NODE_WIDTH;
    } else {
      node.width = Math.max(20, Math.min(2000, node.width));
    }
  }
  if (node.height !== undefined) {
    if (isNaN(node.height) || typeof node.height !== "number" || node.height <= 0) {
      node.height = NODE_HEIGHT;
    } else {
      node.height = Math.max(20, Math.min(2000, node.height));
    }
  }
  if (node.x !== undefined) {
    if (isNaN(node.x) || typeof node.x !== "number") {
      delete node.x;
    } else {
      node.x = Math.max(-5000, Math.min(5000, node.x));
    }
  }
  if (node.y !== undefined) {
    if (isNaN(node.y) || typeof node.y !== "number") {
      delete node.y;
    } else {
      node.y = Math.max(-5000, Math.min(5000, node.y));
    }
  }
}

function findNodeById(nodeId) {
  let found = null;
  state.columns.forEach(col => {
    col.nodes.forEach(node => {
      if (node.id === nodeId) {
        found = node;
      }
    });
  });
  return found;
}

// Center-zoom focus to a specific node on the canvas
function zoomToNode(nodeId) {
  const pos = nodeCoords[nodeId];
  if (!pos) return;
  
  const viewport = document.querySelector(".canvas-viewport");
  if (!viewport) return;
  
  const vWidth = viewport.clientWidth;
  const vHeight = viewport.clientHeight;
  
  // Set a pleasant zoom level for focus (e.g. 1.25)
  zoom = 1.25;
  
  // Center coordinates
  panX = vWidth / 2 - pos.x * zoom;
  panY = vHeight / 2 - pos.y * zoom;
  
  applyZoomPan();
  
  // Temporarily add a locator target animation
  const nodeEl = document.getElementById(`node-${nodeId}`);
  if (nodeEl) {
    nodeEl.classList.remove("temp-focus-highlight");
    void nodeEl.offsetWidth; // Force reflow
    nodeEl.classList.add("temp-focus-highlight");
    setTimeout(() => {
      nodeEl.classList.remove("temp-focus-highlight");
    }, 1500);
  }
}

// Map each node to its coordinate position
function calculateCoordinates() {
  calculateCanvasDimensions();
  nodeCoords = {};
  const totalCols = state.columns.length;
  const isVertical = state.layoutOrientation === "vertical";
  
  state.columns.forEach((col, colIdx) => {
    const totalNodes = col.nodes.length;
    
    col.nodes.forEach((node, nodeIdx) => {
      let x, y;
      if (node.x !== undefined && node.y !== undefined) {
        x = node.x;
        y = node.y;
      } else {
        if (isVertical) {
          x = getVerticalNodeX(nodeIdx, totalNodes);
          y = getVerticalRowY(colIdx, totalCols);
        } else {
          x = getColumnX(colIdx, totalCols);
          y = getNodeY(nodeIdx, totalNodes);
        }
      }
      
      nodeCoords[node.id] = {
        x: x,
        y: y,
        colId: col.id,
        colIdx: colIdx
      };
    });
  });
}

// Draw the dynamic flowchart into SVG
function renderSVG() {
  // Clear lists
  connectorsGroup.innerHTML = "";
  nodesGroup.innerHTML = "";

  // Clear existing gradients from defs
  const defsEl = svgEl.querySelector("defs");
  if (defsEl) {
    const existingGradients = defsEl.querySelectorAll("linearGradient, radialGradient");
    existingGradients.forEach(g => g.remove());
  }

  // Set SVG viewBox and dimensions dynamically
  svgEl.setAttribute("viewBox", `0 0 ${currentCanvasWidth} ${currentCanvasHeight}`);
  svgEl.setAttribute("width", currentCanvasWidth);
  svgEl.setAttribute("height", currentCanvasHeight);

  // Dynamic Grid Pattern in defs
  if (defsEl) {
    const oldPattern = defsEl.querySelector("#svg-grid-pattern");
    if (oldPattern) oldPattern.remove();

    if (state.gridStyle && state.gridStyle !== "off") {
      const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
      pattern.setAttribute("id", "svg-grid-pattern");
      const size = state.gridSize || 20;
      pattern.setAttribute("width", size);
      pattern.setAttribute("height", size);
      pattern.setAttribute("patternUnits", "userSpaceOnUse");

      if (state.gridStyle === "dots") {
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", "1.5");
        dot.setAttribute("cy", "1.5");
        dot.setAttribute("r", "1.5");
        dot.setAttribute("fill", "var(--grid-dot)");
        pattern.appendChild(dot);
      } else if (state.gridStyle === "lines") {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M ${size} 0 L 0 0 0 ${size}`);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "var(--grid-dot)");
        path.setAttribute("stroke-width", "0.5");
        pattern.appendChild(path);
      }
      defsEl.appendChild(pattern);
    }
  }

  // Draw visual grid rect as the first child of the SVG
  const existingGridRect = svgEl.querySelector("#svg-grid-background-rect");
  if (existingGridRect) existingGridRect.remove();

  if (state.gridStyle && state.gridStyle !== "off") {
    const gridRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    gridRect.setAttribute("id", "svg-grid-background-rect");
    gridRect.setAttribute("width", currentCanvasWidth);
    gridRect.setAttribute("height", currentCanvasHeight);
    gridRect.setAttribute("fill", "url(#svg-grid-pattern)");
    gridRect.setAttribute("class", "svg-grid-background");
    svgEl.insertBefore(gridRect, svgEl.firstChild);
  }

  // Toggle standard CSS dots overlay
  const canvasBg = document.querySelector(".canvas-bg");
  if (canvasBg) {
    if (state.gridStyle && state.gridStyle !== "off") {
      canvasBg.style.backgroundImage = "none";
    } else {
      canvasBg.style.backgroundImage = "";
    }
  }

  const totalCols = state.columns.length;

  // Draw Chart Title at the top center
  if (state.chartTitle && state.chartTitle.trim() !== "") {
    const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleText.setAttribute("x", currentCanvasWidth / 2);
    titleText.setAttribute("y", 35);
    titleText.setAttribute("class", "chart-title-text");
    titleText.setAttribute("text-anchor", "middle");
    titleText.textContent = state.chartTitle;
    
    // Set active font family
    const savedFontName = safeStorage.getItem("flowchart_font_name");
    const fontStr = savedFontName ? `'${savedFontName}', Inter, system-ui, sans-serif` : "Inter, system-ui, sans-serif";
    titleText.style.fontFamily = fontStr;
    
    connectorsGroup.appendChild(titleText);
  }

  // Draw Swimlanes background if enabled
  if (state.showSwimlanes) {
    const isVertical = state.layoutOrientation === "vertical";
    state.columns.forEach((col, colIdx) => {
      let x, y, width, height;
      
      if (isVertical) {
        // Horizontal lanes (rows)
        const rowY = getVerticalRowY(colIdx, totalCols);
        const prevY = colIdx === 0 ? 0 : (getVerticalRowY(colIdx - 1, totalCols) + rowY) / 2;
        const nextY = colIdx === totalCols - 1 ? currentCanvasHeight : (getVerticalRowY(colIdx + 1, totalCols) + rowY) / 2;
        
        x = 0;
        y = prevY;
        width = currentCanvasWidth;
        height = nextY - prevY;
      } else {
        // Vertical lanes (columns)
        const colX = getColumnX(colIdx, totalCols);
        const prevX = colIdx === 0 ? 0 : (getColumnX(colIdx - 1, totalCols) + colX) / 2;
        const nextX = colIdx === totalCols - 1 ? currentCanvasWidth : (getColumnX(colIdx + 1, totalCols) + colX) / 2;
        
        x = prevX;
        y = 0;
        width = nextX - prevX;
        height = currentCanvasHeight;
      }

      const laneRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      laneRect.setAttribute("x", x);
      laneRect.setAttribute("y", y);
      laneRect.setAttribute("width", width);
      laneRect.setAttribute("height", height);
      laneRect.setAttribute("class", "swimlane-rect");
      
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      let fill;
      if (isDark) {
        fill = colIdx % 2 === 0 ? "rgba(255, 255, 255, 0.015)" : "rgba(255, 255, 255, 0.035)";
      } else {
        fill = colIdx % 2 === 0 ? "rgba(0, 0, 0, 0.008)" : "rgba(0, 0, 0, 0.024)";
      }
      laneRect.setAttribute("fill", fill);
      
      const borderStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
      laneRect.setAttribute("stroke", borderStyle);
      laneRect.setAttribute("stroke-dasharray", "4, 4");
      laneRect.setAttribute("stroke-width", "1");
      
      connectorsGroup.appendChild(laneRect);
    });
  }

  // A. Draw Column/Row Guidelines & Labels first
  state.columns.forEach((col, colIdx) => {
    const isVertical = state.layoutOrientation === "vertical";
    
    if (isVertical) {
      const rowY = getVerticalRowY(colIdx, totalCols);
      
      // Draw horizontal guide separating rows
      if (totalCols > 1 && state.showColumnGuides !== false) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", 0);
        line.setAttribute("y1", rowY);
        line.setAttribute("x2", currentCanvasWidth);
        line.setAttribute("y2", rowY);
        line.setAttribute("class", "column-guide");
        connectorsGroup.appendChild(line);
      }
      
      // Draw row title at the left margin
      if (state.showColumnTitles !== false) {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", 45);
        text.setAttribute("y", rowY - 10);
        text.setAttribute("class", "column-header-text");
        text.setAttribute("text-anchor", "start");
        text.textContent = col.title || `Row ${colIdx + 1}`;
        connectorsGroup.appendChild(text);
      }
    } else {
      // Horizontal Column Layout
      const colX = getColumnX(colIdx, totalCols);
      
      // Draw vertical guide separating columns
      if (totalCols > 1 && state.showColumnGuides !== false) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", colX);
        line.setAttribute("y1", 0);
        line.setAttribute("x2", colX);
        line.setAttribute("y2", currentCanvasHeight);
        line.setAttribute("class", "column-guide");
        connectorsGroup.appendChild(line);
      }
      
      // Draw column title at the top
      if (state.showColumnTitles !== false) {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", colX);
        text.setAttribute("y", 70);
        text.setAttribute("class", "column-header-text");
        text.setAttribute("text-anchor", "middle");
        text.textContent = col.title || `Column ${colIdx + 1}`;
        connectorsGroup.appendChild(text);
      }
    }
  });

  // B. Draw Connectors (Lines with Custom Markers and Offsets)
  state.columns.forEach(col => {
    col.nodes.forEach(node => {
      node.targets.forEach(targetVal => {
        const isObj = typeof targetVal === "object" && targetVal !== null;
        const targetId = isObj ? targetVal.id : targetVal;
        const sourceAnchor = isObj ? (targetVal.sourceAnchor || "auto") : "auto";
        const targetAnchor = isObj ? (targetVal.targetAnchor || "auto") : "auto";
        const markerType = isObj ? (targetVal.markerType || "arrow") : "arrow";
        const lineOffset = isObj ? (targetVal.lineOffset || 0) : 0;

        const sourcePos = nodeCoords[node.id];
        const targetPos = nodeCoords[targetId];
        
        // Ignore if source or target coordinates are missing (dangling references)
        if (!sourcePos || !targetPos) return;

        const targetNode = findNodeById(targetId);
        const points = getConnectionPoints(sourcePos, targetPos, sourceAnchor, targetAnchor, node, targetNode);

        const customShape = isObj ? (targetVal.lineShape || "auto") : "auto";
        const shape = customShape !== "auto" ? customShape : (state.lineShape || "orthogonal");

        const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let pathData = "";
        
        if (shape === "straight") {
          pathData = `M ${points.x1} ${points.y1} L ${points.x2} ${points.y2}`;
        } else if (shape === "curved") {
          pathData = getCurvedConnectorPath(
            points.x1, points.y1, 
            points.x2, points.y2, 
            points.resolvedSourceAnchor, points.resolvedTargetAnchor,
            lineOffset
          );
        } else {
          // orthogonal (elbow)
          pathData = getConnectorPath(
            points.x1, points.y1, 
            points.x2, points.y2, 
            points.resolvedSourceAnchor, points.resolvedTargetAnchor, 
            state.layoutOrientation === "vertical",
            lineOffset
          );
        }

        const isConnSelected = selectedConnector && 
                               selectedConnector.sourceId === node.id && 
                               selectedConnector.targetId === targetId;

        pathEl.setAttribute("d", pathData);
        
        const lineStyle = isObj && targetVal.strokeStyle ? targetVal.strokeStyle : state.lineStyle;
        pathEl.setAttribute("class", `connector-line ${lineStyle === "dashed" ? "dashed" : ""} ${isConnSelected ? "selected" : ""}`);
        
        const themeColor = document.documentElement.getAttribute("data-theme") === "dark" ? "#a3a3a3" : "#171717";
        const strokeColor = isObj && targetVal.strokeColor ? targetVal.strokeColor : themeColor;
        pathEl.style.stroke = strokeColor;
        pathEl.style.color = strokeColor;
        
        const strokeW = isObj && targetVal.strokeWidth ? targetVal.strokeWidth : state.strokeWidth;
        pathEl.style.strokeWidth = `${strokeW}px`;
        
        if (markerType === "arrow") {
          pathEl.setAttribute("marker-end", "url(#arrow)");
        } else if (markerType === "dot") {
          pathEl.setAttribute("marker-end", "url(#marker-dot)");
        } else {
          pathEl.removeAttribute("marker-end");
        }
        
        pathEl.dataset.source = node.id;
        pathEl.dataset.target = targetId;

        connectorsGroup.appendChild(pathEl);

        // Flow Animation overlay
        const isAnimated = isObj && targetVal.animated !== undefined ? targetVal.animated : (state.animatedFlow !== "off");
        if (isAnimated) {
          const flowEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
          flowEl.setAttribute("d", pathData);
          flowEl.setAttribute("class", "connector-flow-animation");
          flowEl.style.stroke = strokeColor;
          flowEl.style.strokeWidth = `${Math.max(1.5, strokeW * 0.85)}px`;
          connectorsGroup.appendChild(flowEl);
        }

        // Add interactive overlay path for clicking
        const overlay = document.createElementNS("http://www.w3.org/2000/svg", "path");
        overlay.setAttribute("d", pathData);
        overlay.setAttribute("class", "connector-line-interactive-overlay");
        overlay.dataset.source = node.id;
        overlay.dataset.target = targetId;
        
        overlay.addEventListener("mouseenter", () => {
          pathEl.classList.add("hovered");
        });
        overlay.addEventListener("mouseleave", () => {
          pathEl.classList.remove("hovered");
        });
        overlay.addEventListener("click", (e) => {
          e.stopPropagation();
          selectConnector(node.id, targetId);
        });
        
        connectorsGroup.appendChild(overlay);

        // Render connection line label if available
        if (isObj && targetVal.label && targetVal.label.trim() !== "") {
          const mid = getConnectorMidpoint(
            points.x1, points.y1,
            points.x2, points.y2,
            points.resolvedSourceAnchor, points.resolvedTargetAnchor,
            shape,
            lineOffset
          );

          const labelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
          labelGroup.setAttribute("class", "connector-label-group");
          
          const labelRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          labelRect.setAttribute("class", "connector-label-bg");
          labelRect.setAttribute("rx", "3");
          labelRect.setAttribute("ry", "3");
          labelRect.style.fill = "var(--panel-bg)";
          labelRect.style.stroke = "var(--panel-border)";
          labelRect.style.strokeWidth = "0.5px";

          const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          labelText.setAttribute("class", "connector-label-text");
          labelText.setAttribute("x", mid.x);
          labelText.setAttribute("y", mid.y);
          labelText.setAttribute("text-anchor", "middle");
          labelText.setAttribute("dominant-baseline", "middle");
          
          const lColor = isObj && targetVal.labelColor ? targetVal.labelColor : "var(--text-secondary)";
          const lFontSize = isObj && targetVal.labelFontSize ? targetVal.labelFontSize : 9;
          const lFontFamily = isObj && targetVal.labelFontFamily ? targetVal.labelFontFamily : "var(--font-mono)";
          
          labelText.style.fill = lColor;
          labelText.style.fontSize = `${lFontSize}px`;
          labelText.style.fontFamily = lFontFamily;
          labelText.textContent = targetVal.label;

          labelGroup.appendChild(labelRect);
          labelGroup.appendChild(labelText);
          connectorsGroup.appendChild(labelGroup);

          const textLen = targetVal.label.length * (lFontSize * 0.58) + 8;
          labelRect.setAttribute("width", textLen);
          labelRect.setAttribute("height", lFontSize + 5);
          labelRect.setAttribute("x", mid.x - textLen / 2);
          labelRect.setAttribute("y", mid.y - (lFontSize + 5) / 2);
        }
      });
    });
  });

  // C. Draw Nodes (Box rectangles and labels, supporting custom style properties)
  const allNodesToRender = [];
  state.columns.forEach((col, cIdx) => {
    col.nodes.forEach((node, nIdx) => {
      allNodesToRender.push({ node, cIdx, nIdx });
    });
  });
  
  // Sort by zIndex, then fallback to column order if zIndex matches
  allNodesToRender.sort((a, b) => {
    const zA = a.node.zIndex || 0;
    const zB = b.node.zIndex || 0;
    if (zA !== zB) return zA - zB;
    if (a.cIdx !== b.cIdx) return a.cIdx - b.cIdx;
    return a.nIdx - b.nIdx;
  });

  allNodesToRender.forEach(({ node }) => {
    const pos = nodeCoords[node.id];
    if (!pos) return;

      const isSelected = selectedNodeIds.has(node.id);
      const isConnectingSource = connectionSourceId === node.id;

      // Check if search query matches this node
      const searchQuery = nodeSearchInput ? nodeSearchInput.value.trim().toLowerCase() : "";
      const isSearchMatch = searchQuery !== "" && (
        node.label.toLowerCase().includes(searchQuery) ||
        node.id.toLowerCase().includes(searchQuery)
      );

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", `node-group ${isSelected ? "selected" : ""} ${isConnectingSource ? "connecting-source" : ""} ${isSearchMatch ? "search-match" : ""}`);
      g.setAttribute("id", `node-${node.id}`);
      g.dataset.id = node.id;

      // Render based on shape
      let shapeEl;
      const w = node.width || NODE_WIDTH;
      const h = node.height || NODE_HEIGHT;
      const left = pos.x - w / 2;
      const top = pos.y - h / 2;
      const right = pos.x + w / 2;
      const bottom = pos.y + h / 2;
      
      const shapeType = node.shape || "rect";
      
      if (shapeType === "diamond") {
        shapeEl = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        shapeEl.setAttribute("points", `${pos.x},${top} ${right},${pos.y} ${pos.x},${bottom} ${left},${pos.y}`);
      } else if (shapeType === "oval") {
        shapeEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        shapeEl.setAttribute("x", left);
        shapeEl.setAttribute("y", top);
        shapeEl.setAttribute("width", w);
        shapeEl.setAttribute("height", h);
        shapeEl.setAttribute("rx", h / 2);
        shapeEl.setAttribute("ry", h / 2);
      } else if (shapeType === "parallelogram") {
        shapeEl = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const skew = 20;
        shapeEl.setAttribute("points", `${left + skew},${top} ${right},${top} ${right - skew},${bottom} ${left},${bottom}`);
      } else if (shapeType === "cylinder") {
        shapeEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const ry = 6;
        shapeEl.setAttribute("d", `M ${left} ${top + ry} A ${w/2} ${ry} 0 0 1 ${right} ${top + ry} V ${bottom - ry} A ${w/2} ${ry} 0 0 1 ${left} ${bottom - ry} Z M ${left} ${top + ry} A ${w/2} ${ry} 0 0 0 ${right} ${top + ry}`);
      } else if (shapeType === "roundrect") {
        shapeEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        shapeEl.setAttribute("x", left);
        shapeEl.setAttribute("y", top);
        shapeEl.setAttribute("width", w);
        shapeEl.setAttribute("height", h);
        shapeEl.setAttribute("rx", node.rx !== undefined ? node.rx : 15);
      } else {
        // default "rect"
        shapeEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        shapeEl.setAttribute("x", left);
        shapeEl.setAttribute("y", top);
        shapeEl.setAttribute("width", w);
        shapeEl.setAttribute("height", h);
        shapeEl.setAttribute("rx", node.rx !== undefined ? node.rx : "0");
      }
      
      shapeEl.setAttribute("class", "node-rect");
      
      const theme = document.documentElement.getAttribute("data-theme") || "light";
      const defFill = theme === "dark" ? "#121212" : "#ffffff";
      
      // Gradient / Fill type support
      const fillType = node.fillType || "solid";
      if (fillType === "solid" || !defsEl) {
        shapeEl.style.fill = node.fill || defFill;
      } else {
        const gradId = `grad-${node.id}`;
        let gradEl;
        if (fillType === "linear") {
          gradEl = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
          gradEl.setAttribute("id", gradId);
          gradEl.setAttribute("x1", "0%");
          gradEl.setAttribute("y1", "0%");
          gradEl.setAttribute("x2", "100%");
          gradEl.setAttribute("y2", "0%");
          gradEl.setAttribute("gradientTransform", `rotate(${node.gradientAngle || 0}, 0.5, 0.5)`);
        } else if (fillType === "radial") {
          gradEl = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
          gradEl.setAttribute("id", gradId);
          gradEl.setAttribute("cx", "50%");
          gradEl.setAttribute("cy", "50%");
          gradEl.setAttribute("r", "50%");
        }
        
        if (gradEl) {
          const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
          stop1.setAttribute("offset", "0%");
          stop1.setAttribute("stop-color", node.fill || defFill);
          
          const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
          stop2.setAttribute("offset", "100%");
          stop2.setAttribute("stop-color", node.fillColor2 || "#ffffff");
          
          gradEl.appendChild(stop1);
          gradEl.appendChild(stop2);
          defsEl.appendChild(gradEl);
          
          shapeEl.style.fill = `url(#${gradId})`;
        } else {
          shapeEl.style.fill = node.fill || defFill;
        }
      }

      if (node.stroke) {
        shapeEl.style.stroke = node.stroke;
      }
      
      // Border style support
      const borderStyle = node.borderStyle || "solid";
      if (borderStyle === "dashed") {
        shapeEl.setAttribute("stroke-dasharray", "6, 4");
      } else if (borderStyle === "dotted") {
        shapeEl.setAttribute("stroke-dasharray", "2, 3");
      } else {
        shapeEl.removeAttribute("stroke-dasharray");
      }

      // Drop shadow support
      const shadowType = node.shadowType || "none";
      let filterVal = "";
      if (shadowType === "sm") {
        filterVal = "drop-shadow(0px 1.5px 3px rgba(0, 0, 0, 0.12))";
      } else if (shadowType === "md") {
        filterVal = "drop-shadow(0px 3.5px 7px rgba(0, 0, 0, 0.15))";
      } else if (shadowType === "lg") {
        filterVal = "drop-shadow(0px 7.5px 15px rgba(0, 0, 0, 0.18))";
      } else if (shadowType === "custom") {
        const dx = node.shadowOffsetX !== undefined ? node.shadowOffsetX : 4;
        const dy = node.shadowOffsetY !== undefined ? node.shadowOffsetY : 4;
        const blur = node.shadowBlur !== undefined ? node.shadowBlur : 8;
        const color = node.shadowColor || "rgba(0,0,0,0.2)";
        filterVal = `drop-shadow(${dx}px ${dy}px ${blur}px ${color})`;
      }
      shapeEl.style.filter = filterVal;

      // Label text
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", pos.x);
      text.setAttribute("y", pos.y);
      text.setAttribute("class", "node-text");

      if (node.textColor) {
        text.style.fill = node.textColor;
      }
      
      // Text styling
      text.style.fontSize = `${node.fontSize || 12}px`;
      text.style.fontWeight = node.fontWeight || "500";
      text.style.fontStyle = node.fontStyle || "normal";
      text.style.textDecoration = node.textDecoration || "none";
      if (node.fontFamily) {
        text.style.fontFamily = node.fontFamily;
      }

      wrapSVGText(text, node.label, w - 20, node.fontSize || 12, w, h, node.textAlign || "center", node.verticalAlign || "middle");

      g.appendChild(shapeEl);
      g.appendChild(text);

      // Draw padlock indicator if position is locked
      if (node.locked) {
        const padX = right - 18;
        const padY = top + 6;
        const padlock = document.createElementNS("http://www.w3.org/2000/svg", "g");
        padlock.setAttribute("class", "node-lock-indicator");
        padlock.setAttribute("transform", `translate(${padX}, ${padY})`);
        padlock.innerHTML = `
          <rect x="2" y="5" width="8" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2" />
          <path d="M4 5 V3.5 A 2 2 0 0 1 8 3.5 V5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        `;
        const padColor = node.textColor || "var(--text-primary)";
        padlock.setAttribute("stroke", padColor);
        padlock.style.color = padColor;
        g.appendChild(padlock);
      }

      if (isSelected && !node.locked) {
        // Draw 8 resize handles
        const handles = [
          { dir: 'nw', x: left, y: top },
          { dir: 'n', x: pos.x, y: top },
          { dir: 'ne', x: right, y: top },
          { dir: 'e', x: right, y: pos.y },
          { dir: 'se', x: right, y: bottom },
          { dir: 's', x: pos.x, y: bottom },
          { dir: 'sw', x: left, y: bottom },
          { dir: 'w', x: left, y: pos.y }
        ];
        handles.forEach(h => {
          const handle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          handle.setAttribute("class", "resize-handle");
          handle.setAttribute("data-dir", h.dir);
          handle.setAttribute("data-id", node.id);
          handle.setAttribute("x", h.x - 4);
          handle.setAttribute("y", h.y - 4);
          handle.setAttribute("width", 8);
          handle.setAttribute("height", 8);
          g.appendChild(handle);
        });
      }

      nodesGroup.appendChild(g);

      // Box click handler: selects the box or connects
      g.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isSpacePressed) return;
        
        // Save any active inline edit before selection changes
        commitInlineEdit();

        if (activeTool === "connect") {
          handleConnectionToolClick(node.id);
        } else {
          // Select tool mode
          if (e.shiftKey) {
            // Toggle node in multi-selection
            if (selectedNodeIds.has(node.id)) {
              selectedNodeIds.delete(node.id);
            } else {
              selectedNodeIds.add(node.id);
            }
            selectNode(null, false); // sync views without clearing others
          } else {
            selectNode(node.id);
          }
        }
      });

      // Double-click to edit text inside the box directly
      g.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        if (isSpacePressed) return;
        if (activeTool === "select") {
          startInlineEditing(node.id);
        }
      });
  });
  
  // Clear selection if clicking on empty canvas space
  svgEl.addEventListener("click", (e) => {
    if (isSpacePressed) return;
    
    // If the click is the end of a drag, don't clear selection!
    const dragDistance = Math.hypot(e.clientX - selectionStart.x, e.clientY - selectionStart.y);
    if (dragDistance > 5) {
      return; // ignore click event
    }
    
    commitInlineEdit();
    
    if (activeTool === "connect" && connectionSourceId) {
      connectionSourceId = null;
      document.querySelectorAll(".node-group").forEach(g => g.classList.remove("connecting-source"));
      showToast("Connection drawing cancelled.");
    } else {
      selectNode(null);
    }
  });
}

// Set active selection
function selectNode(id, clearOthers = true, ignoreGroup = false) {
  const hadConnector = selectedConnector !== null;
  selectedConnector = null;
  if (clearOthers) {
    selectedNodeIds.clear();
  }
  if (id) {
    selectedNodeIds.add(id);
    if (!ignoreGroup) {
      const nodeObj = findNodeById(id);
      if (nodeObj && nodeObj.groupId) {
        state.columns.forEach(col => col.nodes.forEach(n => {
          if (n.groupId === nodeObj.groupId) selectedNodeIds.add(n.id);
        }));
      }
    }
    selectedNodeId = selectedNodeIds.size === 1 ? id : null;
  } else {
    selectedNodeId = selectedNodeIds.size === 1 ? Array.from(selectedNodeIds)[0] : null;
  }
  if (selectedNodeIds.size !== 1) {
    selectedNodeId = null;
  }
  
  // Sync selected highlight on canvas
  document.querySelectorAll(".node-group").forEach(g => {
    const isSelected = selectedNodeIds.has(g.dataset.id);
    g.classList.toggle("selected", isSelected);
  });

  // Auto-switch to Inspector tab if something is selected and we were on Structure
  if (selectedNodeIds.size > 0 && activeSidebarTab === "tab-structure") {
    switchTab("tab-properties");
  }

  renderSidebarSelection();
  
  // Highlight corresponding list item in sidebar
  document.querySelectorAll(".structure-node-item").forEach(item => {
    const isSelected = selectedNodeIds.has(item.dataset.id);
    item.classList.toggle("selected", isSelected);
  });

  if (hadConnector) {
    renderAll();
  }
}

// 6. Sidebar Panels Rendering

// Left structure: Column lists and node management
function renderSidebarStructure() {
  structureContainer.innerHTML = "";
  
  const searchQuery = nodeSearchInput ? nodeSearchInput.value.trim().toLowerCase() : "";
  
  state.columns.forEach((col, colIdx) => {
    // Filter nodes matching the search query
    const matchingNodes = col.nodes.filter(node => {
      if (searchQuery === "") return true;
      return node.label.toLowerCase().includes(searchQuery) || node.id.toLowerCase().includes(searchQuery);
    });
    
    // If searching and column has no matching nodes, don't show the column at all
    if (searchQuery !== "" && matchingNodes.length === 0) {
      return;
    }
    
    const colItem = document.createElement("div");
    colItem.className = "structure-column-item";
    colItem.dataset.id = col.id;
    
    // Column title and delete icon
    const header = document.createElement("div");
    header.className = "structure-column-header";
    const isVertical = state.layoutOrientation === "vertical";
    const titleVal = col.title || (isVertical ? `Row ${colIdx + 1}` : `Column ${colIdx + 1}`);
    header.innerHTML = `
      <input type="text" class="column-title-input text-input" value="${titleVal}" style="padding: 2px 6px; font-size: 11px; font-weight: 600; width: 140px; background: transparent; border: none; border-bottom: 1px dashed var(--panel-border); color: var(--text-primary); text-transform: uppercase;" title="Rename Lane" />
      ${state.columns.length > 1 && searchQuery === "" ? `
        <button class="btn-icon-sm delete-col-btn" title="Delete Column">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 2px;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          Delete
        </button>
      ` : ""}
    `;
    
    // Wire renaming action
    const colInput = header.querySelector(".column-title-input");
    colInput.addEventListener("input", (e) => {
      col.title = e.target.value;
      renderSVG();
      saveData();
    });
    
    // Wire delete column action
    const deleteColBtn = header.querySelector(".delete-col-btn");
    if (deleteColBtn) {
      deleteColBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeColumn(col.id);
      });
    }
    
    colItem.appendChild(header);

    // Nodes List inside this column
    const nodeList = document.createElement("div");
    nodeList.className = "structure-node-list";
    
    matchingNodes.forEach(node => {
      const nodeItem = document.createElement("div");
      nodeItem.className = `structure-node-item ${selectedNodeIds.has(node.id) ? "selected" : ""}`;
      nodeItem.dataset.id = node.id;
      
      const displayName = node.label.trim() !== "" ? node.label : `(Empty Box)`;
      nodeItem.innerHTML = `
        <span class="node-label-span">${displayName}</span>
        <div style="display: flex; align-items: center; gap: 4px;">
          <span class="node-id-tag">${node.id}</span>
          <button class="locate-node-btn" title="Center canvas on this box" style="background: none; border: none; padding: 2px; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
            </svg>
          </button>
        </div>
      `;
      
      nodeItem.addEventListener("click", (e) => {
        e.stopPropagation();
        selectNode(node.id);
        zoomToNode(node.id);
      });
      
      const locateBtn = nodeItem.querySelector(".locate-node-btn");
      if (locateBtn) {
        locateBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          selectNode(node.id);
          zoomToNode(node.id);
        });
      }
      
      nodeList.appendChild(nodeItem);
    });
    
    colItem.appendChild(nodeList);

    // "+ Add Node" button inside this column
    if (searchQuery === "") {
      const addNodeBtn = document.createElement("button");
      addNodeBtn.className = "btn";
      addNodeBtn.style.padding = "6px";
      addNodeBtn.style.fontSize = "11px";
      addNodeBtn.textContent = "+ Add Box";
      addNodeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        addNodeToColumn(col.id);
      });
      colItem.appendChild(addNodeBtn);
    }

    structureContainer.appendChild(colItem);
  });
}

// Selected node inputs and targets grid in the sidebar
function renderMultiSelectionPanel() {
  selectionSettingsContainer.innerHTML = "";
  
  const header = document.createElement("div");
  header.style.marginBottom = "14px";
  header.innerHTML = `
    <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm8-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z"/></svg>
      Multi-Box Selection (${selectedNodeIds.size} Selected)
    </div>
    <span style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; display: block;">
      Modify styles or delete all selected boxes at once.
    </span>
  `;
  selectionSettingsContainer.appendChild(header);

  // Layout & Alignment Section
  const layoutWrapper = document.createElement("div");
  layoutWrapper.className = "input-field-wrapper";
  layoutWrapper.innerHTML = `
    <label>Alignment & Distribution</label>
    <div style="display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--panel-border); padding: 10px; background-color: var(--bg-color); margin-bottom: 12px;">
      <div style="display: flex; gap: 4px; justify-content: space-between;">
        <button class="btn btn-secondary" id="align-left-btn" title="Align Left" style="flex: 1; padding: 4px;">|&larr;</button>
        <button class="btn btn-secondary" id="align-center-btn" title="Align Center" style="flex: 1; padding: 4px;">&harr;</button>
        <button class="btn btn-secondary" id="align-right-btn" title="Align Right" style="flex: 1; padding: 4px;">&rarr;|</button>
      </div>
      <div style="display: flex; gap: 4px; justify-content: space-between;">
        <button class="btn btn-secondary" id="align-top-btn" title="Align Top" style="flex: 1; padding: 4px;">&uarr;</button>
        <button class="btn btn-secondary" id="align-middle-btn" title="Align Middle" style="flex: 1; padding: 4px;">&varr;</button>
        <button class="btn btn-secondary" id="align-bottom-btn" title="Align Bottom" style="flex: 1; padding: 4px;">&darr;</button>
      </div>
      <div style="display: flex; gap: 4px; justify-content: space-between; margin-top: 4px;">
        <button class="btn btn-secondary" id="dist-horiz-btn" title="Distribute Horizontally" style="flex: 1; padding: 4px; font-size: 10px;">Dist H</button>
        <button class="btn btn-secondary" id="dist-vert-btn" title="Distribute Vertically" style="flex: 1; padding: 4px; font-size: 10px;">Dist V</button>
      </div>
      <div style="display: flex; gap: 4px; justify-content: space-between; margin-top: 4px;">
        <button class="btn btn-secondary" id="match-width-btn" title="Match Width" style="flex: 1; padding: 4px; font-size: 10px;">= Width</button>
        <button class="btn btn-secondary" id="match-height-btn" title="Match Height" style="flex: 1; padding: 4px; font-size: 10px;">= Height</button>
        <button class="btn btn-secondary" id="match-size-btn" title="Match Size" style="flex: 1; padding: 4px; font-size: 10px;">= Size</button>
      </div>
    </div>
  `;
  selectionSettingsContainer.appendChild(layoutWrapper);

  const getSelectedNodesList = () => {
    let nodes = [];
    state.columns.forEach(col => {
      col.nodes.forEach(n => {
        if (selectedNodeIds.has(n.id)) nodes.push(n);
      });
    });
    return nodes;
  };

  // Implement Layout Handlers
  layoutWrapper.querySelector("#align-left-btn").addEventListener("click", () => {
    pushState();
    const nodes = getSelectedNodesList();
    if (nodes.length < 2) return;
    const minX = Math.min(...nodes.map(n => n.x || 0));
    nodes.forEach(n => { if(!n.locked) n.x = minX; });
    calculateCoordinates(); renderSVG(); saveData(); showToast("Aligned Left");
  });
  layoutWrapper.querySelector("#align-center-btn").addEventListener("click", () => {
    pushState();
    const nodes = getSelectedNodesList();
    if (nodes.length < 2) return;
    const avgX = nodes.reduce((sum, n) => sum + (n.x || 0), 0) / nodes.length;
    nodes.forEach(n => { if(!n.locked) n.x = avgX; });
    calculateCoordinates(); renderSVG(); saveData(); showToast("Aligned Center");
  });
  layoutWrapper.querySelector("#align-right-btn").addEventListener("click", () => {
    pushState();
    const nodes = getSelectedNodesList();
    if (nodes.length < 2) return;
    const maxX = Math.max(...nodes.map(n => n.x || 0));
    nodes.forEach(n => { if(!n.locked) n.x = maxX; });
    calculateCoordinates(); renderSVG(); saveData(); showToast("Aligned Right");
  });
  layoutWrapper.querySelector("#align-top-btn").addEventListener("click", () => {
    pushState();
    const nodes = getSelectedNodesList();
    if (nodes.length < 2) return;
    const minY = Math.min(...nodes.map(n => n.y || 0));
    nodes.forEach(n => { if(!n.locked) n.y = minY; });
    calculateCoordinates(); renderSVG(); saveData(); showToast("Aligned Top");
  });
  layoutWrapper.querySelector("#align-middle-btn").addEventListener("click", () => {
    pushState();
    const nodes = getSelectedNodesList();
    if (nodes.length < 2) return;
    const avgY = nodes.reduce((sum, n) => sum + (n.y || 0), 0) / nodes.length;
    nodes.forEach(n => { if(!n.locked) n.y = avgY; });
    calculateCoordinates(); renderSVG(); saveData(); showToast("Aligned Middle");
  });
  layoutWrapper.querySelector("#align-bottom-btn").addEventListener("click", () => {
    pushState();
    const nodes = getSelectedNodesList();
    if (nodes.length < 2) return;
    const maxY = Math.max(...nodes.map(n => n.y || 0));
    nodes.forEach(n => { if(!n.locked) n.y = maxY; });
    calculateCoordinates(); renderSVG(); saveData(); showToast("Aligned Bottom");
  });
  layoutWrapper.querySelector("#dist-horiz-btn").addEventListener("click", () => {
    pushState();
    const nodes = getSelectedNodesList().filter(n => !n.locked).sort((a, b) => (a.x || 0) - (b.x || 0));
    if (nodes.length < 3) return;
    const minX = nodes[0].x || 0;
    const maxX = nodes[nodes.length - 1].x || 0;
    const step = (maxX - minX) / (nodes.length - 1);
    nodes.forEach((n, idx) => { n.x = minX + (step * idx); });
    calculateCoordinates(); renderSVG(); saveData(); showToast("Distributed Horizontally");
  });
  layoutWrapper.querySelector("#dist-vert-btn").addEventListener("click", () => {
    pushState();
    const nodes = getSelectedNodesList().filter(n => !n.locked).sort((a, b) => (a.y || 0) - (b.y || 0));
    if (nodes.length < 3) return;
    const minY = nodes[0].y || 0;
    const maxY = nodes[nodes.length - 1].y || 0;
    const step = (maxY - minY) / (nodes.length - 1);
    nodes.forEach((n, idx) => { n.y = minY + (step * idx); });
    calculateCoordinates(); renderSVG(); saveData(); showToast("Distributed Vertically");
  });
  layoutWrapper.querySelector("#match-width-btn").addEventListener("click", () => {
    pushState();
    const nodes = getSelectedNodesList();
    if (nodes.length < 2) return;
    const targetWidth = nodes[0].width || NODE_WIDTH;
    nodes.forEach(n => { if(!n.locked) n.width = targetWidth; });
    calculateCoordinates(); renderSVG(); saveData(); showToast("Matched Widths");
  });
  layoutWrapper.querySelector("#match-height-btn").addEventListener("click", () => {
    pushState();
    const nodes = getSelectedNodesList();
    if (nodes.length < 2) return;
    const targetHeight = nodes[0].height || NODE_HEIGHT;
    nodes.forEach(n => { if(!n.locked) n.height = targetHeight; });
    calculateCoordinates(); renderSVG(); saveData(); showToast("Matched Heights");
  });
  layoutWrapper.querySelector("#match-size-btn").addEventListener("click", () => {
    pushState();
    const nodes = getSelectedNodesList();
    if (nodes.length < 2) return;
    const targetWidth = nodes[0].width || NODE_WIDTH;
    const targetHeight = nodes[0].height || NODE_HEIGHT;
    nodes.forEach(n => { if(!n.locked) { n.width = targetWidth; n.height = targetHeight; } });
    calculateCoordinates(); renderSVG(); saveData(); showToast("Matched Sizes");
  });
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  const defFill = theme === "dark" ? "#121212" : "#ffffff";
  const defStroke = theme === "dark" ? "#a3a3a3" : "#171717";
  const defText = theme === "dark" ? "#f5f5f5" : "#171717";

  let firstId = Array.from(selectedNodeIds)[0];
  let firstNode = null;
  state.columns.forEach(col => {
    let found = col.nodes.find(n => n.id === firstId);
    if (found) firstNode = found;
  });

  const currentFill = (firstNode && firstNode.fill) || defFill;
  const currentStroke = (firstNode && firstNode.stroke) || defStroke;
  const currentText = (firstNode && firstNode.textColor) || defText;
  const currentRx = (firstNode && firstNode.rx !== undefined) ? firstNode.rx : 0;
  
  const bulkFillType = (firstNode && firstNode.fillType) || "solid";
  const bulkFillColor2 = (firstNode && firstNode.fillColor2) || "#ffffff";
  const bulkGradientAngle = (firstNode && firstNode.gradientAngle) || 0;
  const bulkBorderStyle = (firstNode && firstNode.borderStyle) || "solid";
  const bulkShadowType = (firstNode && firstNode.shadowType) || "none";
  const bulkShadowOffsetX = (firstNode && firstNode.shadowOffsetX !== undefined) ? firstNode.shadowOffsetX : 4;
  const bulkShadowOffsetY = (firstNode && firstNode.shadowOffsetY !== undefined) ? firstNode.shadowOffsetY : 4;
  const bulkShadowBlur = (firstNode && firstNode.shadowBlur !== undefined) ? firstNode.shadowBlur : 8;
  const bulkShadowColor = (firstNode && firstNode.shadowColor) || "rgba(0,0,0,0.2)";

  // Box Styling Section
  const styleWrapper = document.createElement("div");
  styleWrapper.className = "input-field-wrapper";
  styleWrapper.innerHTML = `
    <label>Bulk Box Styling</label>
    <div style="display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--panel-border); padding: 10px; background-color: var(--bg-color);">
      <!-- Shape -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Shape</span>
        <select id="bulk-shape-select" style="flex: 1; padding: 4px 8px; font-size: 11px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
          <option value="rect" ${firstNode && (firstNode.shape === "rect" || !firstNode.shape) ? "selected" : ""}>Rectangle</option>
          <option value="diamond" ${firstNode && firstNode.shape === "diamond" ? "selected" : ""}>Diamond</option>
          <option value="oval" ${firstNode && firstNode.shape === "oval" ? "selected" : ""}>Oval/Capsule</option>
          <option value="parallelogram" ${firstNode && firstNode.shape === "parallelogram" ? "selected" : ""}>Parallelogram</option>
          <option value="cylinder" ${firstNode && firstNode.shape === "cylinder" ? "selected" : ""}>Cylinder</option>
        </select>
      </div>

      <!-- Corner Radius -->
      <div id="bulk-radius-container" style="display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Corner Radius</span>
          <span id="bulk-radius-val" style="font-size: 10px; font-family: var(--font-mono); color: var(--text-primary);">${currentRx}px</span>
        </div>
        <input type="range" id="bulk-radius-slider" min="0" max="30" value="${currentRx}" style="width: 100%; accent-color: var(--accent-color); cursor: pointer;">
      </div>
      
      <!-- Colors & Gradients -->
      <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
        <!-- Fill Type -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Fill Type</span>
          <select id="bulk-fill-type" style="flex: 1; padding: 4px 8px; font-size: 11px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
            <option value="solid" ${bulkFillType === "solid" ? "selected" : ""}>Solid Color</option>
            <option value="linear" ${bulkFillType === "linear" ? "selected" : ""}>Linear Gradient</option>
            <option value="radial" ${bulkFillType === "radial" ? "selected" : ""}>Radial Gradient</option>
          </select>
        </div>

        <!-- Fill Color / Stop 1 -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span id="bulk-fill-label" style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">${bulkFillType === "linear" || bulkFillType === "radial" ? "Color 1" : "Fill"}</span>
          <input type="color" class="color-picker-input" id="bulk-fill-picker" value="${currentFill}" style="width: 32px; height: 26px; flex-shrink: 0;">
          <input type="text" class="text-input" id="bulk-fill-hex" placeholder="#FFFFFF" style="padding: 4px 8px; font-size: 11px; font-family: var(--font-mono); text-transform: uppercase; flex: 1; min-width: 0;">
        </div>

        <!-- Fill Color 2 (Visible if linear/radial gradient) -->
        <div id="bulk-fill2-container" style="display: ${bulkFillType === "linear" || bulkFillType === "radial" ? "flex" : "none"}; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Color 2</span>
          <input type="color" class="color-picker-input" id="bulk-fill2-picker" value="${bulkFillColor2}" style="width: 32px; height: 26px; flex-shrink: 0;">
          <input type="text" class="text-input" id="bulk-fill2-hex" placeholder="#FFFFFF" style="padding: 4px 8px; font-size: 11px; font-family: var(--font-mono); text-transform: uppercase; flex: 1; min-width: 0;">
        </div>

        <!-- Gradient Angle slider (visible if linear gradient) -->
        <div id="bulk-gradient-angle-container" style="display: ${bulkFillType === "linear" ? "flex" : "none"}; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Grad Angle</span>
            <span id="bulk-gradient-angle-val" style="font-size: 10px; font-family: var(--font-mono); color: var(--text-primary);">${bulkGradientAngle}°</span>
          </div>
          <input type="range" id="bulk-gradient-angle-slider" min="0" max="360" value="${bulkGradientAngle}" style="width: 100%; accent-color: var(--accent-color); cursor: pointer;">
        </div>

        <!-- Border Style -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Border Style</span>
          <select id="bulk-border-style" style="flex: 1; padding: 4px 8px; font-size: 11px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
            <option value="solid" ${bulkBorderStyle === "solid" ? "selected" : ""}>Solid</option>
            <option value="dashed" ${bulkBorderStyle === "dashed" ? "selected" : ""}>Dashed</option>
            <option value="dotted" ${bulkBorderStyle === "dotted" ? "selected" : ""}>Dotted</option>
          </select>
        </div>

        <!-- Border Color -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Border</span>
          <input type="color" class="color-picker-input" id="bulk-stroke-picker" value="${currentStroke}" style="width: 32px; height: 26px; flex-shrink: 0;">
          <input type="text" class="text-input" id="bulk-stroke-hex" placeholder="#000000" style="padding: 4px 8px; font-size: 11px; font-family: var(--font-mono); text-transform: uppercase; flex: 1; min-width: 0;">
        </div>

        <!-- Drop Shadow -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Shadow</span>
          <select id="bulk-shadow-type" style="flex: 1; padding: 4px 8px; font-size: 11px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
            <option value="none" ${bulkShadowType === "none" ? "selected" : ""}>None</option>
            <option value="sm" ${bulkShadowType === "sm" ? "selected" : ""}>Small</option>
            <option value="md" ${bulkShadowType === "md" ? "selected" : ""}>Medium</option>
            <option value="lg" ${bulkShadowType === "lg" ? "selected" : ""}>Large</option>
            <option value="custom" ${bulkShadowType === "custom" ? "selected" : ""}>Custom</option>
          </select>
        </div>

        <!-- Custom Shadow Controls -->
        <div id="bulk-custom-shadow-container" style="display: ${bulkShadowType === "custom" ? "flex" : "none"}; flex-direction: column; gap: 6px; border-top: 1px dashed var(--panel-border); padding-top: 6px; margin-top: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Offset X</span>
            <input type="range" id="bulk-shadow-dx" min="-20" max="20" value="${bulkShadowOffsetX}" style="flex: 1; accent-color: var(--accent-color); cursor: pointer;">
            <span id="bulk-shadow-dx-val" style="font-size: 10px; font-family: var(--font-mono); color: var(--text-primary); width: 24px; text-align: right;">${bulkShadowOffsetX}px</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Offset Y</span>
            <input type="range" id="bulk-shadow-dy" min="-20" max="20" value="${bulkShadowOffsetY}" style="flex: 1; accent-color: var(--accent-color); cursor: pointer;">
            <span id="bulk-shadow-dy-val" style="font-size: 10px; font-family: var(--font-mono); color: var(--text-primary); width: 24px; text-align: right;">${bulkShadowOffsetY}px</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Blur</span>
            <input type="range" id="bulk-shadow-blur" min="0" max="30" value="${bulkShadowBlur}" style="flex: 1; accent-color: var(--accent-color); cursor: pointer;">
            <span id="bulk-shadow-blur-val" style="font-size: 10px; font-family: var(--font-mono); color: var(--text-primary); width: 24px; text-align: right;">${bulkShadowBlur}px</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Shd Color</span>
            <input type="color" class="color-picker-input" id="bulk-shadow-color-picker" value="${bulkShadowColor.startsWith("#") ? bulkShadowColor : "#000000"}" style="width: 24px; height: 18px; border: 1px solid var(--panel-border); cursor: pointer; flex-shrink: 0; padding: 0; background: none;">
            <input type="text" class="text-input" id="bulk-shadow-color-hex" placeholder="rgba(0,0,0,0.2)" value="${bulkShadowColor}" style="padding: 2px 4px; font-size: 10px; font-family: var(--font-mono); flex: 1; min-width: 0; height: 18px;">
          </div>
        </div>

        <!-- Text Color -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Text</span>
          <input type="color" class="color-picker-input" id="bulk-text-picker" value="${currentText}" style="width: 32px; height: 26px; flex-shrink: 0;">
          <input type="text" class="text-input" id="bulk-text-hex" placeholder="#000000" style="padding: 4px 8px; font-size: 11px; font-family: var(--font-mono); text-transform: uppercase; flex: 1; min-width: 0;">
        </div>
      </div>

      <!-- Bulk Style Presets -->
      <div style="display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--panel-border); padding-top: 8px; margin-top: 4px;">
        <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Presets</span>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="preset-btn" data-fill="#ffffff" data-stroke="#171717" data-text="#171717" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #171717; background: #ffffff; cursor: pointer;" title="Minimal Light"></button>
          <button class="preset-btn" data-fill="#121212" data-stroke="#a3a3a3" data-text="#f5f5f5" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #a3a3a3; background: #121212; cursor: pointer;" title="Minimal Dark"></button>
          <button class="preset-btn" data-fill="#ffedd5" data-stroke="#ea580c" data-text="#9a3412" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #ea580c; background: #ffedd5; cursor: pointer;" title="Sunset Orange"></button>
          <button class="preset-btn" data-fill="#dbeafe" data-stroke="#2563eb" data-text="#1e40af" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #2563eb; background: #dbeafe; cursor: pointer;" title="Ocean Blue"></button>
          <button class="preset-btn" data-fill="#dcfce7" data-stroke="#16a34a" data-text="#166534" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #16a34a; background: #dcfce7; cursor: pointer;" title="Forest Green"></button>
          <button class="preset-btn" data-fill="#ffe4e6" data-stroke="#db2777" data-text="#9d174d" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #db2777; background: #ffe4e6; cursor: pointer;" title="Rose Pink"></button>
          <button class="preset-btn" data-fill="#f3e8ff" data-stroke="#9333ea" data-text="#6b21a8" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #9333ea; background: #f3e8ff; cursor: pointer;" title="Lavender Purple"></button>
          <button class="preset-btn" data-fill="#ccfbf1" data-stroke="#0d9488" data-text="#115e59" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #0d9488; background: #ccfbf1; cursor: pointer;" title="Teal Mint"></button>
          <button class="preset-btn" data-fill="#fef3c7" data-stroke="#d97706" data-text="#92400e" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #d97706; background: #fef3c7; cursor: pointer;" title="Amber Gold"></button>
          <button class="preset-btn" data-fill="#f1f5f9" data-stroke="#475569" data-text="#1e293b" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #475569; background: #f1f5f9; cursor: pointer;" title="Slate Grey"></button>
        </div>
      </div>

      <!-- Bulk Text formatting -->
      <div style="display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--panel-border); padding-top: 8px; margin-top: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Text Size</span>
          <input type="range" id="bulk-text-size-slider" min="10" max="24" value="${firstNode ? (firstNode.fontSize || 12) : 12}" style="flex: 1; accent-color: var(--accent-color); cursor: pointer;">
          <span id="bulk-text-size-val" style="font-size: 10px; font-family: var(--font-mono); color: var(--text-primary); width: 32px; text-align: right;">${firstNode ? (firstNode.fontSize || 12) : 12}px</span>
        </div>
        
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Style</span>
          <div style="display: flex; gap: 4px; flex: 1;">
            <button class="selector-option text-style-btn" id="bulk-btn-bold" data-style="bold" style="padding: 4px 8px; font-weight: bold; flex: 1; border: 1px solid var(--panel-border); font-size: 10px;">B</button>
            <button class="selector-option text-style-btn" id="bulk-btn-italic" data-style="italic" style="padding: 4px 8px; font-style: italic; flex: 1; border: 1px solid var(--panel-border); font-size: 10px;">I</button>
            <button class="selector-option text-style-btn" id="bulk-btn-underline" data-style="underline" style="padding: 4px 8px; text-decoration: underline; flex: 1; border: 1px solid var(--panel-border); font-size: 10px;">U</button>
          </div>
        </div>
      </div>
      
      <button class="btn" id="bulk-reset-node-style-btn" style="padding: 6px; font-size: 10px; margin-top: 4px;">
        Reset Selected Styles
      </button>

      <!-- Align & Distribute -->
      <div style="display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--panel-border); padding-top: 8px; margin-top: 4px;">
        <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Align Boxes</span>
        <div class="align-btn-grid">
          <button class="align-btn" id="align-left" title="Align Left">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 22H2V2h2v20zM22 7H6v3h16V7zm-4 7H6v3h12v-3z"/></svg>
          </button>
          <button class="align-btn" id="align-center-x" title="Align Horizontal Center">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 2h2v5h8v3h-8v4h5v3h-5v5h-2v-5H6v-3h5v-4H3V7h8V2z"/></svg>
          </button>
          <button class="align-btn" id="align-right" title="Align Right">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2h2v20h-2V2zM2 7h16v3H2V7zm4 7h12v3H6v-3z"/></svg>
          </button>
          <button class="align-btn" id="align-top" title="Align Top">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 4V2H2v2h20zM7 22V6h3v16H7zm7-4V6h3v12h-3z"/></svg>
          </button>
          <button class="align-btn" id="align-center-y" title="Align Vertical Center">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 11h5V3h3v8h4V6h3v5h5v2h-5v5h-3v-5h-4v8h-3v-8H2v-2z"/></svg>
          </button>
          <button class="align-btn" id="align-bottom" title="Align Bottom">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 20v2H2v-2h20zM7 2V18h3V2H7zm7 4v12h3V6h-3z"/></svg>
          </button>
        </div>
        <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); margin-top: 4px;">Distribute Spacing</span>
        <div class="distribute-btn-row">
          <button class="btn" id="distribute-h" style="padding: 4px; font-size: 10px; flex: 1;">
            Horizontal
          </button>
          <button class="btn" id="distribute-v" style="padding: 4px; font-size: 10px; flex: 1;">
            Vertical
          </button>
        </div>
      </div>

      <!-- Bulk Position & Locking -->
      <div style="display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--panel-border); padding-top: 8px; margin-top: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Lock Pos</span>
          <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
            <label class="switch-toggle" style="display: inline-flex; align-items: center; cursor: pointer; gap: 6px; user-select: none;">
              <input type="checkbox" id="bulk-lock-checkbox" ${firstNode && firstNode.locked ? "checked" : ""} style="cursor: pointer; accent-color: var(--accent-color);">
              <span style="font-size: 11px; color: var(--text-primary);">Lock Selected Boxes</span>
            </label>
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin-top: 2px;">
          <button class="btn" id="bulk-reset-coord-btn" style="padding: 2px 6px; font-size: 9px; margin: 0; min-height: 20px; line-height: 1;">
            Reset Selected Positions
          </button>
        </div>
      </div>
    </div>
  `;

  const fillPicker = styleWrapper.querySelector("#bulk-fill-picker");
  const fillHex = styleWrapper.querySelector("#bulk-fill-hex");
  const strokePicker = styleWrapper.querySelector("#bulk-stroke-picker");
  const strokeHex = styleWrapper.querySelector("#bulk-stroke-hex");
  const textPicker = styleWrapper.querySelector("#bulk-text-picker");
  const textHex = styleWrapper.querySelector("#bulk-text-hex");
  const radiusSlider = styleWrapper.querySelector("#bulk-radius-slider");
  const radiusVal = styleWrapper.querySelector("#bulk-radius-val");
  const resetBtn = styleWrapper.querySelector("#bulk-reset-node-style-btn");
  
  const shapeSelect = styleWrapper.querySelector("#bulk-shape-select");
  const radiusContainer = styleWrapper.querySelector("#bulk-radius-container");
  
  const fontSelect = styleWrapper.querySelector("#bulk-font-family-select");
  const textSizeSlider = styleWrapper.querySelector("#bulk-text-size-slider");
  const textSizeVal = styleWrapper.querySelector("#bulk-text-size-val");
  const boldBtn = styleWrapper.querySelector("#bulk-btn-bold");
  const italicBtn = styleWrapper.querySelector("#bulk-btn-italic");
  const underlineBtn = styleWrapper.querySelector("#bulk-btn-underline");

  const bulkFillTypeSelect = styleWrapper.querySelector("#bulk-fill-type");
  const bulkFillColor2Picker = styleWrapper.querySelector("#bulk-fill2-picker");
  const bulkFillColor2Hex = styleWrapper.querySelector("#bulk-fill2-hex");
  const bulkFill2Container = styleWrapper.querySelector("#bulk-fill2-container");
  const bulkGradientAngleContainer = styleWrapper.querySelector("#bulk-gradient-angle-container");
  const bulkGradientAngleSlider = styleWrapper.querySelector("#bulk-gradient-angle-slider");
  const bulkGradientAngleVal = styleWrapper.querySelector("#bulk-gradient-angle-val");
  const bulkFillLabel = styleWrapper.querySelector("#bulk-fill-label");
  
  const bulkBorderStyleSelect = styleWrapper.querySelector("#bulk-border-style");
  
  const bulkShadowTypeSelect = styleWrapper.querySelector("#bulk-shadow-type");
  const bulkCustomShadowContainer = styleWrapper.querySelector("#bulk-custom-shadow-container");
  const bulkShadowDxSlider = styleWrapper.querySelector("#bulk-shadow-dx");
  const bulkShadowDxVal = styleWrapper.querySelector("#bulk-shadow-dx-val");
  const bulkShadowDySlider = styleWrapper.querySelector("#bulk-shadow-dy");
  const bulkShadowDyVal = styleWrapper.querySelector("#bulk-shadow-dy-val");
  const bulkShadowBlurSlider = styleWrapper.querySelector("#bulk-shadow-blur");
  const bulkShadowBlurVal = styleWrapper.querySelector("#bulk-shadow-blur-val");
  const bulkShadowColorPicker = styleWrapper.querySelector("#bulk-shadow-color-picker");
  const bulkShadowColorHex = styleWrapper.querySelector("#bulk-shadow-color-hex");
  const bulkLockCheckbox = styleWrapper.querySelector("#bulk-lock-checkbox");
  const bulkResetCoordBtn = styleWrapper.querySelector("#bulk-reset-coord-btn");

  const updateRadiusVisibility = (shape) => {
    if (radiusContainer) {
      radiusContainer.style.display = (shape === "rect" || !shape) ? "flex" : "none";
    }
  };
  
  if (firstNode) {
    updateRadiusVisibility(firstNode.shape);
    boldBtn.classList.toggle("active", firstNode.fontWeight === "bold");
    italicBtn.classList.toggle("active", firstNode.fontStyle === "italic");
    underlineBtn.classList.toggle("active", firstNode.textDecoration === "underline");
  }

  shapeSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    updateRadiusVisibility(val);
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.shape = val;
      });
    });
    renderSVG();
    saveData();
  });

  fontSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.fontFamily = val;
      });
    });
    renderSVG();
    saveData();
  });

  textSizeSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    textSizeVal.textContent = `${val}px`;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.fontSize = val;
      });
    });
    renderSVG();
    saveData();
  });

  registerUndoTrigger(fillPicker, "mousedown");
  registerUndoTrigger(fillHex, "focus");
  registerUndoTrigger(strokePicker, "mousedown");
  registerUndoTrigger(strokeHex, "focus");
  registerUndoTrigger(textPicker, "mousedown");
  registerUndoTrigger(textHex, "focus");
  registerUndoTrigger(radiusSlider, "mousedown");
  registerUndoTrigger(textSizeSlider, "mousedown");
  registerUndoTrigger(shapeSelect, "mousedown");
  registerUndoTrigger(resetBtn, "click");

  registerUndoTrigger(bulkFillTypeSelect, "mousedown");
  registerUndoTrigger(bulkFillColor2Picker, "mousedown");
  registerUndoTrigger(bulkFillColor2Hex, "focus");
  registerUndoTrigger(bulkGradientAngleSlider, "mousedown");
  registerUndoTrigger(bulkBorderStyleSelect, "mousedown");
  registerUndoTrigger(bulkShadowTypeSelect, "mousedown");
  registerUndoTrigger(bulkShadowDxSlider, "mousedown");
  registerUndoTrigger(bulkShadowDySlider, "mousedown");
  registerUndoTrigger(bulkShadowBlurSlider, "mousedown");
  registerUndoTrigger(bulkShadowColorPicker, "mousedown");
  registerUndoTrigger(bulkShadowColorHex, "focus");
  registerUndoTrigger(bulkLockCheckbox, "click");

  boldBtn.addEventListener("click", () => {
    const isBold = firstNode ? (firstNode.fontWeight !== "bold") : true;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.fontWeight = isBold ? "bold" : "normal";
      });
    });
    boldBtn.classList.toggle("active", isBold);
    renderSVG();
    saveData();
  });

  italicBtn.addEventListener("click", () => {
    const isItalic = firstNode ? (firstNode.fontStyle !== "italic") : true;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.fontStyle = isItalic ? "italic" : "normal";
      });
    });
    italicBtn.classList.toggle("active", isItalic);
    renderSVG();
    saveData();
  });

  underlineBtn.addEventListener("click", () => {
    const isUnderline = firstNode ? (firstNode.textDecoration !== "underline") : true;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.textDecoration = isUnderline ? "underline" : "none";
      });
    });
    underlineBtn.classList.toggle("active", isUnderline);
    renderSVG();
    saveData();
  });

  wireColorPickerPair(fillPicker, fillHex, (val) => {
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.fill = val;
      });
    });
    renderSVG();
    saveData();
  });

  wireColorPickerPair(strokePicker, strokeHex, (val) => {
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.stroke = val;
      });
    });
    renderSVG();
    saveData();
  });

  wireColorPickerPair(textPicker, textHex, (val) => {
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.textColor = val;
      });
    });
    renderSVG();
    saveData();
  });

  radiusSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    radiusVal.textContent = `${val}px`;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.rx = val;
      });
    });
    renderSVG();
    saveData();
  });

  // Bulk styling listeners
  bulkFillTypeSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.fillType = val;
      });
    });
    bulkFill2Container.style.display = (val === "linear" || val === "radial") ? "flex" : "none";
    bulkGradientAngleContainer.style.display = (val === "linear") ? "flex" : "none";
    bulkFillLabel.textContent = (val === "linear" || val === "radial") ? "Color 1" : "Fill";
    renderSVG();
    saveData();
  });

  wireColorPickerPair(bulkFillColor2Picker, bulkFillColor2Hex, (val) => {
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.fillColor2 = val;
      });
    });
    renderSVG();
    saveData();
  });

  bulkGradientAngleSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    bulkGradientAngleVal.textContent = `${val}°`;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.gradientAngle = val;
      });
    });
    renderSVG();
    saveData();
  });

  bulkBorderStyleSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.borderStyle = val;
      });
    });
    renderSVG();
    saveData();
  });

  bulkShadowTypeSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.shadowType = val;
      });
    });
    bulkCustomShadowContainer.style.display = (val === "custom") ? "flex" : "none";
    renderSVG();
    saveData();
  });

  bulkShadowDxSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    bulkShadowDxVal.textContent = `${val}px`;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.shadowOffsetX = val;
      });
    });
    renderSVG();
    saveData();
  });

  bulkShadowDySlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    bulkShadowDyVal.textContent = `${val}px`;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.shadowOffsetY = val;
      });
    });
    renderSVG();
    saveData();
  });

  bulkShadowBlurSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    bulkShadowBlurVal.textContent = `${val}px`;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.shadowBlur = val;
      });
    });
    renderSVG();
    saveData();
  });

  bulkShadowColorPicker.addEventListener("input", (e) => {
    const val = e.target.value;
    bulkShadowColorHex.value = val;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.shadowColor = val;
      });
    });
    renderSVG();
    saveData();
  });

  bulkShadowColorHex.addEventListener("input", (e) => {
    const val = e.target.value;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) node.shadowColor = val;
      });
    });
    if (val.startsWith("#") && (val.length === 4 || val.length === 7)) {
      bulkShadowColorPicker.value = val;
    }
    renderSVG();
    saveData();
  });

  // Wire preset buttons for multi-selection
  styleWrapper.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const targetBtn = e.target.closest(".preset-btn");
      if (!targetBtn) return;
      const fill = targetBtn.dataset.fill;
      const stroke = targetBtn.dataset.stroke;
      const text = targetBtn.dataset.text;
      
      selectedNodeIds.forEach(id => {
        state.columns.forEach(col => {
          let node = col.nodes.find(n => n.id === id);
          if (node) {
            node.fill = fill;
            node.stroke = stroke;
            node.textColor = text;
          }
        });
      });
      renderSVG();
      renderMultiSelectionPanel();
      saveData();
    });
  });

  resetBtn.addEventListener("click", () => {
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        let node = col.nodes.find(n => n.id === id);
        if (node) {
          delete node.fill;
          delete node.stroke;
          delete node.textColor;
          delete node.rx;
          delete node.shape;
          delete node.fontSize;
          delete node.fontWeight;
          delete node.fontStyle;
          delete node.textDecoration;
          delete node.fillType;
          delete node.fillColor2;
          delete node.gradientAngle;
          delete node.borderStyle;
          delete node.shadowType;
          delete node.shadowOffsetX;
          delete node.shadowOffsetY;
          delete node.shadowBlur;
          delete node.shadowColor;
        }
      });
    });
    renderSVG();
    renderMultiSelectionPanel();
    saveData();
    showToast("Reset all selected box styles");
  });

  const alignLeft = styleWrapper.querySelector("#align-left");
  const alignCenterX = styleWrapper.querySelector("#align-center-x");
  const alignRight = styleWrapper.querySelector("#align-right");
  const alignTop = styleWrapper.querySelector("#align-top");
  const alignCenterY = styleWrapper.querySelector("#align-center-y");
  const alignBottom = styleWrapper.querySelector("#align-bottom");
  const distributeH = styleWrapper.querySelector("#distribute-h");
  const distributeV = styleWrapper.querySelector("#distribute-v");

  const getSelCoords = () => {
    return Array.from(selectedNodeIds).map(id => ({
      id,
      node: findNodeById(id),
      pos: nodeCoords[id]
    })).filter(c => c.node && c.pos);
  };

  alignLeft.addEventListener("click", () => {
    const items = getSelCoords();
    if (items.length < 2) return;
    pushState();
    const minX = Math.min(...items.map(i => i.pos.x));
    items.forEach(i => {
      if (!i.node.locked) i.node.x = minX;
    });
    calculateCoordinates();
    renderAll();
    saveData();
    showToast("Aligned boxes left");
  });

  alignCenterX.addEventListener("click", () => {
    const items = getSelCoords();
    if (items.length < 2) return;
    pushState();
    const avgX = items.reduce((sum, i) => sum + i.pos.x, 0) / items.length;
    items.forEach(i => {
      if (!i.node.locked) i.node.x = avgX;
    });
    calculateCoordinates();
    renderAll();
    saveData();
    showToast("Centered boxes horizontally");
  });

  alignRight.addEventListener("click", () => {
    const items = getSelCoords();
    if (items.length < 2) return;
    pushState();
    const maxX = Math.max(...items.map(i => i.pos.x));
    items.forEach(i => {
      if (!i.node.locked) i.node.x = maxX;
    });
    calculateCoordinates();
    renderAll();
    saveData();
    showToast("Aligned boxes right");
  });

  alignTop.addEventListener("click", () => {
    const items = getSelCoords();
    if (items.length < 2) return;
    pushState();
    const minY = Math.min(...items.map(i => i.pos.y));
    items.forEach(i => {
      if (!i.node.locked) i.node.y = minY;
    });
    calculateCoordinates();
    renderAll();
    saveData();
    showToast("Aligned boxes top");
  });

  alignCenterY.addEventListener("click", () => {
    const items = getSelCoords();
    if (items.length < 2) return;
    pushState();
    const avgY = items.reduce((sum, i) => sum + i.pos.y, 0) / items.length;
    items.forEach(i => {
      if (!i.node.locked) i.node.y = avgY;
    });
    calculateCoordinates();
    renderAll();
    saveData();
    showToast("Centered boxes vertically");
  });

  alignBottom.addEventListener("click", () => {
    const items = getSelCoords();
    if (items.length < 2) return;
    pushState();
    const maxY = Math.max(...items.map(i => i.pos.y));
    items.forEach(i => {
      if (!i.node.locked) i.node.y = maxY;
    });
    calculateCoordinates();
    renderAll();
    saveData();
    showToast("Aligned boxes bottom");
  });

  distributeH.addEventListener("click", () => {
    const items = getSelCoords();
    if (items.length < 3) {
      showToast("Select at least 3 boxes to distribute");
      return;
    }
    pushState();
    items.sort((a, b) => a.pos.x - b.pos.x);
    const minX = items[0].pos.x;
    const maxX = items[items.length - 1].pos.x;
    const step = (maxX - minX) / (items.length - 1);
    items.forEach((i, idx) => {
      if (!i.node.locked) i.node.x = minX + idx * step;
    });
    calculateCoordinates();
    renderAll();
    saveData();
    showToast("Distributed boxes horizontally");
  });

  distributeV.addEventListener("click", () => {
    const items = getSelCoords();
    if (items.length < 3) {
      showToast("Select at least 3 boxes to distribute");
      return;
    }
    pushState();
    items.sort((a, b) => a.pos.y - b.pos.y);
    const minY = items[0].pos.y;
    const maxY = items[items.length - 1].pos.y;
    const step = (maxY - minY) / (items.length - 1);
    items.forEach((i, idx) => {
      if (!i.node.locked) i.node.y = minY + idx * step;
    });
    calculateCoordinates();
    renderAll();
    saveData();
    showToast("Distributed boxes vertically");
  });

  if (bulkLockCheckbox) {
    bulkLockCheckbox.addEventListener("change", (e) => {
      const isLocked = e.target.checked;
      selectedNodeIds.forEach(id => {
        const node = findNodeById(id);
        if (node) node.locked = isLocked;
      });
      showToast(isLocked ? "Selected boxes locked" : "Selected boxes unlocked");
      renderSVG();
      saveData();
    });
  }
  
  if (bulkResetCoordBtn) {
    bulkResetCoordBtn.addEventListener("click", () => {
      selectedNodeIds.forEach(id => {
        const node = findNodeById(id);
        if (node) {
          delete node.x;
          delete node.y;
        }
      });
      calculateCoordinates();
      renderAll();
      showToast("Selected positions reset to auto-layout");
    });
  }

  selectionSettingsContainer.appendChild(styleWrapper);

  // Bulk Delete Button
  const deleteBtnWrapper = document.createElement("div");
  deleteBtnWrapper.style.marginTop = "20px";
  deleteBtnWrapper.innerHTML = `
    <button class="btn btn-danger" id="bulk-delete-btn" style="padding: 10px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
      Delete Selected Boxes (${selectedNodeIds.size}) (Del)
    </button>
  `;
  
  const bulkDelBtn = deleteBtnWrapper.querySelector("#bulk-delete-btn");
  bulkDelBtn.addEventListener("click", () => {
    const count = selectedNodeIds.size;
    selectedNodeIds.forEach(id => {
      state.columns.forEach(col => {
        col.nodes = col.nodes.filter(n => n.id !== id);
      });
      state.columns.forEach(col => {
        col.nodes.forEach(node => {
          node.targets = node.targets.filter(t => {
            const tId = typeof t === "string" ? t : t.id;
            return tId !== id;
          });
        });
      });
    });
    
    selectedNodeIds.clear();
    selectedNodeId = null;
    renderAll();
    saveData();
    showToast(`Deleted ${count} boxes`);
  });

  selectionSettingsContainer.appendChild(deleteBtnWrapper);
}

// Selected node inputs and targets grid in the sidebar
function renderSidebarSelection() {
  selectionSettingsContainer.innerHTML = "";
  const globalProps = document.getElementById("canvas-global-properties");
  
  if (selectedConnector) {
    if (globalProps) globalProps.style.display = "none";
    renderConnectorSelectionPanel();
    return;
  }
  
  if (selectedNodeIds.size > 1) {
    if (globalProps) globalProps.style.display = "none";
    renderMultiSelectionPanel();
    return;
  }
  
  if (selectedNodeIds.size === 0) {
    selectedNodeId = null;
    if (globalProps) globalProps.style.display = "block";
    return;
  }
  
  // Single selection
  if (globalProps) globalProps.style.display = "none";
  selectedNodeId = Array.from(selectedNodeIds)[0];
  
  // Find selected node
  let selectedNode = null;
  state.columns.forEach(col => {
    const found = col.nodes.find(n => n.id === selectedNodeId);
    if (found) selectedNode = found;
  });
  
  if (!selectedNode) {
    selectedNodeIds.clear();
    selectedNodeId = null;
    renderSidebarSelection();
    return;
  }

  // A. Input Field for label
  const labelWrapper = document.createElement("div");
  labelWrapper.className = "input-field-wrapper";
  labelWrapper.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4px;">
      <label style="margin-bottom: 0;">Box Label</label>
      <div style="display: flex; gap: 4px;">
        <button id="node-btn-sub" title="Subscript (select text first)" style="font-size: 10px; padding: 2px 6px; background: var(--panel-bg); border: 1px solid var(--panel-border); color: var(--text-primary); cursor: pointer; border-radius: 2px;">x₂</button>
        <button id="node-btn-super" title="Superscript (select text first)" style="font-size: 10px; padding: 2px 6px; background: var(--panel-bg); border: 1px solid var(--panel-border); color: var(--text-primary); cursor: pointer; border-radius: 2px;">x²</button>
      </div>
    </div>
    <input type="text" class="text-input" id="edit-node-label" value="${selectedNode.label}" placeholder="Type label..." autocomplete="off">
  `;
  
  const inputEl = labelWrapper.querySelector("input");
  inputEl.addEventListener("input", (e) => {
    selectedNode.label = e.target.value;
    
    renderSVG();
    
    const sidebarItemText = document.querySelector(`.structure-node-item[data-id="${selectedNode.id}"] span`);
    if (sidebarItemText) {
      sidebarItemText.textContent = e.target.value.trim() !== "" ? e.target.value : `(Empty Box)`;
    }
    
    saveData();
  });
  
  const btnSub = labelWrapper.querySelector("#node-btn-sub");
  const btnSuper = labelWrapper.querySelector("#node-btn-super");

  const applyScriptToSelection = (mode) => {
    const start = inputEl.selectionStart;
    const end = inputEl.selectionEnd;
    if (start === end) return; // Need selection
    
    const text = inputEl.value;
    const selectedText = text.substring(start, end);
    const newText = toggleUnicodeScript(selectedText, mode);
    
    inputEl.value = text.substring(0, start) + newText + text.substring(end);
    selectedNode.label = inputEl.value;
    
    // Restore selection
    inputEl.setSelectionRange(start, start + newText.length);
    inputEl.focus();
    
    renderSVG();
    saveData();
  };

  if (btnSub) btnSub.addEventListener("click", () => applyScriptToSelection('sub'));
  if (btnSuper) btnSuper.addEventListener("click", () => applyScriptToSelection('super'));
  
  selectionSettingsContainer.appendChild(labelWrapper);

  // A2. Dimensions & Layering
  const dimWrapper = document.createElement("div");
  dimWrapper.className = "input-field-wrapper";
  dimWrapper.style.marginTop = "16px";
  dimWrapper.innerHTML = `
    <label>Dimensions & Layering</label>
    <div style="display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--panel-border); padding: 10px; background-color: var(--bg-color);">
      <!-- Dimensions -->
      <div style="display: flex; gap: 8px;">
        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Width (px)</span>
          <input type="number" id="node-width-input" class="text-input" value="${Math.round((selectedNode.width || NODE_WIDTH) * 10) / 10}" style="padding: 4px; font-size: 11px;">
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Height (px)</span>
          <input type="number" id="node-height-input" class="text-input" value="${Math.round((selectedNode.height || NODE_HEIGHT) * 10) / 10}" style="padding: 4px; font-size: 11px;">
        </div>
      </div>
      <!-- Layering -->
      <div style="display: flex; gap: 8px; margin-top: 4px;">
        <button class="btn btn-secondary" id="node-bring-forward-btn" style="flex: 1; padding: 4px 8px; font-size: 11px;" title="Bring Forward">Forward</button>
        <button class="btn btn-secondary" id="node-send-backward-btn" style="flex: 1; padding: 4px 8px; font-size: 11px;" title="Send Backward">Backward</button>
      </div>
    </div>
  `;
  selectionSettingsContainer.appendChild(dimWrapper);

  dimWrapper.querySelector("#node-width-input").addEventListener("change", (e) => {
    pushState();
    selectedNode.width = Math.max(20, parseInt(e.target.value) || NODE_WIDTH);
    calculateCoordinates(); renderSVG(); saveData();
  });
  dimWrapper.querySelector("#node-height-input").addEventListener("change", (e) => {
    pushState();
    selectedNode.height = Math.max(20, parseInt(e.target.value) || NODE_HEIGHT);
    calculateCoordinates(); renderSVG(); saveData();
  });

  dimWrapper.querySelector("#node-bring-forward-btn").addEventListener("click", () => {
    pushState();
    selectedNode.zIndex = (selectedNode.zIndex || 0) + 1;
    renderAll(); saveData();
  });
  dimWrapper.querySelector("#node-send-backward-btn").addEventListener("click", () => {
    pushState();
    selectedNode.zIndex = (selectedNode.zIndex || 0) - 1;
    renderAll(); saveData();
  });

  // B. Style Customization Section
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  const defFill = theme === "dark" ? "#121212" : "#ffffff";
  const defStroke = theme === "dark" ? "#a3a3a3" : "#171717";
  const defText = theme === "dark" ? "#f5f5f5" : "#171717";

  const currentFill = selectedNode.fill || defFill;
  const currentStroke = selectedNode.stroke || defStroke;
  const currentText = selectedNode.textColor || defText;

  const styleWrapper = document.createElement("div");
  styleWrapper.className = "input-field-wrapper";
  styleWrapper.style.marginTop = "16px";
  styleWrapper.innerHTML = `
    <label>Box Styling</label>
    <div style="display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--panel-border); padding: 10px; background-color: var(--bg-color);">
      <!-- Shape -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Shape</span>
        <select id="node-shape-select" style="flex: 1; padding: 4px 8px; font-size: 11px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
          <option value="rect" ${selectedNode.shape === "rect" || !selectedNode.shape ? "selected" : ""}>Rectangle</option>
          <option value="diamond" ${selectedNode.shape === "diamond" ? "selected" : ""}>Diamond</option>
          <option value="oval" ${selectedNode.shape === "oval" ? "selected" : ""}>Oval/Capsule</option>
          <option value="parallelogram" ${selectedNode.shape === "parallelogram" ? "selected" : ""}>Parallelogram</option>
          <option value="cylinder" ${selectedNode.shape === "cylinder" ? "selected" : ""}>Cylinder</option>
        </select>
      </div>

      <!-- Corner Radius -->
      <div id="node-radius-container" style="display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Corner Radius</span>
          <span id="node-radius-val" style="font-size: 10px; font-family: var(--font-mono); color: var(--text-primary);">${selectedNode.rx || 0}px</span>
        </div>
        <input type="range" id="node-radius-slider" min="0" max="30" value="${selectedNode.rx || 0}" style="width: 100%; accent-color: var(--accent-color); cursor: pointer;">
      </div>
      
      <!-- Colors & Gradients -->
      <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
        <!-- Fill Type (Solid, Linear, Radial) -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Fill Type</span>
          <select id="node-fill-type" style="flex: 1; padding: 4px 8px; font-size: 11px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
            <option value="solid" ${selectedNode.fillType === "solid" || !selectedNode.fillType ? "selected" : ""}>Solid Color</option>
            <option value="linear" ${selectedNode.fillType === "linear" ? "selected" : ""}>Linear Gradient</option>
            <option value="radial" ${selectedNode.fillType === "radial" ? "selected" : ""}>Radial Gradient</option>
          </select>
        </div>

        <!-- Fill Color / Stop 1 -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span id="node-fill-label" style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">${selectedNode.fillType === "linear" || selectedNode.fillType === "radial" ? "Color 1" : "Fill"}</span>
          <input type="color" class="color-picker-input" id="node-fill-picker" value="${currentFill}" style="width: 32px; height: 26px; flex-shrink: 0;">
          <input type="text" class="text-input" id="node-fill-hex" placeholder="#FFFFFF" style="padding: 4px 8px; font-size: 11px; font-family: var(--font-mono); text-transform: uppercase; flex: 1; min-width: 0;">
        </div>

        <!-- Fill Color 2 (Visible if linear/radial gradient) -->
        <div id="node-fill2-container" style="display: ${selectedNode.fillType === "linear" || selectedNode.fillType === "radial" ? "flex" : "none"}; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Color 2</span>
          <input type="color" class="color-picker-input" id="node-fill2-picker" value="${selectedNode.fillColor2 || "#FFFFFF"}" style="width: 32px; height: 26px; flex-shrink: 0;">
          <input type="text" class="text-input" id="node-fill2-hex" placeholder="#FFFFFF" style="padding: 4px 8px; font-size: 11px; font-family: var(--font-mono); text-transform: uppercase; flex: 1; min-width: 0;">
        </div>

        <!-- Gradient Angle slider (visible if linear gradient) -->
        <div id="node-gradient-angle-container" style="display: ${selectedNode.fillType === "linear" ? "flex" : "none"}; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Grad Angle</span>
            <span id="node-gradient-angle-val" style="font-size: 10px; font-family: var(--font-mono); color: var(--text-primary);">${selectedNode.gradientAngle || 0}°</span>
          </div>
          <input type="range" id="node-gradient-angle-slider" min="0" max="360" value="${selectedNode.gradientAngle || 0}" style="width: 100%; accent-color: var(--accent-color); cursor: pointer;">
        </div>

        <!-- Border Style -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Border Style</span>
          <select id="node-border-style" style="flex: 1; padding: 4px 8px; font-size: 11px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
            <option value="solid" ${selectedNode.borderStyle === "solid" || !selectedNode.borderStyle ? "selected" : ""}>Solid</option>
            <option value="dashed" ${selectedNode.borderStyle === "dashed" ? "selected" : ""}>Dashed</option>
            <option value="dotted" ${selectedNode.borderStyle === "dotted" ? "selected" : ""}>Dotted</option>
          </select>
        </div>

        <!-- Border Color -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Border</span>
          <input type="color" class="color-picker-input" id="node-stroke-picker" value="${currentStroke}" style="width: 32px; height: 26px; flex-shrink: 0;">
          <input type="text" class="text-input" id="node-stroke-hex" placeholder="#000000" style="padding: 4px 8px; font-size: 11px; font-family: var(--font-mono); text-transform: uppercase; flex: 1; min-width: 0;">
        </div>

        <!-- Drop Shadow -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Shadow</span>
          <select id="node-shadow-type" style="flex: 1; padding: 4px 8px; font-size: 11px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
            <option value="none" ${selectedNode.shadowType === "none" || !selectedNode.shadowType ? "selected" : ""}>None</option>
            <option value="sm" ${selectedNode.shadowType === "sm" ? "selected" : ""}>Small</option>
            <option value="md" ${selectedNode.shadowType === "md" ? "selected" : ""}>Medium</option>
            <option value="lg" ${selectedNode.shadowType === "lg" ? "selected" : ""}>Large</option>
            <option value="custom" ${selectedNode.shadowType === "custom" ? "selected" : ""}>Custom</option>
          </select>
        </div>

        <!-- Custom Shadow Controls -->
        <div id="node-custom-shadow-container" style="display: ${selectedNode.shadowType === "custom" ? "flex" : "none"}; flex-direction: column; gap: 6px; border-top: 1px dashed var(--panel-border); padding-top: 6px; margin-top: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Offset X</span>
            <input type="range" id="node-shadow-dx" min="-20" max="20" value="${selectedNode.shadowOffsetX !== undefined ? selectedNode.shadowOffsetX : 4}" style="flex: 1; accent-color: var(--accent-color); cursor: pointer;">
            <span id="node-shadow-dx-val" style="font-size: 10px; font-family: var(--font-mono); color: var(--text-primary); width: 24px; text-align: right;">${selectedNode.shadowOffsetX !== undefined ? selectedNode.shadowOffsetX : 4}px</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Offset Y</span>
            <input type="range" id="node-shadow-dy" min="-20" max="20" value="${selectedNode.shadowOffsetY !== undefined ? selectedNode.shadowOffsetY : 4}" style="flex: 1; accent-color: var(--accent-color); cursor: pointer;">
            <span id="node-shadow-dy-val" style="font-size: 10px; font-family: var(--font-mono); color: var(--text-primary); width: 24px; text-align: right;">${selectedNode.shadowOffsetY !== undefined ? selectedNode.shadowOffsetY : 4}px</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Blur</span>
            <input type="range" id="node-shadow-blur" min="0" max="30" value="${selectedNode.shadowBlur !== undefined ? selectedNode.shadowBlur : 8}" style="flex: 1; accent-color: var(--accent-color); cursor: pointer;">
            <span id="node-shadow-blur-val" style="font-size: 10px; font-family: var(--font-mono); color: var(--text-primary); width: 24px; text-align: right;">${selectedNode.shadowBlur !== undefined ? selectedNode.shadowBlur : 8}px</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Shd Color</span>
            <input type="color" class="color-picker-input" id="node-shadow-color-picker" value="${selectedNode.shadowColor && selectedNode.shadowColor.startsWith("#") ? selectedNode.shadowColor : "#000000"}" style="width: 24px; height: 18px; border: 1px solid var(--panel-border); cursor: pointer; flex-shrink: 0; padding: 0; background: none;">
            <input type="text" class="text-input" id="node-shadow-color-hex" placeholder="rgba(0,0,0,0.2)" value="${selectedNode.shadowColor || 'rgba(0,0,0,0.2)'}" style="padding: 2px 4px; font-size: 10px; font-family: var(--font-mono); flex: 1; min-width: 0; height: 18px;">
          </div>
        </div>

        <!-- Text Color -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Text</span>
          <input type="color" class="color-picker-input" id="node-text-picker" value="${currentText}" style="width: 32px; height: 26px; flex-shrink: 0;">
          <input type="text" class="text-input" id="node-text-hex" placeholder="#000000" style="padding: 4px 8px; font-size: 11px; font-family: var(--font-mono); text-transform: uppercase; flex: 1; min-width: 0;">
        </div>
      </div>

      <!-- Style Presets -->
      <div style="display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--panel-border); padding-top: 8px; margin-top: 4px;">
        <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Presets</span>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="preset-btn" data-fill="#ffffff" data-stroke="#171717" data-text="#171717" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #171717; background: #ffffff; cursor: pointer;" title="Minimal Light"></button>
          <button class="preset-btn" data-fill="#121212" data-stroke="#a3a3a3" data-text="#f5f5f5" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #a3a3a3; background: #121212; cursor: pointer;" title="Minimal Dark"></button>
          <button class="preset-btn" data-fill="#ffedd5" data-stroke="#ea580c" data-text="#9a3412" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #ea580c; background: #ffedd5; cursor: pointer;" title="Sunset Orange"></button>
          <button class="preset-btn" data-fill="#dbeafe" data-stroke="#2563eb" data-text="#1e40af" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #2563eb; background: #dbeafe; cursor: pointer;" title="Ocean Blue"></button>
          <button class="preset-btn" data-fill="#dcfce7" data-stroke="#16a34a" data-text="#166534" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #16a34a; background: #dcfce7; cursor: pointer;" title="Forest Green"></button>
          <button class="preset-btn" data-fill="#ffe4e6" data-stroke="#db2777" data-text="#9d174d" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #db2777; background: #ffe4e6; cursor: pointer;" title="Rose Pink"></button>
          <button class="preset-btn" data-fill="#f3e8ff" data-stroke="#9333ea" data-text="#6b21a8" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #9333ea; background: #f3e8ff; cursor: pointer;" title="Lavender Purple"></button>
          <button class="preset-btn" data-fill="#ccfbf1" data-stroke="#0d9488" data-text="#115e59" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #0d9488; background: #ccfbf1; cursor: pointer;" title="Teal Mint"></button>
          <button class="preset-btn" data-fill="#fef3c7" data-stroke="#d97706" data-text="#92400e" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #d97706; background: #fef3c7; cursor: pointer;" title="Amber Gold"></button>
          <button class="preset-btn" data-fill="#f1f5f9" data-stroke="#475569" data-text="#1e293b" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #475569; background: #f1f5f9; cursor: pointer;" title="Slate Grey"></button>
        </div>
      </div>

      <!-- Text size & styling -->
      <div style="display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--panel-border); padding-top: 8px; margin-top: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Font</span>
          <select id="node-font-family-select" style="flex: 1; padding: 4px 8px; font-size: 11px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
            <option value="" ${!selectedNode.fontFamily ? "selected" : ""}>Default</option>
            <option value="Inter, sans-serif" ${selectedNode.fontFamily === "Inter, sans-serif" ? "selected" : ""}>Inter (Sans)</option>
            <option value="Outfit, sans-serif" ${selectedNode.fontFamily === "Outfit, sans-serif" ? "selected" : ""}>Outfit</option>
            <option value="'JetBrains Mono', monospace" ${selectedNode.fontFamily === "'JetBrains Mono', monospace" ? "selected" : ""}>JetBrains Mono</option>
            <option value="Arial, sans-serif" ${selectedNode.fontFamily === "Arial, sans-serif" ? "selected" : ""}>Arial</option>
            <option value="'Times New Roman', serif" ${selectedNode.fontFamily === "'Times New Roman', serif" ? "selected" : ""}>Times New Roman</option>
            <option value="'Courier New', monospace" ${selectedNode.fontFamily === "'Courier New', monospace" ? "selected" : ""}>Courier New</option>
            <option value="'Comic Sans MS', cursive" ${selectedNode.fontFamily === "'Comic Sans MS', cursive" ? "selected" : ""}>Comic Sans MS</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Text Size</span>
          <input type="range" id="node-text-size-slider" min="10" max="24" value="${selectedNode.fontSize || 12}" style="flex: 1; accent-color: var(--accent-color); cursor: pointer;">
          <span id="node-text-size-val" style="font-size: 10px; font-family: var(--font-mono); color: var(--text-primary); width: 32px; text-align: right;">${selectedNode.fontSize || 12}px</span>
        </div>
        
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Style</span>
          <div style="display: flex; gap: 4px; flex: 1;">
            <button class="selector-option text-style-btn" id="node-btn-bold" data-style="bold" style="padding: 4px 8px; font-weight: bold; flex: 1; border: 1px solid var(--panel-border); font-size: 10px;">B</button>
            <button class="selector-option text-style-btn" id="node-btn-italic" data-style="italic" style="padding: 4px 8px; font-style: italic; flex: 1; border: 1px solid var(--panel-border); font-size: 10px;">I</button>
            <button class="selector-option text-style-btn" id="node-btn-underline" data-style="underline" style="padding: 4px 8px; text-decoration: underline; flex: 1; border: 1px solid var(--panel-border); font-size: 10px;">U</button>
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Align H</span>
          <div style="display: flex; gap: 4px; flex: 1;">
            <button class="selector-option text-align-btn ${selectedNode.textAlign === 'left' ? 'active' : ''}" id="node-align-left" data-align="left" style="padding: 4px 8px; flex: 1; border: 1px solid var(--panel-border); font-size: 10px;">Left</button>
            <button class="selector-option text-align-btn ${(selectedNode.textAlign === 'center' || !selectedNode.textAlign) ? 'active' : ''}" id="node-align-center" data-align="center" style="padding: 4px 8px; flex: 1; border: 1px solid var(--panel-border); font-size: 10px;">Center</button>
            <button class="selector-option text-align-btn ${selectedNode.textAlign === 'right' ? 'active' : ''}" id="node-align-right" data-align="right" style="padding: 4px 8px; flex: 1; border: 1px solid var(--panel-border); font-size: 10px;">Right</button>
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Align V</span>
          <div style="display: flex; gap: 4px; flex: 1;">
            <button class="selector-option text-valign-btn ${selectedNode.verticalAlign === 'top' ? 'active' : ''}" id="node-valign-top" data-valign="top" style="padding: 4px 8px; flex: 1; border: 1px solid var(--panel-border); font-size: 10px;">Top</button>
            <button class="selector-option text-valign-btn ${(selectedNode.verticalAlign === 'middle' || !selectedNode.verticalAlign) ? 'active' : ''}" id="node-valign-middle" data-valign="middle" style="padding: 4px 8px; flex: 1; border: 1px solid var(--panel-border); font-size: 10px;">Middle</button>
            <button class="selector-option text-valign-btn ${selectedNode.verticalAlign === 'bottom' ? 'active' : ''}" id="node-valign-bottom" data-valign="bottom" style="padding: 4px 8px; flex: 1; border: 1px solid var(--panel-border); font-size: 10px;">Bottom</button>
          </div>
        </div>
      </div>
      
      <button class="btn" id="reset-node-style-btn" style="padding: 6px; font-size: 10px; margin-top: 4px;">
        Reset Style to Theme
      </button>

      <!-- Position & Locking -->
      <div style="display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--panel-border); padding-top: 8px; margin-top: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Lock Pos</span>
          <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
            <label class="switch-toggle" style="display: inline-flex; align-items: center; cursor: pointer; gap: 6px; user-select: none;">
              <input type="checkbox" id="node-lock-checkbox" ${selectedNode.locked ? "checked" : ""} style="cursor: pointer; accent-color: var(--accent-color);">
              <span style="font-size: 11px; color: var(--text-primary);">Lock Position</span>
            </label>
          </div>
        </div>
        <div id="node-coord-row" style="display: ${selectedNode.x !== undefined || selectedNode.y !== undefined ? "flex" : "none"}; align-items: center; justify-content: space-between; gap: 8px; margin-top: 2px;">
          <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono); width: 45px;">Coords</span>
          <div style="display: flex; align-items: center; gap: 6px; flex: 1; justify-content: space-between;">
            <span style="font-size: 10px; font-family: var(--font-mono); color: var(--text-secondary);">
              X: ${selectedNode.x !== undefined ? Math.round(selectedNode.x) : "-"}, Y: ${selectedNode.y !== undefined ? Math.round(selectedNode.y) : "-"}
            </span>
            <button class="btn" id="reset-node-coord-btn" style="padding: 2px 6px; font-size: 9px; margin: 0; min-height: 20px; line-height: 1;">
              Reset to Auto
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const fillPicker = styleWrapper.querySelector("#node-fill-picker");
  const fillHex = styleWrapper.querySelector("#node-fill-hex");
  const strokePicker = styleWrapper.querySelector("#node-stroke-picker");
  const strokeHex = styleWrapper.querySelector("#node-stroke-hex");
  const textPicker = styleWrapper.querySelector("#node-text-picker");
  const textHex = styleWrapper.querySelector("#node-text-hex");
  const radiusSlider = styleWrapper.querySelector("#node-radius-slider");
  const radiusVal = styleWrapper.querySelector("#node-radius-val");
  const resetStyleBtn = styleWrapper.querySelector("#reset-node-style-btn");
  
  const shapeSelect = styleWrapper.querySelector("#node-shape-select");
  const radiusContainer = styleWrapper.querySelector("#node-radius-container");
  
  const fontSelect = styleWrapper.querySelector("#node-font-family-select");
  const textSizeSlider = styleWrapper.querySelector("#node-text-size-slider");
  const textSizeVal = styleWrapper.querySelector("#node-text-size-val");
  const boldBtn = styleWrapper.querySelector("#node-btn-bold");
  const italicBtn = styleWrapper.querySelector("#node-btn-italic");
  const underlineBtn = styleWrapper.querySelector("#node-btn-underline");

  const fillTypeSelect = styleWrapper.querySelector("#node-fill-type");
  const fillColor2Picker = styleWrapper.querySelector("#node-fill2-picker");
  const fillColor2Hex = styleWrapper.querySelector("#node-fill2-hex");
  const fill2Container = styleWrapper.querySelector("#node-fill2-container");
  const gradientAngleContainer = styleWrapper.querySelector("#node-gradient-angle-container");
  const gradientAngleSlider = styleWrapper.querySelector("#node-gradient-angle-slider");
  const gradientAngleVal = styleWrapper.querySelector("#node-gradient-angle-val");
  const fillLabel = styleWrapper.querySelector("#node-fill-label");
  
  const borderStyleSelect = styleWrapper.querySelector("#node-border-style");
  
  const shadowTypeSelect = styleWrapper.querySelector("#node-shadow-type");
  const customShadowContainer = styleWrapper.querySelector("#node-custom-shadow-container");
  const shadowDxSlider = styleWrapper.querySelector("#node-shadow-dx");
  const shadowDxVal = styleWrapper.querySelector("#node-shadow-dx-val");
  const shadowDySlider = styleWrapper.querySelector("#node-shadow-dy");
  const shadowDyVal = styleWrapper.querySelector("#node-shadow-dy-val");
  const shadowBlurSlider = styleWrapper.querySelector("#node-shadow-blur");
  const shadowBlurVal = styleWrapper.querySelector("#node-shadow-blur-val");
  const shadowColorPicker = styleWrapper.querySelector("#node-shadow-color-picker");
  const shadowColorHex = styleWrapper.querySelector("#node-shadow-color-hex");
  const lockCheckbox = styleWrapper.querySelector("#node-lock-checkbox");
  const resetCoordBtn = styleWrapper.querySelector("#reset-node-coord-btn");

  const updateRadiusVisibility = (shape) => {
    if (radiusContainer) {
      radiusContainer.style.display = (shape === "rect" || !shape) ? "flex" : "none";
    }
  };
  
  updateRadiusVisibility(selectedNode.shape);
  boldBtn.classList.toggle("active", selectedNode.fontWeight === "bold");
  italicBtn.classList.toggle("active", selectedNode.fontStyle === "italic");
  underlineBtn.classList.toggle("active", selectedNode.textDecoration === "underline");

  shapeSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    updateRadiusVisibility(val);
    selectedNode.shape = val;
    renderSVG();
    saveData();
  });

  fontSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    selectedNode.fontFamily = val;
    renderSVG();
    saveData();
  });

  textSizeSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    textSizeVal.textContent = `${val}px`;
    selectedNode.fontSize = val;
    renderSVG();
    saveData();
  });

  registerUndoTrigger(fillPicker, "mousedown");
  registerUndoTrigger(fillHex, "focus");
  registerUndoTrigger(strokePicker, "mousedown");
  registerUndoTrigger(strokeHex, "focus");
  registerUndoTrigger(textPicker, "mousedown");
  registerUndoTrigger(textHex, "focus");
  registerUndoTrigger(radiusSlider, "mousedown");
  registerUndoTrigger(textSizeSlider, "mousedown");
  registerUndoTrigger(shapeSelect, "mousedown");
  registerUndoTrigger(resetStyleBtn, "click");

  registerUndoTrigger(fillTypeSelect, "mousedown");
  registerUndoTrigger(fillColor2Picker, "mousedown");
  registerUndoTrigger(fillColor2Hex, "focus");
  registerUndoTrigger(gradientAngleSlider, "mousedown");
  registerUndoTrigger(borderStyleSelect, "mousedown");
  registerUndoTrigger(shadowTypeSelect, "mousedown");
  registerUndoTrigger(shadowDxSlider, "mousedown");
  registerUndoTrigger(shadowDySlider, "mousedown");
  registerUndoTrigger(shadowBlurSlider, "mousedown");
  registerUndoTrigger(shadowColorPicker, "mousedown");
  registerUndoTrigger(shadowColorHex, "focus");
  registerUndoTrigger(lockCheckbox, "click");

  boldBtn.addEventListener("click", () => {
    const isBold = selectedNode.fontWeight !== "bold";
    selectedNode.fontWeight = isBold ? "bold" : "normal";
    boldBtn.classList.toggle("active", isBold);
    renderSVG();
    saveData();
  });

  italicBtn.addEventListener("click", () => {
    const isItalic = selectedNode.fontStyle !== "italic";
    selectedNode.fontStyle = isItalic ? "italic" : "normal";
    italicBtn.classList.toggle("active", isItalic);
    renderSVG();
    saveData();
  });

  underlineBtn.addEventListener("click", () => {
    const isUnderline = selectedNode.textDecoration !== "underline";
    selectedNode.textDecoration = isUnderline ? "underline" : "none";
    underlineBtn.classList.toggle("active", isUnderline);
    renderSVG();
    saveData();
  });

  styleWrapper.querySelectorAll(".text-align-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const align = e.target.closest(".text-align-btn").dataset.align;
      selectedNode.textAlign = align;
      styleWrapper.querySelectorAll(".text-align-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.align === align);
      });
      renderSVG();
      saveData();
    });
  });

  styleWrapper.querySelectorAll(".text-valign-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const valign = e.target.closest(".text-valign-btn").dataset.valign;
      selectedNode.verticalAlign = valign;
      styleWrapper.querySelectorAll(".text-valign-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.valign === valign);
      });
      renderSVG();
      saveData();
    });
  });

  wireColorPickerPair(fillPicker, fillHex, (val) => {
    selectedNode.fill = val;
    renderSVG();
    saveData();
  });

  wireColorPickerPair(strokePicker, strokeHex, (val) => {
    selectedNode.stroke = val;
    renderSVG();
    saveData();
  });

  wireColorPickerPair(textPicker, textHex, (val) => {
    selectedNode.textColor = val;
    renderSVG();
    saveData();
  });

  radiusSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    radiusVal.textContent = `${val}px`;
    selectedNode.rx = val;
    renderSVG();
    saveData();
  });

  // Fill Type Event Listener
  fillTypeSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    selectedNode.fillType = val;
    
    // Toggle container displays
    fill2Container.style.display = (val === "linear" || val === "radial") ? "flex" : "none";
    gradientAngleContainer.style.display = (val === "linear") ? "flex" : "none";
    
    // Update label
    fillLabel.textContent = (val === "linear" || val === "radial") ? "Color 1" : "Fill";
    
    renderSVG();
    saveData();
  });

  // Wire Color 2
  wireColorPickerPair(fillColor2Picker, fillColor2Hex, (val) => {
    selectedNode.fillColor2 = val;
    renderSVG();
    saveData();
  });

  // Gradient Angle Slider
  gradientAngleSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    gradientAngleVal.textContent = `${val}°`;
    selectedNode.gradientAngle = val;
    renderSVG();
    saveData();
  });

  // Border Style Event Listener
  borderStyleSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    selectedNode.borderStyle = val;
    renderSVG();
    saveData();
  });

  // Shadow Type Event Listener
  shadowTypeSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    selectedNode.shadowType = val;
    customShadowContainer.style.display = (val === "custom") ? "flex" : "none";
    renderSVG();
    saveData();
  });

  // Shadow Custom dx, dy, blur
  shadowDxSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    shadowDxVal.textContent = `${val}px`;
    selectedNode.shadowOffsetX = val;
    renderSVG();
    saveData();
  });

  shadowDySlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    shadowDyVal.textContent = `${val}px`;
    selectedNode.shadowOffsetY = val;
    renderSVG();
    saveData();
  });

  shadowBlurSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    shadowBlurVal.textContent = `${val}px`;
    selectedNode.shadowBlur = val;
    renderSVG();
    saveData();
  });

  // Wire Shadow Color
  shadowColorPicker.addEventListener("input", (e) => {
    const val = e.target.value;
    shadowColorHex.value = val;
    selectedNode.shadowColor = val;
    renderSVG();
    saveData();
  });

  shadowColorHex.addEventListener("input", (e) => {
    const val = e.target.value;
    selectedNode.shadowColor = val;
    if (val.startsWith("#") && (val.length === 4 || val.length === 7)) {
      shadowColorPicker.value = val;
    }
    renderSVG();
    saveData();
  });

  // Wire preset buttons
  styleWrapper.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const targetBtn = e.target.closest(".preset-btn");
      if (!targetBtn) return;
      selectedNode.fill = targetBtn.dataset.fill;
      selectedNode.stroke = targetBtn.dataset.stroke;
      selectedNode.textColor = targetBtn.dataset.text;
      renderSVG();
      renderSidebarSelection();
      saveData();
    });
  });

  resetStyleBtn.addEventListener("click", () => {
    delete selectedNode.fill;
    delete selectedNode.stroke;
    delete selectedNode.textColor;
    delete selectedNode.rx;
    delete selectedNode.shape;
    delete selectedNode.fontSize;
    delete selectedNode.fontWeight;
    delete selectedNode.fontStyle;
    delete selectedNode.textDecoration;
    delete selectedNode.fillType;
    delete selectedNode.fillColor2;
    delete selectedNode.gradientAngle;
    delete selectedNode.borderStyle;
    delete selectedNode.shadowType;
    delete selectedNode.shadowOffsetX;
    delete selectedNode.shadowOffsetY;
    delete selectedNode.shadowBlur;
    delete selectedNode.shadowColor;
    renderSVG();
    renderSidebarSelection();
    saveData();
    showToast("Reset box styles to defaults");
  });

  if (lockCheckbox) {
    lockCheckbox.addEventListener("change", (e) => {
      selectedNode.locked = e.target.checked;
      showToast(selectedNode.locked ? "Position locked" : "Position unlocked");
      renderSVG();
      saveData();
    });
  }

  if (resetCoordBtn) {
    resetCoordBtn.addEventListener("click", () => {
      delete selectedNode.x;
      delete selectedNode.y;
      calculateCoordinates();
      renderAll();
      showToast("Position reset to auto-layout");
    });
  }

  selectionSettingsContainer.appendChild(styleWrapper);

  // C. Connections checkgrid (Target lists)
  const connectionWrapper = document.createElement("div");
  connectionWrapper.className = "input-field-wrapper";
  connectionWrapper.style.marginTop = "16px";
  connectionWrapper.innerHTML = `
    <label>Connect to Boxes</label>
    <span style="font-size:10px; color:var(--text-secondary); margin-bottom:4px; display:block;">
      Select destination boxes below (or Shift-click them on canvas):
    </span>
  `;
  
  const checkboxGrid = document.createElement("div");
  checkboxGrid.className = "target-checkbox-grid";
  
  let targetOptionsCount = 0;
  
  state.columns.forEach((col, colIdx) => {
    // Collect target candidates (cannot connect to itself)
    const validTargets = col.nodes.filter(n => n.id !== selectedNode.id);
    if (validTargets.length === 0) return;
    
    const group = document.createElement("div");
    group.className = "target-checkbox-column-group";
    group.innerHTML = `<div class="target-checkbox-column-title">Column ${colIdx + 1}</div>`;
    
    validTargets.forEach(target => {
      targetOptionsCount++;
      const targetObj = selectedNode.targets.find(t => (typeof t === "string" ? t : t.id) === target.id);
      const isChecked = !!targetObj;
      
      const row = document.createElement("div");
      row.className = "target-checkbox-row";
      row.style.display = "flex";
      row.style.flexDirection = "column";
      row.style.gap = "6px";
      row.style.padding = "6px 0";
      row.style.borderBottom = "1px solid var(--panel-border)";

      const topRow = document.createElement("div");
      topRow.style.display = "flex";
      topRow.style.alignItems = "center";
      topRow.style.gap = "8px";
      
      const boxDisplayName = target.label.trim() !== "" ? target.label : `(Empty ${target.id})`;
      topRow.innerHTML = `
        <input type="checkbox" id="chk-${target.id}" ${isChecked ? "checked" : ""}>
        <label for="chk-${target.id}" style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer;">
          ${boxDisplayName} <span style="font-family: monospace; font-size: 9px; color: var(--text-muted);">[${target.id}]</span>
        </label>
      `;
      row.appendChild(topRow);

      if (isChecked) {
        const sourceAnchor = (typeof targetObj === "object" && targetObj.sourceAnchor) ? targetObj.sourceAnchor : "auto";
        const targetAnchor = (typeof targetObj === "object" && targetObj.targetAnchor) ? targetObj.targetAnchor : "auto";
        const lineShape = (typeof targetObj === "object" && targetObj.lineShape) ? targetObj.lineShape : "auto";
        const markerType = (typeof targetObj === "object" && targetObj.markerType) ? targetObj.markerType : "arrow";
        const lineOffset = (typeof targetObj === "object" && targetObj.lineOffset !== undefined) ? targetObj.lineOffset : 0;
        const lineLabel = (typeof targetObj === "object" && targetObj.label !== undefined) ? targetObj.label : "";

        const dropdownsRow = document.createElement("div");
        dropdownsRow.style.display = "flex";
        dropdownsRow.style.flexDirection = "column";
        dropdownsRow.style.gap = "8px";
        dropdownsRow.style.marginLeft = "22px";
        dropdownsRow.style.padding = "4px 0 6px 0";

        // Grid for dropdowns
        const gridDiv = document.createElement("div");
        gridDiv.style.display = "grid";
        gridDiv.style.gridTemplateColumns = "1fr 1fr";
        gridDiv.style.gap = "6px";

        gridDiv.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Start Anchor</span>
            <select class="connection-select" data-prop="sourceAnchor" style="padding: 2px 4px; font-size: 10px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
              <option value="auto" ${sourceAnchor === "auto" ? "selected" : ""}>Auto</option>
              <option value="top" ${sourceAnchor === "top" ? "selected" : ""}>Top</option>
              <option value="bottom" ${sourceAnchor === "bottom" ? "selected" : ""}>Bottom</option>
              <option value="left" ${sourceAnchor === "left" ? "selected" : ""}>Left</option>
              <option value="right" ${sourceAnchor === "right" ? "selected" : ""}>Right</option>
            </select>
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">End Anchor</span>
            <select class="connection-select" data-prop="targetAnchor" style="padding: 2px 4px; font-size: 10px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
              <option value="auto" ${targetAnchor === "auto" ? "selected" : ""}>Auto</option>
              <option value="top" ${targetAnchor === "top" ? "selected" : ""}>Top</option>
              <option value="bottom" ${targetAnchor === "bottom" ? "selected" : ""}>Bottom</option>
              <option value="left" ${targetAnchor === "left" ? "selected" : ""}>Left</option>
              <option value="right" ${targetAnchor === "right" ? "selected" : ""}>Right</option>
            </select>
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Line Shape</span>
            <select class="connection-select" data-prop="lineShape" style="padding: 2px 4px; font-size: 10px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
              <option value="auto" ${lineShape === "auto" ? "selected" : ""}>Default</option>
              <option value="orthogonal" ${lineShape === "orthogonal" ? "selected" : ""}>Elbow</option>
              <option value="straight" ${lineShape === "straight" ? "selected" : ""}>Straight</option>
              <option value="curved" ${lineShape === "curved" ? "selected" : ""}>Curved</option>
            </select>
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">End Cap</span>
            <select class="connection-select" data-prop="markerType" style="padding: 2px 4px; font-size: 10px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
              <option value="arrow" ${markerType === "arrow" ? "selected" : ""}>Arrow</option>
              <option value="dot" ${markerType === "dot" ? "selected" : ""}>Dot</option>
              <option value="none" ${markerType === "none" ? "selected" : ""}>None</option>
            </select>
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Line Color</span>
            <div style="display: flex; gap: 4px; align-items: center;">
              <input type="color" class="connection-color-picker" value="${targetObj.strokeColor || (theme === 'dark' ? '#a3a3a3' : '#171717')}" style="width: 24px; height: 18px; border: 1px solid var(--panel-border); cursor: pointer; flex-shrink: 0; padding: 0; background: none;">
              <input type="text" class="connection-color-text text-input" value="${targetObj.strokeColor || ''}" placeholder="Theme" style="padding: 2px 4px; font-size: 9px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none; width: 100%; height: 18px;">
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Line Style</span>
            <select class="connection-select" data-prop="strokeStyle" style="padding: 2px 4px; font-size: 10px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
              <option value="solid" ${(!targetObj.strokeStyle || targetObj.strokeStyle === "solid") ? "selected" : ""}>Solid</option>
              <option value="dashed" ${targetObj.strokeStyle === "dashed" ? "selected" : ""}>Dashed</option>
            </select>
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px; grid-column: span 2; margin-top: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Thickness</span>
              <span class="thickness-display" style="font-size: 9px; font-family: var(--font-mono); color: var(--text-primary);">${targetObj.strokeWidth || state.strokeWidth}px</span>
            </div>
            <input type="range" class="connection-thickness-slider" min="1" max="5" step="0.5" value="${targetObj.strokeWidth || state.strokeWidth}" style="width: 100%; accent-color: var(--accent-color); cursor: pointer;">
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px; grid-column: span 2;">
            <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Line Label</span>
            <input type="text" class="connection-label-input" value="${lineLabel}" placeholder="e.g. Yes / No" style="padding: 4px 6px; font-size: 10px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none; border-radius: 2px;">
          </div>
        `;
        
        dropdownsRow.appendChild(gridDiv);

        // Show Bend Offset slider if elbow or curved is used
        const isElbowOrCurved = (lineShape === "orthogonal" || lineShape === "curved") || 
                                (lineShape === "auto" && (state.lineShape === "orthogonal" || state.lineShape === "curved"));
        if (isElbowOrCurved) {
          const offsetSliderWrapper = document.createElement("div");
          offsetSliderWrapper.style.display = "flex";
          offsetSliderWrapper.style.flexDirection = "column";
          offsetSliderWrapper.style.gap = "2px";
          offsetSliderWrapper.style.marginTop = "4px";
          offsetSliderWrapper.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Bend Offset</span>
              <span class="offset-display" style="font-size: 9px; font-family: var(--font-mono); color: var(--text-primary);">${lineOffset}px</span>
            </div>
            <input type="range" class="offset-slider" min="-150" max="150" value="${lineOffset}" style="width: 100%; accent-color: var(--accent-color); cursor: pointer;">
          `;
          dropdownsRow.appendChild(offsetSliderWrapper);

          const slider = offsetSliderWrapper.querySelector(".offset-slider");
          const display = offsetSliderWrapper.querySelector(".offset-display");
          slider.addEventListener("input", (e) => {
            const val = parseInt(e.target.value);
            display.textContent = `${val}px`;
            
            const tIdx = selectedNode.targets.findIndex(t => (typeof t === "string" ? t : t.id) === target.id);
            if (tIdx !== -1) {
              if (typeof selectedNode.targets[tIdx] === "string") {
                selectedNode.targets[tIdx] = { id: target.id, sourceAnchor: "auto", targetAnchor: "auto", lineShape: "auto", markerType: "arrow", lineOffset: 0, label: "" };
              }
              selectedNode.targets[tIdx].lineOffset = val;
              renderSVG();
              saveData();
            }
          });
        }

        // Wire select elements
        dropdownsRow.querySelectorAll(".connection-select").forEach(sel => {
          sel.addEventListener("change", (e) => {
            const prop = e.target.dataset.prop;
            const val = e.target.value;
            
            const tIdx = selectedNode.targets.findIndex(t => (typeof t === "string" ? t : t.id) === target.id);
            if (tIdx !== -1) {
              if (typeof selectedNode.targets[tIdx] === "string") {
                selectedNode.targets[tIdx] = { id: target.id, sourceAnchor: "auto", targetAnchor: "auto", lineShape: "auto", markerType: "arrow", lineOffset: 0, label: "" };
              }
              selectedNode.targets[tIdx][prop] = val;
              renderSVG();
              renderSidebarSelection();
              saveData();
            }
          });
        });

        // Wire label input
        const labelInput = dropdownsRow.querySelector(".connection-label-input");
        if (labelInput) {
          labelInput.addEventListener("input", (e) => {
            const val = e.target.value;
            const tIdx = selectedNode.targets.findIndex(t => (typeof t === "string" ? t : t.id) === target.id);
            if (tIdx !== -1) {
              if (typeof selectedNode.targets[tIdx] === "string") {
                selectedNode.targets[tIdx] = { id: target.id, sourceAnchor: "auto", targetAnchor: "auto", lineShape: "auto", markerType: "arrow", lineOffset: 0, label: "" };
              }
              selectedNode.targets[tIdx].label = val;
              renderSVG();
              saveData();
            }
          });
        }

        // Wire custom style connection elements
        const cPicker = dropdownsRow.querySelector(".connection-color-picker");
        const cText = dropdownsRow.querySelector(".connection-color-text");
        if (cPicker && cText) {
          cPicker.addEventListener("input", (e) => {
            const val = e.target.value.toUpperCase();
            cText.value = val;
            
            const tIdx = selectedNode.targets.findIndex(t => (typeof t === "string" ? t : t.id) === target.id);
            if (tIdx !== -1) {
              if (typeof selectedNode.targets[tIdx] === "string") {
                selectedNode.targets[tIdx] = { id: target.id, sourceAnchor: "auto", targetAnchor: "auto", lineShape: "auto", markerType: "arrow", lineOffset: 0, label: "" };
              }
              selectedNode.targets[tIdx].strokeColor = val;
              renderSVG();
              saveData();
            }
          });
          
          cText.addEventListener("input", (e) => {
            let val = e.target.value.trim().toUpperCase();
            if (val && !val.startsWith("#")) val = "#" + val;
            const reg = /^#[0-9A-F]{6}$|^#[0-9A-F]{3}$/;
            
            const tIdx = selectedNode.targets.findIndex(t => (typeof t === "string" ? t : t.id) === target.id);
            if (tIdx !== -1) {
              if (typeof selectedNode.targets[tIdx] === "string") {
                selectedNode.targets[tIdx] = { id: target.id, sourceAnchor: "auto", targetAnchor: "auto", lineShape: "auto", markerType: "arrow", lineOffset: 0, label: "" };
              }
              if (reg.test(val) || val === "") {
                selectedNode.targets[tIdx].strokeColor = val;
                if (reg.test(val)) cPicker.value = val;
                renderSVG();
                saveData();
              }
            }
          });
        }

        const thicknessSlider = dropdownsRow.querySelector(".connection-thickness-slider");
        const thicknessDisplay = dropdownsRow.querySelector(".thickness-display");
        if (thicknessSlider && thicknessDisplay) {
          thicknessSlider.addEventListener("input", (e) => {
            const val = parseFloat(e.target.value);
            thicknessDisplay.textContent = `${val}px`;
            
            const tIdx = selectedNode.targets.findIndex(t => (typeof t === "string" ? t : t.id) === target.id);
            if (tIdx !== -1) {
              if (typeof selectedNode.targets[tIdx] === "string") {
                selectedNode.targets[tIdx] = { id: target.id, sourceAnchor: "auto", targetAnchor: "auto", lineShape: "auto", markerType: "arrow", lineOffset: 0, label: "" };
              }
              selectedNode.targets[tIdx].strokeWidth = val;
              renderSVG();
              saveData();
            }
          });
        }

        row.appendChild(dropdownsRow);
      }

      const chk = topRow.querySelector("input");
      chk.addEventListener("change", (e) => {
        if (e.target.checked) {
          const alreadyHas = selectedNode.targets.some(t => (typeof t === "string" ? t : t.id) === target.id);
          if (!alreadyHas) {
            selectedNode.targets.push({ id: target.id, sourceAnchor: "auto", targetAnchor: "auto", lineShape: "auto", markerType: "arrow", lineOffset: 0, label: "" });
          }
        } else {
          selectedNode.targets = selectedNode.targets.filter(t => (typeof t === "string" ? t : t.id) !== target.id);
        }
        
        renderSVG();
        renderSidebarSelection();
        saveData();
      });
      
      group.appendChild(row);
    });
    
    checkboxGrid.appendChild(group);
  });
  
  if (targetOptionsCount === 0) {
    checkboxGrid.innerHTML = `
      <div style="font-size: 11px; color: var(--text-muted); font-style: italic; text-align: center; padding: 10px;">
        No other boxes available to connect to. Add more boxes first!
      </div>
    `;
  }
  
  connectionWrapper.appendChild(checkboxGrid);
  selectionSettingsContainer.appendChild(connectionWrapper);

  // D. Delete Node Button
  const deleteBtnWrapper = document.createElement("div");
  deleteBtnWrapper.style.marginTop = "20px";
  deleteBtnWrapper.innerHTML = `
    <button class="btn btn-danger" id="delete-node-btn" style="padding: 10px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
      Delete This Box (Del)
    </button>
  `;
  
  const delBtn = deleteBtnWrapper.querySelector("#delete-node-btn");
  delBtn.addEventListener("click", () => {
    removeNode(selectedNode.id);
  });
  
  selectionSettingsContainer.appendChild(deleteBtnWrapper);
}

// 7. Graph Alteration Operations

// Add Column at the end
function addColumn() {
  pushState();
  const colId = `col_${Date.now()}`;
  state.columns.push({
    id: colId,
    nodes: []
  });
  renderAll();
  saveData();
  showToast("Added a new column");
}

// Remove specific Column
function removeColumn(colId) {
  pushState();
  const colIdx = state.columns.findIndex(c => c.id === colId);
  if (colIdx === -1) return;
  
  // Find all node IDs in that column
  const removedNodeIds = state.columns[colIdx].nodes.map(n => n.id);
  
  // Delete the column
  state.columns.splice(colIdx, 1);
  
  // Clean references pointing to nodes in deleted column
  state.columns.forEach(col => {
    col.nodes.forEach(node => {
      node.targets = node.targets.filter(t => {
        const id = typeof t === "string" ? t : t.id;
        return !removedNodeIds.includes(id);
      });
    });
  });
  
  // Clear active selection if it was inside this deleted column
  if (selectedNodeId && removedNodeIds.includes(selectedNodeId)) {
    selectedNodeId = null;
  }
  
  renderAll();
  saveData();
  showToast("Removed column and its boxes");
}

// Add Node inside a column
function addNodeToColumn(colId) {
  pushState();
  const col = state.columns.find(c => c.id === colId);
  if (!col) return;
  
  // Generate distinct ID
  const nodeId = "B_" + Math.random().toString(36).substr(2, 5).toUpperCase();
  
  col.nodes.push({
    id: nodeId,
    label: "",
    targets: []
  });
  
  renderAll();
  selectNode(nodeId);
  saveData();
  showToast(`Created new Box [${nodeId}]`);
}

// Delete specific Node
function removeNode(nodeId) {
  pushState();
  state.columns.forEach(col => {
    col.nodes = col.nodes.filter(n => n.id !== nodeId);
  });
  
  state.columns.forEach(col => {
    col.nodes.forEach(node => {
      node.targets = node.targets.filter(t => {
        const id = typeof t === "string" ? t : t.id;
        return id !== nodeId;
      });
    });
  });
  
  selectedNodeIds.delete(nodeId);
  if (selectedNodeId === nodeId) {
    selectedNodeId = null;
  }
  
  renderAll();
  saveData();
  showToast(`Deleted Box ${nodeId}`);
}

// Reset entire graph to DEFAULT 4-column branching layout
function resetLayout() {
  if (confirm("Are you sure you want to reset the flowchart to the default 4-column branching layout? This will discard your custom structure.")) {
    pushState();
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    selectedNodeIds.clear();
    selectedNodeId = null;
    connectionSourceId = null;
    setTool("select");
    renderAll();
    resetZoomAndPan();
    saveData();
    showToast("Reset flowchart to default layout");
  }
}

// 8. Connection Drawing Operations (Interactive Canvas tools)

function handleConnectionToolClick(nodeId) {
  if (!connectionSourceId) {
    // Set as first connection node
    connectionSourceId = nodeId;
    
    // Visually highlight source node group immediately
    document.querySelectorAll(".node-group").forEach(g => {
      g.classList.toggle("connecting-source", g.dataset.id === nodeId);
    });
    
    showToast("Selected source box. Click target box to draw arrow.");
  } else {
    if (connectionSourceId === nodeId) {
      // Cancel connection if clicking the same node
      connectionSourceId = null;
      document.querySelectorAll(".node-group").forEach(g => g.classList.remove("connecting-source"));
      showToast("Connection drawing cancelled.");
    } else {
      // Toggle connection from source to target
      toggleConnection(connectionSourceId, nodeId);
      
      // Clear visual state
      connectionSourceId = null;
      document.querySelectorAll(".node-group").forEach(g => g.classList.remove("connecting-source"));
    }
  }
}

function toggleConnection(sourceId, targetId) {
  pushState();
  let sourceNode = null;
  state.columns.forEach(col => {
    const found = col.nodes.find(n => n.id === sourceId);
    if (found) sourceNode = found;
  });
  
  if (!sourceNode) return;
  
  const index = sourceNode.targets.findIndex(t => (typeof t === "string" ? t : t.id) === targetId);
  const hasConnection = index !== -1;
  
  if (hasConnection) {
    sourceNode.targets.splice(index, 1);
    showToast("Arrow removed.");
  } else {
    sourceNode.targets.push({ id: targetId, sourceAnchor: "auto", targetAnchor: "auto", lineShape: "auto", markerType: "arrow", lineOffset: 0 });
    showToast("Arrow created!");
  }
  
  renderAll();
  saveData();
}

function setTool(tool) {
  activeTool = tool;
  
  // Update button selection
  toolSelectBtn.classList.toggle("active", tool === "select");
  toolConnectBtn.classList.toggle("active", tool === "connect");
  
  // Toggle cursor styling on canvas wrapper
  canvasContainer.classList.toggle("tool-connect", tool === "connect");
  
  // Cancel connection source
  connectionSourceId = null;
  document.querySelectorAll(".node-group").forEach(g => g.classList.remove("connecting-source"));
  
  if (tool === "connect") {
    showToast("Connect Mode: Click source box, then click target box.");
  }
}

// 9. Style Selectors & Theme handlers

function updateStrokeWidthStyles() {
  svgEl.style.setProperty("--svg-stroke-width", `${state.strokeWidth}px`);
  const marker = document.getElementById("arrow");
  if (marker) {
    const size = Math.max(6, 6 * (state.strokeWidth / 1.2));
    marker.setAttribute("markerWidth", size);
    marker.setAttribute("markerHeight", size);
  }
}

// 8.5 Zoom & Pan Helpers
function applyZoomPan() {
  svgEl.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  svgEl.style.transformOrigin = "0 0";
  
  const displayText = document.getElementById("zoom-display-text");
  if (displayText) {
    displayText.textContent = `${Math.round(zoom * 100)}%`;
  }
  updateMinimapViewport();
}

function resetZoomAndPan() {
  const viewport = document.querySelector(".canvas-viewport");
  if (!viewport) return;
  const vWidth = viewport.clientWidth;
  const vHeight = viewport.clientHeight;
  
  zoom = 1.0;
  panX = (vWidth - currentCanvasWidth) / 2;
  panY = (vHeight - currentCanvasHeight) / 2;
  
  applyZoomPan();
}

function setupEventListeners() {
  // Sidebar tab clicking
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Add Column
  addColumnBtn.addEventListener("click", addColumn);

  // Undo / Redo Click Handlers
  const undoBtn = document.getElementById("undo-btn");
  const redoBtn = document.getElementById("redo-btn");
  if (undoBtn) undoBtn.addEventListener("click", executeUndo);
  if (redoBtn) redoBtn.addEventListener("click", executeRedo);

  // Register Undo Triggers for Sidebar options
  registerUndoTrigger(addColumnBtn, "click");
  registerUndoTrigger(clearBtn, "click");
  registerUndoTrigger(resetBtn, "click");
  registerUndoTrigger(columnTitlesSelector, "click");
  registerUndoTrigger(columnGuidesSelector, "click");
  registerUndoTrigger(document.getElementById("swimlanes-selector"), "click");
  registerUndoTrigger(layoutDirectionSelector, "click");
  registerUndoTrigger(strokeWidthSelector, "click");
  registerUndoTrigger(lineStyleSelector, "click");
  registerUndoTrigger(lineShapeSelector, "click");
  registerUndoTrigger(globalFlowSelector, "click");
  registerUndoTrigger(chartTitleInput, "focus");
  registerUndoTrigger(fontFamilySelect, "mousedown");
  registerUndoTrigger(resetFontBtn, "click");

  // Tool Switching click handlers
  toolSelectBtn.addEventListener("click", () => setTool("select"));
  toolConnectBtn.addEventListener("click", () => setTool("connect"));

  // Chart Title Input
  if (chartTitleInput) {
    chartTitleInput.addEventListener("input", (e) => {
      state.chartTitle = e.target.value;
      renderSVG();
      saveData();
    });
  }

  // Keyboard Shortcuts (only when not typing in text fields)
  window.addEventListener("keydown", (e) => {
    const active = document.activeElement;
    const isTyping = active && (
      active.tagName === "TEXTAREA" ||
      (active.tagName === "INPUT" && (active.type === "text" || active.type === "search" || active.type === "number" || !active.type)) ||
      active.classList.contains("inline-node-editor") ||
      active.isContentEditable
    );
    
    const key = e.key.toLowerCase();
    
    // Keyboard shortcuts with Ctrl / Cmd
    if ((e.ctrlKey || e.metaKey) && !isTyping) {
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          executeRedo();
        } else {
          executeUndo();
        }
        return;
      }
      if (key === "y") {
        e.preventDefault();
        executeRedo();
        return;
      }
      if (key === "g") {
        e.preventDefault();
        if (e.shiftKey) {
          // Ungroup
          if (selectedNodeIds.size > 0) {
            pushState();
            let changed = false;
            selectedNodeIds.forEach(id => {
              const node = findNodeById(id);
              if (node && node.groupId) {
                delete node.groupId;
                changed = true;
              }
            });
            if (changed) { renderAll(); saveData(); showToast("Ungrouped nodes"); }
          }
        } else {
          // Group
          if (selectedNodeIds.size > 1) {
            pushState();
            const groupId = "G_" + Math.random().toString(36).substr(2, 9);
            selectedNodeIds.forEach(id => {
              const node = findNodeById(id);
              if (node) node.groupId = groupId;
            });
            renderAll(); saveData(); showToast("Grouped nodes");
          }
        }
        return;
      }
      if (key === "a") {
        e.preventDefault();
        selectedNodeIds.clear();
        state.columns.forEach(col => {
          col.nodes.forEach(n => {
            if (!n.locked) selectedNodeIds.add(n.id);
          });
        });
        if (selectedNodeIds.size === 1) {
          selectNode(Array.from(selectedNodeIds)[0]);
        } else {
          selectNode(null);
        }
        renderAll();
        return;
      }
      if (key === "c") {
        if (selectedNodeIds.size > 0) {
          e.preventDefault();
          clipboardNodes = [];
          selectedNodeIds.forEach(id => {
            const n = findNodeById(id);
            if (n && !n.locked) clipboardNodes.push(JSON.parse(JSON.stringify(n)));
          });
          showToast(`Copied ${clipboardNodes.length} boxes`);
        }
        return;
      }
      if (key === "v") {
        if (clipboardNodes.length > 0) {
          e.preventDefault();
          pushState();
          selectedNodeIds.clear();
          const targetCol = state.columns[state.columns.length - 1]; // Paste into last column for simplicity, or we can just append to the first column
          
          clipboardNodes.forEach(clipNode => {
            const newNode = JSON.parse(JSON.stringify(clipNode));
            newNode.id = "B_" + Math.random().toString(36).substr(2, 5).toUpperCase();
            newNode.x = (newNode.x || 0) + 20;
            newNode.y = (newNode.y || 0) + 20;
            newNode.targets = []; // Do not copy connections by default
            targetCol.nodes.push(newNode);
            selectedNodeIds.add(newNode.id);
          });
          selectNode(null); // Multi-select
          renderAll();
          saveData();
          showToast(`Pasted ${clipboardNodes.length} boxes`);
        }
        return;
      }
      if (key === "d") {
        if (selectedNodeIds.size > 0) {
          e.preventDefault();
          pushState();
          const newIds = [];
          selectedNodeIds.forEach(id => {
            const n = findNodeById(id);
            if (n && !n.locked) {
              const newNode = JSON.parse(JSON.stringify(n));
              newNode.id = "B_" + Math.random().toString(36).substr(2, 5).toUpperCase();
              newNode.x = (newNode.x || 0) + 20;
              newNode.y = (newNode.y || 0) + 20;
              newNode.targets = [];
              
              // Find which column to put it in
              state.columns.forEach(col => {
                if (col.nodes.some(cn => cn.id === id)) {
                  col.nodes.push(newNode);
                }
              });
              newIds.push(newNode.id);
            }
          });
          selectedNodeIds.clear();
          newIds.forEach(id => selectedNodeIds.add(id));
          selectNode(null);
          renderAll();
          saveData();
          showToast(`Duplicated ${newIds.length} boxes`);
        }
        return;
      }
    }

    if (e.key === " ") {
      if (!isTyping) {
        if (!isSpacePressed) {
          isSpacePressed = true;
          const viewport = document.querySelector(".canvas-viewport");
          if (viewport) viewport.style.cursor = "grab";
        }
        e.preventDefault();
      }
      return;
    }

    if (e.key === "?") {
      if (!isTyping) {
        const modal = document.getElementById("shortcuts-modal");
        if (modal) {
          if (modal.style.display === "none") {
            modal.style.display = "flex";
          } else {
            modal.style.display = "none";
          }
        }
        e.preventDefault();
      }
      return;
    }

    if (isTyping) return;
    
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      if (selectedNodeIds.size > 0) {
        e.preventDefault();
        const moveAmount = e.shiftKey ? (state.gridSize || 20) : 1;
        let dx = 0; let dy = 0;
        if (e.key === "ArrowUp") dy = -moveAmount;
        if (e.key === "ArrowDown") dy = moveAmount;
        if (e.key === "ArrowLeft") dx = -moveAmount;
        if (e.key === "ArrowRight") dx = moveAmount;

        pushState();
        selectedNodeIds.forEach(id => {
          const n = findNodeById(id);
          if (n && !n.locked) {
            const coords = nodeCoords[id] || { x: 0, y: 0 };
            n.x = (n.x !== undefined ? n.x : coords.x) + dx;
            n.y = (n.y !== undefined ? n.y : coords.y) + dy;
            validateAndClampNode(n);
          }
        });
        calculateCoordinates();
        renderSVG();
        saveData();
      }
      return;
    }
    
    if (e.key === "Tab") {
      e.preventDefault();
      if (selectedNodeId) {
        pushState();
        let colIdx = -1;
        let sourceNode = null;
        state.columns.forEach((col, idx) => {
          const found = col.nodes.find(n => n.id === selectedNodeId);
          if (found) {
            colIdx = idx;
            sourceNode = found;
          }
        });

        if (colIdx !== -1 && sourceNode) {
          if (colIdx === state.columns.length - 1) {
            const colId = `col_${Date.now()}`;
            state.columns.push({
              id: colId,
              nodes: []
            });
          }

          const targetCol = state.columns[colIdx + 1];
          const newNodeId = "B_" + Math.random().toString(36).substr(2, 5).toUpperCase();
          targetCol.nodes.push({
            id: newNodeId,
            label: "",
            targets: []
          });

          sourceNode.targets.push({
            id: newNodeId,
            sourceAnchor: "auto",
            targetAnchor: "auto",
            lineShape: "auto",
            markerType: "arrow",
            lineOffset: 0
          });

          renderAll();
          saveData();
          selectNode(newNodeId);
          setTimeout(() => {
            startInlineEditing(newNodeId);
          }, 50);
          showToast(`Spawned child box ${newNodeId}`);
        }
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedNodeId) {
        pushState();
        let targetCol = null;
        state.columns.forEach(col => {
          const found = col.nodes.some(n => n.id === selectedNodeId);
          if (found) targetCol = col;
        });

        if (targetCol) {
          const newNodeId = "B_" + Math.random().toString(36).substr(2, 5).toUpperCase();
          targetCol.nodes.push({
            id: newNodeId,
            label: "",
            targets: []
          });

          renderAll();
          saveData();
          selectNode(newNodeId);
          setTimeout(() => {
            startInlineEditing(newNodeId);
          }, 50);
          showToast(`Spawned sibling box ${newNodeId}`);
        }
      }
      return;
    }

    if (key === "v") {
      setTool("select");
    } else if (key === "c") {
      setTool("connect");
    } else if (e.key === "Delete" || e.key === "Backspace") {
      if (selectedNodeIds.size > 0) {
        pushState();
        const count = selectedNodeIds.size;
        selectedNodeIds.forEach(id => {
          state.columns.forEach(col => {
            col.nodes = col.nodes.filter(n => n.id !== id);
          });
          state.columns.forEach(col => {
            col.nodes.forEach(node => {
              node.targets = node.targets.filter(t => {
                const tId = typeof t === "string" ? t : t.id;
                return tId !== id;
              });
            });
          });
        });
        selectedNodeIds.clear();
        selectedNodeId = null;
        renderAll();
        saveData();
        showToast(`Deleted ${count} boxes`);
      } else if (selectedConnector) {
        pushState();
        const { sourceId, targetId } = selectedConnector;
        const sourceNode = findNodeById(sourceId);
        if (sourceNode) {
          sourceNode.targets = sourceNode.targets.filter(t => (typeof t === "string" ? t : t.id) !== targetId);
        }
        selectedConnector = null;
        renderAll();
        saveData();
        showToast("Connection deleted");
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === " ") {
      isSpacePressed = false;
      isPanning = false;
      const viewport = document.querySelector(".canvas-viewport");
      if (viewport) {
        viewport.style.cursor = "";
      }
    }
  });

  // Stroke width selector
  strokeWidthSelector.addEventListener("click", (e) => {
    const btn = e.target.closest(".selector-option");
    if (!btn) return;
    
    strokeWidthSelector.querySelectorAll(".selector-option").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    
    state.strokeWidth = parseFloat(btn.dataset.value);
    updateStrokeWidthStyles();
    saveData();
  });

  // Line style selector
  lineStyleSelector.addEventListener("click", (e) => {
    const btn = e.target.closest(".selector-option");
    if (!btn) return;

    lineStyleSelector.querySelectorAll(".selector-option").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    state.lineStyle = btn.dataset.value;
    
    const lines = connectorsGroup.querySelectorAll(".connector-line");
    lines.forEach(line => {
      line.classList.toggle("dashed", state.lineStyle === "dashed");
    });
    saveData();
  });

  // Line shape selector
  lineShapeSelector.addEventListener("click", (e) => {
    const btn = e.target.closest(".selector-option");
    if (!btn) return;

    lineShapeSelector.querySelectorAll(".selector-option").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    state.lineShape = btn.dataset.value;
    renderSVG();
    saveData();
  });

  // Global flow selector
  if (globalFlowSelector) {
    globalFlowSelector.addEventListener("click", (e) => {
      const btn = e.target.closest(".selector-option");
      if (!btn) return;

      globalFlowSelector.querySelectorAll(".selector-option").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      state.animatedFlow = btn.dataset.value;
      renderSVG();
      saveData();
    });
  }

  // Column titles toggle
  columnTitlesSelector.addEventListener("click", (e) => {
    const btn = e.target.closest(".selector-option");
    if (!btn) return;
    
    columnTitlesSelector.querySelectorAll(".selector-option").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    
    state.showColumnTitles = btn.dataset.value === "show";
    renderSVG();
    saveData();
  });

  // Column guides toggle
  columnGuidesSelector.addEventListener("click", (e) => {
    const btn = e.target.closest(".selector-option");
    if (!btn) return;
    
    columnGuidesSelector.querySelectorAll(".selector-option").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    
    state.showColumnGuides = btn.dataset.value === "show";
    renderSVG();
    saveData();
  });

  // Layout direction toggle
  layoutDirectionSelector.addEventListener("click", (e) => {
    const btn = e.target.closest(".selector-option");
    if (!btn) return;
    
    layoutDirectionSelector.querySelectorAll(".selector-option").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    
    state.layoutOrientation = btn.dataset.value;
    renderAll();
    resetZoomAndPan();
    saveData();
    showToast(`Orientation set to ${state.layoutOrientation === "vertical" ? "Vertical" : "Horizontal"}`);
  });

  // Export background selector
  if (exportBgSelector) {
    exportBgSelector.addEventListener("click", (e) => {
      const btn = e.target.closest(".selector-option");
      if (!btn) return;
      
      exportBgSelector.querySelectorAll(".selector-option").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      state.exportTransparent = btn.dataset.value === "transparent";
      saveData();
      showToast(state.exportTransparent ? "Export background set to Transparent" : "Export background set to Solid");
    });
  }

  // Footer Buttons
  clearBtn.addEventListener("click", () => {
    state.columns.forEach(col => {
      col.nodes.forEach(n => {
        n.label = "";
      });
    });
    renderAll();
    saveData();
    showToast("Cleared all text labels");
  });

  const tidyBtn = document.getElementById("tidy-layout-btn");
  if (tidyBtn) {
    tidyBtn.addEventListener("click", () => {
      pushState();
      state.columns.forEach(col => {
        col.nodes.forEach(n => {
          delete n.x;
          delete n.y;
        });
      });
      renderAll();
      saveData();
      showToast("Tidied spacing: aligned flowchart to grid");
    });
    registerUndoTrigger(tidyBtn, "click");
  }

  resetBtn.addEventListener("click", resetLayout);
  exportBtn.addEventListener("click", downloadSVG);
  copyCodeBtn.addEventListener("click", copySVGCode);

  const exportPngBtn = document.getElementById("export-png-btn");
  if (exportPngBtn) {
    exportPngBtn.addEventListener("click", downloadPNG);
  }

  themeToggleBtn.addEventListener("click", toggleTheme);

  // Visual Theme select listener
  const globalThemeSelect = document.getElementById("global-theme-select");
  if (globalThemeSelect) {
    globalThemeSelect.addEventListener("change", (e) => {
      applyGlobalTheme(e.target.value);
    });
  }

  // Grid style selector
  const gridStyleSelector = document.getElementById("grid-style-selector");
  if (gridStyleSelector) {
    gridStyleSelector.addEventListener("click", (e) => {
      const btn = e.target.closest(".selector-option");
      if (!btn) return;
      gridStyleSelector.querySelectorAll(".selector-option").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.gridStyle = btn.dataset.value;
      renderAll();
      saveData();
    });
  }

  // Snap to Grid selector
  const snapGridSelector = document.getElementById("snap-grid-selector");
  if (snapGridSelector) {
    snapGridSelector.addEventListener("click", (e) => {
      const btn = e.target.closest(".selector-option");
      if (!btn) return;
      snapGridSelector.querySelectorAll(".selector-option").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.gridEnabled = btn.dataset.value === "on";
      saveData();
      showToast(state.gridEnabled ? "Snap-to-grid Enabled" : "Snap-to-grid Disabled");
    });
  }

  // Grid size select
  const gridSizeSelect = document.getElementById("grid-size-select");
  if (gridSizeSelect) {
    gridSizeSelect.addEventListener("change", (e) => {
      state.gridSize = parseInt(e.target.value);
      renderAll();
      saveData();
    });
  }

  // Snap to objects selector
  const snapObjectsSelector = document.getElementById("snap-objects-selector");
  if (snapObjectsSelector) {
    snapObjectsSelector.addEventListener("click", (e) => {
      const btn = e.target.closest(".selector-option");
      if (!btn) return;
      snapObjectsSelector.querySelectorAll(".selector-option").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.snapToObjects = btn.dataset.value === "on";
      saveData();
      showToast(state.snapToObjects ? "Snap-to-objects Enabled" : "Snap-to-objects Disabled");
    });
  }

  // Snap sensitivity slider
  const snapSensitivitySlider = document.getElementById("snap-sensitivity-slider");
  const snapSensitivityVal = document.getElementById("snap-sensitivity-val");
  if (snapSensitivitySlider && snapSensitivityVal) {
    snapSensitivitySlider.addEventListener("input", (e) => {
      state.snapSensitivity = parseInt(e.target.value);
      snapSensitivityVal.textContent = `${state.snapSensitivity}px`;
      saveData();
    });
  }

  // Swimlanes toggle selector listener
  const swimlanesSelector = document.getElementById("swimlanes-selector");
  if (swimlanesSelector) {
    swimlanesSelector.addEventListener("click", (e) => {
      const btn = e.target.closest(".selector-option");
      if (!btn) return;
      
      swimlanesSelector.querySelectorAll(".selector-option").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      state.showSwimlanes = btn.dataset.value === "on";
      renderAll();
      saveData();
      showToast(state.showSwimlanes ? "Swimlanes enabled" : "Swimlanes disabled");
    });
  }

  // Template Library select listener
  const templateLibrarySelect = document.getElementById("template-library-select");
  if (templateLibrarySelect) {
    templateLibrarySelect.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val) {
        loadFlowchartTemplate(val);
        templateLibrarySelect.selectedIndex = 0;
      }
    });
  }

  // Mini-map Viewport indicator dragging
  const minimapIndicator = document.getElementById("minimap-viewport-indicator");
  const minimapSvg = document.getElementById("minimap-svg");
  let isDraggingMinimap = false;
  let mmStartPan = { x: 0, y: 0 };
  let mmStartMouse = { x: 0, y: 0 };

  if (minimapIndicator && minimapSvg) {
    minimapIndicator.addEventListener("mousedown", (e) => {
      isDraggingMinimap = true;
      mmStartPan.x = panX;
      mmStartPan.y = panY;
      mmStartMouse.x = e.clientX;
      mmStartMouse.y = e.clientY;
      e.stopPropagation();
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDraggingMinimap) return;
      
      const dx = e.clientX - mmStartMouse.x;
      const dy = e.clientY - mmStartMouse.y;
      
      const containerRect = minimapSvg.getBoundingClientRect();
      const scaleMapX = containerRect.width / currentCanvasWidth;
      const scaleMapY = containerRect.height / currentCanvasHeight;
      
      const canvasDisplacementX = dx / scaleMapX;
      const canvasDisplacementY = dy / scaleMapY;
      
      panX = mmStartPan.x - canvasDisplacementX * zoom;
      panY = mmStartPan.y - canvasDisplacementY * zoom;
      
      applyZoomPan();
      
      const indicator = document.getElementById("minimap-viewport-indicator");
      if (indicator) {
        const visibleX = -panX / zoom;
        const visibleY = -panY / zoom;
        indicator.setAttribute("x", visibleX);
        indicator.setAttribute("y", visibleY);
      }
    });

    window.addEventListener("mouseup", () => {
      if (isDraggingMinimap) {
        isDraggingMinimap = false;
      }
    });
  }

  // Toggle Navigator minimization
  const mmToggleBtn = document.getElementById("minimap-toggle-btn");
  const mmContainer = document.getElementById("canvas-minimap");
  if (mmToggleBtn && mmContainer) {
    mmToggleBtn.addEventListener("click", () => {
      mmContainer.classList.toggle("minimized");
      const isMinimized = mmContainer.classList.contains("minimized");
      mmToggleBtn.innerHTML = isMinimized ? "&#43;" : "&#8722;";
      if (!isMinimized) {
        renderMinimap();
      }
    });
  }

  // Shortcuts modal event listeners
  const shortcutsBtn = document.getElementById("shortcuts-btn");
  const shortcutsModal = document.getElementById("shortcuts-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");

  if (shortcutsBtn && shortcutsModal && modalCloseBtn) {
    const showModal = () => {
      shortcutsModal.style.display = "flex";
    };
    const hideModal = () => {
      shortcutsModal.style.display = "none";
    };

    shortcutsBtn.addEventListener("click", showModal);
    modalCloseBtn.addEventListener("click", hideModal);
    shortcutsModal.addEventListener("click", (e) => {
      if (e.target === shortcutsModal) hideModal();
    });
  }

  // Save/Load JSON project file
  const saveJsonBtn = document.getElementById("save-json-btn");
  if (saveJsonBtn) {
    saveJsonBtn.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "flowchart-project.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Project state JSON downloaded");
    });
  }

  const loadJsonBtn = document.getElementById("load-json-btn");
  const loadJsonInput = document.getElementById("load-json-input");
  if (loadJsonBtn && loadJsonInput) {
    loadJsonBtn.addEventListener("click", () => {
      loadJsonInput.click();
    });
    loadJsonInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const loadedState = JSON.parse(event.target.result);
          if (loadedState && loadedState.columns && Array.isArray(loadedState.columns)) {
            pushState();
            state = loadedState;
            selectedNodeIds.clear();
            selectedNodeId = null;
            connectionSourceId = null;
            renderAll();
            saveData();
            showToast("Project state loaded successfully");
          } else {
            showToast("Invalid JSON file structure");
          }
        } catch (err) {
          console.error(err);
          showToast("Failed to parse JSON file");
        }
        loadJsonInput.value = ""; // Reset file input
      };
      reader.readAsText(file);
    });
  }

  // Typography Event Listeners
  if (fontFamilySelect) {
    fontFamilySelect.addEventListener("change", (e) => {
      pushState();
      const val = e.target.value;
      const selectedOpt = e.target.options[e.target.selectedIndex];
      const source = selectedOpt ? selectedOpt.dataset.source : "system";
      applyFont(val, source);
    });
  }

  if (resetFontBtn) {
    resetFontBtn.addEventListener("click", () => {
      pushState();
      resetFont();
    });
  }

  // Node Search Listener
  if (nodeSearchInput) {
    nodeSearchInput.addEventListener("input", () => {
      renderSidebarStructure();
      renderSVG();
    });
  }

  // Canvas Panning and Zooming Event Listeners
  const viewport = document.querySelector(".canvas-viewport");
  
  viewport.addEventListener("mousedown", (e) => {
    // Blur active elements (inputs, select, buttons) to restore focus to body,
    // enabling canvas keyboard shortcuts and spacebar panning immediately.
    if (document.activeElement && 
        document.activeElement !== document.body && 
        typeof document.activeElement.blur === "function") {
      // Don't blur if clicking inside the sidebar panel or inspectors
      if (!e.target.closest(".sidebar") && !e.target.closest(".inspector-panel") && !e.target.closest(".left-toolbar")) {
        document.activeElement.blur();
      }
    }

    if (isSpacePressed) {
      isPanning = true;
      viewport.style.cursor = "grabbing";
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      e.preventDefault();
      return;
    }

    // Node Resizing Start
    const resizeHandle = e.target.closest(".resize-handle");
    if (resizeHandle && e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      pushState();
      
      isResizingNode = true;
      resizeNodeId = resizeHandle.dataset.id;
      resizeDirection = resizeHandle.dataset.dir;
      resizeStartMouse = { x: e.clientX, y: e.clientY };
      const nodeObj = findNodeById(resizeNodeId);
      resizeStartBounds = {
        x: nodeCoords[nodeObj.id].x,
        y: nodeCoords[nodeObj.id].y,
        w: nodeObj.width || NODE_WIDTH,
        h: nodeObj.height || NODE_HEIGHT
      };
      return;
    }

    // Individual Node Dragging Start
    const nodeGroup = e.target.closest(".node-group");
    if (nodeGroup && activeTool === "select" && e.button === 0) {
      if (e.target.closest("input") || e.target.closest("select") || e.target.closest("button")) {
        return;
      }
      commitInlineEdit();
      const nodeId = nodeGroup.dataset.id;
      const nodeObj = findNodeById(nodeId);
      
      const handleSelect = () => {
        if (e.altKey) {
          // Select Subtree
          selectedNodeIds.clear();
          const selectSubtree = (id) => {
            if (selectedNodeIds.has(id)) return;
            selectedNodeIds.add(id);
            const n = findNodeById(id);
            if (n && n.targets) {
              n.targets.forEach(t => {
                const tId = typeof t === "string" ? t : t.id;
                selectSubtree(tId);
              });
            }
          };
          selectSubtree(nodeId);
          selectNode(null, false, true);
        } else if (e.shiftKey) {
          if (selectedNodeIds.has(nodeId)) {
            selectedNodeIds.delete(nodeId);
          } else {
            selectedNodeIds.add(nodeId);
          }
          selectNode(null, false);
        } else {
          selectNode(nodeId);
        }
      };

      if (nodeObj && nodeObj.locked) {
        // Selection is still allowed for locked nodes
        handleSelect();
        renderAll();
        return;
      }
      
      if (!selectedNodeIds.has(nodeId) || e.altKey || e.shiftKey) {
        handleSelect();
        renderAll();
      }
      
      pushState();
      isDraggingNode = true;
      dragNodeId = nodeId;
      dragAxisLock = null;
      
      const rect = viewport.getBoundingClientRect();
      const clickCanvasX = (e.clientX - rect.left - panX) / zoom;
      const clickCanvasY = (e.clientY - rect.top - panY) / zoom;
      
      dragStartCanvasPos = { x: clickCanvasX, y: clickCanvasY };
      dragOriginalPositions = {};
      
      selectedNodeIds.forEach(id => {
        const n = findNodeById(id);
        if (n && !n.locked) {
          const coords = nodeCoords[id] || { x: 0, y: 0 };
          dragOriginalPositions[id] = {
            x: n.x !== undefined ? n.x : coords.x,
            y: n.y !== undefined ? n.y : coords.y
          };
        }
      });
      
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Marquee Selection Start
    if (activeTool === "select" && e.button === 0) {
      if (e.target.closest("input") || e.target.closest("select") || e.target.closest("button")) {
        return;
      }
      
      commitInlineEdit();
      
      isDraggingSelection = true;
      selectionStart.x = e.clientX;
      selectionStart.y = e.clientY;
      
      const viewportRect = viewport.getBoundingClientRect();
      const startXRel = e.clientX - viewportRect.left;
      const startYRel = e.clientY - viewportRect.top;
      
      if (!e.shiftKey) {
        selectedNodeIds.clear();
        selectNode(null);
      }
      
      let marquee = document.getElementById("active-selection-marquee");
      if (!marquee) {
        marquee = document.createElement("div");
        marquee.id = "active-selection-marquee";
        marquee.className = "selection-marquee";
        viewport.appendChild(marquee);
      }
      marquee.style.left = `${startXRel}px`;
      marquee.style.top = `${startYRel}px`;
      marquee.style.width = "0px";
      marquee.style.height = "0px";
      marquee.style.display = "block";
      
      e.preventDefault();
    }
  });

  // Smart Guides helper
  const drawSmartGuides = (x, y, snapX, snapY) => {
    let guidesGroup = document.getElementById("smart-guides-group");
    if (!guidesGroup) {
      guidesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      guidesGroup.id = "smart-guides-group";
      document.getElementById("nodes-group").appendChild(guidesGroup);
    }
    guidesGroup.innerHTML = "";
    const color = "var(--accent-color)";
    
    if (snapX !== null) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", snapX);
      line.setAttribute("x2", snapX);
      line.setAttribute("y1", "-5000");
      line.setAttribute("y2", "5000");
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", "1 / zoom");
      line.setAttribute("stroke-dasharray", "4,4");
      guidesGroup.appendChild(line);
    }
    if (snapY !== null) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "-5000");
      line.setAttribute("x2", "5000");
      line.setAttribute("y1", snapY);
      line.setAttribute("y2", snapY);
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", "1 / zoom");
      line.setAttribute("stroke-dasharray", "4,4");
      guidesGroup.appendChild(line);
    }
  };

  const clearSmartGuides = () => {
    const guidesGroup = document.getElementById("smart-guides-group");
    if (guidesGroup) guidesGroup.innerHTML = "";
  };

  window.addEventListener("mousemove", (e) => {
    if (isPanning) {
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      applyZoomPan();
    } else if (isResizingNode && resizeNodeId) {
      const scale = zoom;
      const dx = (e.clientX - resizeStartMouse.x) / scale;
      const dy = (e.clientY - resizeStartMouse.y) / scale;

      const node = findNodeById(resizeNodeId);
      if (!node) return;

      let newW = resizeStartBounds.w;
      let newH = resizeStartBounds.h;
      let newX = resizeStartBounds.x;
      let newY = resizeStartBounds.y;

      if (resizeDirection.includes('e')) {
        newW = Math.max(20, resizeStartBounds.w + dx);
        newX = resizeStartBounds.x + (newW - resizeStartBounds.w) / 2;
      }
      if (resizeDirection.includes('w')) {
        newW = Math.max(20, resizeStartBounds.w - dx);
        newX = resizeStartBounds.x - (newW - resizeStartBounds.w) / 2;
      }
      if (resizeDirection.includes('s')) {
        newH = Math.max(20, resizeStartBounds.h + dy);
        newY = resizeStartBounds.y + (newH - resizeStartBounds.h) / 2;
      }
      if (resizeDirection.includes('n')) {
        newH = Math.max(20, resizeStartBounds.h - dy);
        newY = resizeStartBounds.y - (newH - resizeStartBounds.h) / 2;
      }

      node.width = newW;
      node.height = newH;
      node.x = newX;
      node.y = newY;
      validateAndClampNode(node);
      
      calculateCoordinates();
      renderSVG();
      renderSidebarSelection();
    } else if (isDraggingNode && dragNodeId) {
      const rect = viewport.getBoundingClientRect();
      const clickCanvasX = (e.clientX - rect.left - panX) / zoom;
      const clickCanvasY = (e.clientY - rect.top - panY) / zoom;
      
      let deltaX = clickCanvasX - dragStartCanvasPos.x;
      let deltaY = clickCanvasY - dragStartCanvasPos.y;

      // Shift constraint (Axis locking)
      if (e.shiftKey) {
        if (!dragAxisLock) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) dragAxisLock = 'x';
          else dragAxisLock = 'y';
        }
        if (dragAxisLock === 'x') deltaY = 0;
        else deltaX = 0;
      } else {
        dragAxisLock = null;
      }

      const isSnappingOverridden = e.altKey;
      clearSmartGuides();

      let snapLineX = null;
      let snapLineY = null;

      selectedNodeIds.forEach(id => {
        const targetNode = findNodeById(id);
        const origPos = dragOriginalPositions[id];
        if (targetNode && !targetNode.locked && origPos) {
          let newX = origPos.x + deltaX;
          let newY = origPos.y + deltaY;

          // Apply grid snapping
          if (state.gridEnabled && !isSnappingOverridden) {
            const grid = state.gridSize || 20;
            newX = Math.round(newX / grid) * grid;
            newY = Math.round(newY / grid) * grid;
          }

          // Apply object snapping (Smart Guides) only if single node dragging
          if (state.snapToObjects && !isSnappingOverridden && selectedNodeIds.size === 1 && !state.gridEnabled) {
             const sensitivity = state.snapSensitivity || 5;
             let bestDx = sensitivity + 1;
             let bestDy = sensitivity + 1;
             
             state.columns.forEach(col => {
               col.nodes.forEach(n => {
                 if (n.id !== id) {
                   const nx = n.x;
                   const ny = n.y;
                   // Centers
                   const cx1 = newX + NODE_WIDTH/2;
                   const cx2 = nx + NODE_WIDTH/2;
                   const cy1 = newY + NODE_HEIGHT/2;
                   const cy2 = ny + NODE_HEIGHT/2;

                   if (Math.abs(newX - nx) < bestDx) { bestDx = Math.abs(newX - nx); newX = nx; snapLineX = nx; }
                   if (Math.abs(cx1 - cx2) < bestDx) { bestDx = Math.abs(cx1 - cx2); newX = nx; snapLineX = cx2; }
                   if (Math.abs(newY - ny) < bestDy) { bestDy = Math.abs(newY - ny); newY = ny; snapLineY = ny; }
                   if (Math.abs(cy1 - cy2) < bestDy) { bestDy = Math.abs(cy1 - cy2); newY = ny; snapLineY = cy2; }
                 }
               });
             });
             if (snapLineX !== null || snapLineY !== null) {
               drawSmartGuides(newX, newY, snapLineX, snapLineY);
             }
          }

          targetNode.x = newX;
          targetNode.y = newY;
          validateAndClampNode(targetNode);
        }
      });
      calculateCoordinates();
      renderSVG();
    } else if (isDraggingSelection) {
      const viewportRect = viewport.getBoundingClientRect();
      const currentXRel = e.clientX - viewportRect.left;
      const currentYRel = e.clientY - viewportRect.top;
      const startXRel = selectionStart.x - viewportRect.left;
      const startYRel = selectionStart.y - viewportRect.top;
      
      const x = Math.min(startXRel, currentXRel);
      const y = Math.min(startYRel, currentYRel);
      const width = Math.abs(startXRel - currentXRel);
      const height = Math.abs(startYRel - currentYRel);
      
      const marquee = document.getElementById("active-selection-marquee");
      if (marquee) {
        marquee.style.left = `${x}px`;
        marquee.style.top = `${y}px`;
        marquee.style.width = `${width}px`;
        marquee.style.height = `${height}px`;
      }
      
      const mLeft = Math.min(selectionStart.x, e.clientX);
      const mTop = Math.min(selectionStart.y, e.clientY);
      const mRight = Math.max(selectionStart.x, e.clientX);
      const mBottom = Math.max(selectionStart.y, e.clientY);
      
      const dragSelectedIds = new Set();
      const nodeGroups = document.querySelectorAll(".node-group");
      nodeGroups.forEach(g => {
        const nodeId = g.dataset.id;
        const rectEl = g.querySelector(".node-rect");
        if (!rectEl) return;
        const r = rectEl.getBoundingClientRect();
        
        const intersects = !(r.right < mLeft || r.left > mRight || r.bottom < mTop || r.top > mBottom);
        if (intersects) {
          dragSelectedIds.add(nodeId);
        }
      });
      
      if (e.shiftKey) {
        dragSelectedIds.forEach(id => selectedNodeIds.add(id));
      } else {
        selectedNodeIds = new Set(dragSelectedIds);
      }
      
      document.querySelectorAll(".node-group").forEach(g => {
        const isSelected = selectedNodeIds.has(g.dataset.id);
        g.classList.toggle("selected", isSelected);
      });
    }
  });

  window.addEventListener("mouseup", (e) => {
    if (isPanning) {
      isPanning = false;
      viewport.style.cursor = isSpacePressed ? "grab" : "";
    } else if (isResizingNode) {
      isResizingNode = false;
      resizeNodeId = null;
      saveData();
    } else if (isDraggingNode) {
      isDraggingNode = false;
      dragNodeId = null;
      clearSmartGuides();
      saveData();
      renderSidebarSelection(); // Sync coordinate coordinates inputs
    } else if (isDraggingSelection) {
      isDraggingSelection = false;
      const marquee = document.getElementById("active-selection-marquee");
      if (marquee) marquee.remove();
      
      if (selectedNodeIds.size === 1) {
        selectedNodeId = Array.from(selectedNodeIds)[0];
      } else {
        selectedNodeId = null;
      }
      
      renderSidebarSelection();
      
      document.querySelectorAll(".structure-node-item").forEach(item => {
        const isSelected = selectedNodeIds.has(item.dataset.id);
        item.classList.toggle("selected", isSelected);
      });
    }
  });

  // Wheel Zoom (centered on mouse pointer)
  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const zoomFactor = 1.08;
    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const oldZoom = zoom;
    if (e.deltaY < 0) {
      zoom = Math.min(4.0, zoom * zoomFactor);
    } else {
      zoom = Math.max(0.2, zoom / zoomFactor);
    }
    
    panX = mouseX - (mouseX - panX) * (zoom / oldZoom);
    panY = mouseY - (mouseY - panY) * (zoom / oldZoom);
    
    applyZoomPan();
  }, { passive: false });

  // Floating Zoom Buttons
  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomOutBtn = document.getElementById("zoom-out-btn");
  const zoomResetBtn = document.getElementById("zoom-reset-btn");

  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => {
      const rect = viewport.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const oldZoom = zoom;
      zoom = Math.min(4.0, zoom + 0.1);
      panX = centerX - (centerX - panX) * (zoom / oldZoom);
      panY = centerY - (centerY - panY) * (zoom / oldZoom);
      applyZoomPan();
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => {
      const rect = viewport.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const oldZoom = zoom;
      zoom = Math.max(0.2, zoom - 0.1);
      panX = centerX - (centerX - panX) * (zoom / oldZoom);
      panY = centerY - (centerY - panY) * (zoom / oldZoom);
      applyZoomPan();
    });
  }

  if (zoomResetBtn) {
    zoomResetBtn.addEventListener("click", () => {
      resetZoomAndPan();
      showToast("Zoom and pan reset to center.");
    });
  }

  // Mobile Toggles logic
  const btnToggleLeft = document.getElementById("btn-toggle-left");
  const btnToggleRight = document.getElementById("btn-toggle-right");
  const mobileSidebarOverlay = document.getElementById("mobile-sidebar-overlay");
  const leftToolbar = document.querySelector(".left-toolbar");
  const rightSidebar = document.querySelector(".right-sidebar");

  if (btnToggleLeft && btnToggleRight && mobileSidebarOverlay) {
    btnToggleLeft.addEventListener("click", (e) => {
      e.stopPropagation();
      leftToolbar.classList.toggle("open");
      rightSidebar.classList.remove("open");
      mobileSidebarOverlay.style.display = leftToolbar.classList.contains("open") ? "block" : "none";
    });

    btnToggleRight.addEventListener("click", (e) => {
      e.stopPropagation();
      rightSidebar.classList.toggle("open");
      leftToolbar.classList.remove("open");
      mobileSidebarOverlay.style.display = rightSidebar.classList.contains("open") ? "block" : "none";
    });

    mobileSidebarOverlay.addEventListener("click", () => {
      leftToolbar.classList.remove("open");
      rightSidebar.classList.remove("open");
      mobileSidebarOverlay.style.display = "none";
    });

    // Close overlays when clicking canvas or action buttons on mobile
    viewport.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        leftToolbar.classList.remove("open");
        rightSidebar.classList.remove("open");
        mobileSidebarOverlay.style.display = "none";
      }
    });

    document.addEventListener("click", (e) => {
      if (window.innerWidth <= 768) {
        if (!leftToolbar.contains(e.target) && !rightSidebar.contains(e.target) && e.target !== btnToggleLeft && e.target !== btnToggleRight) {
          leftToolbar.classList.remove("open");
          rightSidebar.classList.remove("open");
          mobileSidebarOverlay.style.display = "none";
        }
      }
    });
  }
}

// 9.5 Typography Helpers
function applyFont(name, source) {
  if (!name || name.trim() === "") {
    resetFont();
    return;
  }
  
  name = name.trim();
  
  // Clear any existing custom google font links first
  const linkId = "dynamic-google-font-link";
  let linkEl = document.getElementById(linkId);
  if (linkEl) linkEl.remove();
  
  if (source === "google") {
    const formattedName = name.replace(/\s+/g, '+');
    linkEl = document.createElement("link");
    linkEl.id = linkId;
    linkEl.rel = "stylesheet";
    linkEl.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;500;700&display=swap`;
    document.head.appendChild(linkEl);
  }
  
  // Apply CSS variable
  document.documentElement.style.setProperty("--custom-font-family", `'${name}'`);
  
  // Save to localStorage
  safeStorage.setItem("flowchart_font_name", name);
  safeStorage.setItem("flowchart_font_source", source);
  
  if (resetFontBtn) resetFontBtn.style.display = "block";
  showToast(`Applied font: ${name} (${source === "google" ? "Google Fonts" : "System Font"})`);
}

function resetFont() {
  const linkEl = document.getElementById("dynamic-google-font-link");
  if (linkEl) linkEl.remove();
  
  document.documentElement.style.removeProperty("--custom-font-family");
  
  safeStorage.removeItem("flowchart_font_name");
  safeStorage.removeItem("flowchart_font_source");
  
  if (fontFamilyInput) fontFamilyInput.value = "";
  if (resetFontBtn) resetFontBtn.style.display = "none";
  
  showToast("Reset typography to default");
}

// Theme Persistence
function getPreferredTheme() {
  const saved = safeStorage.getItem("theme");
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  safeStorage.setItem("theme", theme);
  
  if (theme === "dark") {
    sunIcon.style.display = "block";
    moonIcon.style.display = "none";
    themeToggleBtn.setAttribute("data-tooltip", "Switch to Light Mode");
  } else {
    sunIcon.style.display = "none";
    moonIcon.style.display = "block";
    themeToggleBtn.setAttribute("data-tooltip", "Switch to Dark Mode");
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "light" ? "dark" : "light");
}

// 10. Toast Alerts
function showToast(message) {
  let toast = document.getElementById("app-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "app-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.offsetHeight; 
  toast.className = "toast-show";
  
  setTimeout(() => {
    toast.className = "";
  }, 2500);
}

// 11. Local Storage Sync
function saveData() {
  safeStorage.setItem("flowchart_dynamic_state", JSON.stringify(state));
}

function loadSavedData() {
  const saved = safeStorage.getItem("flowchart_dynamic_state");
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    if (data && data.columns && Array.isArray(data.columns)) {
      state = data;
      if (!state.animatedFlow) state.animatedFlow = "off";
      
      // Update stroke selector button highlight
      if (state.strokeWidth) {
        strokeWidthSelector.querySelectorAll(".selector-option").forEach(b => {
          b.classList.toggle("active", parseFloat(b.dataset.value) === state.strokeWidth);
        });
      }
      
      // Update line style selector button highlight
      if (state.lineStyle) {
        lineStyleSelector.querySelectorAll(".selector-option").forEach(b => {
          b.classList.toggle("active", b.dataset.value === state.lineStyle);
        });
      }

      // Update line shape selector button highlight
      if (state.lineShape) {
        lineShapeSelector.querySelectorAll(".selector-option").forEach(b => {
          b.classList.toggle("active", b.dataset.value === state.lineShape);
        });
      }

      // Update column titles button highlight
      if (state.showColumnTitles !== undefined) {
        columnTitlesSelector.querySelectorAll(".selector-option").forEach(b => {
          const isShow = b.dataset.value === "show";
          b.classList.toggle("active", isShow === state.showColumnTitles);
        });
      }

      // Update column guides button highlight
      if (state.showColumnGuides !== undefined) {
        columnGuidesSelector.querySelectorAll(".selector-option").forEach(b => {
          const isShow = b.dataset.value === "show";
          b.classList.toggle("active", isShow === state.showColumnGuides);
        });
      }

      // Update export background button highlight
      if (state.exportTransparent !== undefined && exportBgSelector) {
        exportBgSelector.querySelectorAll(".selector-option").forEach(b => {
          const isTransparent = b.dataset.value === "transparent";
          b.classList.toggle("active", isTransparent === state.exportTransparent);
        });
      }

      // Update layout direction button highlight
      if (state.layoutOrientation !== undefined) {
        layoutDirectionSelector.querySelectorAll(".selector-option").forEach(b => {
          b.classList.toggle("active", b.dataset.value === state.layoutOrientation);
        });
      }
      
      // Update global flow selector button highlight
      if (state.animatedFlow !== undefined && globalFlowSelector) {
        globalFlowSelector.querySelectorAll(".selector-option").forEach(b => {
          b.classList.toggle("active", b.dataset.value === state.animatedFlow);
        });
      }

      // Update chart title input
      if (state.chartTitle !== undefined) {
        if (chartTitleInput) chartTitleInput.value = state.chartTitle;
      }
      
      // Update grid/theme settings if present
      if (state.gridStyle) {
        const gridStyleSelector = document.getElementById("grid-style-selector");
        if (gridStyleSelector) {
          gridStyleSelector.querySelectorAll(".selector-option").forEach(b => {
            b.classList.toggle("active", b.dataset.value === state.gridStyle);
          });
        }
      }
      if (state.gridEnabled !== undefined) {
        const snapGridSelector = document.getElementById("snap-grid-selector");
        if (snapGridSelector) {
          snapGridSelector.querySelectorAll(".selector-option").forEach(b => {
            const isEnable = b.dataset.value === "on";
            b.classList.toggle("active", isEnable === state.gridEnabled);
          });
        }
      }
      if (state.gridSize) {
        const gridSizeSelect = document.getElementById("grid-size-select");
        if (gridSizeSelect) {
          gridSizeSelect.value = state.gridSize;
        }
      }
      if (state.snapToObjects !== undefined) {
        const snapObjectsSelector = document.getElementById("snap-objects-selector");
        if (snapObjectsSelector) {
          snapObjectsSelector.querySelectorAll(".selector-option").forEach(b => {
            const isEnable = b.dataset.value === "on";
            b.classList.toggle("active", isEnable === state.snapToObjects);
          });
        }
      }
      if (state.snapSensitivity) {
        const snapSensitivitySlider = document.getElementById("snap-sensitivity-slider");
        const snapSensitivityVal = document.getElementById("snap-sensitivity-val");
        if (snapSensitivitySlider && snapSensitivityVal) {
          snapSensitivitySlider.value = state.snapSensitivity;
          snapSensitivityVal.textContent = `${state.snapSensitivity}px`;
        }
      }
      if (state.globalTheme) {
        const globalThemeSelect = document.getElementById("global-theme-select");
        if (globalThemeSelect) {
          globalThemeSelect.value = state.globalTheme;
        }
      }
      if (state.showSwimlanes !== undefined) {
        const swimlanesSelector = document.getElementById("swimlanes-selector");
        if (swimlanesSelector) {
          swimlanesSelector.querySelectorAll(".selector-option").forEach(b => {
            const isOn = b.dataset.value === "on";
            b.classList.toggle("active", isOn === state.showSwimlanes);
          });
        }
      }
    }
  } catch (e) {
    console.error("Error reading flowchart state from localstorage", e);
  }
}

// 12. Portable SVG Exporters

function generatePortableSVGString() {
  const clone = svgEl.cloneNode(true);
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  
  const nodeBg = theme === "dark" ? "#121212" : "#ffffff";
  const nodeBorder = theme === "dark" ? "#a3a3a3" : "#171717";
  const nodeText = theme === "dark" ? "#f5f5f5" : "#171717";
  const lineStroke = theme === "dark" ? "#a3a3a3" : "#171717";
  const guideStroke = theme === "dark" ? "#222222" : "#e5e5e5";
  
  const labelBg = theme === "dark" ? "#1e1e1e" : "#f5f5f5";
  const labelBorder = theme === "dark" ? "#2d2d2d" : "#e5e5e5";
  const labelTextCol = theme === "dark" ? "#a3a3a3" : "#737373";

  const savedFontName = safeStorage.getItem("flowchart_font_name");
  const savedFontSource = safeStorage.getItem("flowchart_font_source") || "google";

  // Embed the Google Font stylesheet URL directly into defs if active
  if (savedFontName && savedFontSource === "google") {
    const formattedName = savedFontName.trim().replace(/\s+/g, '+');
    const defs = clone.querySelector("defs") || clone.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "defs"));
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `@import url('https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;500;700&display=swap');`;
    defs.appendChild(style);
  }

  // Embed styling attributes directly by matching each cloned group back to the original state
  clone.querySelectorAll(".node-group").forEach(g => {
    const nodeId = g.dataset.id;
    let node = null;
    state.columns.forEach(col => {
      let found = col.nodes.find(n => n.id === nodeId);
      if (found) node = found;
    });

    const rect = g.querySelector(".node-rect");
    if (rect) {
      const fill = (node && node.fill) ? node.fill : nodeBg;
      const stroke = (node && node.stroke) ? node.stroke : nodeBorder;
      rect.setAttribute("fill", fill);
      rect.setAttribute("stroke", stroke);
      if (rect.tagName.toLowerCase() === "rect") {
        const rx = (node && node.rx !== undefined) ? node.rx : 0;
        rect.setAttribute("rx", rx);
      }
      rect.setAttribute("stroke-width", `${state.strokeWidth}px`);
      rect.removeAttribute("style");
    }
    
    const text = g.querySelector(".node-text");
    if (text) {
      const textColor = (node && node.textColor) ? node.textColor : nodeText;
      text.setAttribute("fill", textColor);
      const fontStr = savedFontName ? `'${savedFontName}', Inter, system-ui, sans-serif` : "Inter, system-ui, sans-serif";
      text.setAttribute("font-family", fontStr);
      text.setAttribute("font-size", `${(node && node.fontSize) || 12}px`);
      text.setAttribute("font-weight", (node && node.fontWeight) || "500");
      text.setAttribute("font-style", (node && node.fontStyle) || "normal");
      text.setAttribute("text-decoration", (node && node.textDecoration) || "none");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.removeAttribute("style");
    }
  });

  // Embed title styling
  clone.querySelectorAll(".chart-title-text").forEach(title => {
    title.setAttribute("fill", nodeText);
    const fontStr = savedFontName ? `'${savedFontName}', Inter, system-ui, sans-serif` : "Inter, system-ui, sans-serif";
    title.setAttribute("font-family", fontStr);
    title.setAttribute("font-size", "20px");
    title.setAttribute("font-weight", "700");
    title.setAttribute("text-anchor", "middle");
    title.removeAttribute("style");
  });
  
  clone.querySelectorAll(".connector-line").forEach(line => {
    const sourceId = line.dataset.source;
    const targetId = line.dataset.target;
    
    // Find connection properties from state
    let targetVal = null;
    state.columns.forEach(col => {
      const node = col.nodes.find(n => n.id === sourceId);
      if (node) {
        const found = node.targets.find(t => (typeof t === "string" ? t : t.id) === targetId);
        if (found) targetVal = found;
      }
    });

    const isObj = typeof targetVal === "object" && targetVal !== null;
    const color = isObj && targetVal.strokeColor ? targetVal.strokeColor : lineStroke;
    const strokeW = isObj && targetVal.strokeWidth ? targetVal.strokeWidth : state.strokeWidth;
    const lineStyle = isObj && targetVal.strokeStyle ? targetVal.strokeStyle : state.lineStyle;

    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", `${strokeW}px`);
    line.setAttribute("fill", "none");
    line.style.color = color;
    
    if (lineStyle === "dashed") {
      line.setAttribute("stroke-dasharray", "4,4");
    } else {
      line.removeAttribute("stroke-dasharray");
    }
  });

  clone.querySelectorAll(".arrow-head").forEach(head => {
    head.setAttribute("fill", "currentColor");
  });

  clone.querySelectorAll(".connector-label-bg").forEach(bg => {
    bg.setAttribute("fill", labelBg);
    bg.setAttribute("stroke", labelBorder);
    bg.setAttribute("stroke-width", "0.5px");
    bg.removeAttribute("style");
  });

  clone.querySelectorAll(".connector-label-text").forEach(text => {
    text.setAttribute("fill", labelTextCol);
    const fontStr = savedFontName ? `'${savedFontName}', Inter, system-ui, sans-serif` : "Inter, system-ui, sans-serif";
    text.setAttribute("font-family", fontStr);
    text.setAttribute("font-size", "9px");
    text.removeAttribute("style");
  });

  clone.querySelectorAll(".column-guide").forEach(guide => {
    guide.setAttribute("stroke", guideStroke);
    guide.setAttribute("stroke-width", "1px");
    guide.setAttribute("stroke-dasharray", "4,8");
  });

  clone.querySelectorAll(".column-header-text").forEach(text => {
    text.setAttribute("fill", lineStroke);
    text.setAttribute("font-family", "JetBrains Mono, monospace");
    text.setAttribute("font-size", "10px");
    text.setAttribute("font-weight", "600");
  });
  
  clone.querySelectorAll(".arrow-head").forEach(head => {
    head.setAttribute("fill", lineStroke);
  });

  // Make canvas self-contained by adding background rectangle if not exporting transparently
  if (state.exportTransparent !== true) {
    const canvasBgColor = theme === "dark" ? "#0a0a0a" : "#fafafa";
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", "100%");
    bgRect.setAttribute("height", "100%");
    bgRect.setAttribute("fill", canvasBgColor);
    
    // Insert background before other layers
    clone.insertBefore(bgRect, clone.firstChild);
  }
  
  // Clean attributes
  clone.removeAttribute("id");
  clone.removeAttribute("style");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  
  return clone.outerHTML;
}

function downloadSVG() {
  const svgString = generatePortableSVGString();
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "custom-flowchart.svg";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  
  URL.revokeObjectURL(url);
  showToast("SVG file downloaded successfully");
}

function downloadPNG() {
  const svgString = generatePortableSVGString();
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = currentCanvasWidth * 2;
    canvas.height = currentCanvasHeight * 2;
    
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    
    try {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "custom-flowchart.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showToast("PNG image downloaded successfully");
    } catch (err) {
      console.error("Canvas toDataURL failed:", err);
      showToast("PNG export failed. Please use Copy SVG instead.");
    }
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    showToast("Failed to compile PNG image");
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

async function copySVGCode() {
  const svgString = generatePortableSVGString();
  
  // Try standard navigator.clipboard first if available in secure context
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(svgString);
      showToast("SVG code copied to clipboard!");
      return;
    } catch (err) {
      console.warn("navigator.clipboard failed, trying fallback...", err);
    }
  }
  
  // Fallback method for non-secure contexts or file:// protocol
  try {
    const textArea = document.createElement("textarea");
    textArea.value = svgString;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    
    if (successful) {
      showToast("SVG code copied to clipboard!");
    } else {
      throw new Error("execCommand('copy') returned false");
    }
  } catch (err) {
    showToast("Failed to copy code to clipboard");
    console.error("Clipboard copy fallback error:", err);
  }
}

// 13. Inline Editing Helpers
function startInlineEditing(nodeId) {
  pushState();
  // Commit any active edit first
  commitInlineEdit();
  
  let node = null;
  state.columns.forEach(col => {
    const found = col.nodes.find(n => n.id === nodeId);
    if (found) node = found;
  });
  if (!node) return;
  
  const viewport = document.querySelector(".canvas-viewport");
  const rectEl = document.querySelector(`#node-${nodeId} .node-rect`);
  if (!rectEl) return;
  const rectBCR = rectEl.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  
  const left = rectBCR.left - viewportRect.left;
  const top = rectBCR.top - viewportRect.top;
  const width = rectBCR.width;
  const height = rectBCR.height;
  
  const input = document.createElement("input");
  input.type = "text";
  input.className = "inline-node-editor";
  input.id = "active-inline-editor";
  input.value = node.label;
  input.dataset.nodeId = nodeId;
  
  input.style.left = `${left}px`;
  input.style.top = `${top}px`;
  input.style.width = `${width}px`;
  input.style.height = `${height}px`;
  
  const docStyle = getComputedStyle(document.documentElement);
  input.style.fontFamily = docStyle.getPropertyValue("--font-sans");
  
  viewport.appendChild(input);
  input.focus();
  input.select();
  
  input.addEventListener("blur", () => {
    commitInlineEdit();
  });
  
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitInlineEdit();
    } else if (e.key === "Escape") {
      input.value = node.label; // revert
      commitInlineEdit();
    }
  });

  input.addEventListener("input", (e) => {
    const svgText = document.querySelector(`#node-${nodeId} .node-text`);
    if (svgText) {
      wrapSVGText(svgText, e.target.value, NODE_WIDTH - 20, node.fontSize || 12);
    }
  });
}

function commitInlineEdit() {
  const input = document.getElementById("active-inline-editor");
  if (!input) return;
  
  const nodeId = input.dataset.nodeId;
  const newVal = input.value.trim();
  
  state.columns.forEach(col => {
    const node = col.nodes.find(n => n.id === nodeId);
    if (node) node.label = newVal;
  });
  
  input.remove();
  renderAll();
  saveData();
}

// Helper to select a connection path in select tool mode
function selectConnector(sourceId, targetId) {
  selectedNodeIds.clear();
  selectedNodeId = null;
  document.querySelectorAll(".node-group").forEach(g => g.classList.remove("selected"));
  document.querySelectorAll(".structure-node-item").forEach(item => item.classList.remove("selected"));
  
  selectedConnector = { sourceId, targetId };
  
  if (activeSidebarTab === "tab-structure") {
    switchTab("tab-properties");
  }
  
  renderAll();
}

// Ensure target connection is saved as a structured object for custom styles
function getOrCreateTargetObj(sourceId, targetId) {
  const sourceNode = findNodeById(sourceId);
  if (!sourceNode) return null;
  const idx = sourceNode.targets.findIndex(t => (typeof t === "string" ? t : t.id) === targetId);
  if (idx === -1) return null;
  let targetVal = sourceNode.targets[idx];
  if (typeof targetVal === "string") {
    targetVal = {
      id: targetId,
      sourceAnchor: "auto",
      targetAnchor: "auto",
      lineShape: "auto",
      markerType: "arrow",
      lineOffset: 0,
      label: ""
    };
    sourceNode.targets[idx] = targetVal;
  }
  return targetVal;
}

// Render connector specific inspector panel in sidebar
function renderConnectorSelectionPanel() {
  selectionSettingsContainer.innerHTML = "";
  if (!selectedConnector) return;
  
  const { sourceId, targetId } = selectedConnector;
  const sourceNode = findNodeById(sourceId);
  const targetNode = findNodeById(targetId);
  if (!sourceNode || !targetNode) {
    selectedConnector = null;
    renderSidebarSelection();
    return;
  }
  
  const targetObj = sourceNode.targets.find(t => (typeof t === "string" ? t : t.id) === targetId);
  if (!targetObj) {
    selectedConnector = null;
    renderSidebarSelection();
    return;
  }
  
  const isObj = typeof targetObj === "object";
  const sourceAnchor = isObj ? (targetObj.sourceAnchor || "auto") : "auto";
  const targetAnchor = isObj ? (targetObj.targetAnchor || "auto") : "auto";
  const lineShape = isObj ? (targetObj.lineShape || "auto") : "auto";
  const markerType = isObj ? (targetObj.markerType || "arrow") : "arrow";
  const strokeW = isObj ? (targetObj.strokeWidth || state.strokeWidth) : state.strokeWidth;
  const lineStyle = isObj ? (targetObj.strokeStyle || "solid") : "solid";
  const lineOffset = isObj ? (targetObj.lineOffset || 0) : 0;
  const label = isObj ? (targetObj.label || "") : "";
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  const labelColor = isObj && targetObj.labelColor ? targetObj.labelColor : (theme === 'dark' ? '#a3a3a3' : '#737373');
  const labelFontSize = isObj && targetObj.labelFontSize ? targetObj.labelFontSize : 9;
  const labelFontFamily = isObj && targetObj.labelFontFamily ? targetObj.labelFontFamily : "var(--font-mono)";
  const animatedVal = isObj && targetObj.animated !== undefined ? (targetObj.animated ? "enabled" : "disabled") : "default";
  const strokeColor = isObj && targetObj.strokeColor ? targetObj.strokeColor : (theme === 'dark' ? '#a3a3a3' : '#171717');
  
  const header = document.createElement("div");
  header.style.marginBottom = "14px";
  header.innerHTML = `
    <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 15l-3-3v2h-4v-2l-3 3 3 3v-2h4v2l3-3zM5 9l3 3v-2h4v2l3-3-3-3v2H8V5L5 9z"/></svg>
      Connection Inspector
    </div>
    <span style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; display: block;">
      Connection: <strong>${sourceNode.label || sourceId}</strong> &rarr; <strong>${targetNode.label || targetId}</strong>
    </span>
  `;
  selectionSettingsContainer.appendChild(header);
  
  const propsEl = document.createElement("div");
  propsEl.className = "input-field-wrapper";
  propsEl.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--panel-border); padding: 10px; background-color: var(--bg-color);">
      <!-- Label -->
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Line Label</span>
        <input type="text" id="conn-label-input" class="text-input" value="${label}" placeholder="e.g. Yes / No" style="padding: 4px 6px; font-size: 11px; border-radius: 2px;">
      </div>

      <!-- Label Styling -->
      <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 6px; margin-top: 2px;">
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Label Font</span>
          <select id="conn-label-font" style="padding: 2px 4px; font-size: 10px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none; border-radius: 2px;">
            <option value="var(--font-mono)" ${labelFontFamily === "var(--font-mono)" ? "selected" : ""}>Monospace</option>
            <option value="var(--font-sans)" ${labelFontFamily === "var(--font-sans)" ? "selected" : ""}>Sans-Serif</option>
            <option value="var(--font-serif)" ${labelFontFamily === "var(--font-serif)" ? "selected" : ""}>Serif</option>
          </select>
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Font Size</span>
          <input type="number" id="conn-label-size" class="text-input" value="${labelFontSize}" min="6" max="24" style="padding: 2px 4px; font-size: 10px; height: 18px; border-radius: 2px;">
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 2px;">
        <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Label Color</span>
        <div style="display: flex; gap: 4px; align-items: center;">
          <input type="color" id="conn-label-color-picker" value="${labelColor.startsWith('var') ? (theme === 'dark' ? '#a3a3a3' : '#737373') : labelColor}" style="width: 24px; height: 18px; border: 1px solid var(--panel-border); cursor: pointer; flex-shrink: 0; padding: 0; background: none;">
          <input type="text" id="conn-label-color-hex" class="text-input" value="${labelColor.startsWith('var') ? '' : labelColor}" placeholder="Theme Default" style="padding: 2px 4px; font-size: 9px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none; width: 100%; height: 18px; border-radius: 2px;">
        </div>
      </div>

      <!-- Anchors -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 4px;">
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Start Anchor</span>
          <select id="conn-source-anchor" style="padding: 2px 4px; font-size: 10px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
            <option value="auto" ${sourceAnchor === "auto" ? "selected" : ""}>Auto</option>
            <option value="top" ${sourceAnchor === "top" ? "selected" : ""}>Top</option>
            <option value="bottom" ${sourceAnchor === "bottom" ? "selected" : ""}>Bottom</option>
            <option value="left" ${sourceAnchor === "left" ? "selected" : ""}>Left</option>
            <option value="right" ${sourceAnchor === "right" ? "selected" : ""}>Right</option>
          </select>
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">End Anchor</span>
          <select id="conn-target-anchor" style="padding: 2px 4px; font-size: 10px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
            <option value="auto" ${targetAnchor === "auto" ? "selected" : ""}>Auto</option>
            <option value="top" ${targetAnchor === "top" ? "selected" : ""}>Top</option>
            <option value="bottom" ${targetAnchor === "bottom" ? "selected" : ""}>Bottom</option>
            <option value="left" ${targetAnchor === "left" ? "selected" : ""}>Left</option>
            <option value="right" ${targetAnchor === "right" ? "selected" : ""}>Right</option>
          </select>
        </div>
      </div>

      <!-- Line Shape & End Cap -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 2px;">
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Line Shape</span>
          <select id="conn-shape-select" style="padding: 2px 4px; font-size: 10px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
            <option value="auto" ${lineShape === "auto" ? "selected" : ""}>Default</option>
            <option value="orthogonal" ${lineShape === "orthogonal" ? "selected" : ""}>Elbow</option>
            <option value="straight" ${lineShape === "straight" ? "selected" : ""}>Straight</option>
            <option value="curved" ${lineShape === "curved" ? "selected" : ""}>Curved</option>
          </select>
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">End Cap</span>
          <select id="conn-marker-select" style="padding: 2px 4px; font-size: 10px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
            <option value="arrow" ${markerType === "arrow" ? "selected" : ""}>Arrow</option>
            <option value="dot" ${markerType === "dot" ? "selected" : ""}>Dot</option>
            <option value="none" ${markerType === "none" ? "selected" : ""}>None</option>
          </select>
        </div>
      </div>

      <!-- Color and Style -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 2px;">
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Line Color</span>
          <div style="display: flex; gap: 4px; align-items: center;">
            <input type="color" id="conn-color-picker" value="${strokeColor}" style="width: 24px; height: 18px; border: 1px solid var(--panel-border); cursor: pointer; flex-shrink: 0; padding: 0; background: none;">
            <input type="text" id="conn-color-hex" class="text-input" value="${targetObj.strokeColor || ''}" placeholder="Theme" style="padding: 2px 4px; font-size: 9px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none; width: 100%; height: 18px;">
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Line Style</span>
          <select id="conn-style-select" style="padding: 2px 4px; font-size: 10px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none;">
            <option value="solid" ${lineStyle === "solid" ? "selected" : ""}>Solid</option>
            <option value="dashed" ${lineStyle === "dashed" ? "selected" : ""}>Dashed</option>
          </select>
        </div>
      </div>

      <!-- Flow Animation -->
      <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 2px;">
        <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Flow Animation</span>
        <select id="conn-animation-select" style="padding: 2px 4px; font-size: 10px; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); outline: none; width: 100%;">
          <option value="default" ${animatedVal === "default" ? "selected" : ""}>Default (Follow Canvas)</option>
          <option value="enabled" ${animatedVal === "enabled" ? "selected" : ""}>Enabled</option>
          <option value="disabled" ${animatedVal === "disabled" ? "selected" : ""}>Disabled</option>
        </select>
      </div>

      <!-- Thickness -->
      <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Thickness</span>
          <span id="conn-thickness-val" style="font-size: 9px; font-family: var(--font-mono); color: var(--text-primary);">${strokeW}px</span>
        </div>
        <input type="range" id="conn-thickness-slider" min="1" max="5" step="0.5" value="${strokeW}" style="width: 100%; accent-color: var(--accent-color); cursor: pointer;">
      </div>

      <!-- Bend Offset -->
      <div id="conn-offset-container" style="display: flex; flex-direction: column; gap: 2px; margin-top: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 8px; text-transform: uppercase; color: var(--text-secondary); font-family: var(--font-mono);">Bend Offset</span>
          <span id="conn-offset-val" style="font-size: 9px; font-family: var(--font-mono); color: var(--text-primary);">${lineOffset}px</span>
        </div>
        <input type="range" id="conn-offset-slider" min="-150" max="150" value="${lineOffset}" style="width: 100%; accent-color: var(--accent-color); cursor: pointer;">
      </div>

      <!-- Delete Button -->
      <button class="btn btn-danger" id="conn-delete-btn" style="padding: 6px; font-size: 11px; margin-top: 10px; border-radius: 4px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 2px;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        Delete Arrow
      </button>
    </div>
  `;
  
  selectionSettingsContainer.appendChild(propsEl);
  
  const labelInput = propsEl.querySelector("#conn-label-input");
  const sourceAnchorSelect = propsEl.querySelector("#conn-source-anchor");
  const targetAnchorSelect = propsEl.querySelector("#conn-target-anchor");
  const shapeSelect = propsEl.querySelector("#conn-shape-select");
  const markerSelect = propsEl.querySelector("#conn-marker-select");
  const cPicker = propsEl.querySelector("#conn-color-picker");
  const cHex = propsEl.querySelector("#conn-color-hex");
  const styleSelect = propsEl.querySelector("#conn-style-select");
  const animationSelect = propsEl.querySelector("#conn-animation-select");
  const thicknessSlider = propsEl.querySelector("#conn-thickness-slider");
  const thicknessVal = propsEl.querySelector("#conn-thickness-val");
  const offsetSlider = propsEl.querySelector("#conn-offset-slider");
  const offsetVal = propsEl.querySelector("#conn-offset-val");
  const offsetContainer = propsEl.querySelector("#conn-offset-container");
  const delBtn = propsEl.querySelector("#conn-delete-btn");

  const getTObj = () => {
    return getOrCreateTargetObj(sourceId, targetId);
  };

  labelInput.addEventListener("input", (e) => {
    const obj = getTObj();
    if (obj) obj.label = e.target.value;
    renderSVG();
    saveData();
  });

  const labelFontSelect = propsEl.querySelector("#conn-label-font");
  const labelSizeInput = propsEl.querySelector("#conn-label-size");
  const labelColorPicker = propsEl.querySelector("#conn-label-color-picker");
  const labelColorHex = propsEl.querySelector("#conn-label-color-hex");

  labelFontSelect.addEventListener("change", (e) => {
    const obj = getTObj();
    if (obj) obj.labelFontFamily = e.target.value;
    renderSVG();
    saveData();
  });

  labelSizeInput.addEventListener("change", (e) => {
    const obj = getTObj();
    if (obj) obj.labelFontSize = parseInt(e.target.value) || 9;
    renderSVG();
    saveData();
  });

  wireColorPickerPair(labelColorPicker, labelColorHex, (val) => {
    const obj = getTObj();
    if (obj) obj.labelColor = val;
    renderSVG();
    saveData();
  });

  const anchorChange = (select, prop) => {
    select.addEventListener("change", (e) => {
      const obj = getTObj();
      if (obj) obj[prop] = e.target.value;
      renderSVG();
      saveData();
    });
  };
  anchorChange(sourceAnchorSelect, "sourceAnchor");
  anchorChange(targetAnchorSelect, "targetAnchor");
  anchorChange(markerSelect, "markerType");
  anchorChange(styleSelect, "strokeStyle");

  animationSelect.addEventListener("change", (e) => {
    const obj = getTObj();
    if (obj) {
      const val = e.target.value;
      if (val === "default") {
        delete obj.animated;
      } else if (val === "enabled") {
        obj.animated = true;
      } else if (val === "disabled") {
        obj.animated = false;
      }
    }
    renderSVG();
    saveData();
  });

  shapeSelect.addEventListener("change", (e) => {
    const obj = getTObj();
    if (obj) {
      obj.lineShape = e.target.value;
      const sh = e.target.value !== "auto" ? e.target.value : state.lineShape;
      offsetContainer.style.display = (sh === "orthogonal" || sh === "curved") ? "flex" : "none";
    }
    renderSVG();
    saveData();
  });

  const curShape = lineShape !== "auto" ? lineShape : state.lineShape;
  offsetContainer.style.display = (curShape === "orthogonal" || curShape === "curved") ? "flex" : "none";

  wireColorPickerPair(cPicker, cHex, (val) => {
    const obj = getTObj();
    if (obj) obj.strokeColor = val;
    renderSVG();
    saveData();
  });

  thicknessSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    thicknessVal.textContent = `${val}px`;
    const obj = getTObj();
    if (obj) obj.strokeWidth = val;
    renderSVG();
    saveData();
  });

  offsetSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    offsetVal.textContent = `${val}px`;
    const obj = getTObj();
    if (obj) obj.lineOffset = val;
    renderSVG();
    saveData();
  });

  delBtn.addEventListener("click", () => {
    pushState();
    sourceNode.targets = sourceNode.targets.filter(t => (typeof t === "string" ? t : t.id) !== targetId);
    selectedConnector = null;
    renderAll();
    saveData();
    showToast("Arrow connection deleted");
  });
  
  registerUndoTrigger(sourceAnchorSelect, "change");
  registerUndoTrigger(targetAnchorSelect, "change");
  registerUndoTrigger(shapeSelect, "change");
  registerUndoTrigger(markerSelect, "change");
  registerUndoTrigger(cPicker, "mousedown");
  registerUndoTrigger(cHex, "focus");
  registerUndoTrigger(styleSelect, "change");
  registerUndoTrigger(animationSelect, "change");
  registerUndoTrigger(thicknessSlider, "mousedown");
  registerUndoTrigger(offsetSlider, "mousedown");
}

// Re-render and rebuild nodes/connectors visual shapes in floating minimap SVG
function renderMinimap() {
  const minimapContainer = document.getElementById("canvas-minimap");
  if (!minimapContainer || minimapContainer.classList.contains("minimized")) return;

  const mmNodesGroup = document.getElementById("minimap-nodes-group");
  if (!mmNodesGroup) return;
  
  mmNodesGroup.innerHTML = "";

  // 1. Draw all connectors in the minimap as light grey lines
  const connectors = connectorsGroup.querySelectorAll(".connector-line");
  connectors.forEach(conn => {
    const d = conn.getAttribute("d");
    if (!d) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("class", "minimap-connector");
    mmNodesGroup.appendChild(path);
  });

  // 2. Draw all nodes in the minimap
  state.columns.forEach(col => {
    col.nodes.forEach(node => {
      const pos = nodeCoords[node.id];
      if (!pos) return;
      
      const left = pos.x - NODE_WIDTH / 2;
      const top = pos.y - NODE_HEIGHT / 2;
      const right = pos.x + NODE_WIDTH / 2;
      const bottom = pos.y + NODE_HEIGHT / 2;
      
      const shapeType = node.shape || "rect";
      let miniEl;
      
      if (shapeType === "diamond") {
        miniEl = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        miniEl.setAttribute("points", `${pos.x},${top} ${right},${pos.y} ${pos.x},${bottom} ${left},${pos.y}`);
      } else if (shapeType === "oval") {
        miniEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        miniEl.setAttribute("x", left);
        miniEl.setAttribute("y", top);
        miniEl.setAttribute("width", NODE_WIDTH);
        miniEl.setAttribute("height", NODE_HEIGHT);
        miniEl.setAttribute("rx", NODE_HEIGHT / 2);
        miniEl.setAttribute("ry", NODE_HEIGHT / 2);
      } else if (shapeType === "parallelogram") {
        miniEl = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const skew = 20;
        miniEl.setAttribute("points", `${left + skew},${top} ${right},${top} ${right - skew},${bottom} ${left},${bottom}`);
      } else if (shapeType === "cylinder") {
        miniEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const ry = 6;
        miniEl.setAttribute("d", `M ${left} ${top + ry} A ${NODE_WIDTH/2} ${ry} 0 0 1 ${right} ${top + ry} V ${bottom - ry} A ${NODE_WIDTH/2} ${ry} 0 0 1 ${left} ${bottom - ry} Z`);
      } else {
        miniEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        miniEl.setAttribute("x", left);
        miniEl.setAttribute("y", top);
        miniEl.setAttribute("width", NODE_WIDTH);
        miniEl.setAttribute("height", NODE_HEIGHT);
        const rx = node.rx !== undefined ? node.rx : 0;
        miniEl.setAttribute("rx", rx);
      }
      
      miniEl.setAttribute("class", `minimap-node ${selectedNodeIds.has(node.id) ? "selected" : ""}`);
      mmNodesGroup.appendChild(miniEl);
    });
  });

  // 3. Update the viewport indicator rect
  updateMinimapViewport();
}

// Update the viewport bounds indicator in minimap
function updateMinimapViewport() {
  const indicator = document.getElementById("minimap-viewport-indicator");
  const viewport = document.querySelector(".canvas-viewport");
  const minimapContainer = document.getElementById("canvas-minimap");
  
  if (minimapContainer && minimapContainer.classList.contains("minimized")) return;

  if (indicator && viewport) {
    const vWidth = viewport.clientWidth;
    const vHeight = viewport.clientHeight;
    
    const visibleX = -panX / zoom;
    const visibleY = -panY / zoom;
    const visibleWidth = vWidth / zoom;
    const visibleHeight = vHeight / zoom;
    
    indicator.setAttribute("x", visibleX);
    indicator.setAttribute("y", visibleY);
    indicator.setAttribute("width", Math.max(50, visibleWidth));
    indicator.setAttribute("height", Math.max(50, visibleHeight));
  }
}

// Apply selected global design style themes to nodes in flowchart
function applyGlobalTheme(themeKey) {
  const themeData = THEMES[themeKey];
  if (!themeData) return;
  pushState();
  state.globalTheme = themeKey;
  
  state.columns.forEach(col => {
    col.nodes.forEach(node => {
      if (themeKey === "classic") {
        delete node.fill;
        delete node.stroke;
        delete node.textColor;
        delete node.rx;
        delete node.fillType;
        delete node.fillColor2;
        delete node.gradientAngle;
        delete node.borderStyle;
        delete node.shadowType;
        delete node.shadowOffsetX;
        delete node.shadowOffsetY;
        delete node.shadowBlur;
        delete node.shadowColor;
      } else {
        node.fillType = themeData.fillType || "solid";
        node.fill = themeData.fill;
        if (themeData.fillColor2) node.fillColor2 = themeData.fillColor2;
        if (themeData.gradientAngle !== undefined) node.gradientAngle = themeData.gradientAngle;
        node.stroke = themeData.stroke;
        node.textColor = themeData.textColor;
        node.shadowType = themeData.shadowType || "none";
        node.borderStyle = themeData.borderStyle || "solid";
        if (themeData.shadowOffsetX !== undefined) node.shadowOffsetX = themeData.shadowOffsetX;
        if (themeData.shadowOffsetY !== undefined) node.shadowOffsetY = themeData.shadowOffsetY;
        if (themeData.shadowBlur !== undefined) node.shadowBlur = themeData.shadowBlur;
        if (themeData.shadowColor) node.shadowColor = themeData.shadowColor;
      }
    });
  
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
  
  renderAll();
  saveData();
  showToast(`Applied theme: ${themeData.name}`);
}

// Kickstart
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
