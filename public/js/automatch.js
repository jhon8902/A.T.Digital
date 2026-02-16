console.log("✅ AutoMatch JS cargado correctamente.");

const form = document.getElementById("automatch-form");
const resultado = document.getElementById("resultado");

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const presupuesto =
      parseInt(document.getElementById("presupuesto").value) * 1000000;
    const uso = document.getElementById("uso").value;
    const tipo = document.getElementById("tipo").value;
    const ciudad = document.getElementById("ciudad").value.toLowerCase();

    // 🚗 Base de datos extendida con vehículos de tus secciones
    const autos = [
      // ⚡ ELÉCTRICOS
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

      // 🔄 HÍBRIDOS
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

      // 🏎️ DEPORTES/PERFORMANCE
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

      // 📱 LANZAMIENTOS
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

    // 🎯 Algoritmo inteligente de coincidencia
    let mejorAuto = null;
    let mejorMatch = 0;
    let alternativas = [];

    autos.forEach((auto) => {
      let score = 0;

      // Prioridad: Tipo de vehículo (40 puntos)
      if (auto.tipo === tipo) score += 40;

      // Precio (30 puntos)
      const diff = Math.abs(auto.precio - presupuesto);
      const maxDiff = presupuesto * 0.15;
      if (diff <= maxDiff) {
        score += 30 * (1 - diff / maxDiff);
      }

      // Uso (20 puntos)
      if (auto.uso === uso) score += 20;

      // Ciudad (10 puntos)
      if (auto.ciudad === ciudad) score += 10;

      if (score > mejorMatch) {
        if (mejorAuto) alternativas.push(mejorAuto);
        mejorMatch = score;
        mejorAuto = auto;
      } else if (score > mejorMatch - 15) {
        alternativas.push(auto);
      }
    });

    if (mejorAuto) {
      // ✅ Guardar en la base de datos
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
        }),
      })
        .then((res) => res.json())
        .then((data) => console.log("Guardado en DB ✅", data))
        .catch((err) => console.error("Error guardando ❌", err));

      // Limitar el porcentaje a máximo 100
      const matchPercentage = Math.min(mejorMatch, 100);

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
        </div>
      `;

      // Animar la barra
      setTimeout(() => {
        const fillBar = resultado.querySelector(".match-fill");
        if (fillBar) {
          fillBar.style.width = matchPercentage + "%";
        }
      }, 100);

      // Animar el porcentaje
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

// Agregar estilos de animación
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
