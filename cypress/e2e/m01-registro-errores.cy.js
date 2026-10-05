/**
 * M01 - Autenticacion | Flujo obligatorio: Registro de usuario (variantes de error)
 * Responsable: Estudillo Maximo
 * Trazabilidad: AYA-M01-RF-01 / CP-004
 */
describe("AgendaYA - M01 Autenticacion: registro con errores", () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/registro").as("registro");
    cy.visit("/registro.html");
  });

  it("no envia el formulario vacio y explica que falta el nombre", () => {
    // Arrange: formulario sin completar (estado inicial de la pantalla)
    cy.get('[data-cy="nombre-input"]').should("have.value", "");

    // Act: intentar registrarse sin datos
    cy.get('[data-cy="registro-button"]').click();

    // Assert: error visible en el campo, sin pedido al servidor y sin salir de la pantalla
    cy.get('[data-cy="error-nombre"]').should("be.visible").and("have.text", "Ingresa tu nombre.");
    cy.get("@registro.all").should("have.length", 0);
    cy.url().should("include", "/registro.html");
  });

  it("rechaza un correo que ya esta registrado y no crea la cuenta", () => {
    // Arrange: ya existe una cuenta con ese correo (precondicion de CP-004)
    cy.request("POST", "/api/registro", {
      nombre: "Leonel Messi",
      email: "leo.messi@gmail.com",
      password: "Messimessi12",
    });
    cy.get('[data-cy="nombre-input"]').type("Leonel Messi");
    cy.get('[data-cy="email-input"]').type("leo.messi@gmail.com");
    cy.get('[data-cy="password-input"]').type("Messimessi13");

    // Act: intentar registrar el mismo correo otra vez
    cy.get('[data-cy="registro-button"]').click();

    // Assert: el servidor responde 409, se informa el motivo y no se entra al panel
    cy.wait("@registro").its("response.statusCode").should("eq", 409);
    cy.get('[data-cy="alerta-error"]')
      .should("be.visible")
      .and("have.text", "El correo ya existe en el sistema.");
    cy.get('[data-cy="error-email"]').should("be.visible");
    cy.url().should("include", "/registro.html");
  });
});
