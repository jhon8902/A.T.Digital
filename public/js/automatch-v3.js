console.log("✅ AutoMatch v3 MVP optimizado cargado.");

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

// ========== CARGAR DATOS EXTERNOS ==========
async function loadData() {
  try {
    const [autosRes, specsRes] = await Promise.all([
      fetch("/data/automatch/autos.json"),
      fetch("/data/automatch/specs.json")
    ]);

    autosData = await autosRes.json();
    specsData = await specsRes.json();
    console.log("✅ Datos cargados:", autosData.length, "autos");
  } catch (error) {
    console.error("❌ Error cargando datos:", error);
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
    const ciudad = document.getElementById("ciudad").value.toLowerCase();

    // Algoritmo de búsqueda
    const userLikes = userProfile.getLikes();
    let mejorAuto = null;
    let mejorMatch = 0;
    let alternativas = [];

    autosData.forEach((auto) => {
      let score = 0;

      // Tipo: 40pts
      if (auto.tipo === tipo) score += 40;

      // Precio: 30pts
      const diff = Math.abs(auto.precio - presupuesto);
      const maxDiff = presupuesto * 0.15;
      if (diff <= maxDiff) {
        score += 30 * (1 - diff / maxDiff);
      }

      // Uso: 20pts
      if (auto.uso === uso) score += 20;

      // Ciudad: 10pts
      if (auto.ciudad === ciudad) score += 10;

      // Aplicar algoritmo inteligente
      score = smartAlgorithm.calculateScore(auto, score, userLikes);

      if (score > mejorMatch) {
        if (mejorAuto) alternativas.push(mejorAuto);
        mejorMatch = score;
        mejorAuto = auto;
      } else if (score > mejorMatch - 15) {
        alternativas.push(auto);
      }
    });

    if (mejorAuto) {
      // Guardar like en historial
      userProfile.addLike(mejorAuto.id, mejorAuto);
      const matchPercentage = Math.min(mejorMatch, 100);
      const specs = specsData[mejorAuto.especificaciones_id] || {};

      // Ocultar indicador de carga
      loading.classList.remove("active");

      // Mostrar resultado principal
      mostrarResultado(mejorAuto, specs, matchPercentage);

      // Mostrar alternativas
      if (alternativas.length > 0) {
        mostrarAlternativas(alternativas.slice(0, 3), specsData);
      }

      // Mostrar botón de nueva búsqueda
      btnNuevaBusqueda.style.display = "block";

      // Scroll automático a los resultados
      setTimeout(() => {
        resultado.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } else {
      // Ocultar indicador de carga
      loading.classList.remove("active");

      resultado.innerHTML = `
        <div class="auto-card">>
          <p class="no-match">❌ No encontramos coincidencias exactas.</p>
          <p>Prueba ajustando tus preferencias.</p>
        </div>
      `;
    }
  });
}

// ========== MOSTRAR RESULTADO PRINCIPAL ==========
function mostrarResultado(auto, specs, matchPercentage) {
  const condicionBadge = auto.condicion === "nuevo" ? "🆕 Nuevo (0 km)" :
                         auto.condicion === "seminuevo" ? "⭐ Seminuevo" : "✅ Usado Certificado";

  const galeriaHTML = auto.galeria.map((img, idx) => `
    <img src="${img}" alt="${auto.nombre}" class="galeria-img ${idx === 0 ? 'visible' : 'hidden'}" loading="lazy">
  `).join("");

  const especsHTML = specs.equipamiento ? `
    <div class="specs-section">
      <h4>⚙️ Equipamiento & Características</h4>
      <ul class="specs-list">
        ${specs.equipamiento.slice(0, 8).map(e => `<li>✓ ${e}</li>`).join("")}
      </ul>
    </div>
  ` : "";

  resultado.innerHTML = `
    <div class="auto-card principal" style="animation: fadeIn 0.6s ease;">
      
      <!-- GALERÍA - COLUMNA 1 (45%) -->
      <div class="auto-galeria">
        <div class="galeria-container">
          ${galeriaHTML}
          <button class="galeria-prev">❮</button>
          <button class="galeria-next">❯</button>
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

        <!-- MATCH BAR -->
        <div class="match-bar">
          <div class="match-fill" style="width: 0%;"></div>
        </div>
        <div class="match-percentage" style="opacity: 0;">
          ${Math.round(matchPercentage)}% ❤️
        </div>
        <p class="match-text">¡Tu AutoMatch perfecto!</p>

        <!-- CONCESIONARIO -->
        <div class="concesionario-info">
          <h4>📍 ${auto.concesionario.nombre}</h4>
          <p>📍 ${auto.concesionario.direccion}</p>
          <p>📞 ${auto.concesionario.telefono}</p>
          <p>⏰ ${auto.concesionario.horario}</p>
          
          <div class="botones-contacto">
            <a href="https://wa.me/${auto.concesionario.whatsapp}?text=Hola,%20me%20interesa%20el%20${encodeURIComponent(auto.nombre)}" 
               class="btn-contact whatsapp" target="_blank">
              💬 WhatsApp
            </a>
            <a href="mailto:${auto.concesionario.email}?subject=Consulta%20sobre%20${encodeURIComponent(auto.nombre)}" 
               class="btn-contact email">
              ✉️ Email
            </a>
            <a href="tel:${auto.concesionario.telefono}" class="btn-contact phone">
              📞 Llamar
            </a>
          </div>
        </div>

        <!-- FORMULARIO TEST DRIVE -->
        <div class="formulario-test-drive">
          <h4>🚗 Solicitar Test Drive</h4>
          <form class="form-test-drive" data-auto-id="${auto.id}">
            <input type="text" placeholder="Tu nombre" required>
            <input type="email" placeholder="Tu email" required>
            <input type="tel" placeholder="Tu teléfono" required>
            <textarea placeholder="Mensaje (opcional)"></textarea>
            <button type="submit" class="btn-submit">Solicitar Cita</button>
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
    <h3>🚙 Otras opciones que también te pueden interesar:</h3>
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
    images.forEach(img => img.classList.add("hidden"));
    images[index].classList.remove("hidden");
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
  forms.forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const autoId = form.dataset.autoId;
      const nombre = form.querySelector("input[type='text']").value;
      const email = form.querySelector("input[type='email']").value;
      const telefono = form.querySelector("input[type='tel']").value;
      const mensaje = form.querySelector("textarea").value;

      // Enviar a Netlify Function
      fetch("/.netlify/functions/api-test-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          autoId, 
          nombre, 
          email, 
          telefono, 
          mensaje,
          autoNombre: auto.nombre,
          concesionarioNombre: auto.concesionario.nombre
        }),
      })
        .then(() => {
          // Guardar lead para el dashboard del concesionario
          const dealerId = auto.concesionario.id || 1; // Asumimos ID del concesionario
          const leadData = {
            id: Date.now(),
            nombre,
            email,
            telefono,
            autoNombre: auto.nombre,
            presupuesto: document.getElementById("presupuesto")?.value,
            mensaje,
            estado: "pendiente",
            fecha: new Date().toISOString()
          };

          // Guardar en localStorage para el dashboard
          const leadsKey = `leads_dealer_${dealerId}`;
          const existingLeads = JSON.parse(localStorage.getItem(leadsKey)) || [];
          existingLeads.push(leadData);
          localStorage.setItem(leadsKey, JSON.stringify(existingLeads));

          alert("✅ Solicitud enviada. El concesionario se contactará contigo pronto");
          form.reset();
        })
        .catch(() => {
          alert("❌ Error al enviar. Por favor intenta después");
        });
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

    // Ocultar botón de nueva búsqueda
    btnNuevaBusqueda.style.display = "none";

    // Scroll a formulario
    form.scrollIntoView({ behavior: "smooth", block: "start" });

    // Focus en primer input
    form.querySelector("select").focus();
  });
}

// ========== INICIALIZACIÓN ==========
loadData();
