/* NAVBAR JS — extracted from index.js
   Handles header scroll state and mobile hamburger menu
*/
document.addEventListener('DOMContentLoaded', () => {

  // NAV SCROLL BEHAVIOUR
  const nav = document.getElementById('nav');
  if (nav) {
    const handleNavScroll = () => {
      if (window.scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();
  }

  // MOBILE HAMBURGER MENU
  function initMobileMenu(){

    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobile-menu");

    if(!hamburger || !mobileMenu) return;

    let savedScrollY = 0;

    const openMenu = () => {
      savedScrollY = window.scrollY || 0;
      hamburger.setAttribute("aria-expanded","true");
      mobileMenu.hidden = false;
      document.documentElement.classList.add('no-scroll');
      document.documentElement.classList.add('menu-open');
    };

    const closeMenu = () => {
      hamburger.setAttribute("aria-expanded","false");
      mobileMenu.hidden = true;
      document.documentElement.classList.remove('no-scroll');
      window.scrollTo(0, savedScrollY);
      document.documentElement.classList.remove('menu-open');
    };

    hamburger.addEventListener("click", () => {
      const expanded = hamburger.getAttribute("aria-expanded") === "true";
      expanded ? closeMenu() : openMenu();
    });

    mobileMenu.querySelectorAll("a").forEach(link=>{
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown",(e)=>{
      if(e.key === "Escape") closeMenu();
    });

  }

  initMobileMenu();

});
