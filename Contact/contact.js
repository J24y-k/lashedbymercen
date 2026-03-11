/**
 * LASHED BY MERCEN — contact.js
 * Features:
 *  - Full client-side form validation with inline errors
 *  - Character counter on message field
 *  - Live "Open / Closed" status indicator
 *  - WhatsApp direct form submission
 *  - GSAP reveal animations
 *  - Nav scroll, hamburger, back-to-top
 *  - Smart universal directions (iOS → Apple Maps, Android → Google Maps, Desktop → choice panel)
 */

document.addEventListener('DOMContentLoaded', () => {

  // ──────────────────────────────────────────────────────
  // 1. GSAP
  // ──────────────────────────────────────────────────────
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    initGSAP();
  } else {
    window.addEventListener('load', () => {
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        initGSAP();
      } else {
        initFallbackReveal();
      }
    });
  }

  // ──────────────────────────────────────────────────────
  // 2. NAV SCROLL
  // ──────────────────────────────────────────────────────
  const nav = document.getElementById('nav');
  const handleNavScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

   // ──────────────────────────────────────────────────────
  // 3. HAMBURGER
  // ──────────────────────────────────────────────────────
  function initMobileMenu() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!isExpanded));
    mobileMenu.hidden = isExpanded;
    document.body.style.overflow   = isExpanded ? '' : 'hidden';
    document.body.style.position   = isExpanded ? '' : 'fixed';
    document.body.style.width      = isExpanded ? '' : '100%';
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.hidden = true;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width    = '';
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !mobileMenu.hidden) {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.hidden = true;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width    = '';
    }
  });
}
initMobileMenu();

  // ──────────────────────────────────────────────────────
  // 4. BACK TO TOP
  // ──────────────────────────────────────────────────────
  const backTop = document.getElementById('back-top');
  window.addEventListener('scroll', () => backTop.classList.toggle('visible', window.scrollY > 500), { passive: true });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ──────────────────────────────────────────────────────
  // 5. LIVE OPEN/CLOSED STATUS
  // ──────────────────────────────────────────────────────
  function updateStatus() {
    const dot  = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (!dot || !text) return;

    // South Africa time (UTC+2)
    const now = new Date();
    const saTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' }));
    const day  = saTime.getDay();   // 0=Sun 1=Mon ... 6=Sat
    const hour = saTime.getHours();
    const min  = saTime.getMinutes();
    const time = hour + min / 60;

    let isOpen = false;
    if (day >= 1 && day <= 5 && time >= 9 && time < 18) isOpen = true; // Mon–Fri 09–18
    if (day === 6 && time >= 9 && time < 17) isOpen = true;             // Sat 09–17

    if (isOpen) {
      dot.classList.remove('closed');
      text.textContent = 'We are open now';
    } else {
      dot.classList.add('closed');
      const msgs = {
        0: 'Opens Monday at 09:00',
        1: time >= 18 ? 'Opens tomorrow at 09:00' : 'Opens today at 09:00',
        2: 'Opens today at 09:00',
        3: 'Opens today at 09:00',
        4: 'Opens today at 09:00',
        5: time < 9 ? 'Opens today at 09:00' : 'Opens Saturday at 09:00',
        6: time < 9 ? 'Opens today at 09:00' : 'Opens Monday at 09:00',
      };
      text.textContent = 'Currently closed · ' + (msgs[day] || 'Opens Monday at 09:00');
    }
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  // ──────────────────────────────────────────────────────
  // 6. CHARACTER COUNTER
  // ──────────────────────────────────────────────────────
  const msgField  = document.getElementById('cf-message');
  const charCount = document.getElementById('char-count');
  const maxChars  = 500;

  if (msgField && charCount) {
    msgField.addEventListener('input', () => {
      const len = msgField.value.length;
      charCount.textContent = `${len} / ${maxChars}`;
      charCount.classList.toggle('warning', len > maxChars * 0.85);
      if (len > maxChars) {
        msgField.value = msgField.value.substring(0, maxChars);
        charCount.textContent = `${maxChars} / ${maxChars}`;
      }
    });
  }

  // ──────────────────────────────────────────────────────
  // 7. CONTACT FORM VALIDATION + WHATSAPP SUBMISSION
  // ──────────────────────────────────────────────────────
  const WHATSAPP_NUMBER = '27677243893'; // Mercen's WhatsApp

  const form        = document.getElementById('contact-form');
  const submitBtn   = document.getElementById('submit-btn');
  const btnText     = submitBtn?.querySelector('.btn-text');
  const btnIcon     = submitBtn?.querySelector('.btn-icon');
  const btnSpinner  = submitBtn?.querySelector('.btn-spinner');
  const formSuccess = document.getElementById('form-success');

  function showError(fieldId, errorId, msg) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field) field.classList.add('error');
    if (error) error.textContent = msg;
  }

  function clearError(fieldId, errorId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field) field.classList.remove('error');
    if (error) error.textContent = '';
  }

  function validateForm() {
    let valid = true;

    const name = document.getElementById('cf-name')?.value.trim();
    if (!name) { showError('cf-name', 'cf-name-error', 'Please enter your name.'); valid = false; }
    else { clearError('cf-name', 'cf-name-error'); }

    const email = document.getElementById('cf-email')?.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) { showError('cf-email', 'cf-email-error', 'Please enter your email address.'); valid = false; }
    else if (!emailRegex.test(email)) { showError('cf-email', 'cf-email-error', 'Please enter a valid email address.'); valid = false; }
    else { clearError('cf-email', 'cf-email-error'); }

    const message = document.getElementById('cf-message')?.value.trim();
    if (!message) { showError('cf-message', 'cf-message-error', 'Please enter a message.'); valid = false; }
    else if (message.length < 10) { showError('cf-message', 'cf-message-error', 'Message is too short — please provide more detail.'); valid = false; }
    else { clearError('cf-message', 'cf-message-error'); }

    const consent = document.getElementById('cf-consent')?.checked;
    if (!consent) { document.getElementById('cf-consent-error').textContent = 'Please confirm your consent to be contacted.'; valid = false; }
    else { document.getElementById('cf-consent-error').textContent = ''; }

    return valid;
  }

  ['cf-name', 'cf-email', 'cf-message'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      el.classList.remove('error');
      const errorEl = document.getElementById(`${id}-error`);
      if (errorEl) errorEl.textContent = '';
    });
  });
  document.getElementById('cf-consent')?.addEventListener('change', () => {
    document.getElementById('cf-consent-error').textContent = '';
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        const firstError = form.querySelector('.error, input:invalid');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      submitBtn.classList.add('loading');
      btnText.textContent = 'Sending…';
      btnIcon?.classList.add('hidden');
      btnSpinner?.classList.remove('hidden');

      try {
        const clientName    = document.getElementById('cf-name')?.value.trim() || '';
        const clientPhone   = document.getElementById('cf-phone')?.value.trim() || 'Not provided';
        const clientEmail   = document.getElementById('cf-email')?.value.trim() || '';
        const clientSubject = document.getElementById('cf-subject');
        const subjectText   = clientSubject?.options[clientSubject.selectedIndex]?.text || 'Not selected';
        const clientMessage = document.getElementById('cf-message')?.value.trim() || '';

        const waMessage = [
          '✦ *NEW ENQUIRY — Lashed By Mercen Website*',
          '',
          `*Name:* ${clientName}`,
          `*Phone:* ${clientPhone}`,
          `*Email:* ${clientEmail}`,
          `*Subject:* ${subjectText}`,
          '',
          '*Message:*',
          clientMessage,
          '',
          '─────────────────────────',
          '_Sent via lashedbymercen.com contact form_'
        ].join('\n');

        const encodedMessage = encodeURIComponent(waMessage);
        const waURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

        await new Promise(res => setTimeout(res, 900));

        const fallbackBtn = document.getElementById('wa-fallback-btn');
        if (fallbackBtn) fallbackBtn.href = waURL;

        form.classList.add('hidden');
        formSuccess.classList.remove('hidden');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(formSuccess, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' });
        }

        setTimeout(() => { window.location.href = waURL; }, 1200);

      } catch (err) {
        submitBtn.classList.remove('loading');
        btnText.textContent = 'Send Message';
        btnIcon?.classList.remove('hidden');
        btnSpinner?.classList.add('hidden');
        alert('Something went wrong. Please contact us directly on WhatsApp and we\'ll sort it out right away.');
        console.error('Form error:', err);
      }
    });
  }

  // ──────────────────────────────────────────────────────
  // 8. YEAR
  // ──────────────────────────────────────────────────────
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});

