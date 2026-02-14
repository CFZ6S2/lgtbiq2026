const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : {
  initData: 'demo_init_data',
  themeParams: {},
  expand() {},
  MainButton: { setText() {}, show() {}, onClick() {} },
  onEvent() {},
  sendData() {},
  close() {},
}

// Función auxiliar para obtener initData de forma segura
function getInitData() { return tg.initData || 'demo_init_data' }

function applyTheme() {
  if (!tg) return
  const theme = tg.themeParams || {}
  const root = document.documentElement
  if (theme.bg_color) root.style.setProperty('--bg', theme.bg_color)
  if (theme.text_color) root.style.setProperty('--fg', theme.text_color)
  if (theme.hint_color) root.style.setProperty('--border', theme.hint_color)
  if (theme.button_color) root.style.setProperty('--btnBg', theme.button_color)
  if (theme.link_color) { root.style.setProperty('--link', theme.link_color); root.style.setProperty('--accent', theme.link_color) }
}

function init() {
  applyTheme()
  const landing = document.getElementById('landing')
  const register = document.getElementById('register')
  const appMain = document.getElementById('appMain')
  const tabs = document.getElementById('tabs')
  const ctaRegister = document.getElementById('ctaRegister')
  const ctaExplore = document.getElementById('ctaExplore')
  const regForm = document.getElementById('register-form')
  function showSection(name) {
    if (name === 'landing') {
      landing.hidden = false; register.hidden = true; appMain.hidden = true; tabs.hidden = true
      return
    }
    if (name === 'register') {
      landing.hidden = true; register.hidden = false; appMain.hidden = true; tabs.hidden = true
      try { document.getElementById('regDisplayName').focus() } catch {}
      return
    }
    landing.hidden = true; register.hidden = true; appMain.hidden = false; tabs.hidden = false
    const ids = ['profile-form','discover','chat','map','support','moderation']
    for (const id of ids) {
      const el = document.getElementById(id)
      if (!el) continue
      if (id === (name === 'profile' ? 'profile-form' : name)) el.hidden = false
      else el.hidden = true
    }
  }
  const path = (window.location && window.location.pathname) || '/'
  const routeMap = { '/landing': 'landing', '/register': 'register', '/profile': 'profile', '/discover': 'discover', '/chat': 'chat', '/map': 'map', '/support': 'support', '/moderation': 'moderation' }
  const initial = routeMap[path] || 'landing'
  showSection(initial)
  if (initial === 'discover') { try { loadFeed(document.getElementById('feed')) } catch {} }
  if (initial === 'chat') { try { openChatSSE() } catch {} }
  ctaRegister?.addEventListener('click', () => showSection('register'))
  ctaExplore?.addEventListener('click', () => { showSection('discover'); loadFeed(document.getElementById('feed')); closeChatSSE() })
  let chatES = null
  function openChatSSE() {
    if (chatES) return
    chatES = subscribeChat(chatLog)
  }
  function closeChatSSE() {
    try { chatES?.close() } catch {}
    chatES = null
  }
  tabs?.querySelectorAll('button[data-section]')?.forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.dataset.section
      showSection(sec)
      if (sec === 'discover') loadFeed(feed)
      if (sec === 'chat') openChatSSE()
      else closeChatSSE()
    })
  })
  const sendCodeBtn = document.getElementById('registerSendCode')
  const registerVerifyBtn = document.getElementById('registerVerify')
  sendCodeBtn?.addEventListener('click', async () => {
    const email = (document.getElementById('regEmail')?.value || '').trim()
    if (!email) return
    try {
      const r = await fetch('/api/auth/register-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const j = await r.json()
      if (j.ok) alert('Código enviado (demo: ' + j.code + ')')
    } catch {}
  })
  registerVerifyBtn?.addEventListener('click', async () => {
    const email = (document.getElementById('regEmail')?.value || '').trim()
    const code = (document.getElementById('regCode')?.value || '').trim()
    const displayName = document.getElementById('regDisplayName').value.trim() || 'Usuario'
    const username = document.getElementById('regUsername').value.trim() || undefined
    if (!email || !code) return
    try {
      const r = await fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code, displayName, username }) })
      const j = await r.json()
      if (j.ok && j.userId) {
        window.localStorage.setItem('userId', j.userId)
        alert('Correo verificado. Ahora completa tu perfil.')
        showSection('profile')
      }
    } catch {}
  })
  regForm?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const displayName = document.getElementById('regDisplayName').value.trim()
    const username = document.getElementById('regUsername').value.trim()
    const city = document.getElementById('regCity').value.trim()
    if (!displayName) return
    const payload = {
      profile: {
        displayName,
        username,
        userId: window.localStorage.getItem('userId') || undefined,
        location: { city },
        privacy: { profileVisible: true, incognito: false, hideDistance: false, mapConsent: true },
        themeAccent: (document.getElementById('themeAccent')?.value || '').trim() || undefined,
      }
    }
    try {
      await fetch('/api/sendData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      showSection('profile')
      closeChatSSE()
    } catch {}
  })
  const form = document.getElementById('profile-form')
  const submitBtn = document.getElementById('submitBtn')
  const feed = document.getElementById('feed')
  const chatLog = document.getElementById('chat-log')
  const chatInput = document.getElementById('chat-input')
  const typingEl = document.getElementById('typing')
  const chatSend = document.getElementById('chat-send')
  const chatFile = document.getElementById('chat-file')
  const chatSendFile = document.getElementById('chat-send-file')
  const scrollBottomBtn = document.getElementById('scroll-bottom')
  const matchesEl = document.getElementById('matches')
  let matchesCursor = null
  const filterOrientations = document.getElementById('filterOrientations')
  const filterFriends = document.getElementById('filterFriends')
  const filterRomance = document.getElementById('filterRomance')
  const filterPoly = document.getElementById('filterPoly')
  const applyFilters = document.getElementById('applyFilters')
  const maxDistanceKm = document.getElementById('maxDistanceKm')
  const filterVerified = document.getElementById('filterVerified')
  const filterCity = document.getElementById('filterCity')
  const incognitoToggle = document.getElementById('incognito')
  const incognitoNote = document.getElementById('incognitoNote')
  const incognitoChatNote = document.getElementById('incognitoChatNote')
  const moderation = document.getElementById('moderation')
  const verifyUserId = document.getElementById('verifyUserId')
  const verifyBtn = document.getElementById('verifyBtn')
  const blockerUserId = document.getElementById('blockerUserId')
  const blockedUserId = document.getElementById('blockedUserId')
  const blockBtn = document.getElementById('blockBtn')
  const reloadReports = document.getElementById('reloadReports')
  const modReports = document.getElementById('mod-reports')
  const exportDataBtn = document.getElementById('exportDataBtn')
  const deleteAccountBtn = document.getElementById('deleteAccountBtn')
  let currentChatUserId = null
  if (tg) {
    tg.expand()
    tg.MainButton.setText('Enviar a Telegram')
    tg.MainButton.show()
    tg.onEvent('themeChanged', applyTheme)
    submitBtn.style.display = 'none'
    loadMatches(matchesEl, (peerId) => {
      currentChatUserId = peerId
      window.currentChatUserId = peerId
      chatLog.innerHTML = ''
      chatInput.value = ''
      try { chatInput.focus() } catch {}
      loadChatHistory(peerId, chatLog)
    })
    loadOrientations(filterOrientations)
    applyFilters?.addEventListener('click', () => {
      const selected = Array.from(filterOrientations.selectedOptions).map(o => o.value)
      const intentsFriends = !!filterFriends.checked
      const intentsRomance = !!filterRomance.checked
      const intentsPoly = !!filterPoly.checked
      const md = maxDistanceKm.value ? Number(maxDistanceKm.value) : undefined
      const onlyVerified = !!filterVerified.checked
      const city = (filterCity.value || '').trim() || undefined
    const partnerPreference = document.getElementById('filterPartnerPref')?.value || undefined
    loadFeed(feed, { filterOrientations: selected, intentsFriends, intentsRomance, intentsPoly, maxDistanceKm: md, onlyVerified, city, partnerPreference })
    })
    incognitoToggle?.addEventListener('change', async () => {
      try {
        await fetch('/api/privacy/incognito', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: getInitData(), incognito: !!incognitoToggle.checked }),
        })
        if (incognitoNote) incognitoNote.hidden = !incognitoToggle.checked
        if (incognitoChatNote) incognitoChatNote.hidden = !incognitoToggle.checked
        document.querySelectorAll('[data-like-btn="true"]').forEach(btn => {
          btn.disabled = !!incognitoToggle.checked
          if (incognitoToggle.checked) btn.title = 'Modo incógnito activo'
          else btn.removeAttribute('title')
        })
      } catch {}
    })
    if (incognitoNote) incognitoNote.hidden = !incognitoToggle?.checked
    if (incognitoChatNote) incognitoChatNote.hidden = !incognitoToggle?.checked
    exportDataBtn?.addEventListener('click', async () => {
      try {
        const resp = await fetch('/api/me/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: getInitData() }),
        })
        const json = await resp.json()
        if (!json.ok) return
        const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'mis-datos.json'
        document.body.appendChild(a)
        a.click()
        URL.revokeObjectURL(url)
        a.remove()
      } catch {}
    })
    deleteAccountBtn?.addEventListener('click', async () => {
      const ok = window.confirm('¿Eliminar tu cuenta? Esta acción es irreversible.')
      if (!ok) return
      try {
        const resp = await fetch('/api/me/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: getInitData() }),
        })
        const json = await resp.json()
        if (!json.ok) return
        const main = document.querySelector('main')
        const bye = document.getElementById('goodbye')
        if (main && bye) {
          main.hidden = true
          bye.hidden = false
          try {
            bye.focus()
          } catch {}
        } else {
          alert('Cuenta eliminada')
        }
      } catch {}
    })
    chatSend?.addEventListener('click', async () => {
      if (!currentChatUserId) return
      const content = chatInput.value.trim()
      if (!content) return
      try {
        const resp = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: getInitData(), toUserId: currentChatUserId, content }),
        })
        const json = await resp.json()
        const div = document.createElement('div')
        div.className = 'msg out'
        div.textContent = content
        if (json.id) div.dataset.mid = json.id
        div.dataset.dir = 'out'
        const status = document.createElement('span')
        status.className = 'msg-status'
        status.dataset.role = 'status'
        status.textContent = '✓'
        status.setAttribute('aria-label', 'Entregado')
        const time = document.createElement('span')
        time.className = 'msg-time'
        try {
          time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } catch { time.textContent = '' }
        div.appendChild(status)
        div.appendChild(time)
        chatLog.appendChild(div)
        if (scrollBottomBtn) scrollBottomBtn.style.display = 'none'
        chatLog.scrollTop = chatLog.scrollHeight
        chatInput.value = ''
        fetch('/api/chat/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: getInitData(), peerUserId: currentChatUserId, active: false }),
        }).catch(() => {})
        setupReadObserver(currentChatUserId, chatLog)
      } catch {}
    })
    chatSendFile?.addEventListener('click', async () => {
      if (!currentChatUserId) return
      const f = chatFile.files && chatFile.files[0]
      if (!f) return
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const dataUrl = reader.result
          const resp = await fetch('/api/chat/send-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: getInitData(), toUserId: currentChatUserId, media: { data: dataUrl, mime: f.type }, caption: f.name }),
          })
          const json = await resp.json()
          const div = document.createElement('div')
          div.className = 'msg out'
          div.dataset.mid = json.id || ''
          div.dataset.dir = 'out'
          if (f.type.startsWith('image/')) {
            const img = document.createElement('img')
            img.src = json.mediaUrl
            img.alt = f.name
            img.style.maxWidth = '100%'
            div.appendChild(img)
          } else if (f.type.startsWith('audio/')) {
            const audio = document.createElement('audio')
            audio.src = json.mediaUrl
            audio.controls = true
            div.appendChild(audio)
          }
          const status = document.createElement('span')
          status.className = 'msg-status'
          status.dataset.role = 'status'
          status.textContent = '✓'
          status.setAttribute('aria-label', 'Entregado')
          const time = document.createElement('span')
          time.className = 'msg-time'
          try {
            time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          } catch { time.textContent = '' }
          div.appendChild(status)
          div.appendChild(time)
          chatLog.appendChild(div)
          if (scrollBottomBtn) scrollBottomBtn.style.display = 'none'
          chatLog.scrollTop = chatLog.scrollHeight
          chatFile.value = ''
          setupReadObserver(currentChatUserId, chatLog)
        } catch {}
      }
      reader.readAsDataURL(f)
    })
    initModeration()
    const useLocation = document.getElementById('useLocation')
    useLocation?.addEventListener('click', () => {
      if (!navigator.geolocation) return
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords
        document.getElementById('latitude').value = String(latitude)
        document.getElementById('longitude').value = String(longitude)
      })
    })
    const matchesMoreBtn = document.getElementById('matches-load-more') || (() => {
      const btn = document.createElement('button')
      btn.id = 'matches-load-more'
      btn.textContent = 'Cargar más'
      btn.style.marginTop = '8px'
      btn.style.display = 'none'
      matchesEl.parentElement?.appendChild(btn)
      return btn
    })()
    matchesMoreBtn.addEventListener('click', () => {
      if (!matchesCursor) return
      loadMatches(matchesEl, (peerId) => {
        currentChatUserId = peerId
        window.currentChatUserId = peerId
        chatLog.innerHTML = ''
        chatInput.value = ''
        try { chatInput.focus() } catch {}
        loadChatHistory(peerId, chatLog)
      }, { beforeCreatedAt: matchesCursor })
    })
    chatLog.addEventListener('scroll', () => {
      const near = (chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight) < 40
      scrollBottomBtn.style.display = near ? 'none' : 'inline-block'
    })
    scrollBottomBtn?.addEventListener('click', () => {
      chatLog.scrollTop = chatLog.scrollHeight
      scrollBottomBtn.style.display = 'none'
    })
    const mapBtn = document.getElementById('mapBtn') || (() => {
      const btn = document.createElement('button')
      btn.id = 'mapBtn'
      btn.textContent = '🗺️ Mapa (Premium)'
      btn.style.marginTop = '8px'
      document.querySelector('main')?.appendChild(btn)
      return btn
    })()
    mapBtn.addEventListener('click', async () => {
      try {
        const r = await fetch(`/api/map/nearby?initData=${encodeURIComponent(getInitData())}`)
        if (r.status === 404 || r.status === 501) { alert('Mapa: coming soon'); return }
        if (r.status === 409) {
          const ok = window.confirm('Permitir usar tu ubicación.\nPara mostrar el mapa necesitas habilitar ubicación y aceptar compartir una ubicación aproximada. Puedes cambiarlo cuando quieras.\n\n¿Continuar?')
          if (!ok) return
          try {
            await fetch('/api/map/consent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ initData: getInitData(), consent: true }),
            })
          } catch {}
          if (!navigator.geolocation) return
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords
            try {
              await fetch('/api/map/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: getInitData(), lat: latitude, lon: longitude }),
              })
            } catch {}
            const r2 = await fetch(`/api/map/nearby?initData=${encodeURIComponent(getInitData())}&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&radiusKm=5`)
            const j2 = await r2.json()
            if (j2.ok) renderMap(j2.locations || [], { lat: latitude, lon: longitude })
          })
          return
        }
        if (r.status === 402) {
          const j = await r.json().catch(() => ({}))
          alert((j && j.message) || 'Mapa disponible con Premium')
          return
        }
        const j = await r.json()
        if (!j.ok) { alert('No disponible'); return }
        renderMap(j.locations || [], null)
      } catch {}
    })
  }

