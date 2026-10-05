# Uso de herramientas de IA — TP N.º 6

El enunciado (punto 7.4) pide, para cada bloque de tests generado con IA:
**prompt**, **output**, **modificaciones** y **evaluación crítica**.

Este documento tiene dos partes:

1. **Lo que efectivamente ocurrió** al construir la base del TP con Claude Code
   (frontend, lógica y primera versión de los tests). Está documentado tal cual.
2. **Un bloque por integrante** para sus 5+ tests unitarios. Incluye el prompt
   listo para usar y los puntos a revisar. Cada integrante tiene que correr
   el prompt con la herramienta que elija, pegar el output real y escribir sus
   propias modificaciones y su evaluación. Esas secciones están marcadas con
   `[COMPLETAR]` y no deben llenarse con texto inventado: en la presentación
   cada uno tiene que poder explicar su test.

---

## Parte 1 — Construcción asistida con Claude Code

**Herramienta:** Claude Code (Anthropic), usado como agente en la terminal sobre
el repositorio.

**Prompt inicial:**

> Necesito que me ayudes a realizar el trabajo práctico N°6, podés usar como
> base lo que construimos en el TP5. Primero entendé el problema, leé todo el
> contexto y pensá como un software engineer.

**Qué generó la herramienta** (ver el historial de commits):

| Commit | Contenido |
|---|---|
| Partir de la funcionalidad del TP5 | Copia de la app del TP5 reorganizada |
| Extraer la lógica de negocio | `src/logica/*.js`, `server/seguridad.js` |
| Frontend mínimo testeable | Pantallas con `data-cy` y validación en el cliente |
| Tests E2E con Cypress | 5 specs, 10 tests |
| Tests unitarios con Jest | 5 archivos, 43 tests |

**Problemas que aparecieron y cómo se resolvieron** (registro real de la sesión):

| Qué pasó | Decisión |
|---|---|
| La primera corrida de Cypress falló en los 5 tests de M04: `Expected to find element: [data-cy="slot-1000"], but never found it`. La pantalla escuchaba solo el evento `change` del campo de fecha y `cy.type` dispara `input`. | Se corrigió el **frontend** (escuchar ambos eventos), no el test: un usuario que autocompleta la fecha tendría el mismo problema. Captura en `docs/evidencias/e2e/primera-corrida/`. |
| En un test de login, la IA escribió `"Hola, Administrador AgendaYA".replace("YA", "Ya")` para que coincidiera con el nombre de la semilla. | Se reemplazó por el texto literal esperado. Un test con lógica propia para "acomodar" el resultado esconde lo que verifica. |
| Un comentario `// Assert` del test de clicks múltiples decía que se verificaba el texto "Procesando reserva…", pero no había ninguna aserción sobre eso. | Se corrigió el comentario para que describa lo que realmente se verifica. |
| Los 43 tests unitarios pasaron en la primera corrida. | Para comprobar que detectan errores, se introdujeron a mano dos defectos de borde en `reservas.js` (`>=` → `>` en la antelación, y un turno que se pasa del horario de fin). Los tests fallaron en ambos casos (1 y 2 tests) y se restauró el código. |

**Decisiones que la IA no podía tomar sola** (las tomó y quedan para que el
equipo las valide contra el TP1):

- Qué significa "contraseña que cumpla los requisitos de seguridad". Se adoptó:
  8+ caracteres, una mayúscula, una minúscula y un número.
- Si "no se puede reservar con menos de 2 horas" admite exactamente 2 horas.
  Se adoptó que sí.
- Si el enlace de recuperación vale en el instante exacto del vencimiento. Se
  adoptó que no.
- Qué hacer cuando M04 necesita datos de M02 (disponibilidad): se fijó una
  configuración.

---

## Parte 2 — Bloques por integrante

Para cada bloque: copiar el prompt en la herramienta elegida (ChatGPT, Copilot,
Cursor, Claude, etc.), pegando también el código de las funciones. Después
comparar el output con el archivo final del repositorio.

### Barchiesi Santino — `tests/unit/m01-email.test.js`

**Prompt:**

> Tengo un módulo JavaScript (CommonJS) con tres funciones de validación para
> el login de un sistema de turnos: `normalizarEmail(valor)` devuelve el email
> sin espacios y en minúsculas (o "" si es null/undefined); `esEmailValido(email)`
> devuelve true si tiene la forma usuario@dominio.ext con extensión de 2+ letras;
> `validarLogin({email, password})` devuelve null si está todo bien o
> `{campo, mensaje}` con el primer error. [pegar el código]. Generá al menos 5
> tests con Jest que cubran caso normal, casos borde (espacios, mayúsculas,
> extensión de 1 letra) y valores inválidos (null, números, sin @).

