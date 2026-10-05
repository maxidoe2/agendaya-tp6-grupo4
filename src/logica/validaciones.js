/**
 * Modulo 1 - Autenticacion: reglas de validacion.
 *
 * Logica pura, sin DOM ni acceso a datos. El mismo archivo se usa:
 *   - en Node (servidor y tests unitarios con Jest), via require()
 *   - en el navegador (pantallas), como window.AgendaValidaciones
 * De esta forma lo que se prueba unitariamente es exactamente lo que valida la app.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) {
    module.exports = fabrica();
  } else {
    raiz.AgendaValidaciones = fabrica();
  }
})(typeof self !== "undefined" ? self : this, function () {
  const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const LARGO_MINIMO_PASSWORD = 8;

  /** Deja el email en la forma en que se guarda: sin espacios y en minusculas. */
  function normalizarEmail(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor).trim().toLowerCase();
  }

  /** true si el texto tiene forma de email (usuario@dominio.ext). */
  function esEmailValido(email) {
    if (typeof email !== "string") return false;
    return PATRON_EMAIL.test(email.trim());
  }

  /**
   * AYA-M01-RF-01: la contrasena debe cumplir los requisitos de seguridad.
   * Reglas adoptadas (el TP1 solo decia "requisitos de seguridad"):
   * al menos 8 caracteres, una mayuscula, una minuscula y un numero.
   *
   * Devuelve { valida, errores } con un mensaje por cada regla incumplida.
   */
  function evaluarPassword(password) {
    const texto = typeof password === "string" ? password : "";
    const errores = [];
    if (texto.length < LARGO_MINIMO_PASSWORD) {
      errores.push("Debe tener al menos " + LARGO_MINIMO_PASSWORD + " caracteres.");
    }
    if (!/[A-Z]/.test(texto)) errores.push("Debe incluir al menos una mayuscula.");
    if (!/[a-z]/.test(texto)) errores.push("Debe incluir al menos una minuscula.");
    if (!/[0-9]/.test(texto)) errores.push("Debe incluir al menos un numero.");
    return { valida: errores.length === 0, errores };
  }

  /**
   * Valida el formulario de registro. Devuelve null si es valido, o el primer
   * error encontrado como { campo, mensaje } (en el orden en que se ven los campos).
   */
  function validarRegistro(datos) {
    const d = datos || {};
    const nombre = String(d.nombre || "").trim();
    const email = normalizarEmail(d.email);
    const password = typeof d.password === "string" ? d.password : "";

    if (!nombre) return { campo: "nombre", mensaje: "Ingresa tu nombre." };
    if (!email) return { campo: "email", mensaje: "Ingresa tu correo electronico." };
    if (!esEmailValido(email)) {
      return { campo: "email", mensaje: "Ingresa un correo electronico valido." };
    }
    if (!password) return { campo: "password", mensaje: "Ingresa una contrasena." };
    const evaluacion = evaluarPassword(password);
    if (!evaluacion.valida) {
      return { campo: "password", mensaje: "La contrasena no es segura. " + evaluacion.errores.join(" ") };
    }
    return null;
  }

  /** Valida el formulario de inicio de sesion: ambos campos son obligatorios. */
  function validarLogin(datos) {
    const d = datos || {};
    const email = normalizarEmail(d.email);
    const password = typeof d.password === "string" ? d.password : "";

    if (!email) return { campo: "email", mensaje: "Ingresa tu usuario." };
    if (!esEmailValido(email)) {
      return { campo: "email", mensaje: "Ingresa un correo electronico valido." };
    }
    if (!password) return { campo: "password", mensaje: "Ingresa tu contrasena." };
    return null;
  }

  return {
    LARGO_MINIMO_PASSWORD,
    normalizarEmail,
    esEmailValido,
    evaluarPassword,
    validarRegistro,
    validarLogin,
  };
});
