/** Carril de videos + reproducción única por sección */

export function initPruebasChannel(root) {

  if (!(root instanceof HTMLElement)) return;



  const pauseAllRailVideos = (exceptWrapper) => {

    root.querySelectorAll("[data-video-card].is-playing").forEach((node) => {

      if (exceptWrapper && node === exceptWrapper) return;

      node.classList.remove("is-playing");

      const v = node.querySelector("video");

      if (v instanceof HTMLVideoElement) {

        v.pause();

        v.controls = false;

      }

    });

  };



  root.querySelectorAll("[data-video-card]").forEach((wrapper) => {

    const media = wrapper;

    const video = media.querySelector("video");

    const playBtn = media.querySelector(".prueba-play");



    if (!(video instanceof HTMLVideoElement) || !(playBtn instanceof HTMLButtonElement)) {

      return;

    }

    playBtn.addEventListener("click", () => {

      pauseAllRailVideos(media);

      media.classList.add("is-playing");

      video.controls = true;

      void video.play();

    });



    video.addEventListener("ended", () => {

      media.classList.remove("is-playing");

      video.controls = false;

    });



    video.addEventListener("pause", () => {

      if (video.currentTime === 0 || video.ended) {

        media.classList.remove("is-playing");

        video.controls = false;

      }

    });

  });



  const rail = root.querySelector("[data-pruebas-rail]");

  if (!(rail instanceof HTMLElement)) return;



  const prevBtn = root.querySelector(".pruebas-rail-btn.prev");

  const nextBtn = root.querySelector(".pruebas-rail-btn.next");

  const counter = root.querySelector("[data-rail-counter]");

  const cards = Array.from(rail.querySelectorAll(".prueba-rail-card"));



  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");



  const getScrollStep = () => {

    const card = rail.querySelector(".prueba-rail-card");

    if (!(card instanceof HTMLElement)) return rail.clientWidth * 0.9;

    const gap = parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap || "18") || 18;

    return card.offsetWidth + gap;

  };



  const updateRailUi = () => {

    const maxScroll = rail.scrollWidth - rail.clientWidth - 2;

    const atStart = rail.scrollLeft <= 2;

    const atEnd = rail.scrollLeft >= maxScroll;



    if (prevBtn instanceof HTMLButtonElement) {

      prevBtn.disabled = atStart;

      prevBtn.classList.toggle("is-disabled", atStart);

    }

    if (nextBtn instanceof HTMLButtonElement) {

      nextBtn.disabled = atEnd;

      nextBtn.classList.toggle("is-disabled", atEnd);

    }



    if (!(counter instanceof HTMLElement) || cards.length === 0) return;



    const railRect = rail.getBoundingClientRect();

    const centerX = railRect.left + railRect.width * 0.5;

    let active = 0;

    let best = Infinity;



    cards.forEach((card, index) => {

      const rect = card.getBoundingClientRect();

      const cardCenter = rect.left + rect.width / 2;

      const dist = Math.abs(cardCenter - centerX);

      if (dist < best) {

        best = dist;

        active = index;

      }

      card.classList.toggle("is-centered", index === active);

    });



    counter.textContent = `${active + 1} / ${cards.length}`;

  };



  if (prevBtn instanceof HTMLButtonElement) {

    prevBtn.addEventListener("click", () => {

      pauseAllRailVideos();

      rail.scrollBy({

        left: -getScrollStep(),

        behavior: prefersReducedMotion.matches ? "auto" : "smooth",

      });

    });

  }



  if (nextBtn instanceof HTMLButtonElement) {

    nextBtn.addEventListener("click", () => {

      pauseAllRailVideos();

      rail.scrollBy({

        left: getScrollStep(),

        behavior: prefersReducedMotion.matches ? "auto" : "smooth",

      });

    });

  }



  rail.addEventListener("scroll", () => {

    window.requestAnimationFrame(updateRailUi);

  }, { passive: true });



  rail.addEventListener("keydown", (event) => {

    if (!(event instanceof KeyboardEvent)) return;

    if (event.key === "ArrowRight") {

      event.preventDefault();

      nextBtn?.click();

    }

    if (event.key === "ArrowLeft") {

      event.preventDefault();

      prevBtn?.click();

    }

  });



  updateRailUi();

  window.addEventListener("resize", updateRailUi, { passive: true });

}



document.querySelectorAll("[data-pruebas-channel]").forEach((root) => {

  initPruebasChannel(root);

});

