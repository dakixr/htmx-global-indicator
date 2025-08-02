const indicatorMap = new WeakMap();
const spinnerDelay = 400; // delay in ms before showing the spinner

// --- GLOBAL OVERLAY SPINNER ---
let globalOverlay = null;
let globalSpinner = null;
let globalOverlayTimer = null;
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
      // Detect if target is <body> or a boosted request
      var isBody = target === document.body;
      var isBoosted = evt.detail.boosted === true || evt.detail.elt.hasAttribute("hx-boost");
      if (isBody || isBoosted) {
        showGlobalOverlay(); // Show overlay instantly
        globalOverlayTimer = setTimeout(showGlobalSpinner, spinnerDelay);
        indicatorMap.set(xhr, { el: null, timer: globalOverlayTimer, isGlobal: true });
      } else {
        target.classList.add("htmx-loading");
        var spinnerTimer = setTimeout(function () {
          target.classList.add("show-spinner");
        }, spinnerDelay);
        indicatorMap.set(xhr, { el: target, timer: spinnerTimer, isGlobal: false });
      }
    } else if (
      name === "htmx:afterRequest" ||
      name === "htmx:responseError" ||
      name === "htmx:abort" ||
      name === "htmx:beforeOnLoad" ||
      name === "htmx:timeout" ||
      name === "htmx:sendError" ||
      name === "htmx:swapError" ||
      name === "htmx:onLoadError" ||
      name === "htmx:sendAbort"
    ) {
      var xhr = evt.detail.xhr;
      var entry = indicatorMap.get(xhr);
      if (entry) {
        clearTimeout(entry.timer);
        if (entry.isGlobal) {
          hideGlobalOverlayAndSpinner();
        } else if (entry.el) {
          entry.el.classList.remove("show-spinner");
          entry.el.classList.remove("htmx-loading");
        }
        indicatorMap.delete(xhr);
      }
    }
  },
});
var style = document.createElement("style");
style.textContent = `
        .htmx-loading { position: relative; overflow: hidden; }
        .htmx-loading::before {
          position: absolute;
          content: '';
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(255, 255, 255);
          backdrop-filter: blur(2px);
          z-index: 99998;
          /* animation: fadeIn 0.1s linear; */
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .dark .htmx-loading::before {
            background: rgba(0, 0, 0);
        }
        .htmx-loading.show-spinner::after {
          position: absolute;
          content: '';
          top: 50%; left: 50%;
          width: 3rem; height: 3rem;
          margin: -1.5rem 0 0 -1.5rem;
          border: 3px solid;
          border-color: #2563eb transparent #2563eb transparent;
          border-radius: 50%;
          animation: spin 0.7s ease-in-out infinite;
          z-index: 99999;
        }
        .dark .htmx-loading.show-spinner::after {
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
          background: #fff;
          align-items: center;
          justify-content: center;
        }
        .dark .htmx-global-overlay-spinner {
          background: #000;
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
