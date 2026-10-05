/**
 * Modulo 1 - Autenticacion: contrasenas y enlaces de recuperacion.
 *
 * Solo corre en el servidor (usa el modulo crypto de Node). Las contrasenas se
 * guardan como "salt:hash" con scrypt; nunca en texto plano.
 */

const crypto = require("crypto");

const LARGO_HASH = 64;
const MINUTOS_VIGENCIA_TOKEN = 30;

function hashearPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("La contrasena a hashear no puede estar vacia.");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, LARGO_HASH).toString("hex");
  return salt + ":" + hash;
}

/**
 * true si la contrasena corresponde al hash guardado. Un hash con formato
 * invalido devuelve false en lugar de lanzar una excepcion.
 */
function verificarPassword(password, almacenado) {
  if (typeof password !== "string" || typeof almacenado !== "string") return false;
  const [salt, hash] = almacenado.split(":");
  if (!salt || !hash || hash.length !== LARGO_HASH * 2) return false;
  const intento = crypto.scryptSync(password, salt, LARGO_HASH);
  // timingSafeEqual evita filtrar informacion por el tiempo de comparacion
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), intento);
}

/** Crea el registro de un enlace de recuperacion (AYA-M01-RF-02). */
function crearTokenRecuperacion(email, ahora) {
  const momento = ahora || new Date();
  return {
    token: crypto.randomBytes(24).toString("hex"),
    email,
    creadoEn: momento.toISOString(),
    expiraEn: new Date(momento.getTime() + MINUTOS_VIGENCIA_TOKEN * 60 * 1000).toISOString(),
  };
}

/**
 * true si el enlace todavia se puede usar. Vence en el instante "expiraEn":
 * a partir de ese momento ya no es valido.
 */
function tokenVigente(registro, ahora) {
  if (!registro || !registro.expiraEn) return false;
  const vence = new Date(registro.expiraEn).getTime();
  if (Number.isNaN(vence)) return false;
  return (ahora || new Date()).getTime() < vence;
}

module.exports = {
  MINUTOS_VIGENCIA_TOKEN,
  hashearPassword,
  verificarPassword,
  crearTokenRecuperacion,
  tokenVigente,
};