// ──────────────────────────────────────────────────────
// GSAP ANIMATIONS
// ──────────────────────────────────────────────────────
function initGSAP() {
  gsap.utils.toArray('.reveal-block').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 45 },
      { opacity: 1, y: 0, duration: .9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 87%', once: true }
      }
    );
  });

  gsap.utils.toArray('.reveal-card').forEach(el => {
    const delay = parseFloat(el.style.getPropertyValue('--i') || 0) * 0.1;
    gsap.fromTo(el,
      { opacity: 0, y: 35 },
      { opacity: 1, y: 0, duration: .8, ease: 'power3.out', delay,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      }
    );
  });

  gsap.to('.ph-ring.r1', {
    scale: 1.08, ease: 'none',
    scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: 2 }
  });
  gsap.to('.ph-ring.r2', {
    scale: 1.05, ease: 'none',
    scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: 3 }
  });

  const mapCard = document.querySelector('.map-overlay-card');
  if (mapCard) {
    gsap.fromTo(mapCard,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: mapCard, start: 'top 90%', once: true }
      }
    );
  }

  gsap.to('.ph-circle.c1', {
    y: 80, ease: 'none',
    scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
  });
}

// ──────────────────────────────────────────────────────
// FALLBACK REVEAL
// ──────────────────────────────────────────────────────
function initFallbackReveal() {
  const els = document.querySelectorAll('.reveal-block, .reveal-card');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(el => observer.observe(el));
}

