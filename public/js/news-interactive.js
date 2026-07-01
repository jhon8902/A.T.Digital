(function initNewsInteractive() {
  if (window.__atdNewsInteractiveInit) return;
  window.__atdNewsInteractiveInit = true;

  const SCOPE_FILTERS = new Set(["nacional", "internacional"]);
  const carouselControllers = new Map();

  function initCarouselRoot(root) {
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
    const update = initCarouselRoot(root);
    if (update) carouselControllers.set(root, update);
  });

  const section = document.querySelector(".section-info--interactive");
  if (!section) return;

  const showcase = section.querySelector(".news-showcase");
  const filterButtons = section.querySelectorAll(".news-filter-btn");
  const hero = section.querySelector(".news-hero");
  const carouselWrap = section.querySelector(".news-carousel-wrap");
  const carouselCards = section.querySelectorAll(".news-carousel-card");
  const emptyState = section.querySelector(".news-filter-empty");
  const carouselHeading = section.querySelector(".news-carousel-heading");
  const carouselLimit = Number(section.dataset.carouselLimit || 7);
  const refreshNewsCarousel = () => {
    if (carouselWrap) carouselControllers.get(carouselWrap)?.();
  };

  const headingLabels = {
    all: "Más en el sector",
    nacional: "Noticias nacionales",
    internacional: "Noticias internacionales",
  };

  function applyFilter(filter) {
    const normalized = (filter || "all").toLowerCase();
    const isAll = normalized === "all";
    const isScopeFilter = SCOPE_FILTERS.has(normalized);
    let visibleCount = 0;

    if (hero) {
      hero.classList.toggle("is-hidden", !isAll);
      if (isAll) visibleCount += 1;
    }

    carouselCards.forEach((card) => {
      const cardScope = (card.dataset.scope || "nacional").toLowerCase();
      const cardIndex = Number(card.dataset.carouselIndex ?? 0);

      let visible = false;
      if (isAll) {
        visible = cardIndex < carouselLimit;
      } else if (isScopeFilter) {
        visible = cardScope === normalized;
      }

      card.classList.toggle("is-filtered-out", !visible);
      if (visible) visibleCount += 1;
    });

    if (carouselWrap) {
      const visibleCarouselCards = Array.from(carouselCards).filter(
        (card) => !card.classList.contains("is-filtered-out"),
      );
      carouselWrap.classList.toggle("is-empty", visibleCarouselCards.length === 0);
    }

    if (emptyState) {
      emptyState.hidden = visibleCount > 0;
    }

    if (showcase) {
      showcase.classList.toggle("news-showcase--carousel-only", !isAll);
    }

    if (carouselHeading) {
      carouselHeading.textContent =
        headingLabels[normalized] || headingLabels.all;
    }

    filterButtons.forEach((btn) => {
      const isActive = (btn.dataset.filter || "all") === normalized;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    const track = carouselWrap?.querySelector(".news-carousel");
    if (track) track.scrollLeft = 0;
    refreshNewsCarousel();
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyFilter(btn.dataset.filter || "all");
    });
  });

  applyFilter("all");
})();
