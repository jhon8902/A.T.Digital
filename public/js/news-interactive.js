(function initNewsInteractive() {
  if (window.__atdNewsInteractiveInit) return;
  window.__atdNewsInteractiveInit = true;

  const SCOPE_FILTERS = new Set(["nacional", "internacional"]);
  const carouselControllers = new Map();

  function initCardCarouselRoot(root) {
    const track = root.querySelector(".news-carousel");
    const prevBtn = root.querySelector(".news-carousel-btn--prev");
    const nextBtn = root.querySelector(".news-carousel-btn--next");
    if (!track) return null;

    function visibleCards() {
      return Array.from(
        track.querySelectorAll(".news-carousel-card:not(.is-filtered-out)"),
      );
    }

    function scrollCarousel(direction) {
      const card = visibleCards()[0];
      const step = card ? card.getBoundingClientRect().width + 20 : 320;
      track.scrollBy({ left: direction * step, behavior: "smooth" });
    }

    function updateCarouselButtons() {
      if (!prevBtn || !nextBtn) return;
      const maxScroll = track.scrollWidth - track.clientWidth - 2;
      prevBtn.disabled = track.scrollLeft <= 2;
      nextBtn.disabled = track.scrollLeft >= maxScroll;
    }

    prevBtn?.addEventListener("click", () => scrollCarousel(-1));
    nextBtn?.addEventListener("click", () => scrollCarousel(1));
    track.addEventListener("scroll", updateCarouselButtons, { passive: true });
    window.addEventListener("resize", updateCarouselButtons);
    updateCarouselButtons();

    return updateCarouselButtons;
  }

  document.querySelectorAll("[data-carousel-root]").forEach((root) => {
    const update = initCardCarouselRoot(root);
    if (update) carouselControllers.set(root, update);
  });

  const section = document.querySelector(".section-info--interactive");
  if (!section) return;

  const showcase = section.querySelector(".news-showcase");
  const filterButtons = section.querySelectorAll(".news-filter-btn");
  const heroCarousel = section.querySelector("[data-hero-carousel-root]");
  const scopeCarouselWrap = section.querySelector("[data-scope-carousel-root]");
  const heroTrack = heroCarousel?.querySelector(".news-hero-carousel-track");
  const heroSlides = section.querySelectorAll(".news-hero-carousel-slide");
  const scopeCarouselCards = scopeCarouselWrap
    ? scopeCarouselWrap.querySelectorAll(".news-carousel-card")
    : [];
  const heroPrevBtn = heroCarousel?.querySelector(".news-hero-carousel-btn--prev");
  const heroNextBtn = heroCarousel?.querySelector(".news-hero-carousel-btn--next");
  const heroCounter = heroCarousel?.querySelector(".news-hero-carousel-counter");
  const heroDots = heroCarousel?.querySelector(".news-hero-carousel-dots");
  const scopeCarouselHeading = scopeCarouselWrap?.querySelector(
    ".news-carousel-heading",
  );
  const emptyState = section.querySelector(".news-filter-empty");
  const heroSlideLimit = Number(section.dataset.heroSlideLimit || 8);
  let heroFadeIndex = 0;

  const HERO_TINT_DEFAULT = {
    start: "#f0f4f1",
    mid: "#e8ece9",
    end: "#f4f7f5",
  };
  const heroTintCache = new Map();
  const heroTintPending = new Map();

  function mixTowardWhite(r, g, b, amount) {
    return [
      Math.round(r + (255 - r) * amount),
      Math.round(g + (255 - g) * amount),
      Math.round(b + (255 - b) * amount),
    ];
  }

  function rgbToCss([r, g, b]) {
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }

  function biasGreenTint(r, g, b) {
    return [
      Math.min(255, r * 0.92 + 6),
      Math.min(255, g * 0.97 + 16),
      Math.min(255, b * 0.9 + 4),
    ];
  }

  function buildHeroTintFromRgb(r, g, b) {
    const [tr, tg, tb] = biasGreenTint(r, g, b);
    return {
      start: rgbToCss(mixTowardWhite(tr, tg, tb, 0.74)),
      mid: rgbToCss(mixTowardWhite(tr, tg, tb, 0.66)),
      end: rgbToCss(mixTowardWhite(tr, tg, tb, 0.78)),
    };
  }

  function extractDominantColor(img) {
    const sample = 36;
    const canvas = document.createElement("canvas");
    canvas.width = sample;
    canvas.height = sample;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return null;

    const sx = w * 0.2;
    const sy = h * 0.16;
    const sw = w * 0.6;
    const sh = h * 0.68;

    try {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sample, sample);
      const data = ctx.getImageData(0, 0, sample, sample).data;
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let weightSum = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 128) continue;

        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        if (luminance < 28 || luminance > 228) continue;

        const spread = Math.max(r, g, b) - Math.min(r, g, b);
        if (spread < 10) continue;

        const chromaWeight = spread / 255;
        const midToneWeight = 1 - Math.abs(luminance - 128) / 128;
        const weight = chromaWeight * chromaWeight * midToneWeight + 0.1;

        rSum += r * weight;
        gSum += g * weight;
        bSum += b * weight;
        weightSum += weight;
      }

      if (weightSum < 4) return null;

      return {
        r: rSum / weightSum,
        g: gSum / weightSum,
        b: bSum / weightSum,
      };
    } catch {
      return null;
    }
  }

  function applyHeroBodyTint(body, tint) {
    if (!body) return;
    const palette = tint || HERO_TINT_DEFAULT;
    body.style.setProperty("--hero-tint-start", palette.start);
    body.style.setProperty("--hero-tint-mid", palette.mid);
    body.style.setProperty("--hero-tint-end", palette.end);
  }

  function getSlideBody(slide) {
    return slide?.querySelector(".news-hero__body") ?? null;
  }

  function getSlideImage(slide) {
    return slide?.querySelector(".news-hero__media img") ?? null;
  }

  function getImageSrc(img) {
    return img.currentSrc || img.src || "";
  }

  function loadImageProbe(src) {
    return new Promise((resolve, reject) => {
      const probe = new Image();
      probe.crossOrigin = "anonymous";
      probe.decoding = "async";
      probe.onload = () => resolve(probe);
      probe.onerror = () => reject(new Error("Image probe failed"));
      probe.src = src;
    });
  }

  function resolveHeroTintForImage(img) {
    const src = getImageSrc(img);
    if (!src) return Promise.resolve(HERO_TINT_DEFAULT);
    if (heroTintCache.has(src)) {
      return Promise.resolve(heroTintCache.get(src));
    }
    if (heroTintPending.has(src)) {
      return heroTintPending.get(src);
    }

    const promise = loadImageProbe(src)
      .then((probe) => {
        const rgb = extractDominantColor(probe);
        const tint = rgb
          ? buildHeroTintFromRgb(rgb.r, rgb.g, rgb.b)
          : HERO_TINT_DEFAULT;
        heroTintCache.set(src, tint);
        heroTintPending.delete(src);
        return tint;
      })
      .catch(() => {
        heroTintCache.set(src, HERO_TINT_DEFAULT);
        heroTintPending.delete(src);
        return HERO_TINT_DEFAULT;
      });

    heroTintPending.set(src, promise);
    return promise;
  }

  function applyTintToSlide(slide) {
    const img = getSlideImage(slide);
    const body = getSlideBody(slide);
    if (!img || !body) return;

    resolveHeroTintForImage(img).then((tint) => {
      applyHeroBodyTint(body, tint);
    });
  }

  function prefetchHeroSlideTints(slides) {
    slides.forEach((slide) => applyTintToSlide(slide));
  }

  function scheduleHeroTintPrefetch(slides) {
    const run = () => prefetchHeroSlideTints(slides);
    if ("requestIdleCallback" in window) {
      requestIdleCallback(run, { timeout: 2500 });
    } else {
      setTimeout(run, 150);
    }
  }

  function primeActiveHeroTint(slides) {
    const activeSlide = slides[heroFadeIndex];
    if (!activeSlide) return;
    applyTintToSlide(activeSlide);
  }

  if (scopeCarouselWrap) {
    const update = initCardCarouselRoot(scopeCarouselWrap);
    if (update) carouselControllers.set(scopeCarouselWrap, update);
  }

  const headingLabels = {
    nacional: "Noticias nacionales",
    internacional: "Noticias internacionales",
  };

  function visibleHeroSlides() {
    return Array.from(heroSlides).filter(
      (slide) => !slide.classList.contains("is-filtered-out"),
    );
  }

  function clearHeroSlideMotion(slide) {
    slide.classList.remove("is-exit-next", "is-exit-prev");
  }

  function syncHeroFadeSlides() {
    if (!heroTrack) return;

    const slides = visibleHeroSlides();
    if (!slides.length) return;

    heroFadeIndex = Math.min(heroFadeIndex, slides.length - 1);
    slides.forEach((slide, index) => {
      clearHeroSlideMotion(slide);
      slide.classList.toggle("is-active", index === heroFadeIndex);
    });
  }

  function setHeroActiveIndex(index) {
    const slides = visibleHeroSlides();
    if (!slides.length) return;

    const nextIndex = Math.max(0, Math.min(slides.length - 1, index));
    if (nextIndex === heroFadeIndex) return;

    const direction = nextIndex > heroFadeIndex ? 1 : -1;
    const previousSlide = slides[heroFadeIndex];
    const nextSlide = slides[nextIndex];

    if (heroCarousel) {
      heroCarousel.dataset.slideDir = direction > 0 ? "next" : "prev";
    }

    if (previousSlide && previousSlide !== nextSlide) {
      const exitClass = direction > 0 ? "is-exit-next" : "is-exit-prev";
      previousSlide.classList.add(exitClass);
      previousSlide.classList.remove("is-active");

      const onExitEnd = () => clearHeroSlideMotion(previousSlide);
      previousSlide.addEventListener("transitionend", onExitEnd, { once: true });
      window.setTimeout(onExitEnd, 720);
    }

    slides.forEach((slide) => {
      if (slide === previousSlide || slide === nextSlide) return;
      clearHeroSlideMotion(slide);
      slide.classList.remove("is-active");
    });

    if (nextSlide) {
      clearHeroSlideMotion(nextSlide);
      nextSlide.classList.add("is-active");
    }

    heroFadeIndex = nextIndex;
    updateHeroCarouselUiFromIndex(heroFadeIndex, slides.length);
  }

  function updateHeroCarouselUiFromIndex(activeIndex, total) {
    if (heroCounter) {
      heroCounter.textContent =
        total > 0
          ? String(activeIndex + 1) + " / " + String(total)
          : "0 / 0";
    }

    if (heroPrevBtn) {
      heroPrevBtn.disabled = total <= 1 || activeIndex <= 0;
    }

    if (heroNextBtn) {
      heroNextBtn.disabled = total <= 1 || activeIndex >= total - 1;
    }

    if (heroCarousel) {
      heroCarousel.classList.toggle("is-empty", total === 0);
    }

    const slides = visibleHeroSlides();
    renderHeroDots(slides, activeIndex);
  }

  function scrollHeroCarousel(direction) {
    const slides = visibleHeroSlides();
    if (!slides.length) return;
    setHeroActiveIndex(heroFadeIndex + direction);
  }

  function renderHeroDots(slides, activeIndex) {
    if (!heroDots) return;

    heroDots.innerHTML = "";

    slides.forEach((slide, index) => {
      const title =
        slide.querySelector(".news-hero__title")?.textContent?.trim() ||
        "Noticia " + String(index + 1);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "news-hero-carousel-dot";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-label", "Ir a: " + title);
      button.setAttribute("aria-selected", index === activeIndex ? "true" : "false");
      if (index === activeIndex) {
        button.classList.add("is-active");
      }
      button.addEventListener("click", () => setHeroActiveIndex(index));
      heroDots.appendChild(button);
    });
  }

  function updateHeroCarouselUi() {
    const slides = visibleHeroSlides();
    const total = slides.length;
    const activeIndex = total ? heroFadeIndex : 0;
    updateHeroCarouselUiFromIndex(activeIndex, total);
  }

  function refreshHeroCarousel(scrollToStart) {
    if (!heroTrack) return;

    if (scrollToStart) {
      heroFadeIndex = 0;
    }

    syncHeroFadeSlides();
    updateHeroCarouselUi();

    const slides = visibleHeroSlides();
    primeActiveHeroTint(slides);
    scheduleHeroTintPrefetch(slides);
  }

  function refreshScopeCarousel(scrollToStart) {
    if (!scopeCarouselWrap) return;

    if (scrollToStart) {
      const track = scopeCarouselWrap.querySelector(".news-carousel");
      if (track) track.scrollLeft = 0;
    }

    const visibleCards = Array.from(scopeCarouselCards).filter(
      (card) => !card.classList.contains("is-filtered-out"),
    );
    scopeCarouselWrap.classList.toggle("is-empty", visibleCards.length === 0);
    scopeCarouselWrap.hidden = visibleCards.length === 0;
    carouselControllers.get(scopeCarouselWrap)?.();
  }

  if (heroCarousel) {
    heroPrevBtn?.addEventListener("click", () => scrollHeroCarousel(-1));
    heroNextBtn?.addEventListener("click", () => scrollHeroCarousel(1));

    let touchStartX = 0;
    let touchStartY = 0;

    heroCarousel.addEventListener(
      "touchstart",
      (event) => {
        const touch = event.changedTouches[0];
        touchStartX = touch.screenX;
        touchStartY = touch.screenY;
      },
      { passive: true },
    );

    heroCarousel.addEventListener(
      "touchend",
      (event) => {
        const touch = event.changedTouches[0];
        const deltaX = touch.screenX - touchStartX;
        const deltaY = touch.screenY - touchStartY;

        if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) {
          return;
        }

        scrollHeroCarousel(deltaX < 0 ? 1 : -1);
      },
      { passive: true },
    );
  }

  function applyFilter(filter) {
    const normalized = (filter || "all").toLowerCase();
    const isAll = normalized === "all";
    const isScopeFilter = SCOPE_FILTERS.has(normalized);
    let visibleCount = 0;

    if (heroCarousel) {
      heroCarousel.hidden = !isAll;
    }

    if (scopeCarouselWrap) {
      scopeCarouselWrap.hidden = isAll;
    }

    if (showcase) {
      showcase.classList.toggle("news-showcase--scope-filter", isScopeFilter);
    }

    heroSlides.forEach((slide) => {
      const slideIndex = Number(slide.dataset.carouselIndex ?? 0);
      const visible = isAll && slideIndex < heroSlideLimit;
      slide.classList.toggle("is-filtered-out", !visible);
      if (visible) visibleCount += 1;
    });

    scopeCarouselCards.forEach((card) => {
      const cardScope = (card.dataset.scope || "nacional").toLowerCase();
      const visible = isScopeFilter && cardScope === normalized;
      card.classList.toggle("is-filtered-out", !visible);
      if (visible) visibleCount += 1;
    });

    if (emptyState) {
      emptyState.hidden = visibleCount > 0;
    }

    if (scopeCarouselHeading && isScopeFilter) {
      scopeCarouselHeading.textContent =
        headingLabels[normalized] || headingLabels.nacional;
    }

    filterButtons.forEach((btn) => {
      const isActive = (btn.dataset.filter || "all") === normalized;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (isAll) {
      refreshHeroCarousel(true);
    } else if (isScopeFilter) {
      refreshScopeCarousel(true);
    }
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyFilter(btn.dataset.filter || "all");
    });
  });

  applyFilter("all");
})();
