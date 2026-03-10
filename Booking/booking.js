/**
 * LASHED BY MERCEN — booking.js
 *
 * Features:
 *  - 3-step wizard with animated transitions
 *  - Service card visual selection
 *  - URL param pre-selection (?service=hybrid-full-set)
 *  - Auto-generated booking reference (LBM-YYMM-IN1234) — guaranteed unique via storage
 *  - Live booking summary panel (updates as you type)
 *  - Dynamic deposit/balance calculations
 *  - Full field validation per step
 *  - WhatsApp DM dispatch using wa.me (works on ALL devices)
 *  - Copy-to-clipboard for ref and banking details
 *  - Nav, hamburger, back-to-top
 *
 * ── NEW (v2) ──────────────────────────────────────────
 *  - Booked time slots are persisted via window.storage
 *    A slot is locked per tech — the SAME time slot is still
 *    available if the other lash tech is free.
 *  - Reference numbers are stored and checked to guarantee
 *    they are never repeated across any client.
 *  - Banking details on Step 3 swap dynamically based on
 *    which lash tech the client selects:
 *      Mercen  → Standard Bank / Monoge E        / 10250324022
 *      Dolly   → Standard Bank / Miss E Eva      / 10250324022
 * ─────────────────────────────────────────────────────
 */

document.addEventListener('DOMContentLoaded', () => {

  // ──────────────────────────────────────────────────────
  // CONFIG
  // ──────────────────────────────────────────────────────
  const WA_NUMBER = '27677243893';

  // Banking details per tech
  const BANKING = {
    'mercen': {
      accountName:   'Monoge E',
      bank:          'Standard Bank',
      accountNumber: '10250324022',
      branchCode:    '051001',
      waNumber:      '27677243893',
    },
    'dolly': {
      accountName:   'Miss E Eva',
      bank:          'Standard Bank',
      accountNumber: '10250324022',
      branchCode:    '051001',
      waNumber:      '27677243893',
    },
    // no-preference defaults to Mercen until confirmed — the message will note this
    'no-preference': {
      accountName:   'Monoge E',
      bank:          'Standard Bank',
      accountNumber: '10250324022',
      branchCode:    '051001',
      waNumber:      '27677243893',
    },
  };

  const SERVICES = {
    // Full Sets
    'classic-full-set':        { label: 'Classic Full Set',            price: 250,  duration: '1h 30 min' },
    'hybrid-full-set':         { label: 'Hybrid Full Set',             price: 350,  duration: '2 hours'   },
    'hybrid-spikes-full-set':  { label: 'Hybrid x Spikes Full Set',    price: 350,  duration: '2 hours'   },
    'wet-set':                 { label: 'Wet Set',                     price: 380,  duration: '1h 30 min' },
    'hybrid-cat-eye':          { label: 'Hybrid Cat Eye Wispy',        price: 400,  duration: '2 hours'   },
    'volume-full-set':         { label: 'Volume Full Set',             price: 600,  duration: '3 hours'   },
    'mega-volume-full-set':    { label: 'Mega Volume Full Set',        price: 750,  duration: '3h 30 min' },
    // Add-ons
    'bottom-lashes':           { label: 'Bottom Lashes',               price: 150,  duration: 'Add-on'    },
    'lash-removal':            { label: 'Lash Removal',                price: 150,  duration: '45 min'    },
    // 2-Week Refills (all 1h 30 min)
    'classic-fill':            { label: 'Classic 2-Week Refill',       price: 150,  duration: '1h 30 min' },
    'hybrid-fill':             { label: 'Hybrid 2-Week Refill',        price: 250,  duration: '1h 30 min' },
    'volume-fill':             { label: 'Volume 2-Week Refill',        price: 500,  duration: '1h 30 min' },
    'hybrid-spikes-fill':      { label: 'Hybrid x Spikes Refill',      price: 290,  duration: '1h 30 min' },
    'hybrid-cat-eye-fill':     { label: 'Hybrid Cat Eye Wispy Refill', price: 300,  duration: '1h 30 min' },
    'wet-set-fill':            { label: 'Wet Set Refill',              price: 250,  duration: '1h 30 min' },
    // Brows
    'brow-lamination':         { label: 'Brow Lamination & Tint',      price: 250,  duration: '1 hour'    },
    'brow-tint-shape':         { label: 'Brow Tint & Shape',           price: 120,  duration: '1 hour'    },
  };

  // All possible time slot values (must match the <select> options in HTML)
  const ALL_TIME_SLOTS = [
    '09:00','09:30','10:00','10:30','11:00','11:30',
    '12:00','12:30','13:00','13:30','14:00','14:30',
    '15:00','15:30','16:00','16:30','17:00','17:30',
  ];

  // ──────────────────────────────────────────────────────
  // STORAGE HELPERS
  // window.storage is a persistent key-value store provided
  // by the Claude artifacts environment. We use it to track:
  //   • booked slots  — key: "slot:{date}:{time}:{tech}"
  //   • used refs     — key: "refs:used" (JSON array)
  // ──────────────────────────────────────────────────────

  async function getBookedSlotsForDate(date) {
    // Returns a Set of "{time}:{tech}" strings that are already booked
    const booked = new Set();
    try {
      // List all keys that start with "slot:{date}:"
      const result = await window.storage.list(`slot:${date}:`);
      if (result && result.keys) {
        result.keys.forEach(k => {
          // key format: slot:{date}:{time}:{tech}
          const parts = k.split(':');
          // parts[0]=slot, parts[1]=date, parts[2]=time, parts[3]=tech
          if (parts.length >= 4) {
            booked.add(`${parts[2]}:${parts[3]}`);
          }
        });
      }
    } catch (_) {
      // Storage not available or key not found — just return empty set
    }
    return booked;
  }

  async function isSlotTaken(date, time, tech) {
    // Returns true if this exact date+time+tech combo is already booked
    try {
      const result = await window.storage.get(`slot:${date}:${time}:${tech}`);
      return result !== null;
    } catch (_) {
      return false;
    }
  }

  async function markSlotBooked(date, time, tech, ref) {
    try {
      await window.storage.set(`slot:${date}:${time}:${tech}`, ref);
    } catch (_) {}
  }

  async function getUsedRefs() {
    try {
      const result = await window.storage.get('refs:used');
      return result ? JSON.parse(result.value) : [];
    } catch (_) {
      return [];
    }
  }

  async function markRefUsed(ref) {
    try {
      const used = await getUsedRefs();
      used.push(ref);
      await window.storage.set('refs:used', JSON.stringify(used));
    } catch (_) {}
  }

  async function isRefUsed(ref) {
    const used = await getUsedRefs();
    return used.includes(ref);
  }

  // ──────────────────────────────────────────────────────
  // STATE
  // ──────────────────────────────────────────────────────
  let currentStep     = 1;
  let bookingRef      = '';
  let lastWaURL       = '';
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
    regenerateRef();
  }

  function updateDepositDisplay(price) {
    const deposit  = 150; // Flat R150 non-refundable deposit
    const balance  = price - deposit;
    setText('service-total',   `R${price}`);
    setText('deposit-amount',  `R${deposit}`);
    setText('balance-amount',  `R${balance}`);
    setText('bsc-deposit',     `R${deposit}`);
  }

  // ──────────────────────────────────────────────────────
  // BANKING DETAILS — swap based on selected lash tech
  // Called whenever a tech radio changes, and on step 3 entry
  // ──────────────────────────────────────────────────────
  function updateBankingDetails(techVal) {
    const b = BANKING[techVal] || BANKING['mercen'];

    // Update visible values in the banking card
    setText('bd-name',   b.accountName);
    setText('bd-accnum', b.accountNumber);

    // Update copy button data-copy attributes
    const copyNameBtn   = document.querySelector('.bd-copy[aria-label="Copy account name"]');
    const copyAccBtn    = document.querySelector('.bd-copy[aria-label="Copy account number"]');
    if (copyNameBtn) copyNameBtn.dataset.copy = b.accountName;
    if (copyAccBtn)  copyAccBtn.dataset.copy  = b.accountNumber;

    // Bank name and branch code are the same for both techs,
    // but update them defensively in case the HTML ever changes
    const bdRows = document.querySelectorAll('.bd-row');
    bdRows.forEach(row => {
      const label = row.querySelector('.bd-label');
      const value = row.querySelector('.bd-value');
      if (!label || !value) return;
      if (label.textContent.trim() === 'Bank')        value.textContent = b.bank;
      if (label.textContent.trim() === 'Branch Code') value.textContent = b.branchCode;
    });
  }

  // Listen to tech radio changes — update banking details live
  document.querySelectorAll('.tech-radio').forEach(radio => {
    radio.addEventListener('change', () => {
      updateBankingDetails(radio.value);
    });
  });

  // ──────────────────────────────────────────────────────
  // TIME SLOT FILTERING
  // Disables/hides time options that are already booked
  // for the currently selected date + tech combo.
  // A slot is still available if the OTHER tech is free.
  // ──────────────────────────────────────────────────────
  async function refreshTimeSlots() {
    const dateInput  = document.getElementById('bf-date');
    const timeSelect = document.getElementById('bf-time');
    if (!dateInput || !timeSelect) return;

    const date    = dateInput.value;
    const techVal = document.querySelector('input[name="lash_tech"]:checked')?.value || 'no-preference';

    if (!date) return;

    // Get all booked slots for this date
    const bookedSet = await getBookedSlotsForDate(date);

    // Determine which times are taken for the chosen tech
    // If "no-preference" is selected we block a slot only when BOTH techs are booked
    const takenTimes = new Set();

    ALL_TIME_SLOTS.forEach(time => {
      if (techVal === 'no-preference') {
        // Both mercen and dolly must be booked for the slot to be unavailable
        const mercenBooked = bookedSet.has(`${time}:mercen`);
        const dollyBooked  = bookedSet.has(`${time}:dolly`);
        if (mercenBooked && dollyBooked) takenTimes.add(time);
      } else {
        if (bookedSet.has(`${time}:${techVal}`)) takenTimes.add(time);
      }
    });

    // Re-render options
    const currentVal = timeSelect.value;
    timeSelect.innerHTML = '<option value="" disabled selected>Select a time…</option>';

    ALL_TIME_SLOTS.forEach(time => {
      const opt = document.createElement('option');
      opt.value = time;
      if (takenTimes.has(time)) {
        opt.textContent = `${time} — Fully Booked`;
        opt.disabled    = true;
        opt.style.color = 'rgba(250,250,250,0.25)';
      } else {
        opt.textContent = time;
      }
      timeSelect.appendChild(opt);
    });

    // Restore previous selection if still valid
    if (currentVal && !takenTimes.has(currentVal)) {
      timeSelect.value = currentVal;
    } else if (currentVal && takenTimes.has(currentVal)) {
      // Previously selected time is now taken — clear it
      timeSelect.value = '';
      setText('bsc-time', '—');
    }
  }

  // Trigger slot refresh when date changes
  document.getElementById('bf-date')?.addEventListener('change', () => {
    refreshTimeSlots();
  });

  // Trigger slot refresh when tech preference changes
  document.querySelectorAll('.tech-radio').forEach(radio => {
    radio.addEventListener('change', () => {
      refreshTimeSlots();
    });
  });

  // ──────────────────────────────────────────────────────
  // BOOKING REFERENCE GENERATOR
  // Format: LBM-YYMM-[INITIALS][4-digit random]
  // e.g.  LBM-2603-AM7341
  // Guaranteed unique — checked against storage before use.
  // ──────────────────────────────────────────────────────
  function buildRef(firstName = '', lastName = '') {
    const now  = new Date();
    const yy   = String(now.getFullYear()).slice(-2);
    const mm   = String(now.getMonth() + 1).padStart(2, '0');
    const fi   = (firstName.charAt(0) || 'X').toUpperCase();
    const li   = (lastName.charAt(0)  || 'X').toUpperCase();
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return `LBM-${yy}${mm}-${fi}${li}${rand}`;
  }

  async function generateUniqueRef(firstName, lastName) {
    let candidate;
    let attempts = 0;
    do {
      candidate = buildRef(firstName, lastName);
      attempts++;
    } while ((await isRefUsed(candidate)) && attempts < 20);
    return candidate;
  }

  async function regenerateRef() {
    const fn = document.getElementById('bf-firstname')?.value.trim() || '';
    const ln = document.getElementById('bf-lastname')?.value.trim()  || '';
    bookingRef = await generateUniqueRef(fn, ln);
    // Update all ref displays
    setText('ref-code',  bookingRef);
    setText('bd-ref',    bookingRef);
    setText('bsc-ref',   bookingRef);
    // Update the copy button data-copy
    const bdRefCopy = document.getElementById('bd-ref-copy');
    if (bdRefCopy) bdRefCopy.dataset.copy = bookingRef;
    const copyLabel = document.getElementById('copy-label');
    if (copyLabel) copyLabel.textContent = 'Copy';
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

    // If entering step 3: regenerate ref (ensures name is captured),
    // update banking details to match current tech selection
    if (currentStep === 3) {
      regenerateRef();
      const techVal = document.querySelector('input[name="lash_tech"]:checked')?.value || 'no-preference';
      updateBankingDetails(techVal);
    }

    // Scroll to top of form smoothly
    const formWrap = document.querySelector('.booking-form-wrap');
    if (formWrap) {
      const navH      = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
      const progressH = document.querySelector('.progress-bar-wrap')?.offsetHeight || 60;
      const y         = formWrap.getBoundingClientRect().top + window.scrollY - navH - progressH - 20;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }

  function updateProgress(step) {
    const stepEls    = document.querySelectorAll('.progress-steps .step');
    const connectors = document.querySelectorAll('.step-connector');

    stepEls.forEach(el => {
      const s = parseInt(el.dataset.step);
      el.classList.remove('active', 'completed');
      if (s === step) el.classList.add('active');
      if (s  < step)  el.classList.add('completed');
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
    if (field) field.classList.add('error');
    const el = document.getElementById(errorId);
    if (el) el.textContent = msg;
  }
  function clearFieldError(field, errorId) {
    if (field) field.classList.remove('error');
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

  bookingForm?.addEventListener('submit', async e => {
    e.preventDefault();

    // Validate policy checkbox
    const policyCheck = document.getElementById('bf-policy');
    const policyError = document.getElementById('policy-error');
    if (!policyCheck?.checked) {
      if (policyError) policyError.textContent = 'Please agree to the booking policies to continue.';
      return;
    }
    if (policyError) policyError.textContent = '';

    // Disable submit button to prevent double submission
    const submitBtn = document.getElementById('submit-booking');
    if (submitBtn) { submitBtn.disabled = true; setText('submit-text', 'Processing…'); }

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

    // Lash tech preference
    const techVal    = document.querySelector('input[name="lash_tech"]:checked')?.value || 'no-preference';
    const techLabels = { 'no-preference': 'No Preference (first available)', 'mercen': 'Mercen', 'dolly': 'Dolly' };
    const techLabel  = techLabels[techVal] || 'No Preference';

    // ── Double-check the chosen slot is still available ──
    if (rawDate && time) {
      const slotTaken = techVal === 'no-preference'
        ? (await isSlotTaken(rawDate, time, 'mercen') && await isSlotTaken(rawDate, time, 'dolly'))
        : await isSlotTaken(rawDate, time, techVal);

      if (slotTaken) {
        // Re-enable button and show error
        if (submitBtn) { submitBtn.disabled = false; setText('submit-text', 'Confirm & Send Proof of Payment via WhatsApp'); }
        showFieldError(document.getElementById('bf-time'), 'time-error', 'This slot was just booked. Please choose another time.');
        goToStep(2);
        return;
      }
    }

    // Format date nicely
    let formattedDate = rawDate;
    if (rawDate) {
      const d = new Date(rawDate + 'T00:00:00');
      formattedDate = d.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    const deposit = 150;
    const balance = svc.price ? (svc.price - 150) : '—';
    const ref     = bookingRef;

    // Get the correct banking details for this tech
    const bank = BANKING[techVal] || BANKING['mercen'];

    // Build the WhatsApp message
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
      `*Tech Pref:* ${techLabel}`,
      '',
      '─── *APPOINTMENT* ───────────',
      `*Date:*      ${formattedDate}`,
      `*Time:*      ${time}`,
      '',
      '─── *PAYMENT* ───────────────',
      `*Total:*     R${svc.price || '—'}`,
      `*Deposit:*   R150 ← non-refundable, pay immediately`,
      `*Balance:*   R${balance} (payable on the day)`,
      `*Pay to:*    ${bank.accountName} — ${bank.bank} ${bank.accountNumber}`,
      '',
      notes !== 'None' ? `─── *NOTES* ─────────────────\n${notes}\n` : '',
      '─────────────────────────────',
      '📎 _Please reply with proof of payment to confirm this booking._',
      `_Ref: ${ref}_`,
    ].filter(l => l !== undefined).join('\n');

    const encodedMsg = encodeURIComponent(waMessage);
    lastWaURL = `https://wa.me/${WA_NUMBER}?text=${encodedMsg}`;

    // ── Persist the booked slot and ref to storage ──
    if (rawDate && time) {
      if (techVal === 'no-preference') {
        // Block the slot for both techs since we don't know who'll take it
        await markSlotBooked(rawDate, time, 'mercen', ref);
        await markSlotBooked(rawDate, time, 'dolly',  ref);
      } else {
        await markSlotBooked(rawDate, time, techVal, ref);
      }
    }
    await markRefUsed(ref);

    // Show success state
    const form    = document.getElementById('booking-form');
    const success = document.getElementById('booking-success');
    form?.classList.add('hidden');
    success?.classList.remove('hidden');

    // Populate success state
    setText('bs-ref-display', ref);
    const manualLink = document.getElementById('bs-manual-link');
    if (manualLink) manualLink.href = lastWaURL;

    // Open WhatsApp — small delay lets success UI render first
    setTimeout(() => {
      window.location.href = lastWaURL;
    }, 1000);

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
      const textToCopy = btn.id === 'bd-ref-copy' ? bookingRef : (btn.dataset.copy || '');
      if (textToCopy) copyToClipboard(textToCopy, btn);
    });
  });

  function copyToClipboard(text, btn, successText = '✓', defaultText = null) {
    if (!navigator.clipboard) {
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