/**
 * Persistencia en archivo JSON.
 *
 * Se eligio un archivo plano en lugar de un motor de base de datos porque el TP
 * solo requiere implementar la funcionalidad cubierta por los casos de prueba.
 * La interfaz (leer / escribir) es la misma que tendria un repositorio real, de
 * modo que reemplazarla por una base de datos no obligaria a tocar server.js.
 */

const fs = require("fs");
const path = require("path");
const { hashearPassword } = require("./seguridad");

const ARCHIVO = path.join(__dirname, "..", "data", "db.json");

// Usuarios que deben existir antes de ejecutar las pruebas.
// Corresponden a los prerrequisitos de los casos CP-001, CP-002 y CP-005.
const SEMILLA = {
  usuarios: [
    {
      id: 1,
      nombre: "Administrador AgendaYa",
      email: "admin@agendaya.com",
      passwordPlano: "Contrasena123!",
      rol: "administrador",
    },
    {
      id: 2,
      nombre: "Hola Comova",
      email: "hola.comova@agendaya.com",
      passwordPlano: "Recuperar2025!",
      rol: "administrador",
    },
  ],
  reservas: [],
  tokensRecuperacion: [],
};

function inicializar() {
  const carpeta = path.dirname(ARCHIVO);
  if (!fs.existsSync(carpeta)) {
    fs.mkdirSync(carpeta, { recursive: true });
  }
  if (!fs.existsSync(ARCHIVO)) {
    const datos = {
      usuarios: SEMILLA.usuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        password: hashearPassword(u.passwordPlano),
        rol: u.rol,
        creadoEn: new Date().toISOString(),
      })),
      reservas: [],
      tokensRecuperacion: [],
    };
    escribir(datos);
    console.log("  Base de datos creada en data/db.json con los usuarios de prueba.");
  }
}

function leer() {
  const contenido = fs.readFileSync(ARCHIVO, "utf8");
  const datos = JSON.parse(contenido);
  datos.usuarios = datos.usuarios || [];
  datos.reservas = datos.reservas || [];
  datos.tokensRecuperacion = datos.tokensRecuperacion || [];
  return datos;
}

function escribir(datos) {
  fs.writeFileSync(ARCHIVO, JSON.stringify(datos, null, 2), "utf8");
}

function siguienteId(coleccion) {
  return coleccion.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function reiniciar() {
  if (fs.existsSync(ARCHIVO)) {
    fs.unlinkSync(ARCHIVO);
  }
  inicializar();
}

module.exports = { inicializar, leer, escribir, siguienteId, reiniciar, ARCHIVO };
