/**
 * StayBoost Theme Extension - Client-side Popup Implementation
 * Handles exit-intent detection and popup display on storefront
 * 
 * TODO: Testing and Integration Needed
 * - [ ] Add comprehensive unit tests for exit-intent detection algorithms
 * - [ ] Test mobile back button detection and browser compatibility
 * - [ ] Create cross-browser compatibility tests (Chrome, Firefox, Safari, Edge)
 * - [ ] Test popup positioning and responsiveness across devices
 * - [ ] Add performance tests for script loading and initialization
 * - [ ] Test session storage functionality and persistence
 * - [ ] Validate API integration error handling and fallbacks
 * - [ ] Add accessibility tests (WCAG 2.1 AA compliance)
 * - [ ] Test popup animations and transitions performance
 * - [ ] Integration with theme customizer settings and validation
 * - [ ] Test A/B variant assignment and display
 * - [ ] Validate multi-language popup display
 * - [ ] Test frequency control integration
 * - [ ] Add popup analytics tracking validation
 * - [ ] Test edge cases (slow networks, API failures)
 * - [ ] Validate popup styling across different themes
 * - [ ] Test popup interaction tracking accuracy
 * - [ ] Add error logging and monitoring integration
 * - [ ] Test popup display on various screen sizes
 * - [ ] Validate exit-intent sensitivity settings
 */

(function () {
  function getDataAttr(name) {
    var el =
      document.currentScript ||
      document.querySelector('script[src*="stayboost-popup.js"]');
    return el ? el.getAttribute(name) : null;
  }
  var apiUrl = getDataAttr("data-stayboost-api-url");
  if (!apiUrl) {
    console.warn("[StayBoost] Missing data-stayboost-api-url on script tag.");
    return;
  }
  var shopDomain = getDataAttr("data-shop-domain");
  try {
    var u = new URL(apiUrl, location.origin);
    if (shopDomain && !u.searchParams.get("shop")) {
      u.searchParams.set("shop", shopDomain);
    }
    apiUrl = u.toString();
  } catch (e) {
    /* ignore malformed url; backend will error */
  }

  // Fetch settings and mount basic popup
  fetch(apiUrl, { credentials: "omit" })
    .then(function (r) {
      return r.json();
    })
    .then(function (payload) {
      var s = payload && payload.settings ? payload.settings : {};
      if (s.enabled === false) {
        return;
      }
      var title = s.title || "Wait! Don't leave yet!";
      var message = s.message || "Get 10% off your first order";
      var code = s.discountCode || "SAVE10";
      var percent = s.discountPercentage || 10;
      var delay = (s.delaySeconds || 0) * 1000;
      var showOnce = !!s.showOnce;

      var shown = false;
      if (showOnce && sessionStorage.getItem("stayboost_shown")) return;

      var container = document.createElement("div");
      container.style.cssText =
        "position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.4);z-index:99999";
      container.innerHTML =
        '\
        <div id="stayboost-modal" style="background:#fff;max-width:360px;width:92%;padding:20px;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.2);font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">\
          <div style="font-size:18px;font-weight:600;text-align:center">' +
        title +
        '</div>\
          <div style="margin:10px 0 16px;text-align:center">' +
        message +
        '</div>\
          <button id="stayboost-cta" style="width:100%;padding:12px 16px;background:#008060;color:#fff;border:none;border-radius:8px;cursor:pointer">Get ' +
        percent +
        "% Off - " +
        code +
        '</button>\
          <div id="stayboost-dismiss" style="margin-top:8px;text-align:center;font-size:12px;color:#666;cursor:pointer">No thanks</div>\
        </div>';
      document.body.appendChild(container);

      function show() {
        if (shown) return;
        shown = true;
        container.style.display = "flex";
        if (showOnce) sessionStorage.setItem("stayboost_shown", "1");
        
        // Record impression
        recordAnalytics('impression');
      }
      function hide() {
        container.style.display = "none";
        // Track dismiss event
        trackPerformance('dismiss', s.templateId || 0);
      }

      // Performance tracking function
      function trackPerformance(event, templateId) {
        try {
          // Generate a session ID for tracking
          var sessionId = sessionStorage.getItem('stayboost-session') || 
                         'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          sessionStorage.setItem('stayboost-session', sessionId);
          
          var trackingUrl = apiUrl.replace('/api/stayboost/settings', '/api/track-performance');
          fetch(trackingUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              event: event,
              templateId: templateId,
              sessionId: sessionId,
              conversionValue: 0 // Can be updated for revenue tracking
            }),
            credentials: 'omit'
          }).catch(function() {
            // Silently fail tracking to not interrupt user experience
          });
        } catch (e) {
          // Silently fail tracking to not interrupt user experience
        }
      }

      // Legacy analytics recording function for backwards compatibility
      function recordAnalytics(type) {
        trackPerformance(type, s.templateId || 0);
      }

      container.addEventListener("click", function (e) {
        if (e.target === container) hide();
      });
      document
        .getElementById("stayboost-dismiss")
        .addEventListener("click", hide);
      document
        .getElementById("stayboost-cta")
        .addEventListener("click", function () {
          // Record conversion before hiding
          recordAnalytics('conversion');
          hide();
        });

      // Exit intent detection (desktop): mouse leaves viewport top
      var readyAt = Date.now() + delay;
      function onMouseOut(e) {
        if (Date.now() < readyAt) return;
        if (e.clientY <= 0) {
          show();
          window.removeEventListener("mouseout", onMouseOut);
        }
      }
      window.addEventListener("mouseout", onMouseOut);

      // Optional: back button on mobile as exit intent
      window.addEventListener("popstate", function () {
        if (Date.now() >= readyAt) show();
      });
    })
    .catch(function (err) {
      console.warn("[StayBoost] Failed to load settings", err);
    });
})();
