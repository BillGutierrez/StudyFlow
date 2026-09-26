# StudyFlow

App de organización académica para estudiantes: tareas, horario de clases,
progreso gamificado y una pequeña comunidad entre amigos. Construida con
React + Vite. Todo funciona de verdad en el navegador — no es un
prototipo visual — pero el "backend" por ahora es `localStorage`, así que
cada navegador tiene su propia copia de los datos.

## Cómo ejecutar

```bash
npm install
cp .env.example .env
npm run dev
```

Abre la URL que muestra la terminal (normalmente `http://localhost:5173`).

## Configuración de Supabase

1. Crea un proyecto en Supabase.
2. Copia la URL del proyecto y la clave pública a tu archivo `.env`.
3. Ejecuta el SQL de `supabase/schema.sql` en el SQL editor de Supabase.
4. Si no tienes esas variables, la app sigue funcionando en modo local con `localStorage` como fallback.

Esto te deja preparada la app para una base de datos real, pero sin romper la demo local mientras configuras el proyecto.

**Cuentas de la demo** (ya vienen creadas con datos de ejemplo):

| Usuario  | Contraseña | Rol         |
|----------|-----------|-------------|
| `bill`   | `admin123`| Superadmin  |
| `ana`    | `demo123` | Estudiante  |
| `carlos` | `demo123` | Estudiante  |
| `maria`  | `demo123` | Estudiante  |

También puedes registrar una cuenta nueva desde la pantalla de login (se
crea como estudiante normal).

## Publicar en GitHub Pages

1. En `vite.config.js`, cambia `base: '/studyflow/'` por el nombre real
   de tu repositorio.
2. `git init && git add . && git commit -m "StudyFlow v1" && git branch -M main`
   `git remote add origin https://github.com/TU-USUARIO/TU-REPO.git && git push -u origin main`
3. En GitHub: **Settings → Pages → Source → GitHub Actions** (el workflow
   ya está en `.github/workflows/deploy.yml` y publica en cada push a
   `main`). También puedes usar `npm run deploy` (rama `gh-pages`) si
   prefieres el método manual.

## Qué funciona de verdad (no es mock)

- Registro, login, logout y "recuperar contraseña" (ver nota abajo).
- Roles Superadmin / Usuario, con rutas y acciones protegidas según rol.
- Crear, editar, duplicar, eliminar y completar/descompletar tareas, con
  confirmación antes de marcar/desmarcar.
- Urgencia automática por color (verde 4+ días, amarillo 2-3, rojo 1 día
  o vence hoy, y un estado aparte para vencidas) — nunca se elige a mano.
- Validación de duplicados al crear una tarea, y validaciones básicas de
  formulario (título, curso, fechas, hora de fin > hora de inicio).
- Descripción en Markdown con editor y vista previa en vivo (parser
  propio, sin dependencias externas).
- Adjuntar archivos pequeños (se guardan como base64 en `localStorage`,
  por eso el límite de tamaño — ver limitaciones).
- Vistas Hoy, Semana (con horario fijo de clases + tareas + arrastrar y
  soltar el bloque de planificación, con detección de choques), Mes,
  Todas (con búsqueda, filtros y orden), Timeline/Gantt.
- Horario de clases fijo, editable solo por el Superadmin, con detección
  de conflictos al planificar una tarea sobre una clase.
- Cursos y etiquetas predefinidos por el Superadmin (dropdown, no texto
  libre) y vista "entrar a un curso" para ver solo lo suyo.
- Muro por tarea: comentarios, respuestas, reacciones (set fijo de
  emojis), edición/eliminación propia con ventana de 5 minutos, reportes
  y moderación (fijar, eliminar, revisar reportes) para el Superadmin.
- Chat general del grupo con las mismas reglas de moderación, más
  silenciar usuarios temporalmente.
- Notificaciones del navegador (con sonido y vibración configurables)
  cuando hay tareas vencidas o que vencen hoy — una vez al día para no
  saturar.
