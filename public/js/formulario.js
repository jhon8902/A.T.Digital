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
  const cloudinaryFilesInput = document.getElementById("cloudinaryFiles");
  const uploadCloudinaryBtn = document.getElementById("uploadCloudinaryBtn");
  const cloudinaryQueue = document.getElementById("cloudinaryQueue");

  if (!(form instanceof HTMLFormElement)) return;

  let editingNoteId = "";
  let selectedCloudinaryFiles = [];

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

  async function uploadFileToCloudinary(file, cloudName, uploadPreset, folder) {
    const endpoint =
      "https://api.cloudinary.com/v1_1/" +
      encodeURIComponent(cloudName) +
      "/image/upload";

    const cloudinaryData = new FormData();
    cloudinaryData.append("file", file);
    cloudinaryData.append("upload_preset", uploadPreset);

    if (folder) {
      cloudinaryData.append("folder", folder);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      body: cloudinaryData,
    });

    const payload = await response.json();
    if (!response.ok || !payload || !payload.secure_url) {
      const detail =
        payload && payload.error && payload.error.message
          ? payload.error.message
          : "Cloudinary no devolvio secure_url";
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
        const targetField = findFirstEmptyImageField();
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
          "Todos los campos image1..image6 ya tienen URL. Limpia uno para agregar nuevas fotos.",
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
    editableFields.forEach(function (name) {
      const raw =
        note && Object.prototype.hasOwnProperty.call(note, name)
          ? note[name]
          : "";
      const value = typeof raw === "string" ? raw : String(raw || "");
      setFieldValue(name, value);
    });
  }

  function resetDefaults() {
    if (!getFieldValue("editor")) {
      setFieldValue("editor", "Jhon Aparicio");
    }
    if (!getFieldValue("source_scope")) {
      setFieldValue("source_scope", "nacional");
    }
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
      const response = await fetch("/api/get-notes?id=" + String(id));
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
    resetDefaults();
    if (cloudinaryFilesInput instanceof HTMLInputElement) {
      cloudinaryFilesInput.value = "";
    }
    clearSelectedCloudinaryFiles();
    renderCloudinaryQueue();
    setMode(false, "");
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

    const contentHtml = String(data.content || "");
    const firstImg = extractFirstImageFromHtml(contentHtml);
    if ((!data.image1 || String(data.image1).trim() === "") && firstImg) {
      data.image1 = firstImg;
    }

    const effectiveEditId = editingNoteId;
    const isEditing = Boolean(effectiveEditId);
    const apiUrl = isEditing ? "/api/update-note" : "/api/save-note";

    if (isEditing) {
      data.id = effectiveEditId;
    }

    try {
      const response = await fetch(apiUrl, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
          setMessage("Nota actualizada con exito (ID: " + effectiveEditId + ")", "green");
          return;
        }

        if (result && result.id) {
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
