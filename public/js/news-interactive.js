(function initNewsInteractive() {
  const section = document.querySelector(".section-info--interactive");
  if (!section) return;

  const filterButtons = section.querySelectorAll(".news-filter-btn");
  const hero = section.querySelector(".news-hero");
  const carouselWrap = section.querySelector(".news-carousel-wrap");
  const carouselCards = section.querySelectorAll(".news-carousel-card");
  const track = section.querySelector(".news-carousel");
  const prevBtn = section.querySelector(".news-carousel-btn--prev");
  const nextBtn = section.querySelector(".news-carousel-btn--next");
  const emptyState = section.querySelector(".news-filter-empty");

  function applyFilter(scope) {
    const normalized = (scope || "all").toLowerCase();
    let visibleCount = 0;

    if (hero) {
      const heroScope = (hero.dataset.scope || "nacional").toLowerCase();
      const showHero = normalized === "all" || heroScope === normalized;
      hero.classList.toggle("is-hidden", !showHero);
      if (showHero) visibleCount += 1;
    }

    carouselCards.forEach((card) => {
      const cardScope = (card.dataset.scope || "nacional").toLowerCase();
      const visible = normalized === "all" || cardScope === normalized;
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

    filterButtons.forEach((btn) => {
      const isActive = (btn.dataset.filter || "all") === normalized;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (track) {
      track.scrollLeft = 0;
      updateCarouselButtons();
    }
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyFilter(btn.dataset.filter || "all");
    });
  });

  function scrollCarousel(direction) {
    if (!track) return;
    const card = track.querySelector(".news-carousel-card:not(.is-filtered-out)");
    const step = card ? card.getBoundingClientRect().width + 20 : 360;
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  function updateCarouselButtons() {
    if (!track || !prevBtn || !nextBtn) return;
    const maxScroll = track.scrollWidth - track.clientWidth - 2;
    prevBtn.disabled = track.scrollLeft <= 2;
    nextBtn.disabled = track.scrollLeft >= maxScroll;
  }

  prevBtn?.addEventListener("click", () => scrollCarousel(-1));
  nextBtn?.addEventListener("click", () => scrollCarousel(1));
  track?.addEventListener("scroll", updateCarouselButtons, { passive: true });
  window.addEventListener("resize", updateCarouselButtons);

  applyFilter("all");
})();
