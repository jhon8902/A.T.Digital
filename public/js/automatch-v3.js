import { submitTestDrive } from "./test-drive-submit.js";
import { rankVehicles, buildMatchSummary } from "./automatch-match.js";

console.log("AutoMatch v3 cargado.");

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

// Cargar perfil guardado
if (userProfileForm) {
  const savedProfile = userProfile.loadProfile();
  if (savedProfile.name) {
    document.getElementById("user-name").value = savedProfile.name;
    document.getElementById("user-city").value = savedProfile.city || "";
    document.getElementById("user-age").value = savedProfile.age || "";
  }

  userProfileForm.addEventListener("change", () => {
    userProfile.saveProfile({
      name: document.getElementById("user-name").value,
      city: document.getElementById("user-city").value,
      age: document.getElementById("user-age").value
        ? parseInt(document.getElementById("user-age").value)
        : null,
    });
  });
}

// ========== FORMULARIO PRINCIPAL ==========
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Mostrar indicador de carga
    loading.hidden = false;
    loading.classList.add("active");
    resultado.innerHTML = "";

    // Simular pequeño delay para mostrar la animación de carga
    await new Promise(resolve => setTimeout(resolve, 500));

    // Obtener valores del formulario
    const presupuestoValue = document.getElementById("presupuesto").value;
    let presupuesto;

    if (presupuestoValue.includes("-")) {
      const [min, max] = presupuestoValue.split("-").map(n => parseInt(n));
      presupuesto = ((min + max) / 2) * 1000000;
    } else {
      const baseValue = parseInt(presupuestoValue.replace("+", ""));
      presupuesto = (baseValue + 50) * 1000000;
    }

    const uso = document.getElementById("uso").value;
    const tipo = document.getElementById("tipo").value;
    const condicion = document.getElementById("condicion").value;
    const ciudad = document.getElementById("ciudad").value;

    const prefs = { tipo, uso, ciudad, presupuesto, condicion };
    const userLikes = userProfile.getLikes();

    const { best, alternativas, eligibleCount } = rankVehicles(autosData, prefs, {
      applyLikesBonus: (auto, baseScore) =>
        smartAlgorithm.calculateScore(auto, baseScore, userLikes),
    });

    if (best) {
      const mejorAuto = best.vehicle;
      const matchPercentage = best.match.score;
      const specs = specsData[mejorAuto.especificaciones_id] || {};
      const matchSummary = buildMatchSummary(best.match.breakdown, prefs);

      loading.classList.remove("active");
      loading.hidden = true;

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

      btnNuevaBusqueda.hidden = false;

      setTimeout(() => {
        resultado.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } else {
      loading.classList.remove("active");
      loading.hidden = true;

      const tipoCount = autosData.filter((auto) => auto.tipo === tipo).length;
      const hint =
        tipoCount === 0
          ? `No hay vehículos ${tipo} en el catálogo todavía.`
          : `Hay ${tipoCount} ${tipo}(s), pero ninguno cumple condición, presupuesto u otros filtros.`;

      resultado.innerHTML = `
        <div class="auto-card auto-card--empty">
          <p class="no-match">No encontramos coincidencias con tu búsqueda.</p>
          <p>${hint} Prueba relajar condición o ajustar presupuesto y ciudad.</p>
          <p class="match-meta">Vehículos evaluados: ${autosData.length} · Elegibles: ${eligibleCount}</p>
        </div>
      `;
    }
  });
}

