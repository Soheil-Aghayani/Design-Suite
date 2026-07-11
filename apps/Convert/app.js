document.addEventListener('DOMContentLoaded', () => {
  // Set up PDF.js worker URL
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
  }

  // --- STATE ---
  let state = {
    // Single image mode
    imgFile: null,
    imgSrc: null,
    imgWidth: 0,
    imgHeight: 0,
    imgName: "",
    imgSize: 0,
    
    // Batch image mode
    isBatchMode: false,
    batchQueue: [], // Array of { file, src, name, size, status: 'pending'|'converted' }

    // Image Adjustments
    rotate: 0,       // 0, 90, 180, 270
    flipH: false,
    flipV: false,
    grayscale: false,
    
    // PDF tab
    pdfDoc: null,
    pdfName: "",
    pdfPages: 0,

    // EXIF tab
    exifFile: null,
    exifSrc: null,
    exifName: "",
    exifSize: 0,

    // SVG Opt tab
    svgoptName: "",
    svgoptSize: 0,
    svgoptRaw: "",
    svgoptClean: "",
    
    // Active tab
    activeTab: "view-image"
  };

  // DOM Elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.converter-panel');
  const sidebarContents = document.querySelectorAll('.sidebar-tab-content');

  // Image tab elements
  const imgDropZone = document.getElementById('img-drop-zone');
  const fileImg = document.getElementById('file-img');
  const imgPreviewPanel = document.getElementById('img-preview-panel');
  const imgPreviewEl = document.getElementById('img-preview-el');
  const imgNameLbl = document.getElementById('img-name-lbl');
  const imgSizeLbl = document.getElementById('img-size-lbl');
  
  const btnToggleSingle = document.getElementById('btn-toggle-single');
  const btnToggleBatch = document.getElementById('btn-toggle-batch');
  const batchQueueCount = document.getElementById('batch-queue-count');
  const singlePreviewMode = document.getElementById('single-preview-mode');
  const batchPreviewMode = document.getElementById('batch-preview-mode');
  const batchQueueList = document.getElementById('batch-queue-list');
  const paletteColorsList = document.getElementById('palette-colors-list');

  // Image adjustments inputs
  const btnRotateL = document.getElementById('btn-rotate-l');
  const btnRotateR = document.getElementById('btn-rotate-r');
  const btnFlipH = document.getElementById('btn-flip-h');
  const btnFlipV = document.getElementById('btn-flip-v');
  const inputGrayscale = document.getElementById('img-grayscale');

  const selectImgFormat = document.getElementById('img-output-format');
  const wrapperQuality = document.getElementById('img-quality-wrapper');
  const inputImgQuality = document.getElementById('img-quality');
  const valImgQuality = document.getElementById('img-quality-lbl');
  const selectScaleMode = document.getElementById('img-scale-mode');
  const customDimsRow = document.getElementById('custom-dims-row');
  const inputCustomW = document.getElementById('img-custom-w');
  const inputCustomH = document.getElementById('img-custom-h');
  const btnConvertImage = document.getElementById('btn-convert-image');
  const btnClearImages = document.getElementById('btn-clear-images');

  // PDF tab elements
  const pdfDropZone = document.getElementById('pdf-drop-zone');
  const filePdf = document.getElementById('file-pdf');
  const pdfPreviewPanel = document.getElementById('pdf-preview-panel');
  const pdfNameLbl = document.getElementById('pdf-name-lbl');
  const pdfPagesLbl = document.getElementById('pdf-pages-lbl');
  const pdfPagesGrid = document.getElementById('pdf-pages-grid');
  const selectPdfScale = document.getElementById('pdf-scale');
  const btnPdfDownloadAll = document.getElementById('btn-pdf-download-all');
  const btnClearPdf = document.getElementById('btn-clear-pdf');

  // Text & Data tab elements
  const selectTextMode = document.getElementById('text-convert-mode');
  const textInputField = document.getElementById('text-input-field');
  const textOutputField = document.getElementById('text-output-field');
  const excelTableContainer = document.getElementById('excel-table-container');
  const excelPreviewTable = document.getElementById('excel-preview-table').querySelector('tbody');
  const textOutputHeader = document.getElementById('text-output-header');
  const btnTextExport = document.getElementById('btn-text-export');
  const btnTextCopy = document.getElementById('btn-text-copy');

  // EXIF Cleaner elements
  const exifDropZone = document.getElementById('exif-drop-zone');
  const fileExif = document.getElementById('file-exif');
  const exifPreviewPanel = document.getElementById('exif-preview-panel');
  const exifPreviewEl = document.getElementById('exif-preview-el');
  const exifNameLbl = document.getElementById('exif-name-lbl');
  const exifSizeLbl = document.getElementById('exif-size-lbl');
  const exifLogContent = document.getElementById('exif-log-content');
  const btnStripExif = document.getElementById('btn-strip-exif');
  const btnClearExif = document.getElementById('btn-clear-exif');

  // SVG Optimizer elements
  const svgoptDropZone = document.getElementById('svgopt-drop-zone');
  const fileSvgopt = document.getElementById('file-svgopt');
  const svgoptPreviewPanel = document.getElementById('svgopt-preview-panel');
  const svgoptNameLbl = document.getElementById('svgopt-name-lbl');
  const svgoptStatsLbl = document.getElementById('svgopt-stats-lbl');
  const svgoptRenderedContainer = document.getElementById('svgopt-rendered-container');
  const svgoptCodeField = document.getElementById('svgopt-code-field');
  const inputSvgoptPrecision = document.getElementById('svgopt-precision');
  const valSvgoptPrecision = document.getElementById('svgopt-precision-lbl');
  const inputSvgoptRemoveComments = document.getElementById('svgopt-remove-comments');
  const inputSvgoptRemoveMetadata = document.getElementById('svgopt-remove-metadata');
  const btnSaveSvgopt = document.getElementById('btn-save-svgopt');
  const btnCopySvgopt = document.getElementById('btn-copy-svgopt');
  const btnClearSvgopt = document.getElementById('btn-clear-svgopt');

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
      
      if (targetId === "view-image") {
        document.getElementById('panel-image-settings').classList.add('active');
      } else if (targetId === "view-pdf") {
        document.getElementById('panel-pdf-settings').classList.add('active');
      } else if (targetId === "view-text") {
        document.getElementById('panel-text-settings').classList.add('active');
      } else if (targetId === "view-exif") {
        document.getElementById('panel-exif-settings').classList.add('active');
      } else if (targetId === "view-svgopt") {
        document.getElementById('panel-svgopt-settings').classList.add('active');
      }
    });
  });

  // --- IMAGE PREVIEWS & ADJUSTMENT LISTENERS ---
  
  function applyAdjustmentsTransform() {
    // Apply rotate, flip scale and filter values to the live DOM image container
    let transformStr = `rotate(${state.rotate}deg) scaleX(${state.flipH ? -1 : 1}) scaleY(${state.flipV ? -1 : 1})`;
    imgPreviewEl.style.transform = transformStr;
    imgPreviewEl.style.filter = state.grayscale ? 'grayscale(100%)' : 'none';
  }

  btnRotateL.addEventListener('click', () => {
    state.rotate = (state.rotate - 90 + 360) % 360;
    applyAdjustmentsTransform();
  });

  btnRotateR.addEventListener('click', () => {
    state.rotate = (state.rotate + 90) % 360;
    applyAdjustmentsTransform();
  });

  btnFlipH.addEventListener('click', () => {
    state.flipH = !state.flipH;
    applyAdjustmentsTransform();
  });

  btnFlipV.addEventListener('click', () => {
    state.flipV = !state.flipV;
    applyAdjustmentsTransform();
  });

  inputGrayscale.addEventListener('change', () => {
    state.grayscale = inputGrayscale.checked;
    applyAdjustmentsTransform();
  });

  // --- AUTOMATIC COLOR PALETTE EXTRACTOR ---
  function extractColorPalette(imgEl) {
    // Render image on a tiny canvas to extract main colors
    const cv = document.createElement('canvas');
    cv.width = 16;
    cv.height = 16;
    const ctx = cv.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, 16, 16);
    
    const imgData = ctx.getImageData(0, 0, 16, 16).data;
    const colorCounts = {};

    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];
      if (a < 50) continue; // Skip transparency

      // Round color channels to bucket colors and avoid minor variance spikes
      const rR = Math.round(r / 16) * 16;
      const rG = Math.round(g / 16) * 16;
      const rB = Math.round(b / 16) * 16;
      
      const hex = rgbToHexVal(rR, rG, rB);
      colorCounts[hex] = (colorCounts[hex] || 0) + 1;
    }

    // Sort color entries by occurrences
    const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
    
    paletteColorsList.innerHTML = "";
    // Display top 6 dominant colors
    const displayCount = Math.min(6, sorted.length);
    for (let i = 0; i < displayCount; i++) {
      const color = sorted[i][0];
      const chip = document.createElement('div');
      chip.className = 'palette-color-chip';
      chip.style.backgroundColor = color;
      chip.textContent = color;
      chip.title = `Click to copy ${color}`;
      
      chip.addEventListener('click', () => {
        navigator.clipboard.writeText(color).then(() => {
          showToast(`Copied ${color} to Clipboard!`);
        });
      });
      paletteColorsList.appendChild(chip);
    }
  }

  function rgbToHexVal(r, g, b) {
    const componentToHex = (x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  // --- BATCH LOADING / INTERACTION CONTROLS ---

  btnToggleSingle.addEventListener('click', () => {
    btnToggleSingle.classList.add('active');
    btnToggleBatch.classList.remove('active');
    singlePreviewMode.style.display = 'flex';
    batchPreviewMode.style.display = 'none';
  });

  btnToggleBatch.addEventListener('click', () => {
    btnToggleSingle.classList.remove('active');
    btnToggleBatch.classList.add('active');
    singlePreviewMode.style.display = 'none';
    batchPreviewMode.style.display = 'flex';
  });

  // Drag-and-drop triggers
  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  }

  function handleDragLeave(e) {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  }

  imgDropZone.addEventListener('dragover', handleDragOver);
  imgDropZone.addEventListener('dragleave', handleDragLeave);
  imgDropZone.addEventListener('drop', (e) => {
    e.stopPropagation();
    e.preventDefault();
    imgDropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length) handleMultipleImagesSelect(files);
  });

  fileImg.addEventListener('change', (e) => {
    if (e.target.files.length) handleMultipleImagesSelect(e.target.files);
  });

  async function handleMultipleImagesSelect(files) {
    showToast(`Loading ${files.length} image files...`);
    
    // Reset queue
    state.batchQueue = [];
    batchQueueList.innerHTML = "";

    // Toggle mode
    if (files.length > 1) {
      state.isBatchMode = true;
      btnToggleBatch.style.display = 'block';
      batchQueueCount.textContent = files.length;
      btnToggleBatch.click();
    } else {
      state.isBatchMode = false;
      btnToggleBatch.style.display = 'none';
      btnToggleSingle.click();
    }

    // Process files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const src = await readFileAsDataURL(file);
      
      const item = {
        file,
        src,
        name: file.name,
        size: file.size,
        status: 'pending'
      };
      
      state.batchQueue.push(item);
      addBatchItemToQueueList(item, i);
      
      // Load first image as single preview baseline
      if (i === 0) {
        state.imgFile = file;
        state.imgName = file.name;
        state.imgSize = file.size;
        state.imgSrc = src;
        
        imgPreviewEl.src = src;
        imgNameLbl.textContent = file.name;
        
        // Reset transform values
        state.rotate = 0;
        state.flipH = false;
        state.flipV = false;
        state.grayscale = false;
        inputGrayscale.checked = false;
        applyAdjustmentsTransform();
        
        imgPreviewEl.onload = () => {
          state.imgWidth = imgPreviewEl.width;
          state.imgHeight = imgPreviewEl.height;
          imgSizeLbl.textContent = `${(file.size / 1024).toFixed(1)} KB (${imgPreviewEl.width} × ${imgPreviewEl.height} px)`;
          extractColorPalette(imgPreviewEl);
        };
      }
    }

    imgDropZone.style.display = 'none';
    imgPreviewPanel.style.display = 'flex';
    btnClearImages.style.display = 'block';
  }

  function readFileAsDataURL(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  function addBatchItemToQueueList(item, index) {
    const row = document.createElement('div');
    row.className = 'batch-item';
    row.dataset.index = index;

    row.innerHTML = `
      <div class="batch-item-left">
        <img class="batch-item-thumb" src="${item.src}" alt="Thumb">
        <div class="batch-item-name" title="${item.name}">${item.name}</div>
      </div>
      <div class="batch-item-status" id="batch-status-${index}">Pending</div>
    `;

    batchQueueList.appendChild(row);
  }

  // --- CANVAS CONVERSION AND DOWNLOAD MODULE ---

  function applyAdjustmentsToCanvasContext(ctx, width, height, outW, outH) {
    // Translate origin to center
    ctx.translate(outW / 2, outH / 2);

    // Apply flip horizontal / vertical
    ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);

    // Apply rotation
    const angleRad = (state.rotate * Math.PI) / 180;
    ctx.rotate(angleRad);

    // Apply grayscale filter
    if (state.grayscale) {
      ctx.filter = 'grayscale(100%)';
    }

    // Determine correct drawing dimensions based on rotation
    const rotated = (state.rotate % 180 !== 0);
    const drawW = rotated ? outH : outW;
    const drawH = rotated ? outW : outH;

    ctx.drawImage(imgPreviewEl, -drawW / 2, -drawH / 2, drawW, drawH);
  }

  async function convertSingleImage(src, name, outputFormat, quality, scaleMode, outW, outH) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        // Calculate dimensions
        let finalW = img.width;
        let finalH = img.height;
        
        // Swap dimensions if rotated 90/270 degrees
        const rotated = (state.rotate % 180 !== 0);
        if (rotated) {
          finalW = img.height;
          finalH = img.width;
        }

        if (scaleMode === '256') { finalW = 256; finalH = 256; }
        else if (scaleMode === '128') { finalW = 128; finalH = 128; }
        else if (scaleMode === '64') { finalW = 64; finalH = 64; }
        else if (scaleMode === 'custom') {
          finalW = outW;
          finalH = outH;
        }

        const cv = document.createElement('canvas');
        cv.width = finalW;
        cv.height = finalH;
        const ctx = cv.getContext('2d');
        
        // Render adjustments
        applyAdjustmentsToCanvasContext(ctx, img.width, img.height, finalW, finalH);

        const cleanName = name.replace(/\.[^/.]+$/, "");

        if (outputFormat === 'ico') {
          // ICO format builder
          const icoCv = document.createElement('canvas');
          icoCv.width = 256;
          icoCv.height = 256;
          const icoCtx = icoCv.getContext('2d');
          
          icoCtx.translate(128, 128);
          icoCtx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
          icoCtx.rotate((state.rotate * Math.PI) / 180);
          if (state.grayscale) icoCtx.filter = 'grayscale(100%)';
          
          const drawSize = rotated ? 256 : 256;
          icoCtx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);

          icoCv.toBlob(async (pngBlob) => {
            const icoBlob = await createIcoBuffer(pngBlob);
            downloadBlob(icoBlob, `${cleanName}.ico`);
            resolve();
          }, 'image/png');
        } else {
          // Standard Image format download
          let mime = 'image/png';
          let ext = 'png';
          if (outputFormat === 'webp') { mime = 'image/webp'; ext = 'webp'; }
          else if (outputFormat === 'jpeg') { mime = 'image/jpeg'; ext = 'jpg'; }

          cv.toBlob((blob) => {
            downloadBlob(blob, `${cleanName}_converted.${ext}`);
            resolve();
          }, mime, quality);
        }
      };
      img.src = src;
    });
  }

  // Convert trigger
  btnConvertImage.addEventListener('click', async () => {
    if (state.isBatchMode) {
      if (state.batchQueue.length === 0) return;
      
      btnConvertImage.disabled = true;
      showToast("Starting batch image conversion...");
      
      const format = selectImgFormat.value;
      const quality = parseInt(inputImgQuality.value, 10) / 100.0;
      const scaleMode = selectScaleMode.value;
      const outW = parseInt(inputCustomW.value, 10) || 800;
      const outH = parseInt(inputCustomH.value, 10) || 600;

      for (let i = 0; i < state.batchQueue.length; i++) {
        const item = state.batchQueue[i];
        const statusEl = document.getElementById(`batch-status-${i}`);
        statusEl.textContent = "Converting...";
        
        await convertSingleImage(item.src, item.name, format, quality, scaleMode, outW, outH);
        
        statusEl.textContent = "Converted";
        statusEl.classList.add('converted');
        item.status = 'converted';
        
        await new Promise(r => setTimeout(r, 400));
      }
      
      btnConvertImage.disabled = false;
      showToast("All batch conversions completed!");
    } else {
      if (!state.imgSrc) {
        showToast("Please drag or select an image first!");
        return;
      }
      
      const format = selectImgFormat.value;
      const quality = parseInt(inputImgQuality.value, 10) / 100.0;
      const scaleMode = selectScaleMode.value;
      const outW = parseInt(inputCustomW.value, 10) || 800;
      const outH = parseInt(inputCustomH.value, 10) || 600;

      showToast("Converting image...");
      await convertSingleImage(state.imgSrc, state.imgName, format, quality, scaleMode, outW, outH);
      showToast("Conversion downloaded successfully!");
    }
  });

  // Client-side ICO byte packing
  function createIcoBuffer(pngBlob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const pngBytes = new Uint8Array(e.target.result);
        const pngSize = pngBytes.length;
        
        const buffer = new ArrayBuffer(22 + pngSize);
        const view = new DataView(buffer);
        
        view.setUint16(0, 0, true);
        view.setUint16(2, 1, true);
        view.setUint16(4, 1, true);
        
        view.setUint8(6, 0);
        view.setUint8(7, 0);
        view.setUint8(8, 0);
        view.setUint8(9, 0);
        view.setUint16(10, 1, true);
        view.setUint16(12, 32, true);
        view.setUint32(14, pngSize, true);
        view.setUint32(18, 22, true);
        
        const dest = new Uint8Array(buffer, 22);
        dest.set(pngBytes);
        
        resolve(new Blob([buffer], { type: "image/x-icon" }));
      };
      reader.readAsArrayBuffer(pngBlob);
    });
  }

  // Clear image queue
  btnClearImages.addEventListener('click', () => {
    state.imgFile = null;
    state.imgSrc = null;
    state.batchQueue = [];
    state.isBatchMode = false;
    
    fileImg.value = "";
    imgPreviewEl.src = "";
    
    imgPreviewPanel.style.display = 'none';
    imgDropZone.style.display = 'flex';
    btnClearImages.style.display = 'none';
    btnToggleBatch.style.display = 'none';
    showToast("Images cleared successfully!");
  });

  // Quality range toggle visibility
  selectImgFormat.addEventListener('change', () => {
    if (selectImgFormat.value === 'png' || selectImgFormat.value === 'ico') {
      wrapperQuality.style.display = 'none';
    } else {
      wrapperQuality.style.display = 'block';
    }
  });

  selectScaleMode.addEventListener('change', () => {
    if (selectScaleMode.value === 'custom') {
      customDimsRow.style.display = 'flex';
    } else {
      customDimsRow.style.display = 'none';
    }
  });

  // --- PDF TO IMAGE LOGIC ---

  pdfDropZone.addEventListener('dragover', handleDragOver);
  pdfDropZone.addEventListener('dragleave', handleDragLeave);
  pdfDropZone.addEventListener('drop', (e) => {
    e.stopPropagation();
    e.preventDefault();
    pdfDropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length) handlePdfSelect(files[0]);
  });

  filePdf.addEventListener('change', (e) => {
    if (e.target.files.length) handlePdfSelect(e.target.files[0]);
  });

  function handlePdfSelect(file) {
    if (!window.pdfjsLib) {
      alert("PDF.js library failed to load. Check your internet connection.");
      return;
    }
    
    state.pdfName = file.name;
    pdfPagesGrid.innerHTML = "";

    const reader = new FileReader();
    reader.onload = async (e) => {
      const typedArray = new Uint8Array(e.target.result);
      try {
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        state.pdfDoc = pdf;
        state.pdfPages = pdf.numPages;

        pdfNameLbl.textContent = file.name;
        pdfPagesLbl.textContent = `Total: ${pdf.numPages} Pages`;

        pdfDropZone.style.display = 'none';
        pdfPreviewPanel.style.display = 'flex';
        btnClearPdf.style.display = 'block';

        showToast("PDF document loaded!");
        renderPdfPagesList();
      } catch (err) {
        alert("Failed to parse PDF document.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function renderPdfPagesList() {
    pdfPagesGrid.innerHTML = "";
    const scale = 0.5;

    for (let pNum = 1; pNum <= state.pdfPages; pNum++) {
      const page = await state.pdfDoc.getPage(pNum);
      const viewportObj = page.getViewport({ scale });

      const card = document.createElement('div');
      card.className = 'pdf-page-card';
      card.dataset.pageNum = pNum;

      const thumbContainer = document.createElement('div');
      thumbContainer.className = 'pdf-page-thumb-container';

      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = viewportObj.width;
      thumbCanvas.height = viewportObj.height;
      
      const renderContext = {
        canvasContext: thumbCanvas.getContext('2d'),
        viewport: viewportObj
      };
      
      await page.render(renderContext).promise;

      thumbContainer.appendChild(thumbCanvas);
      
      const label = document.createElement('div');
      label.className = 'pdf-page-label';
      label.textContent = `Page ${pNum}`;

      card.appendChild(thumbContainer);
      card.appendChild(label);

      card.addEventListener('click', () => downloadPdfPage(pNum));

      pdfPagesGrid.appendChild(card);
    }
  }

  async function downloadPdfPage(pageNum) {
    const page = await state.pdfDoc.getPage(pageNum);
    const density = parseFloat(selectPdfScale.value) || 2.0;
    const viewportObj = page.getViewport({ scale: density });

    const cv = document.createElement('canvas');
    cv.width = viewportObj.width;
    cv.height = viewportObj.height;
    
    const renderContext = {
      canvasContext: cv.getContext('2d'),
      viewport: viewportObj
    };
    
    showToast(`Rendering Page ${pageNum}...`);
    await page.render(renderContext).promise;

    cv.toBlob((blob) => {
      const docName = state.pdfName.replace(/\.[^/.]+$/, "");
      downloadBlob(blob, `${docName}_page_${pageNum}.png`);
      showToast(`Page ${pageNum} saved!`);
    }, 'image/png');
  }

  btnPdfDownloadAll.addEventListener('click', async () => {
    if (!state.pdfDoc) return;
    btnPdfDownloadAll.disabled = true;
    for (let p = 1; p <= state.pdfPages; p++) {
      await downloadPdfPage(p);
      await new Promise(r => setTimeout(r, 600));
    }
    btnPdfDownloadAll.disabled = false;
    showToast("Completed batch PDF page exports!");
  });

  btnClearPdf.addEventListener('click', () => {
    state.pdfDoc = null;
    state.pdfName = "";
    state.pdfPages = 0;
    
    filePdf.value = "";
    pdfPagesGrid.innerHTML = "";
    
    pdfPreviewPanel.style.display = 'none';
    pdfDropZone.style.display = 'flex';
    btnClearPdf.style.display = 'none';
    showToast("PDF document closed.");
  });

  // --- TEXT & DATA CONVERTER LOGIC ---

  const FA_EN_MAP = {
    "۰":"0","۱":"1","۲":"2","۳":"3","۴":"4","۵":"5","۶":"6","۷":"7","۸":"8","۹":"9",
    "٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9",
    "٬":",", "٫":"."
  };

  const EN_FA_MAP = {
    "0":"۰","1":"۱","2":"۲","3":"۳","4":"۴","5":"۵","6":"۶","7":"۷","8":"۸","9":"۹",
    ".":"٫", ",":"٬"
  };

  function convertDigits(text, type) {
    if (type === 'fa2en') {
      return text.replace(/[۰-۹٠-٩٬٫]/g, m => FA_EN_MAP[m] || m);
    } else if (type === 'en2fa') {
      return text.replace(/[0-9\.,]/g, m => EN_FA_MAP[m] || m);
    }
    return text;
  }

  function parseWord2ExcelList(text) {
    const lines = text.split('\n');
    const records = [];

    lines.forEach(line => {
      line = line.trim();
      if (!line) return;

      line = line.replace(/[\u200f\u202b\u202c]/g, "");

      const m = line.match(/\s*[-–—]\s*/);
      if (!m) return;

      const left = line.substring(0, m.index);
      const position = line.substring(m.index + m[0].length);

      const name = left.replace(/^\s*[\d۰-۹]+[\-\.\)]\s*/, "").trim();
      const pos = position.trim();

      if (name && pos) {
        records.push({ name, position: pos });
      }
    });

    return records;
  }

  // Universal text processing
  function processText(text, mode) {
    try {
      if (mode === 'fa2en' || mode === 'en2fa') {
        return convertDigits(text, mode);
      } else if (mode === 'uppercase') {
        return text.toUpperCase();
      } else if (mode === 'lowercase') {
        return text.toLowerCase();
      } else if (mode === 'jsonbeautify') {
        if (!text.trim()) return "";
        return JSON.stringify(JSON.parse(text), null, 2);
      } else if (mode === 'base64encode') {
        return btoa(unescape(encodeURIComponent(text)));
      } else if (mode === 'base64decode') {
        return decodeURIComponent(escape(atob(text)));
      }
    } catch (e) {
      return `[ERROR: Conversion failed. ${e.message}]`;
    }
    return text;
  }

  selectTextMode.addEventListener('change', runTextParsing);
  textInputField.addEventListener('input', runTextParsing);

  function runTextParsing() {
    const text = textInputField.value;
    const mode = selectTextMode.value;

    if (mode === 'word2excel') {
      textOutputField.style.display = 'none';
      excelTableContainer.style.display = 'block';
      textOutputHeader.textContent = "Extracted List Preview";

      const records = parseWord2ExcelList(text);
      excelPreviewTable.innerHTML = "";

      if (records.length === 0) {
        excelPreviewTable.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--text-secondary);">No valid Name-Position records matched.</td></tr>`;
      } else {
        records.forEach(r => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><strong>${escapeHtml(r.name)}</strong></td>
            <td>${escapeHtml(r.position)}</td>
          `;
          excelPreviewTable.appendChild(row);
        });
      }
    } else {
      excelTableContainer.style.display = 'none';
      textOutputField.style.display = 'block';
      textOutputHeader.textContent = "Parsed Result";

      const out = processText(text, mode);
      textOutputField.value = out;
    }
  }

  btnTextExport.addEventListener('click', () => {
    const text = textInputField.value;
    const mode = selectTextMode.value;

    if (!text.trim()) {
      showToast("Input is empty!");
      return;
    }

    if (mode === 'word2excel') {
      const records = parseWord2ExcelList(text);
      if (records.length === 0) {
        alert("No valid Name-Position items to export!");
        return;
      }

      let csvContent = "\uFEFF";
      csvContent += "Name,Position / Description\n";
      records.forEach(r => {
        const name = `"${r.name.replace(/"/g, '""')}"`;
        const pos = `"${r.position.replace(/"/g, '""')}"`;
        csvContent += `${name},${pos}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, "extracted_name_list.csv");
      showToast("CSV file exported successfully!");
    } else {
      const out = processText(text, mode);
      const blob = new Blob([out], { type: 'text/plain;charset=utf-8' });
      downloadBlob(blob, `converted_text.txt`);
      showToast("Text file exported successfully!");
    }
  });

  btnTextCopy.addEventListener('click', () => {
    const mode = selectTextMode.value;
    let textToCopy = "";

    if (mode === 'word2excel') {
      const records = parseWord2ExcelList(textInputField.value);
      textToCopy = records.map(r => `${r.name}\t${r.position}`).join('\n');
    } else {
      textToCopy = textOutputField.value;
    }

    if (!textToCopy.trim()) {
      showToast("Nothing to copy!");
      return;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast("Result copied to Clipboard!");
    }).catch(() => {
      showToast("Clipboard write failed.");
    });
  });

  // --- GENERAL HELPER UTILITIES ---

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  let toastTimer = null;
  function showToast(message) {
    appToast.textContent = message;
    appToast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      appToast.classList.remove('visible');
    }, 2000);
  }

  // --- EXIF CLEANER & METADATA STRIPPER LOGIC ---

  exifDropZone.addEventListener('dragover', handleDragOver);
  exifDropZone.addEventListener('dragleave', handleDragLeave);
  exifDropZone.addEventListener('drop', (e) => {
    e.stopPropagation();
    e.preventDefault();
    exifDropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length) handleExifSelect(files[0]);
  });

  fileExif.addEventListener('change', (e) => {
    if (e.target.files.length) handleExifSelect(e.target.files[0]);
  });

  function handleExifSelect(file) {
    state.exifFile = file;
    state.exifName = file.name;
    state.exifSize = file.size;

    // Load preview image
    const readerImg = new FileReader();
    readerImg.onload = (e) => {
      state.exifSrc = e.target.result;
      exifPreviewEl.src = state.exifSrc;
    };
    readerImg.readAsDataURL(file);

    // Read bytes to scan and analyze markers
    const readerBytes = new FileReader();
    readerBytes.onload = (e) => {
      const buffer = e.target.result;
      const report = analyzeMetadataBytes(buffer);
      
      exifNameLbl.textContent = file.name;
      exifSizeLbl.textContent = `${(file.size / 1024).toFixed(1)} KB`;
      exifLogContent.textContent = report;

      exifDropZone.style.display = 'none';
      exifPreviewPanel.style.display = 'flex';
      btnClearExif.style.display = 'block';
      showToast("Metadata diagnostic completed!");
    };
    readerBytes.readAsArrayBuffer(file);
  }

  function analyzeMetadataBytes(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    let log = "--- METADATA ANALYZER DIAGNOSTIC LOG ---\n\n";
    log += `[FILE] Size: ${arrayBuffer.byteLength} bytes\n`;

    if (arrayBuffer.byteLength < 4) {
      log += "[ERROR] File is too small to analyze.\n";
      return log;
    }

    // Check for JPEG Start-Of-Image marker FFD8
    if (view.getUint16(0) !== 0xFFD8) {
      log += "[FORMAT] File format is not JPEG (PNG or WebP detected).\n";
      log += "[INFO] PNG and WebP files store metadata in text chunks (tEXt, iTXt) or EXIF blocks.\n";
      log += "[STATUS] All custom meta headers will be fully stripped upon cleaning.\n";
      return log;
    }

    log += "[FOUND] JPEG Start-of-Image (SOI) marker.\n";
    let offset = 2;
    let foundExif = false;
    let foundXmp = false;
    let foundIcc = false;

    while (offset < view.byteLength - 1) {
      const marker = view.getUint16(offset);
      if (marker === 0xFFD9) {
        log += "[FOUND] JPEG End-of-Image (EOI) marker.\n";
        break;
      }
      if ((marker & 0xFF00) !== 0xFF00) {
        offset++;
        continue;
      }

      // Check offset boundaries
      if (offset + 4 > view.byteLength) break;
      const length = view.getUint16(offset + 2);
      
      if (marker === 0xFFE1) { // APP1 segment (EXIF / XMP)
        const sig = [];
        for (let i = 0; i < 4; i++) {
          if (offset + 4 + i < view.byteLength) {
            sig.push(view.getUint8(offset + 4 + i));
          }
        }
        const sigStr = String.fromCharCode(...sig);
        if (sigStr.startsWith("Exif")) {
          foundExif = true;
          log += `[FOUND] EXIF Metadata segment (APP1) - Size: ${length} bytes\n`;
          
          // Spatial dump search for common keys
          const startScan = offset + 4;
          const endScan = Math.min(view.byteLength, offset + 2 + length);
          const chunkBytes = new Uint8Array(arrayBuffer, startScan, endScan - startScan);
          const textDump = String.fromCharCode(...chunkBytes);

          // Standard tags search
          const makeModelMatch = textDump.match(/(Apple|Samsung|Sony|Nikon|Canon|Google|Huawei|Xiaomi|OnePlus)/i);
          if (makeModelMatch) log += `  ➔ Camera Brand/Model: ${makeModelMatch[0]}\n`;

          const softwareMatch = textDump.match(/(Adobe Photoshop|Lightroom|iOS|Android|Windows Photo|GIMP)/i);
          if (softwareMatch) log += `  ➔ Editing Software: ${softwareMatch[0]}\n`;

          const dateMatch = textDump.match(/\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}/);
          if (dateMatch) log += `  ➔ Creation Date: ${dateMatch[0]}\n`;

          if (textDump.includes("GPS")) {
            log += "  ➔ [WARNING] GPS Geolocation tag coordinates detected!\n";
          }
        } else {
          foundXmp = true;
          log += `[FOUND] XMP XML Core descriptor (APP1) - Size: ${length} bytes\n`;
        }
      } else if (marker === 0xFFE2) { // APP2 segment (ICC Profiles)
        foundIcc = true;
        log += `[FOUND] ICC Color Profile metadata (APP2) - Size: ${length} bytes\n`;
      } else if (marker >= 0xFFE0 && marker <= 0xFFEF) {
        log += `[FOUND] Application segment (APP${marker & 0x0F}) - Size: ${length} bytes\n`;
      }

      offset += 2 + length;
    }

    if (!foundExif && !foundXmp && !foundIcc) {
      log += "[INFO] No common identifier segments found. File may already be clean.\n";
    }

    log += "\n[STATUS] Ready to scrub. Re-encoding will strip all metadata.\n";
    return log;
  }

  // Draw on canvas and save to strip EXIF
  btnStripExif.addEventListener('click', () => {
    if (!state.exifSrc) return;

    btnStripExif.disabled = true;
    showToast("Scrubbing metadata headers...");

    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0);

      cv.toBlob((blob) => {
        const cleanName = state.exifName.replace(/\.[^/.]+$/, "");
        downloadBlob(blob, `${cleanName}_privacy_clean.jpg`);
        btnStripExif.disabled = false;
        showToast("Metadata stripped successfully!");
      }, 'image/jpeg', 0.95);
    };
    img.src = state.exifSrc;
  });

  btnClearExif.addEventListener('click', () => {
    state.exifFile = null;
    state.exifSrc = null;
    state.exifName = "";
    state.exifSize = 0;

    fileExif.value = "";
    exifPreviewEl.src = "";
    exifLogContent.textContent = "";

    exifPreviewPanel.style.display = 'none';
    exifDropZone.style.display = 'flex';
    btnClearExif.style.display = 'none';
    showToast("Image closed.");
  });

  // --- SVG OPTIMIZER & VECTOR MINIFIER LOGIC ---

  svgoptDropZone.addEventListener('dragover', handleDragOver);
  svgoptDropZone.addEventListener('dragleave', handleDragLeave);
  svgoptDropZone.addEventListener('drop', (e) => {
    e.stopPropagation();
    e.preventDefault();
    svgoptDropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length) handleSvgoptSelect(files[0]);
  });

  fileSvgopt.addEventListener('change', (e) => {
    if (e.target.files.length) handleSvgoptSelect(e.target.files[0]);
  });

  function handleSvgoptSelect(file) {
    state.svgoptName = file.name;
    state.svgoptSize = file.size;

    const reader = new FileReader();
    reader.onload = (e) => {
      state.svgoptRaw = e.target.result;
      runSvgOptimization();

      svgoptDropZone.style.display = 'none';
      svgoptPreviewPanel.style.display = 'flex';
      showToast("SVG Loaded for optimization!");
    };
    reader.readAsText(file);
  }

  function runSvgOptimization() {
    if (!state.svgoptRaw) return;

    const precision = parseInt(inputSvgoptPrecision.value, 10);
    const removeComments = inputSvgoptRemoveComments.checked;
    const removeMetadata = inputSvgoptRemoveMetadata.checked;

    // Update label
    valSvgoptPrecision.textContent = precision;

    let clean = state.svgoptRaw;

    // 1. Remove comments
    if (removeComments) {
      clean = clean.replace(/<!--[\s\S]*?-->/g, "");
    }

    // 2. Remove editor metadata & tags
    if (removeMetadata) {
      clean = clean.replace(/<\?xml[\s\S]*?\?>/i, "");
      clean = clean.replace(/<!DOCTYPE[\s\S]*?>/i, "");
      clean = clean.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
      clean = clean.replace(/\s*(inkscape|sodipodi):[a-z0-9-]+="[^"]*"/gi, "");
      clean = clean.replace(/\s*xmlns:(inkscape|sodipodi|dc|cc|rdf|svg)="[^"]*"/gi, "");
    }

    // 3. Round coordinate decimals in path 'd' or 'points' elements
    clean = clean.replace(/(-?\d+\.\d+)/g, (match) => {
      const num = parseFloat(match);
      if (isNaN(num)) return match;
      const rounded = num.toFixed(precision);
      // Strip trailing zeroes to compress further
      return rounded.replace(/\.?0+$/, "");
    });

    // 4. Minify formatting whitespace
    clean = clean.replace(/\r?\n|\t/g, " ");
    clean = clean.replace(/\s+/g, " ");
    clean = clean.replace(/>\s+</g, "><");
    clean = clean.replace(/\s*(=)\s*/g, "=");
    clean = clean.trim();

    state.svgoptClean = clean;

    // Render visual preview
    svgoptRenderedContainer.innerHTML = clean;
    
    // Set code text
    svgoptCodeField.value = clean;

    // Calculate savings
    const origSizeKb = state.svgoptSize / 1024;
    const optSizeKb = clean.length / 1024; // 1 char = 1 byte
    const savings = state.svgoptSize > 0 
      ? (((state.svgoptSize - clean.length) / state.svgoptSize) * 100).toFixed(0)
      : 0;

    svgoptNameLbl.textContent = state.svgoptName;
    svgoptStatsLbl.textContent = `Original: ${origSizeKb.toFixed(1)} KB | Optimized: ${optSizeKb.toFixed(1)} KB (-${savings}%)`;
  }

  // Bind settings updates
  inputSvgoptPrecision.addEventListener('input', runSvgOptimization);
  inputSvgoptRemoveComments.addEventListener('change', runSvgOptimization);
  inputSvgoptRemoveMetadata.addEventListener('change', runSvgOptimization);

  btnSaveSvgopt.addEventListener('click', () => {
    if (!state.svgoptClean) return;
    const blob = new Blob([state.svgoptClean], { type: 'image/svg+xml;charset=utf-8' });
    const cleanName = state.svgoptName.replace(/\.[^/.]+$/, "");
    downloadBlob(blob, `${cleanName}_optimized.svg`);
    showToast("Optimized SVG saved!");
  });

  btnCopySvgopt.addEventListener('click', () => {
    if (!state.svgoptClean) return;
    navigator.clipboard.writeText(state.svgoptClean).then(() => {
      showToast("Optimized SVG copied to Clipboard!");
    });
  });

  btnClearSvgopt.addEventListener('click', () => {
    state.svgoptName = "";
    state.svgoptSize = 0;
    state.svgoptRaw = "";
    state.svgoptClean = "";

    fileSvgopt.value = "";
    svgoptRenderedContainer.innerHTML = "";
    svgoptCodeField.value = "";

    svgoptPreviewPanel.style.display = 'none';
    svgoptDropZone.style.display = 'flex';
    showToast("SVG file closed.");
  });

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

});
