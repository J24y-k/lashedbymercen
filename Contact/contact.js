/**
 * LASHED BY MERCEN — contact.js
 * Features:
 *  - Full client-side form validation with inline errors
 *  - Character counter on message field
 *  - Live "Open / Closed" status indicator
 *  - Simulated form submission (ready for backend/Formspree/Netlify)
 *  - GSAP reveal animations
 *  - Nav scroll, hamburger, back-to-top
 *  - Floating WhatsApp bubble show/hide
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
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    navLinks.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen.toString());
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

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
      // Find next open time
      const msgs = {
        0: 'Opens Monday at 09:00',
        1: day === 1 && time >= 18 ? 'Opens tomorrow at 09:00' : 'Opens today at 09:00',
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
  setInterval(updateStatus, 60000); // re-check every minute

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
  // 7. CONTACT FORM VALIDATION + SUBMISSION
  // ──────────────────────────────────────────────────────
  const form       = document.getElementById('contact-form');
  const submitBtn  = document.getElementById('submit-btn');
  const btnText    = submitBtn?.querySelector('.btn-text');
  const btnIcon    = submitBtn?.querySelector('.btn-icon');
  const btnSpinner = submitBtn?.querySelector('.btn-spinner');
  const formSuccess = document.getElementById('form-success');

  function showError(fieldId, errorId, msg) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field)  field.classList.add('error');
    if (error)  error.textContent = msg;
  }

  function clearError(fieldId, errorId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field)  field.classList.remove('error');
    if (error)  error.textContent = '';
  }

  function validateForm() {
    let valid = true;

    // Name
    const name = document.getElementById('cf-name')?.value.trim();
    if (!name) {
      showError('cf-name', 'cf-name-error', 'Please enter your name.');
      valid = false;
    } else {
      clearError('cf-name', 'cf-name-error');
    }

    // Email
    const email = document.getElementById('cf-email')?.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      showError('cf-email', 'cf-email-error', 'Please enter your email address.');
      valid = false;
    } else if (!emailRegex.test(email)) {
      showError('cf-email', 'cf-email-error', 'Please enter a valid email address.');
      valid = false;
    } else {
      clearError('cf-email', 'cf-email-error');
    }

    // Message
    const message = document.getElementById('cf-message')?.value.trim();
    if (!message) {
      showError('cf-message', 'cf-message-error', 'Please enter a message.');
      valid = false;
    } else if (message.length < 10) {
      showError('cf-message', 'cf-message-error', 'Message is too short — please provide more detail.');
      valid = false;
    } else {
      clearError('cf-message', 'cf-message-error');
    }

    // Consent
    const consent = document.getElementById('cf-consent')?.checked;
    if (!consent) {
      document.getElementById('cf-consent-error').textContent = 'Please confirm your consent to be contacted.';
      valid = false;
    } else {
      document.getElementById('cf-consent-error').textContent = '';
    }

    return valid;
  }

  // Clear errors on input
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
        // Scroll to first error
        const firstError = form.querySelector('.error, input:invalid');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Loading state
      submitBtn.classList.add('loading');
      btnText.textContent = 'Sending…';
      btnIcon?.classList.add('hidden');
      btnSpinner?.classList.remove('hidden');

      try {
        // ── WHATSAPP DIRECT MESSAGE SUBMISSION ─────────────────
        // ⚠️  IMPORTANT: Replace the number below with Mercen's
        //     WhatsApp number before going live.
        //     Current number is Jay K's test number.
        //     Format: country code + number, no + or spaces.
        // ────────────────────────────────────────────────────────
        const WHATSAPP_NUMBER = '27745192332'; // TODO: Change to Mercen's number

        // Collect form values
        const clientName    = document.getElementById('cf-name')?.value.trim() || '';
        const clientPhone   = document.getElementById('cf-phone')?.value.trim() || 'Not provided';
        const clientEmail   = document.getElementById('cf-email')?.value.trim() || '';
        const clientSubject = document.getElementById('cf-subject');
        const subjectText   = clientSubject?.options[clientSubject.selectedIndex]?.text || 'Not selected';
        const clientMessage = document.getElementById('cf-message')?.value.trim() || '';

        // Build a clean, readable WhatsApp message
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
          '_Sent via lashedbymercen.co.za contact form_'
        ].join('\n');

        // Encode safely — encodeURIComponent handles all special chars,
        // emojis, newlines and works identically on iOS, Android & desktop.
        const encodedMessage = encodeURIComponent(waMessage);

        // Build the universal wa.me link.
        // wa.me works on all devices — mobile opens WA app directly,
        // desktop opens WhatsApp Web. No app-specific URI needed.
        const waURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

        // Brief intentional delay so the user sees "Sending…" feedback
        await new Promise(res => setTimeout(res, 900));

        // Wire fallback button with the same URL so manual tap always works
        const fallbackBtn = document.getElementById('wa-fallback-btn');
        if (fallbackBtn) fallbackBtn.href = waURL;

        // Show success state BEFORE opening WhatsApp
        // so the user knows the action was registered
        form.classList.add('hidden');
        formSuccess.classList.remove('hidden');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(formSuccess,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: .6, ease: 'power3.out' }
          );
        }

        // Open WhatsApp.
        // We use window.location.href instead of window.open() because:
        // - window.open() is blocked by iOS Safari popup blockers
        //   when not triggered by a direct synchronous user gesture.
        // - window.location.href works universally on all browsers & devices.
        // - On mobile it launches the WhatsApp app directly.
        // - On desktop it opens WhatsApp Web in the same tab, then
        //   the browser history allows the user to navigate back.
        //
        // Small timeout ensures the success UI renders before redirect.
        setTimeout(() => {
          window.location.href = waURL;
        }, 1200);

      } catch (err) {
        // Reset button on error
        submitBtn.classList.remove('loading');
        btnText.textContent = 'Send Message';
        btnIcon?.classList.remove('hidden');
        btnSpinner?.classList.add('hidden');
        // Friendly fallback — still give them a way to reach Mercen
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

  // Reveal blocks (form, info panel, etc.)
  gsap.utils.toArray('.reveal-block').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 45 },
      { opacity: 1, y: 0, duration: .9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 87%', once: true }
      }
    );
  });

  // Quick contact cards — stagger
  gsap.utils.toArray('.reveal-card').forEach(el => {
    const delay = parseFloat(el.style.getPropertyValue('--i') || 0) * 0.1;
    gsap.fromTo(el,
      { opacity: 0, y: 35 },
      { opacity: 1, y: 0, duration: .8, ease: 'power3.out', delay,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      }
    );
  });

  // Hero rings — pulse scale on scroll
  gsap.to('.ph-ring.r1', {
    scale: 1.08,
    ease: 'none',
    scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: 2 }
  });
  gsap.to('.ph-ring.r2', {
    scale: 1.05,
    ease: 'none',
    scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: 3 }
  });

  // Map card: slide in from left
  const mapCard = document.querySelector('.map-overlay-card');
  if (mapCard) {
    gsap.fromTo(mapCard,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: mapCard, start: 'top 90%', once: true }
      }
    );
  }

  // Hero background circles parallax
  gsap.to('.ph-circle.c1', {
    y: 80, ease: 'none',
    scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
  });
}

// ──────────────────────────────────────────────────────
// FALLBACK
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
// Logic:
//   iOS (iPhone/iPad)  → opens Apple Maps directly (native)
//   Android            → opens Google Maps directly (native)
//   Desktop / other    → shows a choice panel: Google Maps · Apple Maps · Waze
//   All deep-links use the full address string for maximum accuracy
// ──────────────────────────────────────────────────────
(function () {
  const ADDRESS_QUERY  = '537+Pretoria+Road+Silverton+Pretoria+South+Africa';
  const ADDRESS_APPLE  = '537+Pretoria+Road,Silverton,Pretoria,South+Africa';

  const GOOGLE_URL = `https://www.google.com/maps/dir/?api=1&destination=${ADDRESS_QUERY}`;
  const APPLE_URL  = `https://maps.apple.com/?daddr=${ADDRESS_APPLE}&dirflg=d`;
  const WAZE_URL   = `https://waze.com/ul?q=${ADDRESS_QUERY}&navigate=yes`;

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
      // iPhone/iPad: Apple Maps opens natively in the Maps app
      window.location.href = APPLE_URL;
    } else if (isAndroid()) {
      // Android: Google Maps opens in the Maps app via intent
      // geo: URI triggers the native picker; fallback to web URL
      const geoIntent = `geo:-25.7335,28.2995?q=${ADDRESS_QUERY}`;
      const start = Date.now();
      window.location.href = geoIntent;
      // If app didn't open within 1.5s, fall back to web Google Maps
      setTimeout(function () {
        if (Date.now() - start < 2000) {
          window.open(GOOGLE_URL, '_blank');
        }
      }, 1500);
    } else {
      // Desktop / other: toggle the choice panel
      panel.classList.toggle('hidden');
    }
  });

  // Close panel when clicking anywhere else
  document.addEventListener('click', function (e) {
    if (!btn.contains(e.target) && !panel.contains(e.target)) {
      panel.classList.add('hidden');
    }
  });

  // Keyboard: close panel on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') panel.classList.add('hidden');
  });
})();