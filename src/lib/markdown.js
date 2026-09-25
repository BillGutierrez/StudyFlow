// Mini-renderer de Markdown (sin dependencias externas) que soporta lo básico
// pedido: títulos, negrita, cursiva, listas, listas numeradas, enlaces, código.

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inline(text) {
  let t = escapeHtml(text)
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  return t
}

export function renderMarkdown(src) {
  if (!src || !src.trim()) return ''
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const html = []
  let listType = null // 'ul' | 'ol'
  let codeBlock = false
  let codeLines = []

  function closeList() {
    if (listType) {
      html.push(listType === 'ul' ? '</ul>' : '</ol>')
      listType = null
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (line.trim().startsWith('```')) {
      if (codeBlock) {
        html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
        codeLines = []
        codeBlock = false
      } else {
        closeList()
        codeBlock = true
      }
      continue
    }
    if (codeBlock) {
      codeLines.push(rawLine)
      continue
    }

    if (!line.trim()) {
      closeList()
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.*)/)
    if (heading) {
      closeList()
      const level = heading[1].length
      html.push(`<h${level + 2}>${inline(heading[2])}</h${level + 2}>`)
      continue
    }

    const ul = line.match(/^[-*]\s+(.*)/)
    if (ul) {
      if (listType !== 'ul') {
        closeList()
        html.push('<ul>')
        listType = 'ul'
      }
      html.push(`<li>${inline(ul[1])}</li>`)
      continue
    }

    const ol = line.match(/^\d+\.\s+(.*)/)
    if (ol) {
      if (listType !== 'ol') {
        closeList()
        html.push('<ol>')
        listType = 'ol'
      }
      html.push(`<li>${inline(ol[1])}</li>`)
      continue
    }

    closeList()
    html.push(`<p>${inline(line)}</p>`)
  }
  closeList()
  if (codeBlock && codeLines.length) {
    html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
  }
  return html.join('\n')
}
