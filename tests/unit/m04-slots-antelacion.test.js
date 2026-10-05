/**
 * M04 - Calculo de turnos y antelacion minima
 * Responsable: Navarro Matias
 * Funciones: calcularSlots, cumpleAntelacion, esDiaHabil, agendaDelDia
 */
const { calcularSlots, cumpleAntelacion, esDiaHabil, agendaDelDia } = require("../../src/logica/reservas");

describe("calcularSlots", () => {
  it("genera un turno por hora entre el inicio y el fin (caso normal)", () => {
    expect(calcularSlots("09:00", "12:00", 60)).toEqual(["09:00", "10:00", "11:00"]);
  });

  it("no ofrece un turno que terminaria despues del horario de fin (caso borde)", () => {
    expect(calcularSlots("09:00", "10:30", 60)).toEqual(["09:00"]);
    expect(calcularSlots("09:00", "10:30", 45)).toEqual(["09:00", "09:45"]);
  });

  it("devuelve una lista vacia si el inicio y el fin son iguales o la duracion no entra", () => {
    expect(calcularSlots("09:00", "09:00", 30)).toEqual([]);
    expect(calcularSlots("09:00", "09:30", 60)).toEqual([]);
  });

  it("lanza un error ante una duracion o una hora invalidas (caso invalido)", () => {
    expect(() => calcularSlots("09:00", "12:00", 0)).toThrow("entero positivo");
    expect(() => calcularSlots("09:00", "12:00", -30)).toThrow("entero positivo");
    expect(() => calcularSlots("9am", "12:00", 60)).toThrow("Hora invalida");
  });
});

describe("cumpleAntelacion", () => {
  const ahora = new Date(2026, 9, 12, 8, 0); // lunes 12/10/2026 08:00 (hora local)

  it("acepta un turno con mas de 2 horas de anticipacion (caso normal)", () => {
    expect(cumpleAntelacion(new Date(2026, 9, 12, 11, 0), ahora, 2)).toBe(true);
  });

  it("acepta exactamente 2 horas y rechaza 1 minuto menos (caso borde)", () => {
    expect(cumpleAntelacion(new Date(2026, 9, 12, 10, 0), ahora, 2)).toBe(true);
    expect(cumpleAntelacion(new Date(2026, 9, 12, 9, 59), ahora, 2)).toBe(false);
  });

  it("rechaza turnos pasados o en el instante actual, aun sin antelacion exigida (caso invalido)", () => {
    expect(cumpleAntelacion(new Date(2026, 9, 11, 10, 0), ahora, 2)).toBe(false);
    expect(cumpleAntelacion(ahora, ahora, 0)).toBe(false);
  });
});

describe("esDiaHabil", () => {
  const config = { diasHabiles: [1, 2, 3, 4, 5], diasBloqueados: ["2026-10-12"] };

  it("un dia de semana sin bloqueo es habil y un sabado no", () => {
    expect(esDiaHabil("2026-10-13", config)).toBe(true); // martes
    expect(esDiaHabil("2026-10-17", config)).toBe(false); // sabado
  });

  it("un dia bloqueado por el administrador o una fecha imposible no son habiles", () => {
    expect(esDiaHabil("2026-10-12", config)).toBe(false); // lunes bloqueado
    expect(esDiaHabil("2026-02-30", config)).toBe(false); // no existe
  });
});

// Agregado tras la revision critica: el reporte de cobertura mostraba que
// agendaDelDia (la funcion que combina todas las reglas anteriores) no tenia
// tests unitarios y solo quedaba cubierta por los E2E.
describe("agendaDelDia", () => {
  const config = {
    diasHabiles: [1, 2, 3, 4, 5],
    inicio: "09:00",
    fin: "13:00",
    duracionMin: 60,
    antelacionMinHoras: 2,
    diasBloqueados: [],
  };
  const ahora = new Date(2026, 9, 12, 9, 30); // lunes 12/10/2026 09:30

  it("marca cada turno de hoy con el motivo por el que no se puede tomar", () => {
    const reservas = [{ fecha: "2026-10-12", hora: "12:00", email: "x@y.com", estado: "Confirmada" }];
    expect(agendaDelDia("2026-10-12", reservas, ahora, config)).toEqual({
      fecha: "2026-10-12",
      habil: true,
      slots: [
        { hora: "09:00", disponible: false, motivo: "pasado" },
        { hora: "10:00", disponible: false, motivo: "antelacion" },
        { hora: "11:00", disponible: false, motivo: "antelacion" },
        { hora: "12:00", disponible: false, motivo: "ocupado" },
      ],
    });
  });

  it("un dia no habil no ofrece turnos", () => {
    expect(agendaDelDia("2026-10-17", [], ahora, config)).toEqual({
      fecha: "2026-10-17",
      habil: false,
      slots: [],
    });
  });
});
