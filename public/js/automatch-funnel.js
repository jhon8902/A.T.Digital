const EVENT_ENDPOINTS = [
  "/api/automatch-event",
  "/.netlify/functions/automatch-event",
];

const ALLOWED_EVENTS = new Set([
  "search",
  "match_view",
  "match_empty",
  "ficha_click",
  "ficha_view",
  "tco_click",
  "whatsapp_click",
  "test_drive",
]);

function trimValue(value, max = 80) {
  if (value == null) return "";
  return String(value).trim().slice(0, max);
}

function sanitizePayload(eventName, params = {}) {
  const event = ALLOWED_EVENTS.has(eventName) ? eventName : "search";
  return {
    event,
    auto_id: trimValue(params.auto_id || params.autoId, 40),
    note_id: Number.isFinite(Number(params.note_id || params.noteId))
      ? Number(params.note_id || params.noteId)
      : null,
    dealer_id: Number.isFinite(Number(params.dealer_id || params.dealerId))
      ? Number(params.dealer_id || params.dealerId)
      : null,
    tipo: trimValue(params.tipo, 40),
    uso: trimValue(params.uso, 40),
    ciudad: trimValue(params.ciudad, 40),
    presupuesto: trimValue(params.presupuesto, 40),
    score: Number.isFinite(Number(params.score))
      ? Math.round(Number(params.score))
      : null,
    source: trimValue(params.source || "automatch", 40),
    path: trimValue(params.path || window.location.pathname, 180),
  };
}

function pushToAnalytics(payload) {
  const params = {
    event_category: "automatch",
    auto_id: payload.auto_id || undefined,
    tipo: payload.tipo || undefined,
    uso: payload.uso || undefined,
    ciudad: payload.ciudad || undefined,
    score: payload.score || undefined,
  };

  if (typeof window.gtag === "function") {
    window.gtag("event", `automatch_${payload.event}`, params);
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: `automatch_${payload.event}`,
    ...params,
  });
}

export function trackAutomatchEvent(eventName, params = {}) {
  const payload = sanitizePayload(eventName, params);
  pushToAnalytics(payload);

  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(EVENT_ENDPOINTS[0], blob)) return;
    }
  } catch {
    // fallback below
  }

  fetch(EVENT_ENDPOINTS[0], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    fetch(EVENT_ENDPOINTS[1], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  });
}

function eventFromHref(href = "") {
  if (!href) return "";
  if (href.includes("wa.me") || href.includes("whatsapp")) return "whatsapp_click";
  if (href.includes("calculadora-tco") || href.includes("tco")) return "tco_click";
  if (
    href.includes("/notas") ||
    href.includes("/noticia") ||
    href.includes("/automatch/ficha")
  ) {
    return "ficha_click";
  }
  return "";
}

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const link = target?.closest("[data-automatch-track], a");
  if (!(link instanceof HTMLElement)) return;

  const tracked = link.getAttribute("data-automatch-track") || eventFromHref(link.getAttribute("href") || "");
  if (!tracked || !ALLOWED_EVENTS.has(tracked)) return;

  trackAutomatchEvent(tracked, {
    auto_id: link.getAttribute("data-auto-id") || "",
    note_id: link.getAttribute("data-note-id") || "",
    dealer_id: link.getAttribute("data-dealer-id") || "",
    source: "automatch",
    path: window.location.pathname,
  });
});

if (typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  if (params.get("from") === "automatch") {
    trackAutomatchEvent("ficha_view", {
      source: "automatch",
      path: window.location.pathname,
    });
  }
}
