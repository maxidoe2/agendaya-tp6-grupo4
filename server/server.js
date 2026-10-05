/**
 * AgendaYa - Servidor
 *
 * Implementa la funcionalidad minima necesaria para ejecutar los 10 casos de
 * prueba disenados en el TP N5 (Grupo 4 - 4K10):
 *
 *   Modulo 1 - Autenticacion
 *     AYA-M01-RF-01  Registro de administrador      -> CP-003 / CP-004
 *     AYA-M01-RF-02  Recuperacion de contrasena     -> CP-005 / CP-006
 *     AYA-M01-RF-04  Inicio de sesion               -> CP-001 / CP-002
 *
 *   Modulo 4 - Reservas
 *     AYA-M04-RF-03  Confirmacion de reserva        -> CP-007 / CP-008
 *     AYA-M04-RF-05  Prevencion de reservas dobles  -> CP-009 / CP-010
 */

const express = require("express");
const crypto = require("crypto");
const path = require("path");
const db = require("./db");
const correo = require("./correo");

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ------------------------------------------------------------------ utilidades

// Hash de contrasena con scrypt (modulo crypto nativo de Node, sin dependencias).
// Se guarda "salt:hash" para poder verificar despues.
function hashear(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return salt + ":" + hash;
}

function verificar(password, almacenado) {
  const [salt, hash] = almacenado.split(":");
  const intento = crypto.scryptSync(password, salt, 64).toString("hex");
  // timingSafeEqual evita filtrar informacion por el tiempo de comparacion
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(intento, "hex"));
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizarEmail(valor) {
  return String(valor || "").trim().toLowerCase();
}

// ------------------------------------------------------- MODULO 1: AUTENTICACION

/**
 * AYA-M01-RF-01 - Registro de administrador.
 * CP-003 (positivo): datos validos -> cuenta creada.
 * CP-004 (negativo): email ya registrado -> 409, no se crea la cuenta.
 */
app.post("/api/registro", (req, res) => {
  const nombre = String(req.body.nombre || "").trim();
  const email = normalizarEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!nombre) {
    return res.status(400).json({ campo: "nombre", mensaje: "Ingresa tu nombre." });
  }
  if (!EMAIL_VALIDO.test(email)) {
    return res.status(400).json({ campo: "email", mensaje: "Ingresa un correo electronico valido." });
  }
  if (password.length < 8) {
    return res.status(400).json({ campo: "password", mensaje: "La contrasena debe tener al menos 8 caracteres." });
  }

  const datos = db.leer();

  // CP-004: el email ya existe en el sistema
  if (datos.usuarios.some((u) => u.email === email)) {
    return res.status(409).json({
      campo: "email",
      mensaje: "El correo ya existe en el sistema.",
    });
  }

  const usuario = {
    id: db.siguienteId(datos.usuarios),
    nombre,
    email,
    password: hashear(password),
    rol: "administrador",
    creadoEn: new Date().toISOString(),
  };
  datos.usuarios.push(usuario);
  db.escribir(datos);

  res.status(201).json({
    mensaje: "Cuenta creada.",
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol:usuario.rol },
  });
});

/**
 * AYA-M01-RF-04 - Inicio de sesion.
 * CP-001 (positivo): credenciales validas -> acceso al dashboard.
 * CP-002 (negativo): contrasena incorrecta -> 401 y el front limpia el campo.
 */
app.post("/api/login", (req, res) => {
  const email = normalizarEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ mensaje: "Completa el usuario y la contrasena." });
  }

  const datos = db.leer();
  const usuario = datos.usuarios.find((u) => u.email === email);

  if (!usuario) {
    return res.status(401).json({ campo: "email", mensaje: "El usuario no existe." });
  }

  // CP-002: la contrasena no coincide
  if (!verificar(password, usuario.password)) {
    return res.status(401).json({
      campo: "password",
      mensaje: "Contrasena incorrecta, intentelo de nuevo.",
    });
  }

  res.json({
    mensaje: "Sesion iniciada.",
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
  });
});

/**
 * AYA-M01-RF-02 - Recuperacion de contrasena.
 * CP-005 (positivo): correo registrado -> se envia el enlace.
 * CP-006 (negativo): correo inexistente -> no se envia nada.
 */
app.post("/api/recuperar", (req, res) => {
  const email = normalizarEmail(req.body.email);

  if (!EMAIL_VALIDO.test(email)) {
    return res.status(400).json({ campo: "email", mensaje: "Ingresa un correo electronico valido." });
  }

  const datos = db.leer();
  const usuario = datos.usuarios.find((u) => u.email === email);

  // CP-006: el correo no esta registrado
  if (!usuario) {
    return res.status(404).json({
      campo: "email",
      mensaje: "El correo ingresado no se encuentra previamente registrado.",
    });
  }

  const token = crypto.randomBytes(24).toString("hex");
  datos.tokensRecuperacion.push({
    token,
    email,
    creadoEn: new Date().toISOString(),
    expiraEn: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });
  db.escribir(datos);

  correo.enviarEnlaceRecuperacion(email, token);

  res.json({ mensaje: "Revisa tu correo de entrada." });
});

/**
 * Completa el circuito de AYA-M01-RF-02: el enlace enviado por correo permite
 * fijar una contrasena nueva. No forma parte de los casos CP-005 / CP-006, pero
 * se implementa para que el flujo pueda demostrarse completo en la presentacion.
 */
