console.log("✅ Dashboard Concesionario cargado");

// ========== DATOS DE PRUEBA - SUSTITUIR CON BD REAL ==========
const DEALERSHIPS = [
  {
    id: 1,
    name: "Concesionario Central Bogotá",
    email: "info@central-bogota.co",
    password: "demo123", // En producción: hash
    phone: "+573001234567",
    commissionRate: 50000 // COP por lead confirmado
  },
  {
    id: 2,
    name: "AutoMatch Premium Medellín",
    email: "info@automatch-medellin.co",
    password: "demo123",
    phone: "+573107654321",
    commissionRate: 50000
  }
];

// ========== ELEMENTOS DEL DOM ==========
const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const loginForm = document.getElementById("login-form");
const btnLogout = document.getElementById("btn-logout");
const filterStatus = document.getElementById("filter-status");
const dealerName = document.getElementById("dealer-name");
const leadsTableBody = document.getElementById("leads-tbody");
const emptyState = document.getElementById("empty-state");

// ========== ESTADO GLOBAL ==========
let currentUser = JSON.parse(localStorage.getItem("currentDealerUser")) || null;
let allLeads = [];

// ========== MOSTRAR/OCULTAR SECCIONES ==========
function showLoginSection() {
  loginSection.style.display = "flex";
  dashboardSection.style.display = "none";
}

function showDashboardSection() {
  loginSection.style.display = "none";
  dashboardSection.style.display = "block";
}

// ========== LOGIN ==========
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("dealer-email").value;
  const password = document.getElementById("dealer-password").value;

  // Buscar dealer
  const dealer = DEALERSHIPS.find(d => d.email === email && d.password === password);

  if (dealer) {
    // Guardar sesión
    localStorage.setItem("currentDealerUser", JSON.stringify({
      id: dealer.id,
      name: dealer.name,
      email: dealer.email,
      phone: dealer.phone,
      commissionRate: dealer.commissionRate
    }));

    currentUser = JSON.parse(localStorage.getItem("currentDealerUser"));
    dealerName.textContent = dealer.name;

    loginForm.reset();
    loadLeads();
    showDashboardSection();
  } else {
    alert("❌ Email o contraseña incorrectos");
  }
});

// ========== LOGOUT ==========
btnLogout.addEventListener("click", () => {
  localStorage.removeItem("currentDealerUser");
  currentUser = null;
  allLeads = [];
  leadsTableBody.innerHTML = "";
  showLoginSection();
  loginForm.reset();
});

// ========== CARGAR LEADS ==========
async function loadLeads() {
  try {
    // Simulamos cargar leads desde IndexedDB o localStorage
    // En producción: fetch desde API
    const savedLeads = localStorage.getItem(`leads_dealer_${currentUser.id}`);
    allLeads = savedLeads ? JSON.parse(savedLeads) : [];

    updateStats();
    renderLeads(allLeads);
  } catch (error) {
    console.error("Error cargando leads:", error);
  }
}

// ========== ACTUALIZAR ESTADÍSTICAS ==========
function updateStats() {
  const totalLeads = allLeads.length;
  const monthLeads = allLeads.filter(l => {
    const leadDate = new Date(l.fecha);
    const today = new Date();
    return leadDate.getMonth() === today.getMonth() &&
           leadDate.getFullYear() === today.getFullYear();
  }).length;

  const confirmedLeads = allLeads.filter(l => l.estado === "confirmado").length;
  const totalCommission = confirmedLeads * currentUser.commissionRate;

  document.getElementById("total-leads").textContent = totalLeads;
  document.getElementById("month-leads").textContent = monthLeads;
  document.getElementById("total-commission").textContent = `$${totalCommission.toLocaleString()}`;
  document.getElementById("confirmed-contacts").textContent = confirmedLeads;
}

