/**
 * Proximo dia habil (lunes a viernes) a partir de manana, como AAAA-MM-DD.
 * Los tests de reserva no pueden usar una fecha fija: con el tiempo quedaria
 * en el pasado y el sistema (correctamente) la rechazaria.
 */
export function proximoDiaHabil(desde = new Date()) {
  const d = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return (
    d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

/** Proximo sabado a partir de manana, como AAAA-MM-DD. */
export function proximoSabado(desde = new Date()) {
  const d = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + 1);
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  return (
    d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0")
  );
}
