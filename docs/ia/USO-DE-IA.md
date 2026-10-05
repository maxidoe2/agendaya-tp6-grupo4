# Uso de herramientas de IA — TP N.º 6

**Herramienta utilizada:** Claude Code (Anthropic), un agente que trabaja en la
terminal sobre el repositorio: lee archivos, escribe código y ejecuta comandos
(`npm`, `jest`, `cypress`).

El enunciado (punto 7.4) pide, para cada bloque de tests generado con IA:
**prompt**, **output**, **modificaciones** y **evaluación crítica**. Este
documento registra el proceso tal como ocurrió.

---

## 1. Prompt utilizado

Se le dio a la herramienta el repositorio del TP5, el enunciado del TP6 y el
caso de estudio, con esta consigna:

> Necesito que me ayudes a realizar el trabajo práctico N°6, podés usar como
> base lo que construimos en el TP5. Primero entendé el problema, leé todo el
> contexto y pensá como un software engineer.

A partir del enunciado (sección 7: al menos 5 tests por integrante, al menos 2
funciones, casos normal, de borde e inválido), la herramienta propuso las
funciones a testear, el reparto y los archivos. Antes de escribir los tests
tuvo que **extraer la lógica** del TP5 a funciones puras: en el TP5 las reglas
estaban dentro de los endpoints y de las pantallas, sin nada que se pudiera
probar de forma aislada.

Para cada bloque se deja también un **prompt específico equivalente**, más
acotado, para poder reproducir el bloque con cualquier herramienta (ChatGPT,
Copilot, etc.) y comparar resultados en la presentación.

## 2. Output generado

El output es el código de los commits del repositorio:

| Commit | Output |
|---|---|
| `Extraer la logica de negocio...` | `src/logica/validaciones.js`, `src/logica/reservas.js`, `server/seguridad.js` |
| `Frontend minimo testeable...` | Pantallas con `data-cy` y validación en el cliente |
| `Tests E2E con Cypress...` | 5 specs, 10 tests |
| `Tests unitarios con Jest...` | 5 archivos, 43 tests (versión generada) |

El código final de cada bloque está en el informe (sección 4.2) y en
`tests/unit/`. La diferencia entre lo generado y lo final se detalla en las
modificaciones de cada bloque.

## 3. Problemas encontrados en la revisión (todo el TP)

| Qué pasó | Decisión |
|---|---|
| La primera corrida de Cypress falló en los 5 tests de M04: `Expected to find element: [data-cy="slot-1000"], but never found it`. La pantalla generada escuchaba solo el evento `change` del campo de fecha y `cy.type` dispara `input`. | Se corrigió el **frontend** (escuchar ambos eventos), no el test: un usuario que autocompleta la fecha tendría el mismo problema. Captura en `docs/evidencias/e2e/primera-corrida/`. |
| En un test de login, la herramienta escribió `"Hola, Administrador AgendaYA".replace("YA", "Ya")` para que coincidiera con el nombre de la semilla. | Se reemplazó por el texto literal. Un test que "acomoda" el valor esperado esconde lo que verifica. |
| Un comentario `// Assert` del test de clicks múltiples decía que se verificaba el texto "Procesando reserva…", pero no había ninguna aserción sobre eso. | Se corrigió el comentario para que describa lo que realmente se verifica. |
| Los 43 tests unitarios pasaron en la primera corrida. | Un test que nunca falló no demuestra nada. Se introdujeron a mano dos defectos de borde en `reservas.js`: la antelación con `>` en lugar de `>=` (falló 1 test) y turnos que se pasan del horario de fin (fallaron 2). Después se restauró el código. |

## 4. Lo que la herramienta no pudo resolver sola

La herramienta escribió código que funciona, pero tuvo que **tomar decisiones de
negocio** que los requerimientos no definían. Las dejó explícitas en el código
(comentarios en `validaciones.js` y `reservas.js`):

| Ambigüedad | Decisión adoptada |
|---|---|
| AYA-M01-RF-01 pide "requisitos de seguridad" para la contraseña sin decir cuáles. | 8+ caracteres, una mayúscula, una minúscula y un número (coincide con los datos de prueba del TP5: `Messimessi12`, `Contrasena123!`). |
| "No se puede reservar con menos de 2 horas de anticipación": ¿2 horas exactas se permite? | Sí se permite. |
| ¿El enlace de recuperación vale en el instante exacto del vencimiento? | No. |
| M04 necesita la disponibilidad que define M02 (otro grupo). | Se fijó: lunes a viernes, 9 a 17 h, turnos de 60 minutos. |

---

## 5. Bloques por integrante

### Bloque 1 — Barchiesi Santino

**Archivos:** `tests/unit/m01-email.test.js` (8 tests) y `tests/unit/m01-seguridad.test.js` (8 tests)
**Funciones:** `normalizarEmail`, `esEmailValido`, `validarLogin`, `hashearPassword` / `verificarPassword`, `crearTokenRecuperacion` / `tokenVigente`

**Prompt específico equivalente:**

> Tengo un módulo JavaScript con `normalizarEmail(valor)` (email sin espacios y
> en minúsculas, o "" si es null/undefined), `esEmailValido(email)` (forma
> usuario@dominio.ext con extensión de 2+ letras) y `validarLogin({email,
> password})` (null o el primer error `{campo, mensaje}`). También
> `hashearPassword`/`verificarPassword` con scrypt y sal aleatoria, y
> `tokenVigente(registro, ahora)` para un enlace que vence a los 30 minutos.
> [código]. Generá tests con Jest con caso normal, casos borde e inválidos.
> Usá fechas fijas.

**Modificaciones:** ninguna sobre el código generado. Se reasignó la autoría del
archivo `m01-seguridad.test.js` al reorganizarse el equipo.

