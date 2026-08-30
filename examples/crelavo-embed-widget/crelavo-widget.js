(function (window, document) {
  'use strict';

  function mount(selector, options) {
    var root = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!root) throw new Error('CrelavoWidget: mount target was not found.');

    var config = Object.assign({
      siteUrl: 'https://www.crelavo.com',
      title: 'Turn a product link into a video',
      buttonText: 'Create with Crelavo',
      placeholder: 'Paste your product URL'
    }, options || {});

    root.innerHTML = '';
    var form = document.createElement('form');
    form.className = 'crelavo-widget';
    form.innerHTML = '<div class="crelavo-widget__eyebrow">AI ecommerce production</div>' +
      '<h3 class="crelavo-widget__title"></h3>' +
      '<div class="crelavo-widget__row"><input class="crelavo-widget__input" type="url" required autocomplete="url"><button class="crelavo-widget__button" type="submit"></button></div>' +
      '<p class="crelavo-widget__message" role="status" aria-live="polite"></p>';
    form.querySelector('.crelavo-widget__title').textContent = config.title;
    form.querySelector('.crelavo-widget__input').placeholder = config.placeholder;
    form.querySelector('.crelavo-widget__button').textContent = config.buttonText;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('.crelavo-widget__input');
      var message = form.querySelector('.crelavo-widget__message');
      var url;
      try { url = new URL(input.value); } catch (_) { url = null; }
      if (!url || !/^https?:$/.test(url.protocol)) {
        message.textContent = 'Please enter a valid product URL.';
        input.focus();
        return;
      }
      var destination = new URL('/dashboard/create', config.siteUrl);
      destination.searchParams.set('idea', 'Product link to video ad');
      destination.searchParams.set('product_url', url.toString());
      window.open(destination.toString(), '_blank', 'noopener,noreferrer');
      message.textContent = 'Opening Crelavo production brief…';
    });

    root.appendChild(form);
    return form;
  }

  window.CrelavoWidget = { mount: mount };
}(window, document));
