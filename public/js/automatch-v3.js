import { submitTestDrive } from "./test-drive-submit.js";
import {
  rankVehicles,
  buildMatchSummary,
  formatVehicleMeta,
  relaxSearchFilters,
} from "./automatch-match.js";
console.log("AutoMatch v3 cargado.");

const FICHA_HREFS = {
  "renault-megane": "/notas-electricos/nota-renault-megane",
  "bmw-330e": "/noticias-carrusel/noticia-bmw",
  "mini-cooper-se": "/notas-electricos/nota-mini-cooper",
  "toyota-prado": "/noticias-nacionales/noticia-toyota-prado",
  "volvo-ex90": "/notas-electricos/nota-volvo-ex90",
  "nissan-xtrail": "/notas-hibridos/nota-nissan",
  "ford-bronco": "/noticias-carrusel/noticia-ford",
  "peugeot-e3008": "/notas-electricos/nota-peugeot-e3008",
  "byd-sealion7": "/notas-electricos/nota-byd-sealion7",
  "hyundai-kona-hibrida": "/notas-hibridos/nota-kona",
  "kia-ev9": "/noticias-nacionales/noticia-kia-ev9",
  "jeep-avenger": "/noticias-nacionales/noticia-jeep-avenger",
  "mazda-ez6": "/noticias-nacionales/noticia-mazda-ez6",
  "audi-q7-hibrida": "/notas-hibridos/nota-audi-q7",
  "subaru-forester-hibrida": "/notas-hibridos/nota-subaru",
  "volvo-xc90-hibrida": "/notas-hibridos/nota-volvo-cx90",
  "ford-escape-hibrida": "/notas-hibridos/nota-scape",
  "dfsk-seres-e5": "/noticias-carrusel/noticia-dfsk",
  "audi-etron": "/noticias-carrusel/noticia-audi",
  "ford-f150": "/noticias-nacionales/noticia-ford-f150",
  "smart-5-electrico": "/notas-electricos/nota-smart-5",
  "chery-e5": "/notas-electricos/nota-chery-e5",
  "deepal-s05": "/notas-electricos/nota-deepal-s05",
};

function resolveFichaHref(auto) {
  if (auto?.fichaHref) return auto.fichaHref;
  const staticHref = auto?.especificaciones_id
    ? FICHA_HREFS[auto.especificaciones_id]
    : null;
  if (staticHref) return staticHref;
  if (auto?.noteId) return `/notas/${auto.noteId}`;
  return null;
}

