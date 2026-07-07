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
  const cloudinaryFilesInput = document.getElementById("cloudinaryFiles");
  const uploadCloudinaryBtn = document.getElementById("uploadCloudinaryBtn");
  const cloudinaryQueue = document.getElementById("cloudinaryQueue");
  const cloudinaryStartSlot = document.getElementById("cloudinaryStartSlot");
  const cloudinaryFillEmptyOnly = document.getElementById("cloudinaryFillEmptyOnly");
  const publishMode = document.getElementById("publishMode");
  const scheduledAtGroup = document.getElementById("scheduledAtGroup");
  const scheduledAtInput = document.getElementById("scheduledAt");
  const scheduleStatus = document.getElementById("scheduleStatus");
  const pruebasSoloVideoField = document.getElementById("pruebasSoloVideoField");
  const PRUEBAS_SOLO_META = /<!--PRUEBAS_SOLO:1-->/i;

  if (!(form instanceof HTMLFormElement)) return;

  let editingNoteId = "";
  let selectedCloudinaryFiles = [];
  let isPopulatingForm = false;
  let loadedScheduledAt = "";

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
      contentFieldGroup.hidden = automatchMode;
      contentFieldGroup.style.display = automatchMode ? "none" : "block";
    }

    if (contentField instanceof HTMLTextAreaElement) {
      contentField.required = !automatchMode;
      if (automatchMode) {
        if (!preserveContent && !isPopulatingForm) {
          contentField.value = "";
        }
        contentField.disabled = true;
        contentField.placeholder =
          "En AutoMatch el contenido se genera desde subtítulo y metadatos";
      } else {
        contentField.disabled = false;
        contentField.placeholder =
          "Escribe el cuerpo de la nota. Separa cada sección con una línea en blanco.";
      }
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

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(new Error("No se pudo leer la imagen seleccionada"));
      };
      reader.readAsDataURL(file);
    });
  }

  async function uploadFileToCloudinary(file, cloudName, uploadPreset, folder) {
    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Falta configurar PUBLIC_CLOUDINARY_CLOUD_NAME y PUBLIC_CLOUDINARY_UPLOAD_PRESET",
      );
    }

    const dataUrl = await readFileAsDataUrl(file);
    const response = await fetch("/api/upload-cloudinary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        file: dataUrl,
        filename: file.name || "nota.jpg",
        folder: folder || undefined,
      }),
    });

    let payload = {};
    try {
      payload = await response.json();
    } catch (_parseError) {
      payload = {};
    }

    if (!response.ok || !payload.secure_url) {
      const detail =
        (payload && payload.error) ||
        (response.status === 401
          ? "Sesión de administrador expirada. Recarga /formulario e inicia sesión de nuevo."
          : "No se pudo subir la imagen al servidor");
      throw new Error(detail);
    }

    return payload.secure_url;
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
          const subtitleMatch = value.match(/^<p>([\s\S]*?)<\/p>/i);
          if (subtitleMatch && subtitleMatch[1] && !getFieldValue("subtitle")) {
            setFieldValue("subtitle", htmlToPlainText(subtitleMatch[1]));
          }
          value = "";
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
    isPopulatingForm = false;
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
    clearSelectedCloudinaryFiles();
    renderCloudinaryQueue();
    setMode(false, "");
    loadedScheduledAt = "";
    applyPublishMode();
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

    const attempts = [
      {
        method: "POST",
        endpoint: "/api/delete-note",
        body: JSON.stringify({ id: Number(effectiveEditId) }),
        headers: { "Content-Type": "application/json" },
      },
      {
        method: "DELETE",
        endpoint: "/api/delete-note?id=" + effectiveEditId,
      },
      {
        method: "DELETE",
        endpoint: "/.netlify/functions/delete-note?id=" + effectiveEditId,
      },
    ];

    let removed = false;
    let lastError = "No se pudo eliminar la nota";

    for (let i = 0; i < attempts.length; i += 1) {
      const attempt = attempts[i];
      try {
        const response = await fetch(attempt.endpoint, {
          method: attempt.method,
          headers: attempt.headers,
          body: attempt.body,
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
          break;
        }

        lastError =
          (parsed && parsed.error) ||
          (raw ? raw.slice(0, 120) : "No se pudo eliminar la nota");
      } catch (_error) {
        lastError = "No hubo respuesta del servidor de borrado";
      }
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

  if (editNoteIdInput instanceof HTMLInputElement) {
    const initialId = new URLSearchParams(window.location.search).get("id");
    if (initialId && /^\d+$/.test(initialId)) {
      editNoteIdInput.value = initialId;
      loadNoteForEdit();
    }
  }

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
      data.spec_motorizacion = catalogTipo;
      data.spec_segmento = catalogUso;

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
      data.content = `<p>${autoSubtitle}</p><!--AUTOMATCH_META:${encodedMeta}-->`;
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
          return;
        }

        if (result && result.id) {
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
      setMessage(detailText ? baseError + " (" + detailText + ")" : baseError, "red");
    } catch (error) {
      console.error("Error fetch al guardar nota:", error);
      setMessage("Error de conexion con el servidor", "red");
    }
  });
})();
