/**
 * M01 - Contrasenas con hash y enlace de recuperacion
 * Responsable: Barchiesi Santino
 * Funciones: hashearPassword, verificarPassword, crearTokenRecuperacion, tokenVigente
 */
const {
  hashearPassword,
  verificarPassword,
  crearTokenRecuperacion,
  tokenVigente,
} = require("../../server/seguridad");

describe("hashearPassword / verificarPassword", () => {
  it("el hash no contiene la contrasena y la verificacion la reconoce (caso normal)", () => {
    const hash = hashearPassword("Contrasena123!");
    expect(hash).not.toContain("Contrasena123!");
    expect(verificarPassword("Contrasena123!", hash)).toBe(true);
  });

  it("rechaza una contrasena distinta, aunque difiera en una sola letra (caso invalido)", () => {
    const hash = hashearPassword("Contrasena123!");
    expect(verificarPassword("contrasena123!", hash)).toBe(false);
  });

  it("la misma contrasena genera hashes distintos por la sal aleatoria (caso borde)", () => {
    expect(hashearPassword("Messimessi12")).not.toBe(hashearPassword("Messimessi12"));
  });

  it("un hash guardado con formato invalido devuelve false en lugar de romper", () => {
    expect(verificarPassword("Contrasena123!", "no-es-un-hash")).toBe(false);
    expect(verificarPassword("Contrasena123!", "sal:abc")).toBe(false);
    expect(verificarPassword("Contrasena123!", undefined)).toBe(false);
  });

  it("no permite hashear una contrasena vacia", () => {
    expect(() => hashearPassword("")).toThrow("no puede estar vacia");
  });
});

describe("crearTokenRecuperacion / tokenVigente", () => {
  const ahora = new Date("2026-10-05T12:00:00.000Z");

  it("un enlace recien creado vence a los 30 minutos y esta vigente (caso normal)", () => {
    const registro = crearTokenRecuperacion("hola.comova@agendaya.com", ahora);
    expect(registro.expiraEn).toBe("2026-10-05T12:30:00.000Z");
    expect(registro.token).toMatch(/^[0-9a-f]{48}$/);
    expect(tokenVigente(registro, ahora)).toBe(true);
  });

  it("vale un milisegundo antes del vencimiento y ya no vale en el instante exacto (caso borde)", () => {
    const registro = { expiraEn: "2026-10-05T12:30:00.000Z" };
    expect(tokenVigente(registro, new Date("2026-10-05T12:29:59.999Z"))).toBe(true);
    expect(tokenVigente(registro, new Date("2026-10-05T12:30:00.000Z"))).toBe(false);
  });

  it("un registro inexistente o con fecha ilegible no es vigente (caso invalido)", () => {
    expect(tokenVigente(null, ahora)).toBe(false);
    expect(tokenVigente({ expiraEn: "manana" }, ahora)).toBe(false);
  });
});
