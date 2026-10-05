/**
 * AgendaYA - Servidor (TP N6, Grupo 4 - 4K10)
 *
 * Toma como base la app del TP5 y la reorganiza para que sea testeable:
 * las reglas de negocio viven en src/logica (compartidas con el navegador y
 * cubiertas por tests unitarios) y en server/seguridad.js. Este archivo solo
 * traduce HTTP <-> logica <-> persistencia.
 *
 *   Modulo 1 - Autenticacion
 *     AYA-M01-RF-01  Registro de administrador
 *     AYA-M01-RF-02  Recuperacion de contrasena
 *     AYA-M01-RF-04  Inicio de sesion (el cierre de sesion es del lado del navegador)
 *
 *   Modulo 4 - Booking publico
 *     AYA-M04-RF-03  Seleccion de fecha y hora + confirmacion de reserva
 *     AYA-M04-RF-05  Prevencion de reservas duplicadas / horario no disponible
 */

const express = require("express");
const path = require("path");
const db = require("./db");
const correo = require("./correo");
const seguridad = require("./seguridad");
const validaciones = require("../src/logica/validaciones");
const reservas = require("../src/logica/reservas");

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));
// La logica de negocio se sirve tal cual al navegador: la misma que prueba Jest
app.use("/logica", express.static(path.join(__dirname, "..", "src", "logica")));

function usuarioPublico(u) {
  return { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol };
}

// ------------------------------------------------------- MODULO 1: AUTENTICACION

/** AYA-M01-RF-01 - Registro de administrador. */
app.post("/api/registro", (req, res) => {
  const error = validaciones.validarRegistro(req.body);
  if (error) return res.status(400).json(error);

  const nombre = String(req.body.nombre).trim();
  const email = validaciones.normalizarEmail(req.body.email);
  const datos = db.leer();

  if (datos.usuarios.some((u) => u.email === email)) {
    return res.status(409).json({ campo: "email", mensaje: "El correo ya existe en el sistema." });
  }

  const usuario = {
    id: db.siguienteId(datos.usuarios),
    nombre,
    email,
    password: seguridad.hashearPassword(req.body.password),
    rol: "administrador",
    creadoEn: new Date().toISOString(),
  };
  datos.usuarios.push(usuario);
  db.escribir(datos);

  res.status(201).json({ mensaje: "Cuenta creada.", usuario: usuarioPublico(usuario) });
});

/** AYA-M01-RF-04 - Inicio de sesion. */
app.post("/api/login", (req, res) => {
  const error = validaciones.validarLogin(req.body);
  if (error) return res.status(400).json(error);

  const email = validaciones.normalizarEmail(req.body.email);
  const usuario = db.leer().usuarios.find((u) => u.email === email);

  if (!usuario) {
    return res.status(401).json({ campo: "email", mensaje: "El usuario no existe." });
  }
  if (!seguridad.verificarPassword(req.body.password, usuario.password)) {
    return res.status(401).json({ campo: "password", mensaje: "Contrasena incorrecta, intentelo de nuevo." });
  }

  res.json({ mensaje: "Sesion iniciada.", usuario: usuarioPublico(usuario) });
});

/** AYA-M01-RF-02 - Recuperacion de contrasena. */
app.post("/api/recuperar", (req, res) => {
  const email = validaciones.normalizarEmail(req.body.email);
  if (!validaciones.esEmailValido(email)) {
    return res.status(400).json({ campo: "email", mensaje: "Ingresa un correo electronico valido." });
  }

  const datos = db.leer();
  if (!datos.usuarios.some((u) => u.email === email)) {
    return res.status(404).json({
      campo: "email",
      mensaje: "El correo ingresado no se encuentra previamente registrado.",
    });
  }

  const registro = seguridad.crearTokenRecuperacion(email, new Date());
  datos.tokensRecuperacion.push(registro);
  db.escribir(datos);
  correo.enviarEnlaceRecuperacion(email, registro.token);

  res.json({ mensaje: "Revisa tu correo de entrada." });
});

