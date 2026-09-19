/*!
 * rbgallery.js — lightweight vanilla-JS photo gallery / lightbox
 * Attributes:
 *   data-thumb-orientation="portrait|landscape" (default: landscape)
 *   data-view="fi|wp"                           (default: wp)
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function formatDate(raw) {
    if (!raw) return '';
    var d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function mapUrl(location) {
    if (!location) return null;
    var parts = location.split(',').map(function (s) { return s.trim(); });
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    return 'https://www.google.com/maps?q=' + encodeURIComponent(parts[0] + ',' + parts[1]);
  }

  function clampRatio(ratio) {
    if (!ratio || !isFinite(ratio)) return null;
    return Math.min(2.3, Math.max(0.55, ratio));
  }

  function parseItem(img) {
    var viewAttr = img.getAttribute('data-view') || img.getAttribute('view') || 'wp';
    var orientAttr = img.getAttribute('data-thumb-orientation') || img.getAttribute('thumb-orientation') || 'landscape';

    return {
      thumb: img.getAttribute('data-thumb') || img.getAttribute('src'),
      full: img.getAttribute('src') || img.getAttribute('data-thumb'),
      thumbOrientation: orientAttr.toLowerCase() === 'portrait' ? 'portrait' : 'landscape',
      view: viewAttr.toLowerCase() === 'fi' ? 'fi' : 'wp',
      title: img.getAttribute('data-title') || '',
      description: img.getAttribute('data-description') || '',
      date: img.getAttribute('data-date') || '',
      location: img.getAttribute('data-location') || '',
      locationTitle: img.getAttribute('data-location-title') || ''
    };
  }

  var OVERLAY_MARKUP =
    '<button type="button" class="pg-btn pg-close" aria-label="Close">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.7l-1.4-1.41L9.17 12 2.9 5.71 4.3 4.3l6.3 6.3 6.3-6.3z"/></svg>' +
    '</button>' +
    '<button type="button" class="pg-btn pg-nav pg-prev" aria-label="Previous photo">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M15.4 6.4 9.8 12l5.6 5.6-1.4 1.4L7 12l7-7z"/></svg>' +
    '</button>' +
    '<button type="button" class="pg-btn pg-nav pg-next" aria-label="Next photo">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="m8.6 6.4 5.6 5.6-5.6 5.6 1.4 1.4 7-7-7-7z"/></svg>' +
    '</button>' +
    '<div class="pg-card">' +
      '<div class="pg-loading">' +
        '<span class="pg-spinner"></span>' +
        '<span class="pg-loading-text">Loading image...</span>' +
      '</div>' +
      '<div class="pg-image-pane">' +
        '<img class="pg-full-img" alt="">' +
        '<div class="pg-info-wrap">' +
          '<div class="pg-info-box">' +
            '<div class="pg-info-title"></div>' +
            '<div class="pg-info-desc"></div>' +
            '<div class="pg-info-date"></div>' +
            '<div class="pg-info-location"><a class="pg-info-loc-link" target="_blank" rel="noopener"></a></div>' +
          '</div>' +
          '<button type="button" class="pg-info-btn" aria-label="Toggle info">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="pg-content-pane">' +
        '<h2 class="pg-title"></h2>' +
        '<p class="pg-description"></p>' +
        '<div class="pg-meta pg-meta-location">' +
          '<svg class="pg-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>' +
          '<a class="pg-location-link" target="_blank" rel="noopener"></a>' +
        '</div>' +
        '<div class="pg-meta pg-meta-date">' +
          '<svg class="pg-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zM3 10v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10H3z"/></svg>' +
          '<span class="pg-date-text"></span>' +
        '</div>' +
      '</div>' +
    '</div>';

  function Gallery(root) {
    this.root = root;
    this.items = [];
    this.currentIndex = -1;
    this.overlay = null;
    this.lastFocused = null;
    this.init();
  }

  Gallery.prototype.init = function () {
    var self = this;
    var imgs = this.root.querySelectorAll('img');
    imgs.forEach(function (img) {
      if (img.closest('.pg-overlay')) return;
      if (img.getAttribute('data-pg-bound') === '1') return;
      img.setAttribute('data-pg-bound', '1');

      var item = parseItem(img);
      var index = self.items.length;
      self.items.push(item);
      self.decorateThumb(img, index);
    });
  };

  Gallery.prototype.decorateThumb = function (img, index) {
    var self = this;
    var item = this.items[index];
    var wrap = document.createElement('div');
    wrap.className = 'pg-thumb-wrap';

    if (item.thumbOrientation === 'portrait') {
      wrap.classList.add('pg-thumb-portrait');
    }

    wrap.setAttribute('role', 'button');
    wrap.setAttribute('tabindex', '0');
    var label = item.title ? 'Open photo: ' + item.title : 'Open photo';
    wrap.setAttribute('aria-label', label);

    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);
    img.src = item.thumb;
    img.classList.add('pg-thumb');
    img.loading = 'lazy';
    img.alt = img.alt || item.title || '';

    function recordRatio() {
      if (img.naturalWidth && img.naturalHeight) {
        item.ratio = img.naturalWidth / img.naturalHeight;
      }
    }
    if (img.complete && img.naturalWidth) recordRatio();
    else img.addEventListener('load', recordRatio, { once: true });

    function activate() { self.open(index, wrap); }
    wrap.addEventListener('click', activate);
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  };

  Gallery.prototype.buildOverlay = function () {
    var self = this;
    var overlay = document.createElement('div');
    overlay.className = 'pg-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = OVERLAY_MARKUP;
    document.body.appendChild(overlay);
    this.overlay = overlay;

    overlay.querySelector('.pg-close').addEventListener('click', function () { self.close(); });
    overlay.querySelector('.pg-next').addEventListener('click', function () { self.next(); });
    overlay.querySelector('.pg-prev').addEventListener('click', function () { self.prev(); });

    var infoWrap = overlay.querySelector('.pg-info-wrap');
    var infoBtn = overlay.querySelector('.pg-info-btn');
    infoBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      infoWrap.classList.toggle('pg-info-open');
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) self.close();
    });

    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') self.close();
      else if (e.key === 'ArrowRight') self.next();
      else if (e.key === 'ArrowLeft') self.prev();
    });
  };

  Gallery.prototype.open = function (index, triggerEl) {
    this.lastFocused = triggerEl || document.activeElement;
    this.currentIndex = index;
    if (!this.overlay) this.buildOverlay();
    this.overlay.classList.add('pg-open');
    document.body.classList.add('pg-noscroll');
    this.render();
    this.overlay.focus();
  };

  Gallery.prototype.close = function () {
    if (!this.overlay) return;
    this.overlay.classList.remove('pg-open');
    document.body.classList.remove('pg-noscroll');
    if (this.lastFocused && this.lastFocused.focus) this.lastFocused.focus();
  };

  Gallery.prototype.next = function () {
    if (!this.items.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this.render();
  };

  Gallery.prototype.prev = function () {
    if (!this.items.length) return;
    this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
    this.render();
  };

  var MIN_LOADING_MS = 1000;

  Gallery.prototype.render = function () {
    var self = this;
    var item = this.items[this.currentIndex];
    var overlay = this.overlay;
    var card = overlay.querySelector('.pg-card');
    var imagePane = overlay.querySelector('.pg-image-pane');
    var imgEl = overlay.querySelector('.pg-full-img');
    var spinnerEl = overlay.querySelector('.pg-spinner');
    var loadingText = overlay.querySelector('.pg-loading-text');
    var titleEl = overlay.querySelector('.pg-title');
    var descEl = overlay.querySelector('.pg-description');
    var locWrap = overlay.querySelector('.pg-meta-location');
    var locLink = overlay.querySelector('.pg-location-link');
    var dateWrap = overlay.querySelector('.pg-meta-date');
    var dateText = overlay.querySelector('.pg-date-text');

    var infoWrap = overlay.querySelector('.pg-info-wrap');
    var infoTitle = overlay.querySelector('.pg-info-title');
    var infoDesc = overlay.querySelector('.pg-info-desc');
    var infoDate = overlay.querySelector('.pg-info-date');
    var infoLocLink = overlay.querySelector('.pg-info-loc-link');

    var hasContent = !!(item.title || item.description || item.date || item.location);
    var formattedDate = formatDate(item.date);
    var url = mapUrl(item.location);

    card.classList.add('pg-is-loading');
    card.classList.remove('pg-view-fi', 'pg-no-content');
    spinnerEl.style.display = '';
    loadingText.textContent = 'Loading image...';
    infoWrap.classList.remove('pg-info-open');

    titleEl.textContent = item.title;
    titleEl.style.display = item.title ? '' : 'none';
    descEl.textContent = item.description;
    descEl.style.display = item.description ? '' : 'none';
    dateText.textContent = formattedDate;
    dateWrap.style.display = formattedDate ? '' : 'none';

    if (url) {
      locLink.href = url;
      locLink.textContent = item.locationTitle || item.location;
      locWrap.style.display = '';
    } else {
      locWrap.style.display = 'none';
    }

    infoTitle.textContent = item.title;
    infoTitle.style.display = item.title ? '' : 'none';
    infoDesc.textContent = item.description;
    infoDesc.style.display = item.description ? '' : 'none';
    infoDate.textContent = formattedDate;
    infoDate.style.display = formattedDate ? '' : 'none';

    if (url) {
      infoLocLink.href = url;
      infoLocLink.textContent = item.locationTitle || item.location;
      infoLocLink.parentElement.style.display = '';
    } else {
      infoLocLink.parentElement.style.display = 'none';
    }

    var renderToken = {};
    this._renderToken = renderToken;
    var startedAt = Date.now();

    function reveal(success) {
      if (self._renderToken !== renderToken) return;
      var wait = Math.max(0, MIN_LOADING_MS - (Date.now() - startedAt));
      setTimeout(function () {
        if (self._renderToken !== renderToken) return;
        if (success) {
          card.classList.remove('pg-is-loading');

          if (item.view === 'fi') {
            card.classList.add('pg-view-fi');
            imagePane.style.aspectRatio = '';
          } else {
            var exactRatio = clampRatio(imgEl.naturalWidth / imgEl.naturalHeight);
            if (exactRatio) imagePane.style.aspectRatio = exactRatio;
            card.classList.toggle('pg-no-content', !hasContent);
          }
        } else {
          spinnerEl.style.display = 'none';
          loadingText.textContent = 'Could not load image';
        }
      }, wait);
    }

    imgEl.onload = function () { reveal(true); };
    imgEl.onerror = function () { reveal(false); };
    imgEl.src = item.full;
    imgEl.alt = item.title || '';

    var multi = this.items.length > 1;
    overlay.querySelector('.pg-prev').style.display = multi ? '' : 'none';
    overlay.querySelector('.pg-next').style.display = multi ? '' : 'none';
  };

  function initAll() {
    var roots = document.querySelectorAll(
      '[data-photo-gallery], .photo-gallery, [id^="gallery"]'
    );
    roots.forEach(function (root) {
      if (root.getAttribute('data-pg-init') === '1') return;
      if (!root.querySelector('img')) return;
      root.setAttribute('data-pg-init', '1');
      new Gallery(root);
    });
  }

  ready(initAll);

  window.PhotoGallery = { init: initAll };
})();