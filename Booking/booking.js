/**
 * LASHED BY MERCEN — booking.js
 *
 * Features:
 *  - 3-step wizard with animated transitions
 *  - Service card visual selection
 *  - URL param pre-selection (?service=hybrid-full-set)
 *  - Auto-generated booking reference (LBM-YYMM-IN1234)
 *  - Live booking summary panel (updates as you type)
 *  - Dynamic deposit/balance calculations
 *  - Full field validation per step
 *  - WhatsApp DM dispatch using wa.me (works on ALL devices)
 *  - Copy-to-clipboard for ref and banking details
 *  - Nav, hamburger, back-to-top
 */

document.addEventListener('DOMContentLoaded', () => {

  // ──────────────────────────────────────────────────────
  // CONFIG
  // ──────────────────────────────────────────────────────

  // ⚠️  TODO: Replace with Mercen's WhatsApp number before going live.
  //           Format: country code + number, no + or spaces.
  //           Current number is Jay K's test number.
  const WA_NUMBER = '27745192332';

  const SERVICES = {
    'classic-full-set':    { label: 'Classic Full Set',    price: 350,  duration: '90 min'    },
    'hybrid-full-set':     { label: 'Hybrid Full Set',     price: 550,  duration: '2 hrs'     },
    'volume-full-set':     { label: 'Volume Full Set',     price: 700,  duration: '2.5 hrs'   },
    'mega-volume-full-set':{ label: 'Mega Volume Full Set',price: 900,  duration: '3 hrs'     },
    'classic-fill':        { label: 'Classic Fill',        price: 200,  duration: '45–60 min' },
    'hybrid-fill':         { label: 'Hybrid Fill',         price: 280,  duration: '60–75 min' },
    'volume-fill':         { label: 'Volume Fill',         price: 350,  duration: '75–90 min' },
    'lash-lift-tint':      { label: 'Lash Lift & Tint',    price: 400,  duration: '60 min'    },
  };

  // ──────────────────────────────────────────────────────
  // STATE
  // ──────────────────────────────────────────────────────
  let currentStep   = 1;
  let bookingRef    = '';
  let lastWaURL     = '';
  let selectedService = null;

  // ──────────────────────────────────────────────────────
  // NAV
  // ──────────────────────────────────────────────────────
  const nav = document.getElementById('nav');
  const handleNavScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // ──────────────────────────────────────────────────────
  // HAMBURGER
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
  // BACK TO TOP
  // ──────────────────────────────────────────────────────
  const backTop = document.getElementById('back-top');
  window.addEventListener('scroll', () => backTop.classList.toggle('visible', window.scrollY > 500), { passive: true });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ──────────────────────────────────────────────────────
  // YEAR
  // ──────────────────────────────────────────────────────
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ──────────────────────────────────────────────────────
  // URL PARAM: pre-select service (?service=hybrid-full-set)
  // ──────────────────────────────────────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const preselect = urlParams.get('service');
  if (preselect && SERVICES[preselect]) {
    const radio = document.querySelector(`input[name="service"][value="${preselect}"]`);
    if (radio) {
      radio.checked = true;
      selectedService = preselect;
      updateSummaryService(preselect);
    }
  }

  // ──────────────────────────────────────────────────────
  // SERVICE SELECTION — visual cards
  // ──────────────────────────────────────────────────────
  document.querySelectorAll('.ssg-radio').forEach(radio => {
    radio.addEventListener('change', () => {
      selectedService = radio.value;
      updateSummaryService(selectedService);
      // Clear service error
      const err = document.getElementById('service-error');
      if (err) err.textContent = '';
    });
  });

  function updateSummaryService(serviceKey) {
    const svc = SERVICES[serviceKey];
    if (!svc) return;
    setText('bsc-service', svc.label);
    setText('bsc-duration', svc.duration);
    setText('bsc-price', `From R${svc.price}`);
    updateDepositDisplay(svc.price);
    // Regenerate ref in case name already entered
    regenerateRef();
  }

  function updateDepositDisplay(price) {
    const deposit  = Math.ceil(price / 2);
    const balance  = price - deposit;
    setText('service-total',   `R${price}`);
    setText('deposit-amount',  `R${deposit}`);
    setText('balance-amount',  `R${balance}`);
    setText('bsc-deposit',     `R${deposit}`);
  }

  // ──────────────────────────────────────────────────────
  // BOOKING REFERENCE GENERATOR
  // Format: LBM-YYMM-[INITIALS][4-digit random]
  // e.g.  LBM-2603-AM7341
  // ──────────────────────────────────────────────────────
  function generateRef(firstName = '', lastName = '') {
    const now    = new Date();
    const yy     = String(now.getFullYear()).slice(-2);
    const mm     = String(now.getMonth() + 1).padStart(2, '0');
    const fi     = (firstName.charAt(0) || 'X').toUpperCase();
    const li     = (lastName.charAt(0)  || 'X').toUpperCase();
    const rand   = String(Math.floor(1000 + Math.random() * 9000));
    return `LBM-${yy}${mm}-${fi}${li}${rand}`;
  }

  function regenerateRef() {
    const fn = document.getElementById('bf-firstname')?.value.trim() || '';
    const ln = document.getElementById('bf-lastname')?.value.trim()  || '';
    if (fn || ln) {
      bookingRef = generateRef(fn, ln);
    } else {
      bookingRef = generateRef();
    }
    // Update all ref displays
    setText('ref-code',   bookingRef);
    setText('bd-ref',     bookingRef);
    setText('bsc-ref',    bookingRef);
    // Update the copy button data-copy
    const bdRefCopy = document.getElementById('bd-ref-copy');
    if (bdRefCopy) bdRefCopy.dataset.copy = bookingRef;
    const refCopyBtn = document.getElementById('ref-copy-btn');
    if (refCopyBtn) refCopyBtn.querySelector('#copy-label').textContent = 'Copy';
  }

  // Generate initial ref on load
  regenerateRef();

  // Regenerate when name fields change
  ['bf-firstname', 'bf-lastname'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      regenerateRef();
      // Live summary
      const fn = document.getElementById('bf-firstname')?.value.trim();
      const ln = document.getElementById('bf-lastname')?.value.trim();
      const fullName = [fn, ln].filter(Boolean).join(' ');
      setText('bsc-name', fullName || '—');
    });
  });

  // Live date/time summary updates
  document.getElementById('bf-date')?.addEventListener('change', e => {
    const val = e.target.value;
    if (val) {
      const d = new Date(val + 'T00:00:00');
      const opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      setText('bsc-date', d.toLocaleDateString('en-ZA', opts));
    } else {
      setText('bsc-date', '—');
    }
  });
  document.getElementById('bf-time')?.addEventListener('change', e => {
    setText('bsc-time', e.target.value || '—');
  });

  // ──────────────────────────────────────────────────────
  // STEP NAVIGATION
  // ──────────────────────────────────────────────────────
  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextStep = parseInt(btn.dataset.next);
      if (validateStep(currentStep)) {
        goToStep(nextStep);
      }
    });
  });

  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
      const backStep = parseInt(btn.dataset.back);
      goToStep(backStep);
    });
  });

  function goToStep(step) {
    // Hide current
    const currentEl = document.getElementById(`step-${currentStep}`);
    currentEl?.classList.remove('active');

    // Show next
    currentStep = step;
    const nextEl = document.getElementById(`step-${currentStep}`);
    nextEl?.classList.add('active');

    // Update progress indicators
    updateProgress(currentStep);

    // If entering step 3, regenerate ref (ensures name is captured)
    if (currentStep === 3) regenerateRef();

    // Scroll to top of form smoothly
    const formWrap = document.querySelector('.booking-form-wrap');
    if (formWrap) {
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
      const progressH = document.querySelector('.progress-bar-wrap')?.offsetHeight || 60;
      const y = formWrap.getBoundingClientRect().top + window.scrollY - navH - progressH - 20;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }

  function updateProgress(step) {
    const stepEls     = document.querySelectorAll('.progress-steps .step');
    const connectors  = document.querySelectorAll('.step-connector');

    stepEls.forEach(el => {
      const s = parseInt(el.dataset.step);
      el.classList.remove('active', 'completed');
      if (s === step)   el.classList.add('active');
      if (s  < step)    el.classList.add('completed');
    });

    connectors.forEach((con, i) => {
      con.classList.toggle('active', i + 1 < step);
    });
  }

  // ──────────────────────────────────────────────────────
  // VALIDATION
  // ──────────────────────────────────────────────────────
  function validateStep(step) {
    let valid = true;

    if (step === 1) {
      const selected = document.querySelector('input[name="service"]:checked');
      if (!selected) {
        showError('service-error', 'Please select a service to continue.');
        valid = false;
      }
    }

    if (step === 2) {
      const fn = document.getElementById('bf-firstname');
      const ln = document.getElementById('bf-lastname');
      const ph = document.getElementById('bf-phone');
      const dt = document.getElementById('bf-date');
      const tm = document.getElementById('bf-time');

      if (!fn?.value.trim()) { showFieldError(fn, 'firstname-error', 'Please enter your first name.'); valid = false; }
      else clearFieldError(fn, 'firstname-error');

      if (!ln?.value.trim()) { showFieldError(ln, 'lastname-error', 'Please enter your last name.'); valid = false; }
      else clearFieldError(ln, 'lastname-error');

      if (!ph?.value.trim()) {
        showFieldError(ph, 'phone-error', 'Please enter your WhatsApp number.');
        valid = false;
      } else if (!/^[+\d\s\-()]{9,16}$/.test(ph.value.trim())) {
        showFieldError(ph, 'phone-error', 'Please enter a valid phone number.');
        valid = false;
      } else {
        clearFieldError(ph, 'phone-error');
      }

      if (!dt?.value) {
        showFieldError(dt, 'date-error', 'Please select a preferred date.');
        valid = false;
      } else {
        // No past dates
        const chosen = new Date(dt.value + 'T00:00:00');
        const today  = new Date(); today.setHours(0,0,0,0);
        if (chosen < today) {
          showFieldError(dt, 'date-error', 'Please choose a future date.');
          valid = false;
        } else {
          clearFieldError(dt, 'date-error');
        }
      }

      if (!tm?.value) { showFieldError(tm, 'time-error', 'Please select a preferred time.'); valid = false; }
      else clearFieldError(tm, 'time-error');
    }

    return valid;
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }
  function showFieldError(field, errorId, msg) {
    if (field)  field.classList.add('error');
    const el = document.getElementById(errorId);
    if (el) el.textContent = msg;
  }
  function clearFieldError(field, errorId) {
    if (field)  field.classList.remove('error');
    const el = document.getElementById(errorId);
    if (el) el.textContent = '';
  }

  // Clear field errors on input
  ['bf-firstname','bf-lastname','bf-phone','bf-date','bf-time'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      el.classList.remove('error');
      const errEl = document.getElementById(`${id.replace('bf-','')}-error`);
      if (errEl) errEl.textContent = '';
    });
    if (el) el.addEventListener('change', () => {
      el.classList.remove('error');
      const errEl = document.getElementById(`${id.replace('bf-','')}-error`);
      if (errEl) errEl.textContent = '';
    });
  });

  // ──────────────────────────────────────────────────────
  // FORM SUBMISSION → WHATSAPP
  // ──────────────────────────────────────────────────────
  const bookingForm = document.getElementById('booking-form');

  bookingForm?.addEventListener('submit', e => {
    e.preventDefault();

    // Validate policy checkbox
    const policyCheck = document.getElementById('bf-policy');
    const policyError = document.getElementById('policy-error');
    if (!policyCheck?.checked) {
      if (policyError) policyError.textContent = 'Please agree to the booking policies to continue.';
      return;
    }
    if (policyError) policyError.textContent = '';

    // Collect all values
    const svcKey   = document.querySelector('input[name="service"]:checked')?.value || '';
    const svc      = SERVICES[svcKey] || {};
    const fn       = document.getElementById('bf-firstname')?.value.trim() || '';
    const ln       = document.getElementById('bf-lastname')?.value.trim()  || '';
    const phone    = document.getElementById('bf-phone')?.value.trim()     || '';
    const email    = document.getElementById('bf-email')?.value.trim()     || 'Not provided';
    const rawDate  = document.getElementById('bf-date')?.value             || '';
    const time     = document.getElementById('bf-time')?.value             || '';
    const notes    = document.getElementById('bf-notes')?.value.trim()     || 'None';

    // Format date nicely
    let formattedDate = rawDate;
    if (rawDate) {
      const d = new Date(rawDate + 'T00:00:00');
      formattedDate = d.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    const deposit  = svc.price ? Math.ceil(svc.price / 2) : '—';
    const balance  = svc.price ? (svc.price - deposit)   : '—';
    const ref      = bookingRef;

    // Build the WhatsApp message — clean, structured, professional
    // Mercen receives this perfectly formatted in her DMs
    const waMessage = [
      '✦ *NEW BOOKING REQUEST — Lashed By Mercen*',
      '',
      `📋 *Booking Reference:* ${ref}`,
      '',
      '─── *SERVICE* ───────────────',
      `*Service:*   ${svc.label || svcKey}`,
      `*Duration:*  ${svc.duration || '—'}`,
      `*Price:*     From R${svc.price || '—'}`,
      '',
      '─── *CLIENT DETAILS* ────────',
      `*Name:*      ${fn} ${ln}`,
      `*WhatsApp:*  ${phone}`,
      `*Email:*     ${email}`,
      '',
      '─── *APPOINTMENT* ───────────',
      `*Date:*      ${formattedDate}`,
      `*Time:*      ${time}`,
      '',
      '─── *PAYMENT* ───────────────',
      `*Total:*     R${svc.price || '—'}`,
      `*Deposit:*   R${deposit} ← 50% required`,
      `*Balance:*   R${balance} (payable on the day)`,
      '',
      notes !== 'None' ? `─── *NOTES* ─────────────────\n${notes}\n` : '',
      '─────────────────────────────',
      '📎 _Please reply with proof of payment to confirm this booking._',
      `_Ref: ${ref}_`,
    ].filter(l => l !== undefined).join('\n');

    // Encode and build wa.me URL
    // encodeURIComponent handles emojis, newlines, special chars perfectly
    // across iOS, Android and desktop browsers
    const encodedMsg = encodeURIComponent(waMessage);
    lastWaURL = `https://wa.me/${WA_NUMBER}?text=${encodedMsg}`;

    // Show success state
    const form    = document.getElementById('booking-form');
    const success = document.getElementById('booking-success');
    form?.classList.add('hidden');
    success?.classList.remove('hidden');

    // Populate success state
    setText('bs-ref-display', ref);
    const manualLink = document.getElementById('bs-manual-link');
    if (manualLink) manualLink.href = lastWaURL;

    // Open WhatsApp using location.href — this method works universally:
    // • Mobile: opens WhatsApp app directly
    // • Desktop: opens WhatsApp Web
    // • iOS Safari: NOT blocked (unlike window.open from async code)
    // • Android: works on all major browsers
    // Small timeout lets the success UI render first
    setTimeout(() => {
      window.location.href = lastWaURL;
    }, 1000);

    // Scroll to success
    success?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // ──────────────────────────────────────────────────────
  // COPY TO CLIPBOARD — ref code button
  // ──────────────────────────────────────────────────────
  document.getElementById('ref-copy-btn')?.addEventListener('click', () => {
    copyToClipboard(bookingRef, document.getElementById('ref-copy-btn'), 'Copied!', 'Copy');
  });

  // Banking detail copy buttons
  document.querySelectorAll('.bd-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.copy || btn.id === 'bd-ref-copy' ? bookingRef : '';
      const textToCopy = btn.id === 'bd-ref-copy' ? bookingRef : (btn.dataset.copy || '');
      if (textToCopy) copyToClipboard(textToCopy, btn);
    });
  });

  function copyToClipboard(text, btn, successText = '✓', defaultText = null) {
    if (!navigator.clipboard) {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
      flashCopyBtn(btn, successText, defaultText);
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      flashCopyBtn(btn, successText, defaultText);
    }).catch(() => {});
  }

  function flashCopyBtn(btn, successText, defaultText) {
    btn.classList.add('copied');
    const labelEl = btn.querySelector('#copy-label') || btn;
    const original = defaultText || labelEl.textContent;
    if (labelEl.id === 'copy-label') labelEl.textContent = successText;
    setTimeout(() => {
      btn.classList.remove('copied');
      if (labelEl.id === 'copy-label') labelEl.textContent = original;
    }, 2000);
  }

  // ──────────────────────────────────────────────────────
  // SET MINIMUM DATE (no past dates)
  // ──────────────────────────────────────────────────────
  const dateInput = document.getElementById('bf-date');
  if (dateInput) {
    const today = new Date();
    const yyyy  = today.getFullYear();
    const mm    = String(today.getMonth() + 1).padStart(2, '0');
    const dd    = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
    // Max 3 months ahead
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 3);
    const mYYYY = maxDate.getFullYear();
    const mMM   = String(maxDate.getMonth() + 1).padStart(2, '0');
    const mDD   = String(maxDate.getDate()).padStart(2, '0');
    dateInput.max = `${mYYYY}-${mMM}-${mDD}`;
  }

  // ──────────────────────────────────────────────────────
  // HELPER
  // ──────────────────────────────────────────────────────
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

});