function renderMap(locations, center) {
  const el = document.getElementById('map')
  if (!el) return
  const map = L.map(el)
  const c = center ? [center.lat, center.lon] : (locations[0] ? [locations[0].latApprox, locations[0].lngApprox] : [0, 0])
  map.setView(c, 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map)
  for (const loc of locations) {
    if (typeof loc.latApprox !== 'number' || typeof loc.lngApprox !== 'number') continue
    const m = L.marker([loc.latApprox, loc.lngApprox])
    m.addTo(map).bindPopup((loc.displayName || 'Usuario') + (loc.city ? ` - ${loc.city}` : ''))
  }
}

  const themeAccentInput = document.getElementById('themeAccent')
  themeAccentInput?.addEventListener('input', () => {
    const val = (themeAccentInput.value || '').trim()
    if (!val) return
    const root = document.documentElement
    root.style.setProperty('--accent', val)
    root.style.setProperty('--link', val)
  })

let readObserver = null
let observedElId = null
function markReadUpTo(peerId, messageId) {
  return fetch('/api/chat/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: getInitData(), peerUserId: peerId, upToMessageId: messageId }),
  }).then(() => {}).catch(() => {})
}
function setupReadObserver(peerId, logEl) {
  const items = Array.from(logEl.querySelectorAll('[data-dir=\"in\"]'))
  if (!items.length) return
  const last = items[items.length - 1]
  const id = last.dataset.mid
  if (observedElId === id) return
  if (readObserver) readObserver.disconnect()
  observedElId = id
  readObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        markReadUpTo(peerId, id).then(() => {
          const st = last.querySelector('[data-role=\"status\"]')
          if (st) { st.textContent = '✓✓'; st.classList.add('read') }
        })
        readObserver.disconnect()
        observedElId = null
      }
    }
  }, { root: logEl, threshold: 0.95 })
  readObserver.observe(last)
}

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const data = collectData()
    if (tg) {
      const payload = {
        initData: getInitData(),
        profile: data,
      }
      try {
        await fetch('/api/sendData', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } catch (err) {
        console.error(err)
      }
      tg.sendData(JSON.stringify(data))
      tg.close()
      return
    }
    try {
      await fetch('/api/sendData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      alert('Datos enviados')
    } catch (err) {
      alert('Error al enviar')
    }
  })

  if (tg) {
    tg.MainButton.onClick(() => {
      const data = collectData()
      const payload = {
        initData: getInitData(),
        profile: data,
      }
      fetch('/api/sendData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(console.error)
      tg.sendData(JSON.stringify(data))
      tg.close()
    })
  }
  let typingTimer = null
  chatInput.addEventListener('input', () => {
    if (!tg || !window.currentChatUserId) return
    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData(), peerUserId: window.currentChatUserId, active: true }),
    }).catch(() => {})
    if (typingTimer) clearTimeout(typingTimer)
    typingTimer = setTimeout(() => {
      fetch('/api/chat/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData(), peerUserId: window.currentChatUserId, active: false }),
      }).catch(() => {})
    }, 2000)
  })
  chatInput.addEventListener('blur', () => {
    if (!tg || !window.currentChatUserId) return
    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData(), peerUserId: window.currentChatUserId, active: false }),
    }).catch(() => {})
  })
}

