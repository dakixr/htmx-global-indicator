(function () {
  const indicatorMap = new Map();
  const xhrToRequestId = new WeakMap();
  const spinnerDelay = 400; // delay in ms before showing the spinner
  const overlayDelay = 100; // delay in ms before showing the overlay (0 = immediate)

  // --- GLOBAL OVERLAY SPINNER ---
  let globalOverlay = null;
  let globalSpinner = null;

  // --- HTMX EXTENSION ---
  htmx.defineExtension("global-indicator", {
    onEvent: function (name, evt) {
      // scope requests and delay spinner separately
      if (name === "htmx:beforeRequest") {
        // ignore preloaded requests
        if (evt.detail.requestConfig?.headers?.["HX-Preloaded"] === "true") {
          return;
        }
        // ignore when hx-disinherit lists global-indicator
        if (evt.detail.elt.matches('[hx-disinherit~="global-indicator"]')) {
          return;
        }

        var target = evt.detail.target;
        var xhr = evt.detail.xhr;

        // generate a random id to associate with this request
        var requestId = generateRequestId();
        xhrToRequestId.set(xhr, requestId);
        xhr._globalIndicatorId = requestId;

        // Detect if target is <body> or a boosted request
        var isBody = target === document.body;
        var isBoosted =
          evt.detail.boosted === true ||
          evt.detail.elt.hasAttribute("hx-boost");

        if (isBody || isBoosted) {
          addGlobalIndicator(requestId);
        } else {
          addLocalIndicator(requestId, target);
        }
      } else if (
        name === "htmx:afterRequest" ||
        name === "htmx:responseError" ||
        name === "htmx:abort" ||
        name === "htmx:afterSwap" ||
        name === "htmx:beforeSwap" ||
        name === "htmx:historyRestore" ||
        name === "htmx:timeout" ||
        name === "htmx:sendError" ||
        name === "htmx:swapError" ||
        name === "htmx:onLoadError" ||
        name === "htmx:sendAbort" ||
        name === "htmx:beforeCleanupElement" || 
        name === "htmx:afterSettle" ||
        name === "htmx:xhr:loadend" ||
        name === "htmx:beforeOnLoad" ||
        name === "htmx:afterOnLoad"
      ) {
        var xhr = evt.detail.xhr;
        var didFinalize = false;
        if (xhr) didFinalize = finalizeRequest(xhr);
        if (!didFinalize) {
          var el = evt.detail && (evt.detail.target || evt.detail.elt);
          if (el) finalizeByElement(el);
        }
      }
    },
  });

  function addLocalIndicator(requestId, target) {
    var entryLocal = {
      el: target,
      overlayTimer: null,
      spinnerTimer: null,
      isGlobal: false,
      overlayEl: null,
      spinnerEl: null,
    };
    indicatorMap.set(requestId, entryLocal);
    entryLocal.overlayTimer = setTimeout(function () {
      if (!indicatorMap.has(requestId)) return;
      // create a fixed overlay that covers the target viewport
      if (!entryLocal.overlayEl) {
        var overlay = document.createElement("div");
        overlay.className = "htmx-local-overlay";
        document.body.appendChild(overlay);
        entryLocal.overlayEl = overlay;
        positionOverlay(overlay, target);
      }
      target.classList.add("htmx-loading");
    }, overlayDelay);
    entryLocal.spinnerTimer = setTimeout(function () {
      if (!indicatorMap.has(requestId)) return;
      // ensure overlay exists
      if (!entryLocal.overlayEl) {
        var overlay = document.createElement("div");
        overlay.className = "htmx-local-overlay";
        document.body.appendChild(overlay);
        entryLocal.overlayEl = overlay;
        positionOverlay(overlay, target);
      }
      if (!entryLocal.spinnerEl) {
        var spinner = document.createElement("div");
        spinner.className = "htmx-local-spinner";
        entryLocal.overlayEl.appendChild(spinner);
        entryLocal.spinnerEl = spinner;
      }
      target.classList.add("show-spinner");
    }, spinnerDelay);
  }

  function addGlobalIndicator(requestId) {
    var entryGlobal = {
      el: null,
      overlayTimer: null,
      spinnerTimer: null,
      isGlobal: true,
    };
    indicatorMap.set(requestId, entryGlobal);
    entryGlobal.overlayTimer = setTimeout(function () {
      if (!indicatorMap.has(requestId)) return;
      showGlobalOverlay(); // Show overlay after delay
    }, overlayDelay);
    entryGlobal.spinnerTimer = setTimeout(function () {
      if (!indicatorMap.has(requestId)) return;
      showGlobalSpinner();
    }, spinnerDelay);
  }

  function showGlobalOverlay() {
    if (!globalOverlay) {
      globalOverlay = document.createElement("div");
      globalOverlay.className = "htmx-global-overlay-spinner";
    }
    // If overlay was removed by an HX swap, re-append it
    if (!document.body.contains(globalOverlay)) {
      document.body.appendChild(globalOverlay);
    }
    globalOverlay.style.display = "flex";
    // Remove old spinner if present so we can show a fresh one later
    if (globalSpinner && globalSpinner.parentNode) {
      globalSpinner.parentNode.removeChild(globalSpinner);
    }
  }
  function showGlobalSpinner() {
    if (!globalSpinner) {
      globalSpinner = document.createElement("div");
      globalSpinner.className = "htmx-global-spinner";
    }
    if (globalOverlay && !globalSpinner.parentNode) {
      globalOverlay.appendChild(globalSpinner);
    }
  }
  function hideGlobalOverlayAndSpinner() {
    if (globalOverlay) {
      globalOverlay.style.display = "none";
    }
    if (globalSpinner && globalSpinner.parentNode) {
      globalSpinner.parentNode.removeChild(globalSpinner);
    }
    globalSpinner = null;
  }

  function finalizeRequest(xhr) {
    const requestId = (xhr && xhrToRequestId.get(xhr)) || (xhr && xhr._globalIndicatorId);
    const entry = indicatorMap.get(requestId);
    if (!entry) return false;
    if (entry.overlayTimer) clearTimeout(entry.overlayTimer);
    if (entry.spinnerTimer) clearTimeout(entry.spinnerTimer);
    if (entry.isGlobal) {
      hideGlobalOverlayAndSpinner();
    } else if (entry.el) {
      entry.el.classList.remove("show-spinner");
      entry.el.classList.remove("htmx-loading");
      if (entry.overlayEl && entry.overlayEl.parentNode) {
        entry.overlayEl.parentNode.removeChild(entry.overlayEl);
      }
      entry.overlayEl = null;
      entry.spinnerEl = null;
    }

    indicatorMap.delete(requestId);
    return true;
  }
  
  function finalizeByElement(el) {
    if (!el) return false;
    var foundId = null;
    for (const [id, entry] of indicatorMap) {
      if (entry.el === el) {
        foundId = id;
        break;
      }
    }
    if (!foundId) return false;
    const entry = indicatorMap.get(foundId);
    if (entry.overlayTimer) clearTimeout(entry.overlayTimer);
    if (entry.spinnerTimer) clearTimeout(entry.spinnerTimer);
    if (entry.isGlobal) {
      hideGlobalOverlayAndSpinner();
    } else if (entry.el) {
      entry.el.classList.remove("show-spinner");
      entry.el.classList.remove("htmx-loading");
      if (entry.overlayEl && entry.overlayEl.parentNode) {
        entry.overlayEl.parentNode.removeChild(entry.overlayEl);
      }
      entry.overlayEl = null;
      entry.spinnerEl = null;
    }
    indicatorMap.delete(foundId);
    return true;
  }

  function generateRequestId() {
    return Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  }

  function positionOverlay(overlay, target) {
    var rect = target.getBoundingClientRect();
    overlay.style.top = rect.top + "px";
    overlay.style.left = rect.left + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
  }

  // --- STYLES ---
  var style = document.createElement("style");
  style.textContent = `
        .htmx-loading { position: relative; }
        .htmx-local-overlay {
          position: fixed;
          background: rgba(255, 255, 255);
          backdrop-filter: blur(2px);
          z-index: 99998;
          pointer-events: auto;
          /* animation: fadeIn 0.1s linear; */
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .dark .htmx-local-overlay {
            background: oklch(0.145 0 0);
        }
        .htmx-local-spinner {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 3rem; height: 3rem;
          border: 3px solid;
          border-color: #2563eb transparent #2563eb transparent;
          border-radius: 50%;
          animation: spin 0.7s ease-in-out infinite;
          z-index: 99999;
          pointer-events: none;
        }
        .dark .htmx-local-spinner {
            border-color: white transparent white transparent;
        }
        @keyframes spin { 
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); } 
        }
        /* GLOBAL OVERLAY SPINNER */
        .htmx-global-overlay-spinner {
          display: none;
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          z-index: 100000;
          background: oklch(0.145 0 0);
          align-items: center;
          justify-content: center;
        }
        .dark .htmx-global-overlay-spinner {
          background: oklch(0.145 0 0);
        }
        .htmx-global-spinner {
          width: 3rem; height: 3rem;
          border: 3px solid #2563eb;
          border-color: #2563eb transparent #2563eb transparent;
          border-radius: 50%;
          animation: spin 0.7s ease-in-out infinite;
          z-index: 99999;
        }
        .dark .htmx-global-spinner {
          border-color: white transparent white transparent;
        }
      `;
  document.head.appendChild(style);
})();
