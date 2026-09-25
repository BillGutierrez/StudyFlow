function base(props) {
  return { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, ...props }
}

export function Home() {
  return (
    <svg {...base()}>
      <path d="M4 11.5 12 4l8 7.5M6 10v9h5v-5.5h2V19h5v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function Sun() {
  return (
    <svg {...base()}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.5M12 19v2.5M4.5 12H2M22 12h-2.5M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" strokeLinecap="round" />
    </svg>
  )
}
export function Calendar() {
  return (
    <svg {...base()}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}
export function Grid() {
  return (
    <svg {...base()}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  )
}
export function List() {
  return (
    <svg {...base()}>
      <path d="M5 6.5h14M5 12h14M5 17.5h9" strokeLinecap="round" />
    </svg>
  )
}
export function Book() {
  return (
    <svg {...base()}>
      <path d="M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 0-3-3z" strokeLinejoin="round" />
      <path d="M17 4.5h2v15h-2" strokeLinejoin="round" />
    </svg>
  )
}
export function Clock() {
  return (
    <svg {...base()}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function Tag() {
  return (
    <svg {...base()}>
      <path d="M11.5 3.5h6a2 2 0 0 1 2 2v6a2 2 0 0 1-.6 1.4l-8 8a2 2 0 0 1-2.8 0l-6-6a2 2 0 0 1 0-2.8l8-8a2 2 0 0 1 1.4-.6Z" strokeLinejoin="round" />
      <circle cx="15.5" cy="8.5" r="1.3" />
    </svg>
  )
}
export function Timeline() {
  return (
    <svg {...base()}>
      <path d="M4 6h6M4 12h11M4 18h8" strokeLinecap="round" />
      <circle cx="12" cy="6" r="1.6" />
      <circle cx="17" cy="12" r="1.6" />
      <circle cx="14" cy="18" r="1.6" />
    </svg>
  )
}
export function Chat() {
  return (
    <svg {...base()}>
      <path d="M4 5.5h16v11H9.5L5 20v-3.5H4z" strokeLinejoin="round" />
    </svg>
  )
}
export function Target() {
  return (
    <svg {...base()}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
  )
}
export function Award() {
  return (
    <svg {...base()}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.5 13.5 7 21l5-2.4 5 2.4-1.5-7.5" strokeLinejoin="round" />
    </svg>
  )
}
export function Flame() {
  return (
    <svg {...base()}>
      <path d="M12 3c1 3-3 4-3 8a3 3 0 0 0 6 0c1 0 2 1 2 3a5 5 0 0 1-10 0c0-5 4-6 5-11Z" strokeLinejoin="round" />
    </svg>
  )
}
export function Pet() {
  return (
    <svg {...base()}>
      <circle cx="12" cy="13" r="6.5" />
      <circle cx="8.2" cy="6.5" r="2" />
      <circle cx="15.8" cy="6.5" r="2" />
      <circle cx="9.7" cy="12.5" r="0.8" fill="currentColor" />
      <circle cx="14.3" cy="12.5" r="0.8" fill="currentColor" />
      <path d="M10 15.5c.6.6 3.4.6 4 0" strokeLinecap="round" />
    </svg>
  )
}
export function Chart() {
  return (
    <svg {...base()}>
      <path d="M4 20V10M11 20V4M18 20v-7" strokeLinecap="round" />
      <path d="M3 20h18" strokeLinecap="round" />
    </svg>
  )
}
export function Settings() {
  return (
    <svg {...base()}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M17.7 17.7l-1.4-1.4M7.7 7.7 6.3 6.3" strokeLinecap="round" />
    </svg>
  )
}
export function Shield() {
  return (
    <svg {...base()}>
      <path d="M12 3.5 19 6.5v5.5c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6.5z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function Close() {
  return (
    <svg {...base(({ width: 20, height: 20 }))}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}
export function Chevron({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className={`chevron ${className}`}>
      <path d="M8 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function Collapse({ flipped }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ transform: flipped ? 'rotate(180deg)' : 'none' }}>
      <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function Logout() {
  return (
    <svg {...base()}>
      <path d="M9 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h3M15 16l4-4-4-4M19 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function Bell() {
  return (
    <svg {...base()}>
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  )
}
export function Plus() {
  return (
    <svg {...base()}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}
export function Menu() {
  return (
    <svg {...base()}>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  )
}
export function Trash() {
  return (
    <svg {...base()}>
      <path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8.5 0 .7 12a2 2 0 0 0 2 1.9h5.6a2 2 0 0 0 2-1.9l.7-12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function Edit() {
  return (
    <svg {...base()}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" strokeLinejoin="round" />
    </svg>
  )
}
export function Paperclip() {
  return (
    <svg {...base()}>
      <path d="M8 12.5 15 5.5a3 3 0 0 1 4.2 4.2L10.7 18a5 5 0 0 1-7-7l8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function Search() {
  return (
    <svg {...base()}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.3-4.3" strokeLinecap="round" />
    </svg>
  )
}
