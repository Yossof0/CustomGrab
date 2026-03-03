document.addEventListener('DOMContentLoaded', () => {
    const grabInput = document.getElementById('grabInput');
    const grabbingInput = document.getElementById('grabbingInput');
    const grabPreview = document.getElementById('grabPreview');
    const grabbingPreview = document.getElementById('grabbingPreview');
    const resetBtn = document.getElementById('resetBtn');
    const enableCheckbox = document.getElementById('enableCheckbox');
    const syncHotspot = document.getElementById('syncHotspot');
    const hotspotX = document.getElementById('hotspotX');
    const hotspotY = document.getElementById('hotspotY');
    const hotspotGrabX = document.getElementById('hotspotGrabX');
    const hotspotGrabY = document.getElementById('hotspotGrabY');
    const hotspotGrabbingX = document.getElementById('hotspotGrabbingX');
    const hotspotGrabbingY = document.getElementById('hotspotGrabbingY');
    const accentColor = document.getElementById('accentColor');

    function applyAccent(color) {
        document.documentElement.style.setProperty('--accent', color);
    }

    function updateHotspotUI() {
        if (syncHotspot.checked) {
            // sync enabled: show shared pair and hide separate controls
            document.getElementById('sharedHotspot').style.display = '';
            document.getElementById('separateHotspot').style.display = 'none';
        } else {
            // sync disabled: copy shared values into both sets if they are empty
            if (hotspotGrabX.value === '' && hotspotGrabY.value === '') {
                hotspotGrabX.value = hotspotX.value;
                hotspotGrabY.value = hotspotY.value;
                saveSetting('hotspotGrabX', parseInt(hotspotGrabX.value,10));
                saveSetting('hotspotGrabY', parseInt(hotspotGrabY.value,10));
            }
            if (hotspotGrabbingX.value === '' && hotspotGrabbingY.value === '') {
                hotspotGrabbingX.value = hotspotX.value;
                hotspotGrabbingY.value = hotspotY.value;
                saveSetting('hotspotGrabbingX', parseInt(hotspotGrabbingX.value,10));
                saveSetting('hotspotGrabbingY', parseInt(hotspotGrabbingY.value,10));
            }
            document.getElementById('sharedHotspot').style.display = 'none';
            document.getElementById('separateHotspot').style.display = '';
        }
    }

    function loadSettings() {
        chrome.storage.local.get([
            'grabCursor','grabbingCursor','enableCustom',
            'hotspotX','hotspotY','hotspotGrabX','hotspotGrabY',
            'hotspotGrabbingX','hotspotGrabbingY','syncHotspot','accentColor'
        ], items => {
            enableCheckbox.checked = items.enableCustom !== false; // default true
            syncHotspot.checked = items.syncHotspot !== false; // default true
            updateHotspotUI();

            hotspotX.value = items.hotspotX != null ? items.hotspotX : 16;
            hotspotY.value = items.hotspotY != null ? items.hotspotY : 16;
            hotspotGrabX.value = items.hotspotGrabX != null ? items.hotspotGrabX : 16;
            hotspotGrabY.value = items.hotspotGrabY != null ? items.hotspotGrabY : 16;
            hotspotGrabbingX.value = items.hotspotGrabbingX != null ? items.hotspotGrabbingX : 16;
            hotspotGrabbingY.value = items.hotspotGrabbingY != null ? items.hotspotGrabbingY : 16;

            const ac = items.accentColor || '#4caf50';
            accentColor.value = ac;
            applyAccent(ac);

            if (items.grabCursor) {
                grabPreview.src = items.grabCursor;
            } else {
                grabPreview.src = chrome.runtime.getURL('resources/grab.png');
            }
            if (items.grabbingCursor) {
                grabbingPreview.src = items.grabbingCursor;
            } else {
                grabbingPreview.src = chrome.runtime.getURL('resources/grabbing.png');
            }
        });
    }

    function saveFile(file, key, previewEl) {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            const obj = {};
            obj[key] = dataUrl;
            chrome.storage.local.set(obj, () => {
                previewEl.src = dataUrl;
            });
        };
        reader.readAsDataURL(file);
    }

    function saveSetting(key, value) {
        const obj = {};
        obj[key] = value;
        chrome.storage.local.set(obj);
    }

    grabInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
            saveFile(e.target.files[0], 'grabCursor', grabPreview);
        }
    });

    grabbingInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
            saveFile(e.target.files[0], 'grabbingCursor', grabbingPreview);
        }
    });

    enableCheckbox.addEventListener('change', () => {
        saveSetting('enableCustom', enableCheckbox.checked);
    });

    syncHotspot.addEventListener('change', () => {
        saveSetting('syncHotspot', syncHotspot.checked);
        if (!syncHotspot.checked) {
            // copy shared hotspots into both fields so user sees current value
            const sx = parseInt(hotspotX.value, 10) || 0;
            const sy = parseInt(hotspotY.value, 10) || 0;
            hotspotGrabX.value = sx; saveSetting('hotspotGrabX', sx);
            hotspotGrabY.value = sy; saveSetting('hotspotGrabY', sy);
            hotspotGrabbingX.value = sx; saveSetting('hotspotGrabbingX', sx);
            hotspotGrabbingY.value = sy; saveSetting('hotspotGrabbingY', sy);
        }
        updateHotspotUI();
    });

    hotspotX.addEventListener('input', () => {
        const v = parseInt(hotspotX.value, 10);
        if (!isNaN(v)) saveSetting('hotspotX', v);
    });
    hotspotY.addEventListener('input', () => {
        const v = parseInt(hotspotY.value, 10);
        if (!isNaN(v)) saveSetting('hotspotY', v);
    });
    hotspotGrabX.addEventListener('input', () => {
        const v = parseInt(hotspotGrabX.value, 10);
        if (!isNaN(v)) saveSetting('hotspotGrabX', v);
    });
    hotspotGrabY.addEventListener('input', () => {
        const v = parseInt(hotspotGrabY.value, 10);
        if (!isNaN(v)) saveSetting('hotspotGrabY', v);
    });
    hotspotGrabbingX.addEventListener('input', () => {
        const v = parseInt(hotspotGrabbingX.value, 10);
        if (!isNaN(v)) saveSetting('hotspotGrabbingX', v);
    });
    hotspotGrabbingY.addEventListener('input', () => {
        const v = parseInt(hotspotGrabbingY.value, 10);
        if (!isNaN(v)) saveSetting('hotspotGrabbingY', v);
    });

    accentColor.addEventListener('change', () => {
        const c = accentColor.value;
        applyAccent(c);
        saveSetting('accentColor', c);
    });

    resetBtn.addEventListener('click', () => {
        chrome.storage.local.clear(loadSettings);
    });

    loadSettings();
});