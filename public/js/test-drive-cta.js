import { submitTestDrive } from "./test-drive-submit.js";

function setMessage(form, type, text) {
  const box = form.querySelector(".test-drive-cta__message");
  if (!box) return;

  box.className = `test-drive-cta__message test-drive-cta__message--${type} is-visible`;
  box.textContent = text;
}

function bindTestDriveForm(form) {
  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = form.querySelector(".test-drive-cta__submit");
    const consent = form.querySelector("input[name='consent']");

    if (consent && !consent.checked) {
      setMessage(form, "error", "Debes aceptar la política de privacidad.");
      return;
    }

    const payload = {
      dealerId: form.dataset.dealerId ? Number(form.dataset.dealerId) : undefined,
      autoId: form.dataset.autoId || undefined,
      noteId: form.dataset.noteId ? Number(form.dataset.noteId) : undefined,
      autoNombre: form.dataset.autoNombre || undefined,
      concesionarioNombre: form.dataset.dealerNombre || undefined,
      source: form.dataset.source || "nota",
      nombre: form.querySelector("[name='nombre']")?.value?.trim(),
      email: form.querySelector("[name='email']")?.value?.trim(),
      telefono: form.querySelector("[name='telefono']")?.value?.trim(),
      ciudad: form.querySelector("[name='ciudad']")?.value?.trim(),
      mensaje: form.querySelector("[name='mensaje']")?.value?.trim(),
    };

    if (submitBtn) submitBtn.disabled = true;

    const result = await submitTestDrive(payload);

    if (result.ok) {
      setMessage(
        form,
        "success",
        "Solicitud enviada. Un asesor te contactará en menos de 24 horas.",
      );
      form.reset();
    } else {
      setMessage(
        form,
        "error",
        result.error || "No se pudo enviar la solicitud. Intenta de nuevo.",
      );
    }

    if (submitBtn) submitBtn.disabled = false;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll(".test-drive-cta__form")
    .forEach((form) => bindTestDriveForm(form));
});