**Puntos a revisar en el output:** ¿probó `null`/`undefined`? ¿Asumió mensajes de
error que no son los del código? ¿Incluyó emails "válidos" según el RFC que
nuestra regla rechaza (o al revés)?

- **Output generado:** [COMPLETAR: pegar el código que devolvió la herramienta]
- **Modificaciones:** [COMPLETAR: qué se cambió respecto del archivo final y por qué]
- **Evaluación crítica:** [COMPLETAR]

### Estudillo Máximo — `tests/unit/m01-password-registro.test.js`

**Prompt:**

> Tengo `evaluarPassword(password)` que devuelve `{valida, errores}` con un
> mensaje por cada regla incumplida (mínimo 8 caracteres, una mayúscula, una
> minúscula, un número) y `validarRegistro({nombre, email, password})` que
> devuelve null o el primer error como `{campo, mensaje}` en el orden nombre →
> email → password. [pegar el código]. Generá al menos 5 tests con Jest: caso
> válido, borde de 7 y 8 caracteres, varias reglas incumplidas a la vez,
> valores que no son string, y el orden en que se informan los errores.

**Puntos a revisar en el output:** ¿probó el borde exacto 7/8? ¿Verifica la lista
completa de errores o solo `valida: false`? ¿Considera un nombre con solo
espacios?

- **Output generado:** [COMPLETAR]
- **Modificaciones:** [COMPLETAR]
- **Evaluación crítica:** [COMPLETAR]

### García Joaquín — `tests/unit/m01-seguridad.test.js`

**Prompt:**

> Tengo un módulo Node con `hashearPassword(password)` (scrypt con sal aleatoria,
> devuelve "sal:hash"), `verificarPassword(password, almacenado)` (true/false, y
> false si el hash tiene formato inválido), `crearTokenRecuperacion(email, ahora)`
> (vence a los 30 minutos) y `tokenVigente(registro, ahora)`. [pegar el código].
> Generá al menos 5 tests con Jest: verificación correcta e incorrecta, que dos
> hashes de la misma contraseña sean distintos, hash corrupto, y el vencimiento
> del token justo antes y justo en el instante de vencimiento. Usá fechas fijas.

**Puntos a revisar en el output:** ¿usó `new Date()` real en vez de una fecha fija
(test que depende del momento en que corre)? ¿Probó el instante exacto del
vencimiento? ¿Probó un hash con formato inválido?

- **Output generado:** [COMPLETAR]
- **Modificaciones:** [COMPLETAR]
- **Evaluación crítica:** [COMPLETAR]

### Navarro Matías — `tests/unit/m04-slots-antelacion.test.js`

**Prompt:**

> Tengo una función JavaScript `calcularSlots(inicio, fin, duracionMin)` que
> recibe horas "HH:MM" y una duración en minutos y devuelve un array con los
> horarios de inicio de cada turno que entra completo en el rango; lanza un error
> si la duración no es un entero positivo o la hora es inválida. También
> `cumpleAntelacion(fechaHora, ahora, horasMin)` que devuelve true si el turno es
> futuro y faltan al menos `horasMin` horas. [pegar el código]. Generá al menos
> 5 tests con Jest que cubran: el caso normal, duración mayor al rango
> disponible, horarios iguales, valores inválidos, y el borde exacto de 2 horas
> de antelación.

**Puntos a revisar en el output:** ¿espera que `calcularSlots("09:00","10:30",60)`
devuelva `["09:00","10:00"]` (turno que se pasa del horario)? ¿Construye las
fechas con `new Date("2026-10-12T10:00")` y mezcla UTC con hora local?

- **Output generado:** [COMPLETAR]
- **Modificaciones:** [COMPLETAR]
- **Evaluación crítica:** [COMPLETAR]

### Martinez Fernando — `tests/unit/m04-validacion-conflictos.test.js`

**Prompt:**

> Tengo `validarDatosReserva({fecha, hora, nombre, email})` que devuelve null o
> el primer error `{campo, mensaje}`, y `detectarConflicto(reservas, solicitud)`
> que devuelve null si el turno está libre, `{tipo: "duplicada"}` si el mismo
> email ya reservó ese turno y `{tipo: "ocupado"}` si lo reservó otra persona;
> las reservas canceladas no cuentan. [pegar el código]. Generá al menos 5 tests
> con Jest: datos completos, falta el correo, correo mal escrito, turno libre,
> turno ocupado, reserva duplicada con el email en otras mayúsculas y reserva
> cancelada.

**Puntos a revisar en el output:** ¿probó que una reserva cancelada libera el
turno? ¿Distingue "duplicada" de "ocupado"? ¿Usa el mensaje exacto del
enunciado ("Este horario ya fue reservado. Por favor elegí otro.")?

- **Output generado:** [COMPLETAR]
- **Modificaciones:** [COMPLETAR]
- **Evaluación crítica:** [COMPLETAR]
