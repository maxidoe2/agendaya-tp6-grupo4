/**
 * M04 - Datos obligatorios de la reserva y conflictos de turno
 * Responsable: Estudillo Maximo
 * Funciones: validarDatosReserva, detectarConflicto, evaluarReserva
 */
const {
  validarDatosReserva,
  detectarConflicto,
  evaluarReserva,
  MENSAJES,
} = require("../../src/logica/reservas");

const solicitud = {
  fecha: "2026-10-13",
  hora: "10:00",
  nombre: "Juan Perez",
  email: "juan.perez@ejemplo.com",
};

describe("validarDatosReserva", () => {
  it("con fecha, hora, nombre y correo validos no devuelve error (caso normal)", () => {
    expect(validarDatosReserva(solicitud)).toBeNull();
  });

  it("sin correo marca el campo email con el mensaje de CP-008 (caso invalido)", () => {
    expect(validarDatosReserva({ ...solicitud, email: "" })).toEqual({
      campo: "email",
      mensaje: "Ingresa tu correo electronico para confirmar la reserva.",
    });
  });

  it("distingue un correo vacio de uno mal escrito (caso borde)", () => {
    expect(validarDatosReserva({ ...solicitud, email: "juan.perez" }).mensaje).toBe(
      "Ingresa un correo electronico valido."
    );
  });

  it("sin horario elegido pide elegir uno antes que los datos personales", () => {
    expect(validarDatosReserva({ ...solicitud, hora: null, nombre: "" }).campo).toBe("hora");
  });
});

describe("detectarConflicto", () => {
  const existentes = [
    { id: 1, fecha: "2026-10-13", hora: "10:00", email: "otro@ejemplo.com", estado: "Confirmada" },
  ];

  it("un turno libre no tiene conflicto (caso normal)", () => {
    expect(detectarConflicto(existentes, { ...solicitud, hora: "11:00" })).toBeNull();
  });

  it("un turno tomado por otro invitado devuelve 'ocupado' con el mensaje del enunciado", () => {
    expect(detectarConflicto(existentes, solicitud)).toEqual({
      tipo: "ocupado",
      mensaje: "Este horario ya fue reservado. Por favor elegí otro.",
    });
  });

  it("el mismo invitado reenviando su reserva es 'duplicada', aunque cambie mayusculas (CP-010)", () => {
    const repetida = { ...solicitud, email: "  OTRO@ejemplo.com " };
    expect(detectarConflicto(existentes, repetida).tipo).toBe("duplicada");
  });

  it("una reserva cancelada libera el turno (caso borde)", () => {
    const cancelada = [{ ...existentes[0], estado: "Cancelada" }];
    expect(detectarConflicto(cancelada, solicitud)).toBeNull();
  });
});

describe("evaluarReserva (regla completa que aplica el servidor)", () => {
  const ahora = new Date(2026, 9, 12, 9, 0); // lunes 12/10/2026 09:00

  it("rechaza con 400 un turno de hoy sin la antelacion minima de 2 horas", () => {
    const rechazo = evaluarReserva({ ...solicitud, fecha: "2026-10-12", hora: "10:00" }, [], ahora);
    expect(rechazo.codigo).toBe(400);
    expect(rechazo.mensaje).toBe("Los turnos se reservan con al menos 2 horas de anticipacion.");
  });

  it("rechaza con 409 un turno ocupado y acepta (null) uno libre", () => {
    const ocupado = [{ fecha: "2026-10-13", hora: "10:00", email: "otro@ejemplo.com", estado: "Confirmada" }];
    expect(evaluarReserva(solicitud, ocupado, ahora)).toMatchObject({ codigo: 409, mensaje: MENSAJES.ocupado });
    expect(evaluarReserva(solicitud, [], ahora)).toBeNull();
  });
});