// ========== MOSTRAR RESULTADO PRINCIPAL ==========
function mostrarResultado(auto, specs, matchPercentage, breakdown = [], matchSummary = "") {
  const condicionBadge = auto.condicion === "nuevo" ? "Nuevo (0 km)" :
                         auto.condicion === "seminuevo" ? "Seminuevo" : "Usado certificado";

  const galeriaHTML = auto.galeria.map((img, idx) => `
    <img src="${img}" alt="${auto.nombre}" class="galeria-img ${idx === 0 ? 'visible' : 'hidden'}" loading="lazy">
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

  resultado.innerHTML = `
    <div class="auto-card principal" style="animation: fadeIn 0.6s ease;">
      
      <!-- GALERÍA - COLUMNA 1 (45%) -->
      <div class="auto-galeria">
        <div class="galeria-container">
          ${galeriaHTML}
          <button type="button" class="galeria-prev" aria-label="Imagen anterior"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
          <button type="button" class="galeria-next" aria-label="Imagen siguiente"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
          <div class="galeria-dots">
            ${auto.galeria.map((_, idx) => `<span class="dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>`).join("")}
          </div>
        </div>
      </div>

      <!-- INFORMACIÓN - COLUMNA 2 (55%) -->
      <div class="auto-info">
        <div class="condicion-badge ${auto.condicion}">${condicionBadge}</div>
        <h3>${auto.nombre}</h3>
        <p class="descripcion">${auto.descripcion}</p>

        <!-- SPECS PRINCIPALES -->
        <div class="specs-principales">
          <div class="spec-item">
            <span class="label">Motor</span>
            <span class="valor">${specs.motor || 'N/A'}</span>
          </div>
          <div class="spec-item">
            <span class="label">Potencia</span>
            <span class="valor">${specs.potencia || 'N/A'}</span>
          </div>
          <div class="spec-item">
            <span class="label">Autonomía</span>
            <span class="valor">${specs.autonomia || specs.autonomia_electrica || 'N/A'}</span>
          </div>
          <div class="spec-item">
            <span class="label">Precio</span>
            <span class="valor precio">$${auto.precio.toLocaleString()} COP</span>
          </div>
        </div>

        ${especsHTML}

        ${breakdownHTML}

        <!-- MATCH BAR -->
        <div class="match-bar">
          <div class="match-fill" style="width: 0%;"></div>
        </div>
        <div class="match-percentage" style="opacity: 0;">
          ${Math.round(matchPercentage)}% compatibilidad
        </div>
        <p class="match-text">${summaryText}</p>

        <!-- CONCESIONARIO -->
        <div class="concesionario-info">
          <h4><i class="fa-solid fa-store" aria-hidden="true"></i> ${auto.concesionario.nombre}</h4>
          <p><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${auto.concesionario.direccion}</p>
          <p><i class="fa-solid fa-phone" aria-hidden="true"></i> ${auto.concesionario.telefono}</p>
          <p><i class="fa-regular fa-clock" aria-hidden="true"></i> ${auto.concesionario.horario}</p>
          
          <div class="botones-contacto">
            <a href="https://wa.me/${auto.concesionario.whatsapp}?text=Hola,%20me%20interesa%20el%20${encodeURIComponent(auto.nombre)}" 
               class="btn-contact whatsapp" target="_blank">
              <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> WhatsApp
            </a>
            <a href="mailto:${auto.concesionario.email}?subject=Consulta%20sobre%20${encodeURIComponent(auto.nombre)}" 
               class="btn-contact email">
              <i class="fa-regular fa-envelope" aria-hidden="true"></i> Email
            </a>
            <a href="tel:${auto.concesionario.telefono}" class="btn-contact phone">
              <i class="fa-solid fa-phone" aria-hidden="true"></i> Llamar
            </a>
          </div>
        </div>

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
      ${alternativas.map(auto => `
        <div class="auto-alternativa">
          <img src="${auto.imagen_principal}" alt="${auto.nombre}" loading="lazy">
          <h4>${auto.nombre}</h4>
          <p class="tipo-uso">${auto.tipo} | ${auto.uso}</p>
          <p class="precio">$${auto.precio.toLocaleString()} COP</p>
          <details>
            <summary>Ver detalles</summary>
            <p>${auto.descripcion}</p>
            <a href="https://wa.me/${auto.concesionario.whatsapp}?text=Hola,%20me%20interesa%20el%20${encodeURIComponent(auto.nombre)}" 
               class="btn-contact-small whatsapp" target="_blank">
              Contactar
            </a>
          </details>
        </div>
      `).join("")}
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
    // Limpiar formulario
    form.reset();

    // Limpiar resultados
    resultado.innerHTML = "";
    loading.classList.remove("active");
    loading.hidden = true;

    // Ocultar botón de nueva búsqueda
    btnNuevaBusqueda.hidden = true;

    // Scroll a formulario
    form.scrollIntoView({ behavior: "smooth", block: "start" });

    // Focus en primer input
    form.querySelector("select").focus();
  });
}

// ========== INICIALIZACIÓN ==========
loadData();