async function loadMatches(container, onOpenChat, opts) {
  try {
    container.setAttribute('aria-busy', 'true')
    const resp = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData(), limit: 20, beforeCreatedAt: opts?.beforeCreatedAt }),
    })
    const json = await resp.json()
    if (!json.ok) return
    if (!opts?.beforeCreatedAt) container.innerHTML = ''
    if (json.paused) {
      const info = document.createElement('div')
      info.textContent = 'Estás en modo incógnito: no se crearán nuevos matches.'
      info.style.opacity = '0.8'
      info.setAttribute('role', 'note')
      container.appendChild(info)
    }
    for (const m of json.matches) {
      const row = document.createElement('div')
      row.setAttribute('role', 'listitem')
      row.style.display = 'flex'
      row.style.alignItems = 'center'
      row.style.justifyContent = 'space-between'
      row.style.border = '1px solid var(--border, #333)'
      row.style.borderRadius = '10px'
      row.style.padding = '8px'
      row.style.marginBottom = '6px'
      const left = document.createElement('div')
      left.textContent = m.displayName || m.username || 'Usuario'
      const right = document.createElement('div')
      const openBtn = document.createElement('button')
      openBtn.textContent = 'Abrir chat'
      openBtn.onclick = () => onOpenChat(m.userId)
      right.appendChild(openBtn)
      row.appendChild(left)
      row.appendChild(right)
      container.appendChild(row)
    }
    matchesCursor = json.nextCursor || null
    const btn = document.getElementById('matches-load-more')
    if (btn) btn.style.display = json.nextCursor ? 'inline-block' : 'none'
    container.removeAttribute('aria-busy')
  } catch {}
}

