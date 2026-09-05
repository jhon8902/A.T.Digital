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
  const homeCarouselWrap = section.querySelector("[data-home-carousel-root]");
  const newsMosaic = section.querySelector("[data-news-mosaic]");
  const scopeCarouselWrap = section.querySelector("[data-scope-carousel-root]");
  const scopeCarouselCards = scopeCarouselWrap
    ? scopeCarouselWrap.querySelectorAll(".news-carousel-card")
    : [];
  const scopeCarouselHeading = scopeCarouselWrap?.querySelector(
    ".news-carousel-heading",
  );
  const emptyState = section.querySelector(".news-filter-empty");

  if (homeCarouselWrap) {
    const update = initCardCarouselRoot(homeCarouselWrap);
    if (update) carouselControllers.set(homeCarouselWrap, update);
  }

  if (scopeCarouselWrap) {
    const update = initCardCarouselRoot(scopeCarouselWrap);
    if (update) carouselControllers.set(scopeCarouselWrap, update);
  }

  const headingLabels = {
    nacional: "Noticias nacionales",
    internacional: "Noticias internacionales",
  };

  function refreshCardCarousel(root, scrollToStart) {
    if (!root) return;

    if (scrollToStart) {
      const track = root.querySelector(".news-carousel");
      if (track) track.scrollLeft = 0;
    }

    const cards = Array.from(root.querySelectorAll(".news-carousel-card")).filter(
      (card) => !card.classList.contains("is-filtered-out"),
    );
    root.classList.toggle("is-empty", cards.length === 0);
    carouselControllers.get(root)?.();
  }

  function applyFilter(filter) {
    const normalized = (filter || "all").toLowerCase();
    const isAll = normalized === "all";
    const isScopeFilter = SCOPE_FILTERS.has(normalized);
    let visibleCount = 0;

    if (newsMosaic) {
      newsMosaic.hidden = !isAll;
      if (isAll) visibleCount += 1;
    }

    if (homeCarouselWrap) {
      homeCarouselWrap.hidden = !isAll;
      if (isAll) {
        visibleCount += homeCarouselWrap.querySelectorAll(
          ".news-carousel-card:not(.is-filtered-out)",
        ).length;
      }
    }

    if (scopeCarouselWrap) {
      scopeCarouselWrap.hidden = !isScopeFilter;
    }

    if (showcase) {
      showcase.classList.toggle("news-showcase--scope-filter", isScopeFilter);
      showcase.classList.toggle("news-showcase--home-cards", isAll);
    }

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
      refreshCardCarousel(homeCarouselWrap, true);
    } else if (isScopeFilter) {
      refreshCardCarousel(scopeCarouselWrap, true);
    }
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyFilter(btn.dataset.filter || "all");
    });
  });

  applyFilter("all");
})();
