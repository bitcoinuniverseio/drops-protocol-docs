(() => {
  const body = document.body
  const sourcePath = body.dataset.referenceSource
  const contentRoot = document.querySelector('[data-reference-content]')
  if (!sourcePath || !contentRoot) return

  const markdownPages = {
    'protocol/carrier-registry.md': 'carrier-registry.html',
    'protocol/drops.md': 'drops-specification.html',
    'protocol/drops-pacts.md': 'pacts-reference.html',
    'protocol/pacts-studio-reference.md': 'pacts-artifact.html',
    'guides/pacts-studio.md': 'pacts-studio-guide.html',
    'guides/run-indexer.md': 'verifier-guide.html',
    'guides/why-drops.md': 'why-drops.html',
  }
  const sourceUrl = new URL(sourcePath, window.location.href)

  function appendText(target, text) {
    if (text) target.append(document.createTextNode(text))
  }

  function resolveHref(value) {
    if (!value || value.startsWith('#')) return value
    const destination = new URL(value, sourceUrl)
    const rootMarker = '/drops-docs/'
    const markerIndex = destination.pathname.indexOf(rootMarker)
    const repositoryPath = markerIndex >= 0 ? destination.pathname.slice(markerIndex + rootMarker.length) : ''
    const page = markdownPages[repositoryPath]
    if (page) return `${page}${destination.hash}`
    return destination.href
  }

  function renderInline(target, value) {
    const pattern = /(!?\[[^\]]*\]\([^)]*\)|`[^`]*`|\*\*[^*]+\*\*)/g
    let last = 0
    for (const match of value.matchAll(pattern)) {
      appendText(target, value.slice(last, match.index))
      const token = match[0]
      if (token.startsWith('![')) {
        const image = token.match(/^!\[([^\]]*)\]\(([^)]*)\)$/)
        if (image) {
          const figure = document.createElement('figure')
          figure.className = 'reference-figure'
          const img = document.createElement('img')
          img.src = resolveHref(image[2])
          img.alt = image[1]
          const caption = document.createElement('figcaption')
          caption.textContent = image[1]
          figure.append(img, caption)
          target.append(figure)
        }
      } else if (token.startsWith('[')) {
        const link = token.match(/^\[([^\]]*)\]\(([^)]*)\)$/)
        if (link) {
          const anchor = document.createElement('a')
          const href = resolveHref(link[2])
          anchor.href = href
          anchor.textContent = link[1]
          if (/^https?:\/\//.test(href) && new URL(href).origin !== window.location.origin) {
            anchor.target = '_blank'
            anchor.rel = 'noreferrer'
          }
          target.append(anchor)
        }
      } else if (token.startsWith('`')) {
        const code = document.createElement('code')
        code.textContent = token.slice(1, -1)
        target.append(code)
      } else {
        const strong = document.createElement('strong')
        strong.textContent = token.slice(2, -2)
        target.append(strong)
      }
      last = (match.index ?? 0) + token.length
    }
    appendText(target, value.slice(last))
  }

  function cellValue(value) {
    const cell = document.createElement('td')
    renderInline(cell, value.trim())
    return cell
  }

  function flowDiagram(value) {
    const labels = []
    const seen = new Set()
    for (const match of value.matchAll(/[A-Za-z][A-Za-z0-9_]*\[([^\]]+)\]/g)) {
      const label = match[1].trim()
      if (label && !seen.has(label)) {
        seen.add(label)
        labels.push(label)
      }
    }
    if (!labels.length) return null
    const flow = document.createElement('div')
    flow.className = 'reference-flow'
    flow.setAttribute('aria-label', 'Protocol flow')
    for (const label of labels) {
      const node = document.createElement('article')
      node.textContent = label
      flow.append(node)
    }
    return flow
  }

  function createCode(value, language) {
    if (language === 'mermaid') return flowDiagram(value)
    const panel = document.createElement('pre')
    panel.className = 'reference-code'
    panel.dataset.language = language || 'reference'
    const code = document.createElement('code')
    code.textContent = value
    panel.append(code)
    return panel
  }

  function renderMarkdown(markdown) {
    const lines = markdown.replace(/\r/g, '').split('\n')
    let index = 0
    while (index < lines.length) {
      const line = lines[index]
      if (!line.trim()) {
        index += 1
        continue
      }
      const fence = line.match(/^```([^\s]*)\s*$/)
      if (fence) {
        index += 1
        const block = []
        while (index < lines.length && !/^```\s*$/.test(lines[index])) block.push(lines[index++])
        index += 1
        const rendered = createCode(block.join('\n'), fence[1])
        if (rendered) contentRoot.append(rendered)
        continue
      }
      const heading = line.match(/^(#{1,3})\s+(.+)$/)
      if (heading) {
        const element = document.createElement(`h${heading[1].length}`)
        element.id = heading[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        renderInline(element, heading[2])
        contentRoot.append(element)
        index += 1
        continue
      }
      if (/^\|/.test(line) && /^\|?\s*:?-{3,}/.test(lines[index + 1] ?? '')) {
        const table = document.createElement('table')
        table.className = 'reference-table'
        const head = document.createElement('thead')
        const headRow = document.createElement('tr')
        const headings = line.split('|').slice(1, -1)
        for (const value of headings) {
          const cell = document.createElement('th')
          renderInline(cell, value.trim())
          headRow.append(cell)
        }
        head.append(headRow)
        table.append(head)
        index += 2
        const tableBody = document.createElement('tbody')
        while (index < lines.length && /^\|/.test(lines[index])) {
          const row = document.createElement('tr')
          for (const value of lines[index].split('|').slice(1, -1)) row.append(cellValue(value))
          tableBody.append(row)
          index += 1
        }
        table.append(tableBody)
        const wrap = document.createElement('div')
        wrap.className = 'reference-table-wrap'
        wrap.append(table)
        contentRoot.append(wrap)
        continue
      }
      const listMatch = line.match(/^(?:[-*]\s+|\d+\.\s+)(.+)$/)
      if (listMatch) {
        const ordered = /^\d+\.\s+/.test(line)
        const list = document.createElement(ordered ? 'ol' : 'ul')
        while (index < lines.length) {
          const item = lines[index].match(ordered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/)
          if (!item) break
          const entry = document.createElement('li')
          renderInline(entry, item[1])
          list.append(entry)
          index += 1
        }
        contentRoot.append(list)
        continue
      }
      if (/^---+$/.test(line)) {
        contentRoot.append(document.createElement('hr'))
        index += 1
        continue
      }
      if (/^!\[[^\]]*\]\([^)]*\)$/.test(line)) {
        renderInline(contentRoot, line)
        index += 1
        continue
      }
      const paragraph = []
      while (index < lines.length && lines[index].trim() && !/^```/.test(lines[index]) && !/^(#{1,3})\s+/.test(lines[index]) && !/^\|/.test(lines[index]) && !/^(?:[-*]\s+|\d+\.\s+)/.test(lines[index])) {
        paragraph.push(lines[index++])
      }
      const element = document.createElement('p')
      renderInline(element, paragraph.join(' '))
      contentRoot.append(element)
    }
  }

  fetch(sourceUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load reference: ${response.status}`)
      return response.text()
    })
    .then((markdown) => {
      contentRoot.replaceChildren()
      renderMarkdown(markdown)
    })
    .catch(() => {
      contentRoot.replaceChildren()
      const message = document.createElement('p')
      message.className = 'reference-error'
      message.textContent = 'This reference could not be loaded. Please refresh the page and try again.'
      contentRoot.append(message)
    })
})()
