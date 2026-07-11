document.addEventListener('DOMContentLoaded', () => {
  // LocalStorage helper functions
  const getLocalFloat = (key, fallback) => {
    const val = localStorage.getItem(key);
    return (val !== null && !isNaN(parseFloat(val))) ? parseFloat(val) : fallback;
  };
  const getLocalInt = (key, fallback) => {
    const val = localStorage.getItem(key);
    return (val !== null && !isNaN(parseInt(val, 10))) ? parseInt(val, 10) : fallback;
  };
  const getLocalString = (key, fallback) => {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  };

  // --- STATE ---
  let state = {
    gamePrice: getLocalFloat('state_game_price', 1200.00), // in Steam currency (e.g. UAH)
    walletBalance: getLocalFloat('state_wallet_balance', 0.00), // in Steam currency
    currencyCode: getLocalString('state_currency_code', 'UAH'),
    currencySymbol: getLocalString('state_currency_symbol', '₴'),
    currencyDecimals: getLocalInt('state_currency_decimals', 2),
    
    keyBuyPrice: getLocalInt('state_key_buy_price', 110000), // in Toman
    keySellPrice: getLocalFloat('state_key_sell_price', 105.00), // Listing price (what buyer pays) in Steam currency
    isBuyerPays: getLocalString('state_is_buyer_pays', 'true') === 'true',

    // Steam Profile Setup (Saved locally in browser)
    steamApiKey: localStorage.getItem('steam_api_key') || '',
    steamId: localStorage.getItem('steam_id') || '',
    ownedApps: new Set(JSON.parse(localStorage.getItem('steam_owned_apps') || '[]'))
  };

  // Conversion rates relative to USD (1 USD = X target currency)
  // Used to estimate the "direct wallet card cost" in Tomans to calculate savings
  const currencyToUSD = {
    'USD': 1.0,
    'EUR': 0.92,
    'GBP': 0.80,
    'UAH': 40.0,
    'TRY': 33.0,
    'RUB': 90.0,
    'Toman': 60000.0
  };

  // Default parameters when changing Steam currency
  const steamCurrencyDefaults = {
    'USD': { symbol: '$', decimals: 2, defaultSell: 2.50, defaultGame: 35.00 },
    'EUR': { symbol: '€', decimals: 2, defaultSell: 2.30, defaultGame: 35.00 },
    'GBP': { symbol: '£', decimals: 2, defaultSell: 1.95, defaultGame: 30.00 },
    'UAH': { symbol: '₴', decimals: 2, defaultSell: 105.00, defaultGame: 1200.00 },
    'TRY': { symbol: '₺', decimals: 2, defaultSell: 82.00, defaultGame: 1000.00 },
    'RUB': { symbol: '₽', decimals: 2, defaultSell: 220.00, defaultGame: 2500.00 }
  };

  // DOM Elements
  const inputGamePrice = document.getElementById('input-game-price');
  const inputWalletBalance = document.getElementById('input-wallet-balance');
  const selectSteamCurrency = document.getElementById('select-steam-currency');
  const inputKeyBuyPrice = document.getElementById('input-key-buy-price');
  const inputKeySellPrice = document.getElementById('input-key-sell-price');
  const rateFeedback = document.getElementById('rate-calculation-feedback');

  // Results elements
  const resKeysCount = document.getElementById('res-keys-count');
  const resCashCost = document.getElementById('res-cash-cost');
  const resSavingsVal = document.getElementById('res-savings-val');
  const resSavingsPct = document.getElementById('res-savings-pct');
  const resLeftoverBox = document.getElementById('res-leftover-box');
  const resLeftoverWallet = document.getElementById('res-leftover-wallet');

  // Timeline elements
  const flowStep1 = document.getElementById('flow-step-1');
  const flowStep2 = document.getElementById('flow-step-2');
  const flowStep3 = document.getElementById('flow-step-3');

  // SteamDB lookup elements
  const inputDbSearch = document.getElementById('input-db-search');
  const btnDbSearch = document.getElementById('btn-db-search');
  const dbSearchResultsList = document.getElementById('db-search-results-list');
  const appToast = document.getElementById('app-toast');

  // Steam Profile Integration Elements
  const profileToggle = document.getElementById('profile-toggle');
  const profileContent = document.getElementById('profile-content');
  const profilePanel = document.querySelector('.steam-profile-panel');
  const inputSteamKey = document.getElementById('input-steam-key');
  const inputSteamId = document.getElementById('input-steam-id');
  const btnSyncProfile = document.getElementById('btn-sync-profile');
  const btnFetchWishlist = document.getElementById('btn-fetch-wishlist');
  const wishlistContainer = document.getElementById('wishlist-container');
  const wishlistList = document.getElementById('wishlist-list');
  const profileStatusText = document.getElementById('profile-status-text');

  // --- ARBITRAGE FORMULAS (STEAM ROUNDING) ---
  
  // Calculate buyer pays from seller receives
  function calculateBuyerPays(sellerReceives, decimals) {
    if (sellerReceives <= 0) return 0;
    
    if (decimals === 0) {
      const steamFee = Math.max(1, Math.round(sellerReceives * 0.05));
      const tf2Fee = Math.max(1, Math.round(sellerReceives * 0.10));
      return sellerReceives + steamFee + tf2Fee;
    } else {
      const sellerCents = Math.round(sellerReceives * 100);
      const steamFee = Math.max(1, Math.round(sellerCents * 0.05));
      const tf2Fee = Math.max(1, Math.round(sellerCents * 0.10));
      return (sellerCents + steamFee + tf2Fee) / 100;
    }
  }

  // Calculate seller receives from buyer pays
  function calculateSellerReceives(buyerPays, decimals) {
    if (decimals === 0) {
      if (buyerPays <= 2) return { sellerReceives: 0, buyerPaysExact: 0 };
      let est = Math.floor(buyerPays / 1.15);
      let bestS = 0;
      let bestP = 0;
      for (let s = Math.max(0, est - 5); s <= est + 5; s++) {
        let p = calculateBuyerPays(s, 0);
        if (p <= buyerPays) {
          if (s > bestS) {
            bestS = s;
            bestP = p;
          }
        }
      }
      return { sellerReceives: bestS, buyerPaysExact: bestP };
    } else {
      const buyerCents = Math.round(buyerPays * 100);
      if (buyerCents <= 2) return { sellerReceives: 0, buyerPaysExact: 0 };
      
      let estCent = Math.floor(buyerCents / 1.15);
      let bestS = 0;
      let bestP = 0;
      for (let s = Math.max(0, estCent - 10); s <= estCent + 10; s++) {
        let p = calculateBuyerPays(s / 100, 2);
        let pCents = Math.round(p * 100);
        if (pCents <= buyerCents) {
          if (s > bestS) {
            bestS = s;
            bestP = pCents;
          }
        }
      }
      return { sellerReceives: bestS / 100, buyerPaysExact: bestP / 100 };
    }
  }

  // Format Helper: Steam Currency
  function formatSteamValue(val) {
    const symbol = state.currencySymbol;
    const decimals = state.currencyDecimals;
    return symbol + " " + val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Format Helper: Toman
  function formatTomanValue(val) {
    return Math.round(val).toLocaleString() + " Toman";
  }

  // --- CORE RECALCULATIONS ---
  
  function updateCalculations() {
    // Save state to localStorage for persistence ("memory")
    localStorage.setItem('state_game_price', state.gamePrice);
    localStorage.setItem('state_wallet_balance', state.walletBalance);
    localStorage.setItem('state_currency_code', state.currencyCode);
    localStorage.setItem('state_currency_symbol', state.currencySymbol);
    localStorage.setItem('state_currency_decimals', state.currencyDecimals);
    localStorage.setItem('state_key_buy_price', state.keyBuyPrice);
    localStorage.setItem('state_key_sell_price', state.keySellPrice);
    localStorage.setItem('state_is_buyer_pays', state.isBuyerPays);

    let buyPrice = state.keyBuyPrice;
    let sellPrice = state.keySellPrice;
    let walletValuePerKey = 0;
    let listingPrice = 0;

    if (state.isBuyerPays) {
      listingPrice = sellPrice;
      const calcResult = calculateSellerReceives(listingPrice, state.currencyDecimals);
      walletValuePerKey = calcResult.sellerReceives;
    } else {
      walletValuePerKey = sellPrice;
      listingPrice = calculateBuyerPays(walletValuePerKey, state.currencyDecimals);
    }

    // Update variables UI tips
    let totalFee = Math.max(0, listingPrice - walletValuePerKey);
    rateFeedback.textContent = `Listing at ${formatSteamValue(listingPrice)} ➔ You receive ${formatSteamValue(walletValuePerKey)} (${formatSteamValue(totalFee)} Steam fee).`;

    // Deficit calculation
    let remainingPrice = Math.max(0, state.gamePrice - state.walletBalance);

    // Keys Needed
    let keysNeeded = 0;
    if (remainingPrice > 0 && walletValuePerKey > 0) {
      keysNeeded = Math.ceil(remainingPrice / walletValuePerKey);
    }

    // Financial totals
    let totalCashSpent = keysNeeded * buyPrice; // In Toman
    let totalWalletObtained = keysNeeded * walletValuePerKey; // In Steam currency
    let leftoverWallet = Math.max(0, totalWalletObtained + state.walletBalance - state.gamePrice); // In Steam currency

    // Calculate savings relative to a direct wallet top-up cost in Tomans
    // Estimate exchange rate: 1 Steam unit = X Tomans
    const steamToUSD = currencyToUSD[state.currencyCode] || 1.0;
    const usdToToman = currencyToUSD['Toman'] || 60000.0;
    const steamToTomanRate = usdToToman / steamToUSD; // How many Tomans per 1 Steam currency

    const directCostInToman = remainingPrice * steamToTomanRate;
    
    // Leftover wallet value in Toman
    // Conversion rate of key: how many tomans per 1 wallet received?
    const keyTomanPerWallet = walletValuePerKey > 0 ? (buyPrice / walletValuePerKey) : 0;
    const leftoverRealValueInToman = leftoverWallet * keyTomanPerWallet;

    let netSavingsInToman = directCostInToman - totalCashSpent + leftoverRealValueInToman;
    let savingsPercent = directCostInToman > 0 
      ? (netSavingsInToman / directCostInToman) * 100 
      : 0;

    if (savingsPercent < -100) savingsPercent = -100;
    if (savingsPercent > 100) savingsPercent = 100;

    // --- UPDATE DOM ELEMENTS ---
    resKeysCount.textContent = `${keysNeeded.toLocaleString()} Keys`;
    resCashCost.textContent = formatTomanValue(totalCashSpent);
    
    resSavingsVal.textContent = formatTomanValue(Math.max(0, netSavingsInToman));
    resSavingsPct.textContent = savingsPercent >= 0 
      ? `${savingsPercent.toFixed(1)}% saved`
      : `${Math.abs(savingsPercent).toFixed(1)}% extra cost`;

    const savingsCard = document.getElementById('res-savings-val').closest('.detail-card');
    if (savingsPercent > 0) {
      savingsCard.className = "detail-card success";
    } else if (savingsPercent < 0) {
      savingsCard.className = "detail-card danger";
    } else {
      savingsCard.className = "detail-card";
    }

    resLeftoverWallet.textContent = formatSteamValue(leftoverWallet);
    if (leftoverWallet > 0) {
      resLeftoverBox.style.display = "block";
    } else {
      resLeftoverBox.style.display = "none";
    }

    // Timeline Steps
    if (keysNeeded === 0) {
      flowStep1.innerHTML = `No keys needed. Your existing wallet balance fully covers the game.`;
      flowStep2.innerHTML = `No market listings required.`;
      flowStep3.innerHTML = `Buy the game for <strong>${formatSteamValue(state.gamePrice)}</strong> using your <strong>${formatSteamValue(state.walletBalance)}</strong> wallet balance. You will have <strong>${formatSteamValue(leftoverWallet)}</strong> remaining wallet credit.`;
    } else {
      flowStep1.innerHTML = `Buy <strong>${keysNeeded} TF2 keys</strong> outside Steam for <strong>${formatTomanValue(buyPrice)}</strong> each, spending <strong>${formatTomanValue(totalCashSpent)}</strong> in total.`;
      flowStep2.innerHTML = `Sell them on the Steam Market at <strong>${formatSteamValue(listingPrice)}</strong> each. Steam takes a 15% fee, crediting <strong>${formatSteamValue(walletValuePerKey)}</strong> per key, adding up to <strong>${formatSteamValue(totalWalletObtained)}</strong> in Steam Wallet.`;
      
      if (state.walletBalance > 0) {
        flowStep3.innerHTML = `Buy the game for <strong>${formatSteamValue(state.gamePrice)}</strong>. Using your existing <strong>${formatSteamValue(state.walletBalance)}</strong> wallet balance and <strong>${formatSteamValue(totalWalletObtained)}</strong> obtained from keys, you will have <strong>${formatSteamValue(leftoverWallet)}</strong> remaining wallet credit.`;
      } else {
        flowStep3.innerHTML = `Buy the game for <strong>${formatSteamValue(state.gamePrice)}</strong>. You will have <strong>${formatSteamValue(leftoverWallet)}</strong> remaining wallet credit.`;
      }
    }
  }

  // --- INPUT EVENTS ---
  
  function formatInputWithCommas(inputElement, stateKey, isDecimal = true) {
    let cursorSelectionStart = inputElement.selectionStart;
    let originalLen = inputElement.value.length;

    let val = inputElement.value;
    
    // Remove all characters except digits and decimal point
    let parts = val.replace(/,/g, '').split('.');
    let integerPart = parts[0].replace(/\D/g, '');
    let decimalPart = parts[1] !== undefined ? parts[1].replace(/\D/g, '').substring(0, 2) : null;
    
    if (integerPart === '' && (decimalPart === null || decimalPart === '')) {
      inputElement.value = '';
      state[stateKey] = 0;
      updateCalculations();
      return;
    }

    let num = parseInt(integerPart || '0', 10);
    let formatted = num.toLocaleString();
    
    if (isDecimal && (decimalPart !== null || val.includes('.'))) {
      formatted += '.' + (decimalPart || '');
    }

    inputElement.value = formatted;

    let newLen = formatted.length;
    let diff = newLen - originalLen;
    inputElement.setSelectionRange(cursorSelectionStart + diff, cursorSelectionStart + diff);

    // Update state with parsed float
    const cleanFloat = parseFloat(formatted.replace(/,/g, '')) || 0;
    state[stateKey] = cleanFloat;
    updateCalculations();
  }

  function registerInputEvents() {
    inputGamePrice.addEventListener('input', () => {
      formatInputWithCommas(inputGamePrice, 'gamePrice', true);
    });

    inputWalletBalance.addEventListener('input', () => {
      formatInputWithCommas(inputWalletBalance, 'walletBalance', true);
    });

    inputKeyBuyPrice.addEventListener('input', () => {
      formatInputWithCommas(inputKeyBuyPrice, 'keyBuyPrice', false);
    });

    inputKeySellPrice.addEventListener('input', () => {
      formatInputWithCommas(inputKeySellPrice, 'keySellPrice', true);
    });

    selectSteamCurrency.addEventListener('change', () => {
      const val = selectSteamCurrency.value;
      const parts = val.split('|');
      state.currencyCode = parts[0];
      state.currencySymbol = parts[1];
      state.currencyDecimals = parseInt(parts[2]);
      
      const defaults = steamCurrencyDefaults[state.currencyCode];
      if (defaults) {
        state.gamePrice = defaults.defaultGame;
        state.keySellPrice = defaults.defaultSell;
        state.walletBalance = 0.00;
        
        inputGamePrice.value = state.gamePrice.toLocaleString(undefined, { minimumFractionDigits: state.currencyDecimals });
        inputWalletBalance.value = state.walletBalance.toLocaleString(undefined, { minimumFractionDigits: state.currencyDecimals });
        inputKeySellPrice.value = state.keySellPrice.toLocaleString(undefined, { minimumFractionDigits: state.currencyDecimals });
      }
      
      updateCalculations();
      
      // Auto fetch live key price on currency change
      fetchLiveTF2KeyPrice();
      // Load preloaded famous games for the new currency
      loadFamousGamesSuggestions();
    });
  }

  // --- STEAMDB & APP ID SEARCH HELPER (CheapShark CORS-free API) ---
  
  // Country codes mapping for Steam storefront search
  const currencyToCountry = {
    'USD': 'us',
    'EUR': 'de',
    'GBP': 'gb',
    'UAH': 'ua',
    'TRY': 'tr',
    'RUB': 'ru'
  };

  async function fetchWithTimeout(url, options = {}, timeout = 2500) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  }

  async function resolveSteamWishlistUrl(steamid) {
    const apiKey = localStorage.getItem('steam_api_key') || '';
    if (apiKey && steamid.match(/^\d{17}$/)) {
      try {
        const summariesUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamid}`;
        const data = await fetchWithProxyFallback(summariesUrl);
        if (data && data.response && data.response.players && data.response.players.length > 0) {
          const player = data.response.players[0];
          const profileUrl = player.profileurl || '';
          const match = profileUrl.match(/\/id\/([^\/]+)/);
          if (match && match[1]) {
            return `https://store.steampowered.com/wishlist/id/${match[1]}/wishlistdata/`;
          }
        }
      } catch (e) {
        console.warn("Failed to resolve vanity URL via player summaries, falling back to profiles url.", e);
      }
    }
    
    // Default fallback
    if (steamid.match(/^\d{17}$/)) {
      return `https://store.steampowered.com/wishlist/profiles/${steamid}/wishlistdata/`;
    } else {
      return `https://store.steampowered.com/wishlist/id/${steamid}/wishlistdata/`;
    }
  }

  async function fetchWithProxyFallback(url) {
    const proxies = [
      // 1. Direct fetch (fastest, uses user's cookies/session, works if browser CORS is bypassed/disabled)
      url,
      // 2. corsproxy.io (client-side proxy)
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      // 3. codetabs (secondary proxy)
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      // 4. thingproxy (alternative proxy)
      `https://thingproxy.freeboard.io/fetch/${url}`,
      // 5. allorigins (reliable wrapped JSONP fallback)
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    ];

    let lastError = null;
    for (const proxyUrl of proxies) {
      try {
        const response = await fetchWithTimeout(proxyUrl, {}, 2500);
        if (response.ok) {
          const data = await response.json();
          // If allorigins wrapped response
          if (data && typeof data.contents === 'string') {
            return JSON.parse(data.contents);
          }
          return data;
        }
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError || new Error("All proxies failed");
  }

  async function fetchSteamLocalDetails(appId, currencyCode) {
    const cc = currencyToCountry[currencyCode] || 'us';
    const steamUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${cc}`;
    
    const content = await fetchWithProxyFallback(steamUrl);
    
    if (content && content[appId] && content[appId].success) {
      return content[appId].data;
    }
    throw new Error("Could not fetch Steam details");
  }

  const currencyToSteamMarketId = {
    'USD': 1,
    'GBP': 2,
    'EUR': 3,
    'RUB': 5,
    'TRY': 17,
    'UAH': 18
  };

  const famousGames = [
    { name: "GTA V", appId: "3240220" },
    { name: "EA SPORTS FC 26", appId: "3405690" },
    { name: "Elden Ring", appId: "1245620" },
    { name: "Cyberpunk 2077", appId: "1091500" },
    { name: "RDR 2", appId: "1174180" },
    { name: "Hogwarts Legacy", appId: "1984200" },
    { name: "GoW Ragnarök", appId: "2322010" },
    { name: "CS2 Prime Upgrade", appId: "1808420" }
  ];

  async function fetchLiveTF2KeyPrice() {
    const marketId = currencyToSteamMarketId[state.currencyCode];
    if (!marketId) return;

    const originalFeedback = rateFeedback.textContent;
    rateFeedback.innerHTML = `<span class="loading-dot-pulse" style="margin-right: 6px;"></span> Fetching live TF2 key market price...`;

    try {
      const marketUrl = `https://steamcommunity.com/market/priceoverview/?appid=440&market_hash_name=Mann%20Co.%20Supply%20Crate%20Key&currency=${marketId}`;
      const data = await fetchWithProxyFallback(marketUrl);

      if (data && data.success && data.lowest_price) {
        const priceStr = data.lowest_price;
        let cleaned = priceStr.replace(/[^\d.,]/g, '').trim();
        
        if (state.currencyDecimals === 0) {
          cleaned = cleaned.replace(/[.,]/g, '');
        } else {
          if (cleaned.match(/,\d{2}$/)) {
            cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
          } else if (cleaned.match(/\.\d{2}$/)) {
            cleaned = cleaned.replace(/,/g, '');
          }
        }
        
        const keyPrice = parseFloat(cleaned);
        if (!isNaN(keyPrice) && keyPrice > 0) {
          state.keySellPrice = keyPrice;
          inputKeySellPrice.value = keyPrice.toLocaleString(undefined, { minimumFractionDigits: state.currencyDecimals });
          updateCalculations();
          showToast(`Updated live TF2 Key price: ${formatSteamValue(keyPrice)}`);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch live TF2 key price", err);
      rateFeedback.textContent = originalFeedback;
    }
  }

  async function loadFamousGamesSuggestions() {
    const famousGamesContainer = document.getElementById('famous-games-list');
    if (!famousGamesContainer) return;

    famousGamesContainer.innerHTML = "";

    const cacheKey = `famous_games_cache_${state.currencyCode}`;
    const cacheTimeKey = `famous_games_cache_time_${state.currencyCode}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);

    const now = Date.now();
    const cacheDuration = 12 * 60 * 60 * 1000; // 12 hours

    if (cachedData && cachedTime && (now - Number(cachedTime) < cacheDuration)) {
      renderFamousGames(JSON.parse(cachedData));
      return;
    }

    // Render loading placeholders
    famousGames.forEach(g => {
      const btn = document.createElement('div');
      btn.className = "wishlist-item-btn";
      btn.style.opacity = "0.7";
      btn.innerHTML = `
        <span class="wishlist-item-title">${g.name}</span>
        <span style="font-size: 9px; color: var(--text-muted);">loading...</span>
      `;
      famousGamesContainer.appendChild(btn);
    });

    // Fetch live prices in background
    const results = [];
    for (const g of famousGames) {
      try {
        const details = await fetchSteamLocalDetails(g.appId, state.currencyCode);
        let priceText = "No Price";
        let numericPrice = 0;
        
        if (details.price_overview) {
          numericPrice = details.price_overview.final / 100;
          priceText = formatSteamValue(numericPrice);
          if (details.price_overview.discount_percent > 0) {
            priceText += ` (-${details.price_overview.discount_percent}%)`;
          }
        } else if (details.is_free) {
          priceText = "Free";
        }
        
        results.push({ name: g.name, appId: g.appId, priceText, numericPrice });
      } catch (err) {
        console.warn(`Failed to preload price for ${g.name}`, err);
        results.push({ name: g.name, appId: g.appId, priceText: "Enter Manually", numericPrice: 0 });
      }
    }

    // Cache results
    localStorage.setItem(cacheKey, JSON.stringify(results));
    localStorage.setItem(cacheTimeKey, now.toString());

    renderFamousGames(results);
  }

  function renderFamousGames(dataList) {
    const famousGamesContainer = document.getElementById('famous-games-list');
    if (!famousGamesContainer) return;
    famousGamesContainer.innerHTML = "";

    dataList.forEach(g => {
      const btn = document.createElement('button');
      btn.className = "wishlist-item-btn";
      btn.innerHTML = `
        <span class="wishlist-item-title" style="font-weight:600;">${g.name}</span>
        <span class="wishlist-item-price">${g.priceText}</span>
      `;
      btn.addEventListener('click', () => {
        inputDbSearch.value = g.name;
        searchSteamDBApp();
        inputDbSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputDbSearch.focus();
      });
      famousGamesContainer.appendChild(btn);
    });
  }

  async function searchSteamDBApp() {
    const term = inputDbSearch.value.trim();
    if (!term) {
      showToast("Please enter a game name to search!");
      return;
    }

    btnDbSearch.disabled = true;
    btnDbSearch.textContent = "Searching...";
    dbSearchResultsList.innerHTML = `
      <div class="search-no-results" style="display: flex; align-items: center; justify-content: center; gap: 10px;">
        <span class="loading-dot-pulse"></span>
        Searching database and fetching regional editions...
      </div>
    `;
    dbSearchResultsList.style.display = "flex";

    const searchUrl = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(term)}`;

    try {
      const response = await fetch(searchUrl);
      if (!response.ok) throw new Error("CORS-free search failed");
      const contents = await response.json();
      
      if (contents && contents.length > 0) {
        // Take top 3 Steam games
        const topGames = contents.filter(g => g.steamAppID).slice(0, 3);
        
        if (topGames.length === 0) {
          dbSearchResultsList.innerHTML = `<div class="search-no-results">No Steam app matching "${escapeHtml(term)}" was found.</div>`;
          btnDbSearch.disabled = false;
          return;
        }

        dbSearchResultsList.innerHTML = ""; // Clear loader

        for (const game of topGames) {
          const appId = game.steamAppID;
          let editionsHtml = "";
          let dlcBadge = "";
          
          let libraryBadge = "";
          if (state.ownedApps.has(Number(appId))) {
            libraryBadge = `<span class="db-library-badge">In Library</span>`;
          }

          try {
            // Fetch local currency price and editions directly from Steam
            const details = await fetchSteamLocalDetails(appId, state.currencyCode);
            
            // Check DLCs
            if (details.dlc && details.dlc.length > 0) {
              dlcBadge = `<span class="db-dlc-badge">${details.dlc.length} DLCs Available</span>`;
            }

            // Parse editions (subs)
            if (details.package_groups && details.package_groups.length > 0) {
              const defaultGroup = details.package_groups.find(g => g.name === "default") || details.package_groups[0];
              if (defaultGroup && defaultGroup.subs && defaultGroup.subs.length > 0) {
                defaultGroup.subs.forEach(sub => {
                  const parts = sub.option_text.split(" - ");
                  const subTitle = parts.length > 1 ? parts.slice(0, -1).join(" - ").trim() : sub.option_text;
                  const priceCents = sub.price_in_cents_with_discount || 0;
                  const priceVal = state.currencyDecimals === 0 ? priceCents : priceCents / 100;
                  
                  let priceDisplayHtml = `<strong>${formatSteamValue(priceVal)}</strong>`;
                  
                  // Extract original price if there's a discount shown in option_text HTML
                  const spanRegex = /<span class="discount_original_price">([^<]+)<\/span>\s*([^<]+)/i;
                  const match = sub.option_text.match(spanRegex);
                  if (match) {
                    const originalPriceText = match[1].trim();
                    const discountPercentText = sub.percent_savings_text ? sub.percent_savings_text.trim() : "";
                    
                    priceDisplayHtml = `
                      <span class="db-original-price">${originalPriceText}</span>
                      <strong>${formatSteamValue(priceVal)}</strong>
                      ${discountPercentText ? `<span class="db-discount-tag">${discountPercentText}</span>` : ""}
                    `;
                  }

                  editionsHtml += `
                    <div class="db-edition-row">
                      <span class="db-edition-name" title="${escapeHtml(subTitle)}">${escapeHtml(subTitle)}</span>
                      <span class="db-edition-price-wrapper" style="display: flex; align-items: center; margin-right: 12px;">
                        ${priceDisplayHtml}
                      </span>
                      <button class="db-edition-apply-btn" data-price="${priceVal}" data-title="${escapeHtml(subTitle)}">Apply</button>
                    </div>
                  `;
                });
              }
            }

            // Fallback if success but no package groups
            if (editionsHtml === "") {
              let priceVal = 0;
              let priceDisplayHtml = "";
              if (details.price_overview) {
                priceVal = details.price_overview.final / 100;
                if (details.price_overview.discount_percent > 0) {
                  const originalVal = details.price_overview.initial / 100;
                  priceDisplayHtml = `
                    <span class="db-original-price">${formatSteamValue(originalVal)}</span>
                    <strong>${formatSteamValue(priceVal)}</strong>
                    <span class="db-discount-tag">-${details.price_overview.discount_percent}%</span>
                  `;
                } else {
                  priceDisplayHtml = `<strong>${formatSteamValue(priceVal)}</strong>`;
                }
              } else {
                priceDisplayHtml = details.is_free ? "<strong>Free to Play</strong>" : "<strong>No Price</strong>";
              }
              
              editionsHtml += `
                <div class="db-edition-row">
                  <span class="db-edition-name">${escapeHtml(details.name)}</span>
                  <span class="db-edition-price-wrapper" style="display: flex; align-items: center; margin-right: 12px;">
                    ${priceDisplayHtml}
                  </span>
                  <button class="db-edition-apply-btn" data-price="${priceVal}" data-title="${escapeHtml(details.name)}">Apply</button>
                </div>
              `;
            }

          } catch (err) {
            console.warn(`Failed to fetch Steam details for AppID ${appId}`, err);
            editionsHtml += `
              <div style="font-size: 11px; color: var(--text-secondary); font-style: italic; padding: 4px 0;">
                Failed to fetch direct regional prices. Please enter price manually.
              </div>
            `;
          }

          // Create main game result card
          const gameCard = document.createElement('div');
          gameCard.className = 'db-result-item';
          gameCard.innerHTML = `
            <div class="db-result-header">
              <div class="db-item-left">
                <img class="db-item-logo" src="${game.thumb}" alt="${escapeHtml(game.external)}" onerror="this.style.display='none'">
                <div class="db-item-title-wrapper">
                  <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <span class="db-item-title" title="${escapeHtml(game.external)}">${escapeHtml(game.external)}</span>
                    ${libraryBadge}
                  </div>
                  ${dlcBadge}
                </div>
              </div>
              <div class="db-item-right">
                <a href="https://steamdb.info/app/${appId}/" target="_blank" class="db-btn primary">SteamDB Prices ↗</a>
                <a href="https://steamdb.info/app/${appId}/dlc/" target="_blank" class="db-btn secondary">DLCs ↗</a>
              </div>
            </div>
            <div class="db-editions-section">
              <span class="db-editions-title">Available Purchase Editions:</span>
              <div class="db-editions-list">
                ${editionsHtml}
              </div>
            </div>
          `;

          // Register click listeners for this card's apply buttons
          gameCard.querySelectorAll('.db-edition-apply-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const applyPrice = parseFloat(btn.getAttribute('data-price')) || 0;
              const applyTitle = btn.getAttribute('data-title');

              state.gamePrice = applyPrice;
              inputGamePrice.value = applyPrice.toFixed(state.currencyDecimals);
              
              updateCalculations();
              showToast(`Applied price for "${applyTitle}": ${formatSteamValue(applyPrice)}`);
            });
          });

          dbSearchResultsList.appendChild(gameCard);
        }
      } else {
        dbSearchResultsList.innerHTML = `<div class="search-no-results">No games found matching "${escapeHtml(term)}".</div>`;
      }
    } catch (e) {
      dbSearchResultsList.innerHTML = `<div class="search-no-results">Search failed. Please compare manually on steamdb.info.</div>`;
      console.error(e);
    } finally {
      btnDbSearch.disabled = false;
      btnDbSearch.textContent = "Search App ID";
    }
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Toast System
  let toastTimer = null;
  function showToast(message) {
    appToast.textContent = message;
    appToast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      appToast.classList.remove('visible');
    }, 2500);
  }

  // --- HOST THEME HANDLING ---
  
  window.addEventListener('themeChanged', (e) => {
    document.documentElement.setAttribute('data-theme', e.detail);
  });
  const parentTheme = localStorage.getItem('hub_ui_theme') || 'light';
  document.documentElement.setAttribute('data-theme', parentTheme);

  // --- INITIALIZATION ---
  registerInputEvents();

  btnDbSearch.addEventListener('click', (e) => {
    e.preventDefault();
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchSteamDBApp();
  });
  
  // Debounced autocomplete search
  let searchDebounceTimer = null;
  inputDbSearch.addEventListener('input', () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    
    const query = inputDbSearch.value.trim();
    if (query.length < 2) {
      dbSearchResultsList.innerHTML = '';
      dbSearchResultsList.style.display = 'none';
      return;
    }

    searchDebounceTimer = setTimeout(() => {
      searchSteamDBApp();
    }, 400); // 400ms debounce
  });

  inputDbSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      searchSteamDBApp();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      dbSearchResultsList.innerHTML = '';
      dbSearchResultsList.style.display = 'none';
      inputDbSearch.value = '';
    }
  });

  // --- STEAM PROFILE INTEGRATION LOGIC ---

  // Initialize input fields from state
  inputSteamKey.value = state.steamApiKey;
  inputSteamId.value = state.steamId;
  updateProfileStatusText();

  // Save profile input fields automatically on change
  inputSteamKey.addEventListener('input', () => {
    const val = inputSteamKey.value.trim();
    localStorage.setItem('steam_api_key', val);
    state.steamApiKey = val;
  });

  inputSteamId.addEventListener('input', () => {
    const val = inputSteamId.value.trim();
    localStorage.setItem('steam_id', val);
    state.steamId = val;
    updateProfileStatusText();
  });

  // Save database search query automatically on change
  inputDbSearch.addEventListener('input', () => {
    localStorage.setItem('state_db_search', inputDbSearch.value.trim());
  });

  // Restore database search query and trigger search if populated
  const savedSearch = localStorage.getItem('state_db_search') || '';
  if (savedSearch) {
    inputDbSearch.value = savedSearch;
    if (savedSearch.length >= 2) {
      // Trigger search in a timeout so DOM and dependencies are fully ready
      setTimeout(() => {
        searchSteamDBApp();
      }, 100);
    }
  }

  // Toggle Panel
  profileToggle.addEventListener('click', () => {
    const isHidden = profileContent.style.display === 'none';
    profileContent.style.display = isHidden ? 'flex' : 'none';
    profilePanel.classList.toggle('open', isHidden);
  });

  function updateProfileStatusText() {
    if (state.steamId) {
      const count = state.ownedApps.size;
      profileStatusText.textContent = `Steam Profile Connected: ${count > 0 ? `${count} Games Synced` : 'Ready to Sync'}`;
    } else {
      profileStatusText.textContent = "Connect Steam Profile (Local Setup)";
    }
  }

  // Save & Sync Library Button
  btnSyncProfile.addEventListener('click', async (e) => {
    e.preventDefault();
    const key = inputSteamKey.value.trim();
    const steamid = inputSteamId.value.trim();

    if (!key || !steamid) {
      showToast("Please enter both API Key and Steam ID!");
      return;
    }

    btnSyncProfile.disabled = true;
    btnSyncProfile.textContent = "Syncing...";

    try {
      // Save locally
      localStorage.setItem('steam_api_key', key);
      localStorage.setItem('steam_id', steamid);
      state.steamApiKey = key;
      state.steamId = steamid;

      // Query Steam Owned Games API via proxy
      const ownedGamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamid}&format=json`;
      const data = await fetchWithProxyFallback(ownedGamesUrl);

      if (data && data.response && data.response.games) {
        const gameList = data.response.games;
        const appIds = gameList.map(g => Number(g.appid));
        localStorage.setItem('steam_owned_apps', JSON.stringify(appIds));
        state.ownedApps = new Set(appIds);
        updateProfileStatusText();
        showToast(`Synced library! Found ${gameList.length} owned games.`);
      } else {
        showToast("Connected, but could not read owned games list. Check privacy settings!");
      }
    } catch (err) {
      console.error("Failed to sync Steam library", err);
      showToast("Sync failed. Check credentials/Internet.");
    } finally {
      btnSyncProfile.disabled = false;
      btnSyncProfile.textContent = "Save & Sync Library";
    }
  });

  // Import Wishlist Button
  btnFetchWishlist.addEventListener('click', async (e) => {
    e.preventDefault();
    const steamid = inputSteamId.value.trim() || state.steamId;

    if (!steamid) {
      showToast("Please enter your Steam ID first!");
      return;
    }

    btnFetchWishlist.disabled = true;
    btnFetchWishlist.textContent = "Importing...";
    wishlistList.innerHTML = `<div style="font-size: 11px; color: var(--text-secondary); text-align: center; padding: 12px 0;">
      <span class="loading-dot-pulse" style="margin-right: 6px;"></span> Fetching wishlist from Steam...
    </div>`;
    wishlistContainer.style.display = "block";

    try {
      // Resolve vanity URL if needed, then fetch wishlist from Steam storefront API
      const wishlistUrl = await resolveSteamWishlistUrl(steamid);
      const data = await fetchWithProxyFallback(wishlistUrl);

      if (data && Object.keys(data).length > 0) {
        wishlistList.innerHTML = "";
        
        Object.keys(data).forEach(appId => {
          const game = data[appId];
          const itemBtn = document.createElement('button');
          itemBtn.className = "wishlist-item-btn";
          
          let priceHtml = "";
          if (game.subs && game.subs.length > 0 && game.subs[0].price) {
            const priceVal = game.subs[0].price / 100;
            priceHtml = `<span class="wishlist-item-price">${priceVal} ${state.currencySymbol}</span>`;
          } else if (game.prerelease) {
            priceHtml = `<span class="wishlist-item-price" style="color: var(--text-muted); font-size: 10px;">Pre-release</span>`;
          } else if (game.is_free_game) {
            priceHtml = `<span class="wishlist-item-price" style="color: #10b981;">Free</span>`;
          }

          itemBtn.innerHTML = `
            <span class="wishlist-item-title">${escapeHtml(game.name)}</span>
            ${priceHtml}
          `;

          // Quick selection behavior: load it in autocomplete!
          itemBtn.addEventListener('click', () => {
            inputDbSearch.value = game.name;
            searchSteamDBApp();
            // Scroll to search input
            inputDbSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
            inputDbSearch.focus();
          });

          wishlistList.appendChild(itemBtn);
        });

        showToast(`Imported ${Object.keys(data).length} wishlist games!`);
      } else {
        wishlistList.innerHTML = `<div style="font-size: 11px; color: var(--text-secondary); text-align: center; padding: 12px 0;">No games found or wishlist is set to private.</div>`;
      }
    } catch (err) {
      console.error("Failed to fetch wishlist", err);
      wishlistList.innerHTML = `<div style="font-size: 11px; color: #ef4444; text-align: center; padding: 12px 0;">Failed to load wishlist. Make sure your profile & wishlist are Public!</div>`;
    } finally {
      btnFetchWishlist.disabled = false;
      btnFetchWishlist.textContent = "Import Wishlist";
    }
  });

  // Sync select dropdowns with state UAH default
  selectSteamCurrency.value = `${state.currencyCode}|${state.currencySymbol}|${state.currencyDecimals}`;

  // Set initial inputs with comma formatting
  inputGamePrice.value = state.gamePrice.toLocaleString(undefined, { minimumFractionDigits: state.currencyDecimals, maximumFractionDigits: state.currencyDecimals });
  inputWalletBalance.value = state.walletBalance.toLocaleString(undefined, { minimumFractionDigits: state.currencyDecimals, maximumFractionDigits: state.currencyDecimals });
  inputKeyBuyPrice.value = state.keyBuyPrice.toLocaleString();
  inputKeySellPrice.value = state.keySellPrice.toLocaleString(undefined, { minimumFractionDigits: state.currencyDecimals, maximumFractionDigits: state.currencyDecimals });

  updateCalculations();

  // Load live key price & preloaded famous games in background on startup
  fetchLiveTF2KeyPrice();
  loadFamousGamesSuggestions();

    // Navigation pill buttons logic removed safely


});
