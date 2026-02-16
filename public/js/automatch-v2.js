console.log("✅ AutoMatch v2 cargado correctamente.");

// ========== GESTOR DE PERFIL DE USUARIO ==========
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

  getPreferences() {
    return this.profile.preferences || [];
  }
}

// ========== ALGORITMO INTELIGENTE ==========
class SmartAlgorithm {
  constructor(userProfile) {
    this.user = userProfile;
  }

  // Calcular puntuación basada en historial y perfil
  calculateScore(auto, baseScore, userLikes) {
    let score = baseScore;

    // Bonus por preferencias del perfil
    if (this.user.getPreferences().length > 0) {
      const prefs = this.user.getPreferences();
      // Ejemplo: si el auto es SUV y el usuario prefiere SUV, bonus
      if (prefs.includes("suv") && auto.tipo === "suv") score += 15;
    }

    // Bonus si ha gustado autos similares antes
    if (Object.keys(userLikes).length > 0) {
      const likedTypes = Object.values(userLikes).map((a) => a.tipo);
      if (likedTypes.includes(auto.tipo)) score += 10;

      const likedUsos = Object.values(userLikes).map((a) => a.uso);
      if (likedUsos.includes(auto.uso)) score += 5;
    }

    return Math.min(score, 100);
  }
}

// ========== GESTOR DE COMENTARIOS CON VOTACIÓN ==========
class CommentVoting {
  constructor() {
    this.votesKey = "automatchCommentVotes";
    this.votes = this.loadVotes();
  }

  loadVotes() {
    const saved = localStorage.getItem(this.votesKey);
    return saved ? JSON.parse(saved) : {};
  }

  saveVotes() {
    localStorage.setItem(this.votesKey, JSON.stringify(this.votes));
  }

  addVote(commentId) {
    if (!this.votes[commentId]) {
      this.votes[commentId] = 0;
    }
    this.votes[commentId]++;
    this.saveVotes();
    return this.votes[commentId];
  }

  getVotes(commentId) {
    return this.votes[commentId] || 0;
  }

  hasVoted(commentId) {
    return this.votes[commentId] > 0;
  }
}

// ========== COMPARTIR EN REDES ==========
function generateShareText(autoName, matchPercentage) {
  return `¡Acabo de encontrar mi AutoMatch perfecto! 🚗❤️\n\nMi match: ${autoName} (${Math.round(matchPercentage)}% compatible)\n\nPrueba tú también: `;
}

