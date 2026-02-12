import url from 'url'
import fs from 'fs'
import path from 'path'
import { validateInitData } from '../bot/validateInitData.js'
import { prisma } from '../bot/db.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const webRoot = path.join(path.resolve(__dirname, '..'), 'webapp')
const docsRoot = path.join(path.resolve(__dirname, '..'), 'docs')

const botToken = process.env.BOT_TOKEN || ''
const modAdmins = (process.env.MOD_ADMINS || '').split(',').map(s => s.trim()).filter(Boolean)
const subscribers = new Map()

function sendJSON(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(payload))
}

function isModerator(tgUser) {
  if (!tgUser?.id) return false
  return modAdmins.includes(String(tgUser.id))
}

function haversineKm(a, b) {
  if (!a || !b) return null
  const toRad = d => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad((b.lat ?? 0) - (a.lat ?? 0))
  const dLon = toRad((b.lon ?? 0) - (a.lon ?? 0))
  const lat1 = toRad(a.lat ?? 0)
  const lat2 = toRad(b.lat ?? 0)
  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}

async function handleProfileSubmission(data, user) {
  let upsertUser
  if (user?.id) {
    upsertUser = await prisma.user.upsert({
      where: { telegramId: String(user.id) },
      update: {
        username: user.username || data.username || '',
        displayName: data.displayName,
        language: data.meta?.language || 'es',
      },
      create: {
        telegramId: String(user.id),
        username: user.username || data.username || '',
        displayName: data.displayName,
        language: data.meta?.language || 'es',
      },
    })
  } else if (data.username) {
    upsertUser = await prisma.user.upsert({
      where: { username: data.username },
      update: {
        displayName: data.displayName,
        language: data.meta?.language || 'es',
      },
      create: {
        username: data.username,
        displayName: data.displayName,
        language: data.meta?.language || 'es',
      },
    })
  } else {
    upsertUser = await prisma.user.create({
      data: {
        displayName: data.displayName,
        language: data.meta?.language || 'es',
      },
    })
  }

  const orientationNames = data.orientation || []
  const orientations = await Promise.all(
    orientationNames.map(name =>
      prisma.orientation.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  )

  const profile = await prisma.profile.upsert({
    where: { userId: upsertUser.id },
    update: {
      pronouns: data.pronouns,
      gender: data.gender,
      genderCustom: data.genderCustom,
      intentsFriends: data.intents?.lookingFriends || false,
      intentsRomance: data.intents?.lookingRomance || false,
      intentsPoly: data.intents?.lookingPoly || false,
      transInclusive: data.intents?.transInclusive !== false,
      city: data.location?.city || null,
      latitude: typeof data.location?.latitude === 'number' ? data.location.latitude : null,
      longitude: typeof data.location?.longitude === 'number' ? data.location.longitude : null,
      orientations: { set: orientations.map(o => ({ id: o.id })) },
    },
    create: {
      userId: upsertUser.id,
      pronouns: data.pronouns,
      gender: data.gender,
      genderCustom: data.genderCustom,
      intentsFriends: data.intents?.lookingFriends || false,
      intentsRomance: data.intents?.lookingRomance || false,
      intentsPoly: data.intents?.lookingPoly || false,
      transInclusive: data.intents?.transInclusive !== false,
      city: data.location?.city || null,
      latitude: typeof data.location?.latitude === 'number' ? data.location.latitude : null,
      longitude: typeof data.location?.longitude === 'number' ? data.location.longitude : null,
      orientations: { connect: orientations.map(o => ({ id: o.id })) },
    },
  })

  await prisma.privacySettings.upsert({
    where: { profileId: profile.id },
    update: {
      incognito: data.privacy?.incognito || false,
      hideDistance: data.privacy?.hideDistance || false,
      profileVisible: data.privacy?.profileVisible !== false,
    },
    create: {
      profileId: profile.id,
      incognito: data.privacy?.incognito || false,
      hideDistance: data.privacy?.hideDistance || false,
      profileVisible: data.privacy?.profileVisible !== false,
    },
  })

  return upsertUser
}

async function sendTelegramMessage(telegramId, text) {
  if (!botToken) return
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramId,
      text,
    }),
  })
}

