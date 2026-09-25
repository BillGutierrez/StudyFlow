export default function Avatar({ user, size = 36 }) {
  if (!user) return null
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.52 }}
      title={user.nombre}
    >
      {user.avatar || '🙂'}
    </span>
  )
}
