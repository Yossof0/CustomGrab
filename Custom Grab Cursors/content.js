(async function() {
    console.log('The Custom Grab Cursor Extension Was Programmed And Developed By Yossof0, If you are willing to share, Please give credits to the owner');

    const stored = await new Promise((resolve, reject) => {
        chrome.storage.local.get([
            'packs', 'activePackId', 'enableCustom',
            'grabCursor', 'grabbingCursor',
            'hotspotX', 'hotspotY',
            'hotspotGrabX', 'hotspotGrabY',
            'hotspotGrabbingX', 'hotspotGrabbingY', 'syncHotspot',
            'siteRules',
            'cursorTrail', 'cursorTrailColor', 'cursorTrailSize', 'cursorTrailLength', 'cursorTrailFade', 'cursorTrailOpacity', 'cursorTrailScope',
            'cursorOpacity', 'cursorTintColor', 'cursorTintStrength'
        ], (items) => {
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else resolve(items);
        });
    }).catch(err => { console.error('Failed to load storage:', err); return {}; });

    if (!stored) return;
    if (stored.enableCustom === false) return;

    // ── Per-site rules ────────────────────────────────────────────────────────
    const siteRules = stored.siteRules || [];
    const currentHost = window.location.hostname.replace(/^www\./, '');

    for (const rule of siteRules) {
        const ruleHost = (rule.domain || '').replace(/^www\./, '');
        if (!ruleHost) continue;
        const matches = currentHost === ruleHost || currentHost.endsWith('.' + ruleHost);
        if (!matches) continue;
        if (rule.action === 'disable') return; // extension disabled for this site
        if (rule.action === 'pack' && rule.packId) {
            // Override active pack with the rule's pack
            stored.activePackId = rule.packId;
        }
        break; // first matching rule wins
    }

    const DEFAULT_PACK_ID = 'macos';
    const BUILTIN_PACKS = {
        macos: {
            id: 'macos',
            grabCursor: chrome.runtime.getURL('resources/macos/grab.png'),
            grabbingCursor: chrome.runtime.getURL('resources/macos/grabbing.png'),
            syncHotspot: true,
            hotspotX: 16, hotspotY: 16,
            hotspotGrabX: 16, hotspotGrabY: 16,
            hotspotGrabbingX: 16, hotspotGrabbingY: 16
        },
        'win11-light': {
            id: 'win11-light',
            grabCursor: chrome.runtime.getURL('resources/win11-light/grab.png'),
            grabbingCursor: chrome.runtime.getURL('resources/win11-light/grabbing.png'),
            syncHotspot: true,
            hotspotX: 16, hotspotY: 16,
            hotspotGrabX: 16, hotspotGrabY: 16,
            hotspotGrabbingX: 16, hotspotGrabbingY: 16
        },
        'win11-dark': {
            id: 'win11-dark',
            grabCursor: chrome.runtime.getURL('resources/win11-dark/grab.png'),
            grabbingCursor: chrome.runtime.getURL('resources/win11-dark/grabbing.png'),
            syncHotspot: true,
            hotspotX: 16, hotspotY: 16,
            hotspotGrabX: 16, hotspotGrabY: 16,
            hotspotGrabbingX: 16, hotspotGrabbingY: 16
        }
    };

    const REMOVED_PACKS = [];
    const storedPacksRaw = { ...(stored.packs || {}) };
    REMOVED_PACKS.forEach(id => delete storedPacksRaw[id]);

    const CURSOR_KEYS = ['grabCursor', 'grabbingCursor'];
    let packs = { ...storedPacksRaw };
    Object.keys(BUILTIN_PACKS).forEach(id => {
        const storedPack = storedPacksRaw[id] || {};
        const storedSafe = Object.fromEntries(
            Object.entries(storedPack).filter(([k]) => !CURSOR_KEYS.includes(k))
        );
        packs[id] = { ...storedSafe, ...BUILTIN_PACKS[id] };
    });

    if (!stored.packs && (stored.grabCursor || stored.grabbingCursor)) {
        packs[DEFAULT_PACK_ID] = {
            ...packs[DEFAULT_PACK_ID],
            grabCursor: stored.grabCursor || packs[DEFAULT_PACK_ID].grabCursor,
            grabbingCursor: stored.grabbingCursor || packs[DEFAULT_PACK_ID].grabbingCursor,
            syncHotspot: stored.syncHotspot !== false,
            hotspotX: typeof stored.hotspotX === 'number' ? stored.hotspotX : packs[DEFAULT_PACK_ID].hotspotX,
            hotspotY: typeof stored.hotspotY === 'number' ? stored.hotspotY : packs[DEFAULT_PACK_ID].hotspotY,
            hotspotGrabX: typeof stored.hotspotGrabX === 'number' ? stored.hotspotGrabX : packs[DEFAULT_PACK_ID].hotspotGrabX,
            hotspotGrabY: typeof stored.hotspotGrabY === 'number' ? stored.hotspotGrabY : packs[DEFAULT_PACK_ID].hotspotGrabY,
            hotspotGrabbingX: typeof stored.hotspotGrabbingX === 'number' ? stored.hotspotGrabbingX : packs[DEFAULT_PACK_ID].hotspotGrabbingX,
            hotspotGrabbingY: typeof stored.hotspotGrabbingY === 'number' ? stored.hotspotGrabbingY : packs[DEFAULT_PACK_ID].hotspotGrabbingY
        };
    }

    const activePackId = (REMOVED_PACKS.includes(stored.activePackId) ? DEFAULT_PACK_ID : stored.activePackId) || DEFAULT_PACK_ID;
    const pack = packs[activePackId] || packs[DEFAULT_PACK_ID];

    const grabCursorUrl = pack.grabCursor || null;
    const grabbingCursorUrl = pack.grabbingCursor || null;

    const syncHotspot = pack.syncHotspot !== false;
    const HOTSPOT_X  = syncHotspot ? (pack.hotspotX  ?? 16) : (pack.hotspotGrabX  ?? 16);
    const HOTSPOT_Y  = syncHotspot ? (pack.hotspotY  ?? 16) : (pack.hotspotGrabY  ?? 16);
    const HOTSPOT_X2 = syncHotspot ? HOTSPOT_X : (pack.hotspotGrabbingX ?? 16);
    const HOTSPOT_Y2 = syncHotspot ? HOTSPOT_Y : (pack.hotspotGrabbingY ?? 16);

    // ── Record visit stat ─────────────────────────────────────────────────────
    try {
        chrome.runtime.sendMessage({
            type: 'RECORD_VISIT',
            packId: pack.id,
            packName: pack.name || pack.id,
            hostname: window.location.hostname.replace(/^www\./, '')
        });
    } catch(e) {}

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        if (changes.packs || changes.activePackId || changes.enableCustom || changes.siteRules ||
            changes.cursorTrail || changes.cursorTrailColor || changes.cursorTrailSize ||
            changes.cursorTrailLength || changes.cursorTrailFade || changes.cursorTrailOpacity ||
            changes.cursorOpacity || changes.cursorTintColor || changes.cursorTintStrength) {
            window.location.reload();
        }
    });

    // ── Opacity / tint via canvas → blob URL ──────────────────────────────────
    // Content scripts can fetch() extension URLs freely — no CORS taint.
    // We fetch the PNG bytes, create a blob URL, load it into an Image,
    // then draw on a canvas with opacity and optional tint. toBlob() on a
    // canvas fed from a same-origin blob URL is never tainted.
    const cursorOpacity     = typeof stored.cursorOpacity     === 'number' ? stored.cursorOpacity     : 1;
    const cursorTintColor   = stored.cursorTintColor   || '#ffffff';
    const cursorTintStrength = typeof stored.cursorTintStrength === 'number' ? stored.cursorTintStrength : 0;
    const needsEffect       = cursorOpacity < 0.99 || cursorTintStrength > 0.01;

    async function processImageUrl(extUrl) {
        if (!extUrl || !needsEffect) return extUrl;
        try {
            // Fetch raw bytes → local blob URL (no taint)
            const resp = await fetch(extUrl);
            const srcBlob = await resp.blob();
            const srcBlobUrl = URL.createObjectURL(srcBlob);

            const img = await new Promise((res, rej) => {
                const i = new Image();
                i.onload  = () => res(i);
                i.onerror = rej;
                i.src = srcBlobUrl;
            });

            const canvas = document.createElement('canvas');
            canvas.width  = img.naturalWidth  || 64;
            canvas.height = img.naturalHeight || 64;
            const ctx = canvas.getContext('2d');

            // Draw cursor at desired opacity
            ctx.globalAlpha = cursorOpacity;
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(srcBlobUrl);

            // Overlay tint color using source-atop (only where cursor pixels exist)
            if (cursorTintStrength > 0.01) {
                ctx.globalCompositeOperation = 'source-atop';
                ctx.globalAlpha = cursorTintStrength;
                ctx.fillStyle   = cursorTintColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            return await new Promise(res =>
                canvas.toBlob(blob => res(blob ? URL.createObjectURL(blob) : extUrl), 'image/png')
            );
        } catch(e) {
            return extUrl;
        }
    }

    const [processedGrab, processedGrabbing] = await Promise.all([
        processImageUrl(grabCursorUrl),
        processImageUrl(grabbingCursorUrl)
    ]);

    const CUSTOM_GRAB     = processedGrab
        ? `url('${processedGrab}') ${HOTSPOT_X} ${HOTSPOT_Y}, grab`
        : 'grab';
    const CUSTOM_GRABBING = processedGrabbing
        ? `url('${processedGrabbing}') ${HOTSPOT_X2} ${HOTSPOT_Y2}, grabbing`
        : 'grabbing';

    // ── Cursor trail ──────────────────────────────────────────────────────────
    const trailEnabled = !!stored.cursorTrail;
    const trailColor   = stored.cursorTrailColor   || '#7cbbff';
    const trailSize    = stored.cursorTrailSize    || 8;
    const trailLength  = stored.cursorTrailLength  || 8;
    const trailFade    = stored.cursorTrailFade    !== false;
    const trailBaseOp  = typeof stored.cursorTrailOpacity === 'number' ? stored.cursorTrailOpacity : 0.9;
    const trailScope   = stored.cursorTrailScope   || 'all';

    if (trailEnabled) {
        const dots      = [];
        const positions = [];
        let onGrabElement = false;

        const trailContainer = document.createElement('div');
        trailContainer.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483647;overflow:visible;';
        (document.body || document.documentElement).appendChild(trailContainer);

        for (let i = 0; i < trailLength; i++) {
            const dot      = document.createElement('div');
            const fraction = i / Math.max(trailLength - 1, 1);
            const opacity  = trailFade ? (1 - fraction) * trailBaseOp : trailBaseOp;
            const scale    = trailFade ? 1 - fraction * 0.5   : 1;
            dot.style.cssText = [
                'position:fixed',
                `width:${trailSize}px`,
                `height:${trailSize}px`,
                'border-radius:50%',
                `background:${trailColor}`,
                `opacity:${opacity.toFixed(3)}`,
                `transform:translate(-50%,-50%) scale(${scale.toFixed(3)})`,
                'pointer-events:none',
                'will-change:left,top',
                'left:-9999px',
                'top:-9999px'
            ].join(';');
            trailContainer.appendChild(dot);
            dots.push(dot);
            positions.push({ x: -9999, y: -9999 });
        }

        // For grab-only mode: track when pointer enters/leaves grab elements
        if (trailScope === 'grab-only') {
            document.addEventListener('mouseover', (e) => {
                const el = e.target;
                if (!el) return;
                const isGrab = el.getAttribute('data-grab-ext') != null ||
                               el.getAttribute('data-grab') === 'true';
                onGrabElement = isGrab;
                if (!isGrab) {
                    // Park dots offscreen when leaving grab elements
                    positions.length = 0;
                    dots.forEach(d => { d.style.left = '-9999px'; d.style.top = '-9999px'; });
                }
            }, { passive: true });
        }

        document.addEventListener('mousemove', (e) => {
            if (trailScope === 'grab-only' && !onGrabElement) return;
            positions.unshift({ x: e.clientX, y: e.clientY });
            if (positions.length > trailLength) positions.length = trailLength;
        }, { passive: true });

        (function animateTrail() {
            for (let i = 0; i < dots.length; i++) {
                const p = positions[i] || { x: -9999, y: -9999 };
                dots[i].style.left = p.x + 'px';
                dots[i].style.top  = p.y + 'px';
            }
            requestAnimationFrame(animateTrail);
        })();
    }

    // ── Inject cursor stylesheet ──────────────────────────────────────────────
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        *[style*="cursor: grab"],
        *[style*="cursor:grab"],
        [data-grab="true"],
        [data-grab-ext="true"] {
            cursor: ${CUSTOM_GRAB} !important;
        }
        [data-grab-ext="grabbing"] {
            cursor: ${CUSTOM_GRABBING} !important;
        }
    `;
    (document.head || document.documentElement).appendChild(styleSheet);

    const modifiedElements = new WeakSet();
    let globalMouseDown = false;

    function setupGrabbingListeners(element) {
        if (modifiedElements.has(element)) return;
        element.style.setProperty('cursor', CUSTOM_GRAB, 'important');
        element.setAttribute('data-grab-ext', 'true');

        const handleMouseDown = (e) => {
            if (e.button !== 0) return;
            globalMouseDown = true;
            element.setAttribute('data-grab-ext', 'grabbing');
            element.style.setProperty('cursor', CUSTOM_GRABBING, 'important');
            document.body.offsetWidth;
        };
        const handleMouseUp = (e) => {
            if (e.button !== 0) return;
            globalMouseDown = false;
            element.setAttribute('data-grab-ext', 'true');
            element.style.setProperty('cursor', CUSTOM_GRAB, 'important');
            document.body.offsetWidth;
        };
        const handleMouseEnter = () => {
            if (globalMouseDown) {
                element.setAttribute('data-grab-ext', 'grabbing');
                element.style.setProperty('cursor', CUSTOM_GRABBING, 'important');
            } else {
                element.setAttribute('data-grab-ext', 'true');
                element.style.setProperty('cursor', CUSTOM_GRAB, 'important');
            }
            document.body.offsetWidth;
        };
        const handleMouseLeave = () => {
            if (!globalMouseDown) {
                element.setAttribute('data-grab-ext', 'true');
                element.style.setProperty('cursor', CUSTOM_GRAB, 'important');
                document.body.offsetWidth;
            }
        };

        element.addEventListener('mousedown', handleMouseDown, true);
        element.addEventListener('mouseup', handleMouseUp, true);
        element.addEventListener('mouseenter', handleMouseEnter, true);
        element.addEventListener('mouseleave', handleMouseLeave, true);

        const handlePointerDown = (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            globalMouseDown = true;
            element.setAttribute('data-grab-ext', 'grabbing');
            element.style.setProperty('cursor', CUSTOM_GRABBING, 'important');
            document.body.offsetWidth;
        };
        const handlePointerUp = (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            globalMouseDown = false;
            element.setAttribute('data-grab-ext', 'true');
            element.style.setProperty('cursor', CUSTOM_GRAB, 'important');
            document.body.offsetWidth;
        };

        element.addEventListener('pointerdown', handlePointerDown, true);
        element.addEventListener('pointerup', handlePointerUp, true);

        if (!window.__grabExtensionGlobalListenerAttached) {
            const globalMouseUp = () => {
                if (!globalMouseDown) return;
                globalMouseDown = false;
                document.querySelectorAll('*').forEach(el => {
                    const computed = window.getComputedStyle(el).cursor;
                    if (computed === 'grab' || computed === '-webkit-grab' || (computed.includes('url') && computed.includes('grab'))) {
                        el.style.setProperty('cursor', CUSTOM_GRAB, 'important');
                    }
                });
                document.body.offsetWidth;
            };
            document.addEventListener('mouseup', globalMouseUp, true);
            document.addEventListener('pointerup', globalMouseUp, true);
            window.__grabExtensionGlobalListenerAttached = true;
        }

        modifiedElements.add(element);
    }

    function scanAndApplyCursors(nodes) {
        if (!nodes) nodes = document.querySelectorAll('*');
        nodes.forEach(node => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const computedCursor = window.getComputedStyle(node).cursor;
            const hasGrabAttr  = node.getAttribute('data-grab') === 'true';
            const hasGrabClass = node.classList && Array.from(node.classList).some(c => {
                const cc = c.toLowerCase();
                return cc === 'grab' || cc === 'grabbable';
            });
            if (computedCursor === 'grab' || computedCursor === '-webkit-grab' || hasGrabAttr || hasGrabClass) {
                setupGrabbingListeners(node);
            }
        });
    }

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                scanAndApplyCursors(mutation.addedNodes);
            } else if (mutation.type === 'attributes') {
                if (['style', 'class', 'draggable', 'data-grab'].includes(mutation.attributeName)) {
                    scanAndApplyCursors([mutation.target]);
                }
            } else if (mutation.type === 'characterData') {
                if (mutation.target.parentElement) {
                    scanAndApplyCursors([mutation.target.parentElement]);
                }
            }
        }
    });

    function startObserving() {
        if (!document.body) return;
        observer.observe(document.body, {
            childList: true, subtree: true, attributes: true,
            attributeFilter: ['style', 'class', 'data-grab'], characterData: false
        });
        scanAndApplyCursors(document.body.querySelectorAll('*'));
        setTimeout(() => { if (document.body) scanAndApplyCursors(document.body.querySelectorAll('*')); }, 300);
        setTimeout(() => { if (document.body) scanAndApplyCursors(document.body.querySelectorAll('*')); }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserving);
    } else {
        startObserving();
    }

    setInterval(() => {
        if (document.body) scanAndApplyCursors(document.body.querySelectorAll('*'));
    }, 2000);

    const styleObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.target.style && mutation.target.style.cursor) {
                const cursor = mutation.target.style.cursor;
                if (!cursor.includes('url')) {
                    if (cursor.includes('grabbing')) {
                        mutation.target.style.setProperty('cursor', CUSTOM_GRABBING, 'important');
                    } else if (cursor.includes('grab')) {
                        mutation.target.style.setProperty('cursor', CUSTOM_GRAB, 'important');
                    }
                }
            }
        });
    });

    function startStyleObserver() {
        if (!document.body) return;
        styleObserver.observe(document.body, {
            subtree: true, attributes: true,
            attributeFilter: ['style'], attributeOldValue: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startStyleObserver);
    } else {
        startStyleObserver();
    }
})();