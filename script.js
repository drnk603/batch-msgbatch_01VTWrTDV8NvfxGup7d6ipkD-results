(function() {
  'use strict';

  const w = window;
  const d = document;

  if (!w.__app) {
    w.__app = {};
  }

  const app = w.__app;

  if (app._scriptInit) {
    return;
  }
  app._scriptInit = true;

  function debounce(fn, ms) {
    let timer;
    return function() {
      const args = arguments;
      const ctx = this;
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(ctx, args), ms);
    };
  }

  function throttle(fn, ms) {
    let last = 0;
    return function() {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn.apply(this, arguments);
      }
    };
  }

  function passiveSupported() {
    let support = false;
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: function() {
          support = true;
        }
      });
      w.addEventListener('test', null, opts);
      w.removeEventListener('test', null, opts);
    } catch (e) {}
    return support;
  }

  const passiveOpt = passiveSupported() ? { passive: true } : false;

  function prefersReducedMotion() {
    return w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initBurger() {
    if (app._burgerInit) {
      return;
    }
    app._burgerInit = true;

    const nav = d.querySelector('.c-nav#main-nav');
    const toggle = d.querySelector('.c-nav__toggle');
    const navList = d.querySelector('.c-nav__list');

    if (!nav || !toggle || !navList) {
      return;
    }

    const body = d.body;
    let isOpen = false;

    function openMenu() {
      isOpen = true;
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('u-no-scroll');
      navList.style.height = 'calc(100vh - var(--header-h-mobile))';
    }

    function closeMenu() {
      isOpen = false;
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('u-no-scroll');
      navList.style.height = '';
    }

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    d.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
        toggle.focus();
      }
    });

    d.addEventListener('click', (e) => {
      if (isOpen && !nav.contains(e.target)) {
        closeMenu();
      }
    });

    const navLinks = d.querySelectorAll('.c-nav__link');
    for (let i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', () => {
        if (isOpen) {
          closeMenu();
        }
      });
    }

    function onResize() {
      if (w.innerWidth >= 1024 && isOpen) {
        closeMenu();
      }
    }

    const resizeHandler = debounce(onResize, 150);
    w.addEventListener('resize', resizeHandler);
  }

  function initAnchors() {
    if (app._anchorsInit) {
      return;
    }
    app._anchorsInit = true;

    const path = w.location.pathname;
    const isHome = path === '/' || path === '/index.html' || path === '';

    if (!isHome) {
      const allLinks = d.querySelectorAll('a[href^="#"]');
      for (let i = 0; i < allLinks.length; i++) {
        const link = allLinks[i];
        const href = link.getAttribute('href');
        if (href && href !== '#' && href !== '#!' && href.indexOf('#') === 0) {
          const sectionId = href.substring(1);
          const sectionExists = d.getElementById(sectionId);
          if (!sectionExists) {
            link.setAttribute('href', '/#' + sectionId);
          }
        }
      }
    }

    function getHeaderHeight() {
      const header = d.querySelector('.l-header');
      return header ? header.offsetHeight : 80;
    }

    function smoothScroll(e) {
      const href = this.getAttribute('href');
      if (!href || href === '#' || href === '#!') {
        e.preventDefault();
        return;
      }
      if (href.indexOf('#') === 0) {
        e.preventDefault();
        const targetId = href.substring(1);
        const target = d.getElementById(targetId);
        if (target) {
          const headerH = getHeaderHeight();
          const top = target.getBoundingClientRect().top + w.pageYOffset - headerH;
          w.scrollTo({
            top: top,
            behavior: 'smooth'
          });
        }
      }
    }

    const anchorLinks = d.querySelectorAll('a[href^="#"]');
    for (let j = 0; j < anchorLinks.length; j++) {
      anchorLinks[j].addEventListener('click', smoothScroll);
    }
  }

  function initActiveMenu() {
    if (app._activeMenuInit) {
      return;
    }
    app._activeMenuInit = true;

    const path = w.location.pathname;
    const navLinks = d.querySelectorAll('.c-nav__link');

    for (let i = 0; i < navLinks.length; i++) {
      navLinks[i].removeAttribute('aria-current');
      navLinks[i].classList.remove('active');
    }

    for (let k = 0; k < navLinks.length; k++) {
      const link = navLinks[k];
      const href = link.getAttribute('href');
      if (!href) {
        continue;
      }
      const linkPath = href.split('#')[0];
      if (
        linkPath === path ||
        (path === '/' && (linkPath === '/' || linkPath === '/index.html')) ||
        (path === '/index.html' && linkPath === '/')
      ) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
        const parentItem = link.closest('.c-nav__item');
        if (parentItem) {
          parentItem.classList.add('is-active');
        }
        break;
      }
    }
  }

  function initImages() {
    if (app._imagesInit) {
      return;
    }
    app._imagesInit = true;

    const imgs = d.querySelectorAll('img');
    const logoImg = d.querySelector('.c-logo__img');

    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];
      if (!img.hasAttribute('loading')) {
        const isCritical = img.hasAttribute('data-critical') || img === logoImg;
        if (!isCritical) {
          img.setAttribute('loading', 'lazy');
        }
      }
      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      img.style.opacity = '0';
      img.style.transform = 'translateY(20px)';
      img.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';

      (function(image) {
        function fadeIn() {
          image.style.opacity = '1';
          image.style.transform = 'translateY(0)';
        }
        if (image.complete) {
          setTimeout(fadeIn, 50);
        } else {
          image.addEventListener('load', fadeIn);
        }

        image.addEventListener(
          'error',
          function() {
            const svg =
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="#e0e0e0" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="14" font-family="sans-serif">Image not found</text></svg>';
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            image.src = url;
            image.style.objectFit = 'contain';
            const isLogo = image.closest('.c-logo') !== null;
            if (isLogo) {
              image.style.maxHeight = '40px';
            }
          },
          { once: true }
        );
      })(img);
    }
  }

  function initScrollAnimations() {
    if (app._scrollAnimInit || prefersReducedMotion()) {
      return;
    }
    app._scrollAnimInit = true;

    const animatedElements = d.querySelectorAll(
      '.c-card, .c-stat-card, .c-case-study, .c-accordion__item, .c-button, .c-form, .c-hero-content, .l-section__title, .l-section__subtitle'
    );

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = `opacity 0.6s ease-out ${index * 0.05}s, transform 0.6s ease-out ${index * 0.05}s`;
      observer.observe(el);
    });
  }

  function initButtonEffects() {
    if (app._buttonEffectsInit) {
      return;
    }
    app._buttonEffectsInit = true;

    const buttons = d.querySelectorAll('.c-button, .c-nav__link, .c-logo, .c-accordion__button');

    buttons.forEach((btn) => {
      btn.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s ease-in-out';
      });

      btn.addEventListener('click', function(e) {
        const ripple = d.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.5)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple-effect 0.6s ease-out';
        ripple.style.pointerEvents = 'none';

        const existingRipple = this.querySelector('span[style*="ripple"]');
        if (existingRipple) {
          existingRipple.remove();
        }

        if (getComputedStyle(this).position === 'static') {
          this.style.position = 'relative';
        }
        this.style.overflow = 'hidden';

        this.appendChild(ripple);

        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });

    if (!d.getElementById('ripple-keyframes')) {
      const style = d.createElement('style');
      style.id = 'ripple-keyframes';
      style.textContent = `
        @keyframes ripple-effect {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      d.head.appendChild(style);
    }
  }

  function initCardHover() {
    if (app._cardHoverInit) {
      return;
    }
    app._cardHoverInit = true;

    const cards = d.querySelectorAll('.c-card, .c-stat-card, .c-case-study');

    cards.forEach((card) => {
      card.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s ease-in-out';
      });
    });
  }

  function initAccordion() {
    if (app._accordionInit) {
      return;
    }
    app._accordionInit = true;

    const accordionButtons = d.querySelectorAll('.c-accordion__button, .c-accordion__header');

    accordionButtons.forEach((button) => {
      button.addEventListener('click', function(e) {
        e.preventDefault();

        const targetId =
          this.getAttribute('data-bs-target') || this.getAttribute('aria-controls');
        if (!targetId) {
          return;
        }

        const collapseId = targetId.replace('#', '');
        const collapseEl = d.getElementById(collapseId);

        if (!collapseEl) {
          return;
        }

        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        const parent = this.closest('.c-accordion__item');

        if (isExpanded) {
          this.setAttribute('aria-expanded', 'false');
          collapseEl.classList.remove('show');
          if (parent) {
            parent.classList.remove('is-open');
          }
        } else {
          this.setAttribute('aria-expanded', 'true');
          collapseEl.classList.add('show');
          if (parent) {
            parent.classList.add('is-open');
          }
        }
      });
    });
  }

  function initCountUp() {
    if (app._countUpInit || prefersReducedMotion()) {
      return;
    }
    app._countUpInit = true;

    const statNumbers = d.querySelectorAll('.c-stat-card__number, .c-countdown-item__value');

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };

    const countUpObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          const text = entry.target.textContent.trim();
          const numMatch = text.match(/[\d,.]+/);
          if (numMatch) {
            const endValue = parseFloat(numMatch[0].replace(/,/g, ''));
            const suffix = text.replace(numMatch[0], '').trim();
            const prefix = text.substring(0, text.indexOf(numMatch[0]));
            const duration = 2000;
            const startTime = performance.now();

            function animate(currentTime) {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const easeOut = 1 - Math.pow(1 - progress, 3);
              const current = Math.floor(easeOut * endValue);

              entry.target.textContent = prefix + current.toLocaleString() + suffix;

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                entry.target.textContent = prefix + endValue.toLocaleString() + suffix;
              }
            }

            requestAnimationFrame(animate);
          }
          countUpObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    statNumbers.forEach((num) => {
      countUpObserver.observe(num);
    });
  }

  function initScrollSpy() {
    if (app._scrollSpyInit) {
      return;
    }
    app._scrollSpyInit = true;

    const sections = d.querySelectorAll('section[id]');
    if (sections.length === 0) {
      return;
    }

    const navLinks = d.querySelectorAll('.c-nav__link[href^="#"]');

    function getHeaderHeight() {
      const header = d.querySelector('.l-header');
      return header ? header.offsetHeight : 80;
    }

    const observerOptions = {
      root: null,
      rootMargin: `-${getHeaderHeight()}px 0px -66%`,
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
            const parentItem = link.closest('.c-nav__item');
            if (parentItem) {
              parentItem.classList.remove('is-active');
            }
          });

          const activeLink = d.querySelector(`.c-nav__link[href="#${id}"]`);
          if (activeLink) {
            activeLink.classList.add('active');
            activeLink.setAttribute('aria-current', 'page');
            const parentItem = activeLink.closest('.c-nav__item');
            if (parentItem) {
              parentItem.classList.add('is-active');
            }
          }
        }
      });
    }, observerOptions);

    sections.forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  function initScrollToTop() {
    if (app._scrollToTopInit) {
      return;
    }
    app._scrollToTopInit = true;

    let scrollBtn = d.getElementById('scroll-to-top');

    if (!scrollBtn) {
      scrollBtn = d.createElement('button');
      scrollBtn.id = 'scroll-to-top';
      scrollBtn.className = 'c-scroll-to-top';
      scrollBtn.innerHTML = '↑';
      scrollBtn.setAttribute('aria-label', 'Scroll to top');
      scrollBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: var(--color-primary);
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease-in-out;
        z-index: 999;
        box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
      `;
      d.body.appendChild(scrollBtn);
    }

    const toggleVisibility = throttle(() => {
      if (w.pageYOffset > 300) {
        scrollBtn.style.opacity = '1';
        scrollBtn.style.visibility = 'visible';
      } else {
        scrollBtn.style.opacity = '0';
        scrollBtn.style.visibility = 'hidden';
      }
    }, 100);

    w.addEventListener('scroll', toggleVisibility, passiveOpt);

    scrollBtn.addEventListener('click', () => {
      w.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  function initFormValidation() {
    if (app._formsInit) {
      return;
    }
    app._formsInit = true;

    const forms = d.querySelectorAll('.c-form');

    const validators = {
      name: {
        pattern: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
        message: 'Bitte geben Sie einen gültigen Namen ein (2-50 Zeichen, nur Buchstaben)'
      },
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
      },
      phone: {
        pattern: /^[\d\s\+\-\(\)]{10,20}$/,
        message: 'Bitte geben Sie eine gültige Telefonnummer ein (10-20 Zeichen)'
      },
      message: {
        minLength: 10,
        message: 'Die Nachricht muss mindestens 10 Zeichen lang sein'
      },
      amount: {
        min: 5000,
        max: 100000,
        message: 'Der Betrag muss zwischen 5.000 und 100.000 liegen'
      }
    };

    function showError(field, message) {
      const parent = field.closest('.c-form__field') || field.parentElement;
      parent.classList.add('has-error');

      let errorEl = parent.querySelector('.c-form__error');
      if (!errorEl) {
        errorEl = d.createElement('div');
        errorEl.className = 'c-form__error';
        field.parentNode.insertBefore(errorEl, field.nextSibling);
      }
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }

    function clearError(field) {
      const parent = field.closest('.c-form__field') || field.parentElement;
      parent.classList.remove('has-error');
      const errorEl = parent.querySelector('.c-form__error');
      if (errorEl) {
        errorEl.style.display = 'none';
      }
    }

    function validateField(field) {
      clearError(field);

      if (field.hasAttribute('required') && !field.value.trim()) {
        showError(field, 'Dieses Feld ist erforderlich');
        return false;
      }

      const fieldId = field.id || field.name;
      const fieldValue = field.value.trim();

      if (fieldId.includes('name') || fieldId === 'first_name' || fieldId === 'last_name' || fieldId === 'full_name') {
        if (fieldValue && !validators.name.pattern.test(fieldValue)) {
          showError(field, validators.name.message);
          return false;
        }
      }

      if (field.type === 'email' || fieldId === 'email') {
        if (fieldValue && !validators.email.pattern.test(fieldValue)) {
          showError(field, validators.email.message);
          return false;
        }
      }

      if (field.type === 'tel' || fieldId === 'phone') {
        if (fieldValue && !validators.phone.pattern.test(fieldValue)) {
          showError(field, validators.phone.message);
          return false;
        }
      }

      if (field.type === 'number' || fieldId === 'amount') {
        const numValue = parseFloat(fieldValue);
        if (fieldValue && (numValue < validators.amount.min || numValue > validators.amount.max)) {
          showError(field, validators.amount.message);
          return false;
        }
      }

      if ((field.tagName === 'TEXTAREA' || fieldId === 'message') && fieldValue) {
        if (fieldValue.length < validators.message.minLength) {
          showError(field, validators.message.message);
          return false;
        }
      }

      if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
        showError(field, 'Sie müssen dieser Bedingung zustimmen');
        return false;
      }

      return true;
    }

    forms.forEach((form) => {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach((input) => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', debounce(() => {
          if (input.closest('.c-form__field.has-error')) {
            validateField(input);
          }
        }, 300));
      });

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        let isValid = true;
        const formInputs = this.querySelectorAll('input, textarea, select');

        formInputs.forEach((input) => {
          if (!validateField(input)) {
            isValid = false;
          }
        });

        if (!isValid) {
          const firstError = this.querySelector('.has-error input, .has-error textarea, .has-error select');
          if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        const btnText = submitBtn ? submitBtn.innerHTML : '';

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML =
            '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird gesendet...';
        }

        setTimeout(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = btnText;
          }
          w.location.href = 'thank_you.html';
        }, 1000);
      });
    });
  }

  function initHoverEffects() {
    if (app._hoverInit) {
      return;
    }
    app._hoverInit = true;

    const hoverElements = d.querySelectorAll('.c-card, .c-case-study, .c-stat-card');

    hoverElements.forEach((el) => {
      el.addEventListener('mouseenter', function() {
        const img = this.querySelector('.c-card__image');
        if (img) {
          img.style.transition = 'transform 0.4s ease-in-out';
        }
      });
    });
  }

  function initModalPrivacy() {
    if (app._modalInit) {
      return;
    }
    app._modalInit = true;

    const privacyLinks = d.querySelectorAll('a[href*="privacy"], .c-form__link');

    privacyLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && (href.includes('privacy') || href.includes('datenschutz'))) {
        link.addEventListener('click', function(e) {
          if (href.startsWith('#') || !href.includes('.html')) {
            return;
          }
        });
      }
    });
  }

  app.init = function() {
    if (app._mainInit) {
      return;
    }
    app._mainInit = true;

    initBurger();
    initAnchors();
    initActiveMenu();
    initImages();
    initScrollAnimations();
    initButtonEffects();
    initCardHover();
    initAccordion();
    initCountUp();
    initScrollSpy();
    initScrollToTop();
    initFormValidation();
    initHoverEffects();
    initModalPrivacy();
  };

  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }
})();