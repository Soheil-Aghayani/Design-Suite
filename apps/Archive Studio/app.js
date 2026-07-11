document.addEventListener('DOMContentLoaded', () => {
  // Theme management
  function syncTheme() {
    try {
      const theme = localStorage.getItem('hub_ui_theme') || 'light';
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      console.error('Failed to sync theme:', e);
    }
  }
  syncTheme();
  window.addEventListener('storage', (e) => {
    if (e.key === 'hub_ui_theme') {
      syncTheme();
    }
  });

  // DOM Elements
  const btnModeExtractor = document.getElementById('btn-mode-extractor');
  const btnModePacker = document.getElementById('btn-mode-packer');
  const btnReset = document.getElementById('btn-reset');

  const viewExtractor = document.getElementById('view-extractor');
  const viewPacker = document.getElementById('view-packer');
  const inspectorExtractor = document.getElementById('inspector-extractor');
  const inspectorPacker = document.getElementById('inspector-packer');

  // Extractor Elements
  const dropzoneExtractor = document.getElementById('dropzone-extractor');
  const fileInputExtractor = document.getElementById('file-input-extractor');
  const treeContainer = document.getElementById('tree-container');
  const infoZipName = document.getElementById('info-zip-name');
  const infoZipSize = document.getElementById('info-zip-size');
  const infoZipStats = document.getElementById('info-zip-stats');
  const btnExtractAll = document.getElementById('btn-extract-all');

  // Packer Elements
  const dropzonePacker = document.getElementById('dropzone-packer');
  const fileInputPacker = document.getElementById('file-input-packer');
  const stagedContainer = document.getElementById('staged-container');
  const inputPackName = document.getElementById('input-pack-name');
  const selectCompression = document.getElementById('select-compression');
  const infoPackSize = document.getElementById('info-pack-size');
  const btnPackGenerate = document.getElementById('btn-pack-generate');
  const packProgress = document.getElementById('pack-progress');
  const progressPercent = document.getElementById('progress-percent');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressState = document.getElementById('progress-state');

  // Modal Elements
  const previewModal = document.getElementById('preview-modal');
  const previewFilename = document.getElementById('preview-filename');
  const previewBody = document.getElementById('preview-body');
  const btnCloseModal = document.getElementById('btn-close-modal');

  // Toast Notification
  const toastNotification = document.getElementById('toast-notification');
  const toastText = document.getElementById('toast-text');

  // Application State
  let loadedZip = null;
  let loadedZipFilename = '';
  let stagedFiles = [];

  // Switch Modes
  btnModeExtractor.addEventListener('click', () => {
    btnModeExtractor.classList.add('active');
    btnModePacker.classList.remove('active');
    viewExtractor.classList.add('active');
    viewPacker.classList.remove('active');
    inspectorExtractor.classList.add('active');
    inspectorPacker.classList.remove('active');
  });

  btnModePacker.addEventListener('click', () => {
    btnModePacker.classList.add('active');
    btnModeExtractor.classList.remove('active');
    viewPacker.classList.add('active');
    viewExtractor.classList.remove('active');
    inspectorPacker.classList.add('active');
    inspectorExtractor.classList.remove('active');
  });

  // Toast Alert trigger
  function showToast(message) {
    toastText.textContent = message;
    toastNotification.classList.add('visible');
    setTimeout(() => {
      toastNotification.classList.remove('visible');
    }, 3000);
  }

  // Helpers for file size formatting
  function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper to trigger file download
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ----------------------------------------------------
  // --- ZIP EXTRACTOR LOGIC ---
  // ----------------------------------------------------

  dropzoneExtractor.addEventListener('click', () => fileInputExtractor.click());
  fileInputExtractor.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleZipFile(e.target.files[0]);
    }
  });

  // Drag and drop events for extractor
  setupDragAndDrop(dropzoneExtractor, handleZipFile);

  function handleZipFile(file) {
    if (!file.name.endsWith('.zip')) {
      showToast('Error: Please select a valid .zip file');
      return;
    }

    loadedZipFilename = file.name;
    infoZipName.value = file.name;
    infoZipSize.value = formatSize(file.size);
    infoZipStats.value = 'Analyzing archive...';

    // Show loading state
    treeContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">Loading ZIP archive...</div>';
    treeContainer.style.display = 'block';
    dropzoneExtractor.style.display = 'none';

    const reader = new FileReader();
    reader.onload = function(e) {
      JSZip.loadAsync(e.target.result)
        .then(function(zip) {
          loadedZip = zip;
          renderZipTree(zip);
          btnExtractAll.disabled = false;
        })
        .catch(function(err) {
          console.error(err);
          showToast('Error loading ZIP file');
          resetExtractor();
        });
    };
    reader.readAsArrayBuffer(file);
  }

  // Walk zip file and build nested tree representation
  function renderZipTree(zip) {
    const root = { name: 'root', type: 'dir', children: {}, path: '' };
    let fileCount = 0;
    let folderCount = 0;

    zip.forEach((relativePath, zipEntry) => {
      const parts = relativePath.split('/');
      // Remove trailing empty elements for directories
      if (parts[parts.length - 1] === '') {
        parts.pop();
      }
      
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        const isLast = (i === parts.length - 1);
        const type = (isLast && !zipEntry.dir) ? 'file' : 'dir';
        
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            type: type,
            children: {},
            path: relativePath,
            entry: isLast ? zipEntry : null
          };
          if (type === 'file') fileCount++;
          else folderCount++;
        }
        current = current.children[part];
      }
    });

    infoZipStats.value = `${fileCount} Files, ${folderCount} Folders`;
    treeContainer.innerHTML = '';
    
    // Render the tree root children
    renderTreeNode(treeContainer, root, 0);
  }

  // Recursive tree renderer
  function renderTreeNode(parentElement, node, depth) {
    const sortedKeys = Object.keys(node.children).sort((a, b) => {
      // Put folders before files
      const aType = node.children[a].type;
      const bType = node.children[b].type;
      if (aType !== bType) {
        return aType === 'dir' ? -1 : 1;
      }
      return a.localeCompare(b);
    });

    sortedKeys.forEach(key => {
      const child = node.children[key];
      const row = document.createElement('div');
      row.className = 'tree-row';
      row.style.paddingLeft = `${12 + (depth * 20)}px`;

      // Icons based on type
      let iconSvg = '';
      if (child.type === 'dir') {
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        `;
      } else {
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        `;
      }

      // Add HTML structure
      row.innerHTML = `
        <span class="tree-icon">${iconSvg}</span>
        <span class="tree-name">${child.name}</span>
        <span class="tree-size">${child.type === 'file' && child.entry ? formatSize(child.entry._data.uncompressedSize || 0) : ''}</span>
        <div class="tree-actions">
          ${child.type === 'file' ? `
            <button class="tree-action-btn btn-view" title="Preview File">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button class="tree-action-btn btn-download" title="Download File">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          ` : ''}
        </div>
      `;

      parentElement.appendChild(row);

      // Expand/Collapse folder or Preview/Download file
      if (child.type === 'dir') {
        const subContainer = document.createElement('div');
        subContainer.className = 'tree-sub-container';
        parentElement.appendChild(subContainer);
        
        let expanded = true;
        
        // Initial render of child nodes
        renderTreeNode(subContainer, child, depth + 1);

        row.addEventListener('click', (e) => {
          // Ignore if clicked on row actions
          if (e.target.closest('.tree-actions')) return;
          
          expanded = !expanded;
          subContainer.style.display = expanded ? 'block' : 'none';
          row.querySelector('.tree-icon').style.opacity = expanded ? '1' : '0.5';
        });
      } else {
        // Wire up file action buttons
        const btnView = row.querySelector('.btn-view');
        const btnDownload = row.querySelector('.btn-download');

        btnView.addEventListener('click', () => previewZipFile(child.entry));
        btnDownload.addEventListener('click', () => downloadZipFile(child.entry));
        row.addEventListener('dblclick', () => previewZipFile(child.entry));
      }
    });
  }

  // Preview file inside ZIP
  function previewZipFile(zipEntry) {
    const ext = zipEntry.name.split('.').pop().toLowerCase();
    previewFilename.textContent = zipEntry.name;
    previewBody.innerHTML = '<div style="text-align: center; color: var(--text-secondary);">Loading preview...</div>';
    previewModal.classList.add('open');

    const textExtensions = ['txt', 'js', 'json', 'css', 'html', 'md', 'xml', 'csv', 'yaml', 'yml', 'svg'];
    const imgExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'];

    if (textExtensions.includes(ext)) {
      zipEntry.async('string').then(content => {
        const textPre = document.createElement('pre');
        textPre.className = 'text-preview';
        textPre.textContent = content;
        previewBody.innerHTML = '';
        previewBody.appendChild(textPre);
      }).catch(err => {
        previewBody.innerHTML = `<div style="color: var(--danger-color);">Error rendering preview: ${err.message}</div>`;
      });
    } else if (imgExtensions.includes(ext)) {
      // SVG can be treated as inline or as base64. Let's load as base64 for unified handling
      const format = ext === 'svg' ? 'svg+xml' : ext;
      zipEntry.async('base64').then(base64 => {
        const wrapper = document.createElement('div');
        wrapper.className = 'img-preview';
        const img = document.createElement('img');
        img.src = `data:image/${format};base64,${base64}`;
        wrapper.appendChild(img);
        previewBody.innerHTML = '';
        previewBody.appendChild(wrapper);
      }).catch(err => {
        previewBody.innerHTML = `<div style="color: var(--danger-color);">Error loading image: ${err.message}</div>`;
      });
    } else {
      previewBody.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="margin-bottom: 16px;">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p style="font-size: 13px; font-weight: 500; margin-bottom: 8px;">Binary File Preview Unavailable</p>
          <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 20px;">This file type cannot be previewed in the browser.</p>
          <button class="action-btn" id="btn-modal-download" style="max-width: 200px; margin: 0 auto;">Download File</button>
        </div>
      `;
      document.getElementById('btn-modal-download').addEventListener('click', () => {
        downloadZipFile(zipEntry);
      });
    }
  }

  // Download individual file from ZIP
  function downloadZipFile(zipEntry) {
    showToast(`Extracting ${zipEntry.name.split('/').pop()}...`);
    zipEntry.async('blob').then(blob => {
      downloadBlob(blob, zipEntry.name.split('/').pop());
    }).catch(err => {
      console.error(err);
      showToast('Error extracting file');
    });
  }

  // Extract all files sequentially
  btnExtractAll.addEventListener('click', async () => {
    if (!loadedZip) return;
    
    const files = [];
    loadedZip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        files.push(zipEntry);
      }
    });

    if (files.length === 0) {
      showToast('Archive is empty');
      return;
    }

    showToast(`Extracting all ${files.length} files...`);
    
    // Sequential download with a minor delay so browser doesn't flag it as pop-up spam
    for (let i = 0; i < files.length; i++) {
      const fileEntry = files[i];
      try {
        const blob = await fileEntry.async('blob');
        downloadBlob(blob, fileEntry.name.split('/').pop());
        // Minor delay
        await new Promise(resolve => setTimeout(resolve, 250));
      } catch (err) {
        console.error('Error downloading:', fileEntry.name, err);
      }
    }
    showToast('All files successfully extracted');
  });

  // Modal close trigger
  btnCloseModal.addEventListener('click', () => {
    previewModal.classList.remove('open');
  });
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
      previewModal.classList.remove('open');
    }
  });

  function resetExtractor() {
    loadedZip = null;
    loadedZipFilename = '';
    infoZipName.value = 'No file loaded';
    infoZipSize.value = '-';
    infoZipStats.value = '-';
    btnExtractAll.disabled = true;
    treeContainer.style.display = 'none';
    dropzoneExtractor.style.display = 'flex';
    fileInputExtractor.value = '';
  }


  // ----------------------------------------------------
  // --- ZIP PACKER LOGIC ---
  // ----------------------------------------------------

  dropzonePacker.addEventListener('click', () => fileInputPacker.click());
  fileInputPacker.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      stageFiles(e.target.files);
    }
  });

  setupDragAndDrop(dropzonePacker, stageFiles);

  function stageFiles(filesList) {
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      // Avoid staging duplicate files based on name + path
      const path = file.webkitRelativePath || file.name;
      const isDuplicate = stagedFiles.some(f => (f.path === path && f.file.size === file.size));
      
      if (!isDuplicate) {
        stagedFiles.push({
          file: file,
          name: file.name,
          path: path
        });
      }
    }
    
    renderStagedList();
  }

  function renderStagedList() {
    if (stagedFiles.length === 0) {
      stagedContainer.style.display = 'none';
      dropzonePacker.style.display = 'flex';
      infoPackSize.value = '0 Bytes';
      btnPackGenerate.disabled = true;
      return;
    }

    dropzonePacker.style.display = 'none';
    stagedContainer.style.display = 'flex';
    stagedContainer.innerHTML = '';

    let totalSize = 0;

    stagedFiles.forEach((staged, index) => {
      totalSize += staged.file.size;
      
      const itemCard = document.createElement('div');
      itemCard.className = 'staged-item';
      itemCard.innerHTML = `
        <div class="staged-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="staged-info">
          <div class="staged-name" title="${staged.path}">${staged.path}</div>
          <div class="staged-size">${formatSize(staged.file.size)}</div>
        </div>
        <button class="tree-action-btn btn-remove" data-index="${index}" title="Remove file" style="color: var(--danger-color);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      `;

      stagedContainer.appendChild(itemCard);
      
      itemCard.querySelector('.btn-remove').addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        stagedFiles.splice(idx, 1);
        renderStagedList();
      });
    });

    infoPackSize.value = formatSize(totalSize);
    btnPackGenerate.disabled = false;
  }

  // Create ZIP and download
  btnPackGenerate.addEventListener('click', () => {
    if (stagedFiles.length === 0) return;

    let filename = inputPackName.value.trim();
    if (!filename) filename = 'archive.zip';
    if (!filename.endsWith('.zip')) filename += '.zip';

    const compression = selectCompression.value;

    // Show progress container
    packProgress.style.display = 'flex';
    btnPackGenerate.disabled = true;
    progressState.textContent = 'Generating zip...';
    progressPercent.textContent = '0%';
    progressBarFill.style.width = '0%';

    const zip = new JSZip();
    stagedFiles.forEach(staged => {
      // JSZip automatically creates intermediate directories when a relative path is passed
      zip.file(staged.path, staged.file);
    });

    zip.generateAsync({
      type: 'blob',
      compression: compression
    }, (metadata) => {
      const pct = Math.round(metadata.percent);
      progressPercent.textContent = `${pct}%`;
      progressBarFill.style.width = `${pct}%`;
    }).then(blob => {
      progressState.textContent = 'Done!';
      showToast('Archive successfully created!');
      downloadBlob(blob, filename);

      setTimeout(() => {
        packProgress.style.display = 'none';
        btnPackGenerate.disabled = false;
      }, 1500);
    }).catch(err => {
      console.error(err);
      showToast('Error packing ZIP');
      packProgress.style.display = 'none';
      btnPackGenerate.disabled = false;
    });
  });

  function resetPacker() {
    stagedFiles = [];
    inputPackName.value = 'archive.zip';
    selectCompression.value = 'DEFLATE';
    renderStagedList();
    fileInputPacker.value = '';
    packProgress.style.display = 'none';
  }


  // Drag & drop helper setup
  function setupDragAndDrop(element, handler) {
    ['dragenter', 'dragover'].forEach(eventName => {
      element.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        element.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      element.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove('dragover');
      }, false);
    });

    element.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        handler(files);
      }
    }, false);
  }

  // Reset workspace
  btnReset.addEventListener('click', () => {
    resetExtractor();
    resetPacker();
    showToast('Workspace cleared');
  });

});