async function initModeration() {
  try {
    const resp = await fetch(`/api/mod/reports?initData=${encodeURIComponent(getInitData())}`)
    const json = await resp.json()
    if (!json.ok) {
      document.getElementById('moderation').hidden = true
      return
    }
    document.getElementById('moderation').hidden = false
    renderReports(json.reports || [])
    verifyBtn?.addEventListener('click', async () => {
      const userId = verifyUserId.value.trim()
      if (!userId) return
      await fetch('/api/mod/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData(), userId }),
      })
      reloadReports.click()
    })
    blockBtn?.addEventListener('click', async () => {
      const blocker = blockerUserId.value.trim()
      const blocked = blockedUserId.value.trim()
      if (!blocker || !blocked) return
      await fetch('/api/mod/block-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData(), blockerUserId: blocker, blockedUserId: blocked }),
      })
      reloadReports.click()
    })
    reloadReports?.addEventListener('click', async () => {
      const r = await fetch(`/api/mod/reports?initData=${encodeURIComponent(getInitData())}`)
      const j = await r.json()
      if (j.ok) renderReports(j.reports || [])
    })
  } catch {
    document.getElementById('moderation').hidden = true
  }
}

function renderReports(items) {
  modReports.innerHTML = ''
  for (const it of items) {
    const div = document.createElement('div')
    div.style.border = '1px solid var(--border, #333)'
    div.style.borderRadius = '10px'
    div.style.padding = '8px'
    div.style.marginBottom = '6px'
    const a = it.reporter?.displayName || it.reporter?.username || 'Usuario'
    const b = it.reported?.displayName || it.reported?.username || 'Usuario'
    const reason = it.reason || ''
    div.textContent = `${a} reportó a ${b}: ${reason}`
    modReports.appendChild(div)
  }
}
async function loadChatHistory(peerId, logEl) {
  try {
    logEl.setAttribute('aria-busy', 'true')
    const resp = await fetch('/api/chat/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData(), peerUserId: peerId }),
    })
    const json = await resp.json()
    if (!json.ok) return
    logEl.innerHTML = ''
    let lastIncoming = null
    let earliest = null
    for (const msg of json.messages) {
      const div = document.createElement('div')
      div.className = `msg ${(msg.senderId === peerId) ? 'in' : 'out'}`
    if (msg.mediaUrl && msg.messageType === 'IMAGE') {
      const img = document.createElement('img')
      img.src = msg.mediaUrl
      img.alt = msg.content || ''
      img.style.maxWidth = '100%'
      div.appendChild(img)
    } else if (msg.mediaUrl && msg.messageType === 'AUDIO') {
      const audio = document.createElement('audio')
      audio.src = msg.mediaUrl
      audio.controls = true
      div.appendChild(audio)
    } else {
      div.textContent = msg.content
    }
      div.dataset.mid = msg.id
      div.dataset.createdAt = msg.createdAt
    div.dataset.dir = (msg.senderId === peerId) ? 'in' : 'out'
      const status = document.createElement('span')
      status.className = 'msg-status'
      status.dataset.role = 'status'
      if (msg.readAt) {
        status.textContent = '✓✓'
        status.classList.add('read')
      } else if (msg.deliveredAt) {
        status.textContent = '✓✓'
      } else {
        status.textContent = '✓'
      }
      div.appendChild(status)
      const time = document.createElement('span')
      time.className = 'msg-time'
      try {
        time.textContent = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } catch { time.textContent = '' }
      div.appendChild(time)
      logEl.appendChild(div)
      earliest = earliest || msg.createdAt
      if (msg.senderId && msg.senderId !== msg.recipientId) {
        lastIncoming = msg.senderId === (window.currentChatUserId || null) ? msg.id : lastIncoming
      }
    }
    if (earliest) {
      window.chatEarliest = window.chatEarliest || {}
      window.chatEarliest[peerId] = earliest
    }
    if (lastIncoming) {
      await fetch('/api/chat/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData(), peerUserId: window.currentChatUserId, upToMessageId: lastIncoming }),
      }).catch(() => {})
    }
    logEl.removeAttribute('aria-busy')
  } catch {}
}
async function loadOlderHistory(peerId, logEl) {
  const earliest = window.chatEarliest && window.chatEarliest[peerId]
  if (!earliest) return
  try {
    logEl.setAttribute('aria-busy', 'true')
    const resp = await fetch('/api/chat/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData(), peerUserId: peerId, beforeCreatedAt: earliest, limit: 50 }),
    })
    const json = await resp.json()
    if (!json.ok) return
    let newEarliest = earliest
    const frags = document.createDocumentFragment()
    for (const msg of json.messages) {
      const div = document.createElement('div')
      div.className = `msg ${(msg.senderId === peerId) ? 'in' : 'out'}`
      div.textContent = msg.content
      div.dataset.mid = msg.id
      div.dataset.createdAt = msg.createdAt
      div.dataset.dir = (msg.senderId === peerId) ? 'in' : 'out'
      const status = document.createElement('span')
      status.className = 'msg-status'
      status.dataset.role = 'status'
      if (msg.readAt) {
        status.textContent = '✓✓'
        status.classList.add('read')
      } else if (msg.deliveredAt) {
        status.textContent = '✓✓'
      } else {
        status.textContent = '✓'
      }
      div.appendChild(status)
      const time = document.createElement('span')
      time.className = 'msg-time'
      try {
        time.textContent = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } catch { time.textContent = '' }
      div.appendChild(time)
      frags.appendChild(div)
      newEarliest = msg.createdAt
    }
    logEl.insertBefore(frags, logEl.firstChild)
    window.chatEarliest[peerId] = newEarliest
    logEl.removeAttribute('aria-busy')
  } catch {}
}
async function loadFeed(feedEl, filters) {
  try {
    const resp = await fetch('/api/recs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData(), ...(filters || {}) }),
    })
    const json = await resp.json()
    if (!json.ok) return
    renderFeed(feedEl, json.recs || [])
  } catch (err) {
    console.error(err)
  }
}