**Evaluación crítica:**
- *Correcto y completo:* cubre los tres tipos de caso en cada función. Los
  tests del token usan fechas fijas y prueban el borde exacto (un milisegundo
  antes del vencimiento y el instante del vencimiento), que es donde suelen
  estar los errores de `<` contra `<=`.
- *Aporte no pedido:* el caso "hash guardado con formato inválido" llevó a
  corregir la función del TP5, que en ese caso lanzaba una excepción en lugar de
  rechazar el ingreso.
- *Limitaciones:* `validarLogin` tiene solo 2 casos y no prueba la contraseña
  vacía. `esEmailValido` es una expresión regular simple: los tests verifican
  esa regla, no la validez real según el estándar (dominios con acentos, por
  ejemplo, quedan fuera). Los tests de hash usan scrypt real, por lo que son
  los más lentos de la suite.

### Bloque 2 — Estudillo Máximo

**Archivos:** `tests/unit/m01-password-registro.test.js` (8 tests) y `tests/unit/m04-validacion-conflictos.test.js` (10 tests)
**Funciones:** `evaluarPassword`, `validarRegistro`, `validarDatosReserva`, `detectarConflicto`, `evaluarReserva`

**Prompt específico equivalente:**

> Tengo `evaluarPassword(password)` que devuelve `{valida, errores}` (mínimo 8
> caracteres, mayúscula, minúscula y número) y `validarRegistro` que devuelve el
> primer error en el orden nombre → email → password. También
> `validarDatosReserva` y `detectarConflicto(reservas, solicitud)`, que devuelve
> null, `{tipo: "duplicada"}` si el mismo email ya reservó ese turno u
> `{tipo: "ocupado"}` si lo reservó otra persona; las canceladas no cuentan.
> [código]. Generá tests con Jest con caso normal, borde (7 y 8 caracteres,
> mayúsculas en el email, reserva cancelada) e inválido.

**Modificaciones:** ninguna sobre el código generado. Se reasignó la autoría del
archivo `m04-validacion-conflictos.test.js` al reorganizarse el equipo.

**Evaluación crítica:**
- *Correcto y completo:* prueba el borde exacto del largo (7 rechazado, 8
  aceptado) y verifica la lista completa de errores, no solo `valida: false`.
  En conflictos distingue "duplicada" (doble envío del mismo invitado, CP-010)
  de "ocupado" (otro invitado), y usa el mensaje literal del enunciado.
- *Limitación importante:* las reglas de contraseña que verifican estos tests
  las decidió la herramienta, porque el requerimiento no las definía. Los tests
  confirman que el código cumple *esa* regla, no que la regla sea la correcta.
- *Limitación de diseño:* los tests de `evaluarReserva` usan la disponibilidad
  por defecto del sistema (lunes a viernes, 9 a 17 h). Si M02 cambiara esa
  configuración, fallarían aunque la lógica siga bien. Habría sido mejor
  pasarles una configuración propia, como hacen los tests del bloque 3.

### Bloque 3 — Navarro Matías

**Archivo:** `tests/unit/m04-slots-antelacion.test.js` (11 tests)
**Funciones:** `calcularSlots`, `cumpleAntelacion`, `esDiaHabil`, `agendaDelDia`

**Prompt específico equivalente** (basado en el ejemplo del enunciado):

> Tengo una función JavaScript `calcularSlots(inicio, fin, duracionMin)` que
> recibe horas "HH:MM" y una duración en minutos y devuelve un array con los
> horarios de inicio de cada turno que entra completo en el rango; lanza un error
> si la duración no es un entero positivo o la hora es inválida. También
> `cumpleAntelacion(fechaHora, ahora, horasMin)`. [código]. Generá al menos 5
> tests con Jest que cubran: el caso normal, duración mayor al rango
> disponible, horarios iguales, valores inválidos y el borde exacto de 2 horas
> de antelación.

**Modificaciones:** se agregaron 2 tests de `agendaDelDia`. El reporte de
cobertura (`npm run test:coverage`) mostraba esa función sin tests unitarios:
es la que combina todas las reglas anteriores (turno pasado, sin antelación,
ocupado) y solo quedaba cubierta por los E2E. Con el agregado, la cobertura de
líneas de `reservas.js` pasó de 81 % a 92 %.

**Evaluación crítica:**
- *Correcto y completo:* fue el bloque que detectó los dos defectos
  introducidos a propósito (antelación con `>` y turno que se pasa del horario
  de fin). Prueba explícitamente que no se ofrece un turno que no entra completo
  (`09:00`–`10:30` con 60 min devuelve solo `["09:00"]`).
- *Buena decisión:* construye las fechas con `new Date(año, mes, día, hora)` en
  hora local, por lo que los tests dan el mismo resultado en cualquier zona
  horaria.
- *Limitaciones:* no se probó un cambio de horario de verano (Argentina no lo
  usa hoy). La herramienta no detectó sola el hueco de `agendaDelDia`: apareció
  al revisar el reporte de cobertura.

---

## 6. Conclusión sobre el uso de IA

- **Donde más ayudó:** en el código fuente y el frontend (estructura,
  formularios con sus `data-cy`, configuración de Cypress y Jest), que es trabajo
  mecánico, y en enumerar casos de borde para los tests unitarios.
- **Donde hizo falta revisión humana:** un test que acomodaba el valor esperado,
  un comentario que no coincidía con la aserción y un hueco de cobertura.
- **Lo que no puede hacer sola:** decidir las reglas que el requerimiento deja
  abiertas, ni saber si un test que pasa realmente detecta errores. Para eso
  hicieron falta la prueba de mutación y el reporte de cobertura.
