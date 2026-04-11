document.addEventListener('DOMContentLoaded', () => {
    const grabInput = document.getElementById('grabInput');
    const grabbingInput = document.getElementById('grabbingInput');
    const grabUrl = document.getElementById('grabUrl');
    const grabbingUrl = document.getElementById('grabbingUrl');
    const grabPreview = document.getElementById('grabPreview');
    const grabbingPreview = document.getElementById('grabbingPreview');

    const getUnavailableImage = () => chrome.runtime.getURL('resources/unavailable.svg');

    grabPreview.onerror = () => { grabPreview.src = getUnavailableImage(); };
    grabbingPreview.onerror = () => { grabbingPreview.src = getUnavailableImage(); };

    const packGrid = document.getElementById('packGrid');
    const packName = document.getElementById('packName');
    const packDesc = document.getElementById('packDesc');
    const packTags = document.getElementById('packTags');
    const packIdLabel = document.getElementById('packIdLabel');
    const packSearch = document.getElementById('packSearch');
    const newPackBtn = document.getElementById('newPackBtn');
    const exportPackBtn = document.getElementById('exportPackBtn');
    const importPackFolder = document.getElementById('importPackFolder');
    const viewGridBtn = document.getElementById('viewGrid');
    const viewCompactBtn = document.getElementById('viewCompact');
    const viewListBtn = document.getElementById('viewList');

    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const newThemeBtn = document.getElementById('newThemeBtn');
    const exportThemeBtn = document.getElementById('exportThemeBtn');
    const importThemeBtn = document.getElementById('importThemeBtn');
    const themeEditorForm = document.getElementById('themeEditorForm');
    const themeNameInput = document.getElementById('themeNameInput');
    const saveThemeBtn = document.getElementById('saveThemeBtn');
    const deleteThemeBtn = document.getElementById('deleteThemeBtn');
    const cancelThemeBtn = document.getElementById('cancelThemeBtn');
    const customThemeOptgroup = document.getElementById('customThemeDarkOptgroup'); // legacy ref kept for safety
    const themeMode = document.getElementById('themeMode');
    const deleteSelectedThemeBtn = document.getElementById('deleteSelectedThemeBtn');
    const cloneSelectedThemeBtn = document.getElementById('cloneSelectedThemeBtn');
    const osSyncTheme = document.getElementById('osSyncTheme');
    const osThemePickers = document.getElementById('osThemePickers');
    const osLightTheme = document.getElementById('osLightTheme');
    const osDarkTheme = document.getElementById('osDarkTheme');
    const manualThemeLabel = document.getElementById('manualThemeLabel');
    const te = {
        bg: document.getElementById('te_bg'),
        text: document.getElementById('te_text'),
        card: document.getElementById('te_card'),
        panel: document.getElementById('te_panel'),
        accent: document.getElementById('te_accent'),
        proper: document.getElementById('te_proper'),
    };
    const enableCheckbox   = document.getElementById('enableCheckbox');
    const chromeSyncEnabled = document.getElementById('chromeSyncEnabled');
    const cursorOpacityEl  = document.getElementById('cursorOpacity');
    const cursorOpacityVal = document.getElementById('cursorOpacityVal');
    const cursorTintColor    = document.getElementById('cursorTintColor');
    const cursorTintStrength = document.getElementById('cursorTintStrength');
    const cursorTintStrengthVal = document.getElementById('cursorTintStrengthVal');
    const trailEnabledEl   = document.getElementById('trailEnabled');
    const trailOptions     = document.getElementById('trailOptions');
    const trailColorEl     = document.getElementById('trailColor');
    const trailSizeEl      = document.getElementById('trailSize');
    const trailSizeVal     = document.getElementById('trailSizeVal');
    const trailLengthEl    = document.getElementById('trailLength');
    const trailLengthVal   = document.getElementById('trailLengthVal');
    const trailFadeEl      = document.getElementById('trailFade');
    const trailOpacityEl   = document.getElementById('trailOpacity');
    const trailOpacityVal  = document.getElementById('trailOpacityVal');
    const trailScopeAllEl  = document.getElementById('trailScopeAll');
    const trailScopeGrabEl = document.getElementById('trailScopeGrab');
    const clearStatsBtn    = document.getElementById('clearStatsBtn');
    const syncHotspot = document.getElementById('syncHotspot');
    const hotspotX = document.getElementById('hotspotX');
    const hotspotY = document.getElementById('hotspotY');
    const hotspotGrabX = document.getElementById('hotspotGrabX');
    const hotspotGrabY = document.getElementById('hotspotGrabY');
    const hotspotGrabbingX = document.getElementById('hotspotGrabbingX');
    const hotspotGrabbingY = document.getElementById('hotspotGrabbingY');
    const sharedHotspot = document.getElementById('sharedHotspot');
    const separateHotspot = document.getElementById('separateHotspot');
    const uiTheme = document.getElementById('uiTheme');
    const sandboxBox = document.getElementById('sandboxBox');

    // Advanced tab
    const newRuleDomain = document.getElementById('newRuleDomain');
    const newRuleAction = document.getElementById('newRuleAction');
    const newRulePack = document.getElementById('newRulePack');
    const addRuleBtn = document.getElementById('addRuleBtn');
    const siteRulesContainer = document.getElementById('siteRulesContainer');

    const DEFAULT_ACTIVE_PACK = 'macos';
    const DEFAULT_PACK_ORDER = ['macos', 'win11-light', 'win11-dark'];

    let currentPack = null;
    let currentPacks = {};
    let currentPackOrder = [];
    let currentActivePackId = DEFAULT_ACTIVE_PACK;
    let siteRules = []; // [{ domain, action, packId? }]
    let dragSrcId = null;
    let currentViewMode = 'grid'; // 'grid' | 'compact' | 'list'
    let osThemeSyncEnabled = false;
    let osLightThemeValue = 'light';
    let osDarkThemeValue  = 'dark';

    // ── Toast notifications ───────────────────────────────────────────────────

    const toastContainer = document.getElementById('toast-container');
    function showToast(msg, type = 'success') {
        const t = document.createElement('div');
        t.className = 'toast' + (type === 'error' ? ' error' : '');
        t.textContent = msg;
        toastContainer.appendChild(t);
        requestAnimationFrame(() => { requestAnimationFrame(() => { t.classList.add('show'); }); });
        setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => t.remove(), 250);
        }, 2500);
    }

    // ── Confirm modal ─────────────────────────────────────────────────────────

    const confirmOverlay = document.getElementById('confirm-overlay');
    const confirmTitle   = document.getElementById('confirm-title');
    const confirmMsg     = document.getElementById('confirm-msg');
    const confirmOk      = document.getElementById('confirm-ok');
    const confirmCancel  = document.getElementById('confirm-cancel');
    let confirmResolve   = null;

    function showConfirm({ title, message, okLabel = 'Confirm', okClass = 'danger' }) {
        confirmTitle.textContent = title;
        confirmMsg.textContent   = message;
        confirmOk.textContent    = okLabel;
        confirmOk.className      = okClass;
        confirmOverlay.classList.add('show');
        return new Promise(resolve => { confirmResolve = resolve; });
    }

    confirmOk.addEventListener('click', () => {
        confirmOverlay.classList.remove('show');
        if (confirmResolve) { confirmResolve(true); confirmResolve = null; }
    });
    confirmCancel.addEventListener('click', () => {
        confirmOverlay.classList.remove('show');
        if (confirmResolve) { confirmResolve(false); confirmResolve = null; }
    });
    confirmOverlay.addEventListener('click', (e) => {
        if (e.target === confirmOverlay) {
            confirmOverlay.classList.remove('show');
            if (confirmResolve) { confirmResolve(false); confirmResolve = null; }
        }
    });

    // ── View toggle ───────────────────────────────────────────────────────────

    function setViewMode(mode, save = true) {
        currentViewMode = mode;
        packGrid.classList.remove('view-compact', 'view-list');
        if (mode === 'compact') packGrid.classList.add('view-compact');
        if (mode === 'list')    packGrid.classList.add('view-list');
        [viewGridBtn, viewCompactBtn, viewListBtn].forEach(b => b.classList.remove('active'));
        if (mode === 'grid')    viewGridBtn.classList.add('active');
        if (mode === 'compact') viewCompactBtn.classList.add('active');
        if (mode === 'list')    viewListBtn.classList.add('active');
        if (save) saveSetting('packViewMode', mode);
    }

    viewGridBtn.addEventListener('click',    () => setViewMode('grid'));
    viewCompactBtn.addEventListener('click', () => setViewMode('compact'));
    viewListBtn.addEventListener('click',    () => setViewMode('list'));

    // ── OS theme sync ─────────────────────────────────────────────────────────

    const osColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    let preOsSyncTheme = null;

    function getOsTheme() {
        return osColorScheme.matches ? osDarkThemeValue : osLightThemeValue;
    }

    function updateOsSyncUI(enabled) {
        osThemeSyncEnabled = enabled;
        osThemePickers.style.display   = enabled ? 'flex' : 'none';
        manualThemeLabel.style.display = enabled ? 'none' : '';
        if (enabled) applyTheme(getOsTheme());
    }

    function syncOsCustomOptgroups() {
        const lightGroupOs = document.getElementById('osLightCustomOptgroup');
        const darkGroupOs  = document.getElementById('osDarkCustomOptgroup');
        if (!lightGroupOs || !darkGroupOs) return;
        lightGroupOs.innerHTML = '';
        darkGroupOs.innerHTML  = '';
        Object.values(customThemes).forEach(ct => {
            const opt = document.createElement('option');
            opt.value = ct.id; opt.textContent = ct.name;
            (ct.mode === 'light' ? lightGroupOs : darkGroupOs).appendChild(opt.cloneNode(true));
        });
        if (osLightTheme) osLightTheme.value = osLightThemeValue;
        if (osDarkTheme)  osDarkTheme.value  = osDarkThemeValue;
    }

    osSyncTheme.addEventListener('change', () => {
        if (osSyncTheme.checked) {
            preOsSyncTheme = uiTheme.value || 'dark';
            updateOsSyncUI(true);
            saveSetting('osThemeSync', true);
            saveSetting('uiTheme', getOsTheme());
        } else {
            updateOsSyncUI(false);
            const restore = preOsSyncTheme || 'dark';
            preOsSyncTheme = null;
            uiTheme.value = restore;
            applyTheme(restore);
            saveSetting('osThemeSync', false);
            saveSetting('uiTheme', restore);
        }
    });

    osLightTheme.addEventListener('change', () => {
        osLightThemeValue = osLightTheme.value;
        saveSetting('osLightTheme', osLightThemeValue);
        if (!osColorScheme.matches) applyTheme(osLightThemeValue);
    });

    osDarkTheme.addEventListener('change', () => {
        osDarkThemeValue = osDarkTheme.value;
        saveSetting('osDarkTheme', osDarkThemeValue);
        if (osColorScheme.matches) applyTheme(osDarkThemeValue);
    });

    osColorScheme.addEventListener('change', () => {
        if (!osThemeSyncEnabled) return;
        const theme = getOsTheme();
        applyTheme(theme);
        uiTheme.value = theme;
        saveSetting('uiTheme', theme);
    });

    // ── File selector buttons ─────────────────────────────────────────────────

    document.querySelectorAll('.file-btn').forEach(btn => {
        const target = btn.dataset.target;
        if (!target) return;
        const input = document.getElementById(target);
        if (!input) return;
        btn.addEventListener('click', () => input.click());
    });

    // ── Built-in packs ────────────────────────────────────────────────────────

    const BUILTIN_PACKS = {
        macos: {
            id: 'macos', name: 'Mac OS', readonly: true,
            description: 'Classic macOS-style hand cursors with smooth, rounded strokes.',
            grabCursor: chrome.runtime.getURL('resources/macos/grab.png'),
            grabbingCursor: chrome.runtime.getURL('resources/macos/grabbing.png'),
            syncHotspot: false, hotspotX: 16, hotspotY: 16,
            hotspotGrabX: 16, hotspotGrabY: 16, hotspotGrabbingX: 18, hotspotGrabbingY: 18
        },
        'win11-light': {
            id: 'win11-light', name: 'Win11 Light', readonly: true,
            description: 'Windows 11 hand cursor in light style, crisp and minimal.',
            grabCursor: chrome.runtime.getURL('resources/win11-light/grab.png'),
            grabbingCursor: chrome.runtime.getURL('resources/win11-light/grabbing.png'),
            syncHotspot: true, hotspotX: 16, hotspotY: 16,
            hotspotGrabX: 16, hotspotGrabY: 16, hotspotGrabbingX: 16, hotspotGrabbingY: 16
        },
        'win11-dark': {
            id: 'win11-dark', name: 'Win11 Dark', readonly: true,
            description: 'Windows 11 hand cursor in dark style, for dark-themed setups.',
            grabCursor: chrome.runtime.getURL('resources/win11-dark/grab.png'),
            grabbingCursor: chrome.runtime.getURL('resources/win11-dark/grabbing.png'),
            syncHotspot: true, hotspotX: 16, hotspotY: 16,
            hotspotGrabX: 16, hotspotGrabY: 16, hotspotGrabbingX: 16, hotspotGrabbingY: 16
        }
    };

    // ── Theme system ──────────────────────────────────────────────────────────

    const BUILTIN_THEMES = ['light','dark','neon','cherry','blueberry','stormy','desert','coastal','summer','parchment','aurora','espresso','graphite','sakura','toxic'];
    const BUILTIN_THEME_VARS = {
        light:     { bg:'#ffffff', text:'#1f1f1f', card:'#f7f7f9', panel:'#ffffff', accent:'#4caf50', proper:'#000000' },
        dark:      { bg:'#181a1f', text:'#e5e5e5', card:'#1e2028', panel:'#1c1f25', accent:'#7cbbff', proper:'#ffffff' },
        neon:      { bg:'#02030a', text:'#f0faff', card:'#000000', panel:'#000000', accent:'#00ffe4', proper:'#ffffff' },
        cherry:    { bg:'#1b0b15', text:'#ffeeff', card:'#2a111f', panel:'#2b1120', accent:'#ff2d84', proper:'#ffffff' },
        blueberry: { bg:'#0d0f1a', text:'#dde3ff', card:'#13162a', panel:'#151829', accent:'#7b6fff', proper:'#ffffff' },
        stormy:    { bg:'#1c2333', text:'#cdd6e8', card:'#232c3d', panel:'#1e2738', accent:'#7fa8d8', proper:'#e8eef7' },
        desert:    { bg:'#2b1d0e', text:'#f5e6cf', card:'#3a2614', panel:'#33200f', accent:'#e8954a', proper:'#fdf0dc' },
        coastal:   { bg:'#f5fdf8', text:'#1a3a30', card:'#e8f7f0', panel:'#f0fbf5', accent:'#2eb87a', proper:'#0e2820' },
        summer:    { bg:'#0d2f35', text:'#e8f8f5', card:'#133840', panel:'#102e35', accent:'#ff7b42', proper:'#ffffff' },
        parchment: { bg:'#f5efe0', text:'#3b2a1a', card:'#ede3ce', panel:'#f9f3e6', accent:'#a0522d', proper:'#2a1a0a' },
        aurora:    { bg:'#080f1a', text:'#d0eee8', card:'#0d1a24', panel:'#0a1520', accent:'#3dd6a0', proper:'#e8fff8' },
        espresso:  { bg:'#1a0f0a', text:'#f0e6d3', card:'#271710', panel:'#221208', accent:'#c8832a', proper:'#fdf3e3' },
        graphite:  { bg:'#1a1a1a', text:'#d8d8d8', card:'#242424', panel:'#1f1f1f', accent:'#a0a0a0', proper:'#f0f0f0' },
        sakura:    { bg:'#fdf6f8', text:'#3d1f2a', card:'#f7e8ee', panel:'#fef0f4', accent:'#d4607a', proper:'#2a0f1a' },
        toxic:     { bg:'#080d08', text:'#d4f0c0', card:'#0e160e', panel:'#0a120a', accent:'#7cdb2a', proper:'#e8ffd8' },
    };
    let customThemes = {};
    let editingThemeId = null;

    const themeTransitionEl = document.getElementById('theme-transition');
    let themeTransitionTimer = null;

    function applyTheme(theme, { animate = true } = {}) {
        const doSwap = () => {
            const allClasses = [
                ...BUILTIN_THEMES.map(t => `theme-${t}`),
                ...Object.keys(customThemes).map(id => `theme-custom-${id}`)
            ];
            document.body.classList.remove(...allClasses);
            if (!theme || theme === 'light') return;
            if (BUILTIN_THEMES.includes(theme)) {
                document.body.classList.add(`theme-${theme}`);
            } else {
                const ct = customThemes[theme];
                if (ct) injectCustomThemeStyle(ct);
                document.body.classList.add(`theme-custom-${theme}`);
            }
        };

        if (!animate) { doSwap(); return; }

        // Clear any in-progress transition
        if (themeTransitionTimer) { clearTimeout(themeTransitionTimer); themeTransitionTimer = null; }

        // Fade overlay in → swap theme → fade overlay out
        themeTransitionEl.classList.add('fade-in');
        themeTransitionTimer = setTimeout(() => {
            doSwap();
            themeTransitionEl.classList.remove('fade-in');
            themeTransitionTimer = null;
        }, 180);
    }

    function injectCustomThemeStyle(ct) {
        const id = `custom-theme-style-${ct.id}`;
        let el = document.getElementById(id);
        if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
        const v = ct.vars;
        el.textContent = `body.theme-custom-${ct.id} {
            --bg:${v.bg}; --text:${v.text}; --card:${v.card};
            --panel:${v.panel}; --accent:${v.accent}; --proper:${v.proper};
            --border:rgba(128,128,128,0.2); --shadow:rgba(0,0,0,0.3);
        }`;
    }

    function loadCustomThemes(themes) {
        customThemes = themes || {};
        Object.values(customThemes).forEach(injectCustomThemeStyle);
        const prevValue = uiTheme.value;
        const lightGroup = document.getElementById('customThemeLightOptgroup');
        const darkGroup  = document.getElementById('customThemeDarkOptgroup');
        lightGroup.innerHTML = '';
        darkGroup.innerHTML  = '';
        Object.values(customThemes).forEach(ct => {
            const opt = document.createElement('option');
            opt.value = ct.id;
            opt.textContent = ct.name;
            (ct.mode === 'light' ? lightGroup : darkGroup).appendChild(opt);
        });
        if (prevValue) {
            const exists = Array.from(uiTheme.options).some(o => o.value === prevValue);
            if (exists) uiTheme.value = prevValue;
        }
        syncOsCustomOptgroups();
    }

    function saveCustomThemes(cb) { chrome.storage.local.set({ customThemes }, cb); }

    function openThemeEditor(themeId) {
        editingThemeId = themeId || null;
        themeEditorForm.style.display = '';
        if (themeId && customThemes[themeId]) {
            const ct = customThemes[themeId];
            themeNameInput.value = ct.name;
            themeMode.value = ct.mode || 'dark';
            Object.keys(te).forEach(k => { te[k].value = ct.vars[k] || '#ffffff'; });
            deleteThemeBtn.style.display = '';
        } else {
            themeNameInput.value = '';
            themeMode.value = 'dark';
            te.bg.value = '#1a1a2e'; te.text.value = '#e0e0e0'; te.card.value = '#222235';
            te.panel.value = '#1e1e30'; te.accent.value = '#6c63ff'; te.proper.value = '#ffffff';
            deleteThemeBtn.style.display = 'none';
        }
    }

    function closeThemeEditor() { themeEditorForm.style.display = 'none'; editingThemeId = null; }

    // ── Utilities ─────────────────────────────────────────────────────────────

    function updateHotspotUI() {
        if (syncHotspot.checked) {
            sharedHotspot.style.display = '';
            separateHotspot.style.display = 'none';
        } else {
            sharedHotspot.style.display = 'none';
            separateHotspot.style.display = '';
        }
    }

    function slugify(text) {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'pack';
    }

    function createPackId(name) { return `${slugify(name || 'pack')}-${Date.now()}`; }

    // ── ZIP builder ───────────────────────────────────────────────────────────

    function buildZipFromFiles(files) {
        const encoder = new TextEncoder();
        const crcTable = (() => {
            const t = new Uint32Array(256);
            for (let i = 0; i < 256; i++) {
                let c = i;
                for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
                t[i] = c;
            }
            return t;
        })();
        const crc32 = (data) => {
            let crc = 0xffffffff;
            for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
            return (crc ^ 0xffffffff) >>> 0;
        };
        const u16 = (v) => [v & 0xff, (v >> 8) & 0xff];
        const u32 = (v) => [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff];
        const localHeaders = [], centralHeaders = [];
        let localOffset = 0;
        for (const file of files) {
            const nameBytes = encoder.encode(file.name);
            const data = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
            const crc = crc32(data);
            const nameLen = nameBytes.length, dataLen = data.length;
            const lh = new Uint8Array([0x50,0x4b,0x03,0x04,...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(dataLen),...u32(dataLen),...u16(nameLen),...u16(0)]);
            const localEntry = concatUint8Arrays([lh, nameBytes, data]);
            localHeaders.push(localEntry);
            const ch = new Uint8Array([0x50,0x4b,0x01,0x02,...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(dataLen),...u32(dataLen),...u16(nameLen),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(localOffset)]);
            centralHeaders.push(concatUint8Arrays([ch, nameBytes]));
            localOffset += localEntry.length;
        }
        const centralDir = concatUint8Arrays(centralHeaders);
        const count = files.length;
        const eocd = new Uint8Array([0x50,0x4b,0x05,0x06,...u16(0),...u16(0),...u16(count),...u16(count),...u32(centralDir.length),...u32(localOffset),...u16(0)]);
        return new Blob([concatUint8Arrays(localHeaders), centralDir, eocd], { type: 'application/zip' });
    }

    function concatUint8Arrays(arrays) {
        const total = arrays.reduce((s, a) => s + a.length, 0);
        const out = new Uint8Array(total);
        let pos = 0;
        for (const a of arrays) { out.set(a, pos); pos += a.length; }
        return out;
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    // ── Storage helpers ───────────────────────────────────────────────────────

    function mergeBuiltInPacks(storedPacks) {
        const stored = storedPacks || {};
        const packs = { ...stored };
        const CURSOR_KEYS = ['grabCursor', 'grabbingCursor', 'grabPreviewSvg', 'grabbingPreviewSvg'];
        Object.keys(BUILTIN_PACKS).forEach(id => {
            const storedPack = stored[id] || {};
            const storedSafe = Object.fromEntries(
                Object.entries(storedPack).filter(([k]) => !CURSOR_KEYS.includes(k))
            );
            packs[id] = { ...BUILTIN_PACKS[id], ...storedSafe };
        });
        return packs;
    }

    function normalizePackOrder(storedOrder, packs) {
        const order = [], seen = new Set();
        const add = (id) => { if (!id || seen.has(id) || !packs[id]) return; seen.add(id); order.push(id); };
        if (Array.isArray(storedOrder) && storedOrder.length) storedOrder.forEach(add);
        else DEFAULT_PACK_ORDER.forEach(add);
        Object.keys(packs).forEach(add);
        return order;
    }

    function savePackOrder(order, callback) {
        currentPackOrder = order;
        chrome.storage.local.set({ packOrder: order }, () => {
            if (chrome.runtime.lastError) { console.error('savePackOrder failed:', chrome.runtime.lastError.message); return; }
            if (typeof callback === 'function') callback();
        });
    }

    function getPackFromStorage(callback) {
        chrome.storage.local.get(['packs', 'activePackId', 'enableCustom', 'uiTheme', 'packOrder', 'customThemes', 'siteRules', 'packViewMode', 'osThemeSync', 'osLightTheme', 'osDarkTheme'], items => {
            if (chrome.runtime.lastError) { console.error('getPackFromStorage failed:', chrome.runtime.lastError.message); return; }
            const packs = mergeBuiltInPacks(items.packs);
            const activePackId = items.activePackId || DEFAULT_ACTIVE_PACK;
            const activePack = packs[activePackId] || packs[DEFAULT_ACTIVE_PACK];
            currentPacks = packs;
            currentActivePackId = activePackId;
            currentPackOrder = normalizePackOrder(items.packOrder, packs);
            siteRules = items.siteRules || [];
            loadCustomThemes(items.customThemes || {});
            osLightThemeValue = items.osLightTheme || 'light';
            osDarkThemeValue  = items.osDarkTheme  || 'dark';
            callback({ packs, activePackId, activePack, enableCustom: items.enableCustom !== false, uiTheme: items.uiTheme || 'dark', packViewMode: items.packViewMode || 'grid', osThemeSync: !!items.osThemeSync });
        });
    }

    function savePacks(packs, callback) {
        chrome.storage.local.set({ packs }, () => {
            if (chrome.runtime.lastError) { console.error('savePacks failed:', chrome.runtime.lastError.message); return; }
            if (typeof callback === 'function') callback();
        });
    }

    function saveSetting(key, value, callback) {
        const obj = {}; obj[key] = value;
        chrome.storage.local.set(obj, () => {
            if (chrome.runtime.lastError) { console.error(`saveSetting(${key}) failed:`, chrome.runtime.lastError.message); return; }
            if (typeof callback === 'function') callback();
        });
    }

    function saveSiteRules(rules, callback) {
        siteRules = rules;
        chrome.storage.local.set({ siteRules: rules }, () => {
            if (typeof callback === 'function') callback();
        });
    }

    // ── Pack UI helpers ───────────────────────────────────────────────────────

    function loadPackIntoUI(pack) {
        currentPack = pack;
        packName.value = pack.name;
        packDesc.value = pack.description || '';
        packTags.value = (pack.tags || []).join(', ');
        packIdLabel.textContent = pack.id;
        syncHotspot.checked = (pack.syncHotspot === undefined) ? true : !!pack.syncHotspot;
        hotspotX.value = pack.hotspotX ?? 16;
        hotspotY.value = pack.hotspotY ?? 16;
        hotspotGrabX.value = pack.hotspotGrabX ?? 16;
        hotspotGrabY.value = pack.hotspotGrabY ?? 16;
        hotspotGrabbingX.value = pack.hotspotGrabbingX ?? 16;
        hotspotGrabbingY.value = pack.hotspotGrabbingY ?? 16;
        updateHotspotUI();
        grabPreview.src = pack.grabCursor || getUnavailableImage();
        grabbingPreview.src = pack.grabbingCursor || getUnavailableImage();
        grabUrl.value = '';
        grabbingUrl.value = '';
        const ro = !!pack.readonly;
        packName.disabled = ro;
        packDesc.disabled = ro;
        packTags.disabled = ro;
        syncHotspot.disabled = false;
        hotspotX.disabled = false; hotspotY.disabled = false;
        hotspotGrabX.disabled = false; hotspotGrabY.disabled = false;
        hotspotGrabbingX.disabled = false; hotspotGrabbingY.disabled = false;
        document.querySelectorAll('.file-btn[data-target="grabInput"], .file-btn[data-target="grabbingInput"]').forEach(btn => { btn.disabled = ro; });
        grabUrl.disabled = ro;
        grabbingUrl.disabled = ro;
    }

    // Cache of processedUrl -> blobUrl so we don't re-canvas on every hover
    const _processedUrlCache = new Map();

    async function processedCursorUrl(rawUrl, opacity, tintColor, tintStrength) {
        if (!rawUrl) return null;
        const key = `${rawUrl}|${opacity}|${tintColor}|${tintStrength}`;
        if (_processedUrlCache.has(key)) return _processedUrlCache.get(key);
        const needsEffect = opacity < 0.99 || tintStrength > 0.01;
        if (!needsEffect) { _processedUrlCache.set(key, rawUrl); return rawUrl; }
        try {
            const img = await new Promise((res, rej) => {
                const i = new Image();
                i.onload  = () => res(i);
                i.onerror = () => rej();
                i.src = rawUrl; // extension origin — no taint in options page
            });
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 64; canvas.height = img.naturalHeight || 64;
            const ctx = canvas.getContext('2d');
            ctx.globalAlpha = opacity;
            ctx.drawImage(img, 0, 0);
            if (tintStrength > 0.01) {
                ctx.globalCompositeOperation = 'source-atop';
                ctx.globalAlpha = tintStrength;
                ctx.fillStyle   = tintColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            const blobUrl = await new Promise(res => canvas.toBlob(b => res(b ? URL.createObjectURL(b) : rawUrl), 'image/png'));
            _processedUrlCache.set(key, blobUrl);
            return blobUrl;
        } catch(e) { _processedUrlCache.set(key, rawUrl); return rawUrl; }
    }

    async function getCursorStyle(pack, type) {
        if (!pack) return type;
        const rawUrl = type === 'grab' ? pack.grabCursor : pack.grabbingCursor;
        if (!rawUrl) return type;
        const syncHS = pack.syncHotspot !== false;
        const x = type === 'grab'
            ? (pack.hotspotX ?? 16)
            : (syncHS ? (pack.hotspotX ?? 16) : (pack.hotspotGrabbingX ?? 16));
        const y = type === 'grab'
            ? (pack.hotspotY ?? 16)
            : (syncHS ? (pack.hotspotY ?? 16) : (pack.hotspotGrabbingY ?? 16));
        const opacity  = parseFloat(cursorOpacityEl.value)    || 1;
        const tintCol  = cursorTintColor.value                 || '#ffffff';
        const tintStr  = parseFloat(cursorTintStrength.value)  || 0;
        const url = await processedCursorUrl(rawUrl, opacity, tintCol, tintStr);
        return `url('${url}') ${x} ${y}, ${type}`;
    }

    async function updateSandboxCursor(pack) {
        if (!pack) return;
        sandboxBox.style.cursor = enableCheckbox.checked ? await getCursorStyle(pack, 'grab') : '';
    }

    function resetSandboxPosition() {
        // positioning now handled by flexbox on #previewSandbox
    }

    async function applyPackState(pack, { resetPosition = true } = {}) {
        loadPackIntoUI(pack);
        await updateSandboxCursor(pack);
        if (resetPosition) resetSandboxPosition();
    }

    function setActivePack(packs, packId) {
        const pack = packs[packId] || packs[DEFAULT_ACTIVE_PACK];
        currentActivePackId = pack.id;
        currentPack = pack;
        chrome.storage.local.set({ activePackId: pack.id }, () => {
            if (chrome.runtime.lastError) { console.error('setActivePack failed:', chrome.runtime.lastError.message); return; }
            applyPackState(pack);
            renderPackGrid(packs, pack.id);
        });
    }

    function ensurePacksThen(callback) {
        getPackFromStorage(({ packs, activePackId, activePack, enableCustom, uiTheme: theme, packViewMode, osThemeSync }) => {
            const updatedPacks = mergeBuiltInPacks(packs);
            currentPackOrder = normalizePackOrder(currentPackOrder, updatedPacks);
            currentPacks = updatedPacks;
            currentActivePackId = activePackId;
            callback({ packs: updatedPacks, activePackId, activePack: updatedPacks[activePackId] || updatedPacks[DEFAULT_ACTIVE_PACK], enableCustom, theme, packViewMode, osThemeSync });
        });
    }

    // ── Pack grid ─────────────────────────────────────────────────────────────

    function renderPackGrid(packs, activeId) {
        const query = (packSearch.value || '').toLowerCase().trim();
        packGrid.innerHTML = '';

        // Sort: favorites first, then rest in order
        let orderedIds = currentPackOrder.filter(id => packs[id]);
        orderedIds.sort((a, b) => {
            const fa = packs[a]?.favorite ? 1 : 0;
            const fb = packs[b]?.favorite ? 1 : 0;
            return fb - fa;
        });

        // Filter by search query
        if (query) {
            orderedIds = orderedIds.filter(id => {
                const p = packs[id];
                if (!p) return false;
                const nameMatch = (p.name || '').toLowerCase().includes(query);
                const tagMatch = (p.tags || []).some(t => t.toLowerCase().includes(query));
                return nameMatch || tagMatch;
            });
        }

        orderedIds.forEach(packId => {
            const pack = packs[packId];
            if (!pack) return;

            const card = document.createElement('div');
            card.className = 'pack-card' + (pack.id === activeId ? ' active' : '') + (pack.readonly ? ' readonly-card' : '');
            card.dataset.packId = pack.id;
            card.draggable = true;

            card.addEventListener('dragstart', (e) => {
                dragSrcId = pack.id;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', pack.id);
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                document.querySelectorAll('.pack-card').forEach(c => c.classList.remove('drag-over'));
            });
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragSrcId && dragSrcId !== pack.id) {
                    document.querySelectorAll('.pack-card').forEach(c => c.classList.remove('drag-over'));
                    card.classList.add('drag-over');
                }
            });
            card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                if (!dragSrcId || dragSrcId === pack.id) return;
                const srcIdx = currentPackOrder.indexOf(dragSrcId);
                const dstIdx = currentPackOrder.indexOf(pack.id);
                if (srcIdx === -1 || dstIdx === -1) return;
                const newOrder = [...currentPackOrder];
                newOrder.splice(srcIdx, 1);
                newOrder.splice(dstIdx, 0, dragSrcId);
                savePackOrder(newOrder, () => renderPackGrid(packs, activeId));
                dragSrcId = null;
            });

            const makeStar = (filled) => filled
                ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="#f5c518" stroke="#f5c518" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
                : `<svg width="15" height="15" viewBox="0 0 24 24" fill="transparent" stroke="#f5c518" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

            const title = document.createElement('h4');
            title.className = 'pack-card-title';
            const titleText = document.createElement('span');
            titleText.textContent = pack.name.length > 18 ? pack.name.slice(0, 18) + '…' : pack.name;
            title.appendChild(titleText);

            // Desc icon — appended to card (not title) so absolute positioning is relative to card
            const descIcon = (() => {
                const el = document.createElement('i');
                el.className = 'info-icon pack-desc-icon';
                el.textContent = 'i';
                if (pack.description) {
                    el.dataset.desc = pack.description;
                } else {
                    el.dataset.desc = '';
                    el.dataset.noDesc = '1';
                    el.style.opacity = '0.25';
                }
                return el;
            })();

            // ── Images: always two fixed-size boxes, identical across all pack types ──
            const thumbs = document.createElement('div');
            thumbs.className = 'thumbs';
            const unavail = chrome.runtime.getURL('resources/unavailable.svg');

            const grabThumb = document.createElement('img');
            grabThumb.src = pack.grabCursor || unavail;
            grabThumb.alt = `${pack.name} grab`;
            grabThumb.onerror = () => { grabThumb.src = unavail; };

            const grabbingThumb = document.createElement('img');
            grabbingThumb.src = pack.grabbingCursor || unavail;
            grabbingThumb.alt = `${pack.name} grabbing`;
            grabbingThumb.onerror = () => { grabbingThumb.src = unavail; };

            thumbs.appendChild(grabThumb);
            thumbs.appendChild(grabbingThumb);

            // ── Tags: always present, empty if no tags (keeps layout consistent) ──
            const tagRow = document.createElement('div');
            tagRow.className = 'tag-row';
            if (pack.tags && pack.tags.length) {
                pack.tags.forEach(tag => {
                    const t = document.createElement('span');
                    t.className = 'tag';
                    t.textContent = tag.trim();
                    t.title = tag.trim();
                    tagRow.appendChild(t);
                });
            }

            // ── Fav button ──
            const favBtn = document.createElement('button');
            favBtn.type = 'button';
            favBtn.className = 'fav-btn';
            favBtn.innerHTML = makeStar(!!pack.favorite);
            favBtn.title = pack.favorite ? 'Unpin from top' : 'Pin to top';
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wasActive = !!pack.favorite;
                Object.values(currentPacks).forEach(p => { p.favorite = false; });
                pack.favorite = !wasActive;
                currentPacks[pack.id] = pack;
                savePacks(currentPacks, () => renderPackGrid(currentPacks, currentActivePackId));
            });

            // ── OLD-STYLE badge (absolute top-right) — shown in normal/compact, hidden in list ──
            const badge = document.createElement('button');
            badge.type = 'button';
            badge.className = 'badge old-badge' + (pack.id === activeId ? ' badge-active' : '');
            badge.textContent = pack.id === activeId ? 'Active' : 'Use';
            badge.disabled = pack.id === activeId;
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                if (pack.id !== activeId) setActivePack(packs, pack.id);
            });

            // ── OLD-STYLE info row (label left, fav right) — shown in normal/compact, hidden in list ──
            const infoRow = document.createElement('div');
            infoRow.className = 'card-info-row';
            if (pack.readonly) {
                const srcBadge = document.createElement('span');
                srcBadge.className = 'src-badge src-builtin';
                srcBadge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>Built-in`;
                infoRow.appendChild(srcBadge);
            } else if (pack.fromMarketplace) {
                const srcBadge = document.createElement('span');
                srcBadge.className = 'src-badge src-installed';
                srcBadge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 16l-6-6h4V4h4v6h4l-6 6zm-7 2h14v2H5v-2z"/></svg>Installed`;
                infoRow.appendChild(srcBadge);
            } else if (pack.imported) {
                const srcBadge = document.createElement('span');
                srcBadge.className = 'src-badge src-imported';
                srcBadge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg>Imported`;
                infoRow.appendChild(srcBadge);
            } else if (pack.cloned) {
                const srcBadge = document.createElement('span');
                srcBadge.className = 'src-badge src-cloned';
                srcBadge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>Cloned`;
                infoRow.appendChild(srcBadge);
            } else {
                const srcBadge = document.createElement('span');
                srcBadge.className = 'src-badge src-created';
                srcBadge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>Created`;
                infoRow.appendChild(srcBadge);
            }
            infoRow.appendChild(favBtn);

            // ── NEW-STYLE badge row — hidden in normal/compact, shown in list ──
            const badgeRow = document.createElement('div');
            badgeRow.className = 'card-badge-row';

            const useBadge = document.createElement('button');
            useBadge.type = 'button';
            useBadge.className = 'badge' + (pack.id === activeId ? ' badge-active' : '');
            useBadge.textContent = pack.id === activeId ? 'Active' : 'Use';
            useBadge.disabled = pack.id === activeId;
            useBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                if (pack.id !== activeId) setActivePack(packs, pack.id);
            });
            badgeRow.appendChild(useBadge);

            const srcSlot = document.createElement('div');
            srcSlot.className = 'src-slot';
            if (pack.readonly) {
                const srcBadge = document.createElement('span');
                srcBadge.className = 'src-badge src-builtin';
                srcBadge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>Built-in`;
                srcSlot.appendChild(srcBadge);
            } else if (pack.fromMarketplace) {
                const srcBadge = document.createElement('span');
                srcBadge.className = 'src-badge src-installed';
                srcBadge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 16l-6-6h4V4h4v6h4l-6 6zm-7 2h14v2H5v-2z"/></svg>Installed`;
                srcSlot.appendChild(srcBadge);
            } else if (pack.imported) {
                const srcBadge = document.createElement('span');
                srcBadge.className = 'src-badge src-imported';
                srcBadge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg>Imported`;
                srcSlot.appendChild(srcBadge);
            } else if (pack.cloned) {
                const srcBadge = document.createElement('span');
                srcBadge.className = 'src-badge src-cloned';
                srcBadge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>Cloned`;
                srcSlot.appendChild(srcBadge);
            } else {
                const srcBadge = document.createElement('span');
                srcBadge.className = 'src-badge src-created';
                srcBadge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>Created`;
                srcSlot.appendChild(srcBadge);
            }
            badgeRow.appendChild(srcSlot);

            const favBtn2 = document.createElement('button');
            favBtn2.type = 'button';
            favBtn2.className = 'fav-btn';
            favBtn2.innerHTML = makeStar(!!pack.favorite);
            favBtn2.title = pack.favorite ? 'Unpin from top' : 'Pin to top';
            favBtn2.addEventListener('click', (e) => {
                e.stopPropagation();
                const wasActive = !!pack.favorite;
                Object.values(currentPacks).forEach(p => { p.favorite = false; });
                pack.favorite = !wasActive;
                currentPacks[pack.id] = pack;
                savePacks(currentPacks, () => renderPackGrid(currentPacks, currentActivePackId));
            });
            badgeRow.appendChild(favBtn2);

            const actions = document.createElement('div');
            actions.className = 'pack-actions';

            if (!pack.readonly) {
                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = 'danger';
                deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deletePack(pack); });
                actions.appendChild(deleteBtn);
            }

            const cloneBtn = document.createElement('button');
            cloneBtn.type = 'button';
            cloneBtn.textContent = 'Clone';
            cloneBtn.addEventListener('click', (e) => { e.stopPropagation(); clonePack(pack); });
            actions.appendChild(cloneBtn);

            const cardBottom = document.createElement('div');
            cardBottom.className = 'card-bottom';
            cardBottom.appendChild(infoRow);
            cardBottom.appendChild(actions);

            card.appendChild(badge);     // absolute, hidden in list
            card.appendChild(title);     // top of card (normal/compact); flex:1 middle (list via CSS order)
            card.appendChild(thumbs);    // below title (normal/compact); first (list via CSS order:-1)
            card.appendChild(tagRow);    // hidden in list
            card.appendChild(cardBottom); // infoRow + actions pinned to bottom
            card.appendChild(badgeRow);  // hidden in normal/compact; shown in list
            if (descIcon) card.appendChild(descIcon); // absolute (normal/compact); after thumbs in list via CSS order

            // Hover cursor preview — show this pack's grab cursor on hover
            if (pack.grabCursor) {
                const syncHS = pack.syncHotspot !== false;
                const hx = syncHS ? (pack.hotspotX ?? 16) : (pack.hotspotGrabX ?? 16);
                const hy = syncHS ? (pack.hotspotY ?? 16) : (pack.hotspotGrabY ?? 16);
                const previewCursor = `url('${pack.grabCursor}') ${hx} ${hy}, grab`;
                card.addEventListener('mouseenter', () => { card.style.cursor = previewCursor; });
                card.addEventListener('mouseleave', () => { card.style.cursor = ''; });
            }

            card.addEventListener('click', () => { if (pack.id !== activeId) setActivePack(packs, pack.id); });
            packGrid.appendChild(card);
        });
    }

    function renderEverything() {
        chrome.storage.local.get([
            'packs', 'activePackId', 'enableCustom', 'uiTheme', 'packOrder', 'customThemes',
            'siteRules', 'packViewMode', 'osThemeSync', 'osLightTheme', 'osDarkTheme',
            'cursorOpacity', 'cursorTintColor', 'cursorTintStrength',
            'cursorTrail', 'cursorTrailColor', 'cursorTrailSize', 'cursorTrailLength', 'cursorTrailFade', 'cursorTrailScope',
            'chromeSyncEnabled', 'activeTab'
        ], (items) => {
            if (chrome.runtime.lastError) return;

            const doRender = () => {
                ensurePacksThen(({ packs, activePackId, activePack, enableCustom, theme, packViewMode, osThemeSync }) => {
                    osSyncTheme.checked = osThemeSync;
                    osLightTheme.value  = osLightThemeValue;
                    osDarkTheme.value   = osDarkThemeValue;
                    syncOsCustomOptgroups();
                    updateOsSyncUI(osThemeSync);
                    const resolvedTheme = osThemeSync ? getOsTheme() : theme;
                    applyTheme(resolvedTheme, { animate: false });
                    enableCheckbox.checked = enableCustom;
                    uiTheme.value = resolvedTheme;
                    if (!uiTheme.value) uiTheme.value = 'dark';
                    updateDeleteThemeBtn();
                    setViewMode(packViewMode || 'grid', false);
                    renderPackGrid(packs, activePackId);
                    applyPackState(activePack);
                    renderSiteRules();
                    populateRulePackSelect();
                    loadOpacityTint(items.cursorOpacity, items.cursorTintColor, items.cursorTintStrength);
                    loadTrailSettings(items);
                    chromeSyncEnabled.checked = !!items.chromeSyncEnabled;
                });
            };

            // If Chrome Sync enabled, pull latest sync data first then render
            if (items.chromeSyncEnabled) {
                pullFromSync(doRender);
            } else {
                doRender();
            }
        });
    }

    // ── Pack field updaters ───────────────────────────────────────────────────

    function updateCurrentPackField(field, value) {
        if (!currentPack) return;
        const hotspotFields = ['syncHotspot','hotspotX','hotspotY','hotspotGrabX','hotspotGrabY','hotspotGrabbingX','hotspotGrabbingY'];
        if (currentPack.readonly && !hotspotFields.includes(field)) return;
        currentPack[field] = value;
        currentPacks[currentPack.id] = currentPack;
        savePacks(currentPacks);
        if (field !== 'syncHotspot') void updateSandboxCursor(currentPack);
    }

    function updateCurrentPackHotspot(field, value) {
        if (!currentPack) return;
        currentPack[field] = value;
        currentPacks[currentPack.id] = currentPack;
        savePacks(currentPacks);
        void updateSandboxCursor(currentPack);
    }

    function updateCurrentPackName(value) {
        if (!currentPack || currentPack.readonly) return;
        currentPack.name = value;
        currentPacks[currentPack.id] = currentPack;
        savePacks(currentPacks);
        renderPackGrid(currentPacks, currentActivePackId);
    }

    function updateCurrentPackDesc(value) {
        if (!currentPack || currentPack.readonly) return;
        currentPack.description = value.trim();
        currentPacks[currentPack.id] = currentPack;
        savePacks(currentPacks);
        renderPackGrid(currentPacks, currentActivePackId);
    }

    function updateCurrentPackTags(value) {
        if (!currentPack || currentPack.readonly) return;
        currentPack.tags = value.split(',').map(t => t.trim()).filter(Boolean);
        currentPacks[currentPack.id] = currentPack;
        savePacks(currentPacks);
        renderPackGrid(currentPacks, currentActivePackId);
    }

    function updateCurrentPackCursor(key, dataUrl) {
        if (!currentPack || currentPack.readonly) return;
        currentPack[key] = dataUrl;
        currentPacks[currentPack.id] = currentPack;
        savePacks(currentPacks);
        if (key === 'grabCursor') grabPreview.src = dataUrl || getUnavailableImage();
        if (key === 'grabbingCursor') grabbingPreview.src = dataUrl || getUnavailableImage();
        void updateSandboxCursor(currentPack);
        renderPackGrid(currentPacks, currentActivePackId);
        showToast('Cursor image updated ✓');
    }

    // ── Export pack ───────────────────────────────────────────────────────────

    function doExportPack(pack) {
        const info = { id: pack.id, name: pack.name, syncHotspot: pack.syncHotspot, hotspotX: pack.hotspotX, hotspotY: pack.hotspotY, hotspotGrabX: pack.hotspotGrabX, hotspotGrabY: pack.hotspotGrabY, hotspotGrabbingX: pack.hotspotGrabbingX, hotspotGrabbingY: pack.hotspotGrabbingY };
        const toBytes = async (url, label) => {
            if (!url) throw new Error(`${label} is missing`);
            if (url.startsWith('data:')) {
                const comma = url.indexOf(',');
                const isBase64 = url.substring(0, comma).includes(';base64');
                const raw = url.substring(comma + 1);
                if (isBase64) { const bin = atob(raw); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return bytes; }
                return new TextEncoder().encode(decodeURIComponent(raw));
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error(`${label}: fetch failed (${res.status})`);
            return new Uint8Array(await res.arrayBuffer());
        };
        const folderName = pack.name.replace(/[^a-z0-9]/gi, '_') || 'pack';
        Promise.all([toBytes(pack.grabCursor, 'grab.png'), toBytes(pack.grabbingCursor, 'grabbing.png')])
            .then(([grabPng, grabbingPng]) => {
                const files = [
                    { name: `${folderName}/info.json`, data: new TextEncoder().encode(JSON.stringify(info, null, 2)) },
                    { name: `${folderName}/grab.png`, data: grabPng },
                    { name: `${folderName}/grabbing.png`, data: grabbingPng }
                ];
                downloadBlob(buildZipFromFiles(files), `${folderName}.zip`);
                showToast('Pack exported ✓');
            }).catch(err => { console.error('Export failed:', err); showToast(`Export failed: ${err.message}`, 'error'); });
    }

    // ── Import pack ───────────────────────────────────────────────────────────

    function importPackFromFiles(fileList) {
        const files = Array.from(fileList);
        const required = ['grab.png', 'grabbing.png', 'info.json'];
        const missing = required.filter(name => !files.some(f => f.name.toLowerCase() === name));
        if (missing.length) { showToast(`Missing: ${missing.join(', ')}`, 'error'); return; }
        const getFile = (name) => files.find(f => f.name.toLowerCase() === name);
        const readAsDataURL = (file) => new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = () => reject(new Error(`Failed to read ${file.name}`));
            r.readAsDataURL(file);
        });
        getFile('info.json').text().then(async infoText => {
            let info = {};
            try { info = JSON.parse(infoText); } catch (e) { console.warn('info.json parse error:', e); }
            const [grabPngData, grabbingPngData] = await Promise.all([readAsDataURL(getFile('grab.png')), readAsDataURL(getFile('grabbing.png'))]);
            // Extract folder path from webkitRelativePath if available
            const anyFile = files.find(f => f.webkitRelativePath);
            const folderPath = anyFile ? anyFile.webkitRelativePath.split('/').slice(0, -1).join('/') : '';
            ensurePacksThen(({ packs }) => {
                const id = createPackId(info.name || 'imported-pack');
                const newPack = { id, name: info.name || 'Imported Pack', readonly: false, imported: true, grabCursor: grabPngData, grabbingCursor: grabbingPngData, syncHotspot: info.syncHotspot !== false, hotspotX: info.hotspotX ?? 16, hotspotY: info.hotspotY ?? 16, hotspotGrabX: info.hotspotGrabX ?? 16, hotspotGrabY: info.hotspotGrabY ?? 16, hotspotGrabbingX: info.hotspotGrabbingX ?? 16, hotspotGrabbingY: info.hotspotGrabbingY ?? 16, folderPath };
                packs[id] = newPack;
                const newOrder = [...currentPackOrder.filter(i => packs[i]), id];
                savePackOrder(newOrder, () => savePacks(packs, () => { setActivePack(packs, id); showToast('Pack imported ✓'); }));
            });
        }).catch(err => { console.error('Import failed:', err); showToast(`Import failed: ${err.message}`, 'error'); });
    }

    // ── Pack operations ───────────────────────────────────────────────────────

    function createNewPack() {
        ensurePacksThen(({ packs }) => {
            const id = createPackId('New Pack');
            const newPack = { id, name: 'New Pack', readonly: false, grabCursor: null, grabbingCursor: null, syncHotspot: true, hotspotX: 16, hotspotY: 16, hotspotGrabX: 16, hotspotGrabY: 16, hotspotGrabbingX: 16, hotspotGrabbingY: 16, tags: [], favorite: false };
            packs[id] = newPack;
            const newOrder = [...currentPackOrder.filter(i => packs[i]), id];
            savePackOrder(newOrder, () => savePacks(packs, () => { setActivePack(packs, id); showToast('New pack created ✓'); }));
        });
    }

    function clonePack(pack) {
        ensurePacksThen(({ packs }) => {
            const id = createPackId((pack.name || 'Pack') + '-clone');
            const clone = { ...pack, id, name: (pack.name || 'Pack') + ' (copy)', readonly: false, imported: false, cloned: true };
            packs[id] = clone;
            const newOrder = [...currentPackOrder.filter(i => packs[i]), id];
            savePackOrder(newOrder, () => savePacks(packs, () => { setActivePack(packs, id); renderPackGrid(packs, id); showToast('Pack cloned ✓'); }));
        });
    }

    function deletePack(pack) {
        if (!pack || pack.readonly) return;
        ensurePacksThen(({ packs }) => {
            delete packs[pack.id];
            const newOrder = currentPackOrder.filter(id => id !== pack.id);
            savePackOrder(newOrder, () => savePacks(packs, () => {
                setActivePack(packs, DEFAULT_ACTIVE_PACK);
                renderPackGrid(packs, DEFAULT_ACTIVE_PACK);
                showToast('Pack deleted');
                // If it was a marketplace pack, decrement counter + live-update card
                if (pack.fromMarketplace) {
                    mktInstalledMap.delete(pack.id);
                    countDecrement(pack.id).then(() => countGet(pack.id)).then(newCount => {
                        const entry = mktAllPacks.find(p => p.id === pack.id);
                        if (entry && newCount !== null) {
                            entry.downloads = newCount;
                            const card = mktGrid.querySelector(`[data-pack-id="${pack.id}"]`);
                            if (card) {
                                const dl = card.querySelector('.mkt-downloads');
                                if (dl) dl.textContent = `⬇ ${newCount.toLocaleString()}`;
                                // Restore install button
                                const btn = card.querySelector('.mkt-install-btn');
                                if (btn) {
                                    btn.textContent = 'Install';
                                    btn.className = 'mkt-install-btn';
                                    btn.disabled = false;
                                    btn.onclick = () => installMktPack(entry, btn, false);
                                }
                            }
                        }
                    });
                }
            }));
        });
    }

    // ── Site rules ────────────────────────────────────────────────────────────

    function populateRulePackSelect() {
        newRulePack.innerHTML = '';
        const orderedIds = currentPackOrder.filter(id => currentPacks[id]);
        orderedIds.forEach(id => {
            const p = currentPacks[id];
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = p.name;
            newRulePack.appendChild(opt);
        });
    }

    function renderSiteRules() {
        siteRulesContainer.innerHTML = '';
        if (!siteRules.length) {
            siteRulesContainer.innerHTML = '<div class="small" style="padding:0.4rem 0; opacity:0.6;">No rules yet.</div>';
            return;
        }
        siteRules.forEach((rule, idx) => {
            const row = document.createElement('div');
            row.className = 'site-rule-row';
            const domainSpan = document.createElement('span');
            domainSpan.style.cssText = 'flex:1; font-size:0.9rem; font-weight:600;';
            domainSpan.textContent = rule.domain;
            const actionSpan = document.createElement('span');
            actionSpan.style.cssText = 'font-size:0.85rem; opacity:0.75;';
            if (rule.action === 'disable') {
                actionSpan.textContent = '🚫 Disable extension';
            } else {
                const p = currentPacks[rule.packId];
                actionSpan.textContent = `🗂️ Use: ${p ? p.name : rule.packId}`;
            }
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'danger';
            delBtn.textContent = 'Remove';
            delBtn.addEventListener('click', () => {
                const newRules = siteRules.filter((_, i) => i !== idx);
                saveSiteRules(newRules, () => { renderSiteRules(); showToast('Rule removed'); });
            });
            row.appendChild(domainSpan);
            row.appendChild(actionSpan);
            row.appendChild(delBtn);
            siteRulesContainer.appendChild(row);
        });
    }

    newRuleAction.addEventListener('change', () => {
        newRulePack.style.display = newRuleAction.value === 'pack' ? '' : 'none';
    });

    addRuleBtn.addEventListener('click', () => {
        const domain = newRuleDomain.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
        if (!domain) { showToast('Enter a domain', 'error'); return; }
        if (siteRules.some(r => r.domain === domain)) { showToast('Rule already exists', 'error'); return; }
        const rule = { domain, action: newRuleAction.value };
        if (rule.action === 'pack') rule.packId = newRulePack.value;
        const newRules = [...siteRules, rule];
        saveSiteRules(newRules, () => { newRuleDomain.value = ''; renderSiteRules(); showToast('Rule added ✓'); });
    });

    // ── Event listeners ───────────────────────────────────────────────────────

    packName.addEventListener('input', () => updateCurrentPackName(packName.value));
    packDesc.addEventListener('input', () => updateCurrentPackDesc(packDesc.value));
    packTags.addEventListener('input', () => updateCurrentPackTags(packTags.value));
    packSearch.addEventListener('input', () => renderPackGrid(currentPacks, currentActivePackId));

    grabUrl.addEventListener('change', () => { if (grabUrl.value) updateCurrentPackCursor('grabCursor', grabUrl.value); });
    grabbingUrl.addEventListener('change', () => { if (grabbingUrl.value) updateCurrentPackCursor('grabbingCursor', grabbingUrl.value); });

    grabInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) { showToast('SVG not supported — use PNG', 'error'); e.target.value = ''; return; }
            const reader = new FileReader();
            reader.onerror = () => showToast('Failed to read file', 'error');
            reader.onload = () => updateCurrentPackCursor('grabCursor', reader.result);
            reader.readAsDataURL(file);
        }
    });

    grabbingInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) { showToast('SVG not supported — use PNG', 'error'); e.target.value = ''; return; }
            const reader = new FileReader();
            reader.onerror = () => showToast('Failed to read file', 'error');
            reader.onload = () => updateCurrentPackCursor('grabbingCursor', reader.result);
            reader.readAsDataURL(file);
        }
    });

    enableCheckbox.addEventListener('change', async () => {
        saveSetting('enableCustom', enableCheckbox.checked);
        if (chromeSyncEnabled.checked) pushToSync();
        sandboxBox.style.cursor = enableCheckbox.checked ? await getCursorStyle(currentPack, 'grab') : '';
        showToast(enableCheckbox.checked ? 'Extension enabled ✓' : 'Extension disabled');
    });

    syncHotspot.addEventListener('change', () => {
        updateCurrentPackField('syncHotspot', syncHotspot.checked);
        if (!syncHotspot.checked) {
            const sx = parseInt(hotspotX.value, 10) || 0;
            const sy = parseInt(hotspotY.value, 10) || 0;
            hotspotGrabX.value = sx; updateCurrentPackHotspot('hotspotGrabX', sx);
            hotspotGrabY.value = sy; updateCurrentPackHotspot('hotspotGrabY', sy);
            hotspotGrabbingX.value = sx; updateCurrentPackHotspot('hotspotGrabbingX', sx);
            hotspotGrabbingY.value = sy; updateCurrentPackHotspot('hotspotGrabbingY', sy);
        }
        updateHotspotUI();
    });

    hotspotX.addEventListener('input', () => { const v = parseInt(hotspotX.value,10); if (!isNaN(v)) updateCurrentPackHotspot('hotspotX', v); });
    hotspotY.addEventListener('input', () => { const v = parseInt(hotspotY.value,10); if (!isNaN(v)) updateCurrentPackHotspot('hotspotY', v); });
    hotspotGrabX.addEventListener('input', () => { const v = parseInt(hotspotGrabX.value,10); if (!isNaN(v)) updateCurrentPackHotspot('hotspotGrabX', v); });
    hotspotGrabY.addEventListener('input', () => { const v = parseInt(hotspotGrabY.value,10); if (!isNaN(v)) updateCurrentPackHotspot('hotspotGrabY', v); });
    hotspotGrabbingX.addEventListener('input', () => { const v = parseInt(hotspotGrabbingX.value,10); if (!isNaN(v)) updateCurrentPackHotspot('hotspotGrabbingX', v); });
    hotspotGrabbingY.addEventListener('input', () => { const v = parseInt(hotspotGrabbingY.value,10); if (!isNaN(v)) updateCurrentPackHotspot('hotspotGrabbingY', v); });

    // ── Theme UI ──────────────────────────────────────────────────────────────

    function updateDeleteThemeBtn() {
        const val = uiTheme.value;
        const isCustom = !BUILTIN_THEMES.includes(val) && !!customThemes[val];
        const isBuiltin = BUILTIN_THEMES.includes(val);
        deleteSelectedThemeBtn.style.display = isCustom ? '' : 'none';
        cloneSelectedThemeBtn.style.display = (isCustom || isBuiltin) ? '' : 'none';
    }

    uiTheme.addEventListener('change', () => {
        applyTheme(uiTheme.value);
        saveSetting('uiTheme', uiTheme.value);
        updateDeleteThemeBtn();
    });

    cloneSelectedThemeBtn.addEventListener('click', () => {
        const val = uiTheme.value;
        let vars, name, mode;
        if (BUILTIN_THEMES.includes(val)) {
            vars = { ...BUILTIN_THEME_VARS[val] };
            name = uiTheme.options[uiTheme.selectedIndex].text + ' (copy)';
            const LIGHT_THEMES = ['light', 'coastal', 'parchment', 'sakura'];
            mode = LIGHT_THEMES.includes(val) ? 'light' : 'dark';
        } else if (customThemes[val]) {
            vars = { ...customThemes[val].vars };
            name = customThemes[val].name + ' (copy)';
            mode = customThemes[val].mode || 'dark';
        } else return;
        openThemeEditor(null);
        themeNameInput.value = name;
        themeMode.value = mode;
        Object.keys(te).forEach(k => { if (vars[k]) te[k].value = vars[k]; });
    });

    deleteSelectedThemeBtn.addEventListener('click', async () => {
        const id = uiTheme.value;
        const ct = customThemes[id];
        if (!ct) return;
        if (!await showConfirm({ title: 'Delete theme', message: `"${ct.name}" will be permanently removed.`, okLabel: 'Delete' })) return;
        const styleEl = document.getElementById(`custom-theme-style-${id}`);
        if (styleEl) styleEl.remove();
        delete customThemes[id];
        saveCustomThemes(() => {
            loadCustomThemes(customThemes);
            uiTheme.value = 'dark';
            applyTheme('dark');
            saveSetting('uiTheme', 'dark');
            updateDeleteThemeBtn();
            showToast('Theme deleted');
        });
    });

    newThemeBtn.addEventListener('click', () => openThemeEditor(null));
    cancelThemeBtn.addEventListener('click', closeThemeEditor);

    Object.values(te).forEach(input => {
        input.addEventListener('input', () => {
            if (themeEditorForm.style.display === 'none') return;
            const preview = { id: editingThemeId || '__preview__', name: 'preview', vars: { bg: te.bg.value, text: te.text.value, card: te.card.value, panel: te.panel.value, accent: te.accent.value, proper: te.proper.value } };
            injectCustomThemeStyle(preview);
            document.body.className = document.body.className.replace(/theme-\S+/g, '').trim();
            document.body.classList.add(`theme-custom-${preview.id}`);
        });
    });

    saveThemeBtn.addEventListener('click', () => {
        const name = themeNameInput.value.trim();
        if (!name) { showToast('Enter a theme name', 'error'); return; }
        const id = editingThemeId || `custom-${Date.now()}`;
        const ct = { id, name, mode: themeMode.value || 'dark', vars: { bg: te.bg.value, text: te.text.value, card: te.card.value, panel: te.panel.value, accent: te.accent.value, proper: te.proper.value } };
        customThemes[id] = ct;
        injectCustomThemeStyle(ct);
        saveCustomThemes(() => {
            loadCustomThemes(customThemes);
            uiTheme.value = id;
            applyTheme(id);
            saveSetting('uiTheme', id);
            updateDeleteThemeBtn();
            closeThemeEditor();
            showToast('Theme saved ✓');
        });
    });

    deleteThemeBtn.addEventListener('click', async () => {
        if (!editingThemeId) return;
        if (!await showConfirm({ title: 'Delete theme', message: `"${customThemes[editingThemeId]?.name}" will be permanently removed.`, okLabel: 'Delete' })) return;
        const styleEl = document.getElementById(`custom-theme-style-${editingThemeId}`);
        if (styleEl) styleEl.remove();
        delete customThemes[editingThemeId];
        saveCustomThemes(() => {
            loadCustomThemes(customThemes);
            const currentVal = uiTheme.value;
            if (currentVal === editingThemeId) { uiTheme.value = 'dark'; applyTheme('dark'); saveSetting('uiTheme', 'dark'); }
            closeThemeEditor();
            showToast('Theme deleted');
        });
    });

    exportThemeBtn.addEventListener('click', () => {
        const current = uiTheme.value;
        if (BUILTIN_THEMES.includes(current)) { showToast('Select a custom theme to export', 'error'); return; }
        const ct = customThemes[current];
        if (!ct) { showToast('No custom theme selected', 'error'); return; }
        downloadBlob(new Blob([JSON.stringify(ct, null, 2)], { type: 'application/json' }), `theme-${ct.name.replace(/[^a-z0-9]/gi,'_') || 'custom'}.json`);
        showToast('Theme exported ✓');
    });

    importThemeBtn.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onerror = () => showToast('Failed to read file', 'error');
        reader.onload = () => {
            let ct;
            try { ct = JSON.parse(reader.result); } catch { showToast('Invalid JSON', 'error'); return; }
            if (!ct.name || !ct.vars) { showToast('Invalid theme file', 'error'); return; }
            ct.id = `custom-${Date.now()}`;
            ct.mode = ct.mode || 'dark';
            customThemes[ct.id] = ct;
            injectCustomThemeStyle(ct);
            saveCustomThemes(() => {
                loadCustomThemes(customThemes);
                uiTheme.value = ct.id;
                applyTheme(ct.id);
                saveSetting('uiTheme', ct.id);
                updateDeleteThemeBtn();
                showToast('Theme imported ✓');
            });
            e.target.value = '';
        };
        reader.readAsText(file);
    });

    // ── Pack buttons ──────────────────────────────────────────────────────────

    newPackBtn.addEventListener('click', createNewPack);
    exportPackBtn.addEventListener('click', () => { ensurePacksThen(({ packs, activePackId }) => { const pack = packs[activePackId]; if (pack) doExportPack(pack); }); });
    importPackFolder.addEventListener('change', (e) => { if (e.target.files && e.target.files.length) { importPackFromFiles(e.target.files); e.target.value = ''; } });

    // ── Sandbox ───────────────────────────────────────────────────────────────

    let isMouseDown = false;
    let sandboxInsideGrab = false; // tracks whether cursor is on sandbox with a grab cursor

    sandboxBox.addEventListener('mouseenter', async () => {
        sandboxMouseInside   = true;
        sandboxInsideGrab    = true;
        if (!currentPack || !enableCheckbox.checked) { sandboxBox.style.cursor = ''; return; }
        sandboxBox.style.cursor = await getCursorStyle(currentPack, isMouseDown ? 'grabbing' : 'grab');
    });
    sandboxBox.addEventListener('mouseleave', () => {
        sandboxInsideGrab  = false;
        sandboxMouseInside = false;
        sandboxTrailDots.forEach(d => { d.style.left = '-999px'; d.style.top = '-999px'; });
        sandboxTrailPositions.length = 0;
    });
    sandboxBox.addEventListener('mousedown', async (e) => {
        if (e.button !== 0 || !currentPack || !enableCheckbox.checked) return;
        isMouseDown = true;
        sandboxBox.style.cursor = await getCursorStyle(currentPack, 'grabbing');
    });
    document.addEventListener('mouseup', async () => {
        isMouseDown = false;
        if (!currentPack || !enableCheckbox.checked) { sandboxBox.style.cursor = ''; return; }
        sandboxBox.style.cursor = await getCursorStyle(currentPack, 'grab');
    });

    // ── Sandbox trail ─────────────────────────────────────────────────────────

    // We keep a single persistent trail instance on the sandbox and rebuild
    // it whenever trail settings change, instead of destroying/recreating the RAF.

    let sandboxTrailDots     = [];
    let sandboxTrailPositions = [];
    let sandboxTrailRaf      = null;
    let sandboxMouseInside   = false;

    const sandboxTrailContainer = document.createElement('div');
    sandboxTrailContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;border-radius:inherit;z-index:10;';
    // Make sandboxBox relatively positioned so absolute children work
    sandboxBox.style.position = 'relative';
    sandboxBox.appendChild(sandboxTrailContainer);

    function buildSandboxTrail() {
        // Clear existing dots
        sandboxTrailContainer.innerHTML = '';
        sandboxTrailDots = [];
        sandboxTrailPositions = [];

        if (!trailEnabledEl.checked) return;

        const color  = trailColorEl.value  || '#7cbbff';
        const size   = parseInt(trailSizeEl.value)   || 8;
        const length = parseInt(trailLengthEl.value) || 8;
        const fade   = trailFadeEl.checked;
        const baseOp = parseFloat(trailOpacityEl.value) || 0.9;

        for (let i = 0; i < length; i++) {
            const dot      = document.createElement('div');
            const fraction = i / Math.max(length - 1, 1);
            const opacity  = fade ? (1 - fraction) * baseOp : baseOp;
            const scale    = fade ? 1 - fraction * 0.5 : 1;
            dot.style.cssText = [
                'position:absolute',
                `width:${size}px`,
                `height:${size}px`,
                'border-radius:50%',
                `background:${color}`,
                `opacity:${opacity.toFixed(3)}`,
                `transform:translate(-50%,-50%) scale(${scale.toFixed(3)})`,
                'pointer-events:none',
                'will-change:left,top',
                'left:-999px',
                'top:-999px'
            ].join(';');
            sandboxTrailContainer.appendChild(dot);
            sandboxTrailDots.push(dot);
            sandboxTrailPositions.push({ x: -999, y: -999 });
        }
    }

    // Separate mousemove listener on the sandboxBox — positions relative to the box
    sandboxBox.addEventListener('mousemove', (e) => {
        if (!trailEnabledEl.checked) return;
        const scope = trailScopeGrabEl.checked ? 'grab-only' : 'all';
        if (scope === 'grab-only' && !sandboxInsideGrab) return;
        const rect = sandboxBox.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        sandboxTrailPositions.unshift({ x, y });
        if (sandboxTrailPositions.length > sandboxTrailDots.length) sandboxTrailPositions.length = sandboxTrailDots.length;
    }, { passive: true });

    (function animateSandboxTrail() {
        if (sandboxMouseInside && trailEnabledEl.checked) {
            for (let i = 0; i < sandboxTrailDots.length; i++) {
                const p = sandboxTrailPositions[i] || { x: -999, y: -999 };
                sandboxTrailDots[i].style.left = p.x + 'px';
                sandboxTrailDots[i].style.top  = p.y + 'px';
            }
        }
        requestAnimationFrame(animateSandboxTrail);
    })();

    // Rebuild trail whenever any trail setting changes
    function rebuildSandboxTrailOnChange() {
        buildSandboxTrail();
    }
    trailEnabledEl.addEventListener('change', rebuildSandboxTrailOnChange);
    trailColorEl.addEventListener('input',   rebuildSandboxTrailOnChange);
    trailSizeEl.addEventListener('input',    rebuildSandboxTrailOnChange);
    trailLengthEl.addEventListener('input',  rebuildSandboxTrailOnChange);
    trailFadeEl.addEventListener('change',   rebuildSandboxTrailOnChange);
    trailOpacityEl.addEventListener('input', rebuildSandboxTrailOnChange);

    buildSandboxTrail(); // initial build

    // ── Progress modal ────────────────────────────────────────────────────────

    const progressOverlay  = document.getElementById('progress-overlay');
    const progressTitle    = document.getElementById('progress-title');
    const progressStatus   = document.getElementById('progress-status');
    const progressBarFill  = document.getElementById('progress-bar-fill');
    const progressDetail   = document.getElementById('progress-detail');

    function showProgress(title) {
        progressTitle.textContent  = title;
        progressStatus.textContent = '';
        progressDetail.textContent = '';
        progressBarFill.style.width = '0%';
        progressOverlay.classList.add('show');
    }
    function updateProgress(pct, status, detail = '') {
        progressBarFill.style.width = Math.round(pct) + '%';
        progressStatus.textContent  = status;
        progressDetail.textContent  = detail;
    }
    function hideProgress() {
        progressOverlay.classList.remove('show');
    }

    // ── Settings export / import ──────────────────────────────────────────────

    function metaFields(pack) {
        return {
            id: pack.id, name: pack.name,
            syncHotspot: pack.syncHotspot,
            hotspotX: pack.hotspotX, hotspotY: pack.hotspotY,
            hotspotGrabX: pack.hotspotGrabX, hotspotGrabY: pack.hotspotGrabY,
            hotspotGrabbingX: pack.hotspotGrabbingX, hotspotGrabbingY: pack.hotspotGrabbingY,
            tags: pack.tags || [], favorite: pack.favorite || false,
            description: pack.description || '', author: pack.author || '',
        };
    }

    exportBtn.addEventListener('click', () => {
        chrome.storage.local.get(['uiTheme', 'enableCustom', 'packs', 'packOrder', 'customThemes', 'siteRules',
            'cursorOpacity', 'cursorTintColor', 'cursorTintStrength',
            'cursorTrail', 'cursorTrailColor', 'cursorTrailSize', 'cursorTrailLength',
            'cursorTrailFade', 'cursorTrailOpacity', 'cursorTrailScope', 'chromeSyncEnabled'], (items) => {
            if (chrome.runtime.lastError) { showToast('Export failed', 'error'); return; }
            const packsExport = {};
            Object.entries(items.packs || {}).forEach(([id, pack]) => {
                const base = metaFields(pack);
                if (pack.fromMarketplace) {
                    // Marketplace pack — save URLs for re-download, no base64
                    packsExport[id] = { ...base, _type: 'marketplace', grabUrl: pack.grabUrl, grabbingUrl: pack.grabbingUrl, installedAt: pack.installedAt || '' };
                } else if (pack.readonly) {
                    // Built-in pack — just save the id and meta, images come from extension resources
                    packsExport[id] = { ...base, _type: 'builtin' };
                } else {
                    // Custom/folder pack — save base64 + folder path hint
                    packsExport[id] = { ...base, _type: 'custom', grabCursor: pack.grabCursor, grabbingCursor: pack.grabbingCursor, folderPath: pack.folderPath || '' };
                }
            });
            const exportData = {
                _version: 2,
                uiTheme: items.uiTheme || 'dark',
                enableCustom: items.enableCustom !== false,
                packOrder: items.packOrder || [],
                customThemes: items.customThemes || {},
                siteRules: items.siteRules || [],
                cursorOpacity: items.cursorOpacity,
                cursorTintColor: items.cursorTintColor,
                cursorTintStrength: items.cursorTintStrength,
                cursorTrail: items.cursorTrail,
                cursorTrailColor: items.cursorTrailColor,
                cursorTrailSize: items.cursorTrailSize,
                cursorTrailLength: items.cursorTrailLength,
                cursorTrailFade: items.cursorTrailFade,
                cursorTrailOpacity: items.cursorTrailOpacity,
                cursorTrailScope: items.cursorTrailScope,
                chromeSyncEnabled: items.chromeSyncEnabled,
                packs: packsExport,
            };
            downloadBlob(new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }), 'custom-grab-settings.json');
            showToast('Settings exported ✓');
        });
    });

    async function importSettingsFromObject(imported) {
        // Collect packs by type
        const importedPacks = imported.packs || {};
        const builtinPacks     = Object.values(importedPacks).filter(p => p._type === 'builtin');
        const marketplacePacks = Object.values(importedPacks).filter(p => p._type === 'marketplace');
        const customPacks      = Object.values(importedPacks).filter(p => p._type === 'custom');
        // Legacy exports (no _type) treated as custom
        const legacyPacks      = Object.values(importedPacks).filter(p => !p._type);

        const totalSteps = 1 + marketplacePacks.length + customPacks.length + legacyPacks.length;
        let step = 0;

        function tick(status, detail = '') {
            step++;
            updateProgress((step / totalSteps) * 100, status, detail);
        }

        showProgress('Importing settings…');

        // Apply non-pack settings immediately
        const updates = {};
        if (imported.uiTheme) updates.uiTheme = imported.uiTheme;
        if (typeof imported.enableCustom === 'boolean') updates.enableCustom = imported.enableCustom;
        if (imported.customThemes && typeof imported.customThemes === 'object') updates.customThemes = imported.customThemes;
        if (Array.isArray(imported.siteRules)) updates.siteRules = imported.siteRules;
        if (Array.isArray(imported.packOrder)) updates.packOrder = imported.packOrder;
        const trailKeys = ['cursorOpacity','cursorTintColor','cursorTintStrength','cursorTrail','cursorTrailColor','cursorTrailSize','cursorTrailLength','cursorTrailFade','cursorTrailOpacity','cursorTrailScope','chromeSyncEnabled'];
        trailKeys.forEach(k => { if (imported[k] !== undefined) updates[k] = imported[k]; });

        // Load existing packs to merge into
        const existingPacks = await new Promise(res => chrome.storage.local.get(['packs'], i => res(i.packs || {})));

        tick('Restoring settings…');

        // Builtin packs — just restore meta, images already in extension
        builtinPacks.forEach(src => {
            if (existingPacks[src.id]) Object.assign(existingPacks[src.id], metaFields(src));
        });

        // Custom packs — restore from base64
        for (const src of [...customPacks, ...legacyPacks]) {
            tick(`Restoring pack: ${src.name || src.id}`, src.folderPath ? `From: ${src.folderPath}` : '');
            if (src.grabCursor && src.grabbingCursor) {
                existingPacks[src.id] = {
                    ...metaFields(src),
                    grabCursor: src.grabCursor,
                    grabbingCursor: src.grabbingCursor,
                    folderPath: src.folderPath || '',
                    readonly: false,
                    fromMarketplace: false,
                };
            }
        }

        // Marketplace packs — re-download images with progress
        async function toDataURL(url) {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            return new Promise((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(r.result);
                r.onerror = reject;
                r.readAsDataURL(blob);
            });
        }

        for (const src of marketplacePacks) {
            tick(`Downloading: ${src.name || src.id}`, src.grabUrl || '');
            try {
                const [grabData, grabbingData] = await Promise.all([toDataURL(src.grabUrl), toDataURL(src.grabbingUrl)]);
                existingPacks[src.id] = {
                    ...metaFields(src),
                    grabCursor: grabData,
                    grabbingCursor: grabbingData,
                    grabUrl: src.grabUrl,
                    grabbingUrl: src.grabbingUrl,
                    installedAt: src.installedAt || '',
                    fromMarketplace: true,
                    readonly: false,
                };
            } catch(e) {
                updateProgress((step / totalSteps) * 100, `⚠️ Failed: ${src.name || src.id}`, e.message);
                await new Promise(r => setTimeout(r, 800)); // brief pause so user sees the error
            }
        }

        updates.packs = existingPacks;
        await new Promise((res, rej) => chrome.storage.local.set(updates, () => chrome.runtime.lastError ? rej() : res()));

        updateProgress(100, 'Done!');
        await new Promise(r => setTimeout(r, 600));
        hideProgress();
        renderEverything();
        showToast('Settings imported ✓');
    }

    importBtn.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        e.target.value = '';
        let parsed;
        try { parsed = JSON.parse(await file.text()); } catch { showToast('Invalid JSON', 'error'); return; }
        await importSettingsFromObject(parsed);
    });

    // ── Reset ─────────────────────────────────────────────────────────────────

    resetBtn.addEventListener('click', async () => {
        if (!await showConfirm({ title: 'Reset to defaults', message: 'All settings, custom themes, and site rules will be cleared. This cannot be undone.', okLabel: 'Reset' })) return;
        chrome.storage.local.clear(() => {
            if (chrome.runtime.lastError) { showToast('Reset failed', 'error'); return; }
            renderEverything();
            showToast('Settings reset');
        });
    });

    // ── Opacity & tint ────────────────────────────────────────────────────────

    cursorOpacityEl.addEventListener('input', () => {
        const v = parseFloat(cursorOpacityEl.value);
        cursorOpacityVal.textContent = Math.round(v * 100) + '%';
        saveSetting('cursorOpacity', v);
        _processedUrlCache.clear();
        void updateSandboxCursor(currentPack);
    });

    cursorTintColor.addEventListener('input', () => {
        saveSetting('cursorTintColor', cursorTintColor.value);
        _processedUrlCache.clear();
        void updateSandboxCursor(currentPack);
    });

    cursorTintStrength.addEventListener('input', () => {
        const v = parseFloat(cursorTintStrength.value);
        cursorTintStrengthVal.textContent = Math.round(v * 100) + '%';
        saveSetting('cursorTintStrength', v);
        _processedUrlCache.clear();
        void updateSandboxCursor(currentPack);
    });

    function loadOpacityTint(opacity, tintColor, tintStrength) {
        cursorOpacityEl.value           = opacity ?? 1;
        cursorOpacityVal.textContent    = Math.round((opacity ?? 1) * 100) + '%';
        cursorTintColor.value           = tintColor || '#ffffff';
        cursorTintStrength.value        = tintStrength ?? 0;
        cursorTintStrengthVal.textContent = Math.round((tintStrength ?? 0) * 100) + '%';
    }

    // ── Trail controls ────────────────────────────────────────────────────────

    function updateTrailOptionsVisibility() {
        trailOptions.style.opacity      = trailEnabledEl.checked ? '1' : '0.4';
        trailOptions.style.pointerEvents = trailEnabledEl.checked ? '' : 'none';
    }

    trailEnabledEl.addEventListener('change', () => {
        saveSetting('cursorTrail', trailEnabledEl.checked);
        updateTrailOptionsVisibility();
    });

    trailColorEl.addEventListener('input', () => saveSetting('cursorTrailColor', trailColorEl.value));

    trailSizeEl.addEventListener('input', () => {
        trailSizeVal.textContent = trailSizeEl.value + 'px';
        saveSetting('cursorTrailSize', parseInt(trailSizeEl.value));
    });

    trailLengthEl.addEventListener('input', () => {
        trailLengthVal.textContent = trailLengthEl.value;
        saveSetting('cursorTrailLength', parseInt(trailLengthEl.value));
    });

    trailFadeEl.addEventListener('change', () => saveSetting('cursorTrailFade', trailFadeEl.checked));

    trailOpacityEl.addEventListener('input', () => {
        const v = parseFloat(trailOpacityEl.value);
        trailOpacityVal.textContent = Math.round(v * 100) + '%';
        saveSetting('cursorTrailOpacity', v);
        rebuildSandboxTrailOnChange();
    });

    [trailScopeAllEl, trailScopeGrabEl].forEach(r => {
        r.addEventListener('change', () => saveSetting('cursorTrailScope', r.value));
    });

    function loadTrailSettings(s) {
        trailEnabledEl.checked     = !!s.cursorTrail;
        trailColorEl.value         = s.cursorTrailColor  || '#7cbbff';
        trailSizeEl.value          = s.cursorTrailSize   || 8;
        trailSizeVal.textContent   = (s.cursorTrailSize  || 8) + 'px';
        trailLengthEl.value        = s.cursorTrailLength || 8;
        trailLengthVal.textContent = (s.cursorTrailLength || 8);
        trailFadeEl.checked        = s.cursorTrailFade !== false;
        trailOpacityEl.value       = s.cursorTrailOpacity ?? 0.9;
        trailOpacityVal.textContent = Math.round((s.cursorTrailOpacity ?? 0.9) * 100) + '%';
        const scope = s.cursorTrailScope || 'all';
        trailScopeAllEl.checked  = scope === 'all';
        trailScopeGrabEl.checked = scope === 'grab-only';
        updateTrailOptionsVisibility();
    }

    // ── Chrome Sync ───────────────────────────────────────────────────────────

    chromeSyncEnabled.addEventListener('change', () => {
        const enabled = chromeSyncEnabled.checked;
        saveSetting('chromeSyncEnabled', enabled);
        if (enabled) pushToSync();
        showToast(enabled ? 'Chrome Sync enabled ✓' : 'Chrome Sync disabled');
    });

    function pushToSync() {
        chrome.storage.local.get(['activePackId', 'enableCustom', 'uiTheme', 'packOrder',
            'siteRules', 'osThemeSync', 'osLightTheme', 'osDarkTheme',
            'cursorTrail', 'cursorTrailColor', 'cursorTrailSize', 'cursorTrailLength', 'cursorTrailFade', 'cursorTrailScope',
            'cursorOpacity', 'cursorTintColor', 'cursorTintStrength'], (items) => {
            // Strip image data — sync storage has 100KB limit per item
            const syncData = {};
            Object.entries(items).forEach(([k, v]) => {
                if (typeof v !== 'string' || !v.startsWith('data:')) syncData[k] = v;
            });
            chrome.storage.sync.set(syncData);
        });
    }

    function pullFromSync(cb) {
        chrome.storage.sync.get(null, (syncItems) => {
            if (chrome.runtime.lastError || !syncItems || !Object.keys(syncItems).length) { if (cb) cb(); return; }
            chrome.storage.local.set(syncItems, () => { if (cb) cb(); });
        });
    }

    // ── Stats tab ─────────────────────────────────────────────────────────────

    function renderStats() {
        chrome.storage.local.get(['stats'], (items) => {
            const stats = items.stats || {};
            const totalVisits  = stats.totalVisits  || 0;
            const sites        = stats.sites        || {};
            const packUsage    = stats.packUsage    || {};
            const dailyVisits  = stats.dailyVisits  || {};

            document.getElementById('statTotalVisits').textContent  = totalVisits.toLocaleString();
            document.getElementById('statUniqueSites').textContent  = Object.keys(sites).length;

            const topPack = Object.values(packUsage).sort((a, b) => b.count - a.count)[0];
            document.getElementById('statTopPack').textContent = topPack ? topPack.name : '—';

            // Daily chart (last 60 days)
            const chart = document.getElementById('statsChart');
            chart.innerHTML = '';
            const today = new Date();
            const days = [];
            for (let i = 59; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                days.push(d.toISOString().slice(0, 10));
            }
            const maxDay = Math.max(1, ...days.map(d => dailyVisits[d] || 0));
            days.forEach(d => {
                const count = dailyVisits[d] || 0;
                const bar = document.createElement('div');
                bar.className = 'chart-bar';
                bar.style.height = Math.max(2, Math.round((count / maxDay) * 96)) + 'px';
                bar.title = `${d}: ${count} visit${count !== 1 ? 's' : ''}`;
                chart.appendChild(bar);
            });

            // Pack bars
            const packBars = document.getElementById('statsPackBars');
            packBars.innerHTML = '';
            const sortedPacks = Object.values(packUsage).sort((a, b) => b.count - a.count).slice(0, 8);
            const maxPack = Math.max(1, ...sortedPacks.map(p => p.count));
            sortedPacks.forEach(p => {
                const row = document.createElement('div');
                row.className = 'stat-bar-row';
                row.innerHTML = `<span class="bar-label">${p.name}</span>
                    <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${Math.round(p.count/maxPack*100)}%"></div></div>
                    <span class="stat-bar-count">${p.count}</span>`;
                packBars.appendChild(row);
            });
            if (!sortedPacks.length) packBars.innerHTML = '<div class="small" style="opacity:0.5;">No data yet — visit some pages.</div>';

            // Site bars
            const siteBars = document.getElementById('statsSiteBars');
            siteBars.innerHTML = '';
            const sortedSites = Object.entries(sites).sort((a, b) => b[1].count - a[1].count).slice(0, 10);
            const maxSite = Math.max(1, ...sortedSites.map(([, v]) => v.count));
            sortedSites.forEach(([host, data]) => {
                const row = document.createElement('div');
                row.className = 'stat-bar-row';
                row.innerHTML = `<span class="bar-label">${host}</span>
                    <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${Math.round(data.count/maxSite*100)}%"></div></div>
                    <span class="stat-bar-count">${data.count}</span>`;
                siteBars.appendChild(row);
            });
            if (!sortedSites.length) siteBars.innerHTML = '<div class="small" style="opacity:0.5;">No data yet.</div>';
        });
    }

    clearStatsBtn.addEventListener('click', async () => {
        if (!await showConfirm({ title: 'Clear statistics', message: 'All visit data will be permanently deleted.', okLabel: 'Clear' })) return;
        chrome.storage.local.remove('stats', () => { renderStats(); showToast('Stats cleared'); });
    });

    // ── Tabs ──────────────────────────────────────────────────────────────────

    const tabs = document.querySelectorAll('.tab');
    const tabPanels = document.querySelectorAll('.tab-panel');

    function setActiveTab(tabId) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
        tabPanels.forEach(p => p.classList.toggle('active', p.id === tabId));
        saveSetting('activeTab', tabId);
        if (tabId === 'statsTab') renderStats();
        if (tabId === 'marketplaceTab') initMarketplace();
    }

    tabs.forEach(tab => tab.addEventListener('click', () => setActiveTab(tab.dataset.tab)));
    chrome.storage.local.get(['activeTab'], items => {
        if (chrome.runtime.lastError) console.error('Failed to get activeTab:', chrome.runtime.lastError.message);
        setActiveTab((items && items.activeTab) || 'settingsTab');
    });

    // ── Marketplace ───────────────────────────────────────────────────────────

    // ⚠️  Update this URL once you've created your GitHub repo:
    const MARKETPLACE_REGISTRY_URL = 'https://raw.githubusercontent.com/Yossof0/Cursor-Gallery/main/registry.json';
    const MARKETPLACE_SUBMIT_URL   = 'https://github.com/Yossof0/Cursor-Gallery/pulls';
    const COUNT_BASE               = 'https://countapi.mileshilliard.com/api/v1';
    const COUNT_NS                 = 'cursor-gallery'; // namespace prefix for all pack keys

    async function countHit(packId) {
        try { await fetch(`${COUNT_BASE}/hit/${COUNT_NS}-${packId}`); } catch(e) {}
    }

    async function countDecrement(packId) {
        try {
            const res = await fetch(`${COUNT_BASE}/get/${COUNT_NS}-${packId}`);
            if (!res.ok) return;
            const data = await res.json();
            const current = parseInt(data.value) || 0;
            if (current <= 0) return;
            await fetch(`${COUNT_BASE}/set/${COUNT_NS}-${packId}?value=${current - 1}`);
        } catch(e) {}
    }

    async function countGet(packId) {
        try {
            const res = await fetch(`${COUNT_BASE}/get/${COUNT_NS}-${packId}`);
            if (!res.ok) return null;
            const data = await res.json();
            return typeof data.value === 'number' ? data.value : parseInt(data.value) || null;
        } catch(e) { return null; }
    }

    // Rating: two counters per pack — total stars + vote count
    async function fetchLiveRating(packId) {
        try {
            const [starsRes, votesRes] = await Promise.all([
                fetch(`${COUNT_BASE}/get/${COUNT_NS}-${packId}-stars`),
                fetch(`${COUNT_BASE}/get/${COUNT_NS}-${packId}-votes`),
            ]);
            const stars = starsRes.ok ? parseInt((await starsRes.json()).value) || 0 : 0;
            const votes = votesRes.ok ? parseInt((await votesRes.json()).value) || 0 : 0;
            return { stars, votes, avg: votes > 0 ? stars / votes : null };
        } catch(e) { return { stars: 0, votes: 0, avg: null }; }
    }

    async function submitRating(packId, starValue, isFirstVote = false) {
        const calls = [fetch(`${COUNT_BASE}/set/${COUNT_NS}-${packId}-stars?value=${starValue}`).catch(() => {})];
        if (isFirstVote) calls.push(fetch(`${COUNT_BASE}/hit/${COUNT_NS}-${packId}-votes`).catch(() => {}));
        await Promise.all(calls);
        return fetchLiveRating(packId);
    }

    const mktGrid       = document.getElementById('mktGrid');
    const mktSearch     = document.getElementById('mktSearch');
    const mktSort       = document.getElementById('mktSort');
    const mktFilters    = document.getElementById('mktFilters');
    const mktRefreshBtn = document.getElementById('mktRefreshBtn');
    const mktSubmitLink = document.getElementById('mktSubmitLink');

    mktSubmitLink.href = MARKETPLACE_SUBMIT_URL;

    let mktAllPacks      = [];
    let mktActiveTag     = 'all';
    let mktInitialized   = false;
    let mktInstalledMap  = new Map(); // id → installedAt date string

    function refreshInstalledIds(cb) {
        chrome.storage.local.get(['packs'], (items) => {
            mktInstalledMap = new Map(
                Object.entries(items.packs || {}).map(([id, p]) => [id, p.installedAt || ''])
            );
            if (cb) cb();
        });
    }

    // info.json lives alongside registry.json on raw.githubusercontent.com — same domain, no extra host_permissions needed
    const RAW_BASE = 'https://raw.githubusercontent.com/Yossof0/Cursor-Gallery/main';

    async function fetchInfoJson(packId, qs) {
        try {
            const res = await fetch(`${RAW_BASE}/packs/${packId}/info.json${qs}`);
            if (!res.ok) return null;
            return await res.json();
        } catch(e) {
            return null; // never let a single missing info.json kill the whole load
        }
    }

    async function fetchRegistry(force = false) {
        mktGrid.innerHTML = '<div class="mkt-status">Loading packs…</div>';
        try {
            const qs = force ? `?t=${Date.now()}` : '';
            const res = await fetch(MARKETPLACE_REGISTRY_URL + qs);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const slim = data.packs || [];

            // Fetch info.json + live download counts + ratings in parallel — all failures silenced
            const [infos, counts, ratings] = await Promise.all([
                Promise.allSettled(slim.map(e => fetchInfoJson(e.id, qs))),
                Promise.allSettled(slim.map(e => countGet(e.id))),
                Promise.allSettled(slim.map(e => fetchLiveRating(e.id)))
            ]);

            const merged = slim.map((entry, i) => {
                const info   = infos[i].status   === 'fulfilled' ? infos[i].value   : null;
                const count  = counts[i].status  === 'fulfilled' ? counts[i].value  : null;
                const rating = ratings[i].status === 'fulfilled' ? ratings[i].value : null;
                return {
                    ...entry,
                    registryIndex: i,
                    ...(info ? {
                        name:             info.name             ?? entry.name,
                        author:           info.author           ?? entry.author,
                        description:      info.description      ?? entry.description,
                        tags:             info.tags             ?? entry.tags,
                        syncHotspot:      info.syncHotspot      ?? entry.syncHotspot,
                        hotspotX:         info.hotspotX         ?? entry.hotspotX,
                        hotspotY:         info.hotspotY         ?? entry.hotspotY,
                        hotspotGrabX:     info.hotspotGrabX     ?? entry.hotspotGrabX,
                        hotspotGrabY:     info.hotspotGrabY     ?? entry.hotspotGrabY,
                        hotspotGrabbingX: info.hotspotGrabbingX ?? entry.hotspotGrabbingX,
                        hotspotGrabbingY: info.hotspotGrabbingY ?? entry.hotspotGrabbingY,
                    } : {}),
                    downloads: count ?? entry.downloads ?? 0,
                    liveRating: rating ?? { stars: 0, votes: 0, avg: null },
                };
            });

            mktAllPacks = merged;
            buildTagFilters();
            renderMarketplaceGrid();
        } catch(e) {
            mktGrid.innerHTML = `
                <div class="mkt-status mkt-error">
                    ⚠️ Could not load marketplace.<br>
                    <span style="font-size:0.82rem;opacity:0.7">${e.message || 'Check your connection.'}</span><br>
                    <button type="button" class="mkt-reload-btn" id="mktRetryBtn" style="margin-top:0.75rem;">↺ Try again</button>
                </div>`;
            document.getElementById('mktRetryBtn')?.addEventListener('click', () => fetchRegistry(true));
        }
    }

    function buildTagFilters() {
        const tagCounts = {};
        mktAllPacks.forEach(p => (p.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
        const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([t]) => t);
        mktFilters.innerHTML = '';
        const makeTagBtn = (tag, label) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'mkt-tag-btn' + (mktActiveTag === tag ? ' active' : '');
            btn.dataset.tag = tag;
            btn.textContent = label;
            btn.addEventListener('click', () => {
                mktActiveTag = tag;
                mktFilters.querySelectorAll('.mkt-tag-btn').forEach(b => b.classList.toggle('active', b.dataset.tag === tag));
                renderMarketplaceGrid();
            });
            return btn;
        };
        mktFilters.appendChild(makeTagBtn('all', 'All'));
        sorted.forEach(tag => mktFilters.appendChild(makeTagBtn(tag, tag)));
    }

    function getFilteredSortedPacks() {
        const q = mktSearch.value.trim().toLowerCase();
        let packs = mktAllPacks.filter(p => {
            const matchTag  = mktActiveTag === 'all' || (p.tags || []).includes(mktActiveTag);
            const matchText = !q ||
                p.name.toLowerCase().includes(q) ||
                (p.author || '').toLowerCase().includes(q) ||
                (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
                (p.description || '').toLowerCase().includes(q);
            return matchTag && matchText;
        });
        const sort = mktSort.value;
        if      (sort === 'downloads') packs.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        else if (sort === 'rating')    packs.sort((a, b) => (b.liveRating?.avg ?? -1) - (a.liveRating?.avg ?? -1));
        else if (sort === 'newest')    packs.sort((a, b) => (b.registryIndex ?? 0) - (a.registryIndex ?? 0));
        else if (sort === 'name')      packs.sort((a, b) => a.name.localeCompare(b.name));
        return packs;
    }

    function renderMarketplaceGrid() {
        const packs = getFilteredSortedPacks();
        if (!packs.length) {
            mktGrid.innerHTML = '<div class="mkt-empty">No packs match your search.</div>';
            return;
        }
        mktGrid.innerHTML = '';
        packs.forEach(pack => mktGrid.appendChild(buildMktCard(pack)));
    }

    function buildMktCard(pack) {
        const installedAt = mktInstalledMap.get(pack.id) ?? null;
        const installed   = installedAt !== null;
        const hasUpdate   = installed && pack.grabUrl && installedAt !== pack.grabUrl;
        const card = document.createElement('div');
        card.className = 'mkt-card';
        card.dataset.packId = pack.id;

        // Thumbnail row
        const thumb = document.createElement('div');
        thumb.className = 'mkt-thumb';
        if (pack.grabPreview || pack.grabbingPreview) {
            [pack.grabPreview, pack.grabbingPreview].filter(Boolean).forEach(src => {
                const img = document.createElement('img');
                img.src = src; img.alt = '';
                img.onerror = () => img.style.display = 'none';
                thumb.appendChild(img);
            });
        } else {
            thumb.innerHTML = '<span class="mkt-thumb-placeholder">🖱️</span>';
        }

        // Info
        const info = document.createElement('div');
        info.className = 'mkt-info';
        const tagsHtml = (pack.tags || []).map(t => `<span class="mkt-tag">${t}</span>`).join('');
        info.innerHTML = `
            <div class="mkt-name">${pack.name}</div>
            ${pack.author === 'Yossof0'
                ? '<div class="mkt-owner">👑 Yossof0</div>'
                : `<div class="mkt-author">by ${pack.author || 'Unknown'}</div>`}
            ${pack.description ? `<div class="mkt-desc">${pack.description}</div>` : ''}
            <div class="mkt-tags" style="margin-top:auto;padding-top:0.3rem;">${tagsHtml}</div>`;

        // Rating widget — injected below tags inside info
        const ratingWrap = document.createElement('div');
        ratingWrap.className = 'mkt-rating-wrap';
        ratingWrap.dataset.packId = pack.id;
        info.appendChild(ratingWrap);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'mkt-footer';
        footer.innerHTML = `<span class="mkt-downloads">⬇ ${(pack.downloads || 0).toLocaleString()}</span>`;

        const btn = document.createElement('button');
        btn.type = 'button';
        if (hasUpdate) {
            btn.className = 'mkt-install-btn mkt-update-btn';
            btn.textContent = '↑ Update';
            btn.addEventListener('click', () => installMktPack(pack, btn, true));
        } else if (installed) {
            btn.className = 'mkt-install-btn installed';
            btn.textContent = '✓ Installed';
            btn.disabled = true;
        } else {
            btn.className = 'mkt-install-btn';
            btn.textContent = 'Install';
            btn.addEventListener('click', () => installMktPack(pack, btn, false));
        }

        // Interactive star rating
        function renderRatingWidget(wrap, liveRating, userVoted) {
            const avg    = liveRating?.avg;
            const votes  = liveRating?.votes || 0;
            const filled = avg !== null ? Math.round(avg) : 0;
            wrap.innerHTML = '';

            const starsEl = document.createElement('div');
            starsEl.className = 'mkt-stars' + (userVoted ? ' voted' : '');
            starsEl.title = userVoted ? 'You can change your rating in 3 minutes' : 'Click to rate';

            for (let s = 1; s <= 5; s++) {
                const sp = document.createElement('span');
                sp.className = s <= filled ? 'star' : 'star-empty';
                sp.textContent = '★';
                sp.dataset.val = s;
                if (!userVoted) {
                    sp.addEventListener('mouseenter', () => {
                        starsEl.querySelectorAll('span').forEach((el, idx) => {
                            el.className = idx < s ? 'star hover' : 'star-empty';
                        });
                    });
                    sp.addEventListener('mouseleave', () => {
                        starsEl.querySelectorAll('span').forEach((el, idx) => {
                            el.className = idx < filled ? 'star' : 'star-empty';
                        });
                    });
                    sp.addEventListener('click', async () => {
                        chrome.storage.local.get(['mktRatings'], async (items) => {
                            const mktRatings = items.mktRatings || {};
                            const prev = mktRatings[pack.id];
                            const now = Date.now();
                            const COOLDOWN = 3 * 60 * 1000; // 3 minutes

                            // Still within cooldown — ignore click
                            if (prev && (now - prev.timestamp) < COOLDOWN) return;

                            // Save new vote with timestamp
                            mktRatings[pack.id] = { value: s, timestamp: now };
                            chrome.storage.local.set({ mktRatings });
                            starsEl.classList.add('voted');

                            // Adjust totals: subtract old vote, add new one
                            const cur = await fetchLiveRating(pack.id);
                            const oldStars = prev ? prev.value : 0;
                            const isFirstVote = !prev;
                            const newStars = Math.max(0, (cur.stars || 0) - oldStars + s);
                            const newRating = await submitRating(pack.id, newStars, isFirstVote);
                            const entry = mktAllPacks.find(p => p.id === pack.id);
                            if (entry) entry.liveRating = newRating;
                            renderRatingWidget(wrap, newRating, true);

                            // Unlock widget after cooldown
                            setTimeout(() => {
                                renderRatingWidget(wrap, entry?.liveRating ?? newRating, false);
                            }, COOLDOWN);
                        });
                    });
                }
                starsEl.appendChild(sp);
            }

            const val = document.createElement('span');
            val.className = 'rating-val';
            val.textContent = avg !== null ? `${avg.toFixed(1)} (${votes})` : 'Unrated';
            starsEl.appendChild(val);
            wrap.appendChild(starsEl);
        }

        // Check if user voted and whether cooldown has expired
        chrome.storage.local.get(['mktRatings'], (items) => {
            const mktRatings = items.mktRatings || {};
            const prev = mktRatings[pack.id];
            const COOLDOWN = 3 * 60 * 1000;
            const locked = prev && (Date.now() - prev.timestamp) < COOLDOWN;
            renderRatingWidget(ratingWrap, pack.liveRating, locked);
            // If still in cooldown, schedule unlock
            if (locked) {
                const remaining = COOLDOWN - (Date.now() - prev.timestamp);
                setTimeout(() => {
                    const entry = mktAllPacks.find(p => p.id === pack.id);
                    renderRatingWidget(ratingWrap, entry?.liveRating ?? pack.liveRating, false);
                }, remaining);
            }
        });

        footer.appendChild(btn);

        card.append(thumb, info, footer);
        return card;
    }

    async function installMktPack(pack, btn, isUpdate = false) {
        btn.textContent = isUpdate ? 'Updating…' : 'Installing…';
        btn.classList.add('loading');
        btn.disabled = true;
        try {
            async function toDataURL(url) {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`fetch failed: ${url}`);
                const blob = await res.blob();
                return new Promise((res, rej) => {
                    const r = new FileReader();
                    r.onload  = () => res(r.result);
                    r.onerror = rej;
                    r.readAsDataURL(blob);
                });
            }
            const [grabData, grabbingData] = await Promise.all([
                toDataURL(pack.grabUrl),
                toDataURL(pack.grabbingUrl)
            ]);
            const installedAt = pack.grabUrl; // used as version fingerprint — changes when URL tag bumps
            const newPack = {
                id: pack.id, name: pack.name, author: pack.author || '',
                tags: pack.tags || [], description: pack.description || '',
                grabCursor: grabData, grabbingCursor: grabbingData,
                hotspotX: pack.hotspotX ?? 16, hotspotY: pack.hotspotY ?? 16,
                hotspotGrabX: pack.hotspotGrabX ?? 16, hotspotGrabY: pack.hotspotGrabY ?? 16,
                hotspotGrabbingX: pack.hotspotGrabbingX ?? 16, hotspotGrabbingY: pack.hotspotGrabbingY ?? 16,
                syncHotspot: pack.syncHotspot !== false,
                fromMarketplace: true,
                installedAt,
            };
            chrome.storage.local.get(['packs', 'packOrder'], (items) => {
                const packs = { ...(items.packs || {}), [newPack.id]: newPack };
                const order = items.packOrder || [];
                if (!order.includes(newPack.id)) order.push(newPack.id);
                chrome.storage.local.set({ packs, packOrder: order }, () => {
                    mktInstalledMap.set(newPack.id, installedAt);
                    btn.textContent = isUpdate ? '✓ Updated' : '✓ Installed';
                    btn.classList.remove('loading', 'mkt-update-btn');
                    btn.classList.add('installed');
                    btn.disabled = true;
                    showToast(isUpdate ? `"${newPack.name}" updated!` : `"${newPack.name}" installed!`);
                    // Increment counter + live-update the displayed count on the card
                    countHit(newPack.id).then(() => countGet(newPack.id)).then(newCount => {
                        const entry = mktAllPacks.find(p => p.id === newPack.id);
                        if (entry && newCount !== null) {
                            entry.downloads = newCount;
                            const card = mktGrid.querySelector(`[data-pack-id="${newPack.id}"]`);
                            if (card) {
                                const dl = card.querySelector('.mkt-downloads');
                                if (dl) dl.textContent = `⬇ ${newCount.toLocaleString()}`;
                            }
                        }
                    });
                    renderEverything();
                });
            });
        } catch(e) {
            btn.textContent = '✗ Failed';
            btn.style.background = 'var(--danger, #e55)';
            btn.classList.remove('loading');
            setTimeout(() => {
                btn.textContent = 'Install';
                btn.style.background = '';
                btn.disabled = false;
            }, 2500);
        }
    }

    function initMarketplace() {
        if (!mktInitialized) {
            mktInitialized = true;
            refreshInstalledIds(() => fetchRegistry());
        } else {
            refreshInstalledIds(() => renderMarketplaceGrid());
        }
    }

    mktSearch.addEventListener('input', renderMarketplaceGrid);
    mktSort.addEventListener('change', renderMarketplaceGrid);
    mktRefreshBtn.addEventListener('click', () => {
        mktInitialized = false;
        refreshInstalledIds(() => fetchRegistry(true));
    });

    // ── Storage change listener ───────────────────────────────────────────────

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        if (changes.activeTab) setActiveTab(changes.activeTab.newValue || 'settingsTab');
        if (changes.customThemes) loadCustomThemes(changes.customThemes.newValue || {});
        if (changes.siteRules) { siteRules = changes.siteRules.newValue || []; renderSiteRules(); }
        if (changes.packs || changes.activePackId || changes.enableCustom || changes.uiTheme) {
            getPackFromStorage(({ packs, activePackId, activePack, enableCustom, uiTheme: theme }) => {
                renderPackGrid(packs, activePackId);
                applyTheme(theme, { animate: false });
                enableCheckbox.checked = enableCustom;
                uiTheme.value = theme;
                if (changes.activePackId || activePack?.id !== currentPack?.id) {
                    applyPackState(activePack);
                } else {
                    if (activePack) { Object.assign(currentPack, activePack); currentPacks = packs; }
                    void updateSandboxCursor(currentPack);
                }
            });
        }
    });

    // ── Info tooltips ─────────────────────────────────────────────────────────

    const infoTooltip = document.getElementById('info-tooltip');
    const TIPS = {
        'general':           { title: 'General', text: 'Enable or disable the extension globally, and configure keyboard shortcuts and sync settings.' },
        'settings-export':   { title: 'Export / Import Settings', text: 'Save all your settings, packs, themes and rules to a .json file — or restore them. Marketplace packs are re-downloaded automatically on import.' },
        'cursor-packs':      { title: 'Cursor Packs', text: 'Manage your cursor packs. Click a pack to activate it. Drag cards to reorder. Use the ★ to mark favourites.' },
        'pack-details':      { title: 'Pack Details', text: 'Edit the name, tags, and description of the selected pack. Tags help organise packs and filter them in the Marketplace.' },
        'cursor-images':     { title: 'Cursor Images', text: 'Upload grab.png and grabbing.png for this pack. Use the hotspot fields to set the exact pixel where the cursor "points".' },
        'sandbox':           { title: 'Live Preview', text: 'Test your active pack here. Hover and drag the box to see the grab and grabbing cursors in action — including trail and appearance effects.' },
        'cursor-appearance': { title: 'Cursor Appearance', text: 'Adjust the opacity of your cursor or apply a colour tint overlay. Works on all websites.' },
        'cursor-trail':      { title: 'Cursor Trail', text: 'Enable a particle trail that follows your cursor. Customise colour, size, length, fade, opacity and whether it shows on all movements or only while grabbing.' },
        'pack-import-export':{ title: 'Pack Import / Export', text: 'Export the current pack as a .zip (grab.png + grabbing.png + info.json), or import a pack by dropping its folder here.' },
        'info-builder':      { title: 'info.json Builder', text: 'Fill in the form and click Build to download a ready-made info.json for your pack. Drop it into your pack folder alongside grab.png and grabbing.png.' },
        'theme':             { title: 'Theme', text: 'Choose a built-in theme or one of your custom themes. You can also sync automatically with your OS dark/light mode preference.' },
        'theme-editor':      { title: 'Theme Editor', text: 'Create fully custom colour themes. Adjust every colour variable, preview live, then export as a .json to share or back up.' },
        'site-rules':        { title: 'Per-site Rules', text: 'Override which cursor pack is used on specific websites. Rules are matched by hostname and take priority over the global active pack.' },
        'stats':             { title: 'Usage Statistics', text: 'See how often you\'ve used the extension — visits per day over 60 days, which packs you\'ve used most, and your top sites.' },
        'marketplace':       { title: 'Marketplace', text: 'Browse and install community cursor packs hosted on GitHub. Packs are downloaded directly — no extension update needed when new packs are added.' },
    };

    let tooltipHideTimer = null;

    function positionTooltip(e) {
        const pad = 14;
        const tw = infoTooltip.offsetWidth;
        const th = infoTooltip.offsetHeight;
        let x = e.clientX + pad;
        let y = e.clientY + pad;
        if (x + tw > window.innerWidth  - 8) x = e.clientX - tw - pad;
        if (y + th > window.innerHeight - 8) y = e.clientY - th - pad;
        infoTooltip.style.left = x + 'px';
        infoTooltip.style.top  = y + 'px';
    }

    document.querySelectorAll('.info-icon').forEach(icon => {
        const tip = TIPS[icon.dataset.tip];
        if (!tip) return;

        icon.addEventListener('mouseenter', (e) => {
            clearTimeout(tooltipHideTimer);
            infoTooltip.innerHTML = `<strong>${tip.title}</strong>${tip.text}`;
            positionTooltip(e);
            infoTooltip.classList.remove('visible');
            requestAnimationFrame(() => infoTooltip.classList.add('visible'));
        });

        icon.addEventListener('mousemove', positionTooltip);

        icon.addEventListener('mouseleave', () => {
            tooltipHideTimer = setTimeout(() => infoTooltip.classList.remove('visible'), 80);
        });
    });

    // Pack description icons — dynamically created, use delegation on packGrid
    packGrid.addEventListener('mouseenter', (e) => {
        const icon = e.target.closest('.pack-desc-icon');
        if (!icon) return;
        clearTimeout(tooltipHideTimer);
        infoTooltip.innerHTML = icon.dataset.noDesc
            ? `<strong style="opacity:0.5;">No description</strong><span style="opacity:0.5;font-style:italic;">Description not set for this pack.</span>`
            : `<strong>Description</strong>${icon.dataset.desc}`;
        positionTooltip(e);
        infoTooltip.classList.remove('visible');
        requestAnimationFrame(() => infoTooltip.classList.add('visible'));
    }, true);
    packGrid.addEventListener('mousemove', (e) => {
        if (e.target.closest('.pack-desc-icon')) positionTooltip(e);
    });
    packGrid.addEventListener('mouseleave', (e) => {
        if (e.target.closest('.pack-desc-icon')) {
            tooltipHideTimer = setTimeout(() => infoTooltip.classList.remove('visible'), 80);
        }
    }, true);

    // ── info.json builder ─────────────────────────────────────────────────────

    const ijName             = document.getElementById('ijName');
    const ijAuthor           = document.getElementById('ijAuthor');
    const ijDescription      = document.getElementById('ijDescription');
    const ijDescCount        = document.getElementById('ijDescCount');
    const ijTags             = document.getElementById('ijTags');
    const ijHotspotX         = document.getElementById('ijHotspotX');
    const ijHotspotY         = document.getElementById('ijHotspotY');
    const ijSyncHotspot      = document.getElementById('ijSyncHotspot');
    const ijSeparateHotspots = document.getElementById('ijSeparateHotspots');
    const ijGrabX            = document.getElementById('ijGrabX');
    const ijGrabY            = document.getElementById('ijGrabY');
    const ijGrabbingX        = document.getElementById('ijGrabbingX');
    const ijGrabbingY        = document.getElementById('ijGrabbingY');
    const ijBuildBtn         = document.getElementById('ijBuildBtn');
    const ijClearOnBuild     = document.getElementById('ijClearOnBuild');

    // Description char counter
    ijDescription.addEventListener('input', () => {
        ijDescCount.textContent = `${ijDescription.value.length} / 100`;
    });

    // Toggle separate hotspot fields
    ijSyncHotspot.addEventListener('change', () => {
        ijSeparateHotspots.style.display = ijSyncHotspot.checked ? 'none' : 'block';
    });

    // Auto-generate id from name
    function nameToId(name) {
        return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'my-pack';
    }

    ijBuildBtn.addEventListener('click', () => {
        const name = ijName.value.trim();
        if (!name) { showToast('Pack name is required', 'error'); ijName.focus(); return; }

        const tags = ijTags.value.split(',').map(t => t.trim()).filter(Boolean);
        const syncHotspot = ijSyncHotspot.checked;

        const info = {
            id:          nameToId(name),
            name,
            author:      ijAuthor.value.trim() || 'Unknown',
            description: ijDescription.value.trim(),
            tags,
            syncHotspot,
        };

        if (syncHotspot) {
            info.hotspotX = parseInt(ijHotspotX.value) || 16;
            info.hotspotY = parseInt(ijHotspotY.value) || 16;
        } else {
            info.hotspotGrabX     = parseInt(ijGrabX.value)     || 16;
            info.hotspotGrabY     = parseInt(ijGrabY.value)     || 16;
            info.hotspotGrabbingX = parseInt(ijGrabbingX.value) || 16;
            info.hotspotGrabbingY = parseInt(ijGrabbingY.value) || 16;
        }

        const blob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' });
        downloadBlob(blob, 'info.json');
        showToast('info.json downloaded ✓');

        if (ijClearOnBuild.checked) {
            ijName.value        = '';
            ijAuthor.value      = '';
            ijDescription.value = '';
            ijDescCount.textContent = '0 / 100';
            ijTags.value        = '';
            ijHotspotX.value    = '16';
            ijHotspotY.value    = '16';
            ijSyncHotspot.checked = true;
            ijSeparateHotspots.style.display = 'none';
            ijGrabX.value = ijGrabY.value = ijGrabbingX.value = ijGrabbingY.value = '16';
        }
    });

    // ── Local drop zones ──────────────────────────────────────────────────────

    function makeDZ(zoneId, clickId, fileInputId, onFiles) {
        const zone  = document.getElementById(zoneId);
        const input = document.getElementById(fileInputId);
        if (!zone || !input) return;

        // Click the label span → open file picker
        document.getElementById(clickId)?.addEventListener('click', (e) => {
            e.stopPropagation();
            input.click();
        });
        zone.addEventListener('click', () => input.click());

        // Drag highlighting
        zone.addEventListener('dragenter', (e) => { e.preventDefault(); e.stopPropagation(); zone.classList.add('dz-over'); });
        zone.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); zone.classList.remove('dz-over'); });
        zone.addEventListener('dragover',  (e) => { e.preventDefault(); e.stopPropagation(); });
        zone.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('dz-over');
            const entries = [...(e.dataTransfer.items || [])].map(i => i.webkitGetAsEntry?.()).filter(Boolean);
            const folderEntry = entries.find(en => en.isDirectory);
            if (folderEntry) {
                const files = await readFolderEntry(folderEntry);
                onFiles(files);
            } else {
                onFiles([...(e.dataTransfer.files || [])]);
            }
        });
    }

    makeDZ('settingsDropZone', 'settingsDropZoneClick', 'importBtn', async (files) => {
        const json = files.find(f => f.name.endsWith('.json'));
        if (!json) { showToast('Drop a .json file', 'error'); return; }
        const text = await json.text();
        let parsed; try { parsed = JSON.parse(text); } catch { showToast('Invalid JSON', 'error'); return; }
        importSettingsFromObject(parsed);
    });

    makeDZ('packDropZone', 'packDropZoneClick', 'importPackFolder', (files) => {
        importPackFromFiles(files);
    });

    makeDZ('themeDropZone', 'themeDropZoneClick', 'importThemeBtn', async (files) => {
        const json = files.find(f => f.name.endsWith('.json'));
        if (!json) { showToast('Drop a .json file', 'error'); return; }
        const text = await json.text();
        let parsed; try { parsed = JSON.parse(text); } catch { showToast('Invalid JSON', 'error'); return; }
        // Use the existing importThemeBtn handler logic by dispatching through FileReader
        const dt = new DataTransfer(); dt.items.add(json);
        importThemeBtn.files = dt.files;
        importThemeBtn.dispatchEvent(new Event('change'));
    });

    // ── Global drag & drop import ─────────────────────────────────────────────

    const dropOverlay = document.getElementById('drop-overlay');
    let dropDepth = 0;

    function showDropOverlay() { dropOverlay.classList.add('active'); }
    function hideDropOverlay() { dropOverlay.classList.remove('active'); }

    document.addEventListener('dragenter', (e) => {
        if (!e.dataTransfer?.types?.includes('Files')) return; // ignore internal drags
        e.preventDefault();
        dropDepth++;
        showDropOverlay();
    });
    document.addEventListener('dragleave', (e) => {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        e.preventDefault();
        dropDepth--;
        if (dropDepth <= 0) { dropDepth = 0; hideDropOverlay(); }
    });
    document.addEventListener('dragover', (e) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault(); });
    document.addEventListener('drop', async (e) => {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        e.preventDefault();
        dropDepth = 0;
        hideDropOverlay();

        const items = [...(e.dataTransfer.items || [])];
        const files = [...(e.dataTransfer.files || [])];

        // ── Try folder import via DataTransferItemList (webkitGetAsEntry) ──
        const entries = items.map(i => i.webkitGetAsEntry?.()).filter(Boolean);
        const folderEntry = entries.find(en => en.isDirectory);
        if (folderEntry) {
            // Collect files from the folder
            const folderFiles = await readFolderEntry(folderEntry);
            importPackFromFiles(folderFiles);
            return;
        }

        // ── File-based detection ──
        const pngs  = files.filter(f => f.type === 'image/png' || f.name.endsWith('.png'));
        const jsons = files.filter(f => f.name.endsWith('.json'));

        // Two PNGs dropped → quick pack from grab + grabbing
        if (pngs.length >= 2) {
            const grab     = pngs.find(f => f.name.toLowerCase().includes('grab') && !f.name.toLowerCase().includes('grabbing')) || pngs[0];
            const grabbing = pngs.find(f => f.name.toLowerCase().includes('grabbing')) || pngs[1];
            importPackFromFiles([grab, grabbing]);
            return;
        }

        // One JSON → sniff if it's a theme or settings backup
        if (jsons.length === 1) {
            const text = await jsons[0].text();
            let parsed;
            try { parsed = JSON.parse(text); } catch { showToast('Invalid JSON', 'error'); return; }

            if (parsed.type === 'custom-theme' || (parsed.name && parsed.colors && !parsed.packs)) {
                // Looks like a theme
                importThemeFromObject(parsed);
            } else {
                // Treat as settings backup
                importSettingsFromObject(parsed);
            }
            return;
        }

        showToast('Drop a pack folder, 2 PNGs, or a .json file', 'error');
    });

    // Read all files from a directory entry recursively (flat)
    function readFolderEntry(dirEntry) {
        return new Promise((resolve) => {
            const reader = dirEntry.createReader();
            const result = [];
            function readBatch() {
                reader.readEntries((entries) => {
                    if (!entries.length) { resolve(result); return; }
                    let pending = entries.length;
                    entries.forEach(entry => {
                        if (entry.isFile) {
                            entry.file(f => { result.push(f); if (--pending === 0) readBatch(); });
                        } else { if (--pending === 0) readBatch(); }
                    });
                });
            }
            readBatch();
        });
    }

    // Theme import from parsed object (shared by file input + drop)
    function importThemeFromObject(parsed) {
        if (!parsed.name || !parsed.colors) { showToast('Invalid theme file', 'error'); return; }
        chrome.storage.local.get(['customThemes'], (items) => {
            const themes = { ...(items.customThemes || {}), [parsed.name]: parsed.colors };
            chrome.storage.local.set({ customThemes: themes }, () => {
                showToast(`Theme "${parsed.name}" imported ✓`);
                loadCustomThemes(themes);
            });
        });
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    renderEverything();
});