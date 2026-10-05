/**
 * Reinicia la base de datos al estado inicial.
 * Util para volver a ejecutar la bateria de casos de prueba desde cero.
 *
 *   npm run reset
 */
const fs = require("fs");
const path = require("path");
const db = require("./db");

const bitacora = path.join(__dirname, "..", "data", "correos.log");
if (fs.existsSync(bitacora)) fs.unlinkSync(bitacora);

db.reiniciar();
console.log("Base reiniciada: 2 usuarios de prueba, 0 reservas, bitacora de correos vacia.");
