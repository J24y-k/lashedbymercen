/**
 * LASHED BY MERCEN — about.js
 * About page interactions + GSAP animations
 */

document.addEventListener('DOMContentLoaded', () => {

  // ──────────────────────────────────────────────────────
  // 1. GSAP INIT
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
  // 3. MOBILE MENU
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
  window.addEventListener('scroll', () => {
    backTop.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ──────────────────────────────────────────────────────
  // 5. CURRENT YEAR
  // ──────────────────────────────────────────────────────
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ──────────────────────────────────────────────────────
  // 6. MILESTONE HOVER: left-border accent
  // ──────────────────────────────────────────────────────
  document.querySelectorAll('.milestone').forEach(el => {
    el.addEventListener('mouseenter', () => {
      el.style.borderLeftColor = 'var(--pink)';
      el.style.paddingLeft = '.75rem';
    });
    el.addEventListener('mouseleave', () => {
      el.style.paddingLeft = '';
    });
  });

});

// ──────────────────────────────────────────────────────
// GSAP ANIMATIONS
// ──────────────────────────────────────────────────────
function initGSAP() {

  // Generic reveal blocks
  gsap.utils.toArray('.reveal-block').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: .95, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true }
      }
    );
  });

  // Staggered cards
  gsap.utils.toArray('.reveal-card').forEach((el, i) => {
    const delay = parseFloat(el.style.getPropertyValue('--i') || i) * 0.1;
    gsap.fromTo(el,
      { opacity: 0, y: 45 },
      { opacity: 1, y: 0, duration: .85, ease: 'power3.out', delay,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      }
    );
  });

  // Story main image: slide from left
  const storyMain = document.querySelector('.reveal-img');
  if (storyMain) {
    gsap.fromTo(storyMain,
      { opacity: 0, x: -60 },
      { opacity: 1, x: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: storyMain, start: 'top 82%', once: true }
      }
    );
  }

  // Story accent image: slide from right-ish + delay
  const storyAccent = document.querySelector('.reveal-img-accent');
  if (storyAccent) {
    gsap.fromTo(storyAccent,
      { opacity: 0, x: 40, y: 30 },
      { opacity: 1, x: 0, y: 0, duration: 1, ease: 'power3.out', delay: .25,
        scrollTrigger: { trigger: storyAccent, start: 'top 85%', once: true }
      }
    );
  }

  // Artist image: slide from right
  const artistImg = document.querySelector('.reveal-img-right');
  if (artistImg) {
    gsap.fromTo(artistImg,
      { opacity: 0, x: 60 },
      { opacity: 1, x: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: artistImg, start: 'top 82%', once: true }
      }
    );
  }

  // Why visual
  const whyVis = document.querySelector('.why-visual');
  if (whyVis) {
    gsap.fromTo(whyVis,
      { opacity: 0, x: -50 },
      { opacity: 1, x: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: whyVis, start: 'top 85%', once: true }
      }
    );
  }

  // Milestone items: stagger on scroll
  gsap.utils.toArray('.milestone').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: .6, ease: 'power2.out', delay: i * 0.12,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      }
    );
  });

  // Why items: stagger
  gsap.utils.toArray('.why-item').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, x: 30 },
      { opacity: 1, x: 0, duration: .7, ease: 'power2.out', delay: i * 0.1,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      }
    );
  });

  // Brand quote: scale in slightly
  const bq = document.querySelector('.brand-quote');
  if (bq) {
    gsap.fromTo(bq,
      { opacity: 0, scale: .97, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: bq, start: 'top 85%', once: true }
      }
    );
  }

  // Stats badge: pop in
  const badge = document.querySelector('.story-badge');
  if (badge) {
    gsap.fromTo(badge,
      { opacity: 0, scale: .6 },
      { opacity: 1, scale: 1, duration: .7, ease: 'back.out(1.6)',
        scrollTrigger: { trigger: badge, start: 'top 85%', once: true }
      }
    );
  }

  // Artist quote tag: pop in
  const aqTag = document.querySelector('.artist-quote-tag');
  if (aqTag) {
    gsap.fromTo(aqTag,
      { opacity: 0, y: 30, x: -20 },
      { opacity: 1, y: 0, x: 0, duration: .8, ease: 'back.out(1.4)', delay: .4,
        scrollTrigger: { trigger: aqTag, start: 'top 88%', once: true }
      }
    );
  }

  // Page hero circle parallax
  gsap.to('.ph-circle.c1', {
    y: 100,
    ease: 'none',
    scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: 1 }
  });
}

// ──────────────────────────────────────────────────────
// FALLBACK (no GSAP)
// ──────────────────────────────────────────────────────
function initFallbackReveal() {
  const els = document.querySelectorAll(
    '.reveal-block, .reveal-card, .reveal-img, .reveal-img-accent, .reveal-img-right'
  );
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

  els.forEach(el => observer.observe(el));
}