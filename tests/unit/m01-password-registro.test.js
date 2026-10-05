/**
 * M01 - Contrasena segura y validacion del registro
 * Responsable: Estudillo Maximo
 * Funciones: evaluarPassword, validarRegistro
 */
const { evaluarPassword, validarRegistro } = require("../../src/logica/validaciones");

describe("evaluarPassword", () => {
  it("acepta una contrasena con 8+ caracteres, mayuscula, minuscula y numero (caso normal)", () => {
    expect(evaluarPassword("Messimessi12")).toEqual({ valida: true, errores: [] });
  });

  it("acepta exactamente 8 caracteres y rechaza 7 (caso borde del largo minimo)", () => {
    expect(evaluarPassword("Abcdef12").valida).toBe(true);
    expect(evaluarPassword("Abcde12")).toEqual({
      valida: false,
      errores: ["Debe tener al menos 8 caracteres."],
    });
  });

  it("informa cada regla incumplida por separado (caso invalido)", () => {
    const resultado = evaluarPassword("messimessi");
    expect(resultado.valida).toBe(false);
    expect(resultado.errores).toEqual([
      "Debe incluir al menos una mayuscula.",
      "Debe incluir al menos un numero.",
    ]);
  });

  it("trata una contrasena vacia o que no es texto como invalida sin lanzar error", () => {
    expect(evaluarPassword("").valida).toBe(false);
    expect(evaluarPassword(undefined).errores).toHaveLength(4);
  });
});

describe("validarRegistro", () => {
  const valido = { nombre: "Leonel Messi", email: "leo.messi@gmail.com", password: "Messimessi12" };

  it("con todos los datos validos no devuelve error (caso normal)", () => {
    expect(validarRegistro(valido)).toBeNull();
  });

  it("un nombre con solo espacios cuenta como vacio (caso borde)", () => {
    expect(validarRegistro({ ...valido, nombre: "   " })).toEqual({
      campo: "nombre",
      mensaje: "Ingresa tu nombre.",
    });
  });

  it("con la contrasena debil marca el campo password e incluye el motivo (caso invalido)", () => {
    const error = validarRegistro({ ...valido, password: "messi" });
    expect(error.campo).toBe("password");
    expect(error.mensaje).toContain("La contrasena no es segura.");
    expect(error.mensaje).toContain("al menos 8 caracteres");
  });

  it("informa primero el campo que aparece antes en el formulario", () => {
    expect(validarRegistro({ nombre: "", email: "mal", password: "" }).campo).toBe("nombre");
    expect(validarRegistro({ nombre: "Leo", email: "mal", password: "" }).campo).toBe("email");
  });
});
