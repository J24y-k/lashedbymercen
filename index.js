/**
 * LASHED BY MERCEN — index.js
 * GSAP + vanilla JS for homepage interactions
 */

// ─── Utility: wait for DOM ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ──────────────────────────────────────────────────────────────────
  // 1. REGISTER GSAP SCROLL TRIGGER
  // ──────────────────────────────────────────────────────────────────
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    initGSAP();
  } else {
    // Fallback: plain IntersectionObserver if GSAP not loaded yet
    window.addEventListener('load', () => {
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        initGSAP();
      } else {
        initFallbackReveal();
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // 2. NAV SCROLL BEHAVIOUR
  // ──────────────────────────────────────────────────────────────────
  const nav = document.getElementById('nav');

  const handleNavScroll = () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // ──────────────────────────────────────────────────────────────────
  // 3. MOBILE HAMBURGER MENU
  // ──────────────────────────────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    navLinks.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen.toString());
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on link click
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  // ──────────────────────────────────────────────────────────────────
  // 4. BACK TO TOP BUTTON
  // ──────────────────────────────────────────────────────────────────
  const backTop = document.getElementById('back-top');

  window.addEventListener('scroll', () => {
    backTop.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ──────────────────────────────────────────────────────────────────
  // 5. TESTIMONIAL CAROUSEL
  // ──────────────────────────────────────────────────────────────────
  const cards    = document.querySelectorAll('.testi-card');
  const dots     = document.querySelectorAll('.testi-dot');
  let currentIdx = 0;
  let autoInterval;

  function showTestimonial(idx) {
    cards.forEach((c, i) => {
      c.classList.toggle('active', i === idx);
    });
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === idx);
      d.setAttribute('aria-selected', (i === idx).toString());
    });
    currentIdx = idx;
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      clearInterval(autoInterval);
      showTestimonial(+dot.dataset.index);
      startAutoPlay();
    });
  });

  function startAutoPlay() {
    autoInterval = setInterval(() => {
      const next = (currentIdx + 1) % cards.length;
      showTestimonial(next);
    }, 5000);
  }
  startAutoPlay();

  // ──────────────────────────────────────────────────────────────────
  // 6. TESTIMONIAL SUBMISSION (localStorage)
  // ──────────────────────────────────────────────────────────────────
  const testiForm    = document.getElementById('testi-form');
  const testiSuccess = document.getElementById('testi-success');
  const testiTrack   = document.getElementById('testi-track');

  // Load saved testimonials on page load
  loadSavedTestimonials();

  testiForm.addEventListener('submit', e => {
    e.preventDefault();

    const nameVal    = document.getElementById('testi-name-input').value.trim();
    const serviceVal = document.getElementById('testi-service-input').value.trim();
    const msgVal     = document.getElementById('testi-message-input').value.trim();

    if (!nameVal || !msgVal) {
      alert('Please fill in your name and message.');
      return;
    }

    const newTesti = { name: nameVal, service: serviceVal || 'Lash Service', message: msgVal };

    // Save to localStorage
    const saved = getSavedTestimonials();
    saved.push(newTesti);
    try {
      localStorage.setItem('lbm_testimonials', JSON.stringify(saved));
    } catch (err) {
      console.warn('localStorage not available:', err);
    }

    // Append new card to DOM
    appendTestimonialCard(newTesti, saved.length - 1 + cards.length);

    // Reset form
    testiForm.reset();

    // Show success message
    testiSuccess.classList.remove('hidden');
    setTimeout(() => testiSuccess.classList.add('hidden'), 5000);
  });

  function getSavedTestimonials() {
    try {
      return JSON.parse(localStorage.getItem('lbm_testimonials') || '[]');
    } catch { return []; }
  }

  function loadSavedTestimonials() {
    const saved = getSavedTestimonials();
    saved.forEach((t, i) => appendTestimonialCard(t, cards.length + i));
    updateDots();
  }

  function appendTestimonialCard(t, totalIndex) {
    const card = document.createElement('blockquote');
    card.className = 'testi-card';
    card.setAttribute('aria-label', `Testimonial from ${t.name}`);
    card.innerHTML = `
      <div class="testi-stars" aria-label="5 stars">★★★★★</div>
      <p class="testi-text">"${escapeHtml(t.message)}"</p>
      <footer class="testi-author">
        <div class="testi-avatar" aria-hidden="true">${t.name.charAt(0).toUpperCase()}</div>
        <div>
          <cite class="testi-name">${escapeHtml(t.name)}</cite>
          <span class="testi-service">${escapeHtml(t.service)}</span>
        </div>
      </footer>
    `;
    testiTrack.appendChild(card);

    // Add a dot
    const dot = document.createElement('button');
    dot.className = 'testi-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-selected', 'false');
    dot.setAttribute('aria-label', `Testimonial ${totalIndex + 1}`);
    dot.dataset.index = totalIndex;
    document.querySelector('.testi-controls').appendChild(dot);

    dot.addEventListener('click', () => {
      clearInterval(autoInterval);
      showTestimonial(totalIndex);
      startAutoPlay();
    });
  }

  function updateDots() {
    // Reassign indices to all dots after loading saved ones
    document.querySelectorAll('.testi-dot').forEach((dot, i) => {
      dot.dataset.index = i;
      dot.setAttribute('aria-label', `Testimonial ${i + 1}`);
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ──────────────────────────────────────────────────────────────────
  // 7. CURRENT YEAR IN FOOTER
  // ──────────────────────────────────────────────────────────────────
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});

// ─────────────────────────────────────────────────────────────────────
// GSAP ANIMATIONS
// ─────────────────────────────────────────────────────────────────────
function initGSAP() {

  // Staggered reveal for service cards
  gsap.utils.toArray('.reveal-card').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: .8,
        ease: 'power3.out',
        delay: i * 0.1,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      }
    );
  });

  // Reveal blocks
  gsap.utils.toArray('.reveal-block').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 45 },
      {
        opacity: 1,
        y: 0,
        duration: .9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true
        }
      }
    );
  });

  // Section titles split reveal
  gsap.utils.toArray('.section-title').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      }
    );
  });

  // Booking banner parallax
  gsap.to('.booking-banner::before', {
    y: -60,
    ease: 'none',
    scrollTrigger: {
      trigger: '.booking-banner',
      scrub: 1
    }
  });

  // Hero circle subtle parallax
  gsap.to('.hero-circle.c1', {
    y: 80,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    }
  });

  // Intro image reveal
  gsap.fromTo('.intro-img-wrap',
    { opacity: 0, x: -60 },
    {
      opacity: 1,
      x: 0,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.intro',
        start: 'top 80%',
        once: true
      }
    }
  );

  // Policies card decoration spin
  gsap.to('.policy-card-deco', {
    rotation: 360,
    duration: 60,
    ease: 'none',
    repeat: -1
  });
}

// ─────────────────────────────────────────────────────────────────────
// FALLBACK REVEAL (no GSAP)
// ─────────────────────────────────────────────────────────────────────
function initFallbackReveal() {
  const revealEls = document.querySelectorAll('.reveal-block, .reveal-card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px 0px 0px' });

  revealEls.forEach(el => observer.observe(el));
}