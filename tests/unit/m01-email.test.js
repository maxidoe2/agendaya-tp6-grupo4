/**
 * M01 - Validacion de email
 * Responsable: Barchiesi Santino
 * Funciones: normalizarEmail, esEmailValido, validarLogin
 */
const { normalizarEmail, esEmailValido, validarLogin } = require("../../src/logica/validaciones");

describe("normalizarEmail", () => {
  it("quita espacios y pasa a minusculas (caso normal)", () => {
    expect(normalizarEmail("  Admin@AgendaYA.com ")).toBe("admin@agendaya.com");
  });

  it("devuelve texto vacio para null o undefined (caso borde)", () => {
    expect(normalizarEmail(null)).toBe("");
    expect(normalizarEmail(undefined)).toBe("");
  });
});

describe("esEmailValido", () => {
  it("acepta un email con usuario, dominio y extension (caso normal)", () => {
    expect(esEmailValido("leo.messi@gmail.com")).toBe(true);
  });

  it("rechaza emails sin @, sin dominio o sin extension (casos invalidos)", () => {
    expect(esEmailValido("leo.messi.gmail.com")).toBe(false);
    expect(esEmailValido("leo@")).toBe(false);
    expect(esEmailValido("leo@gmail")).toBe(false);
  });

  it("rechaza espacios internos y extensiones de una sola letra (casos borde)", () => {
    expect(esEmailValido("leo messi@gmail.com")).toBe(false);
    expect(esEmailValido("leo@gmail.c")).toBe(false);
  });

  it("rechaza valores que no son texto (caso invalido)", () => {
    expect(esEmailValido(undefined)).toBe(false);
    expect(esEmailValido(12345)).toBe(false);
  });
});

describe("validarLogin", () => {
  it("con usuario y contrasena completos no devuelve error (caso normal)", () => {
    expect(validarLogin({ email: "admin@agendaya.com", password: "Contrasena123!" })).toBeNull();
  });

  it("con el usuario vacio marca el campo email (caso invalido)", () => {
    expect(validarLogin({ email: "   ", password: "Contrasena123!" })).toEqual({
      campo: "email",
      mensaje: "Ingresa tu usuario.",
    });
  });
});