async function loadOrientations(selectEl) {
  try {
    const resp = await fetch('/api/orientations')
    const json = await resp.json()
    if (!json.ok) return
    selectEl.innerHTML = ''
    for (const name of json.orientations) {
      const opt = document.createElement('option')
      opt.value = name
      opt.textContent = name
      selectEl.appendChild(opt)
    }
  } catch {}
}

function renderFeed(feedEl, recs) {
  feedEl.innerHTML = ''
  feedEl.setAttribute('aria-busy', 'true')
  for (const r of recs) {
    const card = document.createElement('div')
    card.setAttribute('role', 'listitem')
    card.style.border = '1px solid var(--border, #333)'
    card.style.borderRadius = '10px'
    card.style.padding = '10px'
    card.style.marginBottom = '8px'
    const title = document.createElement('div')
    title.textContent = r.displayName || r.username || 'Usuario'
    title.style.fontWeight = '600'
    const meta = document.createElement('div')
    meta.textContent = [r.pronouns, r.gender].filter(Boolean).join(' · ')
    const orients = document.createElement('div')
    orients.textContent = (r.orientations || []).join(', ')
    orients.style.opacity = '0.8'
    const distance = document.createElement('div')
    if (typeof r.distanceKm === 'number') {
      distance.textContent = `Distancia: ${r.distanceKm} km`
      distance.style.opacity = '0.8'
    }
    const likeBtn = document.createElement('button')
    likeBtn.textContent = 'Me gusta'
    likeBtn.setAttribute('aria-label', `Me gusta a ${title.textContent}`)
    likeBtn.dataset.likeBtn = 'true'
    const incT = document.getElementById('incognito')
    if (incT && incT.checked) {
      likeBtn.disabled = true
      likeBtn.title = 'Modo incógnito activo'
    }
    likeBtn.onclick = () => sendLike(r.id, likeBtn)
    const chatBtn = document.createElement('button')
    chatBtn.textContent = 'Chat'
    chatBtn.style.marginLeft = '8px'
    chatBtn.setAttribute('aria-label', `Chatear con ${title.textContent}`)
    chatBtn.onclick = () => {
      currentChatUserId = r.id
      window.currentChatUserId = r.id
      chatLog.innerHTML = ''
      chatInput.value = ''
    }
    card.appendChild(title)
    card.appendChild(meta)
    card.appendChild(orients)
    if (distance.textContent) card.appendChild(distance)
    card.appendChild(likeBtn)
    card.appendChild(chatBtn)
    feedEl.appendChild(card)
  }
  feedEl.removeAttribute('aria-busy')
}

