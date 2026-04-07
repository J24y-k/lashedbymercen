/**
 * LASHED BY MERCEN — booking.js  v3
 *
 * Changes from original:
 *  - Uses localStorage so slot blocking works on a real website
 *  - Fixed Dolly's banking key: HTML uses value="second-tech"
 *  - Slot blocking is per tech — same time still bookable by other tech
 *  - Reference numbers are unique (checked against localStorage)
 *  - Banking card swaps live when tech selection changes
 */

document.addEventListener('DOMContentLoaded', () => {

  // ─────────────────────────────────────────────────────
  // CONFIG
  // ─────────────────────────────────────────────────────
  const WA_NUMBER = '27677243893';

  // HTML radio values → banking details
  // NOTE: the HTML uses value="second-tech" for Dolly
  const BANKING = {
    'mercen': {
      accountName:   'Monoge E',
      bank:          'Standard Bank',
      accountNumber: '10250324022',
      branchCode:    '051001',
    },
    'second-tech': {
      accountName:   'Miss E Eva',
      bank:          'Standard Bank',
      accountNumber: '10250324022',
      branchCode:    '051001',
    },
    'no-preference': {
      accountName:   'Monoge E',
      bank:          'Standard Bank',
      accountNumber: '10250324022',
      branchCode:    '051001',
    },
  };

  const SERVICES = {
    'classic-full-set':        { label: 'Classic Full Set',            price: 250,  duration: '1h 30 min' },
    'hybrid-full-set':         { label: 'Hybrid Full Set',             price: 350,  duration: '2 hours'   },
    'hybrid-spikes-full-set':  { label: 'Hybrid x Spikes Full Set',    price: 350,  duration: '2 hours'   },
    'wet-set':                 { label: 'Wet Set',                     price: 380,  duration: '1h 30 min' },
    'hybrid-cat-eye':          { label: 'Hybrid Cat Eye Wispy',        price: 400,  duration: '2 hours'   },
    'volume-full-set':         { label: 'Volume Full Set',             price: 600,  duration: '3 hours'   },
    'mega-volume-full-set':    { label: 'Mega Volume Full Set',        price: 750,  duration: '3h 30 min' },
    'bottom-lashes':           { label: 'Bottom Lashes',               price: 150,  duration: 'Add-on'    },
    'lash-removal':            { label: 'Lash Removal',                price: 150,  duration: '45 min'    },
    'classic-fill':            { label: 'Classic 2-Week Refill',       price: 150,  duration: '1h 30 min' },
    'hybrid-fill':             { label: 'Hybrid 2-Week Refill',        price: 250,  duration: '1h 30 min' },
    'volume-fill':             { label: 'Volume 2-Week Refill',        price: 500,  duration: '1h 30 min' },
    'hybrid-spikes-fill':      { label: 'Hybrid x Spikes Refill',      price: 290,  duration: '1h 30 min' },
    'hybrid-cat-eye-fill':     { label: 'Hybrid Cat Eye Wispy Refill', price: 300,  duration: '1h 30 min' },
    'wet-set-fill':            { label: 'Wet Set Refill',              price: 250,  duration: '1h 30 min' },
    'brow-lamination':         { label: 'Brow Lamination & Tint',      price: 250,  duration: '1 hour'    },
    'brow-tint-shape':         { label: 'Brow Tint & Shape',           price: 120,  duration: '1 hour'    },
  };

  const ALL_TIME_SLOTS = [
    '09:00','09:30','10:00','10:30','11:00','11:30',
    '12:00','12:30','13:00','13:30','14:00','14:30',
    '15:00','15:30','16:00','16:30','17:00','17:30',
  ];

  // ─────────────────────────────────────────────────────
  // localStorage HELPERS
  // Keys:
  //   lbm_slot_{date}_{time}_{tech}  → booking ref string
  //   lbm_refs_used                  → JSON array of ref strings
  // ─────────────────────────────────────────────────────
  function slotKey(date, time, tech) {
    return `lbm_slot_${date}_${time}_${tech}`;
  }

  function isSlotTaken(date, time, tech) {
    return localStorage.getItem(slotKey(date, time, tech)) !== null;
  }

  function markSlotBooked(date, time, tech, ref) {
    try { localStorage.setItem(slotKey(date, time, tech), ref); } catch(_) {}
  }

  function getUsedRefs() {
    try {
      const raw = localStorage.getItem('lbm_refs_used');
      return raw ? JSON.parse(raw) : [];
    } catch(_) { return []; }
  }

  function markRefUsed(ref) {
    try {
      const used = getUsedRefs();
      used.push(ref);
      localStorage.setItem('lbm_refs_used', JSON.stringify(used));
    } catch(_) {}
  }

  function isRefUsed(ref) {
    return getUsedRefs().includes(ref);
  }

  // ─────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────
  let currentStep     = 1;
  let bookingRef      = '';
  let lastWaURL       = '';
  let selectedService = null;

  // Navbar behaviour (scroll state and mobile menu) is handled by ../navbar.js


  // ─────────────────────────────────────────────────────
  // BACK TO TOP
  // ─────────────────────────────────────────────────────
  const backTop = document.getElementById('back-top');
  window.addEventListener('scroll', () => backTop.classList.toggle('visible', window.scrollY > 500), { passive: true });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ─────────────────────────────────────────────────────
  // YEAR
  // ─────────────────────────────────────────────────────
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ─────────────────────────────────────────────────────
  // URL PARAM pre-select (?service=hybrid-full-set)
  // ─────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────
  // SERVICE SELECTION
  // ─────────────────────────────────────────────────────
  document.querySelectorAll('.ssg-radio').forEach(radio => {
    radio.addEventListener('change', () => {
      selectedService = radio.value;
      updateSummaryService(selectedService);
      const err = document.getElementById('service-error');
      if (err) err.textContent = '';
    });
  });

  function updateSummaryService(serviceKey) {
    const svc = SERVICES[serviceKey];
    if (!svc) return;
    setText('bsc-service',  svc.label);
    setText('bsc-duration', svc.duration);
    setText('bsc-price',    `From R${svc.price}`);
    updateDepositDisplay(svc.price);
    regenerateRef();
  }

  function updateDepositDisplay(price) {
    const deposit = 150;
    const balance = price - deposit;
    setText('service-total',  `R${price}`);
    setText('deposit-amount', `R${deposit}`);
    setText('balance-amount', `R${balance}`);
    setText('bsc-deposit',    `R${deposit}`);
  }

  // ─────────────────────────────────────────────────────
  // BANKING DETAILS — swap when tech changes
  // ─────────────────────────────────────────────────────
  function updateBankingDetails(techVal) {
    const b = BANKING[techVal] || BANKING['mercen'];

    setText('bd-name',   b.accountName);
    setText('bd-accnum', b.accountNumber);

    const copyNameBtn = document.querySelector('.bd-copy[aria-label="Copy account name"]');
    const copyAccBtn  = document.querySelector('.bd-copy[aria-label="Copy account number"]');
    if (copyNameBtn) copyNameBtn.dataset.copy = b.accountName;
    if (copyAccBtn)  copyAccBtn.dataset.copy  = b.accountNumber;

    document.querySelectorAll('.bd-row').forEach(row => {
      const label = row.querySelector('.bd-label');
      const value = row.querySelector('.bd-value');
      if (!label || !value) return;
      const lbl = label.textContent.trim();
      if (lbl === 'Bank')        value.textContent = b.bank;
      if (lbl === 'Branch Code') value.textContent = b.branchCode;
    });
  }

  document.querySelectorAll('.tech-radio').forEach(radio => {
    radio.addEventListener('change', () => {
      updateBankingDetails(radio.value);
      refreshTimeSlots();
    });
  });

  // ─────────────────────────────────────────────────────
  // TIME SLOT FILTERING
  // ─────────────────────────────────────────────────────
  function refreshTimeSlots() {
    const dateInput  = document.getElementById('bf-date');
    const timeSelect = document.getElementById('bf-time');
    if (!dateInput || !timeSelect || !dateInput.value) return;

    const date    = dateInput.value;
    const techVal = document.querySelector('input[name="lash_tech"]:checked')?.value || 'no-preference';

    const takenTimes = new Set();
    ALL_TIME_SLOTS.forEach(time => {
      if (techVal === 'no-preference') {
        if (isSlotTaken(date, time, 'mercen') && isSlotTaken(date, time, 'second-tech')) {
          takenTimes.add(time);
        }
      } else {
        if (isSlotTaken(date, time, techVal)) takenTimes.add(time);
      }
    });

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

    if (currentVal && !takenTimes.has(currentVal)) {
      timeSelect.value = currentVal;
    } else if (currentVal && takenTimes.has(currentVal)) {
      timeSelect.value = '';
      setText('bsc-time', '—');
    }
  }

  document.getElementById('bf-date')?.addEventListener('change', refreshTimeSlots);

  // ─────────────────────────────────────────────────────
  // BOOKING REFERENCE — unique via localStorage
  // ─────────────────────────────────────────────────────
  function buildRef(firstName, lastName) {
    const now  = new Date();
    const yy   = String(now.getFullYear()).slice(-2);
    const mm   = String(now.getMonth() + 1).padStart(2, '0');
    const fi   = (firstName.charAt(0) || 'X').toUpperCase();
    const li   = (lastName.charAt(0)  || 'X').toUpperCase();
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return `LBM-${yy}${mm}-${fi}${li}${rand}`;
  }

  function generateUniqueRef(firstName, lastName) {
    let candidate;
    let attempts = 0;
    do {
      candidate = buildRef(firstName, lastName);
      attempts++;
    } while (isRefUsed(candidate) && attempts < 30);
    return candidate;
  }

  function regenerateRef() {
    const fn   = document.getElementById('bf-firstname')?.value.trim() || '';
    const ln   = document.getElementById('bf-lastname')?.value.trim()  || '';
    bookingRef = generateUniqueRef(fn, ln);
    setText('ref-code', bookingRef);
    setText('bd-ref',   bookingRef);
    setText('bsc-ref',  bookingRef);
    const bdRefCopy = document.getElementById('bd-ref-copy');
    if (bdRefCopy) bdRefCopy.dataset.copy = bookingRef;
    const copyLabel = document.getElementById('copy-label');
    if (copyLabel) copyLabel.textContent = 'Copy';
  }

  regenerateRef();

  ['bf-firstname', 'bf-lastname'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      regenerateRef();
      const fn       = document.getElementById('bf-firstname')?.value.trim();
      const ln       = document.getElementById('bf-lastname')?.value.trim();
      const fullName = [fn, ln].filter(Boolean).join(' ');
      setText('bsc-name', fullName || '—');
    });
  });

  document.getElementById('bf-date')?.addEventListener('change', e => {
    const val = e.target.value;
    if (val) {
      const d    = new Date(val + 'T00:00:00');
      const opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      setText('bsc-date', d.toLocaleDateString('en-ZA', opts));
    } else {
      setText('bsc-date', '—');
    }
  });

  document.getElementById('bf-time')?.addEventListener('change', e => {
    setText('bsc-time', e.target.value || '—');
  });

  // ─────────────────────────────────────────────────────
  // STEP NAVIGATION
  // ─────────────────────────────────────────────────────
  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateStep(currentStep)) goToStep(parseInt(btn.dataset.next));
    });
  });

  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.back)));
  });

  function goToStep(step) {
    document.getElementById(`step-${currentStep}`)?.classList.remove('active');
    currentStep = step;
    document.getElementById(`step-${currentStep}`)?.classList.add('active');
    updateProgress(currentStep);

    if (currentStep === 3) {
      regenerateRef();
      const techVal = document.querySelector('input[name="lash_tech"]:checked')?.value || 'no-preference';
      updateBankingDetails(techVal);
    }

    const formWrap = document.querySelector('.booking-form-wrap');
    if (formWrap) {
      const navH      = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
      const progressH = document.querySelector('.progress-bar-wrap')?.offsetHeight || 60;
      const y         = formWrap.getBoundingClientRect().top + window.scrollY - navH - progressH - 20;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }

  function updateProgress(step) {
    document.querySelectorAll('.progress-steps .step').forEach(el => {
      const s = parseInt(el.dataset.step);
      el.classList.remove('active', 'completed');
      if (s === step) el.classList.add('active');
      if (s  < step)  el.classList.add('completed');
    });
    document.querySelectorAll('.step-connector').forEach((con, i) => {
      con.classList.toggle('active', i + 1 < step);
    });
  }

  // ─────────────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────────────
  function validateStep(step) {
    let valid = true;

    if (step === 1) {
      if (!document.querySelector('input[name="service"]:checked')) {
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

      if (!fn?.value.trim()) { showFieldError(fn, 'firstname-error', 'Please enter your first name.');  valid = false; }
      else clearFieldError(fn, 'firstname-error');

      if (!ln?.value.trim()) { showFieldError(ln, 'lastname-error', 'Please enter your last name.');    valid = false; }
      else clearFieldError(ln, 'lastname-error');

      if (!ph?.value.trim()) {
        showFieldError(ph, 'phone-error', 'Please enter your WhatsApp number.'); valid = false;
      } else if (!/^[+\d\s\-()]{9,16}$/.test(ph.value.trim())) {
        showFieldError(ph, 'phone-error', 'Please enter a valid phone number.'); valid = false;
      } else {
        clearFieldError(ph, 'phone-error');
      }

      if (!dt?.value) {
        showFieldError(dt, 'date-error', 'Please select a preferred date.'); valid = false;
      } else {
        const chosen = new Date(dt.value + 'T00:00:00');
        const today  = new Date(); today.setHours(0,0,0,0);
        if (chosen < today) {
          showFieldError(dt, 'date-error', 'Please choose a future date.'); valid = false;
        } else {
          clearFieldError(dt, 'date-error');
        }
      }

      if (!tm?.value) { showFieldError(tm, 'time-error', 'Please select a preferred time.'); valid = false; }
      else clearFieldError(tm, 'time-error');
    }

    return valid;
  }

  function showError(id, msg)          { const el = document.getElementById(id); if (el) el.textContent = msg; }
  function showFieldError(f, eId, msg) { if (f) f.classList.add('error'); const el = document.getElementById(eId); if (el) el.textContent = msg; }
  function clearFieldError(f, eId)     { if (f) f.classList.remove('error'); const el = document.getElementById(eId); if (el) el.textContent = ''; }

  ['bf-firstname','bf-lastname','bf-phone','bf-date','bf-time'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const clear = () => {
      el.classList.remove('error');
      const e = document.getElementById(`${id.replace('bf-','')}-error`);
      if (e) e.textContent = '';
    };
    el.addEventListener('input',  clear);
    el.addEventListener('change', clear);
  });

  // ─────────────────────────────────────────────────────
  // FORM SUBMISSION → WHATSAPP + localStorage
  // ─────────────────────────────────────────────────────
  document.getElementById('booking-form')?.addEventListener('submit', e => {
    e.preventDefault();

    const policyCheck = document.getElementById('bf-policy');
    const policyError = document.getElementById('policy-error');
    if (!policyCheck?.checked) {
      if (policyError) policyError.textContent = 'Please agree to the booking policies to continue.';
      return;
    }
    if (policyError) policyError.textContent = '';

    const svcKey  = document.querySelector('input[name="service"]:checked')?.value || '';
    const svc     = SERVICES[svcKey] || {};
    const fn      = document.getElementById('bf-firstname')?.value.trim() || '';
    const ln      = document.getElementById('bf-lastname')?.value.trim()  || '';
    const phone   = document.getElementById('bf-phone')?.value.trim()     || '';
    const email   = document.getElementById('bf-email')?.value.trim()     || 'Not provided';
    const rawDate = document.getElementById('bf-date')?.value             || '';
    const time    = document.getElementById('bf-time')?.value             || '';
    const notes   = document.getElementById('bf-notes')?.value.trim()     || 'None';
    const techVal = document.querySelector('input[name="lash_tech"]:checked')?.value || 'no-preference';

    const techLabels = {
      'no-preference': 'No Preference (first available)',
      'mercen':        'Mercen',
      'second-tech':   'Dolly',
    };
    const techLabel = techLabels[techVal] || 'No Preference';

    // Last-second slot check
    if (rawDate && time) {
      const alreadyTaken = techVal === 'no-preference'
        ? (isSlotTaken(rawDate, time, 'mercen') && isSlotTaken(rawDate, time, 'second-tech'))
        : isSlotTaken(rawDate, time, techVal);

      if (alreadyTaken) {
        showFieldError(document.getElementById('bf-time'), 'time-error', 'Sorry — this slot was just taken. Please choose another time.');
        goToStep(2);
        refreshTimeSlots();
        return;
      }
    }

    let formattedDate = rawDate;
    if (rawDate) {
      const d = new Date(rawDate + 'T00:00:00');
      formattedDate = d.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    const deposit = 150;
    const balance = svc.price ? (svc.price - 150) : '—';
    const ref     = bookingRef;
    const bank    = BANKING[techVal] || BANKING['mercen'];

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
      `*Deposit:*   R150 — non-refundable, pay immediately`,
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

    // Persist slot + ref
    if (rawDate && time) {
      if (techVal === 'no-preference') {
        markSlotBooked(rawDate, time, 'mercen',      ref);
        markSlotBooked(rawDate, time, 'second-tech', ref);
      } else {
        markSlotBooked(rawDate, time, techVal, ref);
      }
    }
    markRefUsed(ref);

    // Show success
    document.getElementById('booking-form')?.classList.add('hidden');
    const success = document.getElementById('booking-success');
    success?.classList.remove('hidden');
    setText('bs-ref-display', ref);
    const manualLink = document.getElementById('bs-manual-link');
    if (manualLink) manualLink.href = lastWaURL;

    setTimeout(() => { window.location.href = lastWaURL; }, 1000);
    success?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // ─────────────────────────────────────────────────────
  // COPY TO CLIPBOARD
  // ─────────────────────────────────────────────────────
  document.getElementById('ref-copy-btn')?.addEventListener('click', () => {
    copyToClipboard(bookingRef, document.getElementById('ref-copy-btn'), 'Copied!', 'Copy');
  });

  document.querySelectorAll('.bd-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.id === 'bd-ref-copy' ? bookingRef : (btn.dataset.copy || '');
      if (text) copyToClipboard(text, btn);
    });
  });

  function copyToClipboard(text, btn, successText = '✓', defaultText = null) {
    const doFlash = () => flashCopyBtn(btn, successText, defaultText);
    if (!navigator.clipboard) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand('copy'); } catch(_) {}
      document.body.removeChild(ta);
      doFlash(); return;
    }
    navigator.clipboard.writeText(text).then(doFlash).catch(() => {});
  }

  function flashCopyBtn(btn, successText, defaultText) {
    btn.classList.add('copied');
    const labelEl  = btn.querySelector('#copy-label') || btn;
    const original = defaultText || labelEl.textContent;
    if (labelEl.id === 'copy-label') labelEl.textContent = successText;
    setTimeout(() => {
      btn.classList.remove('copied');
      if (labelEl.id === 'copy-label') labelEl.textContent = original;
    }, 2000);
  }

  // ─────────────────────────────────────────────────────
  // MIN / MAX DATE
  // ─────────────────────────────────────────────────────
  const dateInput = document.getElementById('bf-date');
  if (dateInput) {
    const today = new Date();
    dateInput.min = today.toISOString().split('T')[0];
    const max = new Date(today);
    max.setMonth(max.getMonth() + 3);
    dateInput.max = max.toISOString().split('T')[0];
  }

  // ─────────────────────────────────────────────────────
  // HELPER
  // ─────────────────────────────────────────────────────
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

});