/**
 * M04 - Booking publico | Flujos obligatorios: Seleccionar fecha y hora +
 * Completar formulario y confirmar reserva (happy path)
 * Responsable: Navarro Matias
 * Trazabilidad: AYA-M04-RF-03 y AYA-M04-RF-05 / CP-007 y CP-010
 */
import { proximoDiaHabil } from "../support/fechas";

describe("AgendaYA - M04 Booking: reserva exitosa", () => {
  const dia = proximoDiaHabil();

  beforeEach(() => {
    cy.visit("/reservar.html");
  });

  it("elige dia y horario, confirma la reserva y notifica a ambas partes", () => {
    // Arrange: elegir un dia habil futuro, un horario libre y completar los datos
    cy.get('[data-cy="fecha-input"]').type(dia);
    cy.get('[data-cy="slot-1000"]').should("be.enabled").click();
    cy.get('[data-cy="resumen-turno"]').should("contain", dia + " a las 10:00 h");
    cy.get('[data-cy="nombre-input"]').type("Juan Perez");
    cy.get('[data-cy="email-input"]').type("juan.perez@ejemplo.com");

    // Act: confirmar la reserva
    cy.get('[data-cy="submit-booking"]').click();

    // Assert: confirmacion visible, turno ocupado en la agenda y correos disparados
    cy.get('[data-cy="booking-confirmation"]')
      .should("be.visible")
      .and("contain", "Tu reserva fue confirmada")
      .and("contain", dia);
    cy.get('[data-cy="booking-codigo"]').should("have.text", "#1");
    cy.get('[data-cy="submit-booking"]').should("be.disabled");
    cy.get('[data-cy="slot-1000"]').should("be.disabled").and("contain", "reservado");
    cy.task("leerCorreos").then((correos) => {
      expect(correos).to.contain("Para:   juan.perez@ejemplo.com");
      expect(correos).to.contain("Para:   admin@agendaya.com");
    });
  });

  it("ante varios clicks rapidos en Confirmar registra una sola reserva", () => {
    // Arrange: formulario listo para confirmar
    cy.get('[data-cy="fecha-input"]').type(dia);
    cy.get('[data-cy="slot-1100"]').click();
    cy.get('[data-cy="nombre-input"]').type("Juan Perez");
    cy.get('[data-cy="email-input"]').type("juan.perez@ejemplo.com");

    // Act: tres clicks seguidos sobre el boton (force: el boton ya se deshabilita)
    cy.get('[data-cy="submit-booking"]').click().click({ force: true }).click({ force: true });

    // Assert: la reserva se confirma y en el sistema hay un unico registro
    cy.get('[data-cy="booking-confirmation"]').should("be.visible");
    cy.request("/api/reservas").its("body").should("have.length", 1);
  });
});