async function sendLike(toUserId, btn) {
  btn.disabled = true
  try {
    const resp = await fetch('/api/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData(), toUserId }),
    })
    const json = await resp.json()
    if (json.matched) {
      btn.textContent = '¡Match!'
    } else {
      btn.textContent = 'Enviado'
    }
  } catch (err) {
    btn.textContent = 'Error'
  }
}

function subscribeChat(chatEl) {
  let es
  let retry = 500
  const connect = () => {
    if (!getInitData()) {
      console.warn('tg.initData no está disponible, esperando...')
      setTimeout(connect, retry)
      return
    }
    es = new EventSource(`/api/chat/subscribe?initData=${encodeURIComponent(getInitData())}`)
    es.addEventListener('message', (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (window.currentChatUserId && data.fromId !== window.currentChatUserId) return
        const div = document.createElement('div')
        div.className = 'msg in'
        if (data.mediaUrl && data.messageType === 'IMAGE') {
          const img = document.createElement('img')
          img.src = data.mediaUrl
          img.alt = data.content || ''
          img.style.maxWidth = '100%'
          div.appendChild(img)
        } else if (data.mediaUrl && data.messageType === 'AUDIO') {
          const audio = document.createElement('audio')
          audio.src = data.mediaUrl
          audio.controls = true
          div.appendChild(audio)
        } else {
          div.textContent = data.content
        }
        div.dataset.mid = data.id
        div.dataset.dir = 'in'
        const status = document.createElement('span')
        status.className = 'msg-status'
        status.dataset.role = 'status'
        status.textContent = '✓✓'
        status.setAttribute('aria-label', 'Leído')
        const time = document.createElement('span')
        time.className = 'msg-time'
        try {
          time.textContent = new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } catch { time.textContent = '' }
        div.appendChild(status)
        div.appendChild(time)
        chatEl.appendChild(div)
        const near = (chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight) < 40
        const btn = document.getElementById('scroll-bottom')
        if (near) {
          chatEl.scrollTop = chatEl.scrollHeight
          if (btn) btn.style.display = 'none'
        } else {
          if (btn) btn.style.display = 'inline-block'
        }
        setupReadObserver(data.fromId, chatEl)
      } catch {}
    })
    es.addEventListener('typing', (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data.active) {
          typingEl.textContent = 'Escribiendo...'
        } else {
          typingEl.textContent = ''
        }
      } catch {}
    })
    es.addEventListener('receipt:update', (ev) => {
      try {
        const data = JSON.parse(ev.data)
        const el = chatEl.querySelector(`[data-mid=\"${data.id}\"]`)
        if (!el) return
        const st = el.querySelector('[data-role=\"status\"]') || document.createElement('span')
        st.className = 'msg-status'
        st.dataset.role = 'status'
        if (!el.contains(st)) el.appendChild(st)
        if (data.readAt) {
          st.textContent = '✓✓'
          st.classList.add('read')
        } else if (data.deliveredAt) {
          st.textContent = '✓✓'
        }
      } catch {}
    })
    es.onerror = () => {
      es.close()
      setTimeout(connect, retry)
      retry = Math.min(retry * 2, 8000)
    }
  }
  connect()
  return es
}

function collectData() {
  const orient = Array.from(document.getElementById('orientation').selectedOptions).map(o => o.value)
  return {
    displayName: document.getElementById('displayName').value,
    username: document.getElementById('username').value,
    pronouns: document.getElementById('pronouns').value,
    gender: document.getElementById('gender').value,
    genderCustom: document.getElementById('genderCustom').value,
    location: {
      city: document.getElementById('city').value,
      latitude: Number(document.getElementById('latitude').value || NaN),
      longitude: Number(document.getElementById('longitude').value || NaN),
    },
    orientation: orient,
    privacy: {
      incognito: document.getElementById('incognito').checked,
      hideDistance: document.getElementById('hideDistance').checked,
      profileVisible: document.getElementById('profileVisible').checked,
    },
    intents: {
      lookingFriends: document.getElementById('lookingFriends').checked,
      lookingRomance: document.getElementById('lookingRomance').checked,
      lookingPoly: document.getElementById('lookingPoly').checked,
      transInclusive: document.getElementById('transInclusive').checked,
    },
    meta: {
      language: navigator.language,
    },
  }
}

document.addEventListener('DOMContentLoaded', init)
