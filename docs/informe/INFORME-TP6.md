# Trabajo Práctico N.º 6 — Testing Automatizado

**Universidad Tecnológica Nacional — Facultad Regional Mendoza**
Ingeniería y Calidad de Software — 4K10 — 2026

**Equipo:** Grupo N.º 4
**Módulos asignados:** M01 — Autenticación y Perfil de Administrador · M04 — Proceso de Reserva (Booking Público)

| Integrante | Legajo |
|---|---|
| Barchiesi Santino | 50791 |
| Estudillo Máximo | 50013 |
| García Joaquín | 50914 |
| Navarro Matías | 51006 |
| Martinez Fernando | 51192 |

---

## 1. Repositorio

[COMPLETAR: URL del repositorio, p. ej. https://github.com/maxidoe2/agendaya-tp6-grupo4]

El `README.md` explica cómo levantar el frontend y ejecutar ambos tipos de
tests. El historial de commits muestra el avance: base del TP5 → extracción de
la lógica → frontend testeable → tests E2E → tests unitarios → documentación.

---

## 2. Tarea A — Frontend mínimo

### 2.1 Descripción

Se partió de la aplicación del TP5 (Node.js + Express, pantallas en HTML, CSS y
JavaScript vanilla, datos en un archivo JSON y correos registrados en
`data/correos.log`). El servidor se mantuvo porque ya existía y permite
verificar estados reales (reservas creadas, correos disparados), pero se
reorganizó para que el código fuera testeable:

- **Lógica de negocio separada de la interfaz.** Las reglas que en el TP5
  estaban dentro de `server.js` y de los scripts de cada pantalla se movieron a
  `src/logica/validaciones.js` (M01) y `src/logica/reservas.js` (M04). Son
  funciones puras que se cargan tanto en Node como en el navegador: la
  validación que corre en la pantalla es la misma que prueba Jest y que vuelve a
  aplicar el servidor.
- **Selección real de fecha y hora.** En el TP5 los horarios estaban fijos al
  15/09/2026. Ahora el invitado elige un día y la agenda se calcula a partir de
  la disponibilidad (lunes a viernes, 9 a 17 h, turnos de 60 minutos, 2 horas de
  antelación mínima). Como la disponibilidad pertenece al módulo M02, se fijó
  como configuración.
- **Atributos `data-cy`** en todos los elementos interactivos y en los mensajes
  que verifican los tests.

### 2.2 Flujos implementados

| Módulo | Flujo | Pantalla | Requerimiento |
|---|---|---|---|
| M01 | Registro de usuario | `/registro.html` | AYA-M01-RF-01 |
| M01 | Login y logout | `/` → `/dashboard.html` → "Cerrar sesión" | AYA-M01-RF-04 |
| M04 | Seleccionar fecha y hora | `/reservar.html` (pasos 1 y 2) | AYA-M04-RF-03 |
| M04 | Completar formulario y confirmar reserva | `/reservar.html` (pasos 3 y 4) | AYA-M04-RF-03 y RF-05 |
| M04 (opcional) | Manejo de horario no disponible | `/reservar.html` | AYA-M04-RF-05 |

[COMPLETAR: insertar 2 o 3 capturas de las pantallas en el navegador]

### 2.3 Criterios de aceptación

| Criterio | Cumplimiento |
|---|---|
| Los dos flujos obligatorios de cada módulo son navegables sin errores | Sí. Los recorren completos los tests E2E (10/10 aprobados). |
| Todos los elementos interactivos tienen `data-cy` | Sí. Verificado buscando en todas las pantallas `input`, `button`, `a`, `textarea` y `form` sin el atributo (resultado vacío); los turnos generados por JavaScript reciben `data-cy="slot-HHMM"`. |
| Los formularios validan el campo vacío con un mensaje visible | Sí. Login, registro, recuperación y reserva muestran el motivo debajo del campo (`error-<campo>`). Lo verifican `m01-registro-errores` y `m04-reserva-errores`. |
| Al completar un flujo se muestra una confirmación visible | Sí. Registro: "Tu cuenta fue creada correctamente."; logout: "Cerraste sesión correctamente."; reserva: panel `booking-confirmation` con el código. |
| Repositorio Git con al menos 3 commits descriptivos | Sí. [COMPLETAR: cantidad final de commits] |

---

## 3. Tarea B — Tests E2E con Cypress

### 3.1 Organización

- `baseUrl: http://localhost:3000` configurado una vez en `cypress.config.js`;
  los tests usan rutas relativas.
- Antes de cada test se reinicia la base con `cy.task("reiniciarBase")`: cada
  test parte de un estado conocido y no depende de los demás.
- Para verificar efectos que no se ven en pantalla se usan `cy.task("leerCorreos")`
  (correos disparados), `cy.request("/api/reservas")` (cantidad de reservas) y
  `cy.intercept` (pedidos al servidor y códigos de respuesta).
- Los tests de reserva calculan el próximo día hábil: una fecha fija quedaría en
  el pasado y el sistema, correctamente, la rechazaría.
- Al final de cada test se guarda una captura del runner (aplicación + log de
  comandos).

| Integrante | Archivo | Tests | Tipo |
|---|---|---|---|
| Barchiesi Santino | `m01-registro-exitoso.cy.js` | Registro de un administrador nuevo | Happy path |
| Estudillo Máximo | `m01-registro-errores.cy.js` | Formulario vacío · Correo ya registrado | Datos inválidos · Estado del sistema |
| García Joaquín | `m01-login-logout.cy.js` | Login + logout + panel protegido · Contraseña incorrecta | Happy path · Datos inválidos |
| Navarro Matías | `m04-reserva-exitosa.cy.js` | Fecha, hora y confirmación · Clicks múltiples | Happy path · Estado del sistema |
| Martinez Fernando | `m04-reserva-errores.cy.js` | Horario tomado por otro invitado · Falta el correo · Día no hábil | Estado del sistema · Datos inválidos · Borde |

### 3.2 Código de los tests

#### Barchiesi Santino — Registro exitoso

```js
/**
 * M01 - Autenticacion | Flujo obligatorio: Registro de usuario (happy path)
 * Responsable: Barchiesi Santino
 * Trazabilidad: AYA-M01-RF-01 / CP-003
 */
describe("AgendaYA - M01 Autenticacion: registro exitoso", () => {
  beforeEach(() => {
    cy.visit("/registro.html");
  });

  it("registra un administrador nuevo y lo deja dentro del panel", () => {
    // Arrange: completar el formulario con datos validos y un correo nuevo
    cy.get('[data-cy="nombre-input"]').type("Leonel Messi");
    cy.get('[data-cy="email-input"]').type("leo.messi@gmail.com");
    cy.get('[data-cy="password-input"]').type("Messimessi12");

    // Act: enviar el registro
    cy.get('[data-cy="registro-button"]').click();

    // Assert: se crea la cuenta y se accede al panel con la sesion del usuario nuevo
    cy.url().should("include", "/dashboard");
    cy.get('[data-cy="alerta-exito"]')
      .should("be.visible")
      .and("contain", "Tu cuenta fue creada correctamente.");
    cy.get('[data-cy="dashboard-welcome"]').should("have.text", "Hola, Leonel Messi");
    cy.get('[data-cy="usuario-email"]').should("contain", "leo.messi@gmail.com");
  });
});
```

#### Estudillo Máximo — Registro con errores

```js
/**
 * M01 - Autenticacion | Flujo obligatorio: Registro de usuario (variantes de error)
 * Responsable: Estudillo Maximo
 * Trazabilidad: AYA-M01-RF-01 / CP-004
 */
describe("AgendaYA - M01 Autenticacion: registro con errores", () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/registro").as("registro");
    cy.visit("/registro.html");
  });

  it("no envia el formulario vacio y explica que falta el nombre", () => {
    // Arrange: formulario sin completar (estado inicial de la pantalla)
    cy.get('[data-cy="nombre-input"]').should("have.value", "");

    // Act: intentar registrarse sin datos
    cy.get('[data-cy="registro-button"]').click();

    // Assert: error visible en el campo, sin pedido al servidor y sin salir de la pantalla
    cy.get('[data-cy="error-nombre"]').should("be.visible").and("have.text", "Ingresa tu nombre.");
    cy.get("@registro.all").should("have.length", 0);
    cy.url().should("include", "/registro.html");
  });

  it("rechaza un correo que ya esta registrado y no crea la cuenta", () => {
    // Arrange: ya existe una cuenta con ese correo (precondicion de CP-004)
    cy.request("POST", "/api/registro", {
      nombre: "Leonel Messi",
      email: "leo.messi@gmail.com",
      password: "Messimessi12",
    });
    cy.get('[data-cy="nombre-input"]').type("Leonel Messi");
    cy.get('[data-cy="email-input"]').type("leo.messi@gmail.com");
    cy.get('[data-cy="password-input"]').type("Messimessi13");

    // Act: intentar registrar el mismo correo otra vez
    cy.get('[data-cy="registro-button"]').click();

    // Assert: el servidor responde 409, se informa el motivo y no se entra al panel
    cy.wait("@registro").its("response.statusCode").should("eq", 409);
    cy.get('[data-cy="alerta-error"]')
      .should("be.visible")
      .and("have.text", "El correo ya existe en el sistema.");
    cy.get('[data-cy="error-email"]').should("be.visible");
    cy.url().should("include", "/registro.html");
  });
});
```

#### García Joaquín — Login y logout

```js
/**
 * M01 - Autenticacion | Flujo obligatorio: Login y logout
 * Responsable: Garcia Joaquin
 * Trazabilidad: AYA-M01-RF-04 / CP-001 y CP-002
 */
describe("AgendaYA - M01 Autenticacion: login y logout", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("inicia sesion, entra al panel y al cerrar sesion pierde el acceso", () => {
    // Arrange: credenciales del administrador precargado
    cy.get('[data-cy="email-input"]').type("admin@agendaya.com");
    cy.get('[data-cy="password-input"]').type("Contrasena123!");

    // Act (1): iniciar sesion
    cy.get('[data-cy="login-button"]').click();

    // Assert (1): llega al panel con su usuario
    cy.url().should("include", "/dashboard");
    cy.get('[data-cy="dashboard-welcome"]').should("have.text", "Hola, Administrador AgendaYa");

    // Act (2): cerrar sesion
    cy.get('[data-cy="logout-button"]').click();

    // Assert (2): vuelve al login con confirmacion y el panel queda protegido
    cy.location("pathname").should("eq", "/");
    cy.get('[data-cy="alerta-exito"]').should("be.visible").and("have.text", "Cerraste sesión correctamente.");
    cy.visit("/dashboard.html");
    cy.location("pathname").should("eq", "/");
  });

  it("con contrasena incorrecta no ingresa y limpia el campo de contrasena", () => {
    // Arrange: usuario existente con una contrasena equivocada
    cy.get('[data-cy="email-input"]').type("admin@agendaya.com");
    cy.get('[data-cy="password-input"]').type("ContrasenaInvalida123");

    // Act: intentar ingresar
    cy.get('[data-cy="login-button"]').click();

    // Assert: mensaje exacto de CP-002, campo vacio y sin acceso al panel
    cy.get('[data-cy="alerta-error"]')
      .should("be.visible")
      .and("have.text", "Contrasena incorrecta, intentelo de nuevo.");
    cy.get('[data-cy="password-input"]').should("have.value", "");
    cy.location("pathname").should("eq", "/");
  });
});
```

#### Navarro Matías — Reserva exitosa

```js
/**
 * M04 - Booking publico | Flujos obligatorios: Seleccionar fecha y hora +
 * Completar formulario y confirmar reserva (happy path)
 * Responsable: Navarro Matias
 * Trazabilidad: AYA-M04-RF-03 y AYA-M04-RF-05 / CP-007 y CP-010
 */
import { proximoDiaHabil } from "../support/fechas";

describe("AgendaYA - M04 Booking: reserva exitosa", () => {
  const dia = proximoDiaHabil();

  beforeEach(() => {
    cy.visit("/reservar.html");
  });

  it("elige dia y horario, confirma la reserva y notifica a ambas partes", () => {
    // Arrange: elegir un dia habil futuro, un horario libre y completar los datos
    cy.get('[data-cy="fecha-input"]').type(dia);
    cy.get('[data-cy="slot-1000"]').should("be.enabled").click();
    cy.get('[data-cy="resumen-turno"]').should("contain", dia + " a las 10:00 h");
    cy.get('[data-cy="nombre-input"]').type("Juan Perez");
    cy.get('[data-cy="email-input"]').type("juan.perez@ejemplo.com");

    // Act: confirmar la reserva
    cy.get('[data-cy="submit-booking"]').click();

    // Assert: confirmacion visible, turno ocupado en la agenda y correos disparados
    cy.get('[data-cy="booking-confirmation"]')
      .should("be.visible")
      .and("contain", "Tu reserva fue confirmada")
      .and("contain", dia);
    cy.get('[data-cy="booking-codigo"]').should("have.text", "#1");
    cy.get('[data-cy="submit-booking"]').should("be.disabled");
    cy.get('[data-cy="slot-1000"]').should("be.disabled").and("contain", "reservado");
    cy.task("leerCorreos").then((correos) => {
      expect(correos).to.contain("Para:   juan.perez@ejemplo.com");
      expect(correos).to.contain("Para:   admin@agendaya.com");
    });
  });

  it("ante varios clicks rapidos en Confirmar registra una sola reserva", () => {
    // Arrange: formulario listo para confirmar
    cy.get('[data-cy="fecha-input"]').type(dia);
    cy.get('[data-cy="slot-1100"]').click();
    cy.get('[data-cy="nombre-input"]').type("Juan Perez");
    cy.get('[data-cy="email-input"]').type("juan.perez@ejemplo.com");

    // Act: tres clicks seguidos sobre el boton (force: el boton ya se deshabilita)
    cy.get('[data-cy="submit-booking"]').click().click({ force: true }).click({ force: true });

    // Assert: la reserva se confirma y en el sistema hay un unico registro
    cy.get('[data-cy="booking-confirmation"]').should("be.visible");
    cy.request("/api/reservas").its("body").should("have.length", 1);
  });
});
```

#### Martinez Fernando — Reserva con errores

```js
/**
 * M04 - Booking publico | Variantes de error del flujo de reserva:
 *   - por estado del sistema: horario no disponible (flujo opcional del modulo)
 *   - por datos invalidos: falta el correo electronico
 * Responsable: Martinez Fernando
 * Trazabilidad: AYA-M04-RF-03 y AYA-M04-RF-05 / CP-008 / enunciado 3.1
 */
import { proximoDiaHabil, proximoSabado } from "../support/fechas";

describe("AgendaYA - M04 Booking: reserva con errores", () => {
  const dia = proximoDiaHabil();

  beforeEach(() => {
    cy.intercept("POST", "/api/reservas").as("crearReserva");
    cy.visit("/reservar.html");
  });

  it("informa que el horario ya fue reservado si otro invitado lo tomo antes", () => {
    // Arrange: el invitado elige las 15:00 y completa sus datos...
    cy.get('[data-cy="fecha-input"]').type(dia);
    cy.get('[data-cy="slot-1500"]').should("be.enabled").click();
    cy.get('[data-cy="nombre-input"]').type("Ana Gomez");
    cy.get('[data-cy="email-input"]').type("ana.gomez@ejemplo.com");
    // ...mientras tanto otro invitado reserva ese mismo turno desde otro dispositivo
    cy.request("POST", "/api/reservas", {
      nombre: "Otro Invitado",
      email: "otro@ejemplo.com",
      fecha: dia,
      hora: "15:00",
    });

    // Act: confirmar la reserva sobre un turno que ya no esta libre
    cy.get('[data-cy="submit-booking"]').click();

    // Assert: conflicto 409 con el mensaje del enunciado, agenda actualizada y
    // el turno sigue siendo del primer invitado
    cy.wait("@crearReserva").its("response.statusCode").should("eq", 409);
    cy.get('[data-cy="alerta-error"]')
      .should("be.visible")
      .and("have.text", "Este horario ya fue reservado. Por favor elegí otro.");
    cy.get('[data-cy="slot-1500"]').should("be.disabled").and("contain", "reservado");
    cy.get('[data-cy="booking-confirmation"]').should("not.be.visible");
    cy.get('[data-cy="submit-booking"]').should("be.enabled");
    cy.request("/api/reservas").its("body").should("have.length", 1)
      .its(0).its("email").should("eq", "otro@ejemplo.com");
  });

  it("no envia la reserva si falta el correo y resalta el campo", () => {
    // Arrange: horario elegido y solo el nombre completo (CP-008)
    cy.get('[data-cy="fecha-input"]').type(dia);
    cy.get('[data-cy="slot-0900"]').click();
    cy.get('[data-cy="nombre-input"]').type("Juan Perez");

    // Act: intentar confirmar
    cy.get('[data-cy="submit-booking"]').click();

    // Assert: mensaje visible en el campo y ningun pedido al servidor
    cy.get('[data-cy="error-email"]')
      .should("be.visible")
      .and("have.text", "Ingresa tu correo electronico para confirmar la reserva.");
    cy.get("@crearReserva.all").should("have.length", 0);
    cy.get('[data-cy="booking-confirmation"]').should("not.be.visible");
  });

  it("un sabado no ofrece horarios", () => {
    // Arrange: dia no habil segun la disponibilidad del administrador (M02)
    const sabado = proximoSabado();

    // Act: elegir el sabado en el calendario
    cy.get('[data-cy="fecha-input"]').type(sabado);

    // Assert: no se muestra ningun turno y se explica por que
    cy.get('[data-cy="agenda-vacia"]')
      .should("be.visible")
      .and("have.text", "Ese dia no hay turnos disponibles. Elegi otro dia.");
    cy.get('[data-cy^="slot-"]').should("not.exist");
  });
});
```

### 3.3 Ejecución y evidencia

Ejecución con `npm run test:e2e` (levanta el servidor y corre `npx cypress run`):

```
  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  m01-login-logout.cy.js                   00:07        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  m01-registro-errores.cy.js               00:05        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  m01-registro-exitoso.cy.js               00:04        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  m04-reserva-errores.cy.js                00:09        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  m04-reserva-exitosa.cy.js                00:08        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        00:35       10       10        -        -        -  
```

Las capturas de cada test están en `docs/evidencias/e2e/<archivo>/`.
[COMPLETAR: insertar las capturas en el informe, al menos una por integrante]

### 3.4 Análisis de resultados

**Resultado final:** 10 tests, 10 aprobados.

**Test que falló y decisión tomada.** En la primera ejecución fallaron los 5
tests de M04 con el mismo error:

```
AssertionError: Timed out retrying after 4000ms: Expected to find element:
`[data-cy="slot-1000"]`, but never found it.
    at Context.eval (webpack://agendaya-tp6-grupo4/./cypress/e2e/m04-reserva-exitosa.cy.js:44:7)
```

La captura del fallo (`docs/evidencias/e2e/primera-corrida/m04-falla-evento-change.png`)
mostraba la fecha cargada en el campo pero la agenda vacía, con el texto
"Elegí un día para ver los horarios". La pantalla cargaba la agenda al
recibir el evento `change` del `<input type="date">`, y `cy.type()` dispara el
evento `input`. Se decidió **corregir el frontend** y no el test: el defecto no
es exclusivo de Cypress, porque según el navegador y la forma de cargar la
fecha (teclado, autocompletado) puede dispararse un evento u otro. La pantalla
ahora escucha ambos eventos y evita cargar dos veces la misma fecha. Con ese
cambio los 10 tests pasan.

---

## 4. Tarea C — Tests unitarios con IA

### 4.1 Organización

Framework: Jest. Cada integrante tiene un archivo en `tests/unit/` con al menos
dos funciones y casos normales, de borde e inválidos. Las funciones que
dependen de la hora reciben `ahora` como parámetro y los tests usan fechas
fijas.

| Integrante | Archivo | Funciones | Tests |
|---|---|---|---|
| Barchiesi Santino | `m01-email.test.js` | `normalizarEmail`, `esEmailValido`, `validarLogin` | 8 |
| Estudillo Máximo | `m01-password-registro.test.js` | `evaluarPassword`, `validarRegistro` | 8 |
| García Joaquín | `m01-seguridad.test.js` | `hashearPassword`/`verificarPassword`, `crearTokenRecuperacion`/`tokenVigente` | 8 |
| Navarro Matías | `m04-slots-antelacion.test.js` | `calcularSlots`, `cumpleAntelacion`, `esDiaHabil` | 9 |
| Martinez Fernando | `m04-validacion-conflictos.test.js` | `validarDatosReserva`, `detectarConflicto`, `evaluarReserva` | 10 |

### 4.2 Código de los tests

#### Barchiesi Santino

```js
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
```

#### Estudillo Máximo

```js
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
```

#### García Joaquín

```js
/**
 * M01 - Contrasenas con hash y enlace de recuperacion
 * Responsable: Garcia Joaquin
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
```

#### Navarro Matías

```js
/**
 * M04 - Calculo de turnos y antelacion minima
 * Responsable: Navarro Matias
 * Funciones: calcularSlots, cumpleAntelacion, esDiaHabil
 */
const { calcularSlots, cumpleAntelacion, esDiaHabil } = require("../../src/logica/reservas");

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
```

#### Martinez Fernando

```js
/**
 * M04 - Datos obligatorios de la reserva y conflictos de turno
 * Responsable: Martinez Fernando
 * Funciones: validarDatosReserva, detectarConflicto, evaluarReserva
 */
const {
  validarDatosReserva,
  detectarConflicto,
  evaluarReserva,
  MENSAJES,
} = require("../../src/logica/reservas");

const solicitud = {
  fecha: "2026-10-13",
  hora: "10:00",
  nombre: "Juan Perez",
  email: "juan.perez@ejemplo.com",
};

describe("validarDatosReserva", () => {
  it("con fecha, hora, nombre y correo validos no devuelve error (caso normal)", () => {
    expect(validarDatosReserva(solicitud)).toBeNull();
  });

  it("sin correo marca el campo email con el mensaje de CP-008 (caso invalido)", () => {
    expect(validarDatosReserva({ ...solicitud, email: "" })).toEqual({
      campo: "email",
      mensaje: "Ingresa tu correo electronico para confirmar la reserva.",
    });
  });

  it("distingue un correo vacio de uno mal escrito (caso borde)", () => {
    expect(validarDatosReserva({ ...solicitud, email: "juan.perez" }).mensaje).toBe(
      "Ingresa un correo electronico valido."
    );
  });

  it("sin horario elegido pide elegir uno antes que los datos personales", () => {
    expect(validarDatosReserva({ ...solicitud, hora: null, nombre: "" }).campo).toBe("hora");
  });
});

describe("detectarConflicto", () => {
  const existentes = [
    { id: 1, fecha: "2026-10-13", hora: "10:00", email: "otro@ejemplo.com", estado: "Confirmada" },
  ];

  it("un turno libre no tiene conflicto (caso normal)", () => {
    expect(detectarConflicto(existentes, { ...solicitud, hora: "11:00" })).toBeNull();
  });

  it("un turno tomado por otro invitado devuelve 'ocupado' con el mensaje del enunciado", () => {
    expect(detectarConflicto(existentes, solicitud)).toEqual({
      tipo: "ocupado",
      mensaje: "Este horario ya fue reservado. Por favor elegí otro.",
    });
  });

  it("el mismo invitado reenviando su reserva es 'duplicada', aunque cambie mayusculas (CP-010)", () => {
    const repetida = { ...solicitud, email: "  OTRO@ejemplo.com " };
    expect(detectarConflicto(existentes, repetida).tipo).toBe("duplicada");
  });

  it("una reserva cancelada libera el turno (caso borde)", () => {
    const cancelada = [{ ...existentes[0], estado: "Cancelada" }];
    expect(detectarConflicto(cancelada, solicitud)).toBeNull();
  });
});

describe("evaluarReserva (regla completa que aplica el servidor)", () => {
  const ahora = new Date(2026, 9, 12, 9, 0); // lunes 12/10/2026 09:00

  it("rechaza con 400 un turno de hoy sin la antelacion minima de 2 horas", () => {
    const rechazo = evaluarReserva({ ...solicitud, fecha: "2026-10-12", hora: "10:00" }, [], ahora);
    expect(rechazo.codigo).toBe(400);
    expect(rechazo.mensaje).toBe("Los turnos se reservan con al menos 2 horas de anticipacion.");
  });

  it("rechaza con 409 un turno ocupado y acepta (null) uno libre", () => {
    const ocupado = [{ fecha: "2026-10-13", hora: "10:00", email: "otro@ejemplo.com", estado: "Confirmada" }];
    expect(evaluarReserva(solicitud, ocupado, ahora)).toMatchObject({ codigo: 409, mensaje: MENSAJES.ocupado });
    expect(evaluarReserva(solicitud, [], ahora)).toBeNull();
  });
});
```

### 4.3 Uso de IA

[COMPLETAR por cada integrante a partir de `docs/ia/USO-DE-IA.md`: prompt,
output generado, modificaciones y evaluación crítica.]

Registro de la construcción asistida (ver detalle en `docs/ia/USO-DE-IA.md`):

- La base del TP (lógica, frontend y primera versión de los tests) se generó con
  Claude Code a partir de la consigna y del código del TP5.
- La revisión encontró un test que "acomodaba" el valor esperado con un
  `.replace()` y un comentario `// Assert` que describía una verificación que el
  test no hacía. Ambos se corrigieron.
- Los 43 tests pasaron en la primera corrida. Para comprobar que detectan
  defectos, se introdujeron a mano dos errores de borde en `reservas.js`: con la
  antelación usando `>` en lugar de `>=` falló 1 test, y con turnos que se pasan
  del horario de fin fallaron 2. Después se restauró el código.

### 4.4 Evidencia de ejecución

Ejecución con `npm run test:coverage`:

```
PASS tests/unit/m04-slots-antelacion.test.js
  calcularSlots
    √ genera un turno por hora entre el inicio y el fin (caso normal) (24 ms)
    √ no ofrece un turno que terminaria despues del horario de fin (caso borde) (1 ms)
    √ devuelve una lista vacia si el inicio y el fin son iguales o la duracion no entra (1 ms)
    √ lanza un error ante una duracion o una hora invalidas (caso invalido) (62 ms)
  cumpleAntelacion
    √ acepta un turno con mas de 2 horas de anticipacion (caso normal) (1 ms)
    √ acepta exactamente 2 horas y rechaza 1 minuto menos (caso borde)
    √ rechaza turnos pasados o en el instante actual, aun sin antelacion exigida (caso invalido)
  esDiaHabil
    √ un dia de semana sin bloqueo es habil y un sabado no (1 ms)
    √ un dia bloqueado por el administrador o una fecha imposible no son habiles (1 ms)

PASS tests/unit/m04-validacion-conflictos.test.js
  validarDatosReserva
    √ con fecha, hora, nombre y correo validos no devuelve error (caso normal) (23 ms)
    √ sin correo marca el campo email con el mensaje de CP-008 (caso invalido) (3 ms)
    √ distingue un correo vacio de uno mal escrito (caso borde) (2 ms)
    √ sin horario elegido pide elegir uno antes que los datos personales (3 ms)
  detectarConflicto
    √ un turno libre no tiene conflicto (caso normal) (2 ms)
    √ un turno tomado por otro invitado devuelve 'ocupado' con el mensaje del enunciado (2 ms)
    √ el mismo invitado reenviando su reserva es 'duplicada', aunque cambie mayusculas (CP-010) (16 ms)
    √ una reserva cancelada libera el turno (caso borde) (1 ms)
  evaluarReserva (regla completa que aplica el servidor)
    √ rechaza con 400 un turno de hoy sin la antelacion minima de 2 horas (4 ms)
    √ rechaza con 409 un turno ocupado y acepta (null) uno libre (4 ms)

PASS tests/unit/m01-password-registro.test.js
  evaluarPassword
    √ acepta una contrasena con 8+ caracteres, mayuscula, minuscula y numero (caso normal) (2 ms)
    √ acepta exactamente 8 caracteres y rechaza 7 (caso borde del largo minimo) (1 ms)
    √ informa cada regla incumplida por separado (caso invalido) (1 ms)
    √ trata una contrasena vacia o que no es texto como invalida sin lanzar error (1 ms)
  validarRegistro
    √ con todos los datos validos no devuelve error (caso normal) (2 ms)
    √ un nombre con solo espacios cuenta como vacio (caso borde)
    √ con la contrasena debil marca el campo password e incluye el motivo (caso invalido) (2 ms)
    √ informa primero el campo que aparece antes en el formulario (1 ms)

PASS tests/unit/m01-email.test.js
  normalizarEmail
    √ quita espacios y pasa a minusculas (caso normal) (2 ms)
    √ devuelve texto vacio para null o undefined (caso borde) (1 ms)
  esEmailValido
    √ acepta un email con usuario, dominio y extension (caso normal) (1 ms)
    √ rechaza emails sin @, sin dominio o sin extension (casos invalidos) (1 ms)
    √ rechaza espacios internos y extensiones de una sola letra (casos borde) (1 ms)
    √ rechaza valores que no son texto (caso invalido) (1 ms)
  validarLogin
    √ con usuario y contrasena completos no devuelve error (caso normal) (1 ms)
    √ con el usuario vacio marca el campo email (caso invalido) (1 ms)

PASS tests/unit/m01-seguridad.test.js
  hashearPassword / verificarPassword
    √ el hash no contiene la contrasena y la verificacion la reconoce (caso normal) (395 ms)
    √ rechaza una contrasena distinta, aunque difiera en una sola letra (caso invalido) (327 ms)
    √ la misma contrasena genera hashes distintos por la sal aleatoria (caso borde) (311 ms)
    √ un hash guardado con formato invalido devuelve false en lugar de romper (1 ms)
    √ no permite hashear una contrasena vacia (29 ms)
  crearTokenRecuperacion / tokenVigente
    √ un enlace recien creado vence a los 30 minutos y esta vigente (caso normal) (4 ms)
    √ vale un milisegundo antes del vencimiento y ya no vale en el instante exacto (caso borde)
    √ un registro inexistente o con fecha ilegible no es vigente (caso invalido)

------------------|---------|----------|---------|---------|-----------------------------------
File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                 
------------------|---------|----------|---------|---------|-----------------------------------
All files         |   83.33 |    74.19 |   86.66 |   87.24 |                                   
 server           |     100 |     91.3 |     100 |     100 |                                   
  seguridad.js    |     100 |     91.3 |     100 |     100 | 37,54                             
 src/logica       |   80.76 |    71.21 |   84.61 |   85.27 |                                   
  reservas.js     |   76.41 |    66.66 |   78.94 |   80.89 | 14,80,160,166,184-195,209,212,216 
  validaciones.js |      90 |    79.16 |     100 |      95 | 13,81                             
------------------|---------|----------|---------|---------|-----------------------------------
Test Suites: 5 passed, 5 total
Tests:       43 passed, 43 total
Snapshots:   0 total
Time:        3.226 s
Ran all test suites.
```

Las líneas sin cubrir de `reservas.js` corresponden a `agendaDelDia`, que arma la
agenda que muestra la pantalla y queda cubierta por los tests E2E de M04.

---

## 5. Reflexión estructurada

**1. Sobre la trazabilidad.** [REVISAR con el texto del TP1/TP2] Los casos de
prueba del TP5 se pudieron convertir casi directamente en tests: los que citaban
el mensaje exacto del sistema (CP-002, CP-004, CP-008) se transformaron en
aserciones sin interpretación. Las dificultades aparecieron donde el
requerimiento dejaba una decisión abierta. AYA-M01-RF-01 pide una contraseña
"que cumpla con los requisitos de seguridad" sin decir cuáles, y para escribir
`evaluarPassword` hubo que inventar la regla. La antelación mínima ("no se puede
reservar con menos de 2 horas") no aclara si exactamente 2 horas se permite, y
un test de borde obliga a elegir. Tampoco estaba escrita la dependencia de M04
con M02: sin la disponibilidad del administrador no se puede probar la selección
de fecha, y hubo que fijar una configuración.

**2. Sobre el valor de testear.** Sí. Cypress detectó que la agenda no se cargaba
al escribir la fecha porque la pantalla escuchaba un solo evento. Al preparar la
selección de fecha se vio que los horarios del TP5, fijos al 15/09/2026, ya
habían pasado y el sistema los seguía ofreciendo, contra lo que pide el
enunciado. Al diseñar el caso "hash guardado con formato inválido" se vio que la
función del TP5 lanzaba una excepción en lugar de rechazar el ingreso. Al
agregar los `data-cy` al panel se encontró que la lista de reservas se armaba con
`innerHTML` usando datos del invitado (XSS). Ninguno de estos problemas aparecía
probando a mano los 10 casos del TP5: el testing aporta más cuando se escribe
junto con el código y obliga a pensar en bordes, no solo al final.

**3. Sobre el uso de IA.** [COMPLETAR con la experiencia de cada integrante] La
IA fue más útil para el código fuente y el frontend (estructura, formularios con
sus `data-cy`, configuración de Cypress), que es trabajo mecánico. En los tests
generó buena cobertura de casos, pero con limitaciones: escribió un test que
ajustaba el valor esperado para que pasara, dejó un comentario que no coincidía
con lo verificado, y no podía resolver por sí sola las ambigüedades de los
requerimientos (reglas de contraseña, borde de la antelación). Que todos los
tests pasen tampoco prueba que sean útiles; hubo que introducir defectos a
propósito para comprobarlo.

---

## 6. Lecciones aprendidas

1. **Separar la lógica de la interfaz es lo que hace posible el test unitario.**
   En el TP5 las reglas estaban mezcladas con HTTP y con el DOM, y no había nada
   que probar de forma aislada. Extraerlas a funciones puras permitió 43 tests
   que corren en 3 segundos y que validan el mismo código que usa la pantalla.

2. **El tiempo es una dependencia y hay que inyectarlo.** Una función que llama a
   `new Date()` por dentro da resultados distintos según el día. Recibir `ahora`
   como parámetro hizo que los tests de antelación y de vencimiento sean
   repetibles, y en los E2E calcular el próximo día hábil evita que los tests
   venzan solos.

3. **Un test E2E que falla puede estar señalando un defecto real de la app.** El
   fallo de Cypress con el campo de fecha parecía un problema de la herramienta,
   pero revelaba que la pantalla dependía de un solo evento del navegador. Antes
   de "arreglar el test" conviene preguntarse si un usuario real podría pasar
   por el mismo camino.

4. **Los `data-cy` desacoplan los tests del diseño.** Cambiar textos, clases o la
   estructura de las pantallas no rompió ningún test, porque los selectores
   apuntan a atributos pensados para eso y no a la apariencia.

5. **La IA acelera, pero lo generado hay que revisarlo como código de otro.**
   Generó en minutos la estructura y la mayoría de los casos, pero también un
   test que acomodaba el resultado esperado y un comentario que no correspondía
   con la aserción. Sin revisión, esos tests habrían dado una falsa seguridad.

6. **Que todos los tests pasen no prueba que sirvan.** Introducir defectos a
   propósito (cambiar un `>=` por `>`) y ver que los tests fallan es una forma
   barata de comprobar que verifican algo.

7. **Un requerimiento ambiguo se nota cuando hay que escribir la aserción.**
   "Requisitos de seguridad" o "menos de 2 horas" se leen bien en el documento,
   pero el test exige un valor concreto. Escribir el criterio de aceptación con
   ejemplos (7 caracteres: rechazado; exactamente 2 horas: aceptado) en el TP1
   habría evitado decidirlo al programar.

8. **Verificar el estado del sistema, no solo la pantalla.** Los tests más
   valiosos comprueban también lo que no se ve: que se creó una sola reserva
   ante varios clicks, que se dispararon los dos correos o que el servidor
   respondió 409. Una pantalla correcta con un estado incorrecto sigue siendo un
   defecto.