// ========== RENDERIZAR TABLA DE LEADS ==========
function renderLeads(leads) {
  leadsTableBody.innerHTML = "";

  if (leads.length === 0) {
    leadsTableBody.innerHTML = '<tr class="loading-row"><td colspan="8">No hay leads para mostrar</td></tr>';
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  leads.forEach(lead => {
    const row = document.createElement("tr");
    const statusClass = `status-${lead.estado}`;
    const comisionEstado = lead.estado === "confirmado" ?
      `$${currentUser.commissionRate.toLocaleString()}` :
      "-";

    row.innerHTML = `
      <td>${new Date(lead.fecha).toLocaleDateString("es-CO")}</td>
      <td><strong>${lead.nombre}</strong></td>
      <td>${lead.email}</td>
      <td>${lead.telefono}</td>
      <td>${lead.autoNombre}</td>
      <td>
        <span class="status-badge ${statusClass}">
          ${lead.estado}
        </span>
      </td>
      <td><strong>${comisionEstado}</strong></td>
      <td>
        <div class="action-buttons">
          ${lead.estado !== "confirmado" ? 
            `<button class="btn-small btn-confirm" onclick="confirmLead(${lead.id})">✓ Confirmar</button>` :
            ""
          }
          <button class="btn-small btn-view" onclick="viewLeadDetail(${lead.id})">Ver</button>
        </div>
      </td>
    `;
    leadsTableBody.appendChild(row);
  });
}

// ========== CONFIRMAR LEAD ==========
function confirmLead(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  if (lead && lead.estado !== "confirmado") {
    lead.estado = "confirmado";
    lead.fechaConfirmacion = new Date().toISOString();

    // Guardar cambio
    localStorage.setItem(`leads_dealer_${currentUser.id}`, JSON.stringify(allLeads));

    // Actualizar UI
    updateStats();
    renderLeads(filters());

    alert("✅ Lead confirmado. Comisión registrada.");
  }
}

// ========== VER DETALLES DEL LEAD ==========
function viewLeadDetail(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  if (lead) {
    const details = `
📋 DETALLES DEL LEAD

👤 Cliente:
   Nombre: ${lead.nombre}
   Email: ${lead.email}
   Teléfono: ${lead.telefono}
   Edad: ${lead.edad || "No especificada"}

🚗 Vehículo:
   ${lead.autoNombre}
   Presupuesto: ${lead.presupuesto || "No especificado"}

📅 Información:
   Fecha: ${new Date(lead.fecha).toLocaleString("es-CO")}
   Estado: ${lead.estado}
   
💬 Mensaje: ${lead.mensaje || "Sin mensaje"}
    `;
    alert(details);
  }
}

// ========== FILTRAR LEADS ==========
function filters() {
  const selectedStatus = filterStatus.value;
  if (selectedStatus === "all") {
    return allLeads;
  }
  return allLeads.filter(l => l.estado === selectedStatus);
}

filterStatus.addEventListener("change", () => {
  renderLeads(filters());
});

// ========== WEBHOOK PARA RECIBIR NUEVOS LEADS ==========
// Cuando el usuario envía test drive, se llama a esta función
window.addNewLead = function(leadData) {
  if (!currentUser) return;

  const newLead = {
    id: Date.now(),
    ...leadData,
    estado: "pendiente",
    fecha: new Date().toISOString()
  };

  allLeads.push(newLead);
  localStorage.setItem(`leads_dealer_${currentUser.id}`, JSON.stringify(allLeads));

  updateStats();
  renderLeads(filters());
};

// ========== SINCRONIZAR LEADS DESDE LA PÁGINA PRINCIPAL ==========
window.addEventListener("storage", (e) => {
  if (e.key === `leads_dealer_${currentUser?.id}`) {
    allLeads = JSON.parse(e.newValue) || [];
    updateStats();
    renderLeads(filters());
  }
});

// ========== INICIALIZACIÓN ==========
if (currentUser) {
  dealerName.textContent = currentUser.name;
  showDashboardSection();
  loadLeads();
} else {
  showLoginSection();
}