app.post("/api/restablecer", (req, res) => {
  const token = String(req.body.token || "").trim();
  const password = String(req.body.password || "");

  const datos = db.leer();
  const registro = datos.tokensRecuperacion.find((t) => t.token === token);

  if (!registro) {
    return res.status(400).json({ mensaje: "El enlace no es valido." });
  }
  if (new Date(registro.expiraEn) < new Date()) {
    return res.status(400).json({ mensaje: "El enlace vencio. Pedi uno nuevo." });
  }
  if (password.length < 8) {
    return res.status(400).json({ campo: "password", mensaje: "La contrasena debe tener al menos 8 caracteres." });
  }

  const usuario = datos.usuarios.find((u) => u.email === registro.email);
  usuario.password = hashear(password);
  datos.tokensRecuperacion = datos.tokensRecuperacion.filter((t) => t.token !== token);
  db.escribir(datos);

  res.json({ mensaje: "Contrasena actualizada. Ya podes iniciar sesion." });
});

// ------------------------------------------------------------ MODULO 4: RESERVAS
// Horarios que el sistema ofrece. En el sistema completo saldrian de la
// disponibilidad configurada por el administrador.
const HORARIOS = [
  "2026-09-15 09:00",
  "2026-09-15 10:00",
  "2026-09-15 11:00",
  "2026-09-15 15:00",
  "2026-09-15 16:00",
];

app.get("/api/horarios", (req, res) => {
  const datos = db.leer();
  const ocupados = new Set(datos.reservas.map((r) => r.horario));
  res.json(HORARIOS.map((h) => ({ horario: h, disponible: !ocupados.has(h) })));
});

/**
 * AYA-M04-RF-03 y AYA-M04-RF-05 - Confirmacion de reserva.
 * CP-007 (positivo): nombre y correo completos -> reserva confirmada + notificaciones.
 * CP-008 (negativo): falta el correo -> 400, no se registra nada.
 * CP-009 / CP-010: el boton se bloquea en el front y ademas el backend
 *   rechaza cualquier peticion repetida para el mismo invitado y horario.
 */
app.post("/api/reservas", (req, res) => {
  const nombre = String(req.body.nombre || "").trim();
  const email = normalizarEmail(req.body.email);
  const telefono = String(req.body.telefono || "").trim();
  const nota = String(req.body.nota || "").trim();
  const horario = String(req.body.horario || "").trim();

  if (!nombre) {
    return res.status(400).json({ campo: "nombre", mensaje: "Ingresa tu nombre completo." });
  }

  // CP-008: el correo electronico es obligatorio
  if (!email) {
    return res.status(400).json({
      campo: "email",
      mensaje: "Ingresa tu correo electronico para confirmar la reserva.",
    });
  }
  if (!EMAIL_VALIDO.test(email)) {
    return res.status(400).json({ campo: "email", mensaje: "Ingresa un correo electronico valido." });
  }
  if (!HORARIOS.includes(horario)) {
    return res.status(400).json({ campo: "horario", mensaje: "Elegi un horario disponible." });
  }

  const datos = db.leer();

  // CP-010: segunda barrera contra la doble reserva. Aunque el front falle,
  // el backend no crea un segundo registro para el mismo invitado y horario.
  const duplicada = datos.reservas.find((r) => r.email === email && r.horario === horario);
  if (duplicada) {
    return res.status(409).json({
      mensaje: "Ya tenes una reserva confirmada para ese horario.",
      reserva: duplicada,
    });
  }

  // El horario tampoco puede quedar tomado por dos invitados distintos.
  if (datos.reservas.some((r) => r.horario === horario)) {
    return res.status(409).json({ campo: "horario", mensaje: "Ese horario ya fue reservado." });
  }

  const reserva = {
    id: db.siguienteId(datos.reservas),
    nombre,
    email,
    telefono: telefono || null,
    nota: nota || null,
    horario,
    estado: "Confirmada",
    creadaEn: new Date().toISOString(),
  };
  datos.reservas.push(reserva);
  db.escribir(datos);

  // CP-007: notificacion al invitado y aviso al administrador
  correo.enviarConfirmacionReserva(reserva);
  correo.notificarAdministrador(reserva);

  res.status(201).json({ mensaje: "Reserva confirmada.", reserva });
});

app.get("/api/reservas", (req, res) => {
  res.json(db.leer().reservas);
});

// Endpoint auxiliar para la ejecucion de las pruebas: permite al tester
// verificar el estado de la base sin abrir el archivo a mano.
app.get("/api/estado", (req, res) => {
  const datos = db.leer();
  res.json({
    usuarios: datos.usuarios.map((u) => ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol })),
    reservas: datos.reservas,
    tokensRecuperacion: datos.tokensRecuperacion.length,
  });
});

// ---------------------------------------------------------------------- arranque

db.inicializar();

app.listen(PUERTO, () => {
  console.log("");
  console.log("  AgendaYa escuchando en http://localhost:" + PUERTO);
  console.log("");
  console.log("  Usuarios precargados para las pruebas:");
  console.log("    admin@agendaya.com        Contrasena123!    (CP-001, CP-002)");
  console.log("    hola.comova@agendaya.com  Recuperar2025!    (CP-005)");
  console.log("");
});

module.exports = app;