// ──────────────────────────────────────────────────────
// SMART DIRECTIONS BUTTON
// iOS (iPhone/iPad)  → Apple Maps app (native)
// Android            → Google Maps app (native via geo: intent, fallback to web)
// Desktop / other    → shows choice panel: Google Maps · Apple Maps · Waze
// ──────────────────────────────────────────────────────
(function () {
  const ADDRESS_QUERY = '537+Pretoria+Road,Silverton,Pretoria,South+Africa';
  const ADDRESS_APPLE = '537+Pretoria+Road,Silverton,Pretoria,South+Africa';
  const LAT = '-25.7335';
  const LNG = '28.2995';

  const GOOGLE_URL = `https://www.google.com/maps/dir/?api=1&destination=${ADDRESS_QUERY}`;
  const APPLE_URL  = `https://maps.apple.com/?daddr=${ADDRESS_APPLE}&dirflg=d`;
  const WAZE_URL   = `https://waze.com/ul?ll=${LAT},${LNG}&navigate=yes&zoom=17`;

  function isIOS() {
    return /iP(hone|ad|od)/i.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function isAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  const btn   = document.getElementById('btn-directions');
  const panel = document.getElementById('map-choice-panel');

  if (!btn) return;

  btn.addEventListener('click', function (e) {
    e.stopPropagation();

    if (isIOS()) {
      // iPhone/iPad: opens Apple Maps app natively
      window.location.href = APPLE_URL;

    } else if (isAndroid()) {
      // Android: geo: URI opens the native maps picker
      // Falls back to Google Maps web if no app catches the intent
      const geoIntent = `geo:${LAT},${LNG}?q=${ADDRESS_QUERY}`;
      const start = Date.now();
      window.location.href = geoIntent;
      setTimeout(function () {
        if (Date.now() - start < 2000) {
          window.open(GOOGLE_URL, '_blank');
        }
      }, 1500);

    } else {
      // Desktop: toggle choice panel with all three options
      if (panel) panel.classList.toggle('hidden');
    }
  });

  // Close panel when clicking elsewhere
  document.addEventListener('click', function (e) {
    if (panel && !btn.contains(e.target) && !panel.contains(e.target)) {
      panel.classList.add('hidden');
    }
  });

  // Close panel on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel) panel.classList.add('hidden');
  });
})();