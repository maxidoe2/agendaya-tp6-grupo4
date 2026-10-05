/**
 * M04 - Booking publico | Variantes de error del flujo de reserva:
 *   - por estado del sistema: horario no disponible (flujo opcional del modulo)
 *   - por datos invalidos: falta el correo electronico
 * Responsable: Estudillo Maximo
 * Trazabilidad: AYA-M04-RF-03 y AYA-M04-RF-05 / CP-008 / enunciado 3.1
 */
import { proximoDiaHabil, proximoSabado } from "../support/fechas";

describe("AgendaYA - M04 Booking: reserva con errores", () => {
  const dia = proximoDiaHabil();

  beforeEach(() => {
    cy.intercept("POST", "/api/reservas").as("crearReserva");
    cy.visit("/reservar.html");
  });

  it("informa que el horario ya fue reservado si otro invitado lo tomo antes", () => {
    // Arrange: el invitado elige las 15:00 y completa sus datos...
    cy.get('[data-cy="fecha-input"]').type(dia);
    cy.get('[data-cy="slot-1500"]').should("be.enabled").click();
    cy.get('[data-cy="nombre-input"]').type("Ana Gomez");
    cy.get('[data-cy="email-input"]').type("ana.gomez@ejemplo.com");
    // ...mientras tanto otro invitado reserva ese mismo turno desde otro dispositivo
    cy.request("POST", "/api/reservas", {
      nombre: "Otro Invitado",
      email: "otro@ejemplo.com",
      fecha: dia,
      hora: "15:00",
    });

    // Act: confirmar la reserva sobre un turno que ya no esta libre
    cy.get('[data-cy="submit-booking"]').click();

    // Assert: conflicto 409 con el mensaje del enunciado, agenda actualizada y
    // el turno sigue siendo del primer invitado
    cy.wait("@crearReserva").its("response.statusCode").should("eq", 409);
    cy.get('[data-cy="alerta-error"]')
      .should("be.visible")
      .and("have.text", "Este horario ya fue reservado. Por favor elegí otro.");
    cy.get('[data-cy="slot-1500"]').should("be.disabled").and("contain", "reservado");
    cy.get('[data-cy="booking-confirmation"]').should("not.be.visible");
    cy.get('[data-cy="submit-booking"]').should("be.enabled");
    cy.request("/api/reservas").its("body").should("have.length", 1)
      .its(0).its("email").should("eq", "otro@ejemplo.com");
  });

  it("no envia la reserva si falta el correo y resalta el campo", () => {
    // Arrange: horario elegido y solo el nombre completo (CP-008)
    cy.get('[data-cy="fecha-input"]').type(dia);
    cy.get('[data-cy="slot-0900"]').click();
    cy.get('[data-cy="nombre-input"]').type("Juan Perez");

    // Act: intentar confirmar
    cy.get('[data-cy="submit-booking"]').click();

    // Assert: mensaje visible en el campo y ningun pedido al servidor
    cy.get('[data-cy="error-email"]')
      .should("be.visible")
      .and("have.text", "Ingresa tu correo electronico para confirmar la reserva.");
    cy.get("@crearReserva.all").should("have.length", 0);
    cy.get('[data-cy="booking-confirmation"]').should("not.be.visible");
  });

  it("un sabado no ofrece horarios", () => {
    // Arrange: dia no habil segun la disponibilidad del administrador (M02)
    const sabado = proximoSabado();

    // Act: elegir el sabado en el calendario
    cy.get('[data-cy="fecha-input"]').type(sabado);

    // Assert: no se muestra ningun turno y se explica por que
    cy.get('[data-cy="agenda-vacia"]')
      .should("be.visible")
      .and("have.text", "Ese dia no hay turnos disponibles. Elegi otro dia.");
    cy.get('[data-cy^="slot-"]').should("not.exist");
  });
});
