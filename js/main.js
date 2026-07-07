(function () {
  'use strict';

  /* Mobile menu drawer */
  const burger = document.querySelector('.header__burger');
  const menu = document.querySelector('.mobile-menu');

  if (burger && menu) {
    document.documentElement.appendChild(menu);

    const overlay = menu.querySelector('.mobile-menu__overlay');
    const closeBtn = menu.querySelector('.mobile-menu__close');
    const panel = menu.querySelector('.mobile-menu__panel');
    const header = document.querySelector('.header');
    let scrollPosition = 0;
    let isClosing = false;
    const MENU_TRANSITION_MS = 350;

    function getScrollbarWidth() {
      return window.innerWidth - document.documentElement.clientWidth;
    }

    function lockScroll() {
      scrollPosition = window.scrollY;
      const scrollbarWidth = getScrollbarWidth();
      const body = document.body;

      body.style.top = '-' + scrollPosition + 'px';
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';

      if (scrollbarWidth > 0) {
        body.style.paddingRight = scrollbarWidth + 'px';
        if (header) header.style.paddingRight = scrollbarWidth + 'px';
      }

      body.style.position = 'fixed';
    }

    function unlockScroll() {
      const body = document.body;

      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.paddingRight = '';

      if (header) header.style.paddingRight = '';

      window.scrollTo(0, scrollPosition);
    }

    function openMenu() {
      if (isClosing) return;

      lockScroll();

      menu.classList.remove('mobile-menu--closing');
      menu.classList.add('mobile-menu--open');
      menu.setAttribute('aria-hidden', 'false');
      burger.setAttribute('aria-expanded', 'true');
      if (overlay) overlay.tabIndex = 0;
    }

    function finishClose() {
      menu.classList.remove('mobile-menu--closing');
      menu.setAttribute('aria-hidden', 'true');
      isClosing = false;
      unlockScroll();
    }

    function closeMenu() {
      if (!menu.classList.contains('mobile-menu--open') || isClosing) return;

      isClosing = true;
      menu.classList.remove('mobile-menu--open');
      menu.classList.add('mobile-menu--closing');
      burger.setAttribute('aria-expanded', 'false');
      if (overlay) overlay.tabIndex = -1;

      let closed = false;

      function onPanelTransitionEnd(e) {
        if (e.target !== panel || e.propertyName !== 'transform') return;
        panel.removeEventListener('transitionend', onPanelTransitionEnd);
        if (closed) return;
        closed = true;
        finishClose();
      }

      panel.addEventListener('transitionend', onPanelTransitionEnd);

      window.setTimeout(function () {
        if (closed) return;
        closed = true;
        panel.removeEventListener('transitionend', onPanelTransitionEnd);
        finishClose();
      }, MENU_TRANSITION_MS + 50);
    }

    burger.addEventListener('click', function () {
      if (menu.classList.contains('mobile-menu--open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    menu.querySelectorAll('.mobile-menu__link, .mobile-menu__cta').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('mobile-menu--open')) {
        closeMenu();
      }
    });

    if (panel) {
      panel.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
  }

  /* Catalog slider */
  function initCatalogSlider() {
    const slider = document.querySelector('[data-slider="catalog"]');
    if (!slider) return;

    const track = slider.querySelector('.catalog__track');
    const dotsContainer = slider.querySelector('.catalog__dots');
    const cards = track.querySelectorAll('.catalog__card');

    if (!track || cards.length === 0) return;

    const DESKTOP_BREAKPOINT = 1024;
    const SWIPE_THRESHOLD = 40;
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouching = false;

    function isSliderMode() {
      return window.innerWidth < DESKTOP_BREAKPOINT;
    }

    function getCardScrollLeft(card) {
      return card.offsetLeft - track.offsetLeft;
    }

    function getCardsPerView() {
      const card = cards[0];
      if (!card) return 1;

      const gap = parseFloat(getComputedStyle(track).gap) || 16;
      const cardWidth = card.getBoundingClientRect().width;

      if (!cardWidth) return 1;

      return Math.max(1, Math.floor((track.clientWidth + gap) / (cardWidth + gap)));
    }

    function getPageCount() {
      return Math.max(1, Math.ceil(cards.length / getCardsPerView()));
    }

    function getPageStartIndex(pageIndex) {
      const perView = getCardsPerView();
      const start = pageIndex * perView;

      if (perView > 1) {
        return Math.min(start, Math.max(0, cards.length - perView));
      }

      return Math.min(start, cards.length - 1);
    }

    function getActiveIndex() {
      const scrollLeft = track.scrollLeft;
      let activeIndex = 0;
      let minDiff = Infinity;

      cards.forEach(function (card, index) {
        const diff = Math.abs(getCardScrollLeft(card) - scrollLeft);
        if (diff < minDiff) {
          minDiff = diff;
          activeIndex = index;
        }
      });

      return activeIndex;
    }

    function getActivePageIndex() {
      const perView = getCardsPerView();
      const cardIndex = getActiveIndex();
      return Math.min(Math.floor(cardIndex / perView), getPageCount() - 1);
    }

    function scrollToCard(index, behavior) {
      const card = cards[index];
      if (!card) return;

      track.scrollTo({
        left: getCardScrollLeft(card),
        behavior: behavior || 'smooth'
      });
    }

    function scrollToPage(pageIndex, behavior) {
      scrollToCard(getPageStartIndex(pageIndex), behavior);
    }

    function rebuildDots() {
      if (!dotsContainer) return;

      dotsContainer.innerHTML = '';

      if (!isSliderMode()) return;

      const pageCount = getPageCount();

      for (let index = 0; index < pageCount; index += 1) {
        const dot = document.createElement('button');
        dot.className = 'slider__dot' + (index === 0 ? ' slider__dot--active' : '');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Слайд ' + (index + 1));
        dot.addEventListener('click', function () {
          scrollToPage(index);
        });
        dotsContainer.appendChild(dot);
      }
    }

    function updateDots() {
      if (!dotsContainer || !isSliderMode()) return;

      const activePage = getActivePageIndex();
      const dots = dotsContainer.querySelectorAll('.slider__dot');

      dots.forEach(function (dot, index) {
        dot.classList.toggle('slider__dot--active', index === activePage);
      });
    }

    rebuildDots();

    track.addEventListener('scroll', function () {
      if (!isSliderMode()) return;
      updateDots();
    }, { passive: true });

    track.addEventListener('touchstart', function (e) {
      if (!isSliderMode()) return;

      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isTouching = true;
    }, { passive: true });

    track.addEventListener('touchmove', function (e) {
      if (!isTouching || !isSliderMode()) return;

      const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

      if (deltaX > deltaY && deltaX > 10) {
        track.style.scrollSnapType = 'none';
      }
    }, { passive: true });

    track.addEventListener('touchend', function (e) {
      if (!isTouching || !isSliderMode()) return;

      isTouching = false;
      track.style.scrollSnapType = '';

      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const activePage = getActivePageIndex();
      const lastPage = getPageCount() - 1;

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        scrollToPage(activePage);
        return;
      }

      if (deltaX <= -SWIPE_THRESHOLD && activePage < lastPage) {
        scrollToPage(activePage + 1);
        return;
      }

      if (deltaX >= SWIPE_THRESHOLD && activePage > 0) {
        scrollToPage(activePage - 1);
        return;
      }

      scrollToPage(activePage);
    }, { passive: true });

    track.addEventListener('touchcancel', function () {
      isTouching = false;
      track.style.scrollSnapType = '';

      if (isSliderMode()) {
        scrollToPage(getActivePageIndex());
      }
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (!isSliderMode()) {
        if (dotsContainer) dotsContainer.innerHTML = '';
        return;
      }

      rebuildDots();
      scrollToPage(getActivePageIndex(), 'auto');
      updateDots();
    });
  }

  /* Process slider */
  function initProcessSlider() {
    const slider = document.querySelector('[data-slider="process"]');
    if (!slider) return;

    const track = slider.querySelector('.process__track');
    const prevBtn = slider.querySelector('.process__arrow--prev');
    const nextBtn = slider.querySelector('.process__arrow--next');
    const cards = track ? track.querySelectorAll('.process__card:not(.process__card--clone)') : [];
    let isResetting = false;

    if (!track || cards.length === 0) return;

    const firstClone = cards[0].cloneNode(true);
    firstClone.classList.add('process__card--clone');
    firstClone.setAttribute('aria-hidden', 'true');
    track.appendChild(firstClone);

    const DESKTOP_BREAKPOINT = 1024;
    const AUTOPLAY_DELAY = 4000;
    let autoplayTimer = null;

    function isSliderMode() {
      return window.innerWidth < DESKTOP_BREAKPOINT;
    }

    function getCardScrollLeft(card) {
      return card.offsetLeft - track.offsetLeft;
    }

    function getActiveIndex() {
      if (isResetting) return 0;

      const scrollLeft = track.scrollLeft;
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      const cloneLeft = getCardScrollLeft(firstClone);

      if (scrollLeft >= cloneLeft - 8) {
        return cards.length - 1;
      }

      if (scrollLeft >= maxScroll - 8) {
        return cards.length - 1;
      }

      if (scrollLeft <= 8) {
        return 0;
      }

      let activeIndex = 0;
      let minDiff = Infinity;

      cards.forEach(function (card, index) {
        const diff = Math.abs(getCardScrollLeft(card) - scrollLeft);
        if (diff < minDiff) {
          minDiff = diff;
          activeIndex = index;
        }
      });

      return activeIndex;
    }

    function resetToStart() {
      isResetting = true;
      track.style.scrollSnapType = 'none';
      track.scrollTo({ left: 0, behavior: 'auto' });
      window.setTimeout(function () {
        track.style.scrollSnapType = '';
        isResetting = false;
      }, 50);
    }

    function restoreScrollSnap() {
      track.style.scrollSnapType = '';
    }

    function scrollToIndex(index, behavior) {
      const card = cards[index];
      if (!card || isResetting) return;

      const currentIndex = getActiveIndex();
      const targetLeft = getCardScrollLeft(card);
      const scrollBehavior = behavior || 'smooth';
      const isWrapToStart = index === 0 && currentIndex === cards.length - 1;
      const isWrapToEnd = index === cards.length - 1 && currentIndex === 0;

      if (isWrapToStart) {
        track.style.scrollSnapType = 'none';
        track.scrollTo({
          left: getCardScrollLeft(firstClone),
          behavior: scrollBehavior
        });

        function onWrapEnd() {
          resetToStart();
          track.removeEventListener('scrollend', onWrapEnd);
        }

        track.addEventListener('scrollend', onWrapEnd, { once: true });
        window.setTimeout(resetToStart, scrollBehavior === 'smooth' ? 700 : 50);
        return;
      }

      if (isWrapToEnd) {
        track.style.scrollSnapType = 'none';
        track.scrollTo({
          left: targetLeft,
          behavior: scrollBehavior
        });
        track.addEventListener('scrollend', restoreScrollSnap, { once: true });
        window.setTimeout(restoreScrollSnap, scrollBehavior === 'smooth' ? 700 : 50);
        return;
      }

      track.scrollTo({
        left: targetLeft,
        behavior: scrollBehavior
      });
    }

    function goToNextSlide() {
      if (isResetting) return;

      const activeIndex = getActiveIndex();
      const nextIndex = activeIndex >= cards.length - 1 ? 0 : activeIndex + 1;
      scrollToIndex(nextIndex, 'smooth');
    }

    function goToPrevSlide() {
      if (isResetting) return;

      const activeIndex = getActiveIndex();
      const prevIndex = activeIndex <= 0 ? cards.length - 1 : activeIndex - 1;
      scrollToIndex(prevIndex, 'smooth');
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();
      if (!isSliderMode()) return;

      autoplayTimer = window.setInterval(goToNextSlide, AUTOPLAY_DELAY);
    }

    function restartAutoplay() {
      stopAutoplay();
      if (!isSliderMode()) return;
      window.setTimeout(startAutoplay, AUTOPLAY_DELAY);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goToPrevSlide();
        restartAutoplay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        goToNextSlide();
        restartAutoplay();
      });
    }

    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);

    track.addEventListener('touchstart', stopAutoplay, { passive: true });
    track.addEventListener('touchend', restartAutoplay, { passive: true });
    track.addEventListener('touchcancel', restartAutoplay, { passive: true });

    window.addEventListener('resize', function () {
      if (isSliderMode()) {
        resetToStart();
        startAutoplay();
      } else {
        stopAutoplay();
        resetToStart();
      }
    });

    startAutoplay();
  }

  /* Phone mask */
  function initPhoneMask() {
    const input = document.getElementById('phone');
    if (!input) return;

    input.addEventListener('input', function () {
      let digits = input.value.replace(/\D/g, '');

      if (digits.startsWith('8')) {
        digits = '7' + digits.slice(1);
      }
      if (!digits.startsWith('7')) {
        digits = '7' + digits;
      }

      digits = digits.slice(0, 11);

      let formatted = '+7';
      if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
      if (digits.length >= 4) formatted += ') ' + digits.slice(4, 7);
      if (digits.length >= 7) formatted += '-' + digits.slice(7, 9);
      if (digits.length >= 9) formatted += '-' + digits.slice(9, 11);

      input.value = formatted;
    });

    input.addEventListener('focus', function () {
      if (!input.value) input.value = '+7 (';
    });

    input.addEventListener('blur', function () {
      if (input.value === '+7 (' || input.value === '+7') {
        input.value = '';
      }
    });
  }

  /* Contact form */
  function initForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const phone = form.querySelector('#phone');
      const agree = form.querySelector('[name="agree"]');
      const digits = phone.value.replace(/\D/g, '');

      if (digits.length < 11) {
        phone.closest('.form__phone').style.borderColor = '#c0392b';
        phone.focus();
        return;
      }

      if (!agree.checked) {
        agree.focus();
        return;
      }

      phone.closest('.form__phone').style.borderColor = '';

      const submitBtn = form.querySelector('.form__submit');
      submitBtn.textContent = 'Отправлено!';
      form.classList.add('form--success');

      setTimeout(function () {
        form.reset();
        submitBtn.textContent = 'Отправить';
        form.classList.remove('form--success');
      }, 3000);
    });
  }

  /* Car card buttons */
  document.querySelectorAll('.car-card__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const title = btn.closest('.car-card').querySelector('.car-card__title').textContent;
      const contact = document.getElementById('contact');
      const phone = document.getElementById('phone');

      if (contact) {
        contact.scrollIntoView({ behavior: 'smooth' });
      }
      if (phone) {
        setTimeout(function () {
          phone.focus();
          phone.placeholder = 'Интересует: ' + title;
        }, 600);
      }
    });
  });

  /* Header background on scroll */
  function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    window.addEventListener('scroll', function () {
      header.style.backgroundColor = window.scrollY > 60
        ? 'rgba(0, 0, 0, 0.9)'
        : 'transparent';
      header.style.backdropFilter = window.scrollY > 60 ? 'blur(12px)' : 'none';
    }, { passive: true });
  }

  initCatalogSlider();
  initProcessSlider();
  initPhoneMask();
  initForm();
  initHeaderScroll();
})();
