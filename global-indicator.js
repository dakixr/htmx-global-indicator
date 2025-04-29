const indicatorMap = new WeakMap();
const spinnerDelay = 100; // delay in ms before showing the spinner

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

      // Ensure the container is relatively positioned
      if (getComputedStyle(target).position === 'static') {
        target.style.position = 'relative';
      }

      // Create overlay
      var overlay = document.createElement("div");
      overlay.className = "htmx-global-indicator-overlay";
      overlay.style.position = "absolute";
      overlay.style.background = window.document.documentElement.classList.contains('dark') ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.85)";
      overlay.style.backdropFilter = "blur(2px)";
      overlay.style.zIndex = 99998;
      overlay.style.pointerEvents = "none";
      overlay.style.animation = "fadeIn 0.1s linear";
      overlay.style.borderRadius = getComputedStyle(target).borderRadius;
      overlay.style.transition = "background 0.2s";

      // Create spinner
      var spinner = document.createElement("div");
      spinner.className = "htmx-global-indicator-spinner";
      spinner.style.position = "absolute";
      spinner.style.width = "3rem";
      spinner.style.height = "3rem";
      spinner.style.border = "3px solid";
      spinner.style.borderColor = window.document.documentElement.classList.contains('dark') ? "white transparent white transparent" : "#2563eb transparent #2563eb transparent";
      spinner.style.borderRadius = "50%";
      spinner.style.animation = "spin 0.7s ease-in-out infinite";
      spinner.style.zIndex = 99999;
      spinner.style.pointerEvents = "none";
      spinner.style.display = "none";

      // Function to update overlay/spinner position/size
      function updateOverlay() {
        if (target === document.body) {
          overlay.style.position = 'fixed';
          overlay.style.top = 0;
          overlay.style.left = 0;
          overlay.style.width = '100vw';
          overlay.style.height = '100vh';
          spinner.style.position = 'fixed';
          spinner.style.top = '50%';
          spinner.style.left = '50%';
          spinner.style.transform = 'translate(-50%, -50%)';
        } else {
          overlay.style.position = 'absolute';
          overlay.style.top = target.scrollTop + "px";
          overlay.style.left = target.scrollLeft + "px";
          overlay.style.width = target.clientWidth + "px";
          overlay.style.height = target.clientHeight + "px";
          spinner.style.position = 'absolute';
          spinner.style.top = (target.scrollTop + target.clientHeight / 2) + "px";
          spinner.style.left = (target.scrollLeft + target.clientWidth / 2) + "px";
          spinner.style.transform = 'translate(-50%, -50%)';
        }
      }

      updateOverlay();
      target.appendChild(overlay);
      target.appendChild(spinner);

      target.addEventListener('scroll', updateOverlay);
      window.addEventListener('resize', updateOverlay);

      var spinnerTimer = setTimeout(function () {
        spinner.style.display = "block";
      }, spinnerDelay);

      indicatorMap.set(xhr, { el: target, overlay, spinner, timer: spinnerTimer, updateOverlay });
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
        if (entry.overlay && entry.overlay.parentNode) entry.overlay.parentNode.removeChild(entry.overlay);
        if (entry.spinner && entry.spinner.parentNode) entry.spinner.parentNode.removeChild(entry.spinner);
        entry.el.removeEventListener('scroll', entry.updateOverlay);
        window.removeEventListener('resize', entry.updateOverlay);
        indicatorMap.delete(xhr);
      }
    }
  },
});
var style = document.createElement("style");
style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg);}
          to { transform: rotate(360deg);}
        }
      `;
document.head.appendChild(style);
