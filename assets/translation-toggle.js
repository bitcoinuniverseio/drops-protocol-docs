(() => {
  const translationHostSuffix = '.translate.goog'
  const currentUrl = new URL(window.location.href)
  const isTranslationProxy = currentUrl.hostname.endsWith(translationHostSuffix)

  function sourceUrlFromProxy() {
    if (!isTranslationProxy) return currentUrl.href

    const proxiedHost = currentUrl.hostname.slice(0, -translationHostSuffix.length)
    const source = new URL('https://' + proxiedHost.replace(/-/g, '.') + currentUrl.pathname + currentUrl.hash)
    for (const [key, value] of currentUrl.searchParams) {
      if (!key.startsWith('_x_tr_')) source.searchParams.append(key, value)
    }
    return source.href
  }

  function inferProduct() {
    const path = window.location.pathname.toLowerCase()
    if (path.includes('op-drop')) return 'opdrop'
    if (path.includes('pact') || path.includes('studio') || path.includes('agreement') || path.includes('artifact')) return 'pacts'
    return 'drops'
  }

  function installSkipLink() {
    const main = document.querySelector('main')
    if (!main) return
    if (!main.id) main.id = 'main-content'
    if (document.querySelector('.skip-link')) return

    const skip = document.createElement('a')
    skip.className = 'skip-link'
    skip.href = '#' + main.id
    skip.textContent = 'Skip to content'
    document.body.prepend(skip)
  }

  function markActiveNavigation() {
    const page = window.location.pathname.split('/').filter(Boolean).pop() || 'index.html'
    for (const link of document.querySelectorAll('header a[href]')) {
      const target = link.getAttribute('href')
      if (!target || target.startsWith('http') || target.startsWith('#')) continue
      const normalized = target.split('#')[0].split('?')[0].replace(/^\.\//, '') || 'index.html'
      if (normalized === page || (page === '' && normalized === 'index.html')) {
        link.setAttribute('aria-current', 'page')
      }
    }
  }

  function installMobileNavigation() {
    const header = document.querySelector('.topbar, .page-nav')
    if (!header) return
    const nav = header.querySelector('nav')
    if (!nav || header.querySelector('.luxe-menu-toggle')) return

    if (!nav.id) nav.id = 'docs-navigation'
    header.classList.add('is-luxe-nav')
    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = 'luxe-menu-toggle'
    toggle.setAttribute('aria-label', 'Open documentation menu')
    toggle.setAttribute('aria-controls', nav.id)
    toggle.setAttribute('aria-expanded', 'false')
    toggle.innerHTML = '<span class="luxe-menu-toggle__lines" aria-hidden="true"></span>'

    const cta = header.querySelector('.button-small, .page-button')
    if (cta && !nav.querySelector('.luxe-mobile-cta')) {
      const mobileCta = cta.cloneNode(true)
      mobileCta.classList.remove('button-small')
      mobileCta.classList.add('luxe-mobile-cta')
      nav.append(mobileCta)
    }

    function closeMenu() {
      header.classList.remove('is-nav-open')
      toggle.setAttribute('aria-expanded', 'false')
      toggle.setAttribute('aria-label', 'Open documentation menu')
    }

    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('is-nav-open')
      toggle.setAttribute('aria-expanded', String(open))
      toggle.setAttribute('aria-label', open ? 'Close documentation menu' : 'Open documentation menu')
    })

    nav.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu()
    })

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeMenu()
        toggle.focus()
      }
    })

    document.addEventListener('click', event => {
      if (!header.contains(event.target)) closeMenu()
    })

    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) closeMenu()
    })

    header.insertBefore(toggle, cta || null)
  }

  function installImageHints() {
    for (const image of document.images) {
      image.decoding = 'async'
      const hero = image.closest('.hero, .page-hero, .reference-hero')
      if (hero) {
        image.loading = 'eager'
        image.fetchPriority = 'high'
      } else if (!image.hasAttribute('loading')) {
        image.loading = 'lazy'
      }
    }
  }

  function installCopyFeedback() {
    let status = document.querySelector('[data-copy-status]')
    if (!status) {
      status = document.createElement('div')
      status.setAttribute('aria-live', 'polite')
      status.setAttribute('data-copy-status', 'true')
      status.style.position = 'fixed'
      status.style.width = '1px'
      status.style.height = '1px'
      status.style.overflow = 'hidden'
      status.style.clipPath = 'inset(50%)'
      document.body.append(status)
    }

    document.addEventListener('click', async event => {
      const button = event.target.closest('[data-copy]')
      if (!button || button.dataset.copyManaged === 'true') return
      const target = document.querySelector(button.dataset.copy)
      if (!target || !navigator.clipboard) return

      try {
        await navigator.clipboard.writeText(target.textContent.trim())
        const label = button.dataset.copyLabel || button.textContent
        button.dataset.copyLabel = label
        button.textContent = 'Copied'
        status.textContent = 'Code copied to clipboard'
        window.setTimeout(() => { button.textContent = label }, 1400)
      } catch {
        status.textContent = 'Copy was unavailable. Select the code manually.'
      }
    })
  }

  function installTranslationToggle() {
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
    mark.textContent = '\u6587'

    button.type = 'button'
    button.className = 'translation-toggle__button'
    button.textContent = isTranslationProxy ? 'English' : '\u4e2d\u6587'
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

        const translatedUrl = 'https://translate.google.com/translate?sl=en&tl=zh-CN&u=' + encodeURIComponent(sourceUrl)
        window.location.assign(translatedUrl)
      })
    }

    control.append(mark, button)
    document.body.append(control)
  }

  document.body.dataset.luxeProduct = inferProduct()
  installSkipLink()
  markActiveNavigation()
  installMobileNavigation()
  installImageHints()
  installCopyFeedback()
  installTranslationToggle()
  requestAnimationFrame(() => { document.body.dataset.luxeReady = 'true' })
})()
