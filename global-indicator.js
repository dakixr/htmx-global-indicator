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
      target.classList.add("htmx-loading");
      var spinnerTimer = setTimeout(function () {
        target.classList.add("show-spinner");
      }, spinnerDelay);
      indicatorMap.set(xhr, { el: target, timer: spinnerTimer });
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
        entry.el.classList.remove("show-spinner");
        entry.el.classList.remove("htmx-loading");
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
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(2px);
          z-index: 99998;
          animation: fadeIn 0.1s linear;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .dark .htmx-loading::before {
            background: rgba(0, 0, 0, 0.85);
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
      `;
document.head.appendChild(style);