function buildMapsUrl(concesionario = {}) {
  const { lat, lng, direccion, nombre } = concesionario;
  if (typeof lat === "number" && typeof lng === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  const query = [nombre, direccion].filter(Boolean).join(", ");
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function parsePresupuesto(presupuestoValue) {
  if (!presupuestoValue) return 0;
  if (presupuestoValue.includes("-")) {
    const [min, max] = presupuestoValue.split("-").map((n) => parseInt(n, 10));
    return ((min + max) / 2) * 1000000;
  }
  const baseValue = parseInt(presupuestoValue.replace("+", ""), 10);
  return (baseValue + 50) * 1000000;
}

function getPrefsFromForm() {
  const presupuestoValue = document.getElementById("presupuesto")?.value || "";
  const condicion = document.getElementById("condicion")?.value || "";
  const showUsedFilters = ["seminuevo", "usado", "ambos"].includes(condicion);

  return {
    tipo: document.getElementById("tipo")?.value || "",
    uso: document.getElementById("uso")?.value || "",
    ciudad: document.getElementById("ciudad")?.value || "",
    presupuesto: parsePresupuesto(presupuestoValue),
    condicion,
    placa: showUsedFilters
      ? document.getElementById("placa")?.value || "ambos"
      : "ambos",
    kilometraje: showUsedFilters
      ? document.getElementById("kilometraje")?.value || "cualquiera"
      : "cualquiera",
    carroceria: showUsedFilters
      ? document.getElementById("carroceria")?.value || ""
      : "",
  };
}

function updateUsedFiltersVisibility() {
  const condicion = document.getElementById("condicion")?.value || "";
  const usedStep = document.getElementById("form-step-used");
  const step2Label = document.getElementById("step-2-label");
  const showUsed = ["seminuevo", "usado", "ambos"].includes(condicion);

  if (usedStep) usedStep.hidden = !showUsed;
  if (step2Label) {
    step2Label.classList.toggle("form-steps__item--active", showUsed);
    step2Label.classList.toggle("form-steps__item--muted", !showUsed);
  }
}

function syncProfileCityToForm() {
  const profileCity = document.getElementById("user-city")?.value || "";
  const ciudadSelect = document.getElementById("ciudad");
  if (!profileCity || !ciudadSelect || ciudadSelect.value) return;

  const option = Array.from(ciudadSelect.options).find(
    (opt) => opt.value === profileCity,
  );
  if (option) ciudadSelect.value = profileCity;
}

function syncFormCityToProfile() {
  const ciudad = document.getElementById("ciudad")?.value || "";
  const userCity = document.getElementById("user-city");
  if (!ciudad || !userCity) return;

  const option = Array.from(userCity.options).find((opt) => opt.value === ciudad);
  if (option) userCity.value = ciudad;
}

function encodeImgSrc(src = "") {
  if (!src || !src.includes(" ")) return src;
  return src
    .split("/")
    .map((segment) => {
      if (!segment || segment.includes(":")) return segment;
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");
}

function buildGalleryImages(auto) {
  const images = [
    auto?.imagen_principal,
    ...(Array.isArray(auto?.galeria) ? auto.galeria : []),
  ]
    .filter(Boolean)
    .map(encodeImgSrc);

  return [...new Set(images)];
}

// ========== GESTOR DE PERFIL ==========
class UserProfile {
  constructor() {
    this.storageKey = "automatchUserProfile";
    this.likesKey = "automatchLikeHistory";
    this.profile = this.loadProfile();
  }

  loadProfile() {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : this.getDefaultProfile();
  }

  getDefaultProfile() {
    return {
      name: "",
      city: "",
      age: null,
      preferences: [],
      createdAt: new Date().toISOString(),
    };
  }

  saveProfile(data) {
    this.profile = { ...this.profile, ...data };
    localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
  }

  addLike(autoId, autoData) {
    let likes = this.getLikes();
    if (!likes[autoId]) {
      likes[autoId] = {
        ...autoData,
        likedAt: new Date().toISOString(),
      };
    }
    localStorage.setItem(this.likesKey, JSON.stringify(likes));
  }

  getLikes() {
    const saved = localStorage.getItem(this.likesKey);
    return saved ? JSON.parse(saved) : {};
  }
}

// ========== ALGORITMO INTELIGENTE ==========
class SmartAlgorithm {
  constructor(userProfile) {
    this.user = userProfile;
  }

  calculateScore(auto, baseScore, userLikes) {
    let score = baseScore;

    // Bonus por likes anteriores
    if (Object.keys(userLikes).length > 0) {
      const likedTypes = Object.values(userLikes).map((a) => a.tipo);
      if (likedTypes.includes(auto.tipo)) score += 10;

      const likedUsos = Object.values(userLikes).map((a) => a.uso);
      if (likedUsos.includes(auto.uso)) score += 5;
    }

    return Math.min(score, 100);
  }
}

// ========== INSTANCIAS GLOBALES ==========
const userProfile = new UserProfile();
const smartAlgorithm = new SmartAlgorithm(userProfile);

let autosData = []; // Se cargará desde JSON
let specsData = {};  // Se cargará desde JSON

// ========== CARGAR CATÁLOGO UNIFICADO ==========
async function loadData() {
  try {
    const response = await fetch("/api/automatch-catalog");
    if (response.ok) {
      const data = await response.json();
      autosData = data.autos || [];
      specsData = data.specs || {};
      console.log(
        "Catálogo unificado cargado:",
        autosData.length,
        "vehículos",
        data.meta?.source || "",
      );
      return;
    }
  } catch (error) {
    console.warn("API de catálogo no disponible, usando JSON local.", error);
  }

  try {
    const [autosRes, specsRes] = await Promise.all([
      fetch("/data/automatch/autos.json"),
      fetch("/data/automatch/specs.json"),
    ]);

    autosData = await autosRes.json();
    specsData = await specsRes.json();
    console.log("Catálogo local cargado:", autosData.length, "autos");
  } catch (error) {
    console.error("Error cargando datos:", error);
  }
}

// ========== INTERFAZ DE USUARIO ==========
const form = document.getElementById("automatch-form");
const userProfileForm = document.getElementById("user-profile-form");
const resultado = document.getElementById("resultado");
const loading = document.getElementById("loading");
const btnNuevaBusqueda = document.getElementById("btn-nueva-busqueda");
let lastPrefs = null;

// Cargar perfil guardado
if (userProfileForm) {
  const savedProfile = userProfile.loadProfile();
  const userNameInput = document.getElementById("user-name");
  const userCitySelect = document.getElementById("user-city");

  if (savedProfile.name && userNameInput) {
    userNameInput.value = savedProfile.name;
  }
  if (savedProfile.city && userCitySelect) {
    userCitySelect.value = savedProfile.city;
  }

  syncProfileCityToForm();

  userProfileForm.addEventListener("change", () => {
    userProfile.saveProfile({
      name: userNameInput?.value || "",
      city: userCitySelect?.value || "",
    });
    syncProfileCityToForm();
  });
}

const condicionSelect = document.getElementById("condicion");
const ciudadSelect = document.getElementById("ciudad");

if (condicionSelect) {
  condicionSelect.addEventListener("change", updateUsedFiltersVisibility);
  updateUsedFiltersVisibility();
}

if (ciudadSelect) {
  ciudadSelect.addEventListener("change", () => {
    syncFormCityToProfile();
    userProfile.saveProfile({
      city: ciudadSelect.value,
      name: document.getElementById("user-name")?.value || "",
    });
  });
}

async function runSearch(prefs, { scrollToResults = true } = {}) {
  lastPrefs = prefs;
  loading.hidden = false;
  loading.classList.add("active");
  resultado.innerHTML = "";

  await new Promise((resolve) => setTimeout(resolve, 400));

  const userLikes = userProfile.getLikes();
  const { best, alternativas, eligibleCount } = rankVehicles(autosData, prefs, {
    applyLikesBonus: (auto, baseScore) =>
      smartAlgorithm.calculateScore(auto, baseScore, userLikes),
  });

  loading.classList.remove("active");
  loading.hidden = true;

  if (best) {
    const mejorAuto = best.vehicle;
    const matchPercentage = best.match.score;
    const specs = specsData[mejorAuto.especificaciones_id] || {};
    const matchSummary = buildMatchSummary(best.match.breakdown, prefs);

    userProfile.addLike(mejorAuto.id, mejorAuto);
    mostrarResultado(
      mejorAuto,
      specs,
      matchPercentage,
      best.match.breakdown,
      matchSummary,
    );

    if (alternativas.length > 0) {
      mostrarAlternativas(
        alternativas.map((item) => item.vehicle),
        specsData,
      );
    }

    if (btnNuevaBusqueda) btnNuevaBusqueda.hidden = false;

    if (scrollToResults) {
      setTimeout(() => {
        resultado.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 250);
    }
    return;
  }

  const tipoCount = autosData.filter((auto) => auto.tipo === prefs.tipo).length;
  const hint =
    tipoCount === 0
      ? `No hay vehículos ${prefs.tipo} en el catálogo todavía.`
      : `Hay ${tipoCount} ${prefs.tipo}(s), pero ninguno cumple condición, placa, kilometraje, presupuesto u otros filtros.`;

  resultado.innerHTML = `
    <div class="auto-card auto-card--empty">
      <p class="no-match">No encontramos coincidencias con tu búsqueda.</p>
      <p>${hint}</p>
      <div class="empty-actions">
        <button type="button" class="btn-relax-filters" id="btn-relax-filters">
          Relajar filtros
        </button>
        <button type="button" class="btn-edit-search" id="btn-edit-search">
          Ajustar búsqueda
        </button>
      </div>
      <p class="match-meta">Vehículos evaluados: ${autosData.length} · Elegibles: ${eligibleCount}</p>
    </div>
  `;

  document.getElementById("btn-relax-filters")?.addEventListener("click", () => {
    if (!lastPrefs) return;
    const relaxed = relaxSearchFilters(lastPrefs);
    document.getElementById("placa").value = relaxed.placa;
    document.getElementById("kilometraje").value = relaxed.kilometraje;
    document.getElementById("carroceria").value = relaxed.carroceria;
    if (relaxed.condicion !== lastPrefs.condicion) {
      document.getElementById("condicion").value = relaxed.condicion;
      updateUsedFiltersVisibility();
    }
    runSearch(relaxed);
  });

  document.getElementById("btn-edit-search")?.addEventListener("click", () => {
    form?.scrollIntoView({ behavior: "smooth", block: "start" });
    form?.querySelector("select")?.focus();
  });
}
// ========== FORMULARIO PRINCIPAL ==========
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const prefs = getPrefsFromForm();
    await runSearch(prefs);
  });
}
// ========== MOSTRAR RESULTADO PRINCIPAL ==========
function mostrarResultado(auto, specs, matchPercentage, breakdown = [], matchSummary = "") {
  const condicionBadge = auto.condicion === "nuevo" ? "Nuevo (0 km)" :
                         auto.condicion === "seminuevo" ? "Seminuevo" : "Usado certificado";
  const galleryImages = buildGalleryImages(auto);
  const fichaHref = resolveFichaHref(auto);
  const metaChips = formatVehicleMeta(auto);
  const metaHTML = metaChips.length
    ? `<div class="auto-meta-chips" aria-label="Datos del vehículo">${metaChips
        .map((chip) => `<span class="auto-meta-chip">${chip}</span>`)
        .join("")}</div>`
    : "";
  const demoNote = auto.demo
    ? `<p class="auto-demo-note">Inventario demo · datos de referencia mercado usado Colombia</p>`
    : "";

  const galeriaHTML = galleryImages.map((img, idx) => `
    <img src="${img}" alt="${auto.nombre}" class="galeria-img ${idx === 0 ? 'visible' : 'hidden'}" loading="eager" decoding="async">
  `).join("");

  const breakdownHTML = breakdown.length
    ? `
    <ul class="match-breakdown" aria-label="Detalle de compatibilidad">
      ${breakdown
        .map(
          (item) => `
        <li class="match-breakdown__item ${item.ok ? "is-ok" : "is-miss"}">
          <span class="match-breakdown__label">${item.label}</span>
          <span class="match-breakdown__pts">${item.pts} pts</span>
          ${item.detail ? `<span class="match-breakdown__detail">${item.detail}</span>` : ""}
        </li>`,
        )
        .join("")}
    </ul>
  `
    : "";

  const especsHTML = specs.equipamiento ? `
    <div class="specs-section">
      <h4>Equipamiento y características</h4>
      <ul class="specs-list">
        ${specs.equipamiento.slice(0, 8).map(e => `<li>${e}</li>`).join("")}
      </ul>
    </div>
  `     : "";

  const summaryText =
    matchSummary || "Tu mejor coincidencia según tu perfil";
  const mapsUrl = buildMapsUrl(auto.concesionario);
  const sedeLine = auto.concesionario.sede
    ? `<p class="concesionario-sede"><i class="fa-solid fa-building" aria-hidden="true"></i> ${auto.concesionario.sede}</p>`
    : "";

  resultado.innerHTML = `
    <div class="auto-card principal" style="animation: fadeIn 0.6s ease;">
      <div class="auto-galeria">
        <div class="galeria-container">
          ${galeriaHTML}
          <button type="button" class="galeria-prev" aria-label="Imagen anterior"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
          <button type="button" class="galeria-next" aria-label="Imagen siguiente"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
          <div class="galeria-dots">
            ${galleryImages.map((_, idx) => `<span class="dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>`).join("")}
          </div>
        </div>
      </div>

      <div class="auto-info">
        <div class="condicion-badge ${auto.condicion}">${condicionBadge}</div>
        <h3>${auto.nombre}</h3>
        ${metaHTML}
        ${demoNote}
        <p class="descripcion">${auto.descripcion}</p>

        <div class="specs-principales">
          <div class="spec-item">
            <span class="label">Motor</span>
            <span class="valor">${specs.motor || "N/A"}</span>
          </div>
          <div class="spec-item">
            <span class="label">Potencia</span>
            <span class="valor">${specs.potencia || "N/A"}</span>
          </div>
          <div class="spec-item">
            <span class="label">Transmisión</span>
            <span class="valor">${auto.transmision || specs.transmision || "N/A"}</span>
          </div>
          <div class="spec-item">
            <span class="label">Kilometraje</span>
            <span class="valor">${typeof auto.kilometraje === "number" ? `${auto.kilometraje.toLocaleString("es-CO")} km` : auto.condicion === "nuevo" ? "0 km" : "N/A"}</span>
          </div>
          <div class="spec-item">
            <span class="label">Precio</span>
            <span class="valor precio">$${auto.precio.toLocaleString()} COP</span>
          </div>
        </div>

        <div class="match-bar">
          <div class="match-fill" style="width: 0%;"></div>
        </div>
        <div class="match-percentage" style="opacity: 0;">
          ${Math.round(matchPercentage)}% compatibilidad
        </div>
        <p class="match-text">${summaryText}</p>

        <div class="concesionario-info">
          <h4><i class="fa-solid fa-store" aria-hidden="true"></i> ${auto.concesionario.nombre}</h4>
          ${sedeLine}
          <p><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${auto.concesionario.direccion}</p>
          <p><i class="fa-solid fa-phone" aria-hidden="true"></i> ${auto.concesionario.telefono}</p>
          <p><i class="fa-regular fa-clock" aria-hidden="true"></i> ${auto.concesionario.horario}</p>

          <div class="botones-contacto botones-contacto--primary">
            <a href="https://wa.me/${auto.concesionario.whatsapp}?text=Hola,%20me%20interesa%20el%20${encodeURIComponent(auto.nombre)}"
               class="btn-contact whatsapp btn-contact--primary" target="_blank" rel="noopener">
              <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> WhatsApp
            </a>
            ${mapsUrl ? `
            <a href="${mapsUrl}" class="btn-contact maps btn-contact--primary" target="_blank" rel="noopener">
              <i class="fa-solid fa-map-location-dot" aria-hidden="true"></i> Cómo llegar
            </a>` : ""}
          </div>

          <div class="botones-contacto botones-contacto--secondary">
            ${fichaHref ? `
            <a href="${fichaHref}" class="btn-contact btn-ficha">
              <i class="fa-solid fa-file-lines" aria-hidden="true"></i> Ver modelo
            </a>` : ""}
            <a href="mailto:${auto.concesionario.email}?subject=Consulta%20sobre%20${encodeURIComponent(auto.nombre)}"
               class="btn-contact email">
              <i class="fa-regular fa-envelope" aria-hidden="true"></i> Email
            </a>
            <a href="tel:${auto.concesionario.telefono}" class="btn-contact phone">
              <i class="fa-solid fa-phone" aria-hidden="true"></i> Llamar
            </a>
          </div>
        </div>

        <details class="result-details">
          <summary>Más detalles</summary>
          <div class="result-details__body">
            ${especsHTML}
            ${breakdownHTML}
            <div class="formulario-test-drive">
              <h4><i class="fa-solid fa-car-side" aria-hidden="true"></i> Solicitar test drive</h4>
              <form class="form-test-drive" data-auto-id="${auto.catalogId || auto.id}" data-note-id="${auto.noteId || ""}" data-dealer-id="${auto.concesionario.id || ""}">
                <input type="text" name="nombre" placeholder="Tu nombre" required>
                <select name="ciudad" required>
                  <option value="">Ciudad</option>
                  <option value="Bogotá">Bogotá</option>
                  <option value="Medellín">Medellín</option>
                  <option value="Cali">Cali</option>
                  <option value="Barranquilla">Barranquilla</option>
                  <option value="Otra">Otra</option>
                </select>
                <input type="email" name="email" placeholder="Tu email" required>
                <input type="tel" name="telefono" placeholder="Tu teléfono" required>
                <textarea name="mensaje" placeholder="Mensaje (opcional)"></textarea>
                <label class="test-drive-consent">
                  <input type="checkbox" name="consent" required>
                  Acepto la política de privacidad y autorizo contacto comercial.
                </label>
                <button type="submit" class="btn-submit">Solicitar cita</button>
                <p class="test-drive-feedback" role="status" aria-live="polite"></p>
              </form>
            </div>
          </div>
        </details>
      </div>
    </div>
  `;

  // Animaciones
  setTimeout(() => {
    const fillBar = resultado.querySelector(".match-fill");
    if (fillBar) fillBar.style.width = matchPercentage + "%";
  }, 100);

  setTimeout(() => {
    const percentage = resultado.querySelector(".match-percentage");
    if (percentage) percentage.style.opacity = "1";
  }, 300);

  // Galería
  setupGaleria();

  // Test Drive
  setupTestDrive(auto);
}

// ========== MOSTRAR ALTERNATIVAS ==========
function mostrarAlternativas(alternativas, specs) {
  const contenedor = document.createElement("div");
  contenedor.classList.add("alternativas-section");
  contenedor.innerHTML = `
    <h3><i class="fa-solid fa-car-rear" aria-hidden="true"></i> Otras opciones que también te pueden interesar</h3>
    <div class="alternativas-grid">
      ${alternativas.map(auto => {
        const fichaHref = resolveFichaHref(auto);
        const imagen = encodeImgSrc(auto.imagen_principal);
        const meta = formatVehicleMeta(auto).slice(0, 3).join(" · ");
        return `
        <div class="auto-alternativa">
          ${fichaHref ? `<a href="${fichaHref}" class="auto-alternativa__media">` : '<div class="auto-alternativa__media">'}
            <img src="${imagen}" alt="${auto.nombre}" loading="lazy">
          ${fichaHref ? "</a>" : "</div>"}
          <div class="auto-alternativa__body">
            <h4>${auto.nombre}</h4>
            <p class="tipo-uso">${auto.tipo} | ${auto.uso}${meta ? ` · ${meta}` : ""}</p>
            <p class="precio">$${auto.precio.toLocaleString()} COP</p>
            <p class="auto-alternativa__desc">${auto.descripcion}</p>
            <div class="auto-alternativa__actions">
              ${fichaHref ? `<a href="${fichaHref}" class="btn-ficha-small">Ver modelo completo</a>` : ""}
              <a href="https://wa.me/${auto.concesionario.whatsapp}?text=Hola,%20me%20interesa%20el%20${encodeURIComponent(auto.nombre)}" 
                 class="btn-contact-small whatsapp" target="_blank" rel="noopener">
                Contactar
              </a>
            </div>
          </div>
        </div>`;
      }).join("")}
    </div>
  `;
  resultado.appendChild(contenedor);
}

// ========== GALERÍA DE IMÁGENES ==========
function setupGaleria() {
  const galeriaContainer = resultado.querySelector(".galeria-container");
  const images = resultado.querySelectorAll(".galeria-img");
  const dots = resultado.querySelectorAll(".dot");
  let currentIndex = 0;

  const showImage = (index) => {
    images.forEach((img, i) => {
      img.classList.toggle("visible", i === index);
      img.classList.toggle("hidden", i !== index);
    });
    dots.forEach(dot => dot.classList.remove("active"));
    dots[index].classList.add("active");
    currentIndex = index;
  };

  resultado.querySelector(".galeria-next").addEventListener("click", () => {
    showImage((currentIndex + 1) % images.length);
  });

  resultado.querySelector(".galeria-prev").addEventListener("click", () => {
    showImage((currentIndex - 1 + images.length) % images.length);
  });

  dots.forEach((dot, idx) => {
    dot.addEventListener("click", () => showImage(idx));
  });
}

// ========== FORMULARIO TEST DRIVE ==========
function setupTestDrive(auto) {
  const forms = resultado.querySelectorAll(".form-test-drive");
  forms.forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const feedback = form.querySelector(".test-drive-feedback");
      const consent = form.querySelector("input[name='consent']");
      if (consent && !consent.checked) {
        if (feedback) {
          feedback.textContent = "Debes aceptar la política de privacidad.";
          feedback.className = "test-drive-feedback is-error";
        }
        return;
      }

      const submitBtn = form.querySelector(".btn-submit");
      if (submitBtn) submitBtn.disabled = true;

      const payload = {
        autoId: form.dataset.autoId,
        noteId: form.dataset.noteId ? Number(form.dataset.noteId) : undefined,
        dealerId: form.dataset.dealerId ? Number(form.dataset.dealerId) : undefined,
        nombre: form.querySelector("[name='nombre']")?.value?.trim(),
        email: form.querySelector("[name='email']")?.value?.trim(),
        telefono: form.querySelector("[name='telefono']")?.value?.trim(),
        ciudad: form.querySelector("[name='ciudad']")?.value?.trim(),
        mensaje: form.querySelector("[name='mensaje']")?.value?.trim(),
        autoNombre: auto.nombre,
        concesionarioNombre: auto.concesionario.nombre,
        source: "automatch",
      };

      const result = await submitTestDrive(payload);

      if (result.ok) {
        if (feedback) {
          feedback.textContent =
            "Solicitud enviada. Un asesor te contactará en menos de 24 horas.";
          feedback.className = "test-drive-feedback is-success";
        }
        form.reset();
      } else if (feedback) {
        feedback.textContent = result.error || "Error al enviar. Intenta después.";
        feedback.className = "test-drive-feedback is-error";
      }

      if (submitBtn) submitBtn.disabled = false;
    });
  });
}

// ========== BOTÓN NUEVA BÚSQUEDA ==========
if (btnNuevaBusqueda) {
  btnNuevaBusqueda.addEventListener("click", () => {
    form.reset();
    resultado.innerHTML = "";
    loading.classList.remove("active");
    loading.hidden = true;
    btnNuevaBusqueda.hidden = true;
    lastPrefs = null;
    updateUsedFiltersVisibility();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    form.querySelector("select")?.focus();
  });
}

// ========== INICIALIZACIÓN ==========
loadData();