/** Cierra el circuito de AYA-M01-RF-02: el enlace permite fijar una contrasena nueva. */
app.post("/api/restablecer", (req, res) => {
  const token = String(req.body.token || "").trim();
  const datos = db.leer();
  const registro = datos.tokensRecuperacion.find((t) => t.token === token);

  if (!registro) return res.status(400).json({ mensaje: "El enlace no es valido." });
  if (!seguridad.tokenVigente(registro, new Date())) {
    return res.status(400).json({ mensaje: "El enlace vencio. Pedi uno nuevo." });
  }
  const evaluacion = validaciones.evaluarPassword(req.body.password);
  if (!evaluacion.valida) {
    return res.status(400).json({
      campo: "password",
      mensaje: "La contrasena no es segura. " + evaluacion.errores.join(" "),
    });
  }

  const usuario = datos.usuarios.find((u) => u.email === registro.email);
  usuario.password = seguridad.hashearPassword(req.body.password);
  datos.tokensRecuperacion = datos.tokensRecuperacion.filter((t) => t.token !== token);
  db.escribir(datos);

  res.json({ mensaje: "Contrasena actualizada. Ya podes iniciar sesion." });
});

// ------------------------------------------------------------ MODULO 4: BOOKING

/** Agenda de un dia: turnos y si se pueden tomar. */
app.get("/api/horarios", (req, res) => {
  const fecha = String(req.query.fecha || "");
  if (!reservas.esFechaValida(fecha)) {
    return res.status(400).json({ campo: "fecha", mensaje: "Elegi un dia para tu turno." });
  }
  res.json(reservas.agendaDelDia(fecha, db.leer().reservas, new Date()));
});

/**
 * AYA-M04-RF-03 y AYA-M04-RF-05 - Confirmacion de reserva.
 * Todas las reglas (datos obligatorios, dia habil, turno pasado, antelacion,
 * turno ocupado y doble envio) se evaluan en reservas.evaluarReserva.
 */
app.post("/api/reservas", (req, res) => {
  const solicitud = {
    nombre: String(req.body.nombre || "").trim(),
    email: validaciones.normalizarEmail(req.body.email),
    fecha: String(req.body.fecha || "").trim(),
    hora: String(req.body.hora || "").trim(),
  };
  const datos = db.leer();

  const rechazo = reservas.evaluarReserva(solicitud, datos.reservas, new Date());
  if (rechazo) {
    const { codigo, ...cuerpo } = rechazo;
    return res.status(codigo).json(cuerpo);
  }

  const reserva = {
    id: db.siguienteId(datos.reservas),
    nombre: solicitud.nombre,
    email: solicitud.email,
    telefono: String(req.body.telefono || "").trim() || null,
    nota: String(req.body.nota || "").trim() || null,
    fecha: solicitud.fecha,
    hora: solicitud.hora,
    estado: "Confirmada",
    creadaEn: new Date().toISOString(),
  };
  datos.reservas.push(reserva);
  db.escribir(datos);

  correo.enviarConfirmacionReserva(reserva);
  correo.notificarAdministrador(reserva);

  res.status(201).json({ mensaje: "Reserva confirmada.", reserva });
});

app.get("/api/reservas", (req, res) => {
  res.json(db.leer().reservas);
});

// ---------------------------------------------------------------------- arranque

db.inicializar();

if (require.main === module) {
  app.listen(PUERTO, () => {
    console.log("");
    console.log("  AgendaYA escuchando en http://localhost:" + PUERTO);
    console.log("");
    console.log("  Usuarios precargados:");
    console.log("    admin@agendaya.com        Contrasena123!");
    console.log("    hola.comova@agendaya.com  Recuperar2025!");
    console.log("");
  });
}

module.exports = app;
