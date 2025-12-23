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
  let timeDelayTimer = null;
  let exitIntentBound = false;

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
   * Create and inject popup HTML
   */
  function createPopup() {
    if (!popupConfig || popupElement) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'popup-max-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-in;
    `;

    // Create popup container
    const popup = document.createElement('div');
    popup.id = 'popup-max-popup';
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

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: ${popupConfig.styles.textColor};
      opacity: 0.7;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeBtn.onmouseover = () => (closeBtn.style.opacity = '1');
    closeBtn.onmouseout = () => (closeBtn.style.opacity = '0.7');
    closeBtn.onclick = closePopup;

    // Create title
    const title = document.createElement('h2');
    title.textContent = popupConfig.title;
    title.style.cssText = `
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
      color: ${popupConfig.styles.textColor};
    `;

    // Create description
    const description = document.createElement('p');
    description.textContent = popupConfig.description;
    description.style.cssText = `
      margin-bottom: 1.5rem;
      color: ${popupConfig.styles.textColor};
      line-height: 1.5;
    `;

    // Create form
    const form = document.createElement('form');
    form.onsubmit = handleSubmit;

    // Create email input
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
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

    // Create submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = popupConfig.ctaText;
    submitBtn.style.cssText = `
      width: 100%;
      padding: 0.75rem;
      background-color: ${popupConfig.styles.buttonColor};
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    `;
    submitBtn.onmouseover = () => (submitBtn.style.opacity = '0.9');
    submitBtn.onmouseout = () => (submitBtn.style.opacity = '1');

    // Assemble popup
    form.appendChild(emailInput);
    form.appendChild(submitBtn);
    popup.appendChild(closeBtn);
    popup.appendChild(title);
    popup.appendChild(description);
    popup.appendChild(form);
    overlay.appendChild(popup);

    // Add CSS animations
    if (!document.getElementById('popup-max-styles')) {
      const style = document.createElement('style');
      style.id = 'popup-max-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }

    popupElement = overlay;
    return overlay;
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

      // Close on overlay click (outside popup)
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closePopup();
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

    // Setup exit intent if enabled
    if (popupConfig.triggers?.exitIntent) {
      setupExitIntent();
      console.log('%c✓ Exit intent trigger enabled', 'color: #28a745;');
    }

    // Setup time delay if enabled
    if (popupConfig.triggers?.timeDelay !== null && popupConfig.triggers?.timeDelay !== undefined) {
      const delay = popupConfig.triggers.timeDelay * 1000; // Convert to milliseconds
      console.log(`%c✓ Time delay trigger set: ${popupConfig.triggers.timeDelay} seconds`, 'color: #28a745;');
      timeDelayTimer = setTimeout(() => {
        showPopup();
      }, delay);
    } else {
      // If no triggers are set, show immediately
      console.log('%c✓ No delay configured, popup will show immediately', 'color: #28a745;');
      showPopup();
    }

    // Final status
    console.log('%c✅ Popup-Max is ACTIVE and ready!', 'color: #28a745; font-weight: bold; font-size: 12px;');
    console.log('%c   Popup will appear based on configured triggers', 'color: #6c757d; font-size: 11px;');
  }

  // Start initialization
  console.log('%c🔄 Initializing Popup-Max...', 'color: #007bff;');
  init();
})();

