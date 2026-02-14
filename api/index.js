import url from 'url'
import fs from 'fs'
import path from 'path'
import { validateInitData } from '../bot/validateInitData.js'
import { prisma } from '../bot/db.js'
import { sendJSON as sendJSONCommon, isModerator as isModeratorCommon, checkRate as checkRateCommon, haversineKm as haversineKmCommon, readJsonLimited as readJsonLimitedCommon, getAuthedUserFromInitData as getAuthedUserFromInitDataCommon, assertChatAllowed, parseOrSendValidationError, ZSendBody, ZTypingBody, ZMarkReadBody, ZReportBody, ZModBlockBody, ZModVerifyBody, ZExportBody, ZDeleteBody, ZBlockBody, ZMapConsentBody, ZMapLocationBody, toCsv, exportToCsvRows, geohashEncode } from '../bot/common.js'
import { getCorrelationId } from '../bot/logger.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const webRoot = path.join(path.resolve(__dirname, '..'), 'webapp')
const docsRoot = path.join(path.resolve(__dirname, '..'), 'docs')

const botToken = process.env.BOT_TOKEN || ''
const modAdmins = (process.env.MOD_ADMINS || '').split(',').map(s => s.trim()).filter(Boolean)
const subscribers = new Map()
const rateLimits = new Map()
const demoAllowed = process.env.DEMO === 'true'
const demoSecret = process.env.DEMO_SECRET || ''
const featureMap = process.env.FEATURE_MAP === 'true'
const mapPaid = process.env.MAP_PAID === 'true'
const mapRequireConsent = process.env.MAP_REQUIRE_CONSENT === 'true'
const mapGeohashOutPrecision = process.env.MAP_GEOHASH_OUT_PRECISION ? parseInt(process.env.MAP_GEOHASH_OUT_PRECISION, 10) : 0
const mapJitterMinM = process.env.MAP_JITTER_MIN_M ? parseInt(process.env.MAP_JITTER_MIN_M, 10) : 80
const mapJitterMaxM = process.env.MAP_JITTER_MAX_M ? parseInt(process.env.MAP_JITTER_MAX_M, 10) : 250
function checkRate(userId, key, max, windowMs) {
  return checkRateCommon(rateLimits, userId, key, max, windowMs)
}

function readJsonLimited(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let size = 0
    let body = ''
    req.on('data', chunk => {
      size += chunk.length
      if (size > maxBytes) {
        reject(new Error('payload_too_large'))
        return
      }
      body += chunk
    })
    req.on('end', () => {
      try {
        const json = JSON.parse(body || '{}')
        resolve(json)
      } catch (e) {
        reject(new Error('invalid_json'))
      }
    })
    req.on('error', reject)
  })
}
function sendJSON(res, status, payload) {
  sendJSONCommon(res, status, payload)
}

function isModerator(tgUser) {
  return isModeratorCommon(modAdmins, tgUser)
}

