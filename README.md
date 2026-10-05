# AgendaYA — TP N.º 6: Testing automatizado

Trabajo Práctico N.º 6 de Ingeniería y Calidad de Software (UTN FRM, 4K10 —
Grupo 4), sobre los módulos **M01 (Autenticación)** y **M04 (Booking público)**
del sistema AgendaYA. Parte de la aplicación construida en el
[TP5](https://github.com/maxidoe2/agendaya-tp5-grupo4).

**Integrantes:** Barchiesi Santino (50791), Estudillo Máximo (50013) y Navarro
Matías (51006).

| Entregable | Dónde |
|---|---|
| Frontend mínimo (Tarea A) | [`frontend/`](frontend) + [`server/`](server) |
| Tests E2E con Cypress (Tarea B) | [`cypress/e2e/`](cypress/e2e) |
| Tests unitarios con Jest (Tarea C) | [`tests/unit/`](tests/unit) sobre [`src/logica/`](src/logica) y [`server/seguridad.js`](server/seguridad.js) |
| Uso de IA documentado | [`docs/ia/USO-DE-IA.md`](docs/ia/USO-DE-IA.md) |
| Evidencias de ejecución | [`docs/evidencias/`](docs/evidencias) |
| Informe | [`docs/informe/`](docs/informe) |

## Requisitos

- Node.js 18 o superior (se desarrolló con Node 22).
- La primera instalación descarga el binario de Cypress (~500 MB).

## Puesta en marcha

```
npm install
npm start
```

Abrir `http://localhost:3000`. Para volver al estado inicial: `npm run reset`.

| Correo | Contraseña |
|---|---|
| admin@agendaya.com | Contrasena123! |
| hola.comova@agendaya.com | Recuperar2025! |

## Ejecutar los tests

| Comando | Qué hace |
|---|---|
| `npm run test:unit` | Tests unitarios (Jest), con el detalle de cada test |
| `npm run test:coverage` | Tests unitarios con reporte de cobertura (`coverage/`) |
| `npm run test:e2e` | Levanta el servidor, corre Cypress headless y lo apaga |
| `npm run test:e2e:open` | Levanta el servidor y abre Cypress en modo interactivo |
| `npm test` | Unitarios y luego E2E |

Si el servidor ya está corriendo con `npm start`, alcanza con `npx cypress run`
o `npx cypress open`. El `baseUrl` está configurado una sola vez en
[`cypress.config.js`](cypress.config.js).

**Aviso:** cada test E2E reinicia la base (`data/db.json`) antes de empezar, así
que borra las reservas y cuentas creadas a mano.

Las capturas quedan en `cypress/screenshots/` (una por test, con el log de
comandos) y los videos en `cypress/videos/`.

Las capturas de pantallas del informe se regeneran con el servidor levantado y
`npx cypress run --config specPattern=cypress/capturas/*.cy.js`.

## Estructura

```
frontend/            Pantallas (HTML + CSS + JS vanilla) con atributos data-cy
server/              Express: endpoints, persistencia en JSON y correo simulado
  seguridad.js       Hash de contraseñas y vigencia del enlace de recuperación
src/logica/          Lógica de negocio pura, compartida por navegador, servidor y tests
  validaciones.js    M01: email, contraseña segura, registro y login
  reservas.js        M04: slots, día hábil, antelación, conflictos, validación
tests/unit/          Tests unitarios (un archivo por integrante)
cypress/e2e/         Tests E2E (un archivo por integrante)
cypress/support/     Reinicio de la base y captura al final de cada test
cypress/capturas/    Genera las capturas de pantalla del informe (no es un test)
docs/                Uso de IA, evidencias e informe
```

## Responsabilidades individuales

| Integrante | Tests E2E (`cypress/e2e/`) | Tests unitarios (`tests/unit/`) |
|---|---|---|
| Barchiesi Santino | `m01-registro-exitoso` — registro (happy path) · `m01-login-logout` — login + logout + panel protegido; contraseña incorrecta | `m01-email` — `normalizarEmail`, `esEmailValido`, `validarLogin` (8) · `m01-seguridad` — hash/verificación y token de recuperación (8) |
| Estudillo Máximo | `m01-registro-errores` — formulario vacío y correo ya registrado · `m04-reserva-errores` — horario no disponible, falta el correo, día no hábil | `m01-password-registro` — `evaluarPassword`, `validarRegistro` (8) · `m04-validacion-conflictos` — `validarDatosReserva`, `detectarConflicto`, `evaluarReserva` (10) |
| Navarro Matías | `m04-reserva-exitosa` — fecha, hora y confirmación; clicks múltiples | `m04-slots-antelacion` — `calcularSlots`, `cumpleAntelacion`, `esDiaHabil`, `agendaDelDia` (11) |

Total: 10 tests E2E y 45 tests unitarios.

## Flujos implementados (Tarea A)

| Módulo | Flujo | Pantalla | Requerimiento |
|---|---|---|---|
| M01 | Registro de usuario | `/registro.html` | AYA-M01-RF-01 |
| M01 | Login y logout | `/` → `/dashboard.html` → Cerrar sesión | AYA-M01-RF-04 |
| M04 | Seleccionar fecha y hora | `/reservar.html` (pasos 1 y 2) | AYA-M04-RF-03 |
| M04 | Completar formulario y confirmar | `/reservar.html` (pasos 3 y 4) | AYA-M04-RF-03, RF-05 |
| M04 (opcional) | Manejo de horario no disponible | `/reservar.html` | AYA-M04-RF-05 |

También quedan del TP5 la recuperación y el restablecimiento de contraseña.

### Convención de `data-cy`

- Campos: `<nombre>-input` (`email-input`, `fecha-input`…); botones de acción:
  `login-button`, `registro-button`, `logout-button`, `submit-booking`.
- Turnos: `slot-HHMM` (`slot-1000` = 10:00).
- Mensajes: `alerta-error`, `alerta-exito`, `error-<campo>` y
  `booking-confirmation`.

## Decisiones técnicas

**Lógica de negocio separada de la interfaz.** En el TP5 las reglas estaban
dentro de `server.js` y de los `<script>` de cada pantalla, sin nada que se
pudiera testear de forma aislada. Se movieron a `src/logica/`, en módulos que se
cargan igual en Node (`require`) y en el navegador (`<script>`): la validación
que corre en la pantalla es la misma que prueba Jest y que vuelve a aplicar el
servidor.

**El reloj se inyecta.** Las funciones que dependen de la hora actual reciben
`ahora` por parámetro. Los tests unitarios usan fechas fijas y los E2E calculan
el próximo día hábil, así ningún test vence con el paso del tiempo.

**Disponibilidad fija.** M04 depende de la disponibilidad (M02) y de los tipos
de evento (M03), que son de otros grupos. Se fijó una configuración:
lunes a viernes, 9 a 17 h, turnos de 60 min y 2 h de antelación mínima
(`DISPONIBILIDAD` en `src/logica/reservas.js`).

**Estado de prueba controlado.** Los E2E reinician la base con `cy.task` antes
de cada test y verifican efectos que no se ven en la pantalla (correos
registrados, cantidad de reservas en el servidor).

## Defectos encontrados y corregidos respecto del TP5

- Los horarios estaban fijos al 15/09/2026: el sistema permitía reservar turnos
  ya pasados, contra lo que pide el enunciado. Ahora se rechazan turnos pasados
  o sin la antelación mínima.
- El panel armaba la lista de reservas con `innerHTML` usando datos que escribe
  el invitado (XSS almacenado). Ahora usa `textContent`.
- `verificar` lanzaba una excepción si el hash guardado tenía un formato
  inesperado. Ahora devuelve `false`.
- Se quitó `/api/estado`, que exponía los datos de todos los usuarios.
- Durante el TP6: la agenda solo escuchaba el evento `change` del campo de
  fecha y no se cargaba al escribir la fecha (lo detectó Cypress).

## Limitaciones conocidas

- `GET /api/reservas` no exige sesión: el panel la usa sin autenticación en el
  servidor (la sesión vive en el navegador). El enunciado pide que los datos de
  los invitados no sean públicos.
- Login y recuperación revelan si un correo está registrado (enumeración de
  cuentas), como ya se señaló en el TP5.
- Fechas en hora local del servidor; no se maneja la zona horaria del
  administrador (dato de perfil de M01).
