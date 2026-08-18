(function () {
  const form = document.getElementById("noteForm");
  const msg = document.getElementById("msg");
  const editNoteIdInput = document.getElementById("editNoteId");
  const loadNoteBtn = document.getElementById("loadNoteBtn");
  const deleteNoteBtn = document.getElementById("deleteNoteBtn");
  const exitEditBtn = document.getElementById("exitEditBtn");
  const editModeLabel = document.getElementById("editModeLabel");
  const submitNoteBtn = document.getElementById("submitNoteBtn");
  const formHeaderTitle = document.querySelector(".form-header h1");
  const categoryField = document.getElementById("categoryField");
  const automatchModeHint = document.getElementById("automatchModeHint");
  const contentFieldGroup = document.getElementById("contentFieldGroup");
  const automatchTextGroup = document.getElementById("automatchTextGroup");
  const automatchCatalogGroup = document.getElementById("automatchCatalogGroup");
  const contentFieldLabel = document.getElementById("contentFieldLabel");
  const cloudinaryFilesInput = document.getElementById("cloudinaryFiles");
  const uploadCloudinaryBtn = document.getElementById("uploadCloudinaryBtn");
  const cloudinaryQueue = document.getElementById("cloudinaryQueue");
  const cloudinaryStartSlot = document.getElementById("cloudinaryStartSlot");
  const cloudinaryFillEmptyOnly = document.getElementById("cloudinaryFillEmptyOnly");
  const cloudinaryVideoFilesInput = document.getElementById("cloudinaryVideoFiles");
  const uploadCloudinaryVideoBtn = document.getElementById("uploadCloudinaryVideoBtn");
  const cloudinaryVideoQueue = document.getElementById("cloudinaryVideoQueue");
  const cloudinaryVideoStartSlot = document.getElementById("cloudinaryVideoStartSlot");
  const cloudinaryVideoFillEmptyOnly = document.getElementById(
    "cloudinaryVideoFillEmptyOnly"
  );
  const cloudinaryVideoProgressWrap = document.getElementById(
    "cloudinaryVideoProgressWrap"
  );
  const cloudinaryVideoProgress = document.getElementById("cloudinaryVideoProgress");
  const cloudinaryVideoProgressLabel = document.getElementById(
    "cloudinaryVideoProgressLabel"
  );
  const imagePreviewStrip = document.getElementById("imagePreviewStrip");
  const publishMode = document.getElementById("publishMode");
  const scheduledAtGroup = document.getElementById("scheduledAtGroup");
  const scheduledAtInput = document.getElementById("scheduledAt");
  const scheduleStatus = document.getElementById("scheduleStatus");
  const pruebasSoloVideoField = document.getElementById("pruebasSoloVideoField");
  const PRUEBAS_SOLO_META = /<!--PRUEBAS_SOLO:1-->/i;

  if (!(form instanceof HTMLFormElement)) return;

  let editingNoteId = "";
  let selectedCloudinaryFiles = [];
  let selectedCloudinaryVideos = [];
  let isPopulatingForm = false;
  let loadedScheduledAt = "";

  const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
  const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
  // Cloudinary solo exige chunks por encima de 100 MB; debajo subimos en una sola petición.
  const VIDEO_SIMPLE_UPLOAD_MAX = 95 * 1024 * 1024;
  const VIDEO_CHUNK_BYTES = 20 * 1024 * 1024;
  const VIDEO_FIELD_NAMES = [
    "video1",
    "video2",
    "video3",
    "video4",
    "video5",
    "video6",
    "video7",
  ];
  const VIDEO_ACCEPT_RE = /\.(mp4|webm|mov)$/i;

  const editableFields = [
    "editor",
    "title",
    "subtitle",
    "category",
    "source_scope",
    "content",
    "image1",
    "image2",
    "image3",
    "image4",
    "image5",
    "image6",
    "video1",
    "video2",
    "video3",
    "video4",
    "video5",
    "video6",
    "video7",
    "spec_segmento",
    "spec_origen",
    "spec_precio_estimado",
    "spec_versiones",
    "spec_motorizacion",
    "spec_potencia_hp",
    "spec_torque_nm",
    "spec_bateria_autonomia",
    "spec_bateria_kwh",
    "spec_autonomia_km",
    "spec_carga",
    "spec_carga_ac_kw",
    "spec_carga_dc_kw",
    "spec_aceleracion_0_100",
    "spec_seguridad",
    "spec_equipamiento",
    "spec_pros",
    "spec_contras",
    "spec_competidores",
    "spec_traccion",
    "spec_precio_cop",
    "automatch_tipo",
    "automatch_uso",
    "automatch_condicion",
    "automatch_ciudad",
    "automatch_precio_cop",
    "texto_img2_linea1",
    "texto_img3_linea1",
    "texto_img4_linea1",
    "texto_img5_linea1",
    "texto_img6_linea1",
  ];

  const SPEC_FIELD_NAMES = editableFields.filter(function (name) {
    return name.indexOf("spec_") === 0;
  });

  const SPEC_FIELD_SET = new Set(SPEC_FIELD_NAMES);

  const specImportText = document.getElementById("specImportText");
  const specImportBtn = document.getElementById("specImportBtn");
  const specImportClearSpecBtn = document.getElementById("specImportClearSpecBtn");
  const specImportOverwrite = document.getElementById("specImportOverwrite");
  const specImportStatus = document.getElementById("specImportStatus");

  function byName(name) {
    return form.querySelector('[name="' + name + '"]');
  }

  function setFieldValue(name, value) {
    const el = byName(name);
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    ) {
      el.value = value;
    }
  }

  function getFieldValue(name) {
    const el = byName(name);
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    ) {
      return el.value;
    }
    return "";
  }

  const DRAFT_STORAGE_KEY = "atd.formulario.draft.v1";
  const DRAFT_TTL_MS = 60 * 60 * 1000;
  const DRAFT_MAX_BYTES = 400 * 1024;
  const DRAFT_SAVE_DEBOUNCE_MS = 400;
  const DRAFT_CONTENT_MAX = 120000;
  const DRAFT_FIELD_MAX = 20000;
  let draftSaveTimer = null;

  function sanitizeDraftString(value, maxLen) {
    if (typeof value !== "string") return "";
    if (value.length > maxLen) return value.slice(0, maxLen);
    return value;
  }

  function draftHasContent(fields, noteId) {
    if (noteId && /^\d+$/.test(String(noteId))) return true;
    if (!fields || typeof fields !== "object") return false;

    return editableFields.some(function (name) {
      if (name === "editor" || name === "source_scope" || name === "category") {
        return false;
      }
      return String(fields[name] || "").trim() !== "";
    });
  }

  function collectDraft() {
    const fields = {};
    editableFields.forEach(function (name) {
      fields[name] = getFieldValue(name);
    });

    return {
      v: 1,
      savedAt: Date.now(),
      editingNoteId: editingNoteId || "",
      publishMode:
        publishMode instanceof HTMLSelectElement ? publishMode.value : "now",
      scheduledAt:
        scheduledAtInput instanceof HTMLInputElement ? scheduledAtInput.value : "",
      loadedScheduledAt: loadedScheduledAt || "",
      pruebasSoloVideo: isPruebasSoloVideoMode(),
      fields: fields,
    };
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (_error) {
      /* modo privado u origen restringido */
    }
  }

  function saveDraftNow() {
    if (isPopulatingForm) return;

    const draft = collectDraft();
    if (!draftHasContent(draft.fields, draft.editingNoteId)) {
      clearDraft();
      return;
    }

    try {
      const serialized = JSON.stringify(draft);
      if (serialized.length > DRAFT_MAX_BYTES) return;
      window.localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
    } catch (_error) {
      /* cuota llena o storage bloqueado */
    }
  }

  function scheduleDraftSave() {
    if (isPopulatingForm) return;
    if (draftSaveTimer) window.clearTimeout(draftSaveTimer);
    draftSaveTimer = window.setTimeout(saveDraftNow, DRAFT_SAVE_DEBOUNCE_MS);
  }

  function readDraft() {
    let raw = "";
    try {
      raw = window.localStorage.getItem(DRAFT_STORAGE_KEY) || "";
    } catch (_error) {
      return null;
    }

    if (!raw) return null;

    try {
      const draft = JSON.parse(raw);
      if (!draft || draft.v !== 1 || typeof draft !== "object") {
        clearDraft();
        return null;
      }

      const savedAt = Number(draft.savedAt);
      if (!Number.isFinite(savedAt) || Date.now() - savedAt > DRAFT_TTL_MS) {
        clearDraft();
        return null;
      }

      if (!draftHasContent(draft.fields, draft.editingNoteId)) {
        clearDraft();
        return null;
      }

      return draft;
    } catch (_error) {
      clearDraft();
      return null;
    }
  }

  function restoreDraft(draft) {
    if (!draft || !draft.fields || typeof draft.fields !== "object") return false;

    isPopulatingForm = true;
    try {
      editableFields.forEach(function (name) {
        if (!Object.prototype.hasOwnProperty.call(draft.fields, name)) return;
        const maxLen = name === "content" ? DRAFT_CONTENT_MAX : DRAFT_FIELD_MAX;
        setFieldValue(name, sanitizeDraftString(draft.fields[name], maxLen));
      });

      if (pruebasSoloVideoField instanceof HTMLInputElement) {
        pruebasSoloVideoField.checked = Boolean(draft.pruebasSoloVideo);
      }

      if (
        publishMode instanceof HTMLSelectElement &&
        (draft.publishMode === "schedule" || draft.publishMode === "now")
      ) {
        publishMode.value = draft.publishMode;
      }

      if (
        scheduledAtInput instanceof HTMLInputElement &&
        typeof draft.scheduledAt === "string"
      ) {
        scheduledAtInput.value = sanitizeDraftString(draft.scheduledAt, 40);
      }

      loadedScheduledAt =
        typeof draft.loadedScheduledAt === "string" ? draft.loadedScheduledAt : "";

      const noteId = String(draft.editingNoteId || "").trim();
      if (/^\d+$/.test(noteId)) {
        if (editNoteIdInput instanceof HTMLInputElement) {
          editNoteIdInput.value = noteId;
        }
        setMode(true, noteId);
      } else {
        setMode(false, "");
      }

      applyCategoryMode({ preserveContent: true });
      applyPublishMode();
      renderImagePreviews();
      return true;
    } finally {
      isPopulatingForm = false;
    }
  }

  function formatDraftAge(savedAt) {
    const minutes = Math.max(1, Math.round((Date.now() - savedAt) / 60000));
    if (minutes < 2) return "hace un momento";
    return "hace " + String(minutes) + " min";
  }

  function initDraftPersistence() {
    const urlId = new URLSearchParams(window.location.search).get("id");
    const draft = readDraft();
    const draftId = draft ? String(draft.editingNoteId || "").trim() : "";
    let restored = false;

    if (urlId && /^\d+$/.test(urlId)) {
      if (editNoteIdInput instanceof HTMLInputElement) {
        editNoteIdInput.value = urlId;
      }

      if (draft && draftId === String(urlId) && restoreDraft(draft)) {
        restored = true;
      } else {
        loadNoteForEdit();
      }
    } else if (draft && restoreDraft(draft)) {
      restored = true;
    }

    if (restored) {
      setMessage(
        "Recuperamos tu borrador (" +
          formatDraftAge(draft.savedAt) +
          "). Se guarda solo en este navegador durante 1 hora.",
        "#334155"
      );
      saveDraftNow();
    }

    form.addEventListener("input", scheduleDraftSave);
    form.addEventListener("change", scheduleDraftSave);

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") saveDraftNow();
    });
    window.addEventListener("pagehide", saveDraftNow);
  }

  function normalizeSpecImportValue(raw) {
    const value = String(raw == null ? "" : raw).trim();
    if (!value) return "";
    if (/^\(dejar\s+vac[ií]o\)$/i.test(value)) return "";
    if (/^dejar\s+vac[ií]o$/i.test(value)) return "";
    return value;
  }

  function parseSpecImportText(text) {
    const parsed = {};
    let trimmed = String(text || "").trim();
    if (!trimmed) return parsed;

    trimmed = trimmed
      .replace(/^```[\w-]*\s*/gm, "")
      .replace(/```\s*$/gm, "")
      .trim();

    if (trimmed.charAt(0) === "{") {
      try {
        const obj = JSON.parse(trimmed);
        Object.keys(obj).forEach(function (key) {
          const normalizedKey = String(key).trim().toLowerCase();
          if (SPEC_FIELD_SET.has(normalizedKey)) {
            parsed[normalizedKey] = normalizeSpecImportValue(obj[key]);
          }
        });
        return parsed;
      } catch (_error) {
        /* continuar con formato línea por línea */
      }
    }

    trimmed.split(/\r?\n/).forEach(function (line) {
      let clean = String(line || "").trim();
      if (!clean) return;
      clean = clean.replace(/^[-*•]\s+/, "");
      const colonIndex = clean.indexOf(":");
      if (colonIndex < 1) return;
      const key = clean.slice(0, colonIndex).trim().toLowerCase();
      if (!SPEC_FIELD_SET.has(key)) return;
      parsed[key] = normalizeSpecImportValue(clean.slice(colonIndex + 1));
    });

    return parsed;
  }

  function setSpecImportStatus(text, kind) {
    if (!(specImportStatus instanceof HTMLElement)) return;
    specImportStatus.textContent = text;
    specImportStatus.classList.remove("is-ok", "is-error");
    if (kind === "ok") specImportStatus.classList.add("is-ok");
    if (kind === "error") specImportStatus.classList.add("is-error");
  }

  function clearSpecFields() {
    SPEC_FIELD_NAMES.forEach(function (name) {
      setFieldValue(name, "");
    });
  }

  function applySpecImport() {
    if (!(specImportText instanceof HTMLTextAreaElement)) return;

    const parsed = parseSpecImportText(specImportText.value);
    const keys = Object.keys(parsed);
    if (!keys.length) {
      setSpecImportStatus(
        "No se reconocieron campos. Usa líneas como spec_segmento: SUV mediana",
        "error",
      );
      return;
    }

    const overwrite =
      specImportOverwrite instanceof HTMLInputElement &&
      specImportOverwrite.checked;

    let applied = 0;
    let skipped = 0;

    keys.forEach(function (key) {
      if (!overwrite && String(getFieldValue(key) || "").trim()) {
        skipped += 1;
        return;
      }
      setFieldValue(key, parsed[key]);
      applied += 1;
    });
    saveDraftNow();

    let message =
      applied === 1
        ? "1 campo actualizado."
        : applied + " campos actualizados.";
    if (skipped > 0) {
      message +=
        " " +
        skipped +
        " omitido(s) porque ya tenían texto (activa «Sobrescribir» para forzar).";
    }
    setSpecImportStatus(message, "ok");
  }

  function initSpecImport() {
    if (specImportBtn instanceof HTMLButtonElement) {
      specImportBtn.addEventListener("click", applySpecImport);
    }
    if (specImportClearSpecBtn instanceof HTMLButtonElement) {
      specImportClearSpecBtn.addEventListener("click", function () {
        clearSpecFields();
        setSpecImportStatus("Resumen técnico vaciado.", "ok");
        saveDraftNow();
      });
    }
  }

  function setMessage(text, color) {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = color;
  }

  function isAutomatchCategory(value) {
    return String(value || "").trim().toLowerCase() === "automatch";
  }

  function isPruebasSoloVideoMode() {
    return (
      pruebasSoloVideoField instanceof HTMLInputElement &&
      pruebasSoloVideoField.checked
    );
  }

  function stripPruebasSoloMetaFromContent(content) {
    return String(content || "")
      .replace(PRUEBAS_SOLO_META, "")
      .trim();
  }

  function applyPruebasSoloMode() {
    const soloMode = isPruebasSoloVideoMode();
    const automatchMode = isAutomatchCategory(getFieldValue("category"));
    const contentField = byName("content");
    const categoryEl = byName("category");
    const video1Field = byName("video1");
    const soloLabel =
      pruebasSoloVideoField instanceof HTMLInputElement
        ? pruebasSoloVideoField.closest(".pruebas-solo-checkbox")
        : null;

    if (pruebasSoloVideoField instanceof HTMLInputElement) {
      pruebasSoloVideoField.disabled = automatchMode;
    }

    if (soloLabel instanceof HTMLElement) {
      soloLabel.hidden = automatchMode;
    }

    if (automatchMode) {
      if (pruebasSoloVideoField instanceof HTMLInputElement) {
        pruebasSoloVideoField.checked = false;
      }
      return;
    }

    if (soloMode) {
      if (categoryEl instanceof HTMLSelectElement && !isPopulatingForm) {
        categoryEl.value = "pruebas";
      }

      if (contentFieldGroup instanceof HTMLElement) {
        contentFieldGroup.hidden = true;
        contentFieldGroup.style.display = "none";
      }

      if (contentField instanceof HTMLTextAreaElement) {
        contentField.required = false;
        contentField.disabled = false;
      }

      if (video1Field instanceof HTMLInputElement) {
        video1Field.required = true;
      }
      return;
    }

    if (video1Field instanceof HTMLInputElement) {
      video1Field.required = false;
    }
  }

  function setBlockEnabled(block, enabled) {
    const fields = block.querySelectorAll("input, textarea, select, button");
    fields.forEach(function (field) {
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement ||
        field instanceof HTMLSelectElement ||
        field instanceof HTMLButtonElement
      ) {
        field.disabled = !enabled;
      }
    });
  }

  function setFieldRequired(name, required) {
    const el = byName(name);
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
      el.required = required;
    }
  }

  function applyCategoryMode(options) {
    const preserveContent = options && options.preserveContent;
    const categoryValue = getFieldValue("category");
    const contentField = byName("content");
    const subtitleField = byName("subtitle");
    const fullNoteBlocks = form.querySelectorAll(".full-note-only");
    const automatchMode = isAutomatchCategory(categoryValue);

    if (automatchModeHint instanceof HTMLElement) {
      automatchModeHint.hidden = !automatchMode;
    }

    if (contentFieldGroup instanceof HTMLElement) {
      contentFieldGroup.hidden = false;
      contentFieldGroup.style.display = "block";
    }

    if (contentField instanceof HTMLTextAreaElement) {
      contentField.required = !automatchMode;
      contentField.disabled = false;
      if (automatchMode) {
        contentField.placeholder =
          "Opcional. Si lo dejas vacío, la ficha muestra hero + resumen técnico + galería. Para bloques con imagen: Titulo: Encabezado | Texto. Separa bloques con línea en blanco.";
      } else {
        contentField.placeholder =
          "Escribe el cuerpo de la nota. Separa cada sección con una línea en blanco.";
      }
    }

    if (contentFieldLabel instanceof HTMLElement) {
      contentFieldLabel.textContent = automatchMode
        ? "Párrafos de la ficha (opcional)"
        : "Contenido";
    }

    if (subtitleField instanceof HTMLInputElement) {
      subtitleField.required = automatchMode;
      if (automatchMode) {
        subtitleField.placeholder = "Descripcion corta para la tarjeta del carrusel";
      } else {
        subtitleField.placeholder = "Subtítulo";
      }
    }

    if (automatchTextGroup instanceof HTMLElement) {
      automatchTextGroup.hidden = !automatchMode;
      setBlockEnabled(automatchTextGroup, automatchMode);
    }

    if (automatchCatalogGroup instanceof HTMLElement) {
      automatchCatalogGroup.hidden = !automatchMode;
      setBlockEnabled(automatchCatalogGroup, automatchMode);
    }

    setFieldRequired("automatch_tipo", automatchMode);
    setFieldRequired("automatch_uso", automatchMode);
    setFieldRequired("automatch_precio_cop", automatchMode);

    fullNoteBlocks.forEach(function (block) {
      if (block instanceof HTMLElement) {
        block.hidden = automatchMode;
        setBlockEnabled(block, !automatchMode);
      }
    });

    applyPruebasSoloMode();
  }

  function clearSelectedCloudinaryFiles() {
    selectedCloudinaryFiles = [];
  }

  function moveSelectedFile(fromIndex, toIndex) {
    if (
      toIndex < 0 ||
      toIndex >= selectedCloudinaryFiles.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const movedFile = selectedCloudinaryFiles.splice(fromIndex, 1)[0];
    selectedCloudinaryFiles.splice(toIndex, 0, movedFile);
    renderCloudinaryQueue();
  }

  function removeSelectedFile(index) {
    selectedCloudinaryFiles.splice(index, 1);
    renderCloudinaryQueue();
  }

  function renderImagePreviews() {
    if (!(imagePreviewStrip instanceof HTMLElement)) return;

    imagePreviewStrip.innerHTML = "";
    const slots = [];

    for (let i = 1; i <= 6; i += 1) {
      const url = getFieldValue("image" + String(i)).trim();
      if (!url) continue;
      slots.push({ index: i, url: url });
    }

    if (slots.length === 0) {
      imagePreviewStrip.hidden = true;
      return;
    }

    imagePreviewStrip.hidden = false;

    slots.forEach(function (slot) {
      const figure = document.createElement("figure");
      figure.className = "image-preview-item";

      const caption = document.createElement("figcaption");
      caption.textContent = "Imagen " + String(slot.index);

      const img = document.createElement("img");
      img.src = slot.url;
      img.alt = "Vista previa imagen " + String(slot.index);
      img.loading = "lazy";
      img.decoding = "async";

      figure.appendChild(img);
      figure.appendChild(caption);
      imagePreviewStrip.appendChild(figure);
    });
  }

  function bindImagePreviewListeners() {
    getImageFields().forEach(function (field) {
      field.addEventListener("input", renderImagePreviews);
      field.addEventListener("change", renderImagePreviews);
    });
  }

  function renderCloudinaryQueue() {
    if (!(cloudinaryQueue instanceof HTMLElement)) return;

    cloudinaryQueue.innerHTML = "";

    if (selectedCloudinaryFiles.length === 0) {
      cloudinaryQueue.hidden = true;
      return;
    }

    cloudinaryQueue.hidden = false;

    selectedCloudinaryFiles.forEach(function (file, index) {
      const item = document.createElement("div");
      item.className = "cloudinary-queue-item";

      const position = document.createElement("span");
      position.className = "cloudinary-queue-position";
      position.textContent = String(index + 1);

      const name = document.createElement("span");
      name.className = "cloudinary-queue-name";
      name.textContent = file.name;
      name.title = file.name;

      const actions = document.createElement("div");
      actions.className = "cloudinary-queue-actions";

      const upButton = document.createElement("button");
      upButton.type = "button";
      upButton.className = "cloudinary-queue-btn btn-light";
      upButton.textContent = "Subir";
      upButton.disabled = index === 0;
      upButton.addEventListener("click", function () {
        moveSelectedFile(index, index - 1);
      });

      const downButton = document.createElement("button");
      downButton.type = "button";
      downButton.className = "cloudinary-queue-btn btn-light";
      downButton.textContent = "Bajar";
      downButton.disabled = index === selectedCloudinaryFiles.length - 1;
      downButton.addEventListener("click", function () {
        moveSelectedFile(index, index + 1);
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "cloudinary-queue-btn btn-danger";
      removeButton.textContent = "Quitar";
      removeButton.addEventListener("click", function () {
        removeSelectedFile(index);
      });

      actions.appendChild(upButton);
      actions.appendChild(downButton);
      actions.appendChild(removeButton);

      item.appendChild(position);
      item.appendChild(name);
      item.appendChild(actions);
      cloudinaryQueue.appendChild(item);
    });
  }

  function getImageFields() {
    return ["image1", "image2", "image3", "image4", "image5", "image6"]
      .map(byName)
      .filter(function (input) {
        return input instanceof HTMLInputElement;
      });
  }

  function findFirstEmptyImageField() {
    const fields = getImageFields();
    for (let i = 0; i < fields.length; i += 1) {
      const value = fields[i].value.trim();
      if (!value) {
        return fields[i];
      }
    }
    return null;
  }

  function getUploadTargetForFile(fileIndex) {
    const fields = getImageFields();
    const startIndex =
      cloudinaryStartSlot instanceof HTMLSelectElement
        ? Number.parseInt(cloudinaryStartSlot.value, 10) - 1
        : 0;
    const fillEmptyOnly =
      cloudinaryFillEmptyOnly instanceof HTMLInputElement &&
      cloudinaryFillEmptyOnly.checked;

    if (fillEmptyOnly) {
      return findFirstEmptyImageField();
    }

    return fields[startIndex + fileIndex] || null;
  }

  function formatScheduledAtForInput(value) {
    if (!value) return "";
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return "";

    const pad = function (part) {
      return String(part).padStart(2, "0");
    };

    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes())
    );
  }

  function isScheduledForFuture(value) {
    if (!value) return false;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return false;
    return date.getTime() > Date.now();
  }

  function applyPublishMode() {
    const scheduleMode =
      publishMode instanceof HTMLSelectElement &&
      publishMode.value === "schedule";

    if (scheduledAtGroup instanceof HTMLElement) {
      scheduledAtGroup.hidden = !scheduleMode;
    }

    if (scheduledAtInput instanceof HTMLInputElement) {
      scheduledAtInput.required = scheduleMode;
    }

    updateScheduleStatus();
  }

  function updateScheduleStatus() {
    if (!(scheduleStatus instanceof HTMLElement)) return;

    const scheduleMode =
      publishMode instanceof HTMLSelectElement &&
      publishMode.value === "schedule";
    const scheduledValue =
      scheduledAtInput instanceof HTMLInputElement
        ? scheduledAtInput.value
        : loadedScheduledAt;

    if (!editingNoteId || !scheduledValue) {
      scheduleStatus.hidden = true;
      scheduleStatus.textContent = "";
      return;
    }

    if (isScheduledForFuture(scheduledValue)) {
      scheduleStatus.hidden = false;
      scheduleStatus.textContent =
        "Esta nota está programada y aún no es visible al público.";
      return;
    }

    if (scheduleMode && scheduledValue && editingNoteId) {
      const pastDate = new Date(scheduledValue);
      if (!Number.isNaN(pastDate.getTime()) && pastDate.getTime() <= Date.now()) {
        scheduleStatus.hidden = false;
        scheduleStatus.textContent =
          "Fecha de publicación guardada: " +
          pastDate.toLocaleString("es-CO") +
          ". Se conserva al actualizar la nota.";
        return;
      }
    }

    if (scheduleMode && scheduledValue) {
      scheduleStatus.hidden = false;
      scheduleStatus.textContent =
        "La nota se publicará automáticamente en la fecha indicada.";
      return;
    }

    scheduleStatus.hidden = true;
    scheduleStatus.textContent = "";
  }

  function htmlToPlainText(html) {
    if (!html) return "";

    let text = String(html);
    text = text.replace(/<!--AUTOMATCH_META:[^>]*-->/gi, "");
    text = text.replace(/<\/(p|div|h[1-6]|li|blockquote)\s*>/gi, "\n");
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<li[^>]*>/gi, "• ");
    text = text.replace(/<[^>]+>/g, "");

    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    text = textarea.value;

    return text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function stripAutomatchMetaFromContent(content) {
    return String(content || "").replace(/<!--AUTOMATCH_META:[^>]*-->/gi, "").trim();
  }

  async function uploadFileToCloudinary(file, cloudName, uploadPreset, folder) {
    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Falta configurar PUBLIC_CLOUDINARY_CLOUD_NAME y PUBLIC_CLOUDINARY_UPLOAD_PRESET",
      );
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Solo se permiten archivos de imagen");
    }

    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(
        "La imagen supera 8 MB (" +
          formatBytes(file.size) +
          "). Comprímela o súbela en Media Library y pega la URL.",
      );
    }

    const endpoint =
      "https://api.cloudinary.com/v1_1/" +
      encodeURIComponent(cloudName) +
      "/image/upload";
    const formData = new FormData();
    formData.append("file", file, file.name || "nota.jpg");
    formData.append("upload_preset", uploadPreset);

    const targetFolder = String(folder || "").trim();
    if (targetFolder) {
      formData.append("folder", targetFolder);
    }

    const payload = await xhrPostFormData(endpoint, formData, null, null, {
      allowPartial: false,
    });
    const url = resolveCloudinaryMediaUrl(payload, cloudName);
    if (!url) {
      throw new Error(
        "Cloudinary respondió sin URL. Revisa que el preset unsigned permita imágenes.",
      );
    }

    return url;
  }

  async function uploadSelectedImages() {
    if (selectedCloudinaryFiles.length === 0) {
      setMessage("Selecciona al menos una imagen para subir", "red");
      return;
    }

    const cloudName = (form.dataset.cloudinaryCloudName || "").trim();
    const uploadPreset = (form.dataset.cloudinaryUploadPreset || "").trim();
    const folder = (form.dataset.cloudinaryFolder || "").trim();

    if (!cloudName || !uploadPreset) {
      setMessage(
        "Falta configurar Cloudinary: PUBLIC_CLOUDINARY_CLOUD_NAME y PUBLIC_CLOUDINARY_UPLOAD_PRESET",
        "red"
      );
      return;
    }

    if (uploadCloudinaryBtn instanceof HTMLButtonElement) {
      uploadCloudinaryBtn.disabled = true;
      uploadCloudinaryBtn.textContent = "Subiendo...";
    }

    let uploadedCount = 0;

    try {
      for (let i = 0; i < selectedCloudinaryFiles.length; i += 1) {
        const targetField = getUploadTargetForFile(i);

        if (!targetField) break;

        const secureUrl = await uploadFileToCloudinary(
          selectedCloudinaryFiles[i],
          cloudName,
          uploadPreset,
          folder
        );
        targetField.value = secureUrl;
        uploadedCount += 1;
        renderImagePreviews();
        saveDraftNow();
        setMessage(
          "Subidas " + String(uploadedCount) + " de " + String(selectedCloudinaryFiles.length),
          "#334155"
        );
      }

      if (uploadedCount === 0) {
        setMessage(
          "No hay slots disponibles para las imágenes seleccionadas. Cambia el modo de subida o limpia un campo.",
          "#b45309"
        );
        return;
      }

      setMessage(
        "Carga completada: " + String(uploadedCount) + " imagen(es) agregadas",
        "green"
      );
      if (cloudinaryFilesInput instanceof HTMLInputElement) {
        cloudinaryFilesInput.value = "";
      }
      clearSelectedCloudinaryFiles();
      renderCloudinaryQueue();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Error desconocido";
      setMessage("Error al subir a Cloudinary: " + detail, "red");
    } finally {
      if (uploadCloudinaryBtn instanceof HTMLButtonElement) {
        uploadCloudinaryBtn.disabled = false;
        uploadCloudinaryBtn.textContent = "Subir a Cloudinary y completar campos";
      }
    }
  }

  function clearSelectedCloudinaryVideos() {
    selectedCloudinaryVideos = [];
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    return value.toFixed(unit === 0 ? 0 : 1) + " " + units[unit];
  }

  function isAcceptedVideoFile(file) {
    if (!(file instanceof File)) return false;
    if (file.type && file.type.startsWith("video/")) return true;
    return VIDEO_ACCEPT_RE.test(file.name || "");
  }

  function renderCloudinaryVideoQueue() {
    if (!(cloudinaryVideoQueue instanceof HTMLElement)) return;

    cloudinaryVideoQueue.innerHTML = "";

    if (selectedCloudinaryVideos.length === 0) {
      cloudinaryVideoQueue.hidden = true;
      return;
    }

    cloudinaryVideoQueue.hidden = false;

    selectedCloudinaryVideos.forEach(function (file, index) {
      const item = document.createElement("div");
      item.className = "cloudinary-queue-item";

      const position = document.createElement("span");
      position.className = "cloudinary-queue-position";
      position.textContent = String(index + 1);

      const name = document.createElement("span");
      name.className = "cloudinary-queue-name";
      name.textContent =
        (file.name || "video") + " · " + formatBytes(file.size || 0);

      const actions = document.createElement("div");
      actions.className = "cloudinary-queue-actions";

      const upButton = document.createElement("button");
      upButton.type = "button";
      upButton.className = "cloudinary-queue-btn btn-light";
      upButton.textContent = "↑";
      upButton.disabled = index === 0;
      upButton.addEventListener("click", function () {
        if (index === 0) return;
        const swap = selectedCloudinaryVideos[index - 1];
        selectedCloudinaryVideos[index - 1] = selectedCloudinaryVideos[index];
        selectedCloudinaryVideos[index] = swap;
        renderCloudinaryVideoQueue();
      });

      const downButton = document.createElement("button");
      downButton.type = "button";
      downButton.className = "cloudinary-queue-btn btn-light";
      downButton.textContent = "↓";
      downButton.disabled = index === selectedCloudinaryVideos.length - 1;
      downButton.addEventListener("click", function () {
        if (index >= selectedCloudinaryVideos.length - 1) return;
        const swap = selectedCloudinaryVideos[index + 1];
        selectedCloudinaryVideos[index + 1] = selectedCloudinaryVideos[index];
        selectedCloudinaryVideos[index] = swap;
        renderCloudinaryVideoQueue();
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "cloudinary-queue-btn btn-danger";
      removeButton.textContent = "Quitar";
      removeButton.addEventListener("click", function () {
        selectedCloudinaryVideos.splice(index, 1);
        renderCloudinaryVideoQueue();
      });

      actions.appendChild(upButton);
      actions.appendChild(downButton);
      actions.appendChild(removeButton);
      item.appendChild(position);
      item.appendChild(name);
      item.appendChild(actions);
      cloudinaryVideoQueue.appendChild(item);
    });
  }

  function getVideoUploadTargetForFile(fileIndex) {
    const startIndex =
      cloudinaryVideoStartSlot instanceof HTMLSelectElement
        ? Number.parseInt(cloudinaryVideoStartSlot.value, 10) - 1
        : 0;
    const fillEmptyOnly =
      cloudinaryVideoFillEmptyOnly instanceof HTMLInputElement &&
      cloudinaryVideoFillEmptyOnly.checked;

    let slotsSeen = 0;
    for (let i = Math.max(0, startIndex); i < VIDEO_FIELD_NAMES.length; i += 1) {
      const field = byName(VIDEO_FIELD_NAMES[i]);
      if (!(field instanceof HTMLInputElement)) continue;

      const empty = !String(field.value || "").trim();
      if (fillEmptyOnly && !empty) continue;

      if (slotsSeen === fileIndex) return field;
      slotsSeen += 1;
    }

    return null;
  }

  function setVideoUploadProgress(percent, label) {
    const safe = Math.max(0, Math.min(100, Math.round(percent)));
    if (cloudinaryVideoProgressWrap instanceof HTMLElement) {
      cloudinaryVideoProgressWrap.hidden = false;
    }
    if (cloudinaryVideoProgress instanceof HTMLProgressElement) {
      cloudinaryVideoProgress.value = safe;
    }
    if (cloudinaryVideoProgressLabel instanceof HTMLElement) {
      cloudinaryVideoProgressLabel.textContent = label || safe + "%";
    }
  }

  function hideVideoUploadProgress() {
    if (cloudinaryVideoProgressWrap instanceof HTMLElement) {
      cloudinaryVideoProgressWrap.hidden = true;
    }
    if (cloudinaryVideoProgress instanceof HTMLProgressElement) {
      cloudinaryVideoProgress.value = 0;
    }
  }

  function createVideoUploadId() {
    return (
      "atd" +
      String(Date.now()) +
      Math.random().toString(16).slice(2, 10)
    ).replace(/[^a-zA-Z0-9]/g, "");
  }

  function xhrPostFormData(url, formData, headers, onProgress, options) {
    const allowPartial = !!(options && options.allowPartial);

    return new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);

      if (headers && typeof headers === "object") {
        Object.keys(headers).forEach(function (key) {
          xhr.setRequestHeader(key, headers[key]);
        });
      }

      xhr.upload.onprogress = function (event) {
        if (!event.lengthComputable || typeof onProgress !== "function") return;
        onProgress(event.loaded, event.total);
      };

      xhr.onload = function () {
        let payload = {};
        const raw = String(xhr.responseText || "").trim();
        try {
          payload = raw ? JSON.parse(raw) : {};
        } catch (_error) {
          payload = {};
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          if (payload.secure_url || payload.url) {
            resolve(payload);
            return;
          }

          // Chunk intermedio de Cloudinary: { done: false } sin URL todavía
          if (allowPartial && payload.done === false) {
            resolve(payload);
            return;
          }

          if (allowPartial && !payload.error) {
            resolve(payload);
            return;
          }
        }

        const detail =
          (payload && payload.error && payload.error.message) ||
          (typeof payload.error === "string" ? payload.error : "") ||
          (raw
            ? "Respuesta Cloudinary: " + raw.slice(0, 180)
            : "Cloudinary rechazó el video (HTTP " + String(xhr.status) + ")");
        reject(new Error(String(detail)));
      };

      xhr.onerror = function () {
        reject(
          new Error(
            "No se pudo contactar Cloudinary. Revisa la red o sube el video en Media Library y pega la URL."
          )
        );
      };

      xhr.send(formData);
    });
  }

  function resolveCloudinaryMediaUrl(payload, cloudName) {
    if (!payload || typeof payload !== "object") return "";
    if (payload.secure_url) return String(payload.secure_url);
    if (payload.url) return String(payload.url).replace(/^http:\/\//i, "https://");

    const publicId = payload.public_id ? String(payload.public_id) : "";
    const format = payload.format ? String(payload.format) : "mp4";
    const version = payload.version ? "v" + String(payload.version) + "/" : "";
    if (publicId && cloudName) {
      return (
        "https://res.cloudinary.com/" +
        encodeURIComponent(cloudName) +
        "/video/upload/" +
        version +
        publicId +
        "." +
        format
      );
    }

    return "";
  }

  async function uploadVideoFileToCloudinary(file, cloudName, uploadPreset, folder, onProgress) {
    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Falta configurar PUBLIC_CLOUDINARY_CLOUD_NAME y PUBLIC_CLOUDINARY_UPLOAD_PRESET"
      );
    }

    if (!isAcceptedVideoFile(file)) {
      throw new Error("Solo se permiten videos mp4, webm o mov");
    }

    if (file.size > MAX_VIDEO_BYTES) {
      throw new Error(
        "El video supera 100 MB (" +
          formatBytes(file.size) +
          "). Comprime en CapCut o súbelo más liviano."
      );
    }

    const endpoint =
      "https://api.cloudinary.com/v1_1/" +
      encodeURIComponent(cloudName) +
      "/video/upload";
    const targetFolder = String(folder || "").trim();
    const totalBytes = file.size || 0;

    function reportProgress(loaded) {
      if (typeof onProgress !== "function" || !totalBytes) return;
      onProgress(Math.min(loaded, totalBytes) / totalBytes);
    }

    function appendUploadFields(formData) {
      formData.append("upload_preset", uploadPreset);
      if (targetFolder) formData.append("folder", targetFolder);
    }

    // Archivos bajo ~95 MB: una sola petición (evita respuestas parciales de chunks)
    if (totalBytes <= VIDEO_SIMPLE_UPLOAD_MAX) {
      const formData = new FormData();
      formData.append("file", file, file.name || "video.mp4");
      appendUploadFields(formData);

      const payload = await xhrPostFormData(
        endpoint,
        formData,
        null,
        function (loaded) {
          reportProgress(loaded);
        },
        { allowPartial: false }
      );
      reportProgress(totalBytes);

      const url = resolveCloudinaryMediaUrl(payload, cloudName);
      if (!url) {
        throw new Error(
          "Cloudinary respondió sin URL. Revisa que el preset unsigned permita videos (resource type Auto o Video)."
        );
      }
      return url;
    }

    const uploadId = createVideoUploadId();
    let offset = 0;
    let lastPayload = null;

    while (offset < totalBytes) {
      const end = Math.min(offset + VIDEO_CHUNK_BYTES, totalBytes);
      const chunk = file.slice(offset, end);
      const formData = new FormData();
      formData.append("file", chunk, file.name || "video.mp4");
      appendUploadFields(formData);

      const isLast = end >= totalBytes;
      lastPayload = await xhrPostFormData(
        endpoint,
        formData,
        {
          "X-Unique-Upload-Id": uploadId,
          "Content-Range":
            "bytes " + String(offset) + "-" + String(end - 1) + "/" + String(totalBytes),
        },
        function (loaded) {
          reportProgress(offset + loaded);
        },
        { allowPartial: !isLast }
      );

      offset = end;
      reportProgress(offset);
    }

    const url = resolveCloudinaryMediaUrl(lastPayload, cloudName);
    if (!url) {
      throw new Error(
        "Cloudinary terminó la subida por partes sin devolver URL. Prueba un video más liviano o súbelo en Media Library."
      );
    }

    return url;
  }

  async function uploadSelectedVideos() {
    if (selectedCloudinaryVideos.length === 0) {
      setMessage("Selecciona al menos un video para subir", "red");
      return;
    }

    const cloudName = (form.dataset.cloudinaryCloudName || "").trim();
    const uploadPreset = (form.dataset.cloudinaryUploadPreset || "").trim();
    const videoFolder =
      (form.dataset.cloudinaryVideoFolder || "").trim() ||
      (form.dataset.cloudinaryFolder || "").trim();

    if (!cloudName || !uploadPreset) {
      setMessage(
        "Falta configurar Cloudinary: PUBLIC_CLOUDINARY_CLOUD_NAME y PUBLIC_CLOUDINARY_UPLOAD_PRESET",
        "red"
      );
      return;
    }

    if (uploadCloudinaryVideoBtn instanceof HTMLButtonElement) {
      uploadCloudinaryVideoBtn.disabled = true;
      uploadCloudinaryVideoBtn.textContent = "Subiendo video...";
    }

    let uploadedCount = 0;
    const filledFields = [];

    try {
      for (let i = 0; i < selectedCloudinaryVideos.length; i += 1) {
        const targetField = getVideoUploadTargetForFile(i);
        if (!targetField) break;

        const file = selectedCloudinaryVideos[i];
        setVideoUploadProgress(
          0,
          "Subiendo " +
            String(i + 1) +
            "/" +
            String(selectedCloudinaryVideos.length) +
            ": " +
            (file.name || "video")
        );

        const secureUrl = await uploadVideoFileToCloudinary(
          file,
          cloudName,
          uploadPreset,
          videoFolder,
          function (ratio) {
            const overall =
              ((i + ratio) / selectedCloudinaryVideos.length) * 100;
            setVideoUploadProgress(
              overall,
              "Subiendo " +
                String(i + 1) +
                "/" +
                String(selectedCloudinaryVideos.length) +
                " · " +
                String(Math.round(ratio * 100)) +
                "%"
            );
          }
        );

        targetField.value = secureUrl;
        filledFields.push(targetField.name || "video");
        uploadedCount += 1;
        saveDraftNow();
        setMessage(
          "Videos subidos: " +
            String(uploadedCount) +
            " de " +
            String(selectedCloudinaryVideos.length) +
            " → " +
            filledFields.join(", "),
          "#334155"
        );
      }

      if (uploadedCount === 0) {
        setMessage(
          "No se pudo pegar el video: el campo ya tiene URL. Desmarca “solo vacíos” para reemplazar Video 1, o limpia el campo a mano.",
          "#b45309"
        );
        return;
      }

      setMessage(
        "Video en Cloudinary listo (" +
          filledFields.join(", ") +
          "). Ahora pulsa Actualizar Nota para publicarlo.",
        "green"
      );
      if (cloudinaryVideoFilesInput instanceof HTMLInputElement) {
        cloudinaryVideoFilesInput.value = "";
      }
      clearSelectedCloudinaryVideos();
      renderCloudinaryVideoQueue();
      hideVideoUploadProgress();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Error desconocido";
      setMessage("Error al subir video a Cloudinary: " + detail, "red");
    } finally {
      if (uploadCloudinaryVideoBtn instanceof HTMLButtonElement) {
        uploadCloudinaryVideoBtn.disabled = false;
        uploadCloudinaryVideoBtn.textContent =
          "Subir a Cloudinary y completar campos";
      }
    }
  }

  function setMode(isEditing, noteId) {
    editingNoteId = isEditing ? String(noteId) : "";

    if (editModeLabel) {
      editModeLabel.textContent = isEditing
        ? "Modo actual: Editando nota #" + String(noteId)
        : "Modo actual: Crear nueva nota";
    }

    if (submitNoteBtn) {
      submitNoteBtn.textContent = isEditing
        ? "Actualizar Nota"
        : "Guardar Nota";
    }

    if (formHeaderTitle) {
      formHeaderTitle.textContent = isEditing ? "Editar Nota" : "Crear Nota";
    }

    if (deleteNoteBtn) deleteNoteBtn.hidden = !isEditing;
    if (exitEditBtn) exitEditBtn.hidden = !isEditing;

    if (!isEditing && editNoteIdInput instanceof HTMLInputElement) {
      editNoteIdInput.value = "";
    }
  }

  function extractFirstImageFromHtml(html) {
    if (!html) return "";
    const match = String(html).match(
      /<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/i
    );
    return match && match[1] ? match[1] : "";
  }

  function fillFormFromNote(note) {
    isPopulatingForm = true;

    const rawContent =
      note && typeof note.content === "string" ? note.content : "";
    const isPruebasSolo = PRUEBAS_SOLO_META.test(rawContent);

    if (pruebasSoloVideoField instanceof HTMLInputElement) {
      pruebasSoloVideoField.checked = isPruebasSolo;
    }

    editableFields.forEach(function (name) {
      const raw =
        note && Object.prototype.hasOwnProperty.call(note, name)
          ? note[name]
          : "";
      let value = typeof raw === "string" ? raw : String(raw || "");

      if (name === "content" && value) {
        value = stripPruebasSoloMetaFromContent(value);

        if (isAutomatchCategory(note && note.category ? note.category : "")) {
          value = stripAutomatchMetaFromContent(value);
          if (/<[a-z][\s\S]*>/i.test(value)) {
            value = htmlToPlainText(value);
          }
        } else if (/<[a-z][\s\S]*>/i.test(value)) {
          value = htmlToPlainText(value);
        }
      }

      setFieldValue(name, value);
    });

    loadedScheduledAt = note && note.scheduled_at ? String(note.scheduled_at) : "";

    if (publishMode instanceof HTMLSelectElement) {
      publishMode.value = loadedScheduledAt ? "schedule" : "now";
    }

    if (scheduledAtInput instanceof HTMLInputElement) {
      scheduledAtInput.value = formatScheduledAtForInput(loadedScheduledAt);
    }

    applyPublishMode();

    if (isAutomatchCategory(note && note.category ? note.category : "")) {
      const content =
        note && typeof note.content === "string" ? note.content : "";
      const metaMatch = content.match(/AUTOMATCH_META:([^>]*)-->/i);

      if (metaMatch && metaMatch[1]) {
        try {
          const parsed = JSON.parse(decodeURIComponent(metaMatch[1]));
          const texts = parsed && parsed.texts ? parsed.texts : {};
          const catalog = parsed && parsed.catalog ? parsed.catalog : {};

          for (let i = 2; i <= 6; i += 1) {
            const key = "img" + String(i);
            const item = texts[key] || {};
            setFieldValue("texto_img" + String(i) + "_linea1", item.line1 || "");
          }

          setFieldValue("automatch_tipo", catalog.tipo || "");
          setFieldValue("automatch_uso", catalog.uso || "");
          setFieldValue(
            "automatch_condicion",
            catalog.condicion || "nuevo"
          );
          setFieldValue("automatch_ciudad", catalog.ciudad || "");
          setFieldValue(
            "automatch_precio_cop",
            catalog.precio_cop ? String(catalog.precio_cop) : ""
          );
        } catch (_error) {
          for (let i = 2; i <= 6; i += 1) {
            setFieldValue("texto_img" + String(i) + "_linea1", "");
          }
        }
      }

      if (!getFieldValue("automatch_tipo") && note.spec_motorizacion) {
        const motor = String(note.spec_motorizacion).toLowerCase();
        if (motor.includes("electr")) {
          setFieldValue("automatch_tipo", "eléctrico");
        } else if (motor.includes("hibrid") || motor.includes("hybrid")) {
          setFieldValue("automatch_tipo", "híbrido");
        } else if (motor.includes("gasolina") || motor.includes("diesel")) {
          setFieldValue("automatch_tipo", "gasolina");
        }
      }

      if (!getFieldValue("automatch_uso") && note.spec_segmento) {
        const segmento = String(note.spec_segmento).toLowerCase();
        if (segmento.includes("deport")) {
          setFieldValue("automatch_uso", "deportivo");
        } else if (segmento.includes("suv") || segmento.includes("famil")) {
          setFieldValue("automatch_uso", "familiar");
        } else if (segmento.includes("pickup") || segmento.includes("trabajo")) {
          setFieldValue("automatch_uso", "trabajo");
        } else {
          setFieldValue("automatch_uso", "urbano");
        }
      }

      if (!getFieldValue("automatch_precio_cop") && note.spec_precio_cop) {
        setFieldValue("automatch_precio_cop", String(note.spec_precio_cop));
      }
    }

    applyCategoryMode({ preserveContent: true });
    renderImagePreviews();
    isPopulatingForm = false;
    saveDraftNow();
  }

  function resetDefaults() {
    if (!getFieldValue("editor")) {
      setFieldValue("editor", "Jhon Aparicio");
    }
    if (!getFieldValue("source_scope")) {
      setFieldValue("source_scope", "nacional");
    }
    applyCategoryMode();
    applyPublishMode();
  }

  async function loadNoteForEdit() {
    const rawId =
      editNoteIdInput instanceof HTMLInputElement
        ? editNoteIdInput.value.trim()
        : "";
    const id = Number.parseInt(rawId, 10);

    if (!Number.isInteger(id) || id <= 0) {
      setMessage("Ingresa un ID valido para editar", "red");
      return;
    }

    try {
      const response = await fetch("/api/get-notes?id=" + String(id), {
        credentials: "same-origin",
      });
      const note = await response.json();

      if (!response.ok) {
        setMessage((note && note.error) || "No se pudo cargar la nota", "red");
        return;
      }

      fillFormFromNote(note || {});
      setMode(true, id);
      setMessage("Nota #" + String(id) + " cargada para edicion", "green");
    } catch (_error) {
      setMessage("Error de conexion al cargar la nota", "red");
    }
  }

  function exitEditMode(keepMessage) {
    form.reset();
    if (pruebasSoloVideoField instanceof HTMLInputElement) {
      pruebasSoloVideoField.checked = false;
    }
    resetDefaults();
    if (cloudinaryFilesInput instanceof HTMLInputElement) {
      cloudinaryFilesInput.value = "";
    }
    if (cloudinaryVideoFilesInput instanceof HTMLInputElement) {
      cloudinaryVideoFilesInput.value = "";
    }
    clearSelectedCloudinaryFiles();
    clearSelectedCloudinaryVideos();
    renderCloudinaryQueue();
    renderCloudinaryVideoQueue();
    hideVideoUploadProgress();
    setMode(false, "");
    loadedScheduledAt = "";
    applyPublishMode();
    clearDraft();
    if (!keepMessage) {
      setMessage("Modo edicion cerrado", "#334155");
    }
  }

  async function deleteCurrentNote() {
    const fallbackId =
      editNoteIdInput instanceof HTMLInputElement
        ? editNoteIdInput.value.trim()
        : "";
    const effectiveEditId =
      editingNoteId || (/^\d+$/.test(fallbackId) ? fallbackId : "");

    if (!effectiveEditId) {
      setMessage("Primero carga una nota por ID para poder eliminar", "red");
      return;
    }

    const ok = window.confirm(
      "Vas a eliminar la nota #" +
        effectiveEditId +
        ". Esta accion no se puede deshacer. Deseas continuar?"
    );
    if (!ok) return;

    setMessage("Intentando eliminar nota #" + effectiveEditId + "...", "#334155");

    let removed = false;
    let lastError = "No se pudo eliminar la nota";

    try {
      const response = await fetch("/api/delete-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(effectiveEditId) }),
        credentials: "same-origin",
      });
      const raw = await response.text();
      let parsed = null;

      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch (_parseError) {
        parsed = null;
      }

      if (response.ok) {
        removed = true;
      } else {
        const detail =
          parsed && parsed.detail ? " — " + String(parsed.detail) : "";
        lastError =
          ((parsed && parsed.error) || "No se pudo eliminar la nota") + detail;
      }
    } catch (_error) {
      lastError =
        "No hubo respuesta del servidor. Recarga /formulario e inicia sesion de nuevo.";
    }

    if (!removed) {
      setMessage(lastError, "red");
      return;
    }

    setMessage("Nota eliminada con exito (ID: " + effectiveEditId + ")", "green");
    exitEditMode(true);
  }

  if (loadNoteBtn) {
    loadNoteBtn.addEventListener("click", loadNoteForEdit);
  }

  if (deleteNoteBtn) {
    deleteNoteBtn.addEventListener("click", deleteCurrentNote);
  }

  if (exitEditBtn) {
    exitEditBtn.addEventListener("click", function () {
      exitEditMode(false);
    });
  }

  if (cloudinaryFilesInput instanceof HTMLInputElement) {
    cloudinaryFilesInput.addEventListener("change", function () {
      const files = Array.from(cloudinaryFilesInput.files || []);
      clearSelectedCloudinaryFiles();
      selectedCloudinaryFiles = files.slice(0, 6);
      renderCloudinaryQueue();
    });
  }

  if (uploadCloudinaryBtn) {
    uploadCloudinaryBtn.addEventListener("click", uploadSelectedImages);
  }

  if (cloudinaryVideoFilesInput instanceof HTMLInputElement) {
    cloudinaryVideoFilesInput.addEventListener("change", function () {
      const files = Array.from(cloudinaryVideoFilesInput.files || []).filter(
        isAcceptedVideoFile
      );
      clearSelectedCloudinaryVideos();
      selectedCloudinaryVideos = files.slice(0, 7);
      renderCloudinaryVideoQueue();

      if (
        cloudinaryVideoFilesInput.files &&
        cloudinaryVideoFilesInput.files.length > files.length
      ) {
        setMessage(
          "Algunos archivos no son video (mp4/webm/mov) y se omitieron",
          "#b45309"
        );
      }
    });
  }

  if (uploadCloudinaryVideoBtn) {
    uploadCloudinaryVideoBtn.addEventListener("click", uploadSelectedVideos);
  }

  if (categoryField instanceof HTMLSelectElement) {
    categoryField.addEventListener("change", function () {
      applyCategoryMode();
    });
  }

  if (pruebasSoloVideoField instanceof HTMLInputElement) {
    pruebasSoloVideoField.addEventListener("change", function () {
      applyCategoryMode();
    });
  }

  if (publishMode instanceof HTMLSelectElement) {
    publishMode.addEventListener("change", applyPublishMode);
  }

  if (scheduledAtInput instanceof HTMLInputElement) {
    scheduledAtInput.addEventListener("change", updateScheduleStatus);
    scheduledAtInput.addEventListener("input", updateScheduleStatus);
  }

  setMode(false, "");
  resetDefaults();
  initSpecImport();
  bindImagePreviewListeners();
  renderImagePreviews();
  initDraftPersistence();

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const data = {};
    const formData = new FormData(form);
    formData.forEach(function (value, key) {
      data[key] = typeof value === "string" ? value : "";
    });

    // Procesar el campo content para estructurarlo como HTML
    function procesarContenidoAHtml(texto) {
      if (!texto) return "";
      // Separar por doble salto de línea o salto de línea + espacios
      const bloques = texto.split(/\n\s*\n/);
      return bloques
        .map((bloque) => {
          const limpio = bloque.trim();
          if (!limpio) return "";
          // Detectar títulos de sección
          if (/^(Titulo:|Título:)/i.test(limpio)) {
            // Extraer el texto después de 'Titulo:' o 'Título:' y antes de '|', si existe
            const partes = limpio.replace(/^(Titulo:|Título:)/i, "").split("|");
            const titulo = partes[0].trim();
            const subtitulo = partes[1] ? partes[1].trim() : "";
            let html = `<h2>${titulo}</h2>`;
            if (subtitulo) html += `<p>${subtitulo}</p>`;
            return html;
          }
          // Si es un bullet list
          if (/^•|^- /.test(limpio)) {
            // Convertir cada línea en <li>
            const items = limpio.split(/\n|\r/).map(linea => {
              const item = linea.replace(/^•|^- /, "").trim();
              return item ? `<li>${item}</li>` : "";
            }).join("");
            return `<ul>${items}</ul>`;
          }
          // Párrafo normal
          return `<p>${limpio}</p>`;
        })
        .join("");
    }

    // Guardar el contenido como texto plano, sin convertir a HTML
    // if (data.content) {
    //   data.content = procesarContenidoAHtml(data.content);
    // }

    const contentHtml = String(data.content || "");
    const firstImg = extractFirstImageFromHtml(contentHtml);
    if ((!data.image1 || String(data.image1).trim() === "") && firstImg) {
      data.image1 = firstImg;
    }

    const pruebasSolo = isPruebasSoloVideoMode();
    data.pruebas_solo_video = pruebasSolo;

    if (pruebasSolo) {
      const soloTitle = String(data.title || "").trim();
      const soloVideo = String(data.video1 || "").trim();

      if (!soloTitle) {
        setMessage("Para solo video en Pruebas agrega un titulo", "red");
        return;
      }

      if (!soloVideo) {
        setMessage(
          "Agrega la ruta del video principal (.mp4) en Video 1",
          "red"
        );
        return;
      }

      data.category = "pruebas";
    } else if (isAutomatchCategory(data.category)) {
      const autoSubtitle = String(data.subtitle || "").trim();
      if (!autoSubtitle) {
        setMessage("Para AutoMatch agrega un subtitulo corto para la tarjeta", "red");
        return;
      }

      const catalogTipo = String(data.automatch_tipo || "").trim();
      const catalogUso = String(data.automatch_uso || "").trim();
      const catalogPrecio = String(data.automatch_precio_cop || "").trim();

      if (!catalogTipo || !catalogUso || !catalogPrecio) {
        setMessage(
          "Completa tipo de motor, uso y precio COP en Datos para el buscador",
          "red"
        );
        return;
      }

      if (!String(data.image1 || "").trim()) {
        setMessage("Agrega al menos la imagen 1 (portada) para AutoMatch", "red");
        return;
      }

      data.spec_precio_cop = catalogPrecio;
      if (!String(data.spec_motorizacion || "").trim()) {
        data.spec_motorizacion = catalogTipo;
      }
      if (!String(data.spec_segmento || "").trim()) {
        data.spec_segmento = catalogUso;
      }

      const texts = {};
      for (let i = 2; i <= 6; i += 1) {
        const line1 = String(data["texto_img" + String(i) + "_linea1"] || "").trim();
        if (line1) {
          texts["img" + String(i)] = { line1 };
        }
      }

      const catalog = {
        tipo: catalogTipo,
        uso: catalogUso,
        condicion: String(data.automatch_condicion || "nuevo").trim(),
        ciudad: String(data.automatch_ciudad || "").trim(),
        precio_cop: catalogPrecio,
      };

      const encodedMeta = encodeURIComponent(
        JSON.stringify({ texts, catalog })
      );
      const editorialRaw = stripAutomatchMetaFromContent(data.content || "").trim();
      // AutoMatch: conservar texto plano con "Titulo: ... |" para alinear bloques e imágenes.
      data.content = editorialRaw
        ? `${editorialRaw}\n<!--AUTOMATCH_META:${encodedMeta}-->`
        : `<!--AUTOMATCH_META:${encodedMeta}-->`;
    }

    const effectiveEditId = editingNoteId;
    const isEditing = Boolean(effectiveEditId);

    const scheduleMode =
      publishMode instanceof HTMLSelectElement &&
      publishMode.value === "schedule";
    const scheduledValue =
      scheduledAtInput instanceof HTMLInputElement
        ? scheduledAtInput.value.trim()
        : "";

    if (scheduleMode) {
      if (!scheduledValue) {
        setMessage("Indica fecha y hora para programar la nota", "red");
        return;
      }

      const scheduledDate = new Date(scheduledValue);
      if (Number.isNaN(scheduledDate.getTime())) {
        setMessage("La fecha de publicación no es válida", "red");
        return;
      }

      if (!isEditing && scheduledDate.getTime() <= Date.now()) {
        setMessage("La fecha programada debe ser futura", "red");
        return;
      }

      data.scheduled_at = scheduledDate.toISOString();
    } else if (
      isEditing &&
      loadedScheduledAt &&
      !isScheduledForFuture(loadedScheduledAt)
    ) {
      const original = new Date(loadedScheduledAt);
      if (!Number.isNaN(original.getTime())) {
        data.scheduled_at = original.toISOString();
      }
    } else {
      data.scheduled_at = null;
      data.publish_now = true;
    }

    delete data.publish_mode;

    const apiUrl = isEditing ? "/api/update-note" : "/api/save-note";

    if (isEditing) {
      data.id = effectiveEditId;
    }

    try {
      const response = await fetch(apiUrl, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "same-origin",
      });

      const raw = await response.text();
      let result = {};

      try {
        result = raw ? JSON.parse(raw) : {};
      } catch (_parseError) {
        result = { error: raw || "Respuesta invalida del servidor" };
      }

      if (response.ok) {
        if (isEditing) {
          loadedScheduledAt = result && result.scheduled_at ? String(result.scheduled_at) : "";
          const scheduledMessage =
            data.scheduled_at && isScheduledForFuture(data.scheduled_at)
              ? "Nota actualizada y programada (ID: " + effectiveEditId + ")"
              : "Nota actualizada con exito (ID: " + effectiveEditId + ")";
          setMessage(scheduledMessage, "green");
          updateScheduleStatus();
          saveDraftNow();
          return;
        }

        if (result && result.id) {
          clearDraft();
          if (data.scheduled_at && isScheduledForFuture(data.scheduled_at)) {
            setMessage(
              "Nota programada con exito (ID: " + String(result.id) + "). Sera visible en la fecha indicada.",
              "green"
            );
            return;
          }

          if (pruebasSolo) {
            window.location.href = "/pruebas#pruebas";
            return;
          }

          window.location.href = "/notas/" + String(result.id);
          return;
        }

        form.reset();
        resetDefaults();
        clearDraft();
        setMessage("Nota guardada con exito", "green");
        setTimeout(function () {
          if (msg) msg.textContent = "";
        }, 3000);
        return;
      }

      const detailText =
        (result && result.detail && result.detail.message) ||
        (result && result.detail && result.detail.detail) ||
        (result && result.detail && result.detail.hint) ||
        "";
      const baseError = (result && result.error) || "Error al guardar la nota";
      const timeoutHint =
        /timed out after|TimeoutError/i.test(String(raw)) ||
        /timed out after|TimeoutError/i.test(baseError)
          ? " Reinicia el servidor (Ctrl+C y npm run dev). Si persiste, revisa DATABASE_URL en .env."
          : "";
      setMessage(
        detailText
          ? baseError + " (" + detailText + ")" + timeoutHint
          : baseError + timeoutHint,
        "red"
      );
    } catch (error) {
      console.error("Error fetch al guardar nota:", error);
      const message =
        error instanceof Error && /timed out|TimeoutError/i.test(error.message)
          ? "La operación tardó demasiado. Reinicia npm run dev y verifica DATABASE_URL en .env."
          : "Error de conexion con el servidor";
      setMessage(message, "red");
    }
  });
})();
