/**
 * M01 - Autenticacion | Flujo obligatorio: Registro de usuario (happy path)
 * Responsable: Barchiesi Santino
 * Trazabilidad: AYA-M01-RF-01 / CP-003
 */
describe("AgendaYA - M01 Autenticacion: registro exitoso", () => {
  beforeEach(() => {
    cy.visit("/registro.html");
  });

  it("registra un administrador nuevo y lo deja dentro del panel", () => {
    // Arrange: completar el formulario con datos validos y un correo nuevo
    cy.get('[data-cy="nombre-input"]').type("Leonel Messi");
    cy.get('[data-cy="email-input"]').type("leo.messi@gmail.com");
    cy.get('[data-cy="password-input"]').type("Messimessi12");

    // Act: enviar el registro
    cy.get('[data-cy="registro-button"]').click();

    // Assert: se crea la cuenta y se accede al panel con la sesion del usuario nuevo
    cy.url().should("include", "/dashboard");
    cy.get('[data-cy="alerta-exito"]')
      .should("be.visible")
      .and("contain", "Tu cuenta fue creada correctamente.");
    cy.get('[data-cy="dashboard-welcome"]').should("have.text", "Hola, Leonel Messi");
    cy.get('[data-cy="usuario-email"]').should("contain", "leo.messi@gmail.com");
  });
});
