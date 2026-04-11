// ── Keyboard shortcut: toggle extension ──────────────────────────────────────

chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-extension') {
        chrome.storage.local.get(['enableCustom'], (items) => {
            const newState = !(items.enableCustom !== false);
            chrome.storage.local.set({ enableCustom: newState });
        });
    }
});

// ── Stats: track sites visited with custom cursors ────────────────────────────
// Called from content.js via chrome.runtime.sendMessage

chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg.type === 'RECORD_VISIT') {
        const { packId, packName, hostname } = msg;
        if (!packId || !hostname) return;
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        chrome.storage.local.get(['stats'], (items) => {
            const stats = items.stats || {
                totalVisits: 0,
                packUsage: {},   // packId -> { name, count }
                dailyVisits: {}, // YYYY-MM-DD -> count
                sites: {},       // hostname -> { count, lastPackId, lastPackName }
            };

            stats.totalVisits = (stats.totalVisits || 0) + 1;

            if (!stats.packUsage[packId]) stats.packUsage[packId] = { name: packName || packId, count: 0 };
            stats.packUsage[packId].count++;
            stats.packUsage[packId].name = packName || packId; // keep name fresh

            stats.dailyVisits[today] = (stats.dailyVisits[today] || 0) + 1;

            if (!stats.sites[hostname]) stats.sites[hostname] = { count: 0, lastPackId: packId, lastPackName: packName };
            stats.sites[hostname].count++;
            stats.sites[hostname].lastPackId   = packId;
            stats.sites[hostname].lastPackName = packName;

            // Keep daily data for last 60 days only
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 60);
            Object.keys(stats.dailyVisits).forEach(d => {
                if (new Date(d) < cutoff) delete stats.dailyVisits[d];
            });

            chrome.storage.local.set({ stats });
        });
    }
});