document.addEventListener('DOMContentLoaded', () => {
    const enableToggle   = document.getElementById('enableToggle');
    const toggleLabel    = document.getElementById('toggleLabel');
    const statusText     = document.getElementById('statusText');
    const activeName     = document.getElementById('activeName');
    const activeGrab     = document.getElementById('activeGrab');
    const activeGrabbing = document.getElementById('activeGrabbing');
    const packList       = document.getElementById('packList');
    const settingsBtn    = document.getElementById('settingsBtn');

    const DEFAULT_PACK_ID    = 'macos';
    const DEFAULT_PACK_ORDER = ['macos', 'win11-light', 'win11-dark'];

    const BUILTIN_PACKS = {
        macos:        { id: 'macos',        name: 'Mac OS',      grabCursor: chrome.runtime.getURL('resources/macos/grab.png'),        grabbingCursor: chrome.runtime.getURL('resources/macos/grabbing.png') },
        'win11-light':{ id: 'win11-light',  name: 'Win11 Light', grabCursor: chrome.runtime.getURL('resources/win11-light/grab.png'),   grabbingCursor: chrome.runtime.getURL('resources/win11-light/grabbing.png') },
        'win11-dark': { id: 'win11-dark',   name: 'Win11 Dark',  grabCursor: chrome.runtime.getURL('resources/win11-dark/grab.png'),    grabbingCursor: chrome.runtime.getURL('resources/win11-dark/grabbing.png') },
    };

    const unavail = chrome.runtime.getURL('resources/unavailable.svg');

    // ── Apply theme ───────────────────────────────────────────────────────────

    const BUILTIN_THEMES = ['light','dark','neon','cherry','blueberry','stormy','desert','coastal','summer','parchment','aurora','espresso','graphite','sakura','toxic'];

    function applyTheme(theme, customThemes) {
        document.body.classList.remove(...BUILTIN_THEMES.map(t => `theme-${t}`), ...Object.keys(customThemes || {}).map(id => `theme-custom-${id}`));
        if (!theme || theme === 'light') return;
        if (BUILTIN_THEMES.includes(theme)) {
            document.body.classList.add(`theme-${theme}`);
        } else {
            const ct = (customThemes || {})[theme];
            if (ct) {
                const id = `custom-theme-style-${ct.id}`;
                let el = document.getElementById(id);
                if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
                const v = ct.vars;
                el.textContent = `body.theme-custom-${ct.id} { --bg:${v.bg}; --text:${v.text}; --card:${v.card}; --panel:${v.panel}; --accent:${v.accent}; --proper:${v.proper}; --border:rgba(128,128,128,0.2); --shadow:rgba(0,0,0,0.3); --muted:rgba(128,128,128,0.55); }`;
            }
            document.body.classList.add(`theme-custom-${theme}`);
        }
    }

    // ── Merge built-in packs ──────────────────────────────────────────────────

    function mergePacks(storedPacks) {
        const packs = { ...(storedPacks || {}) };
        const CURSOR_KEYS = ['grabCursor', 'grabbingCursor'];
        Object.keys(BUILTIN_PACKS).forEach(id => {
            const stored = packs[id] || {};
            const safe = Object.fromEntries(Object.entries(stored).filter(([k]) => !CURSOR_KEYS.includes(k)));
            packs[id] = { ...BUILTIN_PACKS[id], ...safe };
        });
        return packs;
    }

    function normalizeOrder(storedOrder, packs) {
        const order = [], seen = new Set();
        const add = id => { if (!id || seen.has(id) || !packs[id]) return; seen.add(id); order.push(id); };
        (Array.isArray(storedOrder) && storedOrder.length ? storedOrder : DEFAULT_PACK_ORDER).forEach(add);
        Object.keys(packs).forEach(add);
        return order;
    }

    // ── Render pack list ──────────────────────────────────────────────────────

    function renderPackList(packs, activeId, order) {
        packList.innerHTML = '';

        // favorites first
        const sorted = [...order].sort((a, b) => (packs[b]?.favorite ? 1 : 0) - (packs[a]?.favorite ? 1 : 0));

        sorted.forEach(id => {
            const pack = packs[id];
            if (!pack) return;
            const isActive = id === activeId;

            const row = document.createElement('div');
            row.className = 'pack-row' + (isActive ? ' active-row' : '');

            const thumbsDiv = document.createElement('div');
            thumbsDiv.className = 'pack-row-thumbs';
            const g = document.createElement('img');
            g.src = pack.grabCursor || unavail;
            g.onerror = () => { g.src = unavail; };
            const gb = document.createElement('img');
            gb.src = pack.grabbingCursor || unavail;
            gb.onerror = () => { gb.src = unavail; };
            thumbsDiv.appendChild(g);
            thumbsDiv.appendChild(gb);

            const nameSpan = document.createElement('span');
            nameSpan.className = 'pack-row-name';
            nameSpan.textContent = pack.name || id;

            row.appendChild(thumbsDiv);
            row.appendChild(nameSpan);

            if (pack.favorite) {
                const fav = document.createElement('span');
                fav.className = 'pack-row-fav';
                fav.textContent = '★';
                row.appendChild(fav);
            }

            if (isActive) {
                const badge = document.createElement('span');
                badge.className = 'pack-row-badge';
                badge.textContent = 'Active';
                row.appendChild(badge);
            }

            row.addEventListener('click', () => {
                if (isActive) return;
                chrome.storage.local.set({ activePackId: id }, () => {
                    // re-render with new active
                    renderPackList(packs, id, order);
                    updateActivePack(packs[id]);
                });
            });

            packList.appendChild(row);
        });
    }

    // ── Update active pack display ────────────────────────────────────────────

    function updateActivePack(pack) {
        if (!pack) return;
        activeName.textContent = pack.name || pack.id;
        activeGrab.src = pack.grabCursor || unavail;
        activeGrabbing.src = pack.grabbingCursor || unavail;
        activeGrab.onerror = () => { activeGrab.src = unavail; };
        activeGrabbing.onerror = () => { activeGrabbing.src = unavail; };
    }

    // ── Update enabled state ──────────────────────────────────────────────────

    function setEnabledState(enabled) {
        enableToggle.checked = enabled;
        toggleLabel.textContent = enabled ? 'On' : 'Off';
        statusText.textContent = enabled ? 'Extension active' : 'Extension disabled';
        document.body.classList.toggle('ext-disabled', !enabled);
    }

    // ── Load everything ───────────────────────────────────────────────────────

    chrome.storage.local.get(['packs', 'activePackId', 'enableCustom', 'packOrder', 'uiTheme', 'customThemes'], items => {
        const packs   = mergePacks(items.packs);
        const activeId = items.activePackId || DEFAULT_PACK_ID;
        const order   = normalizeOrder(items.packOrder, packs);
        const enabled = items.enableCustom !== false;

        applyTheme(items.uiTheme || 'dark', items.customThemes || {});
        setEnabledState(enabled);
        updateActivePack(packs[activeId] || packs[DEFAULT_PACK_ID]);
        renderPackList(packs, activeId, order);
    });

    // ── Enable toggle ─────────────────────────────────────────────────────────

    enableToggle.addEventListener('change', () => {
        const enabled = enableToggle.checked;
        chrome.storage.local.set({ enableCustom: enabled }, () => setEnabledState(enabled));
    });

    // ── Settings button ───────────────────────────────────────────────────────

    settingsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});