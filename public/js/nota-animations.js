document.addEventListener("DOMContentLoaded", () => {
  const observeElement = (selector) => {
    const element = document.querySelector(selector);

    if (!element) {
      const message = `El elemento con la clase ${selector} no se encontro en el DOM.`;
      console.error(message);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            element.classList.add("visible");
          } else {
            element.classList.remove("visible");
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
  };

  observeElement(".feature-title-1");
  observeElement(".feature-title");
});
