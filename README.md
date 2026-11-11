# Mi Agenda

Agenda con vistas Día / Semana / Mes / Agenda, tareas y objetivos. HTML + CSS + JavaScript (módulos ES), sin dependencias.

## Ejecutar

Los módulos ES no cargan abriendo el archivo con doble clic (`file://`); hace falta un servidor local:

```bash
node tools/dev-server.mjs
```

y abrir http://localhost:5173 (también sirve la extensión *Live Server* de VS Code).

## App instalable (PWA)

Mi Agenda es una **Progressive Web App**: se instala con su propio icono, se abre en su propia ventana y funciona sin conexión.

| Dispositivo | Cómo se instala |
|---|---|
| Android (Chrome, Edge, Samsung) | Aviso «Instalar» dentro de la app, o menú ⋮ → *Instalar app* |
| iPhone / iPad (Safari) | Compartir → *Añadir a pantalla de inicio* (la app muestra estas instrucciones) |
| Windows / Mac / Linux / ChromeOS (Chrome, Edge) | Aviso «Instalar», o icono de instalar en la barra de direcciones |
| Mac (Safari 17+) | Archivo → *Añadir al Dock* |

**Requisito:** para instalarla en otros dispositivos, la app tiene que estar publicada en una dirección **HTTPS**. Sirve cualquier hosting estático gratuito (GitHub Pages, Netlify, Vercel, Cloudflare Pages): basta con subir la carpeta tal cual, sin pasos de compilación. En `localhost` funciona sin HTTPS, solo para pruebas.

### Después de cada cambio en el código

```bash
node tools/build-sw.mjs
```

Este comando actualiza la lista de archivos que se guardan para usar sin conexión (`sw.js`) y su versión. Las apps ya instaladas se actualizan solas la siguiente vez que se abren.

Para cambiar el icono, edita `tools/generate-icons.mjs` y ejecuta `node tools/generate-icons.mjs`.

### Accesos directos

Si mantienes pulsado el icono instalado (o le haces clic derecho), aparecen *Tareas* (`?vista=tasks`) y *Objetivos* (`#objetivos`).

## Dónde se guardan los datos

- **Abierta en local** (este servidor, Live Server…): en el `localStorage` del navegador. Los datos solo están en ese navegador.
- **Publicada como Artifact de Claude:** en la base de datos compartida del artifact (`window.claude.use('db')`).

No usa Firebase ni ningún otro servicio externo.

## Estructura

```
index.html                 Marcado estático de la app
css/
  tokens.css               Variables de tema (claro/oscuro, colores de calendario)
  base.css                 Reset y elementos genéricos (botones, checks, barras…)
  layout.css               Cabecera, panel lateral, columna principal
  components/              sidebar, quote, chip, dialog
  views/                   month, timegrid, agenda, tasks, goals
js/
  main.js                  Raíz de composición: crea y conecta todo
  config/                  Calendarios, constantes, frases
  utils/                   date, dom, id (funciones puras)
  domain/                  Reglas de negocio puras: events, tasks, goals, quotes
  data/                    Persistencia: Collection (local / remota), preferencias, errores
  services/                Casos de uso CRUD sobre las colecciones
  state/                   Estado de la app y selectores
  ui/                      header, modal, toast, status, quote-panel
    components/            chips, confirm-bar, form
    sidebar/               mini-calendar, calendar-list, upcoming
    dialogs/               event-detail, event-editor, task-editor, goal-editor
    views/                 view-registry + una vista por archivo
  controllers/             navigation, keyboard
  pwa/                     Registro del service worker y aviso de instalación
manifest.webmanifest       Nombre, icono y colores de la app instalada
sw.js                      Service worker (modo sin conexión), generado por tools/build-sw.mjs
icons/                     Iconos PNG/SVG, generados por tools/generate-icons.mjs
tools/dev-server.mjs       Servidor estático de desarrollo
tools/build-sw.mjs         Actualiza la lista de archivos sin conexión de sw.js
tools/generate-icons.mjs   Genera los iconos
```

Las dependencias van en una sola dirección: `ui → services → data`, y todas pueden usar `domain`, `utils` y `config`. `domain` y `utils` no tocan el DOM ni el almacenamiento.

## Principios SOLID aplicados

- **S — Responsabilidad única:** cada archivo hace una cosa (calcular recurrencias, guardar en `localStorage`, dibujar el mes, gestionar el modal…).
- **O — Abierto/cerrado:**
  - Vista nueva: se crea su módulo con `{ id, title, step, render }` y se registra en `main.js`.
  - Repetición nueva: se añade una estrategia a `RECURRENCE` en `domain/events.js`.
  - Calendario nuevo: se añade en `config/calendars.js` y su color `--c-<id>` en `tokens.css`.
- **L — Sustitución de Liskov:** `LocalCollection` y `RemoteCollection` son intercambiables, igual que todas las vistas del `ViewRegistry`.
- **I — Segregación de interfaces:** `Collection` solo expone `subscribe`, `save` y `remove`, y cada módulo de UI recibe un `ctx` del que usa solo lo que necesita.
- **D — Inversión de dependencias:** los servicios dependen de la abstracción `Collection`, no de `localStorage` ni del SDK. Solo `main.js` y `data/storage-factory.js` conocen las clases concretas.
