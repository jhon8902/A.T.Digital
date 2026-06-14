const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const loginForm = document.getElementById("login-form");
const btnLogout = document.getElementById("btn-logout");
const filterStatus = document.getElementById("filter-status");
const dealerName = document.getElementById("dealer-name");
const leadsTableBody = document.getElementById("leads-tbody");
const emptyState = document.getElementById("empty-state");
const commissionRateLabel = document.getElementById("commission-rate-label");

let currentDealer = null;
let allLeads = [];

function showLoginSection() {
  loginSection.style.display = "flex";
  dashboardSection.style.display = "none";
}

function showDashboardSection() {
  loginSection.style.display = "none";
  dashboardSection.style.display = "block";
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("es-CO")} COP`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-CO");
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || `Error ${response.status}`);
  }

  return data;
}

async function loadSession() {
  try {
    currentDealer = await apiRequest("/api/dealer/me");
    dealerName.textContent = currentDealer.name;
    if (commissionRateLabel) {
      commissionRateLabel.textContent = formatMoney(currentDealer.commissionRate);
    }
    showDashboardSection();
    await Promise.all([loadStats(), loadLeads()]);
  } catch {
    currentDealer = null;
    showLoginSection();
  }
}

async function loadStats() {
  const stats = await apiRequest("/api/dealer/stats");
  document.getElementById("total-leads").textContent = stats.totalLeads;
  document.getElementById("month-leads").textContent = stats.monthLeads;
  document.getElementById("total-commission").textContent = formatMoney(
    stats.totalCommission,
  );
  document.getElementById("confirmed-contacts").textContent = stats.confirmedLeads;
}

async function loadLeads() {
  const estado = filterStatus?.value || "all";
  const query = estado === "all" ? "" : `?estado=${encodeURIComponent(estado)}`;
  allLeads = await apiRequest(`/api/dealer/leads${query}`);
  renderLeads(allLeads);
}

function renderLeads(leads) {
  leadsTableBody.innerHTML = "";

  if (!leads.length) {
    leadsTableBody.innerHTML =
      '<tr class="loading-row"><td colspan="8">No hay leads para mostrar</td></tr>';
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  const rate = currentDealer?.commissionRate || 0;

  leads.forEach((lead) => {
    const row = document.createElement("tr");
    const statusClass = `status-${lead.estado}`;
    const commission =
      lead.estado === "confirmado" ? formatMoney(rate) : "-";

    row.innerHTML = `
      <td>${formatDate(lead.created_at)}</td>
      <td><strong>${lead.nombre}</strong></td>
      <td>${lead.email}</td>
      <td>${lead.telefono}</td>
      <td>${lead.auto_nombre || "-"}</td>
      <td><span class="status-badge ${statusClass}">${lead.estado}</span></td>
      <td><strong>${commission}</strong></td>
      <td>
        <div class="action-buttons">
          ${
            lead.estado !== "confirmado"
              ? `<button class="btn-small btn-confirm" data-action="confirm" data-id="${lead.id}">Confirmar</button>`
              : ""
          }
          ${
            lead.estado === "pendiente"
              ? `<button class="btn-small btn-contact" data-action="contact" data-id="${lead.id}">Contactado</button>`
              : ""
          }
          <button class="btn-small btn-view" data-action="view" data-id="${lead.id}">Ver</button>
        </div>
      </td>
    `;

    leadsTableBody.appendChild(row);
  });
}

async function updateLeadStatus(leadId, estado) {
  await apiRequest(`/api/dealer/leads/${leadId}`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
  await Promise.all([loadStats(), loadLeads()]);
}

function viewLeadDetail(leadId) {
  const lead = allLeads.find((item) => Number(item.id) === Number(leadId));
  if (!lead) return;

  const details = [
    `Cliente: ${lead.nombre}`,
    `Email: ${lead.email}`,
    `Teléfono: ${lead.telefono}`,
    `Ciudad: ${lead.ciudad || "No especificada"}`,
    `Vehículo: ${lead.auto_nombre || "-"}`,
    `Estado: ${lead.estado}`,
    `Fuente: ${lead.source || "-"}`,
    `Fecha: ${new Date(lead.created_at).toLocaleString("es-CO")}`,
    `Mensaje: ${lead.mensaje || "Sin mensaje"}`,
  ].join("\n");

  alert(details);
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("dealer-email").value;
  const password = document.getElementById("dealer-password").value;
  const submitBtn = loginForm.querySelector(".btn-login");

  try {
    if (submitBtn) submitBtn.disabled = true;
    currentDealer = await apiRequest("/api/dealer/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    dealerName.textContent = currentDealer.name;
    loginForm.reset();
    showDashboardSection();
    await Promise.all([loadStats(), loadLeads()]);
  } catch (error) {
    alert(error.message || "Credenciales inválidas");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

btnLogout?.addEventListener("click", async () => {
  try {
    await apiRequest("/api/dealer/logout", { method: "POST" });
  } catch {
    // Ignorar error de logout
  }

  currentDealer = null;
  allLeads = [];
  leadsTableBody.innerHTML = "";
  showLoginSection();
  loginForm?.reset();
});

filterStatus?.addEventListener("change", () => {
  loadLeads().catch((error) => {
    console.error(error);
    alert("No se pudieron cargar los leads.");
  });
});

leadsTableBody?.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const leadId = Number(button.dataset.id);
  const action = button.dataset.action;

  try {
    if (action === "confirm") {
      await updateLeadStatus(leadId, "confirmado");
    } else if (action === "contact") {
      await updateLeadStatus(leadId, "contactado");
    } else if (action === "view") {
      viewLeadDetail(leadId);
    }
  } catch (error) {
    alert(error.message || "No se pudo actualizar el lead.");
  }
});

loadSession();
