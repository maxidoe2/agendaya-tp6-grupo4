// Se ejecuta antes de cada archivo de tests E2E.

// Cada test arranca desde un estado conocido: los tests no dependen entre si
// ni del orden en que se ejecutan.
beforeEach(() => {
  cy.task("reiniciarBase");
});

// Evidencia: captura del runner (app + log de comandos) al final de cada test.
afterEach(function () {
  const nombre = this.currentTest.title.replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 80);
  cy.screenshot(nombre, { capture: "runner" });
});
