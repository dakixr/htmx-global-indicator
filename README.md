# htmx-global-indicator

**A minimal HTMX extension that adds a global loading overlay and optional delayed spinner, with dark mode support.**

## Features

- Global loading indicator on HTMX requests.
- Optional spinner after a configurable delay (`100ms` default).
- Ignores preloaded (`HX-Preloaded`) requests automatically.
- Respects `hx-disinherit="global-indicator"`.
- Light and dark mode compatible.

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
<div hx-get="/endpoint" hx-disinherit="global-indicator"></div>
```

## Customization

- Change `spinnerDelay` (ms) at the top of `global-indicator.js`.
- Modify the spinner and overlay styles by editing the injected `<style>` block.

## How It Works

- On `htmx:beforeRequest`, `.htmx-loading` is added immediately.
- After `spinnerDelay`, `.show-spinner` is added.
- On any request completion or error, it removes both classes and cancels any pending timers.

## Development

No build step needed. Vanilla JS.

## License

MIT
