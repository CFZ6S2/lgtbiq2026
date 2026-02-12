import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'
import url from 'url'
import { validateInitData } from './validateInitData.js'
import { prisma } from './db.js'
import { getCorrelationId, log } from './logger.js'
import { sendJSON, isModerator as isModeratorShared, haversineKm, subscribers as sharedSubs, addSubscriber, removeSubscriber, emitTo, checkRate } from './shared.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const webRoot = path.join(root, 'webapp')
const docsRoot = path.join(root, 'docs')
const uploadsRoot = path.join(root, 'uploads')
const rateLimits = new Map()
function checkRate(userId, key, max, windowMs) {
  const now = Date.now()
  const k = `${userId}|${key}`
  const state = rateLimits.get(k) || { count: 0, start: now }
  if (now - state.start > windowMs) {
    state.count = 0
    state.start = now
  }
  state.count++
  rateLimits.set(k, state)
  return state.count <= max
}
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080
const botToken = process.env.BOT_TOKEN || ''
const apiBase = botToken ? `https://api.telegram.org/bot${botToken}` : ''
const modAdmins = (process.env.MOD_ADMINS || '').split(',').map(s => s.trim()).filter(Boolean)
const subscribers = new Map()
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

function serveFile(res, filePath, type) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('Not found')
      return
    }
    res.writeHead(200, { 'Content-Type': type })
    res.end(data)
  })
}

const subscribers = sharedSubs

