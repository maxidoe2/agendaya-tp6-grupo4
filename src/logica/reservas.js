/**
 * Modulo 4 - Booking publico: reglas de la reserva.
 *
 * Logica pura, compartida por el servidor, las pantallas y los tests unitarios.
 * Las funciones que dependen del reloj reciben "ahora" como parametro: asi los
 * tests no dependen del dia en que se ejecutan.
 *
 * Fechas como texto "AAAA-MM-DD" y horas como "HH:MM", en hora local.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) {
    module.exports = fabrica(require("./validaciones"));
  } else {
    raiz.AgendaReservas = fabrica(raiz.AgendaValidaciones);
  }
})(typeof self !== "undefined" ? self : this, function (validaciones) {
  /**
   * Disponibilidad del administrador. En el sistema completo la configura el
   * modulo M02 (Gestion de Disponibilidad); aca se fija porque M04 depende de
   * ella pero no la define.
   */
  const DISPONIBILIDAD = {
    diasHabiles: [1, 2, 3, 4, 5], // 0 = domingo ... 6 = sabado
    inicio: "09:00",
    fin: "17:00",
    duracionMin: 60,
    antelacionMinHoras: 2,
    diasBloqueados: [],
  };

  const MENSAJES = {
    ocupado: "Este horario ya fue reservado. Por favor elegí otro.",
    duplicada: "Ya tenes una reserva confirmada para ese horario.",
    pasado: "No se puede reservar en un horario pasado.",
    antelacion: "Los turnos se reservan con al menos {h} horas de anticipacion.",
    noHabil: "Ese dia no hay turnos disponibles. Elegi otro dia.",
    fueraDeAgenda: "Elegi un horario de la agenda.",
  };

  const PATRON_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
  const MS_POR_HORA = 60 * 60 * 1000;

  // ------------------------------------------------------------ fechas y horas

  function aMinutos(hora) {
    const partes = PATRON_HORA.exec(String(hora));
    if (!partes) throw new Error("Hora invalida: " + hora);
    return Number(partes[1]) * 60 + Number(partes[2]);
  }

  function aHora(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  /** true si el texto es una fecha de calendario real con formato AAAA-MM-DD. */
  function esFechaValida(fecha) {
    const partes = PATRON_FECHA.exec(String(fecha));
    if (!partes) return false;
    const anio = Number(partes[1]);
    const mes = Number(partes[2]);
    const dia = Number(partes[3]);
    const d = new Date(anio, mes - 1, dia);
    // Date "corrige" fechas imposibles (31/02 -> 03/03); si cambio, no existia
    return d.getFullYear() === anio && d.getMonth() === mes - 1 && d.getDate() === dia;
  }

  /** Convierte "AAAA-MM-DD" + "HH:MM" en un Date en hora local. */
  function fechaHoraLocal(fecha, hora) {
    if (!esFechaValida(fecha)) throw new Error("Fecha invalida: " + fecha);
    const [anio, mes, dia] = fecha.split("-").map(Number);
    const minutos = aMinutos(hora);
    return new Date(anio, mes - 1, dia, Math.floor(minutos / 60), minutos % 60);
  }

  /** Fecha local de un Date en formato AAAA-MM-DD (para el minimo del calendario). */
  function fechaIso(fecha) {
    return (
      fecha.getFullYear() + "-" +
      String(fecha.getMonth() + 1).padStart(2, "0") + "-" +
      String(fecha.getDate()).padStart(2, "0")
    );
  }

  // ----------------------------------------------------------------- slots

  /**
   * Genera los turnos de un dia: desde "inicio", cada "duracionMin" minutos,
   * mientras el turno completo termine antes o justo en "fin".
   *
   *   calcularSlots("09:00", "11:00", 60) -> ["09:00", "10:00"]
   *
   * Un rango vacio o mas corto que un turno devuelve []. Horas mal escritas o
   * una duracion que no sea un entero positivo son errores de configuracion y
   * lanzan una excepcion.
   */
  function calcularSlots(inicio, fin, duracionMin) {
    const desde = aMinutos(inicio);
    const hasta = aMinutos(fin);
    if (!Number.isInteger(duracionMin) || duracionMin <= 0) {
      throw new Error("La duracion debe ser un entero positivo de minutos.");
    }
    const slots = [];
    for (let t = desde; t + duracionMin <= hasta; t += duracionMin) {
      slots.push(aHora(t));
    }
    return slots;
  }

  /** true si ese dia se atiende: es un dia habil y no esta bloqueado. */
  function esDiaHabil(fecha, config) {
    const c = config || DISPONIBILIDAD;
    if (!esFechaValida(fecha)) return false;
    if ((c.diasBloqueados || []).includes(fecha)) return false;
    const [anio, mes, dia] = fecha.split("-").map(Number);
    return c.diasHabiles.includes(new Date(anio, mes - 1, dia).getDay());
  }

  /**
   * true si el turno es futuro y respeta la antelacion minima.
   * "No se puede reservar con menos de 2 horas": exactamente 2 horas SI se permite.
   */
  function cumpleAntelacion(fechaHora, ahora, horasMin) {
    const diferencia = fechaHora.getTime() - ahora.getTime();
    if (diferencia <= 0) return false;
    return diferencia >= (horasMin || 0) * MS_POR_HORA;
  }

  // -------------------------------------------------------------- reservas

  function mismaFranja(reserva, fecha, hora) {
    return reserva.fecha === fecha && reserva.hora === hora && reserva.estado !== "Cancelada";
  }

  /**
   * Busca un conflicto con las reservas existentes.
   * Devuelve null si el turno esta libre, o { tipo, mensaje } donde tipo es:
   *   "duplicada": el mismo invitado ya reservo ese turno (doble envio, CP-010)
   *   "ocupado":   otro invitado ya tomo ese turno
   */
  function detectarConflicto(reservas, solicitud) {
    const email = validaciones.normalizarEmail(solicitud.email);
    const enEseTurno = (reservas || []).filter((r) => mismaFranja(r, solicitud.fecha, solicitud.hora));
    if (enEseTurno.length === 0) return null;
    if (enEseTurno.some((r) => r.email === email)) {
      return { tipo: "duplicada", mensaje: MENSAJES.duplicada };
    }
    return { tipo: "ocupado", mensaje: MENSAJES.ocupado };
  }

  /**
   * Datos obligatorios del formulario de reserva (AYA-M04-RF-03).
   * Devuelve null si estan completos o el primer error como { campo, mensaje }.
   */
  function validarDatosReserva(datos) {
    const d = datos || {};
    if (!d.fecha || !esFechaValida(d.fecha)) {
      return { campo: "fecha", mensaje: "Elegi un dia para tu turno." };
    }
    if (!d.hora || !PATRON_HORA.test(d.hora)) {
      return { campo: "hora", mensaje: "Elegi un horario de la agenda." };
    }
    if (!String(d.nombre || "").trim()) {
      return { campo: "nombre", mensaje: "Ingresa tu nombre completo." };
    }
    const email = validaciones.normalizarEmail(d.email);
    if (!email) {
      return { campo: "email", mensaje: "Ingresa tu correo electronico para confirmar la reserva." };
    }
    if (!validaciones.esEmailValido(email)) {
      return { campo: "email", mensaje: "Ingresa un correo electronico valido." };
    }
    return null;
  }

  /**
   * Estado de la agenda de un dia: que turnos se muestran y cuales se pueden tomar.
   * Devuelve { fecha, habil, slots: [{ hora, disponible, motivo }] }
   * motivo: null | "pasado" | "antelacion" | "ocupado"
   */
  function agendaDelDia(fecha, reservas, ahora, config) {
    const c = config || DISPONIBILIDAD;
    if (!esDiaHabil(fecha, c)) return { fecha, habil: false, slots: [] };

    const slots = calcularSlots(c.inicio, c.fin, c.duracionMin).map((hora) => {
      const cuando = fechaHoraLocal(fecha, hora);
      let motivo = null;
      if (cuando.getTime() <= ahora.getTime()) motivo = "pasado";
      else if (!cumpleAntelacion(cuando, ahora, c.antelacionMinHoras)) motivo = "antelacion";
      else if ((reservas || []).some((r) => mismaFranja(r, fecha, hora))) motivo = "ocupado";
      return { hora, disponible: motivo === null, motivo };
    });
    return { fecha, habil: true, slots };
  }

  /**
   * Regla completa que aplica el servidor antes de registrar una reserva.
   * Devuelve null si se puede reservar, o { codigo, campo, mensaje } con el
   * codigo HTTP que corresponde (400 datos invalidos, 409 conflicto de estado).
   */
  function evaluarReserva(datos, reservas, ahora, config) {
    const c = config || DISPONIBILIDAD;
    const error = validarDatosReserva(datos);
    if (error) return Object.assign({ codigo: 400 }, error);

    if (!esDiaHabil(datos.fecha, c)) {
      return { codigo: 400, campo: "fecha", mensaje: MENSAJES.noHabil };
    }
    if (!calcularSlots(c.inicio, c.fin, c.duracionMin).includes(datos.hora)) {
      return { codigo: 400, campo: "hora", mensaje: MENSAJES.fueraDeAgenda };
    }
    const cuando = fechaHoraLocal(datos.fecha, datos.hora);
    if (cuando.getTime() <= ahora.getTime()) {
      return { codigo: 400, campo: "hora", mensaje: MENSAJES.pasado };
    }
    if (!cumpleAntelacion(cuando, ahora, c.antelacionMinHoras)) {
      return {
        codigo: 400,
        campo: "hora",
        mensaje: MENSAJES.antelacion.replace("{h}", c.antelacionMinHoras),
      };
    }
    const conflicto = detectarConflicto(reservas, datos);
    if (conflicto) return { codigo: 409, campo: "hora", tipo: conflicto.tipo, mensaje: conflicto.mensaje };
    return null;
  }

  return {
    DISPONIBILIDAD,
    MENSAJES,
    esFechaValida,
    fechaHoraLocal,
    fechaIso,
    calcularSlots,
    esDiaHabil,
    cumpleAntelacion,
    detectarConflicto,
    validarDatosReserva,
    agendaDelDia,
    evaluarReserva,
  };
});
