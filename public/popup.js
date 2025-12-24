/**
 * Popup-Max - Embed Script
 */

(function () {
  'use strict';

  console.log('%c🚀 Popup-Max Script Initialized', 'color: #007bff; font-weight: bold;');

  const scriptTag = document.currentScript || document.querySelector('script[data-site-id]');
  const siteId = scriptTag?.getAttribute('data-site-id');
  if (!siteId) return console.error('Popup-Max: Site ID missing.');

  const scriptSrc = scriptTag?.src || '';
  const origin = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));

  let popupConfigs = [];
  let activePopups = {};
  let teaserElement = null;
  let exitIntentBound = false;
  const SUBMIT_KEY_PREFIX = 'popup_max_submitted_';

  async function fetchPopupConfig() {
    try {
      const lastVariantId = localStorage.getItem('popup_max_last_variant_' + siteId);
      let url = `${origin}/api/embed/${siteId}${lastVariantId ? `?lastVariantId=${lastVariantId}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        popupConfigs = data.data;
        popupConfigs.forEach(config => {
          activePopups[config.popupId] = { shown: false, closed: false, element: null, config: config, leadId: null };
        });
        return true;
      }
      return false;
    } catch (e) { return false; }
  }

  async function trackEvent(type, config) {
    if (!config) return;
    try {
      fetch(`${origin}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, popupId: config.popupId, type }),
      });
    } catch (e) { }
  }

  const VISITOR_KEY = 'popup_max_visitor_id';
  const VISITS_KEY = 'popup_max_visits';
  function initVisitorTracking() {
    let vid = sessionStorage.getItem(VISITOR_KEY) || ('v_' + Math.random().toString(36).substr(2, 9));
    sessionStorage.setItem(VISITOR_KEY, vid);
    let vts = parseInt(sessionStorage.getItem(VISITS_KEY) || '0');
    if (!sessionStorage.getItem('popup_max_session_active')) {
      vts++;
      sessionStorage.setItem(VISITS_KEY, vts.toString());
      sessionStorage.setItem('popup_max_session_active', 'true');
    }
    return { vid, vts };
  }

  const matches = (act, val, typ) => {
    if (!act && act !== 0 && act !== false) return false;
    act = String(act).toLowerCase(); val = String(val).toLowerCase();
    switch (typ) {
      case 'exact': return act === val;
      case 'startsWith': return act.startsWith(val);
      case 'endsWith': return act.endsWith(val);
      case 'notContains': return !act.includes(val);
      default: return act.includes(val);
    }
  };

  function checkTriggers(config) {
    const id = config.popupId;
    const instance = activePopups[id];
    if (instance.shown || instance.closed) return;

    const triggers = config.triggers || {};
    const settings = config.settings || {};
    const isSubmitted = sessionStorage.getItem(SUBMIT_KEY_PREFIX + id);

    const { vts } = initVisitorTracking();
    const vType = triggers.visitorType || 'all';

    let allowed = true;
    if (isSubmitted && vType !== 'all') allowed = false;
    if (allowed && (vType === 'session_unique' || vType === 'unique') && sessionStorage.getItem('popup_max_shown_' + id)) allowed = false;
    if (allowed && vType === 'persistent_unique' && localStorage.getItem('popup_max_shown_' + id)) allowed = false;
    if (allowed && vType === 'repeater' && vts <= 1) allowed = false;

    const path = window.location.pathname === '/' ? '/' : window.location.pathname.replace(/\/$/, '');
    const urlMatch = !triggers.pageUrl?.length || triggers.pageUrl.some(r => {
      const rv = r.value === '/' ? '/' : r.value.replace(/\/$/, '');
      const m = matches(path, rv, r.matchType);
      console.log(`[Popup-Max] URL Match for ${id}: ${path} vs ${rv} -> ${m}`);
      return m;
    });

    const titleMatch = !triggers.pageTitle?.length || triggers.pageTitle.some(r => {
      const m = matches(document.title, r.value, r.matchType);
      console.log(`[Popup-Max] Title Match for ${id}: "${document.title}" vs "${r.value}" -> ${m}`);
      return m;
    });

    if (!urlMatch || !titleMatch) return;

    if (allowed) {
      if (triggers.timeDelay > 0) setTimeout(() => showPopup(config), triggers.timeDelay * 1000);
      else if (triggers.scrollPercentage > 0) {
        const h = () => {
          if ((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100 >= triggers.scrollPercentage) {
            showPopup(config); window.removeEventListener('scroll', h);
          }
        };
        window.addEventListener('scroll', h);
      }
      else if (triggers.exitIntent) setupExitIntent(config);
      else showPopup(config);
    }

    if (settings.overState?.enabled) {
      if (settings.overState.triggers?.displayMode === 'always' || (allowed && !instance.shown && !instance.closed)) showTeaser(config);
    }
  }

  function showTeaser(config) {
    if (activePopups[config.popupId].shown || teaserElement) return;
    const ost = config.settings.overState;
    teaserElement = document.createElement('div');
    teaserElement.style.cssText = `position:fixed;bottom:20px;left:20px;z-index:2147483640;background:${ost.style?.backgroundColor || '#007bff'};color:${ost.style?.color || '#fff'};padding:10px 20px;border-radius:30px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-weight:bold;`;
    teaserElement.innerHTML = `<span>${ost.text || 'Open Offer'}</span>`;
    teaserElement.onclick = () => { hideTeaser(); showPopup(config, true); };
    document.body.appendChild(teaserElement);
  }

  function hideTeaser() { if (teaserElement) { teaserElement.parentNode.removeChild(teaserElement); teaserElement = null; } }

  function createPopup(config) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:${config.settings?.overlayColor || 'rgba(0,0,0,0.5)'};z-index:2147483646;display:flex;align-items:center;justify-content:center;`;
    const popup = document.createElement('div');
    popup.id = 'popup-max-popup';
    popup.style.cssText = `background:${config.settings?.backgroundColor || '#fff'};padding:${config.settings?.padding || '2rem'};border-radius:${config.settings?.borderRadius || '8px'};width:${config.settings?.width || '500px'};position:relative;box-shadow:0 10px 40px rgba(0,0,0,0.2);`;
    const form = document.createElement('form');
    form.onsubmit = (e) => e.preventDefault();
    const pages = {};
    (config.components || []).forEach(c => { const p = c.pageIndex || 0; if (!pages[p]) pages[p] = []; pages[p].push(c); });
    Object.keys(pages).sort().forEach((pk, i) => {
      const s = document.createElement('div'); s.className = 'pm-step'; s.dataset.step = pk; if (i !== 0) s.style.display = 'none';
      pages[pk].forEach(c => { const el = createComponentElement(c); if (el) s.appendChild(el); });
      form.appendChild(s);
    });
    popup.appendChild(form);
    if (config.settings?.closeButton?.show !== false) {
      const cl = document.createElement('button'); cl.innerHTML = '&times;'; cl.style.cssText = 'position:absolute;top:10px;right:10px;background:none;border:none;font-size:24px;cursor:pointer;';
      cl.onclick = () => closePopup(config); popup.appendChild(cl);
    }
    form.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-action]');
      if (b) handleAction(config, b.dataset.action, form, b.dataset.url, b.dataset.triggerPopupId);
    });

    form.addEventListener('input', (e) => {
      if (e.target.classList.contains('popup-data-field')) {
        const step = e.target.closest('.pm-step');
        if (step) updateButtonStates(form, parseInt(step.dataset.step));
      }
    });

    setTimeout(() => updateButtonStates(form, 0), 100);
    overlay.appendChild(popup);
    activePopups[config.popupId].element = overlay;
    return overlay;
  }

  function createComponentElement(c) {
    const { type, content, style, id } = c; let el;
    if (type === 'title') el = document.createElement('h2');
    else if (type === 'description') el = document.createElement('p');
    else if (type === 'button') {
      el = document.createElement('button'); el.textContent = content.text || 'Submit'; el.dataset.action = content.action || 'submit';
      if (content.actionUrl) el.dataset.url = content.actionUrl;
      if (content.triggerPopupId) el.dataset.triggerPopupId = content.triggerPopupId;
    }
    else if (['email', 'phone', 'number', 'shortText', 'date'].includes(type)) {
      el = document.createElement('input');
      const p = content.placeholder || c.label || id || '';
      el.placeholder = p;
      if (type === 'date') {
        el.type = 'text';
        el.onfocus = () => el.type = 'date';
        el.onblur = () => { if (!el.value) el.type = 'text'; };
      } else if (type === 'number') {
        el.type = 'number';
        el.inputMode = 'numeric';
        el.pattern = '[0-9]*';
      } else {
        el.type = type === 'email' ? 'email' : (type === 'phone' ? 'tel' : 'text');
      }
      el.name = c.label || id; el.classList.add('popup-data-field');
      if (content.validation?.required || content.required) {
        el.required = true;
        el.dataset.required = 'true';
      }
      if (content.validation?.pattern) el.dataset.pattern = content.validation.pattern;
      if (content.validation?.min) el.dataset.min = content.validation.min;
      if (content.validation?.max) el.dataset.max = content.validation.max;
    }
    else if (type === 'longText') {
      el = document.createElement('textarea');
      el.placeholder = content.placeholder || c.label || id || '';
      el.name = c.label || id; el.classList.add('popup-data-field');
      if (content.validation?.required || content.required) {
        el.required = true;
        el.dataset.required = 'true';
      }
      if (content.validation?.min) el.dataset.min = content.validation.min;
      if (content.validation?.max) el.dataset.max = content.validation.max;
    }
    else if (type === 'image') { el = document.createElement('img'); el.src = content.src || ''; el.style.maxWidth = '100%'; }
    else if (type === 'timer') { el = document.createElement('div'); startTimer(el, content.targetDate); }
    else if (type === 'marquee') { el = document.createElement('div'); el.innerHTML = `<div style="display:inline-block;animation:pmMarqueeLeft ${content.speed || 10}s linear infinite;">${content.text || ''}</div>`; el.style.overflow = 'hidden'; el.style.whiteSpace = 'nowrap'; }
    if (el) {
      if (!['input', 'textarea', 'button', 'img'].includes(el.tagName.toLowerCase())) el.textContent = content.text || '';
      Object.assign(el.style, {
        width: '100%',
        marginBottom: style?.marginBottom || '1rem',
        color: style?.color,
        fontSize: style?.fontSize,
        textAlign: style?.textAlign,
        padding: style?.padding || (['input', 'textarea', 'button'].includes(el.tagName.toLowerCase()) ? '0.75rem' : undefined),
        backgroundColor: style?.backgroundColor,
        borderRadius: style?.borderRadius,
        border: style?.border || (['input', 'textarea'].includes(el.tagName.toLowerCase()) ? '1px solid #ccc' : 'none'),
        boxSizing: 'border-box'
      });
    }
    return el;
  }

  function validateField(field) {
    if (!field) return { valid: true, message: '' };
    const val = field.value.trim();

    if (field.dataset.required === 'true' && !val) {
      return { valid: false, message: 'This field is required' };
    }

    if (field.type === 'email' && val) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        return { valid: false, message: 'Please enter a valid email address' };
      }
    }

    if (field.type === 'number' && val) {
      if (isNaN(val)) {
        return { valid: false, message: 'Please enter a valid number' };
      }
    }

    if (field.dataset.pattern && val) {
      const regex = new RegExp(field.dataset.pattern);
      if (!regex.test(val)) {
        return { valid: false, message: 'Invalid format' };
      }
    }

    const minLen = field.dataset.min ? parseInt(field.dataset.min) : null;
    const maxLen = field.dataset.max ? parseInt(field.dataset.max) : null;

    if (minLen !== null && val.length < minLen) {
      const fieldType = field.type === 'number' ? 'digits' : 'characters';
      return { valid: false, message: `Minimum ${minLen} ${fieldType} required` };
    }

    if (maxLen !== null && val.length > maxLen) {
      const fieldType = field.type === 'number' ? 'digits' : 'characters';
      return { valid: false, message: `Maximum ${maxLen} ${fieldType} allowed` };
    }

    return { valid: true, message: '' };
  }

  function validateStep(form, stepIndex) {
    const step = form.querySelector(`.pm-step[data-step="${stepIndex}"]`);
    if (!step) return true;

    const fields = step.querySelectorAll('.popup-data-field');
    let allValid = true;

    for (const field of fields) {
      const result = validateField(field);

      // Remove existing error message
      const existingError = field.parentElement.querySelector('.pm-error-message');
      if (existingError) existingError.remove();

      if (!result.valid) {
        allValid = false;
        field.style.borderColor = '#ef4444';

        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'pm-error-message';
        errorDiv.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 0.25rem;';
        errorDiv.textContent = result.message;
        field.parentElement.appendChild(errorDiv);
      } else {
        field.style.borderColor = '';
      }
    }
    return allValid;
  }

  function updateButtonStates(form, stepIndex) {
    const step = form.querySelector(`.pm-step[data-step="${stepIndex}"]`);
    if (!step) return;

    const buttons = step.querySelectorAll('button[data-action="next"], button[data-action="submit"]');
    const isValid = validateStep(form, stepIndex);

    buttons.forEach(btn => {
      btn.disabled = !isValid;
      btn.style.opacity = isValid ? '1' : '0.5';
      btn.style.cursor = isValid ? 'pointer' : 'not-allowed';
    });
  }

  function startTimer(el, td) {
    const end = new Date(td).getTime(); if (isNaN(end)) return;
    setInterval(() => {
      const dist = end - new Date().getTime(); if (dist < 0) { el.innerHTML = "EXPIRED"; return; }
      const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60)), s = Math.floor((dist % (1000 * 60)) / 1000);
      el.innerHTML = `${h}h ${m}m ${s}s`;
    }, 1000);
  }

  async function handleAction(config, action, form, url, triggerPopupId) {
    const cs = form.querySelector('.pm-step:not([style*="display: none"])'), si = parseInt(cs.dataset.step);

    const saveLead = async () => {
      const fd = {}; cs.querySelectorAll('.popup-data-field').forEach(i => fd[i.name || i.id] = i.value);
      try {
        const r = await fetch(`${origin}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteId, popupId: config.popupId, data: fd, leadId: activePopups[config.popupId].leadId }),
        });
        const d = await r.json();
        if (d.success && d.data?._id) activePopups[config.popupId].leadId = d.data._id;
      } catch (e) { console.error('Popup-Max: Save error', e); }
    };

    if (action === 'close') closePopup(config);
    else if (action === 'next' || action === 'submit') {
      await saveLead();
      if (action === 'next') {
        const n = form.querySelector(`.pm-step[data-step="${si + 1}"]`);
        if (n) { cs.style.display = 'none'; n.style.display = 'block'; }
      } else {
        sessionStorage.setItem(SUBMIT_KEY_PREFIX + config.popupId, 'true');
        showThankYou(config);
        activePopups[config.popupId].leadId = null;
      }
    } else if (action === 'prev') {
      const p = form.querySelector(`.pm-step[data-step="${si - 1}"]`);
      if (p) { cs.style.display = 'none'; p.style.display = 'block'; }
    } else if (action === 'link' && url) {
      await saveLead();
      window.location.href = url;
    } else if (action === 'trigger_popup' && triggerPopupId) {
      await saveLead();
      closePopup(config);
      try {
        const r = await fetch(`${origin}/api/embed/popup/${triggerPopupId}`);
        const d = await r.json();
        if (d.success && d.data) {
          const cfg = d.data;
          activePopups[cfg.popupId] = { shown: false, closed: false, element: null, config: cfg, leadId: null };
          setTimeout(() => showPopup(cfg, true), 300);
        }
      } catch (e) { console.error('Error triggering chained popup:', e); }
    }
  }

  function showThankYou(config) {
    const inst = activePopups[config.popupId], cont = inst.element.querySelector('#popup-max-popup'), tyi = config.settings?.thankYouPageIndex;
    if (typeof tyi === 'number') {
      const s = cont.querySelector(`.pm-step[data-step="${tyi}"]`);
      if (s) { cont.querySelectorAll('.pm-step').forEach(ss => ss.style.display = 'none'); s.style.display = 'block'; setTimeout(() => closePopup(config), 3000); return; }
    }
    cont.innerHTML = '<div style="text-align:center;padding:2rem;"><h2>Thank You!</h2></div>'; setTimeout(() => closePopup(config), 3000);
  }

  function showPopup(config, bypass = false) {
    const id = config.popupId; if (activePopups[id].shown || (activePopups[id].closed && !bypass)) return;
    const ov = createPopup(config); document.body.appendChild(ov);
    activePopups[id].shown = true; sessionStorage.setItem('popup_max_shown_' + id, 'true');
    if (config.testGroupId) localStorage.setItem('popup_max_last_variant_' + siteId, config.popupId);
    trackEvent('view', config);
  }

  function closePopup(config) {
    const id = config.popupId, inst = activePopups[id];
    if (inst.element) { inst.element.parentNode.removeChild(inst.element); inst.element = null; inst.shown = false; inst.closed = true; if (config.settings?.overState?.enabled) showTeaser(config); }
  }

  function setupExitIntent(config) {
    if (exitIntentBound) return;
    document.addEventListener('mouseout', (e) => { if (!e.relatedTarget && !e.toElement) showPopup(config); });
    exitIntentBound = true;
  }

  async function init() {
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); return; }
    if (await fetchPopupConfig()) popupConfigs.forEach(c => { trackEvent('visit', c); checkTriggers(c); });
  }

  if (!document.getElementById('pm-styles')) {
    const s = document.createElement('style'); s.id = 'pm-styles';
    s.textContent = '@keyframes pmMarqueeLeft {0%{transform:translateX(100%);} 100%{transform:translateX(-100%);}}';
    document.head.appendChild(s);
  }

  init();
})();
