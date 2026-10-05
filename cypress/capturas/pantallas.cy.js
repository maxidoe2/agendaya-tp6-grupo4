/**
 * No es un test: genera las capturas de las pantallas para el informe.
 *   npx cypress run --config specPattern=cypress/capturas/*.cy.js
 */
import { proximoDiaHabil } from "../support/fechas";

describe("Capturas de pantallas para el informe", () => {
  it("genera las capturas", () => {
    cy.visit("/");
    cy.get('[data-cy="login-button"]').click();
    cy.screenshot("pantalla-1-login-campos-vacios", { capture: "viewport" });

    cy.visit("/registro.html");
    cy.get('[data-cy="nombre-input"]').type("Leonel Messi");
    cy.get('[data-cy="email-input"]').type("leo.messi@gmail.com");
    cy.get('[data-cy="password-input"]').type("messi");
    cy.get('[data-cy="registro-button"]').click();
    cy.screenshot("pantalla-2-registro-contrasena-insegura", { capture: "viewport" });

    const dia = proximoDiaHabil();
    cy.request("POST", "/api/reservas", { nombre: "Ana Gomez", email: "ana@ejemplo.com", fecha: dia, hora: "11:00" });
    cy.visit("/reservar.html");
    cy.get('[data-cy="fecha-input"]').type(dia);
    cy.get('[data-cy="slot-1000"]').click();
    cy.get('[data-cy="nombre-input"]').type("Juan Perez");
    cy.get('[data-cy="email-input"]').type("juan.perez@ejemplo.com");
    cy.screenshot("pantalla-3-reserva-fecha-y-horario", { capture: "viewport" });
    cy.get('[data-cy="submit-booking"]').click();
    cy.get('[data-cy="booking-confirmation"]').should("be.visible");
    cy.scrollTo("top");
    cy.screenshot("pantalla-4-reserva-confirmada", { capture: "viewport" });

    cy.visit("/");
    cy.get('[data-cy="email-input"]').type("admin@agendaya.com");
    cy.get('[data-cy="password-input"]').type("Contrasena123!");
    cy.get('[data-cy="login-button"]').click();
    cy.get('[data-cy="reserva-item"]').should("have.length", 2);
    cy.screenshot("pantalla-5-panel-con-reservas", { capture: "viewport" });
  });
});
