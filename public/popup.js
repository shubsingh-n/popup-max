/**
 * Popup-Max - Embed Script
 * 
 * This script loads asynchronously and injects popups into host websites.
 * Usage: <script src="https://yourapp.com/popup.js" data-site-id="SITE_ID"></script>
 */

(function () {
  'use strict';

  // Log script initialization
  console.log('%c🚀 Popup-Max Script', 'color: #007bff; font-weight: bold; font-size: 14px;');
  console.log('%cScript loaded successfully!', 'color: #28a745; font-weight: bold;');

  // Get site ID from script tag
  const scriptTag = document.currentScript || document.querySelector('script[data-site-id]');
  const siteId = scriptTag?.getAttribute('data-site-id');

  if (!siteId) {
    console.error('%c❌ Popup-Max Error:', 'color: #dc3545; font-weight: bold;', 'Site ID is required. Add data-site-id attribute to the script tag.');
    return;
  }

  console.log('%c✓ Site ID detected:', 'color: #28a745;', siteId);

  // Get the origin (protocol + host) from the script src
  const scriptSrc = scriptTag?.src || '';
  const origin = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));

  console.log('%c✓ API Origin:', 'color: #28a745;', origin);

  // State
  let popupConfig = null;
  let popupShown = false;
  let popupElement = null;
  let teaserElement = null;
  let timeDelayTimer = null;
  let exitIntentBound = false;
  let teaserDelayTimer = null;
  let popupFilled = localStorage.getItem('popup_max_filled') === 'true';

  /**
   * Fetch popup configuration from API
   */
  async function fetchPopupConfig() {
    try {
      console.log('%c⏳ Fetching popup configuration...', 'color: #ffc107;');
      const response = await fetch(`${origin}/api/embed/${siteId}`);
      const data = await response.json();

      if (data.success && data.data) {
        popupConfig = data.data;
        console.log('%c✓ Popup configuration loaded!', 'color: #28a745; font-weight: bold;');
        console.log('%c  Title:', 'color: #6c757d;', popupConfig.title);
        console.log('%c  Triggers:', 'color: #6c757d;', {
          timeDelay: popupConfig.triggers?.timeDelay || 'disabled',
          exitIntent: popupConfig.triggers?.exitIntent ? 'enabled' : 'disabled'
        });
        return true;
      } else {
        console.warn('%c⚠ No active popup found for this site', 'color: #ffc107;');
        return false;
      }
    } catch (error) {
      console.error('%c❌ Popup-Max Error:', 'color: #dc3545; font-weight: bold;', 'Error fetching popup config:', error);
      return false;
    }
  }

  /**
   * Track analytics event
   */
  async function trackEvent(type) {
    if (!popupConfig) return;

    try {
      await fetch(`${origin}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId,
          popupId: popupConfig.popupId,
          type: type,
        }),
      });
    } catch (error) {
      console.error('Popup-Max: Error tracking event:', error);
    }
  }


  /**
   * Visitor Tracking Helper
   */
  const VISITOR_KEY = 'popup_max_visitor_id';
  const VISITS_KEY = 'popup_max_visits';

  function initVisitorTracking() {
    let visitorId = localStorage.getItem(VISITOR_KEY);
    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(VISITOR_KEY, visitorId);
    }

    let visits = parseInt(localStorage.getItem(VISITS_KEY) || '0');

    // Check if this is a new session (simple check: if referrer is external or empty, or time gap)
    // For simplicity in MVP, we increment on every page load (acting as "views")
    // A better approach would be session-based using sessionStorage
    if (!sessionStorage.getItem('popup_max_session_active')) {
      visits++;
      localStorage.setItem(VISITS_KEY, visits.toString());
      sessionStorage.setItem('popup_max_session_active', 'true');
    }

    return { visitorId, visits };
  }

  // Define global API
  window.PopupMax = {
    open: function () {
      showPopup();
    }
  };

  /**
   * Check matching rules
   */
  function checkTriggers() {
    if (popupShown) return;

    const triggers = popupConfig.triggers || {};
    const settings = popupConfig.settings || {};

    // --- 1. Visitor Rules ---
    const { visits } = initVisitorTracking();
    const visitorType = triggers.visitorType || 'all';
    const requiredCount = triggers.visitorCount || 0;

    if (visitorType === 'unique' && visits > 1) {
      console.log('%c⊘ Visitor is not unique (Visit #' + visits + ')', 'color: #6c757d;');
      return;
    }
    if (visitorType === 'repeater' && visits <= 1) {
      console.log('%c⊘ Visitor is not a repeater (Visit #' + visits + ')', 'color: #6c757d;');
      return;
    }
    // Specific visit count trigger (e.g. only on 4th visit)
    if (requiredCount > 0 && visits !== requiredCount) {
      console.log('%c⊘ Visit count mismatch (Current: ' + visits + ', Required: ' + requiredCount + ')', 'color: #6c757d;');
      return;
    }


    // --- 2. Page/Content Targeting ---
    let shouldShow = false;

    // Helper for match types
    const matches = (actual, ruleValue, matchType) => {
      if (!actual && actual !== 0 && actual !== false) return false;
      actual = String(actual).toLowerCase();
      ruleValue = String(ruleValue).toLowerCase();

      switch (matchType) {
        case 'exact': return actual === ruleValue;
        case 'contains': return actual.includes(ruleValue);
        case 'startsWith': return actual.startsWith(ruleValue);
        case 'endsWith': return actual.endsWith(ruleValue);
        case 'notContains': return !actual.includes(ruleValue);
        case 'equals': return actual == ruleValue;
        case 'greaterThan': return parseFloat(actual) > parseFloat(ruleValue);
        case 'lessThan': return parseFloat(actual) < parseFloat(ruleValue);
        default: return actual.includes(ruleValue);
      }
    };

    // URL Targeting
    const urlRules = triggers.pageUrl || [];
    const urlMatch = urlRules.length === 0 || urlRules.some(rule => matches(window.location.pathname, rule.value, rule.matchType));

    // Title Targeting
    const titleRules = triggers.pageTitle || [];
    const titleMatch = titleRules.length === 0 || titleRules.some(rule => matches(document.title, rule.value, rule.matchType));

    // JS Variable Targeting
    const jsRules = triggers.jsVariable || [];
    const jsMatch = jsRules.length === 0 || jsRules.some(rule => {
      const actual = window[rule.name];
      if (typeof actual === 'undefined') return false;
      return matches(actual, rule.value, rule.matchType);
    });

    if (!urlMatch || !titleMatch || !jsMatch) {
      console.log('%c⊘ Targeting rules not met', 'color: #6c757d;');
      return;
    }

    // --- 3. Dynamic Triggers (Events) ---
    let hasEventTriggers = false;

    // Time Delay
    if (triggers.timeDelay !== null && triggers.timeDelay !== undefined && triggers.timeDelay > 0) {
      hasEventTriggers = true;
      setTimeout(() => showPopup(), triggers.timeDelay * 1000);
    }

    // Scroll Percentage
    if (triggers.scrollPercentage > 0) {
      hasEventTriggers = true;
      const scrollHandler = () => {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent >= triggers.scrollPercentage) {
          showPopup();
          window.removeEventListener('scroll', scrollHandler);
        }
      };
      window.addEventListener('scroll', scrollHandler);
    }

    // Click Trigger (New & Legacy)
    // Support usage of #my-button in the "clickTrigger" field
    const clickSelector = triggers.clickTrigger || triggers.clickElement;
    if (clickSelector) {
      hasEventTriggers = true;
      console.log('%c✓ Waiting for click on: ' + clickSelector, 'color: #28a745;');

      // Use event delegation to handle dynamic elements
      document.addEventListener('click', (e) => {
        if (e.target.closest(clickSelector)) {
          e.preventDefault(); // Optional: prevent default if it's a link? Defaulting to yes for triggers.
          showPopup();
        }
      });
    }

    // Inactivity
    if (triggers.inactivityTime > 0) {
      hasEventTriggers = true;
      let inactivityTimer;
      const resetInactivity = () => {
        if (popupShown) return;
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => showPopup(), triggers.inactivityTime * 1000);
      };
      ['mousemove', 'keypress', 'scroll', 'click'].forEach(evt =>
        document.addEventListener(evt, resetInactivity)
      );
      resetInactivity();
    }

    // Exit Intent matches existing logic but verified here too
    if (triggers.exitIntent) {
      hasEventTriggers = true;
      setupExitIntent();
    }

    // If no event triggers, show immediately (if targeting matched)
    if (!hasEventTriggers) {
      showPopup();
    }

    // --- 4. Over-state (Teaser) Logic ---
    if (settings.overState?.enabled) {
      const teaserTriggers = settings.overState.triggers || {};
      const displayMode = teaserTriggers.displayMode || 'always';

      const initTeaser = () => {
        if (popupShown) return;
        if (displayMode === 'closed_not_filled' && popupFilled) return;

        if (displayMode === 'after_delay' && teaserTriggers.delay > 0) {
          teaserDelayTimer = setTimeout(() => showTeaser(), teaserTriggers.delay * 1000);
        } else {
          showTeaser();
        }
      };

      initTeaser();
    }
  }

  /**
   * Create and Show Teaser
   */
  function showTeaser() {
    if (popupShown || teaserElement || !popupConfig?.settings?.overState?.enabled) return;

    const overState = popupConfig.settings.overState;
    const teaser = document.createElement('div');
    teaser.id = 'popup-max-teaser';

    // Position
    const pos = window.innerWidth < 768
      ? (overState.triggers?.positionMobile || 'bottom-left')
      : (overState.triggers?.positionDesktop || 'bottom-left');

    let posStyles = '';
    if (pos.includes('bottom')) posStyles += 'bottom: 20px; ';
    else posStyles += 'top: 20px; ';

    if (pos.includes('left')) posStyles += 'left: 20px; ';
    else if (pos.includes('right')) posStyles += 'right: 20px; ';
    else posStyles += 'left: 50%; transform: translateX(-50%); ';

    const style = overState.style || {};
    teaser.style.cssText = `
      position: fixed;
      ${posStyles}
      z-index: 2147483640;
      background-color: ${style.backgroundColor || '#007bff'};
      color: ${style.color || '#ffffff'};
      padding: ${style.padding || '10px 20px'};
      border-radius: ${style.borderRadius || '30px'};
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-weight: ${style.fontWeight || 'bold'};
      font-size: ${style.fontSize || '14px'};
      display: flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.2s, opacity 0.3s;
      animation: pmFadeIn 0.3s ease-out;
    `;

    teaser.innerHTML = `<span>${overState.text || 'Open Offer'}</span>`;

    if (overState.showClose !== false) {
      const close = document.createElement('span');
      close.innerHTML = '&times;';
      close.style.cssText = 'font-size: 20px; line-height: 1; margin-left: 5px; opacity: 0.7;';
      close.onclick = (e) => {
        e.stopPropagation();
        hideTeaser();
      };
      teaser.appendChild(close);
    }

    teaser.onclick = () => {
      hideTeaser();
      showPopup();
    };

    document.body.appendChild(teaser);
    teaserElement = teaser;
  }

  function hideTeaser() {
    if (teaserElement) {
      teaserElement.style.opacity = '0';
      teaserElement.style.transform = 'scale(0.9)';
      setTimeout(() => {
        if (teaserElement && teaserElement.parentNode) {
          teaserElement.parentNode.removeChild(teaserElement);
        }
        teaserElement = null;
      }, 300);
    }
  }

  /**
   * Create and inject popup HTML
   */
  function createPopup() {
    if (!popupConfig || popupElement) return;

    // Create overlay
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'popup-max-overlay';

    // Position Logic
    const settings = popupConfig.settings || {};
    const position = window.innerWidth < 768
      ? (settings.position?.mobile || 'center')
      : (settings.position?.desktop || 'center');

    let justify = 'center';
    let align = 'center';

    if (position.includes('left')) justify = 'flex-start';
    if (position.includes('right')) justify = 'flex-end';
    if (position.includes('top')) align = 'flex-start';
    if (position.includes('bottom')) align = 'flex-end';

    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: ${settings.overlayColor || 'rgba(0, 0, 0, 0.5)'};
      z-index: 2147483646;
      display: flex;
      align-items: ${align};
      justify-content: ${justify};
      padding: 20px; /* Safety padding for edges */
      box-sizing: border-box;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // Trigger reflow for fade-in effect on overlay
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });

    // Create popup container
    // Create popup container
    const popup = document.createElement('div');
    popup.id = 'popup-max-popup';

    // Check if using new component-based structure
    if (popupConfig.components && popupConfig.components.length > 0) {
      // NEW DYNAMIC RENDERER
      const settings = popupConfig.settings || {};

      popup.style.cssText = `
        background-color: ${settings.backgroundColor || '#ffffff'};
        background-image: ${settings.backgroundImage ? `url(${settings.backgroundImage})` : 'none'};
        background-size: cover;
        background-position: center;
        padding: ${settings.padding || '2rem'};
        border-radius: ${settings.borderRadius || '8px'};
        width: ${settings.width || '500px'};
        min-height: ${settings.height === 'auto' ? 'auto' : settings.height};
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        position: relative;
        display: flex;
        flex-direction: column;
      `;

      // Determine Animation
      const animType = window.innerWidth < 768
        ? (settings.animation?.mobile || 'fade')
        : (settings.animation?.desktop || 'fade');

      // Add animation class
      popup.classList.add(`popup-anim-${animType}`);

      // Render Components (Multi-step)
      const form = document.createElement('form');
      form.id = `pm-form-${popupConfig._id}`;
      form.style.width = '100%';
      form.onsubmit = (e) => e.preventDefault(); // Handle manually

      // Group by Page Index
      const pages = {};
      popupConfig.components.forEach(comp => {
        const pIdx = comp.pageIndex || 0;
        if (!pages[pIdx]) pages[pIdx] = [];
        pages[pIdx].push(comp);
      });

      Object.keys(pages).sort().forEach((pageKey, index) => {
        const pageIndex = parseInt(pageKey);
        const pageDiv = document.createElement('div');
        pageDiv.className = 'pm-step';
        pageDiv.dataset.step = pageIndex;
        if (index !== 0) pageDiv.style.display = 'none';

        pages[pageIndex].forEach(comp => {
          const el = createComponentElement(comp);
          if (el) pageDiv.appendChild(el);
        });
        form.appendChild(pageDiv);
      });

      popup.appendChild(form);

      // Event Delegation
      form.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (btn) {
          e.preventDefault();
          handleAction(popupConfig._id, btn.dataset.action, form, btn.dataset.url);
        }
      });

    } else {
      // LEGACY RENDERER (Fallback)
      popup.style.cssText = `
        background-color: ${popupConfig.styles.backgroundColor};
        color: ${popupConfig.styles.textColor};
        padding: 2rem;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        position: relative;
        animation: slideUp 0.3s ease-out;
      `;

      // Create title
      const title = document.createElement('h2');
      title.textContent = popupConfig.title;
      title.style.cssText = `
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 1rem;
        color: ${popupConfig.styles.textColor};
      `;
      popup.appendChild(title);

      // Create description
      const description = document.createElement('p');
      description.textContent = popupConfig.description;
      description.style.cssText = `
        margin-bottom: 1.5rem;
        color: ${popupConfig.styles.textColor};
        line-height: 1.5;
      `;
      popup.appendChild(description);

      // Create Simple Form
      const form = document.createElement('form');
      form.onsubmit = handleSubmit;

      const emailInput = document.createElement('input');
      emailInput.type = 'email';
      emailInput.name = 'email';
      emailInput.placeholder = 'Enter your email';
      emailInput.required = true;
      emailInput.style.cssText = `
        width: 100%;
        padding: 0.75rem;
        margin-bottom: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        box-sizing: border-box;
      `;

      const submitBtn = document.createElement('button');
      submitBtn.type = 'submit';
      submitBtn.textContent = popupConfig.ctaText;
      submitBtn.style.cssText = `
        width: 100%;
        padding: 0.75rem;
        margin-bottom: 1rem; // Add margin in case we add more
        background-color: ${popupConfig.styles.buttonColor};
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      `;

      form.appendChild(emailInput);
      form.appendChild(submitBtn);
      popup.appendChild(form);
    }

    // Customizable Close Button
    const closeSettings = popupConfig.settings?.closeButton || { show: true, position: 'top-right', color: '#000000' };

    if (closeSettings.show !== false) {
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

      let posStyle = '';
      const pos = closeSettings.position || 'top-right';
      if (pos.includes('top')) posStyle += 'top: 10px; bottom: auto; ';
      if (pos.includes('bottom')) posStyle += 'top: auto; bottom: 10px; ';
      if (pos.includes('left')) posStyle += 'left: 10px; right: auto; ';
      if (pos.includes('right')) posStyle += 'left: auto; right: 10px; ';

      closeBtn.style.cssText = `
        position: absolute;
        ${posStyle}
        background: none;
        border: none;
        cursor: pointer;
        color: ${closeSettings.color || '#000000'};
        padding: 5px;
        z-index: 10;
        display: flex; 
        align-items: center; 
        justify-content: center;
        opacity: 0.8;
        transition: opacity 0.2s;
      `;
      closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
      closeBtn.onmouseout = () => closeBtn.style.opacity = '0.8';
      closeBtn.onclick = closePopup;
      popup.appendChild(closeBtn);
    }

    overlay.appendChild(popup);

    // Add CSS animations (same as before)
    if (!document.getElementById('popup-max-styles')) {
      const style = document.createElement('style');
      style.id = 'popup-max-styles';
      style.textContent = `
        /* Animations */
        @keyframes pmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pmSlideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pmSlideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pmZoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pmSlideLeft { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes pmSlideRight { from { transform: translateX(-50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        .popup-anim-fade { animation: pmFadeIn 0.4s ease-out forwards; }
        .popup-anim-slide-up { animation: pmSlideUp 0.4s ease-out forwards; }
        .popup-anim-slide-down { animation: pmSlideDown 0.4s ease-out forwards; }
        .popup-anim-zoom { animation: pmZoomIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .popup-anim-slide-left { animation: pmSlideLeft 0.4s ease-out forwards; }
        .popup-anim-slide-right { animation: pmSlideRight 0.4s ease-out forwards; }

        .popup-anim-slide-left { animation: pmSlideLeft 0.4s ease-out forwards; }
        .popup-anim-slide-right { animation: pmSlideRight 0.4s ease-out forwards; }

        /* Marquee */
        @keyframes pmMarqueeLeft { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        @keyframes pmMarqueeRight { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .pm-marquee-container { overflow: hidden; white-space: nowrap; position: relative; }
        .pm-marquee-content { display: inline-block; }

        .popup-max-input {
           outline: none;
           transition: border-color 0.2s;
        }
        .popup-max-input:focus {
           border-color: #007bff;
        }
      `;
      document.head.appendChild(style);
    }

    popupElement = overlay;
    return overlay;
  }

  /**
   * Helper to create Dynamic Component Element
   */
  function createComponentElement(component) {
    const { type, content, style, id } = component;
    let el;

    // Apply styles helper
    const applyStyles = (element, cssObj) => {
      Object.assign(element.style, {
        marginBottom: cssObj.marginBottom || '1rem',
        marginTop: cssObj.marginTop || '0',
        color: cssObj.color,
        fontSize: cssObj.fontSize ? (isNaN(cssObj.fontSize) ? cssObj.fontSize : cssObj.fontSize + 'px') : undefined,
        fontWeight: cssObj.fontWeight,
        textAlign: cssObj.textAlign,
        backgroundColor: cssObj.backgroundColor,
        padding: cssObj.padding ? (isNaN(cssObj.padding) ? cssObj.padding + 'px' : cssObj.padding) : undefined,
        borderRadius: cssObj.borderRadius ? (isNaN(cssObj.borderRadius) ? cssObj.borderRadius + 'px' : cssObj.borderRadius) : undefined,
        borderWidth: cssObj.borderWidth ? (isNaN(cssObj.borderWidth) ? cssObj.borderWidth + 'px' : cssObj.borderWidth) : undefined,
        borderColor: cssObj.borderColor,
        borderStyle: cssObj.border ? 'solid' : (cssObj.borderWidth ? 'solid' : 'none'),
        width: cssObj.width || '100%',
        boxSizing: 'border-box',
      });
      // Override shorthand
      if (cssObj.border) element.style.border = cssObj.border;
    };

    // Validation Attributes
    const setValidation = (element) => {
      if (content.validation?.required) element.required = true;
      if (content.validation?.min) element.minLength = content.validation.min;
      if (content.validation?.max) element.maxLength = content.validation.max;
      if (type === 'phone' && content.validation?.min) element.pattern = `.{${content.validation.min},${content.validation.max || ''}}`;

      element.name = component.label || id;
      element.id = `f-${id}`;
      element.classList.add('popup-data-field');
      element.classList.add('popup-max-input');
    };

    switch (type) {
      case 'title':
        el = document.createElement('h2');
        el.textContent = content.text || '';
        break;

      case 'description':
        el = document.createElement('p');
        el.textContent = content.text || '';
        break;

      case 'button':
        el = document.createElement('button');
        el.textContent = content.text || 'Submit';
        el.dataset.action = content.action || 'submit';
        if (content.actionUrl) el.dataset.url = content.actionUrl;
        el.style.cursor = 'pointer';
        break;

      case 'email':
        el = document.createElement('input');
        el.type = 'email';
        el.placeholder = content.placeholder || '';
        setValidation(el);
        break;

      case 'phone':
        el = document.createElement('input');
        el.type = 'tel';
        el.placeholder = content.placeholder || '';
        setValidation(el);
        break;

      case 'shortText':
        el = document.createElement('input');
        el.type = 'text';
        el.placeholder = content.placeholder || '';
        setValidation(el);
        break;

      case 'longText':
        el = document.createElement('textarea');
        el.placeholder = content.placeholder || '';
        setValidation(el);
        break;

      case 'image':
        el = document.createElement('img');
        el.src = content.src || '';
        el.alt = 'Popup Image';
        el.style.maxWidth = '100%';
        el.style.objectFit = 'contain';
        break;

      case 'date':
        el = document.createElement('input');
        el.type = 'date';
        setValidation(el);
        break;

      case 'timer':
        el = document.createElement('div');
        el.innerHTML = '<span>00</span>:<span>00</span>:<span>00</span>';
        el.style.display = 'flex';
        el.style.justifyContent = 'center';
        el.style.gap = '10px';
        el.style.fontWeight = 'bold';
        startTimer(el, content.targetDate);
        break;

      case 'marquee':
        el = document.createElement('div');
        el.className = 'pm-marquee-container';

        const inner = document.createElement('div');
        inner.className = 'pm-marquee-content';
        inner.textContent = content.text || '';

        const speed = content.speed || 10;
        const dir = content.direction || 'left';
        const animName = dir === 'left' ? 'pmMarqueeLeft' : 'pmMarqueeRight';

        inner.style.animation = `${animName} ${speed}s linear infinite`;
        el.appendChild(inner);
        break;

      default:
        return null;
    }

    if (el) {
      applyStyles(el, style);
      // Ensure inputs have basic styling
      if (['INPUT', 'TEXTAREA'].includes(el.tagName)) {
        if (!style.border && !style.borderWidth) el.style.border = '1px solid #ccc';
        if (!style.padding) el.style.padding = '0.5rem';
        if (!style.borderRadius) el.style.borderRadius = '4px';
      }
    }

    return el;
  }

  function startTimer(el, targetDate) {
    // Simple countdown implementation
    const end = new Date(targetDate).getTime();
    if (isNaN(end)) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(interval);
        el.innerHTML = "EXPIRED";
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      el.innerHTML = `
        <div style="text-align:center"><div style="font-size:1.2em">${days}</div><div style="font-size:0.6em">Days</div></div>:
        <div style="text-align:center"><div style="font-size:1.2em">${hours}</div><div style="font-size:0.6em">Hrs</div></div>:
        <div style="text-align:center"><div style="font-size:1.2em">${minutes}</div><div style="font-size:0.6em">Min</div></div>:
        <div style="text-align:center"><div style="font-size:1.2em">${seconds}</div><div style="font-size:0.6em">Sec</div></div>
      `;
    }, 1000);
  }

  function handleAction(popupId, action, form, url) {
    const currentStepDiv = form.querySelector('.pm-step:not([style*="display: none"])');
    const currentStepIdx = parseInt(currentStepDiv.dataset.step);

    // Validation
    if (action === 'next' || action === 'submit') {
      const inputs = currentStepDiv.querySelectorAll('input, textarea, select');
      let isValid = true;
      inputs.forEach(input => {
        if (!input.checkValidity()) {
          input.reportValidity();
          isValid = false;
        }
      });
      if (!isValid) return;
    }

    if (action === 'close') {
      closePopup();
    } else if (action === 'link') {
      if (url) window.location.href = url;
    } else if (action === 'next') {
      const nextStep = form.querySelector(`.pm-step[data-step="${currentStepIdx + 1}"]`);
      if (nextStep) {
        currentStepDiv.style.display = 'none';
        nextStep.style.display = 'block';
      }
    } else if (action === 'prev') {
      const prevStep = form.querySelector(`.pm-step[data-step="${currentStepIdx - 1}"]`);
      if (prevStep) {
        currentStepDiv.style.display = 'none';
        prevStep.style.display = 'block';
      }
    } else if (action === 'submit') {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      // Track conversion view
      const popupConfig = window.PopupMax.popups.find(p => p._id === popupId);
      if (popupConfig) {
        // Increment conversion needed? API needed?
        // For now just log
        console.log('PopupMax Conversion:', data);
      }

      alert('Sent! (Demo Mode)');
      closePopup();
    }
  }



  /**
   * Show popup
   */
  function showPopup() {
    if (popupShown || !popupConfig) return;

    const overlay = createPopup();
    if (overlay) {
      document.body.appendChild(overlay);
      popupShown = true;
      console.log('%c🎯 Popup displayed!', 'color: #28a745; font-weight: bold;');
      trackEvent('view');

      // Auto Close Logic
      const autoCloseDelay = popupConfig.triggers?.autoCloseDelay;
      if (autoCloseDelay && autoCloseDelay > 0) {
        console.log('%c⏱ Auto-closing in ' + autoCloseDelay + 's', 'color: #17a2b8;');
        setTimeout(() => {
          if (popupShown) closePopup();
        }, autoCloseDelay * 1000);
      }

      // Close on overlay click (outside popup)
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          const closeOnOverlay = popupConfig.settings?.closeOnOverlayClick;
          if (closeOnOverlay !== false) { // Default to true if undefined
            closePopup();
          }
        }
      });
    }
  }

  /**
   * Close popup
   */
  function closePopup() {
    if (popupElement && popupElement.parentNode) {
      popupElement.parentNode.removeChild(popupElement);
      popupElement = null;
    }
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(e) {
    e.preventDefault();
    const emailInput = e.target.querySelector('input[type="email"]');
    const email = emailInput.value.trim();

    if (!email) return;

    try {
      const response = await fetch(`${origin}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId,
          popupId: popupConfig.popupId,
          email: email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        const popup = document.getElementById('popup-max-popup');
        if (popup) {
          popup.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
              <h2 style="color: ${popupConfig.styles.textColor}; margin-bottom: 1rem;">
                Thank you!
              </h2>
              <p style="color: ${popupConfig.styles.textColor};">
                We'll be in touch soon.
              </p>
            </div>
          `;
          setTimeout(closePopup, 2000);
        }
      } else {
        alert(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Popup-Max: Error submitting lead:', error);
      alert('Something went wrong. Please try again.');
    }
  }

  /**
   * Setup exit intent detection
   */
  function setupExitIntent() {
    if (exitIntentBound || !popupConfig?.triggers?.exitIntent) return;

    document.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget && !e.toElement) {
        // Mouse is leaving the window
        showPopup();
        exitIntentBound = true; // Only trigger once
      }
    });

    exitIntentBound = true;
  }

  /**
   * Initialize popup
   */
  async function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      console.log('%c⏳ Waiting for DOM to be ready...', 'color: #6c757d;');
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    console.log('%c✓ DOM is ready', 'color: #28a745;');

    // Fetch popup configuration
    const configLoaded = await fetchPopupConfig();

    if (!configLoaded || !popupConfig) {
      console.warn('%c⚠ Popup-Max script is loaded but no active popup found', 'color: #ffc107;');
      return; // No active popup or error loading config
    }

    // Initialize all targeting and triggers (including teaser)
    checkTriggers();

    // Final status
    console.log('%c✅ Popup-Max is ACTIVE and ready!', 'color: #28a745; font-weight: bold; font-size: 12px;');
    console.log('%c   Popup will appear based on configured triggers', 'color: #6c757d; font-size: 11px;');
  }

  // Start initialization
  console.log('%c🔄 Initializing Popup-Max...', 'color: #007bff;');
  init();
})();

