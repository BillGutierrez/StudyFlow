// Reglas simples de XP, niveles y rachas. Todo determinístico y local.

export const XP_POR_TAREA = 10
export const XP_BONUS_ANTICIPADA = 5 // completar 1+ día antes de vencer
export const XP_POR_MISION = 30

// Nivel N requiere N*50 XP acumulados desde el nivel anterior (curva simple).
export function xpParaNivel(nivel) {
  return nivel * 50
}

export function calcularNivel(xpTotal) {
  let nivel = 1
  let restante = xpTotal
  while (restante >= xpParaNivel(nivel)) {
    restante -= xpParaNivel(nivel)
    nivel += 1
  }
  return { nivel, xpEnNivel: restante, xpParaSiguiente: xpParaNivel(nivel) }
}

export const ETAPAS_MASCOTA = [
  { nivelMin: 1, nombre: 'Huevo', emoji: '🥚' },
  { nivelMin: 3, nombre: 'Cría', emoji: '🐣' },
  { nivelMin: 6, nombre: 'Joven', emoji: '🐥' },
  { nivelMin: 10, nombre: 'Adulto', emoji: '🦉' },
  { nivelMin: 15, nombre: 'Sabio', emoji: '🦚' },
]

export function etapaMascota(nivel) {
  let etapa = ETAPAS_MASCOTA[0]
  for (const e of ETAPAS_MASCOTA) {
    if (nivel >= e.nivelMin) etapa = e
  }
  return etapa
}

export const CATALOGO_LOGROS = [
  { id: 'primera-tarea', nombre: 'Primer paso', descripcion: 'Completa tu primera tarea.', secreto: false },
  { id: 'diez-tareas', nombre: 'En racha', descripcion: 'Completa 10 tareas.', secreto: false },
  { id: 'cien-tareas', nombre: 'Veterano', descripcion: 'Completa 100 tareas.', secreto: false },
  { id: 'semana-completa', nombre: 'Semana perfecta', descripcion: 'Completa todas tus tareas de una semana.', secreto: false },
  { id: 'racha-7', nombre: 'Constante', descripcion: 'Mantén una racha de 7 días.', secreto: false },
  { id: 'sin-atrasos-mes', nombre: 'Cero atrasos', descripcion: 'Un mes entero sin tareas vencidas.', secreto: true },
  { id: 'madrugador', nombre: 'Madrugador', descripcion: 'Completa una tarea antes de las 7am.', secreto: true },
]
