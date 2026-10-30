const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class AnalyticsTracker {
  constructor() {
    this.queue = [];
    this.flushInterval = 5000; // 5 seconds debounced batching
    this.timer = null;
    this.sessionId = this.getOrCreateSessionId();

    if (typeof window !== 'undefined') {
      // Auto-flush on page unload or backgrounding
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
      window.addEventListener('pagehide', () => this.flush());
    }
  }

  getOrCreateSessionId() {
    try {
      let id = localStorage.getItem('yogazen_session_id');
      if (!id) {
        id = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('yogazen_session_id', id);
      }
      return id;
    } catch {
      return `ses_${Date.now()}_temp`;
    }
  }

  enqueue(eventData) {
    const enrichedEvent = {
      sessionId: this.sessionId,
      device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
      timestamp: new Date().toISOString(),
      ...eventData
    };

    this.queue.push(enrichedEvent);

    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush();
      }, this.flushInterval);
    }
  }

  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    const payload = JSON.stringify({ events: batch });

    // Non-blocking Beacon API if supported on page hide
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        const sent = navigator.sendBeacon(`${API_BASE}/analytics/track`, blob);
        if (sent) return;
      } catch (e) {
        // Fallback to fetch below
      }
    }

    try {
      await fetch(`${API_BASE}/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        credentials: 'include',
        keepalive: true
      });
    } catch (err) {
      // Silent catch: telemetry errors must never interrupt user experience
      console.debug('Telemetry flush deferred:', err.message);
    }
  }

  // 1. Track Product Pageview & Dwell Time
  trackProductView(product, dwellTimeSeconds = 0, varietySku = '') {
    if (!product) return;
    this.enqueue({
      eventType: 'product_view',
      productId: product._id,
      productTitle: product.title,
      category: product.category,
      varietySku: varietySku || '',
      unitPrice: product.discountPrice || product.price || 0,
      dwellTimeSeconds: Math.max(0, Math.round(dwellTimeSeconds))
    });
  }

  // 2. Track Product Card Click
  trackProductClick(product, sourceComponent = 'catalog_grid') {
    if (!product) return;
    this.enqueue({
      eventType: 'product_click',
      productId: product._id,
      productTitle: product.title,
      category: product.category,
      unitPrice: product.discountPrice || product.price || 0,
      sourceComponent
    });
  }

  // 3. Track Variety Swatch Selection
  trackVarietySelect(product, variety) {
    if (!product || !variety) return;
    this.enqueue({
      eventType: 'variety_select',
      productId: product._id,
      productTitle: product.title,
      category: product.category,
      varietySku: variety.sku || '',
      varietyName: variety.name || '',
      unitPrice: variety.price || product.discountPrice || product.price || 0
    });
  }

  // 4. Track Search Queries
  trackSearch(query, resultCount = 0) {
    if (!query || !query.trim()) return;
    this.enqueue({
      eventType: 'search',
      searchQuery: query.trim(),
      metadata: { resultCount }
    });
  }

  // 5. Track Category Browsing
  trackCategoryBrowse(categoryName) {
    if (!categoryName) return;
    this.enqueue({
      eventType: 'category_browse',
      category: categoryName
    });
  }

  // 6. Track Cart Add / Remove Actions
  trackCartAction(product, varietySku = '', action = 'add_to_cart') {
    if (!product) return;
    this.enqueue({
      eventType: action,
      productId: product._id,
      productTitle: product.title,
      category: product.category,
      varietySku: varietySku || '',
      unitPrice: product.discountPrice || product.price || 0
    });
  }

  // 7. Track Wishlist Actions
  trackWishlistAction(product, action = 'add_to_wishlist') {
    if (!product) return;
    this.enqueue({
      eventType: action,
      productId: product._id,
      productTitle: product.title,
      category: product.category,
      unitPrice: product.discountPrice || product.price || 0
    });
  }
}

const tracker = new AnalyticsTracker();
export default tracker;

