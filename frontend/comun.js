/**
 * Utilidades compartidas por las pantallas de AgendaYA.
 *
 * Convencion para los tests E2E: cada pantalla tiene
 *   [data-cy="alerta-error"]  mensaje general de error
 *   [data-cy="alerta-exito"]  mensaje general de confirmacion
 *   [data-cy="error-<campo>"] explicacion debajo de cada campo con error
 */

function mostrarError(texto) {
  ocultarAvisos();
  const caja = document.querySelector('[data-cy="alerta-error"]');
  caja.textContent = texto;
  caja.hidden = false;
}

function mostrarExito(texto) {
  ocultarAvisos();
  const caja = document.querySelector('[data-cy="alerta-exito"]');
  caja.textContent = texto;
  caja.hidden = false;
}

function ocultarAvisos() {
  document.querySelectorAll('[data-cy="alerta-error"], [data-cy="alerta-exito"]').forEach((caja) => {
    caja.hidden = true;
    caja.textContent = "";
  });
}

/** Resalta el campo y muestra el motivo debajo. Siempre con un texto visible. */
function marcarError(campo, mensaje) {
  const contenedor = document.querySelector('[data-campo="' + campo + '"]');
  if (!contenedor) return;
  contenedor.classList.add("error");
  const detalle = contenedor.querySelector('[data-cy="error-' + campo + '"]');
  if (detalle) detalle.textContent = mensaje;
  const entrada = contenedor.querySelector("input, textarea");
  if (entrada) entrada.focus();
}

function limpiarErrores() {
  document.querySelectorAll(".campo.error").forEach((c) => c.classList.remove("error"));
  document.querySelectorAll('[data-cy^="error-"]').forEach((d) => (d.textContent = ""));
}

async function pedir(url, cuerpo) {
  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json().catch(() => ({}));
  return { ok: respuesta.ok, estado: respuesta.status, datos };
}

// ------------------------------------------------------------------- sesion

const CLAVE_SESION = "agendaya:usuario";

function guardarSesion(usuario) {
  try {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
  } catch (e) {
    /* sin almacenamiento disponible no hay sesion persistente */
  }
}

function leerSesion() {
  try {
    const crudo = sessionStorage.getItem(CLAVE_SESION);
    return crudo ? JSON.parse(crudo) : null;
  } catch (e) {
    return null;
  }
}

function cerrarSesion() {
  try {
    sessionStorage.removeItem(CLAVE_SESION);
  } catch (e) {
    /* nada que limpiar */
  }
  window.location.href = "/?sesion=cerrada";
}
