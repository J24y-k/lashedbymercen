/**
 * LASHED BY MERCEN — faq.js
 * Accessible accordion · GSAP reveals · Nav · Back-to-top
 */

document.addEventListener('DOMContentLoaded', () => {

  // GSAP
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    initGSAP();
  } else {
    window.addEventListener('load', () => {
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        initGSAP();
      } else {
        initFallback();
      }
    });
  }

  // ── NAV ──
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
  nav.classList.toggle('scrolled', window.scrollY > 60);

  // ── HAMBURGER ──
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    navLinks.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  navLinks.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
    hamburger.classList.remove('open'); navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
  }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      hamburger.classList.remove('open'); navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    }
  });

  // ── BACK TO TOP ──
  const backTop = document.getElementById('back-top');
  window.addEventListener('scroll', () => backTop.classList.toggle('visible', window.scrollY > 500), { passive: true });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ── YEAR ──
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // ── ACCESSIBLE ACCORDION ──
  // Uses aria-expanded + hidden attributes for full a11y
  // Smooth animation via max-height CSS transition
  const questions = document.querySelectorAll('.faq-q');

  questions.forEach(btn => {
    btn.addEventListener('click', () => {
      const isOpen   = btn.getAttribute('aria-expanded') === 'true';
      const answerId = btn.getAttribute('aria-controls');
      const answer   = document.getElementById(answerId);

      // Close all others in the same group (optional — set to false for multi-open)
      const closeOthers = true;
      if (closeOthers) {
        questions.forEach(other => {
          if (other !== btn && other.getAttribute('aria-expanded') === 'true') {
            other.setAttribute('aria-expanded', 'false');
            const otherId  = other.getAttribute('aria-controls');
            const otherAns = document.getElementById(otherId);
            if (otherAns) otherAns.hidden = true;
          }
        });
      }

      // Toggle current
      btn.setAttribute('aria-expanded', (!isOpen).toString());
      if (answer) answer.hidden = isOpen;

      // GSAP micro-animation on open
      if (!isOpen && typeof gsap !== 'undefined' && answer) {
        gsap.fromTo(answer,
          { opacity: 0, y: -6 },
          { opacity: 1, y: 0, duration: .35, ease: 'power2.out' }
        );
      }
    });

    // Keyboard: also open on Enter / Space (already default for button, but explicit)
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Open FAQ if hash matches (e.g. faq.html#policy-deposit)
  const hash = window.location.hash;
  if (hash) {
    const target = document.querySelector(hash);
    if (target) {
      setTimeout(() => {
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
        const y = target.getBoundingClientRect().top + window.scrollY - navH - 20;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 400);
    }
  }
});

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
    const delay = parseFloat(el.style.getPropertyValue('--i') || 0) * 0.12;
    gsap.fromTo(el,
      { opacity: 0, y: 35 },
      { opacity: 1, y: 0, duration: .8, ease: 'power3.out', delay,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      }
    );
  });
  gsap.to('.ph-circle.c1', { y: 70, ease: 'none', scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: 1.5 } });
}

function initFallback() {
  const els = document.querySelectorAll('.reveal-block, .reveal-card');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
  }, { threshold: 0.07 });
  els.forEach(el => obs.observe(el));
}