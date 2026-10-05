/**
 * Utilidades compartidas por las pantallas de AgendaYa.
 */

function mostrarAviso(id, texto, tipo) {
  const caja = document.getElementById(id);
  caja.textContent = texto;
  caja.className = "aviso visible " + (tipo === "ok" ? "ok" : "mal");
}

function ocultarAviso(id) {
  const caja = document.getElementById(id);
  caja.className = "aviso";
  caja.textContent = "";
}

/** Marca un campo como erroneo y muestra la explicacion debajo (CP-008). */
function marcarError(nombreCampo, mensaje) {
  const contenedor = document.querySelector('[data-campo="' + nombreCampo + '"]');
  if (!contenedor) return;
  contenedor.classList.add("error");
  const detalle = contenedor.querySelector(".detalle-error");
  if (detalle && mensaje) detalle.textContent = mensaje;
  const entrada = contenedor.querySelector("input, textarea");
  if (entrada) entrada.focus();
}

function limpiarErrores() {
  document.querySelectorAll(".campo.error").forEach((c) => c.classList.remove("error"));
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

function guardarSesion(usuario) {
  window.__usuario = usuario;
  try {
    sessionStorage.setItem("agendaya:usuario", JSON.stringify(usuario));
  } catch (e) {
    /* sin almacenamiento disponible, la sesion vive solo en memoria */
  }
}

function leerSesion() {
  if (window.__usuario) return window.__usuario;
  try {
    const crudo = sessionStorage.getItem("agendaya:usuario");
    return crudo ? JSON.parse(crudo) : null;
  } catch (e) {
    return null;
  }
}

function cerrarSesion() {
  window.__usuario = null;
  try {
    sessionStorage.removeItem("agendaya:usuario");
  } catch (e) {
    /* nada que limpiar */
  }
  window.location.href = "/";
}
