/**
 * LASHED BY MERCEN — portfolio.js
 * Features:
 *  - GSAP staggered grid reveal
 *  - Full-screen lightbox with prev/next
 *  - Keyboard navigation (← → Esc)
 *  - Touch swipe support (mobile)
 *  - Focus trap inside lightbox
 *  - Image lazy-load with loading state
 *  - URL hash sync for direct linking
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
  // 2. NAV
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

  // iOS-safe scroll lock for hamburger nav
  let _scrollY = 0;
  function lockScroll() {
    _scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${_scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
  }
  function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    window.scrollTo(0, _scrollY);
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    navLinks.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen.toString());
    isOpen ? lockScroll() : unlockScroll();
  });
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      unlockScroll();
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      unlockScroll();
    }
  });

  // ──────────────────────────────────────────────────────
  // 4. LIGHTBOX
  // ──────────────────────────────────────────────────────
  const gridItems  = Array.from(document.querySelectorAll('.grid-item'));
  const lightbox   = document.getElementById('lightbox');
  const lbImg      = document.getElementById('lb-img');
  const lbLoader   = document.getElementById('lb-loader');
  const lbClose    = document.getElementById('lb-close');
  const lbPrev     = document.getElementById('lb-prev');
  const lbNext     = document.getElementById('lb-next');
  const lbCounter  = document.getElementById('lb-counter');
  const lbBackdrop = document.getElementById('lb-backdrop');

  let currentIdx   = 0;
  let previousFocus = null;

  // Collect all image sources and alts from grid
  const images = gridItems.map(item => {
    const img = item.querySelector('img');
    return { src: img ? img.src : '', alt: img ? img.alt : '' };
  });

  function openLightbox(idx) {
    previousFocus = document.activeElement;
    currentIdx = idx;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    loadImage(idx);
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lbImg.classList.remove('loaded');
    if (previousFocus) previousFocus.focus();
    // Clear hash
    history.replaceState(null, '', window.location.pathname);
  }

  function loadImage(idx) {
    const { src, alt } = images[idx];
    lbImg.classList.remove('loaded');
    lbLoader.classList.remove('hidden');
    lbCounter.textContent = `${idx + 1} / ${images.length}`;

    // Update nav buttons
    lbPrev.disabled = (idx === 0);
    lbNext.disabled = (idx === images.length - 1);

    // Load image
    const tempImg = new Image();
    tempImg.onload = () => {
      lbImg.src = src;
      lbImg.alt = alt;
      lbLoader.classList.add('hidden');
      lbImg.classList.add('loaded');
    };
    tempImg.onerror = () => {
      lbLoader.classList.add('hidden');
      lbImg.src = '';
      lbImg.alt = 'Image not available';
      lbImg.classList.add('loaded');
    };
    tempImg.src = src;

    // Update URL hash for direct linking
    history.replaceState(null, '', `#photo-${idx + 1}`);
  }

  function navigate(dir) {
    const newIdx = currentIdx + dir;
    if (newIdx >= 0 && newIdx < images.length) {
      // GSAP slide animation
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(lbImg,
          { opacity: 0, x: dir > 0 ? 40 : -40 },
          { opacity: 1, x: 0, duration: .35, ease: 'power2.out', onStart: () => lbImg.classList.remove('loaded') }
        );
      }
      currentIdx = newIdx;
      loadImage(currentIdx);
    }
  }

  // Open on click
  gridItems.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(i);
      }
    });
  });

  // Close controls
  lbClose.addEventListener('click', closeLightbox);
  lbBackdrop.addEventListener('click', closeLightbox);

  // Prev / Next
  lbPrev.addEventListener('click', () => navigate(-1));
  lbNext.addEventListener('click', () => navigate(1));

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    switch (e.key) {
      case 'Escape':     closeLightbox(); break;
      case 'ArrowLeft':  navigate(-1);    break;
      case 'ArrowRight': navigate(1);     break;
      case 'Tab':        trapFocus(e);    break;
    }
  });

  // Focus trap
  function trapFocus(e) {
    const focusable = lightbox.querySelectorAll('button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  // Touch swipe (mobile)
  let touchStartX = 0;
  let touchStartY = 0;
  lbImg.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });
  lbImg.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = Math.abs(e.changedTouches[0].screenY - touchStartY);
    if (Math.abs(dx) > 50 && dy < 60) {
      navigate(dx < 0 ? 1 : -1);
    }
  }, { passive: true });

  // Handle hash on load (direct link support)
  const hash = window.location.hash;
  if (hash && hash.startsWith('#photo-')) {
    const idxFromHash = parseInt(hash.replace('#photo-', ''), 10) - 1;
    if (idxFromHash >= 0 && idxFromHash < images.length) {
      setTimeout(() => openLightbox(idxFromHash), 600);
    }
  }

  // ──────────────────────────────────────────────────────
  // 5. BACK TO TOP
  // ──────────────────────────────────────────────────────
  const backTop = document.getElementById('back-top');
  window.addEventListener('scroll', () => backTop.classList.toggle('visible', window.scrollY > 500), { passive: true });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ──────────────────────────────────────────────────────
  // 6. YEAR
  // ──────────────────────────────────────────────────────
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});

// ──────────────────────────────────────────────────────
// GSAP ANIMATIONS
// ──────────────────────────────────────────────────────
function initGSAP() {
  // Staggered grid reveal — batch items by viewport entry
  const gridItems = document.querySelectorAll('.grid-item');

  ScrollTrigger.batch(gridItems, {
    onEnter: batch => {
      gsap.fromTo(batch,
        { opacity: 0, y: 50, scale: .97 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: .8,
          ease: 'power3.out',
          stagger: 0.07,
          overwrite: true
        }
      );
    },
    start: 'top 92%',
    once: true
  });

  // Reveal blocks (intro bar, ig-strip)
  gsap.utils.toArray('.reveal-block').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 35 },
      {
        opacity: 1, y: 0, duration: .85, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 87%', once: true }
      }
    );
  });

  // Hero circles subtle parallax
  gsap.to('.ph-circle.c1', {
    y: 80,
    ease: 'none',
    scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
  });
  gsap.to('.ph-circle.c2', {
    y: 50,
    ease: 'none',
    scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: 2 }
  });

  // Diagonal lines drift
  gsap.to('.ph-lines span', {
    y: 60,
    ease: 'none',
    stagger: .05,
    scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: 1 }
  });

  // IG strip circle rotate
  gsap.to('.igs-circle', {
    rotation: 360,
    duration: 50,
    ease: 'none',
    repeat: -1
  });
}

// ──────────────────────────────────────────────────────
// FALLBACK
// ──────────────────────────────────────────────────────
function initFallbackReveal() {
  const els = document.querySelectorAll('.reveal-block, .reveal-grid, .grid-item');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });
  els.forEach(el => observer.observe(el));
}