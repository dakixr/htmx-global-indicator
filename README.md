# htmx-global-indicator

**A minimal HTMX extension that adds a global loading overlay and optional delayed spinner, with dark mode support.**

---

## Overview

htmx-global-indicator is a minimal extension for HTMX that adds a **loading overlay** (and optional **delayed spinner**) *directly on the swap target*, based on the `target` specified in your HTMX config for that request. Not a full-screen spinner — it scopes the loading indicator to *where the swap is actually happening*.

- **Overlay and spinner** appear **only over the request's target element**.
- No full-page blocking, no centralized spinner — just precise, scoped feedback tied to the element users are actually interacting with.
- Pure vanilla JS — no dependencies, no build step.

---

## Features

- Loading indicator overlays **only the HTMX request's target element** (not full-screen).
- Optional spinner after a configurable delay (`100ms` default).
- Ignores preloaded (`HX-Preloaded`) requests automatically.
- Respects `hx-disinherit="global-indicator"` to opt out at the element level.
- Light and dark mode compatible.


**Demo**:  
[Demo](./demo.gif)

## Installation

```html
<script src="htmx.min.js"></script>
<script src="global-indicator.js"></script>
```

## Usage

Add the extension to the elements you want:

```html
<div hx-get="/endpoint" hx-ext="global-indicator"></div>
```

If you want to opt out of the global indicator on child elements:

```html
<div hx-get="/endpoint" hx-ext="global-indicator">
  <div hx-get="/other-endpoint" hx-disinherit="global-indicator">This child will not show the indicator</div>
</div>
```

## Customization

- Change `spinnerDelay` (ms) at the top of `global-indicator.js`.
- Modify the spinner and overlay styles by editing the injected `<style>` block.

## How It Works

- On `htmx:beforeRequest`, `.htmx-loading` is immediately added to the **target**.
- After `spinnerDelay`, `.show-spinner` is added.
- After request completion, error, or abort, the classes are removed and any timers are cleared.

No full-page blocking, no centralized spinner — just precise, scoped feedback tied to the element users are actually interacting with.

## Feedback

Feedback, criticism, suggestions — all welcome!

## Development

No build step needed. Vanilla JS.

## License

MIT
