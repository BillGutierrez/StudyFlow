import { useState } from 'react'
import { renderMarkdown } from '../lib/markdown'

export default function MarkdownField({ value, onChange, placeholder }) {
  const [tab, setTab] = useState('editar')

  return (
    <div className="md-field">
      <div className="md-tabs">
        <button type="button" className={tab === 'editar' ? 'active' : ''} onClick={() => setTab('editar')}>
          Editar
        </button>
        <button type="button" className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}>
          Vista previa
        </button>
        <span className="md-hint">admite **negrita**, _cursiva_, listas, `código`, enlaces</span>
      </div>
      {tab === 'editar' ? (
        <textarea
          className="md-textarea"
          rows={6}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div
          className="md-preview"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) || '<p class="md-empty">Nada que previsualizar todavía.</p>' }}
        />
      )}
    </div>
  )
}
