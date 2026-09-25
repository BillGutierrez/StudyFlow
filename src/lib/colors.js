// Paleta para cursos (definida por el Superadmin al crear cada curso, pero
// ofrecemos estos valores por defecto para el selector).
export const COURSE_COLORS = [
  '#5B5BD6', // índigo
  '#2F9E63', // verde
  '#E0982A', // ámbar
  '#3A8CC1', // azul
  '#C15B94', // rosa
  '#1F9E9E', // teal
  '#8C5B3A', // tierra
  '#7A5B1F', // mostaza
]

export function courseColor(curso) {
  return curso?.color || '#6B6F76'
}

// Tinte de fondo suave a partir de un color hex (para chips/bloques).
export function softBg(hex, alpha = 0.14) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
