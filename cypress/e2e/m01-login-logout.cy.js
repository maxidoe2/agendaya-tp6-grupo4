/**
 * M01 - Autenticacion | Flujo obligatorio: Login y logout
 * Responsable: Barchiesi Santino
 * Trazabilidad: AYA-M01-RF-04 / CP-001 y CP-002
 */
describe("AgendaYA - M01 Autenticacion: login y logout", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("inicia sesion, entra al panel y al cerrar sesion pierde el acceso", () => {
    // Arrange: credenciales del administrador precargado
    cy.get('[data-cy="email-input"]').type("admin@agendaya.com");
    cy.get('[data-cy="password-input"]').type("Contrasena123!");

    // Act (1): iniciar sesion
    cy.get('[data-cy="login-button"]').click();

    // Assert (1): llega al panel con su usuario
    cy.url().should("include", "/dashboard");
    cy.get('[data-cy="dashboard-welcome"]').should("have.text", "Hola, Administrador AgendaYa");

    // Act (2): cerrar sesion
    cy.get('[data-cy="logout-button"]').click();

    // Assert (2): vuelve al login con confirmacion y el panel queda protegido
    cy.location("pathname").should("eq", "/");
    cy.get('[data-cy="alerta-exito"]').should("be.visible").and("have.text", "Cerraste sesión correctamente.");
    cy.visit("/dashboard.html");
    cy.location("pathname").should("eq", "/");
  });

  it("con contrasena incorrecta no ingresa y limpia el campo de contrasena", () => {
    // Arrange: usuario existente con una contrasena equivocada
    cy.get('[data-cy="email-input"]').type("admin@agendaya.com");
    cy.get('[data-cy="password-input"]').type("ContrasenaInvalida123");

    // Act: intentar ingresar
    cy.get('[data-cy="login-button"]').click();

    // Assert: mensaje exacto de CP-002, campo vacio y sin acceso al panel
    cy.get('[data-cy="alerta-error"]')
      .should("be.visible")
      .and("have.text", "Contrasena incorrecta, intentelo de nuevo.");
    cy.get('[data-cy="password-input"]').should("have.value", "");
    cy.location("pathname").should("eq", "/");
  });
});