const haversineKm = haversineKmCommon

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
      geoHash: (typeof data.location?.latitude === 'number' && typeof data.location?.longitude === 'number') ? geohashEncode(data.location.latitude, data.location.longitude, 6) : null,
      locationUpdatedAt: (typeof data.location?.latitude === 'number' && typeof data.location?.longitude === 'number') ? new Date() : null,
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
      geoHash: (typeof data.location?.latitude === 'number' && typeof data.location?.longitude === 'number') ? geohashEncode(data.location.latitude, data.location.longitude, 6) : null,
      locationUpdatedAt: (typeof data.location?.latitude === 'number' && typeof data.location?.longitude === 'number') ? new Date() : null,
      orientations: { connect: orientations.map(o => ({ id: o.id })) },
    },
  })

  await prisma.privacySettings.upsert({
    where: { profileId: profile.id },
    update: {
      incognito: data.privacy?.incognito || false,
      hideDistance: data.privacy?.hideDistance || false,
      profileVisible: data.privacy?.profileVisible !== false,
      mapConsent: !!data.privacy?.mapConsent,
      mapConsentAt: data.privacy?.mapConsent ? new Date() : null,
    },
    create: {
      profileId: profile.id,
      incognito: data.privacy?.incognito || false,
      hideDistance: data.privacy?.hideDistance || false,
      profileVisible: data.privacy?.profileVisible !== false,
      mapConsent: !!data.privacy?.mapConsent,
      mapConsentAt: data.privacy?.mapConsent ? new Date() : null,
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
  return getAuthedUserFromInitDataCommon(initData, { botToken, demoAllowed, prisma })
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
        const limit = typeof json.limit === 'number' ? Math.max(1, Math.min(json.limit, 100)) : 50
        const beforeCreatedAt = json.beforeCreatedAt ? new Date(json.beforeCreatedAt) : null
        const whereBase = { OR: [{ aId: user.id }, { bId: user.id }] }
        const rows = await prisma.match.findMany({
          where: beforeCreatedAt ? { ...whereBase, createdAt: { lt: beforeCreatedAt } } : whereBase,
          include: {
            a: true,
            b: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
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
        const nextCursor = items.length > 0 ? items[items.length - 1].matchedAt : null
        sendJSON(res, 200, { ok: true, matches: items, nextCursor })
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
        const cid = getCorrelationId(req)
        const parsed = parseOrSendValidationError(res, ZMarkReadBody.pick({ peerUserId: true }), json, cid)
        if (!parsed.ok) return
        const peerId = parsed.data.peerUserId
        const guard = await assertChatAllowed(prisma, user.id, peerId, { checkPeerVisibility: true })
        if (!guard.ok) { sendJSON(res, 403, { ok: false, error: guard.error }); return }
        if (!checkRate(user.id, 'history', 120, 60_000)) {
          sendJSON(res, 429, { ok: false, error: 'rate_limit' })
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
    try {
      const json = await readJsonLimitedCommon(req, 128 * 1024)
        const user = await getAuthedUserFromInitData(json.initData || '')
        if (!user) {
          sendJSON(res, 401, { ok: false, error: 'initData inválido' })
          return
        }
        const cid = getCorrelationId(req)
        const parsed = parseOrSendValidationError(res, ZSendBody, json, cid)
        if (!parsed.ok) return
        const body = parsed.data
        const target = await prisma.user.findUnique({ where: { id: body.toUserId } })
        if (!target) {
          sendJSON(res, 404, { ok: false, error: 'Usuario no encontrado' })
          return
        }
        const guard = await assertChatAllowed(prisma, user.id, target.id, { checkIncognitoSender: true })
        if (!guard.ok) { sendJSON(res, 403, { ok: false, error: guard.error }); return }
        if (!checkRate(user.id, 'send', 30, 60_000)) {
          sendJSON(res, 429, { ok: false, error: 'rate_limit' })
          return
        }
        const msg = await prisma.message.create({ data: { senderId: user.id, recipientId: target.id, content: body.content } })
        const day = new Date()
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
        await prisma.stats.upsert({
          where: { day: dayStart },
          update: { messages: { increment: 1 } },
          create: { day: dayStart, messages: 1, likes: 0, matches: 0 },
        })
        const receivers = subscribers.get(target.id) || []
        const payload = JSON.stringify({ id: msg.id, fromId: user.id, content: body.content, createdAt: msg.createdAt })
        for (const r of receivers) {
          r.write(`event: message\ndata: ${payload}\n\n`)
        }
        sendJSON(res, 200, { ok: true })
    } catch (err) {
      if (err?.message === 'payload_too_large') {
        sendJSON(res, 413, { ok: false, error: 'payload_too_large' })
      } else if (err?.message === 'invalid_json') {
        sendJSON(res, 400, { ok: false, error: 'invalid_json' })
      } else {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    }
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

  if (method === 'GET' && pathname === '/api/map/nearby') {
    try {
      const cid = getCorrelationId(req)
      if (!featureMap) { sendJSON(res, 404, { ok: false, code: 'NOT_FOUND', message: 'Mapa no disponible', correlationId: cid }); return }
      const initData = parsed.query.initData || ''
      const user = await getAuthedUserFromInitData(initData || '')
      if (!user) { sendJSON(res, 401, { ok: false, code: 'UNAUTH', message: 'initData inválido', correlationId: cid }); return }
      if (!checkRate(user.id, 'map_nearby', 20, 60_000)) { sendJSON(res, 429, { ok: false, code: 'rate_limit', correlationId: cid }); return }
      const privacy = await prisma.privacySettings.findFirst({ where: { profile: { userId: user.id } } })
      if (privacy?.incognito) { sendJSON(res, 403, { ok: false, code: 'INCOGNITO', message: 'Mapa no disponible en incógnito', correlationId: cid }); return }
      if (privacy?.hideDistance) { sendJSON(res, 403, { ok: false, code: 'DISTANCE_HIDDEN', message: 'Distancia oculta', correlationId: cid }); return }
      const visible = await prisma.profile.findUnique({ where: { userId: user.id }, include: { privacy: true } })
      if (visible?.privacy?.profileVisible === false) { sendJSON(res, 403, { ok: false, code: 'PEER_HIDDEN', message: 'Perfil oculto', correlationId: cid }); return }
      if (mapRequireConsent) {
        if (!privacy?.mapConsent) { sendJSON(res, 409, { ok: false, code: 'CONSENT_REQUIRED', message: 'Requiere consentimiento', correlationId: cid }); return }
      }
      if (mapPaid) { sendJSON(res, 402, { ok: false, code: 'PAYMENT_REQUIRED', message: 'Mapa disponible con Premium', correlationId: cid }); return }
      const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
      const lat = typeof parsed.query.lat === 'string' ? Number(parsed.query.lat) : profile?.latitude ?? null
      const lon = typeof parsed.query.lon === 'string' ? Number(parsed.query.lon) : profile?.longitude ?? null
      const radiusKm = typeof parsed.query.radiusKm === 'string' ? Math.max(1, Math.min(Number(parsed.query.radiusKm), 50)) : 5
      if (lat == null || lon == null) { sendJSON(res, 400, { ok: false, code: 'LOCATION_REQUIRED', message: 'Ubicación requerida', correlationId: cid }); return }
      const bbox = bboxFromRadiusKm(lat, lon, radiusKm)
      const maxAgeMin = process.env.MAP_LOCATION_MAX_AGE_MIN ? parseInt(process.env.MAP_LOCATION_MAX_AGE_MIN, 10) : 1440
      const minUpdatedAt = new Date(Date.now() - maxAgeMin * 60_000)
      const candidates = await prisma.profile.findMany({
        where: {
          latitude: { gte: bbox.minLat, lte: bbox.maxLat },
          longitude: { gte: bbox.minLng, lte: bbox.maxLng },
          locationUpdatedAt: { gte: minUpdatedAt },
          userId: { not: user.id },
          privacy: { is: { profileVisible: true, incognito: false, hideDistance: false } },
        },
        include: { verified: true, user: true },
        take: 500,
      })
      const dayKey = new Date().toISOString().slice(0, 10)
      const filtered = candidates.map(p => {
        const dist = haversineKm(lat, lon, p.latitude ?? 0, p.longitude ?? 0)
        return { p, dist }
      }).filter(x => x.dist <= radiusKm).sort((a, b) => a.dist - b.dist).slice(0, 100)
      const locations = filtered.map(({ p }) => {
        let baseLat = p.latitude ?? 0
        let baseLng = p.longitude ?? 0
        if (mapGeohashOutPrecision && p.geoHash) {
          const truncated = p.geoHash.slice(0, Math.max(1, Math.min(mapGeohashOutPrecision, p.geoHash.length)))
          const c = geohashDecodeCenter(truncated)
          baseLat = c.lat
          baseLng = c.lng
        }
        const j = jitterLatLng({ lat: baseLat, lng: baseLng, viewerId: user.id, targetId: p.userId, dayKey, minM: mapJitterMinM, maxM: mapJitterMaxM })
        return { userId: p.userId, displayName: (p.user?.displayName) || '', city: p.city || null, latApprox: j.lat, lngApprox: j.lng, verified: !!p.verified }
      })
      sendJSON(res, 200, { ok: true, locations })
    } catch (err) {
      console.error(err)
      sendJSON(res, 500, { ok: false, error: 'Error interno' })
    }
    return
  }

  if (method === 'POST' && pathname === '/api/map/consent') {
    try {
      const json = await readJsonLimitedCommon(req, 32 * 1024)
      const cid = getCorrelationId(req)
      const user = await getAuthedUserFromInitData(json.initData || '')
      if (!user) { sendJSON(res, 401, { ok: false, code: 'UNAUTH', message: 'initData inválido', correlationId: cid }); return }
      if (!checkRate(user.id, 'map_consent', 10, 60_000)) { sendJSON(res, 429, { ok: false, code: 'rate_limit', correlationId: cid }); return }
      const parsedBody = parseOrSendValidationError(res, ZMapConsentBody, json, cid)
      if (!parsedBody.ok) return
      const v = parsedBody.data
      const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
      if (!profile) { sendJSON(res, 404, { ok: false, code: 'PROFILE_NOT_FOUND', correlationId: cid }); return }
      await prisma.privacySettings.upsert({
        where: { profileId: profile.id },
        update: { mapConsent: v.consent, mapConsentAt: v.consent ? new Date() : null },
        create: { profileId: profile.id, mapConsent: v.consent, mapConsentAt: v.consent ? new Date() : null, incognito: false, hideDistance: false, profileVisible: true },
      })
      if (!v.consent) {
        await prisma.profile.update({ where: { id: profile.id }, data: { geoHash: null, locationUpdatedAt: null } })
      }
      sendJSON(res, 200, { ok: true })
    } catch (err) {
      console.error(err)
      sendJSON(res, 500, { ok: false, error: 'Error interno' })
    }
    return
  }

  if (method === 'POST' && pathname === '/api/map/location') {
    try {
      const json = await readJsonLimitedCommon(req, 32 * 1024)
      const cid = getCorrelationId(req)
      const user = await getAuthedUserFromInitData(json.initData || '')
      if (!user) { sendJSON(res, 401, { ok: false, code: 'UNAUTH', message: 'initData inválido', correlationId: cid }); return }
      if (!checkRate(user.id, 'map_location', 5, 60_000)) { sendJSON(res, 429, { ok: false, code: 'rate_limit', correlationId: cid }); return }
      const parsedBody = parseOrSendValidationError(res, ZMapLocationBody, json, cid)
      if (!parsedBody.ok) return
      const v = parsedBody.data
      const privacy = await prisma.privacySettings.findFirst({ where: { profile: { userId: user.id } } })
      if (!privacy?.mapConsent) { sendJSON(res, 403, { ok: false, code: 'CONSENT_REQUIRED', correlationId: cid }); return }
      const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
      if (!profile) { sendJSON(res, 404, { ok: false, code: 'PROFILE_NOT_FOUND', correlationId: cid }); return }
      const gh = geohashEncode(v.lat, v.lon, 6)
      await prisma.profile.update({
        where: { id: profile.id },
        data: { latitude: v.lat, longitude: v.lon, geoHash: gh, locationUpdatedAt: new Date() },
      })
      sendJSON(res, 200, { ok: true })
    } catch (err) {
      console.error(err)
      sendJSON(res, 500, { ok: false, error: 'Error interno' })
    }
    return
  }
  if (method === 'POST' && pathname === '/api/mod/verify') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const json = JSON.parse(body || '{}')
        const cid = getCorrelationId(req)
        const parsedBody = parseOrSendValidationError(res, ZModVerifyBody, json, cid)
        if (!parsedBody.ok) return
        const demoHeader = String(req.headers['x-demo-secret'] || '')
        if (demoAllowed && demoSecret && demoHeader === demoSecret && json.initData === 'demo_init_data') {
        } else {
          const validation = validateInitData(json.initData || '', botToken)
          if (!validation.valid || !isModerator(validation.user)) {
            sendJSON(res, 401, { ok: false, error: 'unauthorized' })
            return
          }
          if (!checkRate(String(validation.user.id), 'mod_verify', 60, 60_000)) {
            sendJSON(res, 429, { ok: false, error: 'rate_limit' })
            return
          }
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
        const cid = getCorrelationId(req)
        const parsedBody = parseOrSendValidationError(res, ZModBlockBody, json, cid)
        if (!parsedBody.ok) return
        const demoHeader = String(req.headers['x-demo-secret'] || '')
        if (demoAllowed && demoSecret && demoHeader === demoSecret && json.initData === 'demo_init_data') {
        } else {
          const validation = validateInitData(json.initData || '', botToken)
          if (!validation.valid || !isModerator(validation.user)) {
            sendJSON(res, 401, { ok: false, error: 'unauthorized' })
            return
          }
          if (!checkRate(String(validation.user.id), 'mod_block', 30, 60_000)) {
            sendJSON(res, 429, { ok: false, error: 'rate_limit' })
            return
          }
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

  if (method === 'POST' && pathname === '/api/me/export') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const json = JSON.parse(body || '{}')
        const cid = getCorrelationId(req)
        const parsedBody = parseOrSendValidationError(res, ZExportBody, json, cid)
        if (!parsedBody.ok) return
        const user = await getAuthedUserFromInitData(json.initData || '')
        if (!user) {
          sendJSON(res, 401, { ok: false, error: 'initData inválido', correlationId: cid })
          return
        }
        if (!checkRate(user.id, 'export', 2, 60_000)) {
          sendJSON(res, 429, { ok: false, error: 'rate_limit', correlationId: cid })
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
        const exportData = {
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
        }
        const fmt = parsedBody.data.format
        if (fmt === 'csv') {
          const rows = exportToCsvRows(exportData)
          const csv = toCsv(rows, ['type','userId','username','displayName','telegramId','id','fromUserId','toUserId','content','blockerUserId','blockedUserId','reporterUserId','reportedUserId','reason','aUserId','bUserId','createdAt','updatedAt','pronouns','gender','city','profileVisible','incognito','hideDistance'])
          sendJSON(res, 200, { ok: true, format: 'csv', csv, correlationId: cid })
        } else {
          sendJSON(res, 200, { ok: true, format: 'json', data: exportData, correlationId: cid })
        }
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
        if (demoAllowed && json.initData === 'demo_init_data' && json.reportedUserId) {
          const me = await getAuthedUserFromInitData(json.initData || '')
          if (!me) { sendJSON(res, 401, { ok: false, error: 'initData inválido' }); return }
          const reportedUserId = String(json.reportedUserId || '')
          const reported = await prisma.user.findUnique({ where: { id: reportedUserId } })
          if (!reported) { sendJSON(res, 404, { ok: false, error: 'Usuario no encontrado' }); return }
          await prisma.report.create({ data: { reporterId: me.id, reportedId: reported.id, reason: json.reason || 'Sin detalle' } })
        } else {
          const cid = getCorrelationId(req)
          const parsedBody = parseOrSendValidationError(res, ZReportBody, json, cid)
          if (!parsedBody.ok) return
          if (!botToken) { sendJSON(res, 500, { ok: false, error: 'BOT_TOKEN no configurado' }); return }
          const validation = validateInitData(json.initData || '', botToken)
          if (!validation.valid) { sendJSON(res, 401, { ok: false, error: 'initData inválido' }); return }
          if (!checkRate(String(validation.user.id), 'report', 5, 60_000)) { sendJSON(res, 429, { ok: false, error: 'rate_limit' }); return }
          const reporter = validation.user
          const reportedTelegramId = String(json.reportedTelegramId || '')
          if (!reportedTelegramId) { sendJSON(res, 400, { ok: false, error: 'reportedTelegramId requerido' }); return }
          const reported = await prisma.user.findFirst({ where: { telegramId: reportedTelegramId } })
          if (!reported) { sendJSON(res, 404, { ok: false, error: 'Usuario no encontrado' }); return }
          const reporterUser = await prisma.user.upsert({
            where: { telegramId: String(reporter.id) },
            update: { username: reporter.username || '' },
            create: { telegramId: String(reporter.id), username: reporter.username || '', displayName: reporter.first_name || 'Usuario', language: reporter.language_code || 'es' },
          })
          await prisma.report.create({ data: { reporterId: reporterUser.id, reportedId: reported.id, reason: json.reason || 'Sin detalle' } })
        }
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
        if (demoAllowed && json.initData === 'demo_init_data' && json.blockedUserId) {
          const me = await getAuthedUserFromInitData(json.initData || '')
          if (!me) { sendJSON(res, 401, { ok: false, error: 'initData inválido' }); return }
          const blockedUserId = String(json.blockedUserId || '')
          const blocked = await prisma.user.findUnique({ where: { id: blockedUserId } })
          if (!blocked) { sendJSON(res, 404, { ok: false, error: 'Usuario no encontrado' }); return }
          await prisma.block.upsert({
            where: { blockerId_blockedId: { blockerId: me.id, blockedId: blocked.id } },
            update: {},
            create: { blockerId: me.id, blockedId: blocked.id },
          })
        } else {
          const cid = getCorrelationId(req)
          const parsedBody = parseOrSendValidationError(res, ZBlockBody, json, cid)
          if (!parsedBody.ok) return
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
        }
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
