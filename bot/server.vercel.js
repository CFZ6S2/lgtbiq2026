import url from 'url'
import fs from 'fs'
import path from 'path'
import { validateInitData } from './validateInitData.js'
import { prisma } from './db.js'
import { getCorrelationId, log } from './logger.js'
import { sendJSON, isModerator, haversineKm, handleProfileSubmission as handleProfileSubmissionShared, getAuthedUserFromInitData as getAuthedUserFromInitDataShared, subscribers as sharedSubs, addSubscriber, removeSubscriber, emitTo, checkRate, isBlockedBetween, isIncognito } from './shared.js'

const botToken = process.env.BOT_TOKEN || ''
const modAdmins = (process.env.MOD_ADMINS || '').split(',').map(s => s.trim()).filter(Boolean)
const subscribers = new Map()
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

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const webRoot = path.join(root, 'webapp')
const docsRoot = path.join(root, 'docs')

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
const subscribers = sharedSubs

async function handleProfileSubmission(data, user) {
  return handleProfileSubmissionShared(prisma, data, user)
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
  const allowDemo = process.env.NODE_ENV !== 'production'
  return getAuthedUserFromInitDataShared(prisma, validateInitData, botToken, initData, allowDemo)
}

export default async function handler(req, res) {
  const parsed = url.parse(req.url, true)
  const method = req.method
  const pathname = parsed.pathname

  if (method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    serveFile(res, path.join(webRoot, 'index.html'), 'text/html; charset=utf-8')
    return
  }
  if (method === 'GET' && pathname === '/webapp/styles.css') {
    serveFile(res, path.join(webRoot, 'styles.css'), 'text/css; charset=utf-8')
    return
  }
  if (method === 'GET' && pathname === '/webapp/app.js') {
    serveFile(res, path.join(webRoot, 'app.js'), 'application/javascript; charset=utf-8')
    return
  }
  if (method === 'GET' && pathname === '/docs/privacidad.md') {
    serveFile(res, path.join(docsRoot, 'privacidad.md'), 'text/markdown; charset=utf-8')
    return
  }
  if (method === 'GET' && pathname === '/docs/terminos.md') {
    serveFile(res, path.join(docsRoot, 'terminos.md'), 'text/markdown; charset=utf-8')
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
        log('error', 'vercel_sendData_failed', { cid: getCorrelationId(req), error: String(err?.message || err) })
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
        log('error', 'vercel_recs_failed', { cid: getCorrelationId(req), error: String(err?.message || err) })
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

  if (method === 'POST' && pathname === '/api/privacy/incognito') {
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

  if (method === 'POST' && pathname === '/api/chat/mark-read') {
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
        const whereBase = {
          senderId: peerId,
          recipientId: user.id,
          readAt: null,
        }
        const blocked = await isBlockedBetween(prisma, user.id, peerId)
        if (blocked) {
          sendJSON(res, 403, { ok: false, error: 'blocked' })
          return
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
    addSubscriber(key, res)
    req.on('close', () => {
      removeSubscriber(key, res)
    })
    return
  }

  if (method === 'POST' && pathname === '/api/chat/typing') {
    try {
      const json = await readJsonLimited(req, 64 * 1024)
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
        if (await isIncognito(prisma, user.id)) {
          sendJSON(res, 403, { ok: false, error: 'incognito' })
          return
        }
        if (await isBlockedBetween(prisma, user.id, target.id)) {
          sendJSON(res, 403, { ok: false, error: 'blocked' })
          return
        }
        if (!checkRate(user.id, 'send', 30, 60_000)) {
          sendJSON(res, 429, { ok: false, error: 'rate_limit' })
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
        const payload = {
          id: msg.id,
          fromId: user.id,
          content,
          createdAt: msg.createdAt,
        }
        emitTo(target.id, 'message', payload)
        const senderSubs = subscribers.get(user.id) || []
        const receiptPayload = JSON.stringify({
          id: msg.id,
          deliveredAt: msg.deliveredAt || null,
          readAt: null,
        })
        for (const r of senderSubs) {
          r.write(`event: receipt:update\ndata: ${receiptPayload}\n\n`)
        }
        sendJSON(res, 200, { ok: true, id: msg.id, deliveredAt: msg.deliveredAt || null })
      } catch (err) {
        console.error(err)
        sendJSON(res, 500, { ok: false, error: 'Error interno' })
      }
    })
    return
  }

  if (method === 'POST' && pathname === '/api/chat/send-media') {
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
        sendJSON(res, 501, { ok: false, error: 'no_supported_serverless' })
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
        if (!checkRate(String(validation.user.id), 'mod_block', 30, 60_000)) {
          sendJSON(res, 429, { ok: false, error: 'rate_limit' })
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
