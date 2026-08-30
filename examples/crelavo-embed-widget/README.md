# Crelavo Embed Widget

A small, dependency-free product-link widget for ecommerce websites.

The widget collects a product URL and sends the visitor to Crelavo with the URL prefilled for an AI-powered video production brief.

## Quick start

Copy `crelavo-widget.js` and `crelavo-widget.css` into your project, then add:

```html
<div id="crelavo-widget"></div>
<link rel="stylesheet" href="./crelavo-widget.css">
<script src="./crelavo-widget.js"></script>
<script>
  CrelavoWidget.mount('#crelavo-widget', {
    siteUrl: 'https://www.crelavo.com'
  });
</script>
```

## What it does

- Accepts a Shopify, Amazon, WooCommerce or other ecommerce product URL.
- Validates that the field contains a URL before continuing.
- Opens Crelavo’s production brief with the product URL encoded safely.
- Uses no API key and sends no product data to a third party from the widget itself.

## Configuration

```js
CrelavoWidget.mount('#crelavo-widget', {
  siteUrl: 'https://www.crelavo.com',
  title: 'Turn a product link into a video',
  buttonText: 'Create with Crelavo',
  placeholder: 'Paste your product URL'
});
```

## License

MIT. See `LICENSE`.

Learn more: https://www.crelavo.com
