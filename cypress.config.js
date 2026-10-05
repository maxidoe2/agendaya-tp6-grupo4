const { defineConfig } = require("cypress");
const fs = require("fs");
const db = require("./server/db");
const correo = require("./server/correo");

module.exports = defineConfig({
  e2e: {
    // Una sola URL base: los tests usan rutas relativas (cy.visit("/registro.html"))
    baseUrl: "http://localhost:3000",
    video: true,
    viewportWidth: 1100,
    viewportHeight: 1050,
    setupNodeEvents(on) {
      // Tareas que corren en Node para preparar y verificar el estado del sistema
      on("task", {
        /** Deja la base como recien instalada: 2 usuarios y 0 reservas. */
        reiniciarBase() {
          if (fs.existsSync(correo.BITACORA)) fs.unlinkSync(correo.BITACORA);
          db.reiniciar();
          return null;
        },
        /** Devuelve los correos registrados por el sistema (envio simulado). */
        leerCorreos() {
          return fs.existsSync(correo.BITACORA) ? fs.readFileSync(correo.BITACORA, "utf8") : "";
        },
      });
    },
  },
});