function isModerator(tgUser) {
  return isModeratorShared(modAdmins, tgUser)
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
  if (!apiBase) return
  await fetch(`${apiBase}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramId,
      text,
    }),
  })
}

async function getAuthedUserFromInitData(initData) {
  if (!initData) return null
  // Modo demo: permitir autenticación sin BOT_TOKEN
  if (initData === 'demo_init_data') {
    const user = await prisma.user.upsert({
      where: { username: 'demo_user' },
      update: { displayName: 'Demo', language: 'es' },
      create: { username: 'demo_user', displayName: 'Demo', language: 'es' },
    })
    return user
  }
  if (!botToken) return null
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
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true)

  if (typingRoute(req, res, parsed)) {
    return
  }

  if (req.method === 'GET' && (parsed.pathname === '/' || parsed.pathname === '/index.html')) {
    serveFile(res, path.join(webRoot, 'index.html'), 'text/html; charset=utf-8')
    return
  }
  if (req.method === 'GET' && parsed.pathname === '/webapp/styles.css') {
    serveFile(res, path.join(webRoot, 'styles.css'), 'text/css; charset=utf-8')
    return
  }
  if (req.method === 'GET' && parsed.pathname === '/webapp/app.js') {
    serveFile(res, path.join(webRoot, 'app.js'), 'application/javascript; charset=utf-8')
    return
  }
  if (req.method === 'GET' && parsed.pathname === '/docs/privacidad.md') {
    serveFile(res, path.join(docsRoot, 'privacidad.md'), 'text/markdown; charset=utf-8')
    return
  }
  if (req.method === 'GET' && parsed.pathname === '/docs/terminos.md') {
    serveFile(res, path.join(docsRoot, 'terminos.md'), 'text/markdown; charset=utf-8')
    return
  }

  if (req.method === 'GET' && parsed.pathname.startsWith('/uploads/')) {
    const name = path.basename(parsed.pathname.slice('/uploads/'.length))
    const filePath = path.join(uploadsRoot, name)
    const ext = path.extname(name).toLowerCase()
    const map = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
    }
    const type = map[ext] || 'application/octet-stream'
    serveFile(res, filePath, type)
    return
  }
  if (req.method === 'POST' && parsed.pathname === '/api/sendData') {
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
        log('error', 'sendData_failed', { cid: getCorrelationId(req), error: String(err?.message || err) })
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (req.method === 'POST' && parsed.pathname === '/api/recs') {
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
          if (!vis) return false
          const inc = c.profile?.privacy?.incognito ?? false
          if (inc) return false
          return true
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
            if (json.onlyVerified === true) {
              const v = c.profile?.verified?.photoVerified || false
              if (!v) return false
            }
            if (typeof json.city === 'string' && json.city.trim().length) {
              const q = json.city.trim().toLowerCase()
              const val = (c.profile?.city || '').toLowerCase()
              if (!val || val !== q) return false
            }
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
        log('error', 'recs_failed', { cid: getCorrelationId(req), error: String(err?.message || err) })
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }
  if (req.method === 'POST' && parsed.pathname === '/api/me/export') {
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
        if (!checkRate(user.id, 'export', 2, 60_000)) {
          sendJSON(res, 429, { ok: false, error: 'rate_limit' })
          return
        }
        const profile = await prisma.profile.findUnique({
          where: { userId: user.id },
          include: { orientations: true, privacy: true, verified: true, moderation: true },
        })
        const likesSent = await prisma.like.findMany({ where: { fromId: user.id } })
        const likesRecv = await prisma.like.findMany({ where: { toId: user.id } })
        const blocksSent = await prisma.block.findMany({ where: { blockerId: user.id } })
        const blocksRecv = await prisma.block.findMany({ where: { blockedId: user.id } })
        const matches = await prisma.match.findMany({
          where: { OR: [{ aId: user.id }, { bId: user.id }] },
          orderBy: { createdAt: 'desc' },
        })
        const messages = await prisma.message.findMany({
          where: { OR: [{ senderId: user.id }, { recipientId: user.id }] },
          orderBy: { createdAt: 'asc' },
          take: 5000,
        })
        const reportsSent = await prisma.report.findMany({ where: { reporterId: user.id } })
        const reportsRecv = await prisma.report.findMany({ where: { reportedId: user.id } })
        sendJSON(res, 200, {
          ok: true,
          data: {
            user: { id: user.id, username: user.username, displayName: user.displayName, telegramId: user.telegramId },
            profile,
            likesSent,
            likesRecv,
            blocksSent,
            blocksRecv,
            matches,
            messages,
            reportsSent,
            reportsRecv,
          },
        })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }
  if (req.method === 'POST' && parsed.pathname === '/api/me/delete') {
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
        if (!checkRate(user.id, 'delete', 1, 300_000)) {
          sendJSON(res, 429, { ok: false, error: 'rate_limit' })
          return
        }
        await prisma.$transaction([
          prisma.message.deleteMany({ where: { OR: [{ senderId: user.id }, { recipientId: user.id }] } }),
          prisma.like.deleteMany({ where: { OR: [{ fromId: user.id }, { toId: user.id }] } }),
          prisma.match.deleteMany({ where: { OR: [{ aId: user.id }, { bId: user.id }] } }),
          prisma.block.deleteMany({ where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] } }),
          prisma.report.deleteMany({ where: { OR: [{ reporterId: user.id }, { reportedId: user.id }] } }),
          prisma.privacySettings.deleteMany({ where: { profile: { userId: user.id } } }),
          prisma.verification.deleteMany({ where: { profile: { userId: user.id } } }),
          prisma.moderationFlags.deleteMany({ where: { profile: { userId: user.id } } }),
          prisma.profile.deleteMany({ where: { userId: user.id } }),
          prisma.user.delete({ where: { id: user.id } }),
        ])
        sendJSON(res, 200, { ok: true })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (req.method === 'GET' && parsed.pathname === '/api/orientations') {
    try {
      const list = await prisma.orientation.findMany({ orderBy: { name: 'asc' } })
      sendJSON(res, 200, { ok: true, orientations: list.map(o => o.name) })
    } catch (err) {
      console.error(err)
      sendJSON(res, 500, { ok: false, error: 'Error interno' })
    }
    return
  }

  if (req.method === 'POST' && parsed.pathname === '/api/matches') {
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
        }).filter(it => !blockedIds.has(it.userId))
        const privacy = await prisma.privacySettings.findFirst({ where: { profile: { userId: user.id } } })
        const paused = !!privacy?.incognito
        sendJSON(res, 200, { ok: true, matches: items, paused })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }
  if (req.method === 'POST' && parsed.pathname === '/api/privacy/incognito') {
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
        if (!checkRate(user.id, 'privacy_incognito', 30, 60_000)) {
          sendJSON(res, 429, { ok: false, error: 'rate_limit' })
          return
        }
        const incognito = !!json.incognito
        const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
        if (!profile) {
          sendJSON(res, 404, { ok: false, error: 'Perfil no encontrado' })
          return
        }
        const existing = await prisma.privacySettings.findUnique({ where: { profileId: profile.id } })
        await prisma.privacySettings.upsert({
          where: { profileId: profile.id },
          update: { incognito, hideDistance: incognito ? true : (existing?.hideDistance ?? false) },
          create: { profileId: profile.id, incognito, hideDistance: incognito ? true : false, profileVisible: true },
        })
        sendJSON(res, 200, { ok: true })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (req.method === 'POST' && parsed.pathname === '/api/chat/history') {
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
        if (!checkRate(user.id, 'history', 120, 60_000)) {
          sendJSON(res, 429, { ok: false, error: 'rate_limit' })
          return
        }
        const peerId = String(json.peerUserId || '')
        if (!peerId) {
          sendJSON(res, 400, { ok: false, error: 'peerUserId requerido' })
          return
        }
        const blocked = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: user.id, blockedId: peerId },
              { blockerId: peerId, blockedId: user.id },
            ],
          },
        })
        if (blocked) {
          sendJSON(res, 403, { ok: false, error: 'blocked' })
          return
        }
        const limit = typeof json.limit === 'number' ? Math.max(1, Math.min(json.limit, 200)) : 50
        const beforeCreatedAt = json.beforeCreatedAt ? new Date(json.beforeCreatedAt) : null
        const whereBase = {
          OR: [
            { senderId: user.id, recipientId: peerId },
            { senderId: peerId, recipientId: user.id },
          ],
        }
        const where = beforeCreatedAt ? { ...whereBase, createdAt: { lt: beforeCreatedAt } } : whereBase
        const msgs = await prisma.message.findMany({
          where: {
            ...where,
          },
          orderBy: { createdAt: 'asc' },
          take: limit,
        })
        sendJSON(res, 200, { ok: true, messages: msgs })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (req.method === 'POST' && parsed.pathname === '/api/like') {
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
        const privacy = await prisma.privacySettings.findFirst({ where: { profile: { userId: user.id } } })
        if (privacy?.incognito) {
          sendJSON(res, 403, { ok: false, error: 'incognito' })
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

  if (req.method === 'GET' && parsed.pathname === '/api/chat/subscribe') {
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
    addSubscriber(key, res)
    req.on('close', () => {
      removeSubscriber(key, res)
    })
    return
  }

  if (req.method === 'POST' && parsed.pathname === '/api/chat/send') {
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
        const blocked = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: user.id, blockedId: target.id },
              { blockerId: target.id, blockedId: user.id },
            ],
          },
        })
        if (blocked) {
          sendJSON(res, 403, { ok: false, error: 'blocked' })
          return
        }
        if (!checkRate(user.id, 'send', 30, 60_000)) {
          sendJSON(res, 429, { ok: false, error: 'rate_limit' })
          return
        }
        const msg = await prisma.message.create({
          data: { senderId: user.id, recipientId: target.id, content, deliveredAt: new Date() },
        })
        const day = new Date()
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
        await prisma.stats.upsert({
          where: { day: dayStart },
          update: { messages: { increment: 1 } },
          create: { day: dayStart, messages: 1, likes: 0, matches: 0 },
        })
        const payload = {
          id: msg.id,
          fromId: user.id,
          content,
          createdAt: msg.createdAt,
        }
        emitTo(target.id, 'message', payload)
        // Notificar al remitente que el mensaje fue entregado
        const senderSubs = subscribers.get(user.id) || []
        const receiptPayload = JSON.stringify({
          id: msg.id,
          deliveredAt: msg.deliveredAt,
          readAt: null,
        })
        for (const r of senderSubs) {
          r.write(`event: receipt:update\ndata: ${receiptPayload}\n\n`)
        }
        sendJSON(res, 200, { ok: true, id: msg.id, deliveredAt: msg.deliveredAt })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (req.method === 'POST' && parsed.pathname === '/api/chat/send-media') {
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
        if (!toUserId || !json.media || !json.media.data || !json.media.mime) {
          sendJSON(res, 400, { ok: false, error: 'Parámetros requeridos' })
          return
        }
        const target = await prisma.user.findUnique({ where: { id: toUserId } })
        if (!target) {
          sendJSON(res, 404, { ok: false, error: 'Usuario no encontrado' })
          return
        }
        const blocked = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: user.id, blockedId: target.id },
              { blockerId: target.id, blockedId: user.id },
            ],
          },
        })
        if (blocked) {
          sendJSON(res, 403, { ok: false, error: 'blocked' })
          return
        }
        const dataUrl = String(json.media.data)
        const mime = String(json.media.mime)
        const base64 = dataUrl.startsWith('data:') ? dataUrl.split(',')[1] || '' : dataUrl
        const buf = Buffer.from(base64, 'base64')
        const max = 2 * 1024 * 1024
        if (!buf.length || buf.length > max) {
          sendJSON(res, 400, { ok: false, error: 'Archivo vacío o demasiado grande' })
          return
        }
        if (!fs.existsSync(uploadsRoot)) {
          fs.mkdirSync(uploadsRoot, { recursive: true })
        }
        const extMap = {
          'image/png': '.png',
          'image/jpeg': '.jpg',
          'image/gif': '.gif',
          'image/webp': '.webp',
          'audio/mpeg': '.mp3',
          'audio/wav': '.wav',
          'audio/ogg': '.ogg',
        }
        const ext = extMap[mime] || ''
        const fname = `m_${Date.now()}_${Math.floor(Math.random()*100000)}${ext}`
        const fpath = path.join(uploadsRoot, fname)
        fs.writeFileSync(fpath, buf)
        const type = mime.startsWith('image/') ? 'IMAGE' : mime.startsWith('audio/') ? 'AUDIO' : 'TEXT'
        if (!checkRate(user.id, 'send_media', 10, 60_000)) {
          sendJSON(res, 429, { ok: false, error: 'rate_limit' })
          return
        }
        const msg = await prisma.message.create({
          data: {
            senderId: user.id,
            recipientId: target.id,
            content: String(json.caption || fname),
            deliveredAt: new Date(),
            messageType: type,
            mediaUrl: `/uploads/${fname}`,
            mediaMime: mime,
            mediaSize: buf.length,
          },
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
          content: msg.content,
          createdAt: msg.createdAt,
          messageType: msg.messageType,
          mediaUrl: msg.mediaUrl,
        })
        for (const r of receivers) {
          r.write(`event: message\ndata: ${payload}\n\n`)
        }
        const senderSubs = subscribers.get(user.id) || []
        const receiptPayload = JSON.stringify({
          id: msg.id,
          deliveredAt: msg.deliveredAt,
          readAt: null,
        })
        for (const r of senderSubs) {
          r.write(`event: receipt:update\ndata: ${receiptPayload}\n\n`)
        }
        sendJSON(res, 200, { ok: true, id: msg.id, deliveredAt: msg.deliveredAt, mediaUrl: msg.mediaUrl, messageType: msg.messageType })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (req.method === 'POST' && parsed.pathname === '/api/chat/mark-read') {
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
        const upToMessageId = json.upToMessageId ? String(json.upToMessageId) : null
        if (!peerId) {
          sendJSON(res, 400, { ok: false, error: 'peerUserId requerido' })
          return
        }
        // Seleccionar mensajes aún no leídos
        const whereBase = {
          senderId: peerId,
          recipientId: user.id,
          readAt: null,
        }
        const toMark = await prisma.message.findMany({
          where: upToMessageId ? { ...whereBase, id: { lte: upToMessageId } } : whereBase,
          select: { id: true },
        })
        if (toMark.length > 0) {
          const now = new Date()
          await prisma.message.updateMany({
            where: upToMessageId ? { ...whereBase, id: { lte: upToMessageId } } : whereBase,
            data: { read: true, readAt: now },
          })
          // Notificar al emisor (peer) las lecturas
          const peerSubs = subscribers.get(peerId) || []
          for (const r of peerSubs) {
            for (const m of toMark) {
              const payload = JSON.stringify({ id: m.id, readAt: now })
              r.write(`event: receipt:update\ndata: ${payload}\n\n`)
            }
          }
        }
        sendJSON(res, 200, { ok: true, updated: toMark.map(m => m.id) })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }
  if (req.method === 'POST' && parsed.pathname === '/api/report') {
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
        if (!checkRate(String(validation.user.id), 'report', 5, 60_000)) {
          sendJSON(res, 429, { ok: false, error: 'rate_limit' })
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

  if (req.method === 'GET' && parsed.pathname === '/api/mod/reports') {
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

  if (req.method === 'POST' && parsed.pathname === '/api/mod/verify') {
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
        if (!checkRate(String(validation.user.id), 'mod_verify', 60, 60_000)) {
          sendJSON(res, 429, { ok: false, error: 'rate_limit' })
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
  if (req.method === 'POST' && parsed.pathname === '/api/mod/block-user') {
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
        if (!checkRate(String(validation.user.id), 'mod_block', 30, 60_000)) {
          sendJSON(res, 429, { ok: false, error: 'rate_limit' })
          return
        }
        const blockerUserId = String(json.blockerUserId || '')
        const blockedUserId = String(json.blockedUserId || '')
        if (!blockerUserId || !blockedUserId) {
          sendJSON(res, 400, { ok: false, error: 'Parámetros requeridos' })
          return
        }
        await prisma.block.upsert({
          where: { blockerId_blockedId: { blockerId: blockerUserId, blockedId: blockedUserId } },
          update: {},
          create: { blockerId: blockerUserId, blockedId: blockedUserId },
        })
        sendJSON(res, 200, { ok: true })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (req.method === 'POST' && parsed.pathname === '/api/block') {
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
})

server.listen(port, () => {
  process.stdout.write(`Servidor en http://localhost:${port}/\n`)
})

// Ruta para notificar estado de escritura (typing)
// Ubicada al nivel del enrutador, fuera de handleProfileSubmission
const typingRoute = (req, res, parsed) => {
  if (req.method === 'POST' && parsed.pathname === '/api/chat/typing') {
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
        const active = !!json.active
        if (!peerId) {
          sendJSON(res, 400, { ok: false, error: 'peerUserId requerido' })
          return
        }
        emitTo(peerId, 'typing', { fromId: user.id, active })
        sendJSON(res, 200, { ok: true })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return true
  }
  return false
}

const certPath = process.env.HTTPS_CERT_PATH || ''
const keyPath = process.env.HTTPS_KEY_PATH || ''
if (certPath && keyPath) {
  try {
    const cert = fs.readFileSync(certPath)
    const key = fs.readFileSync(keyPath)
    const httpsServer = https.createServer({ cert, key }, server.listeners('request')[0])
    const httpsPort = process.env.HTTPS_PORT ? parseInt(process.env.HTTPS_PORT, 10) : 8443
    httpsServer.listen(httpsPort, () => {
      process.stdout.write(`Servidor HTTPS en https://localhost:${httpsPort}/\n`)
    })
  } catch (err) {
    console.error('HTTPS no iniciado:', err.message)
  }
}
