/**
 * LASHED BY MERCEN — service.js
 * Services page: category filtering, GSAP reveals, nav
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
  


  // ──────────────────────────────────────────────────────
  // 4. CATEGORY FILTER TABS
  // ──────────────────────────────────────────────────────
  const tabs       = document.querySelectorAll('.cat-tab');
  const categories = document.querySelectorAll('.service-category');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;

      // Update tab active state
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Show/hide categories
      categories.forEach(cat => {
        const catType = cat.dataset.category;
        if (filter === 'all' || filter === catType) {
          cat.classList.remove('hidden');
          // Animate in
          if (typeof gsap !== 'undefined') {
            gsap.fromTo(cat, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .5, ease: 'power2.out' });
          }
        } else {
          cat.classList.add('hidden');
        }
      });

      // Scroll to section smoothly
      if (filter !== 'all') {
        const targetCat = document.getElementById(`cat-${filter}`);
        if (targetCat) {
          const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) + 60;
          const y = targetCat.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      } else {
        const servicesSection = document.getElementById('services');
        if (servicesSection) {
          const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) + 60;
          const y = servicesSection.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    });
  });

  // Auto-highlight tab based on scroll position
  const sectionOffsets = [];
  categories.forEach(cat => {
    sectionOffsets.push({ id: cat.dataset.category, el: cat });
  });

  window.addEventListener('scroll', () => {
    const navH = 80 + 60;
    let current = 'all';
    sectionOffsets.forEach(({ id, el }) => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= navH + 50) current = id;
    });

    tabs.forEach(tab => {
      if (tab.dataset.filter === current || (current === sectionOffsets[0]?.id && tab.dataset.filter === 'all')) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }, { passive: true });

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

  // ──────────────────────────────────────────────────────
  // 7. Pre-select service from URL param (for booking flow)
  //    e.g. booking.html?service=classic-full-set
  //    On services page, if ?highlight=xxx, scroll to it
  // ──────────────────────────────────────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const highlight = urlParams.get('highlight');
  if (highlight) {
    const targetArticle = document.querySelector(`[data-category="${highlight}"]`);
    if (targetArticle) {
      setTimeout(() => {
        const navH = 80 + 60;
        const y = targetArticle.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 600);
    }
  }

});

// ──────────────────────────────────────────────────────
// GSAP ANIMATIONS
// ──────────────────────────────────────────────────────
function initGSAP() {

  // Reveal blocks (category headers etc.)
  gsap.utils.toArray('.reveal-block').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 45 },
      { opacity: 1, y: 0, duration: .9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 87%', once: true }
      }
    );
  });

  // Service items: stagger by index within each list
  document.querySelectorAll('.service-list').forEach(list => {
    const items = list.querySelectorAll('.reveal-item, .service-item');
    items.forEach((item, i) => {
      gsap.fromTo(item,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: .8, ease: 'power3.out', delay: i * 0.12,
          scrollTrigger: { trigger: item, start: 'top 90%', once: true }
        }
      );
    });
  });

  // Compact items
  gsap.utils.toArray('.service-item--compact.reveal-item').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: .65, ease: 'power2.out', delay: i * 0.08,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      }
    );
  });

  // Aftercare cards
  gsap.utils.toArray('.reveal-card').forEach((el) => {
    const delay = parseFloat(el.style.getPropertyValue('--i') || 0) * 0.1;
    gsap.fromTo(el,
      { opacity: 0, y: 35 },
      { opacity: 1, y: 0, duration: .8, ease: 'power3.out', delay,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      }
    );
  });

  // Comparison table fade in
  const table = document.querySelector('.compare-table-wrap');
  if (table) {
    gsap.fromTo(table,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: table, start: 'top 85%', once: true }
      }
    );
  }

  // Hero dot grid subtle parallax
  gsap.to('.ph-grid', {
    y: 60,
    ease: 'none',
    scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: 1 }
  });
}

// ──────────────────────────────────────────────────────
// FALLBACK
// ──────────────────────────────────────────────────────
function initFallbackReveal() {
  const els = document.querySelectorAll('.reveal-block, .reveal-item, .reveal-card');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07 });
  els.forEach(el => observer.observe(el));
}