import { urgencyLevel, diasTexto, URGENCY_LABEL } from '../lib/dates'

export default function UrgencyBadge({ fecha, compact }) {
  const nivel = urgencyLevel(fecha)
  return (
    <span className={`urgency-badge urgency-${nivel}`}>
      <span className="urgency-dot" />
      {compact ? diasTexto(fecha) : `${URGENCY_LABEL[nivel]} · ${diasTexto(fecha)}`}
    </span>
  )
}
