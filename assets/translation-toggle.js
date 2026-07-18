(() => {
  const translationHostSuffix = '.translate.goog'
  const currentUrl = new URL(window.location.href)
  const isTranslationProxy = currentUrl.hostname.endsWith(translationHostSuffix)

  function sourceUrlFromProxy() {
    if (!isTranslationProxy) return currentUrl.href

    const proxiedHost = currentUrl.hostname.slice(0, -translationHostSuffix.length)
    const source = new URL(`https://${proxiedHost.replace(/-/g, '.')}${currentUrl.pathname}${currentUrl.hash}`)
    for (const [key, value] of currentUrl.searchParams) {
      if (!key.startsWith('_x_tr_')) source.searchParams.append(key, value)
    }
    return source.href
  }

  const sourceUrl = sourceUrlFromProxy()
  const sourceProtocol = new URL(sourceUrl).protocol
  const canTranslate = sourceProtocol === 'https:' || sourceProtocol === 'http:'
  const control = document.createElement('div')
  const mark = document.createElement('span')
  const button = document.createElement('button')

  control.className = 'translation-toggle'
  control.setAttribute('translate', 'no')
  control.setAttribute('role', 'group')
  control.setAttribute('aria-label', 'Documentation language')

  mark.className = 'translation-toggle__mark'
  mark.setAttribute('aria-hidden', 'true')
  mark.textContent = '文'

  button.type = 'button'
  button.className = 'translation-toggle__button'
  button.textContent = isTranslationProxy ? 'English' : '中文'
  button.title = isTranslationProxy
    ? 'Return to the original English documentation'
    : 'Translate this documentation page into Chinese'
  button.setAttribute('aria-label', button.title)

  if (!canTranslate) {
    control.classList.add('is-unavailable')
    button.disabled = true
    button.title = 'Chinese translation is available on the published documentation site'
    button.setAttribute('aria-label', button.title)
  } else {
    button.addEventListener('click', () => {
      if (isTranslationProxy) {
        window.location.assign(sourceUrl)
        return
      }

      const translatedUrl = `https://translate.google.com/translate?sl=en&tl=zh-CN&u=${encodeURIComponent(sourceUrl)}`
      window.location.assign(translatedUrl)
    })
  }

  control.append(mark, button)
  document.body.append(control)
})()
