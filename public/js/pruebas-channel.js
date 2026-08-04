/** Spotlight de videos: stage principal + miniaturas */

export function initPruebasChannel(root) {
  if (!(root instanceof HTMLElement)) return;

  const spotlight = root.querySelector("[data-pruebas-spotlight]");
  if (!(spotlight instanceof HTMLElement)) return;

  const media = spotlight.querySelector("[data-spotlight-media]");
  const videoEl = spotlight.querySelector("[data-spotlight-video]");
  const imageEl = spotlight.querySelector("[data-spotlight-image]");
  const playBtn = spotlight.querySelector("[data-spotlight-play]");
  const titleEl = spotlight.querySelector("[data-spotlight-title]");
  const descEl = spotlight.querySelector("[data-spotlight-desc]");
  const metaLineEl = spotlight.querySelector("[data-spotlight-metaline]");
  const actionsEl = spotlight.querySelector("[data-spotlight-actions]");
  const counterEl = spotlight.querySelector("[data-spotlight-counter]");
  const prevBtn = spotlight.querySelector("[data-spotlight-prev]");
  const nextBtn = spotlight.querySelector("[data-spotlight-next]");
  const thumbs = Array.from(
    spotlight.querySelectorAll("[data-spotlight-thumb]"),
  );

  if (
    !(media instanceof HTMLElement) ||
    !(videoEl instanceof HTMLVideoElement) ||
    !(imageEl instanceof HTMLImageElement) ||
    thumbs.length === 0
  ) {
    return;
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  let activeIndex = 0;
  let noteLink = actionsEl?.querySelector("[data-spotlight-note]") || null;

  const readThumb = (thumb) => ({
    title: thumb.getAttribute("data-title") || "",
    subtitle: thumb.getAttribute("data-subtitle") || "",
    metaline: thumb.getAttribute("data-metaline") || "",
    video: thumb.getAttribute("data-video") || "",
    image: thumb.getAttribute("data-image") || "",
    href: thumb.getAttribute("data-href") || "",
    showNote: thumb.getAttribute("data-show-note") === "1",
  });

  const stopPlayback = () => {
    media.classList.remove("is-playing");
    videoEl.pause();
    videoEl.controls = false;
    videoEl.removeAttribute("controls");
  };

  const syncOrientation = () => {
    let isPortrait = false;

    if (!videoEl.hidden && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
      isPortrait = videoEl.videoHeight > videoEl.videoWidth;
    } else if (
      !imageEl.hidden &&
      imageEl.naturalWidth > 0 &&
      imageEl.naturalHeight > 0
    ) {
      isPortrait = imageEl.naturalHeight > imageEl.naturalWidth;
    }

    media.classList.toggle("is-portrait", isPortrait);
    spotlight.classList.toggle("is-portrait", isPortrait);

    const activeThumb = thumbs[activeIndex];
    if (activeThumb instanceof HTMLElement) {
      activeThumb.setAttribute(
        "data-orientation",
        isPortrait ? "portrait" : "landscape",
      );
    }
  };

  const applyKnownOrientation = (thumb) => {
    const known = thumb.getAttribute("data-orientation");
    if (known === "portrait") {
      media.classList.add("is-portrait");
      spotlight.classList.add("is-portrait");
    } else if (known === "landscape") {
      media.classList.remove("is-portrait");
      spotlight.classList.remove("is-portrait");
    }
    // Si aún no se conoce, se mantiene el layout actual hasta loadedmetadata
  };

  videoEl.addEventListener("loadedmetadata", syncOrientation);
  videoEl.addEventListener("loadeddata", syncOrientation);
  imageEl.addEventListener("load", syncOrientation);

  const updateNoteLink = (item) => {
    if (!(actionsEl instanceof HTMLElement)) return;

    if (item.showNote && item.href) {
      if (!(noteLink instanceof HTMLAnchorElement)) {
        noteLink = document.createElement("a");
        noteLink.className = "archivo-link";
        noteLink.setAttribute("data-spotlight-note", "");
        noteLink.textContent = "Ver nota";
        actionsEl.prepend(noteLink);
      }
      noteLink.href = item.href;
      noteLink.hidden = false;
    } else if (noteLink instanceof HTMLAnchorElement) {
      noteLink.hidden = true;
    }
  };

  const setActive = (index, { autoplay = false } = {}) => {
    const next = Math.max(0, Math.min(thumbs.length - 1, index));
    const thumb = thumbs[next];
    if (!(thumb instanceof HTMLElement)) return;

    const item = readThumb(thumb);
    const changed = next !== activeIndex;
    activeIndex = next;

    stopPlayback();

    thumbs.forEach((node, i) => {
      const on = i === activeIndex;
      node.classList.toggle("is-active", on);
      node.setAttribute("aria-selected", on ? "true" : "false");
    });

    if (counterEl instanceof HTMLElement) {
      counterEl.textContent = `${activeIndex + 1} / ${thumbs.length}`;
    }

    if (titleEl instanceof HTMLElement) titleEl.textContent = item.title;
    if (descEl instanceof HTMLElement) {
      descEl.textContent = item.subtitle;
      descEl.hidden = !item.subtitle;
    }
    if (metaLineEl instanceof HTMLElement) {
      metaLineEl.textContent = item.metaline;
      metaLineEl.hidden = !item.metaline;
    }

    updateNoteLink(item);

    if (playBtn instanceof HTMLButtonElement) {
      playBtn.hidden = !item.video;
      playBtn.setAttribute(
        "aria-label",
        `Reproducir video de ${item.title}`,
      );
    }

    const empty = media.querySelector("[data-spotlight-empty]");
    if (empty instanceof HTMLElement) empty.hidden = true;

    applyKnownOrientation(thumb);

    if (changed && !prefersReducedMotion.matches) {
      media.classList.add("is-fading");
      spotlight.classList.add("is-switching");
    }

    if (item.video) {
      imageEl.hidden = true;
      imageEl.removeAttribute("src");
      videoEl.hidden = false;
      if (videoEl.getAttribute("src") !== item.video) {
        videoEl.src = item.video;
        videoEl.load();
      }
      requestAnimationFrame(syncOrientation);
    } else if (item.image) {
      videoEl.hidden = true;
      videoEl.removeAttribute("src");
      videoEl.load();
      imageEl.hidden = false;
      imageEl.src = item.image;
      imageEl.alt = item.title;
      requestAnimationFrame(syncOrientation);
    } else {
      videoEl.hidden = true;
      imageEl.hidden = true;
      media.classList.remove("is-portrait");
      spotlight.classList.remove("is-portrait");
      if (empty instanceof HTMLElement) empty.hidden = false;
    }

    if (changed && !prefersReducedMotion.matches) {
      window.setTimeout(() => {
        media.classList.remove("is-fading");
        spotlight.classList.remove("is-switching");
      }, 180);
    }

    if (prevBtn instanceof HTMLButtonElement) {
      const atStart = activeIndex <= 0;
      prevBtn.disabled = atStart;
      prevBtn.classList.toggle("is-disabled", atStart);
    }
    if (nextBtn instanceof HTMLButtonElement) {
      const atEnd = activeIndex >= thumbs.length - 1;
      nextBtn.disabled = atEnd;
      nextBtn.classList.toggle("is-disabled", atEnd);
    }

    if (autoplay && item.video) {
      media.classList.add("is-playing");
      videoEl.controls = true;
      void videoEl.play();
    }
  };

  if (playBtn instanceof HTMLButtonElement) {
    playBtn.addEventListener("click", () => {
      if (videoEl.hidden) return;
      media.classList.add("is-playing");
      videoEl.controls = true;
      void videoEl.play();
    });
  }

  videoEl.addEventListener("ended", stopPlayback);
  videoEl.addEventListener("pause", () => {
    if (videoEl.currentTime === 0 || videoEl.ended) stopPlayback();
  });

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener("click", () => setActive(index));
  });

  if (prevBtn instanceof HTMLButtonElement) {
    prevBtn.addEventListener("click", () => setActive(activeIndex - 1));
  }
  if (nextBtn instanceof HTMLButtonElement) {
    nextBtn.addEventListener("click", () => setActive(activeIndex + 1));
  }

  spotlight.addEventListener("keydown", (event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setActive(activeIndex + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActive(activeIndex - 1);
    }
  });

  setActive(0);
}

document.querySelectorAll("[data-pruebas-channel]").forEach((root) => {
  initPruebasChannel(root);
});
