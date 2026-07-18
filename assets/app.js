for (const button of document.querySelectorAll('[data-copy]')) {
  button.dataset.copyManaged = 'true'
  button.addEventListener('click', async () => {
    const target = document.querySelector(button.dataset.copy)
    if (!target) return
    const label = button.dataset.copyLabel || button.textContent
    button.dataset.copyLabel = label
    try {
      await navigator.clipboard.writeText(target.textContent.trim())
      button.textContent = 'Copied'
      window.setTimeout(() => { button.textContent = label }, 1400)
    } catch {
      button.textContent = 'Select code'
      window.setTimeout(() => { button.textContent = label }, 1400)
    }
  })
}
