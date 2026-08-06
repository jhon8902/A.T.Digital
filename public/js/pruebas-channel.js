/** Spotlight de videos: stage principal + chips (sin salto al cambiar) */

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
  let busy = false;
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

  const setPortrait = (isPortrait) => {
    media.classList.toggle("is-portrait", isPortrait);
    spotlight.classList.toggle("is-portrait", isPortrait);
  };

  const rememberOrientation = (thumb, isPortrait) => {
    thumb.setAttribute(
      "data-orientation",
      isPortrait ? "portrait" : "landscape",
    );
  };

  const detectFromVideo = () => {
    if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
      return videoEl.videoHeight > videoEl.videoWidth;
    }
    return null;
  };

  const detectFromImage = () => {
    if (imageEl.naturalWidth > 0 && imageEl.naturalHeight > 0) {
      return imageEl.naturalHeight > imageEl.naturalWidth;
    }
    return null;
  };

  const applyKnownOrientation = (thumb) => {
    const known = thumb.getAttribute("data-orientation");
    if (known === "portrait") setPortrait(true);
    else if (known === "landscape") setPortrait(false);
  };

  const waitForVideoReady = () =>
    new Promise((resolve) => {
      if (videoEl.readyState >= 2) {
        resolve();
        return;
      }
      const done = () => {
        videoEl.removeEventListener("loadeddata", done);
        videoEl.removeEventListener("error", done);
        resolve();
      };
      videoEl.addEventListener("loadeddata", done, { once: true });
      videoEl.addEventListener("error", done, { once: true });
      window.setTimeout(done, 500);
    });

  const waitForImageReady = () =>
    new Promise((resolve) => {
      if (imageEl.complete && imageEl.naturalWidth > 0) {
        resolve();
        return;
      }
      const done = () => {
        imageEl.removeEventListener("load", done);
        imageEl.removeEventListener("error", done);
        resolve();
      };
      imageEl.addEventListener("load", done, { once: true });
      imageEl.addEventListener("error", done, { once: true });
      window.setTimeout(done, 500);
    });

  const fadeOut = () =>
    new Promise((resolve) => {
      if (prefersReducedMotion.matches) {
        resolve();
        return;
      }
      media.classList.add("is-fading");
      window.setTimeout(resolve, 160);
    });

  const fadeIn = () => {
    media.classList.remove("is-fading");
  };

  /** Precarga orientación de todos los clips para no adivinar al hacer next */
  const probeOrientations = () => {
    thumbs.forEach((thumb) => {
      if (thumb.getAttribute("data-orientation")) return;
      const videoSrc = thumb.getAttribute("data-video") || "";
      const imageSrc = thumb.getAttribute("data-image") || "";

      if (videoSrc) {
        const probe = document.createElement("video");
        probe.preload = "metadata";
        probe.muted = true;
        probe.playsInline = true;
        probe.src = videoSrc;
        probe.addEventListener(
          "loadedmetadata",
          () => {
            if (probe.videoWidth > 0 && probe.videoHeight > 0) {
              rememberOrientation(
                thumb,
                probe.videoHeight > probe.videoWidth,
              );
            }
            probe.removeAttribute("src");
            probe.load();
          },
          { once: true },
        );
        return;
      }

      if (imageSrc) {
        const probe = new Image();
        probe.onload = () => {
          if (probe.naturalWidth > 0 && probe.naturalHeight > 0) {
            rememberOrientation(
              thumb,
              probe.naturalHeight > probe.naturalWidth,
            );
          }
        };
        probe.src = imageSrc;
      }
    });
  };

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

  const updateChrome = (item) => {
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
  };

  const setActive = async (index, { autoplay = false, instant = false } = {}) => {
    const next = Math.max(0, Math.min(thumbs.length - 1, index));
    const thumb = thumbs[next];
    if (!(thumb instanceof HTMLElement)) return;
    if (busy && !instant) return;
    if (next === activeIndex && !instant) return;

    busy = true;
    const item = readThumb(thumb);
    activeIndex = next;
    stopPlayback();
    updateChrome(item);

    const empty = media.querySelector("[data-spotlight-empty]");
    if (empty instanceof HTMLElement) empty.hidden = true;

    if (!instant) await fadeOut();

    // Layout se aplica YA oculto → no se ve el salto
    applyKnownOrientation(thumb);

    if (item.video) {
      imageEl.hidden = true;
      imageEl.removeAttribute("src");
      videoEl.hidden = false;
      if (videoEl.getAttribute("src") !== item.video) {
        videoEl.src = item.video;
        videoEl.load();
      }
      await waitForVideoReady();
      const detected = detectFromVideo();
      if (detected !== null) {
        setPortrait(detected);
        rememberOrientation(thumb, detected);
      }
    } else if (item.image) {
      videoEl.hidden = true;
      videoEl.removeAttribute("src");
      videoEl.load();
      imageEl.hidden = false;
      imageEl.src = item.image;
      imageEl.alt = item.title;
      await waitForImageReady();
      const detected = detectFromImage();
      if (detected !== null) {
        setPortrait(detected);
        rememberOrientation(thumb, detected);
      }
    } else {
      videoEl.hidden = true;
      imageEl.hidden = true;
      setPortrait(false);
      if (empty instanceof HTMLElement) empty.hidden = false;
    }

    // Un frame con el layout ya estable antes de mostrar
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    fadeIn();

    if (autoplay && item.video) {
      media.classList.add("is-playing");
      videoEl.controls = true;
      void videoEl.play();
    }

    busy = false;
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
    thumb.addEventListener("click", () => {
      void setActive(index);
    });
  });

  if (prevBtn instanceof HTMLButtonElement) {
    prevBtn.addEventListener("click", () => {
      void setActive(activeIndex - 1);
    });
  }
  if (nextBtn instanceof HTMLButtonElement) {
    nextBtn.addEventListener("click", () => {
      void setActive(activeIndex + 1);
    });
  }

  spotlight.addEventListener("keydown", (event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      void setActive(activeIndex + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      void setActive(activeIndex - 1);
    }
  });

  probeOrientations();
  void setActive(0, { instant: true });
}

document.querySelectorAll("[data-pruebas-channel]").forEach((root) => {
  initPruebasChannel(root);
});