async function getAuthedUserFromInitData(initData) {
  if (!botToken || !initData) return null
  const validation = validateInitData(initData, botToken)
  if (!validation.valid || !validation.user?.id) return null
  const tgUser = validation.user
  const user = await prisma.user.upsert({
    where: { telegramId: String(tgUser.id) },
    update: {
      username: tgUser.username || '',
      displayName: tgUser.first_name || 'Usuario',
      language: tgUser.language_code || 'es',
    },
    create: {
      telegramId: String(tgUser.id),
      username: tgUser.username || '',
      displayName: tgUser.first_name || 'Usuario',
      language: tgUser.language_code || 'es',
    },
  })
  return user
}

export default async function handler(req, res) {
  const parsed = url.parse(req.url, true)
  const method = req.method
  const pathname = parsed.pathname

  if (method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    const html = fs.readFileSync(path.join(webRoot, 'index.html'), 'utf-8')
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
    return
  }

  if (method === 'GET' && pathname === '/webapp/styles.css') {
    const css = fs.readFileSync(path.join(webRoot, 'styles.css'), 'utf-8')
    res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' })
    res.end(css)
    return
  }

  if (method === 'GET' && pathname === '/webapp/app.js') {
    const js = fs.readFileSync(path.join(webRoot, 'app.js'), 'utf-8')
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' })
    res.end(js)
    return
  }

  if (method === 'GET' && pathname === '/docs/privacidad.md') {
    const md = fs.readFileSync(path.join(docsRoot, 'privacidad.md'), 'utf-8')
    res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' })
    res.end(md)
    return
  }

  if (method === 'GET' && pathname === '/docs/terminos.md') {
    const md = fs.readFileSync(path.join(docsRoot, 'terminos.md'), 'utf-8')
    res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' })
    res.end(md)
    return
  }

  if (method === 'POST' && pathname === '/api/sendData') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const json = JSON.parse(body || '{}')
        const initData = json.initData || ''
        const profileData = json.profile || json
        let tgUser = null
        if (initData) {
          if (!botToken) {
            sendJSON(res, 500, { ok: false, error: 'BOT_TOKEN no configurado' })
            return
          }
          const validation = validateInitData(initData, botToken)
          if (!validation.valid) {
            sendJSON(res, 401, { ok: false, error: 'initData inválido' })
            return
          }
          tgUser = validation.user
        }
        const user = await handleProfileSubmission(profileData, tgUser)
        if (tgUser?.id) {
          await sendTelegramMessage(tgUser.id, 'Perfil guardado correctamente')
        }
        sendJSON(res, 200, { ok: true, userId: user.id })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (method === 'POST' && pathname === '/api/recs') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const json = JSON.parse(body || '{}')
        const user = await getAuthedUserFromInitData(json.initData || '')
        if (!user) {
          sendJSON(res, 401, { ok: false, error: 'initData inválido' })
          return
        }
        const blocks = await prisma.block.findMany({
          where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] },
        })
        const blockedIds = new Set(
          blocks.flatMap(b => [b.blockerId, b.blockedId]).filter(id => id !== user.id)
        )
        const candidates = await prisma.user.findMany({
          where: {
            id: { not: user.id },
            profile: { isNot: null },
          },
          include: {
            profile: {
              include: { orientations: true, privacy: true },
            },
          },
          take: 20,
        })
        const visible = candidates.filter(c => {
          if (blockedIds.has(c.id)) return false
          const vis = c.profile?.privacy?.profileVisible ?? true
          return vis
        })
        const userProfile = await prisma.profile.findUnique({
          where: { userId: user.id },
          include: { orientations: true },
        })
        const filterOrient = Array.isArray(json.filterOrientations) ? json.filterOrientations : null
        const userOrientNames = new Set(
          (filterOrient && filterOrient.length ? filterOrient : (userProfile?.orientations || []).map(o => o.name))
        )
        const wantsFriends = typeof json.intentsFriends === 'boolean' ? json.intentsFriends : (userProfile?.intentsFriends || false)
        const wantsRomance = typeof json.intentsRomance === 'boolean' ? json.intentsRomance : (userProfile?.intentsRomance || false)
        const wantsPoly = typeof json.intentsPoly === 'boolean' ? json.intentsPoly : (userProfile?.intentsPoly || false)
        const maxDistanceKm = typeof json.maxDistanceKm === 'number' ? json.maxDistanceKm : null
        const userLoc = {
          lat: userProfile?.latitude ?? null,
          lon: userProfile?.longitude ?? null,
        }
        const recs = visible
          .filter(c => {
            const candOrient = new Set((c.profile?.orientations || []).map(o => o.name))
            const hasOrientOverlap = userOrientNames.size === 0
              ? true
              : [...userOrientNames].some(o => candOrient.has(o))
            const intentsOk =
              (!wantsFriends || c.profile?.intentsFriends) &&
              (!wantsRomance || c.profile?.intentsRomance) &&
              (!wantsPoly || c.profile?.intentsPoly)
            if (!(hasOrientOverlap && intentsOk)) return false
            if (maxDistanceKm != null) {
              const candLoc = {
                lat: c.profile?.latitude ?? null,
                lon: c.profile?.longitude ?? null,
              }
              const d = haversineKm(userLoc, candLoc)
              if (d == null) return false
              if (d > maxDistanceKm) return false
            }
            return true
          })
          .map(c => ({
            id: c.id,
            displayName: c.displayName,
            username: c.username,
            pronouns: c.profile?.pronouns || null,
            gender: c.profile?.gender || null,
            orientations: c.profile?.orientations.map(o => o.name) || [],
            telegramId: c.telegramId || null,
            city: c.profile?.city || null,
            distanceKm: (() => {
              const candLoc = { lat: c.profile?.latitude ?? null, lon: c.profile?.longitude ?? null }
              const d = haversineKm(userLoc, candLoc)
              if (d == null) return null
              const hide = c.profile?.privacy?.hideDistance ?? false
              return hide ? null : Math.round(d)
            })(),
          }))
        sendJSON(res, 200, { ok: true, recs })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (method === 'GET' && pathname === '/api/orientations') {
    try {
      const list = await prisma.orientation.findMany({ orderBy: { name: 'asc' } })
      sendJSON(res, 200, { ok: true, orientations: list.map(o => o.name) })
    } catch (err) {
      console.error(err)
      sendJSON(res, 500, { ok: false, error: 'Error interno' })
    }
    return
  }

  if (method === 'POST' && pathname === '/api/matches') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const json = JSON.parse(body || '{}')
        const user = await getAuthedUserFromInitData(json.initData || '')
        if (!user) {
          sendJSON(res, 401, { ok: false, error: 'initData inválido' })
          return
        }
        const rows = await prisma.match.findMany({
          where: { OR: [{ aId: user.id }, { bId: user.id }] },
          include: {
            a: true,
            b: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
        const items = rows.map(r => {
          const other = r.aId === user.id ? r.b : r.a
          return {
            userId: other.id,
            displayName: other.displayName,
            username: other.username,
            telegramId: other.telegramId,
            matchedAt: r.createdAt,
          }
        })
        sendJSON(res, 200, { ok: true, matches: items })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (method === 'POST' && pathname === '/api/chat/history') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const json = JSON.parse(body || '{}')
        const user = await getAuthedUserFromInitData(json.initData || '')
        if (!user) {
          sendJSON(res, 401, { ok: false, error: 'initData inválido' })
          return
        }
        const peerId = String(json.peerUserId || '')
        if (!peerId) {
          sendJSON(res, 400, { ok: false, error: 'peerUserId requerido' })
          return
        }
        const msgs = await prisma.message.findMany({
          where: {
            OR: [
              { senderId: user.id, recipientId: peerId },
              { senderId: peerId, recipientId: user.id },
            ],
          },
          orderBy: { createdAt: 'asc' },
          take: 200,
        })
        sendJSON(res, 200, { ok: true, messages: msgs })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (method === 'GET' && pathname === '/api/chat/subscribe') {
    const initData = parsed.query.initData || ''
    const user = await getAuthedUserFromInitData(initData)
    if (!user) {
      res.writeHead(401)
      res.end('Unauth')
      return
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    res.write(`event: open\ndata: ok\n\n`)
    const key = user.id
    const list = subscribers.get(key) || []
    list.push(res)
    subscribers.set(key, list)
    req.on('close', () => {
      const arr = subscribers.get(key) || []
      const idx = arr.indexOf(res)
      if (idx >= 0) arr.splice(idx, 1)
      subscribers.set(key, arr)
    })
    return
  }

  if (method === 'POST' && pathname === '/api/chat/send') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const json = JSON.parse(body || '{}')
        const user = await getAuthedUserFromInitData(json.initData || '')
        if (!user) {
          sendJSON(res, 401, { ok: false, error: 'initData inválido' })
          return
        }
        const toUserId = String(json.toUserId || '')
        let content = String(json.content || '')
        if (content.length > 1000) content = content.slice(0, 1000)
        if (!toUserId || !content) {
          sendJSON(res, 400, { ok: false, error: 'Parámetros requeridos' })
          return
        }
        const target = await prisma.user.findUnique({ where: { id: toUserId } })
        if (!target) {
          sendJSON(res, 404, { ok: false, error: 'Usuario no encontrado' })
          return
        }
        const msg = await prisma.message.create({
          data: { senderId: user.id, recipientId: target.id, content },
        })
        const day = new Date()
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
        await prisma.stats.upsert({
          where: { day: dayStart },
          update: { messages: { increment: 1 } },
          create: { day: dayStart, messages: 1, likes: 0, matches: 0 },
        })
        const receivers = subscribers.get(target.id) || []
        const payload = JSON.stringify({
          id: msg.id,
          fromId: user.id,
          content,
          createdAt: msg.createdAt,
        })
        for (const r of receivers) {
          r.write(`event: message\ndata: ${payload}\n\n`)
        }
        sendJSON(res, 200, { ok: true })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (method === 'POST' && pathname === '/api/like') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const json = JSON.parse(body || '{}')
        const user = await getAuthedUserFromInitData(json.initData || '')
        if (!user) {
          sendJSON(res, 401, { ok: false, error: 'initData inválido' })
          return
        }
        const toUserId = String(json.toUserId || '')
        if (!toUserId) {
          sendJSON(res, 400, { ok: false, error: 'toUserId requerido' })
          return
        }
        const target = await prisma.user.findUnique({ where: { id: toUserId } })
        if (!target) {
          sendJSON(res, 404, { ok: false, error: 'Usuario no encontrado' })
          return
        }
        await prisma.like.create({
          data: { fromId: user.id, toId: target.id },
        })
        const day = new Date()
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
        await prisma.stats.upsert({
          where: { day: dayStart },
          update: { likes: { increment: 1 } },
          create: { day: dayStart, likes: 1, matches: 0, messages: 0 },
        })
        const reciprocal = await prisma.like.findUnique({
          where: { fromId_toId: { fromId: target.id, toId: user.id } },
        })
        let matched = false
        if (reciprocal) {
          const aId = user.id < target.id ? user.id : target.id
          const bId = user.id < target.id ? target.id : user.id
          await prisma.match.upsert({
            where: { aId_bId: { aId, bId } },
            update: {},
            create: { aId, bId },
          })
          matched = true
          const day2 = new Date()
          const dayStart2 = new Date(day2.getFullYear(), day2.getMonth(), day2.getDate())
          await prisma.stats.upsert({
            where: { day: dayStart2 },
            update: { matches: { increment: 1 } },
            create: { day: dayStart2, likes: 0, matches: 1, messages: 0 },
          })
          if (user.telegramId) {
            await sendTelegramMessage(user.telegramId, `¡Tienes un match con ${target.displayName}!`)
          }
          if (target.telegramId) {
            await sendTelegramMessage(target.telegramId, `¡Tienes un match con ${user.displayName}!`)
          }
        }
        sendJSON(res, 200, { ok: true, matched })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (method === 'GET' && pathname === '/api/mod/reports') {
    const initData = parsed.query.initData || ''
    const validation = validateInitData(initData, botToken)
    if (!validation.valid || !isModerator(validation.user)) {
      sendJSON(res, 401, { ok: false, error: 'unauthorized' })
      return
    }
    const list = await prisma.report.findMany({
      include: { reporter: true, reported: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    sendJSON(res, 200, { ok: true, reports: list })
    return
  }

  if (method === 'POST' && pathname === '/api/mod/verify') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const json = JSON.parse(body || '{}')
        const validation = validateInitData(json.initData || '', botToken)
        if (!validation.valid || !isModerator(validation.user)) {
          sendJSON(res, 401, { ok: false, error: 'unauthorized' })
          return
        }
        const userId = String(json.userId || '')
        const profile = await prisma.profile.findUnique({ where: { userId } })
        if (!profile) {
          sendJSON(res, 404, { ok: false, error: 'Perfil no encontrado' })
          return
        }
        await prisma.verification.upsert({
          where: { profileId: profile.id },
          update: { photoVerified: true },
          create: { profileId: profile.id, photoVerified: true },
        })
        sendJSON(res, 200, { ok: true })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (method === 'POST' && pathname === '/api/mod/block-user') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const json = JSON.parse(body || '{}')
        const validation = validateInitData(json.initData || '', botToken)
        if (!validation.valid || !isModerator(validation.user)) {
          sendJSON(res, 401, { ok: false, error: 'unauthorized' })
          return
        }
        const blockerId = String(json.blockerUserId || '')
        const blockedId = String(json.blockedUserId || '')
        if (!blockerId || !blockedId) {
          sendJSON(res, 400, { ok: false, error: 'Parámetros requeridos' })
          return
        }
        await prisma.block.upsert({
          where: { blockerId_blockedId: { blockerId, blockedId } },
          update: {},
          create: { blockerId, blockedId },
        })
        sendJSON(res, 200, { ok: true })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (method === 'POST' && pathname === '/api/report') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const json = JSON.parse(body || '{}')
        if (!botToken) {
          sendJSON(res, 500, { ok: false, error: 'BOT_TOKEN no configurado' })
          return
        }
        const validation = validateInitData(json.initData || '', botToken)
        if (!validation.valid) {
          sendJSON(res, 401, { ok: false, error: 'initData inválido' })
          return
        }
        const reporter = validation.user
        const reportedTelegramId = String(json.reportedTelegramId || '')
        if (!reportedTelegramId) {
          sendJSON(res, 400, { ok: false, error: 'reportedTelegramId requerido' })
          return
        }
        const reported = await prisma.user.findFirst({ where: { telegramId: reportedTelegramId } })
        if (!reported) {
          sendJSON(res, 404, { ok: false, error: 'Usuario no encontrado' })
          return
        }
        const reporterUser = await prisma.user.upsert({
          where: { telegramId: String(reporter.id) },
          update: { username: reporter.username || '' },
          create: {
            telegramId: String(reporter.id),
            username: reporter.username || '',
            displayName: reporter.first_name || 'Usuario',
            language: reporter.language_code || 'es',
          },
        })
        await prisma.report.create({
          data: {
            reporterId: reporterUser.id,
            reportedId: reported.id,
            reason: json.reason || 'Sin detalle',
          },
        })
        sendJSON(res, 200, { ok: true })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (method === 'POST' && pathname === '/api/block') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const json = JSON.parse(body || '{}')
        if (!botToken) {
          sendJSON(res, 500, { ok: false, error: 'BOT_TOKEN no configurado' })
          return
        }
        const validation = validateInitData(json.initData || '', botToken)
        if (!validation.valid) {
          sendJSON(res, 401, { ok: false, error: 'initData inválido' })
          return
        }
        const blocker = validation.user
        const blockedTelegramId = String(json.blockedTelegramId || '')
        if (!blockedTelegramId) {
          sendJSON(res, 400, { ok: false, error: 'blockedTelegramId requerido' })
          return
        }
        const blocked = await prisma.user.findFirst({ where: { telegramId: blockedTelegramId } })
        if (!blocked) {
          sendJSON(res, 404, { ok: false, error: 'Usuario no encontrado' })
          return
        }
        const blockerUser = await prisma.user.upsert({
          where: { telegramId: String(blocker.id) },
          update: { username: blocker.username || '' },
          create: {
            telegramId: String(blocker.id),
            username: blocker.username || '',
            displayName: blocker.first_name || 'Usuario',
            language: blocker.language_code || 'es',
          },
        })
        await prisma.block.create({
          data: {
            blockerId: blockerUser.id,
            blockedId: blocked.id,
          },
        })
        sendJSON(res, 200, { ok: true })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  res.writeHead(404)
  res.end('Not found')
}