- XP, niveles, rachas, insignias (incluyendo secretas), misiones
  semanales con recompensa, mascota que evoluciona con el nivel.
- Estadísticas personales con heatmap de constancia (estilo GitHub) y
  distribución de tareas por curso.
- Panel de Superadmin: usuarios (activar/desactivar, ver actividad),
  cursos, etiquetas, moderación/reportes, estadísticas globales y
  "quién falta" por cada tarea.
- Modo claro/oscuro (con detección del tema del sistema) y notificaciones
  con confirmación antes de acciones irreversibles.
- Manifest + ícono + service worker básico: la app se puede instalar y
  el "cascarón" (HTML/CSS/JS) carga offline. Los datos ya viven en
  `localStorage`, así que en la práctica también están disponibles sin
  conexión — lo que falta es sincronizar entre dispositivos (ver abajo).

## Qué quedó simulado / mock (por la naturaleza de una app sin servidor)

- **"Backend"**: todo vive en `localStorage` del navegador. No hay una
  base de datos real ni una API — el archivo `src/lib/store.js` hace ese
  papel con datos semilla + un reducer que ya está organizado como si
  hablara con una API (mismo patrón de acciones), para que sea más fácil
  de migrar el día que haya un backend real.
- **Contraseñas**: se guardan en texto plano en `localStorage` (nada de
  hashing). Esto es aceptable para una demo local, pero jamás así en
  producción.
- **"Recuperar contraseña"**: sin backend de correo, el flujo resetea la
  contraseña directamente con el usuario ingresado — no hay verificación
  real de identidad.
- **Archivos adjuntos**: como no hay almacenamiento de archivos real, se
  guardan como base64 dentro de `localStorage`, con un límite pequeño de
  tamaño (300KB). Para archivos grandes, lo práctico por ahora es pegar
  un enlace en la descripción.
- **Sincronización entre usuarios**: cada usuario ve los mismos datos
  *solo si comparten el mismo navegador* (porque no hay servidor). En la
  demo, todos los usuarios están en el mismo `localStorage` para que
  puedas probar "quién falta", el muro, el chat, etc. En una versión
  real, cada quien tendría su sesión contra un backend compartido.

## Qué necesita un backend real para funcionar "de verdad" entre varios dispositivos

- Autenticación segura (hash de contraseñas, tokens, recuperación por
  correo real).
- Una base de datos compartida (tareas, comentarios, chat, XP) para que
  todos tus amigos vean lo mismo desde sus propios celulares/compus.
- Almacenamiento de archivos real (S3 o similar) sin límite de 300KB.
- Notificaciones push de verdad (con el navegador/app cerrada) — hoy
  solo avisa mientras StudyFlow está abierto.
- Sincronización offline→online cuando vuelve la conexión.

## Estructura del proyecto

```
src/
  lib/            funciones puras: fechas, markdown, colores, gamificación,
                   store (seed + persistencia), reducer (toda la lógica de
                   negocio), selectors (estadísticas, misiones, conflictos)
  context/        AppDataContext (estado global) y AuthContext (sesión)
  components/     piezas reutilizables: Sidebar, TopBar, BottomNav, Modal,
                   ConfirmDialog, TaskCard, TaskFormModal, MarkdownField, íconos
  pages/          una página por vista (Dashboard, Hoy, Semana, Mes, Todas,
                   detalle de tarea, Cursos, Horario, Etiquetas, Timeline,
                   Chat, Misiones, Logros, Rachas, Mascota, Estadísticas,
                   Perfil, Ajustes, Admin, Auth)
  App.jsx         navegación entre páginas (sin router, por simplicidad de
                   despliegue en GitHub Pages) + layout con sidebar/topbar
public/
  manifest.json, icon.svg, sw.js    soporte básico de PWA
```

No usa React Router a propósito: para que el `base` de GitHub Pages no
dé problemas con rutas, la navegación es un simple cambio de estado en
`App.jsx` (`{page, taskId}`), no URLs reales. Si más adelante hay
backend y dominio propio, migrar a rutas de verdad es un cambio
localizado a ese archivo.
