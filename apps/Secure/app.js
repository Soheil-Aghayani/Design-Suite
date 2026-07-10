document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let state = {
    captcha_seed: "SecureKey1",
    captcha_len: 6,
    captcha_noise_pts: 800,
    captcha_noise_lines: 6,
    captcha_blur: 1,
    cipher_seed: "EnigmaKey",
    cipher_mode: "encrypt",
    cipher_message: ""
  };

  let activeTab = "captcha"; // "captcha" or "cipher"
  let captchaTextGenerated = "";

  // --- DOM ELEMENTS ---
  const tabBtnCaptcha = document.getElementById('tab-btn-captcha');
  const tabBtnCipher = document.getElementById('tab-btn-cipher');
  const tabCaptcha = document.getElementById('tab-captcha');
  const tabCipher = document.getElementById('tab-cipher');
  
  const captchaWorkspace = document.getElementById('captcha-workspace');
  const cipherWorkspace = document.getElementById('cipher-workspace');
  const canvas = document.getElementById('captcha-canvas');
  const ctx = canvas.getContext('2d');
  
  const inputCaptchaSeed = document.getElementById('captcha-seed');
  const inputCaptchaLen = document.getElementById('captcha-len');
  const inputCaptchaNoisePts = document.getElementById('captcha-noise-pts');
  const inputCaptchaNoiseLines = document.getElementById('captcha-noise-lines');
  const inputCaptchaBlur = document.getElementById('captcha-blur');
  const btnGenCaptcha = document.getElementById('btn-gen-captcha');

  const verifyInput = document.getElementById('verify-input');
  const btnVerify = document.getElementById('btn-verify');
  const verifyResult = document.getElementById('verify-result');

  const inputCipherSeed = document.getElementById('cipher-seed');
  const inputCipherMode = document.getElementById('cipher-mode');
  const labelCipherMessage = document.getElementById('label-cipher-message');
  const inputCipherMessage = document.getElementById('cipher-message');
  const btnProcessCipher = document.getElementById('btn-process-cipher');
  const cipherResultText = document.getElementById('cipher-result');
  const btnCopyResult = document.getElementById('btn-copy-result');

  const hudModeVal = document.getElementById('hud-mode-val');
  const hudStatusVal = document.getElementById('hud-status-val');
  const btnReset = document.getElementById('btn-reset');
  const btnQuickExport = document.getElementById('btn-quick-export');
  const appToast = document.getElementById('app-toast');

  // --- CRYPTO HELPERS ---
  async function sha256Digest(strOrBuffer) {
    let buffer;
    if (typeof strOrBuffer === 'string') {
      buffer = new TextEncoder().encode(strOrBuffer);
    } else {
      buffer = strOrBuffer;
    }
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hashBuffer);
  }

  async function sha256Hex(str) {
    const digest = await sha256Digest(str);
    return Array.from(digest).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function generateKey(seed, length) {
    let key = await sha256Digest(seed);
    while (key.length < length) {
      const nextHash = await sha256Digest(key);
      const temp = new Uint8Array(key.length + nextHash.length);
      temp.set(key);
      temp.set(nextHash, key.length);
      key = temp;
    }
    return key.slice(0, length);
  }

  async function encryptXOR(message, seed) {
    const data = new TextEncoder().encode(message);
    const key = await generateKey(seed, data.length);
    const encrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ key[i];
    }
    let binary = '';
    const len = encrypted.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(encrypted[i]);
    }
    return window.btoa(binary);
  }

  async function decryptXOR(ciphertext, seed) {
    try {
      const binary = window.atob(ciphertext.trim());
      const data = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        data[i] = binary.charCodeAt(i);
      }
      const key = await generateKey(seed, data.length);
      const decrypted = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        decrypted[i] = data[i] ^ key[i];
      }
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      throw new Error("Invalid base64 ciphertext or decryption key mismatch.");
    }
  }

  // --- CAPTCHA DRAWING ---
  async function generateCaptcha() {
    const seed = state.captcha_seed;
    const len = state.captcha_len;
    
    // Hash seed to get text
    const hex = await sha256Hex(seed);
    captchaTextGenerated = hex.substring(0, len);
    
    // Set canvas dimensions
    const width = 40 * len + 40;
    canvas.width = width;
    canvas.height = 90;
    
    // Clear and draw background (pure white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, 90);
    
    // Draw noise points
    for (let k = 0; k < state.captcha_noise_pts; k++) {
      const rx = Math.floor(Math.random() * width);
      const ry = Math.floor(Math.random() * 90);
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }
    
    // Draw noise lines
    for (let k = 0; k < state.captcha_noise_lines; k++) {
      const x1 = Math.floor(Math.random() * width);
      const y1 = Math.floor(Math.random() * 90);
      const x2 = Math.floor(Math.random() * width);
      const y2 = Math.floor(Math.random() * 90);
      
      const r = Math.floor(Math.random() * 200);
      const g = Math.floor(Math.random() * 200);
      const b = Math.floor(Math.random() * 200);
      
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // Draw text letters
    ctx.font = 'bold 42px "Arial", sans-serif';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < captchaTextGenerated.length; i++) {
      const char = captchaTextGenerated[i];
      const cx = 20 + i * 35 + (Math.random() * 10 - 5);
      const cy = 25 + Math.random() * 35; // y random offset
      
      const r = Math.floor(Math.random() * 120);
      const g = Math.floor(Math.random() * 120);
      const b = Math.floor(Math.random() * 120);
      
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      
      // Save transform and rotate letter
      ctx.save();
      ctx.translate(cx, cy);
      const angle = (Math.random() * 20 - 10) * Math.PI / 180;
      ctx.rotate(angle);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
    
    // Apply blur filter on canvas element via style if requested
    if (state.captcha_blur > 0) {
      canvas.style.filter = `blur(${state.captcha_blur}px)`;
    } else {
      canvas.style.filter = 'none';
    }
    
    // Reset verification state
    verifyInput.value = "";
    verifyResult.textContent = "";
    verifyResult.className = "verify-result";
    hudStatusVal.textContent = "Verified: No";
  }

  // --- CIPHER EXECUTION ---
  async function executeCipher() {
    const seed = state.cipher_seed;
    const msg = state.cipher_message;
    const mode = state.cipher_mode;
    
    if (!msg) {
      showToast("Input message cannot be empty!");
      return;
    }
    
    if (mode === "encrypt") {
      const encrypted = await encryptXOR(msg, seed);
      cipherResultText.value = encrypted;
      showToast("XOR encryption complete!");
    } else {
      try {
        const decrypted = await decryptXOR(msg, seed);
        cipherResultText.value = decrypted;
        showToast("XOR decryption complete!");
      } catch (err) {
        cipherResultText.value = "DECRYPTION ERROR: " + err.message;
        showToast("Decryption failed!");
      }
    }
  }

  // --- SWITCH TABS ---
  function switchTab(tabKey) {
    activeTab = tabKey;
    if (tabKey === 'captcha') {
      tabBtnCaptcha.classList.add('active');
      tabBtnCipher.classList.remove('active');
      tabCaptcha.classList.add('active');
      tabCipher.classList.remove('active');
      
      captchaWorkspace.style.display = 'flex';
      cipherWorkspace.style.display = 'none';
      hudModeVal.textContent = "Tool: CAPTCHA";
      generateCaptcha();
    } else {
      tabBtnCaptcha.classList.remove('active');
      tabBtnCipher.classList.add('active');
      tabCaptcha.classList.remove('active');
      tabCipher.classList.add('active');
      
      captchaWorkspace.style.display = 'none';
      cipherWorkspace.style.display = 'flex';
      hudModeVal.textContent = "Tool: XOR Cipher";
      
      // Update labels based on encrypt/decrypt selection
      updateCipherLabels();
    }
  }

  function updateCipherLabels() {
    const mode = inputCipherMode.value;
    if (mode === "encrypt") {
      labelCipherMessage.textContent = "Plaintext Message";
      inputCipherMessage.placeholder = "Type your text to encrypt here...";
      btnProcessCipher.textContent = "Execute XOR Encryption";
    } else {
      labelCipherMessage.textContent = "Base64 Ciphertext";
      inputCipherMessage.placeholder = "Paste your Base64 ciphertext to decrypt here...";
      btnProcessCipher.textContent = "Execute XOR Decryption";
    }
  }

  // --- EVENT LISTENERS ---
  tabBtnCaptcha.addEventListener('click', () => switchTab('captcha'));
  tabBtnCipher.addEventListener('click', () => switchTab('cipher'));
  
  // Captcha Input Listeners
  inputCaptchaSeed.addEventListener('input', () => {
    state.captcha_seed = inputCaptchaSeed.value;
  });
  inputCaptchaLen.addEventListener('change', () => {
    state.captcha_len = parseInt(inputCaptchaLen.value, 10) || 6;
  });
  inputCaptchaNoisePts.addEventListener('change', () => {
    state.captcha_noise_pts = parseInt(inputCaptchaNoisePts.value, 10) || 0;
  });
  inputCaptchaNoiseLines.addEventListener('change', () => {
    state.captcha_noise_lines = parseInt(inputCaptchaNoiseLines.value, 10) || 0;
  });
  inputCaptchaBlur.addEventListener('change', () => {
    state.captcha_blur = parseInt(inputCaptchaBlur.value, 10) || 0;
  });
  btnGenCaptcha.addEventListener('click', generateCaptcha);

  // Verification
  btnVerify.addEventListener('click', () => {
    const val = verifyInput.value.trim().toLowerCase();
    const correct = captchaTextGenerated.toLowerCase();
    if (val === correct) {
      verifyResult.textContent = "Success! Verification Passed.";
      verifyResult.className = "verify-result success";
      hudStatusVal.textContent = "Verified: Yes";
    } else {
      verifyResult.textContent = "Incorrect code! Please try again.";
      verifyResult.className = "verify-result error";
      hudStatusVal.textContent = "Verified: No";
    }
  });

  // Cipher Inputs
  inputCipherSeed.addEventListener('input', () => {
    state.cipher_seed = inputCipherSeed.value;
  });
  inputCipherMode.addEventListener('change', () => {
    state.cipher_mode = inputCipherMode.value;
    updateCipherLabels();
  });
  inputCipherMessage.addEventListener('input', () => {
    state.cipher_message = inputCipherMessage.value;
  });
  btnProcessCipher.addEventListener('click', executeCipher);

  btnCopyResult.addEventListener('click', () => {
    const val = cipherResultText.value;
    if (!val) return;
    navigator.clipboard.writeText(val).then(() => {
      showToast("Copied to clipboard!");
    });
  });

  // Toolbar
  btnReset.addEventListener('click', () => {
    state = {
      captcha_seed: "SecureKey1",
      captcha_len: 6,
      captcha_noise_pts: 800,
      captcha_noise_lines: 6,
      captcha_blur: 1,
      cipher_seed: "EnigmaKey",
      cipher_mode: "encrypt",
      cipher_message: ""
    };
    inputCaptchaSeed.value = state.captcha_seed;
    inputCaptchaLen.value = state.captcha_len;
    inputCaptchaNoisePts.value = state.captcha_noise_pts;
    inputCaptchaNoiseLines.value = state.captcha_noise_lines;
    inputCaptchaBlur.value = state.captcha_blur;
    
    inputCipherSeed.value = state.cipher_seed;
    inputCipherMode.value = state.cipher_mode;
    inputCipherMessage.value = "";
    cipherResultText.value = "";
    
    updateCipherLabels();
    if (activeTab === 'captcha') {
      generateCaptcha();
    }
    showToast("Reset to defaults");
  });

  btnQuickExport.addEventListener('click', () => {
    if (activeTab === 'captcha') {
      // Export captcha canvas
      const url = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `captcha_${state.captcha_seed}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showToast("CAPTCHA image exported!");
    } else {
      // Export Cipher result as text file
      const val = cipherResultText.value;
      if (!val) {
        showToast("No cipher text to export!");
        return;
      }
      const blob = new Blob([val], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `xor_result.txt`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      showToast("Text file exported!");
    }
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

  // Handle Theme switching from Mother HTML
  window.addEventListener('themeChanged', (e) => {
    document.documentElement.setAttribute('data-theme', e.detail);
  });

  // Sync initial theme
  const parentTheme = localStorage.getItem('hub_ui_theme') || 'light';
  document.documentElement.setAttribute('data-theme', parentTheme);

  // Initial Run
  generateCaptcha();
});
