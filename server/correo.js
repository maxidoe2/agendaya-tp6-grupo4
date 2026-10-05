/**
 * Envio de correo.
 *
 * En esta implementacion los correos se escriben en la consola del servidor y se
 * registran en data/correos.log en lugar de enviarse por SMTP. Esto permite al
 * tester verificar de forma objetiva que el envio se dispara (CP-005 y CP-007)
 * sin depender de una casilla real ni de un servicio externo.
 *
 * Para pasar a envio real solo hay que reemplazar el cuerpo de estas funciones
 * por una llamada al proveedor de correo; la firma no cambia.
 */

const fs = require("fs");
const path = require("path");

const BITACORA = path.join(__dirname, "..", "data", "correos.log");
const ADMIN = "admin@agendaya.com";

function registrar(destinatario, asunto, cuerpo) {
  const marca = new Date().toISOString();
  const bloque =
    "\n" +
    "==================================================\n" +
    "Fecha:  " + marca + "\n" +
    "Para:   " + destinatario + "\n" +
    "Asunto: " + asunto + "\n" +
    "--------------------------------------------------\n" +
    cuerpo + "\n" +
    "==================================================\n";

  fs.appendFileSync(BITACORA, bloque, "utf8");

  console.log("");
  console.log("  [CORREO ENVIADO]");
  console.log("    Para:   " + destinatario);
  console.log("    Asunto: " + asunto);
  cuerpo.split("\n").forEach((linea) => console.log("    " + linea));
  console.log("");
}

function enviarEnlaceRecuperacion(email, token) {
  const enlace = "http://localhost:3000/restablecer.html?token=" + token;
  registrar(
    email,
    "Restablece tu contrasena de AgendaYa",
    "Recibimos un pedido para restablecer tu contrasena.\n" +
      "Abri este enlace para elegir una nueva:\n" +
      enlace + "\n\n" +
      "El enlace vence en 30 minutos.\n" +
      "Si no pediste el cambio, ignora este mensaje."
  );
}

function enviarConfirmacionReserva(reserva) {
  registrar(
    reserva.email,
    "Tu reserva en AgendaYa quedo confirmada",
    "Hola " + reserva.nombre + ",\n\n" +
      "Tu reserva quedo confirmada.\n" +
      "  Horario: " + reserva.horario + "\n" +
      "  Codigo:  #" + reserva.id + "\n\n" +
      "Si necesitas cancelarla, responde este correo."
  );
}

function notificarAdministrador(reserva) {
  registrar(
    ADMIN,
    "Nueva reserva: " + reserva.horario,
    "Se registro una nueva reserva.\n" +
      "  Invitado: " + reserva.nombre + "\n" +
      "  Correo:   " + reserva.email + "\n" +
      "  Telefono: " + (reserva.telefono || "no informado") + "\n" +
      "  Horario:  " + reserva.horario + "\n" +
      "  Nota:     " + (reserva.nota || "sin nota") + "\n" +
      "  Codigo:   #" + reserva.id
  );
}

module.exports = { enviarEnlaceRecuperacion, enviarConfirmacionReserva, notificarAdministrador };
