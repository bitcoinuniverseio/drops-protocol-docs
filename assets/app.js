for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    const target = document.querySelector(button.dataset.copy)
    if (!target) return
    await navigator.clipboard.writeText(target.textContent.trim())
    const label = button.textContent
    button.textContent = 'Copied'
    window.setTimeout(() => { button.textContent = label }, 1400)
  })
}
