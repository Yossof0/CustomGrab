(async function() {
	console.log('The Custom Grab Cursor Extension Was Programmed And Developed By Yossof0, If you are willing to share, Please give credits to the owner');

	// load any user-selected cursor images and options from storage; otherwise
	// use bundled defaults.  DataURLs are stored so they survive across pages.
	const stored = await new Promise(resolve => chrome.storage.local.get([
		'grabCursor','grabbingCursor','hotspotX','hotspotY',
		'hotspotGrabX','hotspotGrabY','hotspotGrabbingX','hotspotGrabbingY',
		'syncHotspot','enableCustom'
	], resolve));
	const GRAB_CURSOR_URL = stored.grabCursor || chrome.runtime.getURL("resources/grab.png");
	const GRABBING_CURSOR_URL = stored.grabbingCursor || chrome.runtime.getURL("resources/grabbing.png");

	// determine hotspot coordinates depending on whether the user synced them
	const sync = stored.syncHotspot !== false; // default true
	const HOTSPOT_X = sync
		? (typeof stored.hotspotX === 'number' ? stored.hotspotX : 16)
		: (typeof stored.hotspotGrabX === 'number' ? stored.hotspotGrabX : 16);
	const HOTSPOT_Y = sync
		? (typeof stored.hotspotY === 'number' ? stored.hotspotY : 16)
		: (typeof stored.hotspotGrabY === 'number' ? stored.hotspotGrabY : 16);
	// second pair used for grabbing cursor when not synced
	const HOTSPOT_X2 = sync
		? HOTSPOT_X
		: (typeof stored.hotspotGrabbingX === 'number' ? stored.hotspotGrabbingX : 16);
	const HOTSPOT_Y2 = sync
		? HOTSPOT_Y
		: (typeof stored.hotspotGrabbingY === 'number' ? stored.hotspotGrabbingY : 16);

	// if the user has disabled the custom cursor feature, do nothing further
	if (stored.enableCustom === false) {
		return;
	}

	const CUSTOM_GRAB = `url('${GRAB_CURSOR_URL}') ${HOTSPOT_X} ${HOTSPOT_Y}, grab`;
	const CUSTOM_GRABBING = `url('${GRABBING_CURSOR_URL}') ${HOTSPOT_X2} ${HOTSPOT_Y2}, grabbing`;

	// when settings change via the options page, reload so new images or options
	// (hotspot, enable/disable) take effect immediately.
	chrome.storage.onChanged.addListener((changes, area) => {
		if (area === 'local' && (changes.grabCursor || changes.grabbingCursor ||
			changes.hotspotX || changes.hotspotY ||
			changes.hotspotGrabX || changes.hotspotGrabY ||
			changes.hotspotGrabbingX || changes.hotspotGrabbingY ||
			changes.syncHotspot || changes.enableCustom)) {
			window.location.reload();
		}
	});

	// Inject a global style to replace only explicit grab cursors (including inline
	// styles) and any element manually marked with data-grab.  We no longer target
	// `[draggable]` because many elements are draggable by default and don't
	// actually use a grab cursor which was causing the default/pointer cursor
	// to be overridden.
	const styleSheet = document.createElement('style');
	styleSheet.textContent = `
		*[style*="cursor: grab"],
		*[style*="cursor:grab"],
		[data-grab="true"] {
			cursor: ${CUSTOM_GRAB} !important;
		}
	`;
	(document.head || document.documentElement).appendChild(styleSheet);

	// A set to keep track of elements we've already modified to prevent duplicate listeners
	const modifiedElements = new WeakSet();
	let globalMouseDown = false;

	/**
	 * Attaches Mousedown/Mouseup listeners to an element to handle the 'grabbing' state dynamically.
	 * Also handles pointer events and draggable elements.
	 * @param {HTMLElement} element 
	 */
	function setupGrabbingListeners(element) {
		if (modifiedElements.has(element)) return;
		// FIX #2: Immediately apply the custom cursor style upon detection 
		// to prevent the default system cursor from appearing first.
		element.style.setProperty('cursor', CUSTOM_GRAB, 'important');
		// Handle mouse events (only left-click, not right-click)
		const handleMouseDown = (e) => {
			// Only respond to left mouse button (button 0)
			if (e.button === 0) {
				globalMouseDown = true;
				element.style.setProperty('cursor', CUSTOM_GRABBING, 'important');
				document.body.offsetWidth; // Force reflow
			}
		};
		const handleMouseUp = (e) => {
			// Only respond to left mouse button
			if (e.button === 0) {
				globalMouseDown = false;
				element.style.setProperty('cursor', CUSTOM_GRAB, 'important');
				document.body.offsetWidth; // Force reflow
			}
		};
		// Attach mouse event listeners
		element.addEventListener('mousedown', handleMouseDown, true);
		element.addEventListener('mouseup', handleMouseUp, true);
		element.addEventListener('mouseleave', handleMouseUp, true); 
		// Handle leaving element while dragging
		// Also handle pointer events (modern approach used by many libraries)
		const handlePointerDown = (e) => {
			// Pointer button 0 is left-click, skip right-click (button 2)
			if (e.button === 0 || e.pointerType === 'mouse' && e.button !== 2) {
				globalMouseDown = true;
				element.style.setProperty('cursor', CUSTOM_GRABBING, 'important');
				document.body.offsetWidth; // Force reflow
			}
		};

		const handlePointerUp = (e) => {
			if (e.button === 0 || e.pointerType === 'mouse' && e.button !== 2) {
				globalMouseDown = false;
				element.style.setProperty('cursor', CUSTOM_GRAB, 'important');
				document.body.offsetWidth; // Force reflow
			}
		};

		element.addEventListener('pointerdown', handlePointerDown, true);
		element.addEventListener('pointerup', handlePointerUp, true);
		element.addEventListener('pointerleave', handlePointerUp, true);

		// Global listener for mouseup outside the element
		if (!window.__grabExtensionGlobalListenerAttached) {
			const globalMouseUp = () => {
				if (globalMouseDown) {
					globalMouseDown = false;
					// Reset all grab elements back to grab cursor
					document.querySelectorAll('*').forEach(el => {
						const computed = window.getComputedStyle(el).cursor;
						if (computed === 'grab' || computed === '-webkit-grab' || computed.includes('url') && computed.includes('grab')) {
								el.style.setProperty('cursor', CUSTOM_GRAB, 'important');
						}
					});
					document.body.offsetWidth;
				}
			};
			document.addEventListener('mouseup', globalMouseUp, true);
			document.addEventListener('pointerup', globalMouseUp, true);
			window.__grabExtensionGlobalListenerAttached = true;
		}
		modifiedElements.add(element);
	}
	/**
	 * Scans elements and applies custom cursors and event listeners.
	 * Only elements already presenting a grab cursor or explicitly marked for
	 * grabbing are processed.  This avoids interfering with generic draggable
	 * elements that use the normal pointer/default cursors.
	 */
	function scanAndApplyCursors(nodes) {
		if (!nodes) nodes = document.querySelectorAll('*');
		nodes.forEach(node => {
			if (node.nodeType === Node.ELEMENT_NODE) {
				const computedCursor = window.getComputedStyle(node).cursor;
				const hasGrabAttr = node.getAttribute('data-grab') === 'true';
				const hasGrabClass = node.classList && Array.from(node.classList).some(c => {
					const cc = c.toLowerCase();
					return cc === 'grab' || cc === 'grabbable';
				});
				if (computedCursor === 'grab' ||
					computedCursor === '-webkit-grab' ||
					hasGrabAttr ||
					hasGrabClass) {
					setupGrabbingListeners(node);
				}
			}
		});
	}
	// --- Mutation Observer Setup (watches for new elements or style changes) ---
	const observer = new MutationObserver((mutationsList) => {
		for (const mutation of mutationsList) {
			if (mutation.type === 'childList') {
				scanAndApplyCursors(mutation.addedNodes);
			} else if (mutation.type === 'attributes') {
				// Catch style, class, draggable, and data-grab attribute changes
				if (['style', 'class', 'draggable', 'data-grab'].includes(mutation.attributeName)) {
					scanAndApplyCursors([mutation.target]);
				}
			} else if (mutation.type === 'characterData') {
				// Re-scan parent if text content changes (might affect cursor)
				if (mutation.target.parentElement) {
					scanAndApplyCursors([mutation.target.parentElement]);
				}
			}
		}
	});

	// Start observing the document body for changes
	if (document.body) {
		observer.observe(document.body, { 
			childList: true, 
			subtree: true, 
			attributes: true, 
			attributeFilter: ['style', 'class', 'data-grab'],
			characterData: false
		});
		// Initial scan
		scanAndApplyCursors(document.body.querySelectorAll('*'));
	}
	// Also do periodic re-scans in case dynamic content appears without mutations
	setInterval(() => {
		if (document.body) {
			scanAndApplyCursors(document.body.querySelectorAll('*'));
		}
	}, 2000);
	// Note: the previous version injected a universal ``* { cursor: inherit; }``
	// rule which often interfered with normal cursors.  We no longer apply that
	// global override as it caused pointer/default cursors to disappear in some
	// pages.  Individual elements are handled by the listeners and the earlier
	// style rules.
	// (rule removed)
	// Watch for inline style changes and override grab cursors globally
	const styleObserver = new MutationObserver((mutations) => {
		mutations.forEach(mutation => {
			if (mutation.target.style && mutation.target.style.cursor) {
				const cursor = mutation.target.style.cursor;
				if (cursor.includes('grab') && !cursor.includes('url')) {
					mutation.target.style.setProperty('cursor', CUSTOM_GRAB, 'important');
				}
			}
		});
	});
	// Observe all elements for style changes
	if (document.body) {
		styleObserver.observe(document.body, {
			subtree: true,
			attributes: true,
			attributeFilter: ['style'],
			attributeOldValue: true
	});
	}
})();