function shareWhatsApp(autoName, matchPercentage, currentUrl) {
  const text = generateShareText(autoName, matchPercentage);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + currentUrl)}`;
  window.open(whatsappUrl, "_blank");
}

function shareInstagram(autoName) {
  alert(
    `📱 Instagram:\n\nCopia este texto en tu historia:\n\n¡Encontré mi AutoMatch! 🚗❤️\n${autoName}\n\nPrueba en: [enlace a automatch]`
  );
}

function shareFacebook(autoName, matchPercentage, currentUrl) {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
  window.open(url, "_blank");
}

// ========== FORMULARIO AUTOMATCH ==========
const form = document.getElementById("automatch-form");
const userProfileForm = document.getElementById("user-profile-form");
const resultado = document.getElementById("resultado");

// Instancias globales
const userProfile = new UserProfile();
const smartAlgorithm = new SmartAlgorithm(userProfile);
const commentVoting = new CommentVoting();

// Cargar perfil guardado si existe
if (userProfileForm) {
  const savedProfile = userProfile.loadProfile();
  if (savedProfile.name) {
    document.getElementById("user-name").value = savedProfile.name;
    document.getElementById("user-city").value = savedProfile.city || "";
    document.getElementById("user-age").value = savedProfile.age || "";

    // Restaurar preferencias multiples
    if (savedProfile.preferences && savedProfile.preferences.length > 0) {
      const selectElem = document.getElementById("user-preferences");
      Array.from(selectElem.options).forEach((option) => {
        option.selected = savedProfile.preferences.includes(option.value);
      });
    }
  }

  // Guardar cambios de perfil (en tiempo real)
  userProfileForm.addEventListener("change", () => {
    const preferences = Array.from(
      document.getElementById("user-preferences").selectedOptions
    ).map((opt) => opt.value);

    userProfile.saveProfile({
      name: document.getElementById("user-name").value,
      city: document.getElementById("user-city").value,
      age: document.getElementById("user-age").value
        ? parseInt(document.getElementById("user-age").value)
        : null,
      preferences: preferences,
    });
  });
}

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const presupuesto =
      parseInt(document.getElementById("presupuesto").value) * 1000000;
    const uso = document.getElementById("uso").value;
    const tipo = document.getElementById("tipo").value;
    const ciudad = document.getElementById("ciudad").value.toLowerCase();

    // Base de datos de autos (igual que antes)
    const autos = [
      {
        id: 1,
        nombre: "Renault Megane E-Tech",
        tipo: "eléctrico",
        uso: "urbano",
        precio: 48000000,
        ciudad: "bogotá",
        imagen: "/img/renault-megane-e-tech/renault-megane-principal.webp",
        seccion: "electricos",
      },
      {
        id: 2,
        nombre: "Mini Cooper Eléctrico",
        tipo: "eléctrico",
        uso: "urbano",
        precio: 45000000,
        ciudad: "bogotá",
        imagen: "/img/mini-cooper-electrico/mini-cooper-portada.webp",
        seccion: "electricos",
      },
      {
        id: 3,
        nombre: "Peugeot e-3008",
        tipo: "eléctrico",
        uso: "familiar",
        precio: 52000000,
        ciudad: "medellín",
        imagen: "/img/peugeot-3008-electrica/carga-peugeot.webp",
        seccion: "electricos",
      },
      {
        id: 4,
        nombre: "BYD Sealion 7",
        tipo: "eléctrico",
        uso: "familiar",
        precio: 55000000,
        ciudad: "bogotá",
        imagen: "/img/byd-sealion-7/byd-sealion7-principal.webp",
        seccion: "electricos",
      },
      {
        id: 5,
        nombre: "Volvo EX90",
        tipo: "eléctrico",
        uso: "deportivo",
        precio: 80000000,
        ciudad: "bogotá",
        imagen: "/img/volvo-ex90-electrico/volvo-ex90-portada.webp",
        seccion: "electricos",
      },
      {
        id: 6,
        nombre: "Toyota Prado Híbrido",
        tipo: "híbrido",
        uso: "familiar",
        precio: 65000000,
        ciudad: "bogotá",
        imagen: "/img/toyota-prado/toyota-prado-copia.jpg",
        seccion: "hibridos",
      },
      {
        id: 7,
        nombre: "Audi Q7 Híbrida",
        tipo: "híbrido",
        uso: "familiar",
        precio: 72000000,
        ciudad: "medellín",
        imagen: "/img/audi-q7-hibrida/audi-q7-portada.webp",
        seccion: "hibridos",
      },
      {
        id: 8,
        nombre: "Hyundai Kona Híbrida",
        tipo: "híbrido",
        uso: "urbano",
        precio: 38000000,
        ciudad: "bogotá",
        imagen: "/img/kona-hibrida/kona-portada.webp",
        seccion: "hibridos",
      },
      {
        id: 9,
        nombre: "Nissan X-Trail Híbrida",
        tipo: "híbrido",
        uso: "familiar",
        precio: 52000000,
        ciudad: "cali",
        imagen: "/img/nissan-xtrail-hibrida/nissan-x-trail.webp",
        seccion: "hibridos",
      },
      {
        id: 10,
        nombre: "Ford Escape Híbrida",
        tipo: "híbrido",
        uso: "trabajo",
        precio: 48000000,
        ciudad: "bogotá",
        imagen: "/img/ford-scape-hibrida/ford-s.jpg",
        seccion: "hibridos",
      },
      {
        id: 11,
        nombre: "Subaru Forester Híbrida",
        tipo: "híbrido",
        uso: "familiar",
        precio: 50000000,
        ciudad: "bogotá",
        imagen: "/img/subaru-forester-hibrida/subaru-forester-portada.webp",
        seccion: "hibridos",
      },
      {
        id: 12,
        nombre: "Volvo CX90 Híbrida",
        tipo: "híbrido",
        uso: "familiar",
        precio: 70000000,
        ciudad: "medellín",
        imagen: "/img/volvo-cx90-hibrida/volvo-cx90-portada.webp",
        seccion: "hibridos",
      },
      {
        id: 13,
        nombre: "Ford F-150",
        tipo: "gasolina",
        uso: "trabajo",
        precio: 90000000,
        ciudad: "bogotá",
        imagen: "/img/ford-f150/ford-f150-2.jpg",
        seccion: "deportes",
      },
      {
        id: 14,
        nombre: "Ford Bronco",
        tipo: "gasolina",
        uso: "deportivo",
        precio: 85000000,
        ciudad: "medellín",
        imagen: "/img/ford-bronco/ford-bronco-portada.jpg",
        seccion: "deportes",
      },
      {
        id: 15,
        nombre: "Jeep Avenger",
        tipo: "gasolina",
        uso: "deportivo",
        precio: 42000000,
        ciudad: "bogotá",
        imagen: "/img/jeep-avenger/jeep-avenger-portada.webp",
        seccion: "deportes",
      },
      {
        id: 16,
        nombre: "BMW Concept",
        tipo: "gasolina",
        uso: "deportivo",
        precio: 120000000,
        ciudad: "bogotá",
        imagen: "/img/bmw-concept/bmw-concept-portada.webp",
        seccion: "deportes",
      },
      {
        id: 17,
        nombre: "Kia EV9",
        tipo: "eléctrico",
        uso: "familiar",
        precio: 75000000,
        ciudad: "bogotá",
        imagen: "/img/kia-ev9/kia-ev9-portada.webp",
        seccion: "lanzamientos",
      },
      {
        id: 18,
        nombre: "DFSK E5",
        tipo: "eléctrico",
        uso: "urbano",
        precio: 35000000,
        ciudad: "bogotá",
        imagen: "/img/dfsk-e5/dfsk-ultima-portada.jpg",
        seccion: "lanzamientos",
      },
      {
        id: 19,
        nombre: "BMW 330e",
        tipo: "híbrido",
        uso: "deportivo",
        precio: 65000000,
        ciudad: "medellín",
        imagen: "/img/bmw-330e/bmw.webp",
        seccion: "lanzamientos",
      },
    ];

    // Algoritmo de búsqueda MEJORADO
    const userLikes = userProfile.getLikes();
    let mejorAuto = null;
    let mejorMatch = 0;
    let alternativas = [];

    autos.forEach((auto) => {
      let score = 0;

      // Prioridad: Tipo (40)
      if (auto.tipo === tipo) score += 40;

      // Precio (30)
      const diff = Math.abs(auto.precio - presupuesto);
      const maxDiff = presupuesto * 0.15;
      if (diff <= maxDiff) {
        score += 30 * (1 - diff / maxDiff);
      }

      // Uso (20)
      if (auto.uso === uso) score += 20;

      // Ciudad (10)
      if (auto.ciudad === ciudad) score += 10;

      // 🆕 ENHANCE: Aplicar algoritmo inteligente basado en perfil e historial
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
      // Guardar en DB
      fetch("http://localhost:8888/.netlify/functions/api-automatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_id: mejorAuto.id,
          decision: mejorAuto.nombre,
          tipo: tipo,
          uso: uso,
          presupuesto: presupuesto,
          ciudad: ciudad,
          userName: userProfile.profile.name || "anónimo",
        }),
      })
        .then((res) => res.json())
        .then((data) => console.log("✅ Guardado en DB", data))
        .catch((err) => console.error("❌ Error guardando", err));

      // Guardar like en historial del usuario
      userProfile.addLike(mejorAuto.id, mejorAuto);

      const matchPercentage = Math.min(mejorMatch, 100);
      const currentUrl = window.location.origin + window.location.pathname;

      resultado.innerHTML = `
        <div class="auto-card" style="animation: fadeIn 0.6s ease;">
          <img src="${mejorAuto.imagen}" alt="${mejorAuto.nombre}" />
          <h3>${mejorAuto.nombre}</h3>
          <p><strong>Tipo:</strong> ${mejorAuto.tipo.charAt(0).toUpperCase() + mejorAuto.tipo.slice(1)} | <strong>Uso:</strong> ${mejorAuto.uso.charAt(0).toUpperCase() + mejorAuto.uso.slice(1)}</p>
          <p><strong>Precio:</strong> $${mejorAuto.precio.toLocaleString()} COP</p>
          <div class="match-bar">
            <div class="match-fill" style="width: 0%; animation: fillBar 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;"></div>
          </div>
          <div class="match-percentage" style="animation: slideUp 0.8s ease 0.3s forwards; opacity: 0;">
            ${Math.round(matchPercentage)}% ❤️
          </div>
          <span class="match-score">¡Este es tu AutoMatch perfecto!</span>
          
          <!-- 🆕 BOTONES DE COMPARTIR -->
          <div class="share-buttons">
            <button class="btn-share btn-share-whatsapp" onclick="shareWhatsApp('${mejorAuto.nombre}', ${matchPercentage}, '${currentUrl}')">
              📱 Compartir en WhatsApp
            </button>
            <button class="btn-share btn-share-instagram" onclick="shareInstagram('${mejorAuto.nombre}')">
              📷 Compartir en Instagram
            </button>
            <button class="btn-share btn-share-facebook" onclick="shareFacebook('${mejorAuto.nombre}', ${matchPercentage}, '${currentUrl}')">
              f Compartir en Facebook
            </button>
          </div>
        </div>
      `;

      // Animar barra
      setTimeout(() => {
        const fillBar = resultado.querySelector(".match-fill");
        if (fillBar) {
          fillBar.style.width = matchPercentage + "%";
        }
      }, 100);

      // Animar porcentaje
      setTimeout(() => {
        const percentage = resultado.querySelector(".match-percentage");
        if (percentage) {
          percentage.style.opacity = "1";
        }
      }, 300);
    } else {
      resultado.innerHTML = `
        <div class="auto-card">
          <p class="no-match">❌ No encontramos coincidencias exactas.</p>
          <p>Prueba ajustando tus preferencias para encontrar el vehículo ideal.</p>
        </div>
      `;
    }
  });
}

// ========== ESTILOS DE ANIMACIÓN ==========
const style = document.createElement("style");
style.textContent = `
  @keyframes fillBar {
    from {
      width: 0%;
    }
    to {
      width: var(--width, 100%);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;
document.head.appendChild(style);
