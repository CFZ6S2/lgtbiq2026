import { validateInitData } from './validateInitData.js'
import { z } from 'zod'

export function sendJSON(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(payload))
}

export function isModerator(modAdmins, tgUser) {
  if (!tgUser?.id) return false
  return modAdmins.includes(String(tgUser.id))
}

export function checkRate(rateLimits, userId, key, max, windowMs) {
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

export function haversineKm(a, b) {
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

export function readJsonLimited(req, maxBytes) {
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

export async function getAuthedUserFromInitData(initData, { botToken, demoAllowed, prisma }) {
  if (!initData) return null
  if (demoAllowed && initData === 'demo_init_data') {
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

export function validateTypingPayload(json) {
  const peer = String(json.peerUserId || '')
  const active = json.active === true || json.active === false ? json.active : !!json.active
  if (!peer) return { ok: false }
  return { ok: true, peerUserId: peer, active }
}

export function validateSendPayload(json) {
  const toUserId = String(json.toUserId || '')
  let content = String(json.content || '')
  if (!toUserId || !content) return { ok: false }
  if (content.length > 1000) content = content.slice(0, 1000)
  return { ok: true, toUserId, content }
}

export function validateMarkReadPayload(json) {
  const peer = String(json.peerUserId || '')
  const upTo = json.upToMessageId != null ? String(json.upToMessageId) : null
  if (!peer) return { ok: false }
  return { ok: true, peerUserId: peer, upToMessageId: upTo }
}

export function validateIncognitoPayload(json) {
  const incognito = !!json.incognito
  return { ok: true, incognito }
}

export function validateRecsPayload(json) {
  const filterOrientations = Array.isArray(json.filterOrientations) ? json.filterOrientations.filter(s => typeof s === 'string') : null
  const intentsFriends = typeof json.intentsFriends === 'boolean' ? json.intentsFriends : undefined
  const intentsRomance = typeof json.intentsRomance === 'boolean' ? json.intentsRomance : undefined
  const intentsPoly = typeof json.intentsPoly === 'boolean' ? json.intentsPoly : undefined
  const maxDistanceKm = typeof json.maxDistanceKm === 'number' && json.maxDistanceKm >= 0 ? json.maxDistanceKm : undefined
  return { ok: true, filterOrientations, intentsFriends, intentsRomance, intentsPoly, maxDistanceKm }
}

export async function isBlockedBetween(prisma, aId, bId) {
  const row = await prisma.block.findFirst({
    where: { OR: [{ blockerId: aId, blockedId: bId }, { blockerId: bId, blockedId: aId }] },
  })
  return !!row
}

export async function isIncognito(prisma, userId) {
  const profile = await prisma.profile.findUnique({ where: { userId }, include: { privacy: true } })
  return !!(profile?.privacy?.incognito)
}

export async function isPeerVisible(prisma, peerUserId) {
  const profile = await prisma.profile.findUnique({ where: { userId: peerUserId }, include: { privacy: true } })
  const visible = profile?.privacy?.profileVisible
  return visible === undefined ? true : !!visible
}

export async function assertChatAllowed(prisma, meId, peerId, opts = {}) {
  const blocked = await isBlockedBetween(prisma, meId, peerId)
  if (blocked) return { ok: false, error: 'blocked' }
  if (opts.checkIncognitoSender) {
    const inc = await isIncognito(prisma, meId)
    if (inc) return { ok: false, error: 'incognito' }
  }
  if (opts.checkPeerVisibility) {
    const vis = await isPeerVisible(prisma, peerId)
    if (!vis) return { ok: false, error: 'peer_hidden' }
  }
  return { ok: true }
}

function zodIssues(error) {
  return error.issues.map(i => ({ path: i.path.join('.'), message: i.message, code: i.code }))
}

export function parseOrSendValidationError(res, schema, data, correlationId) {
  const r = schema.safeParse(data)
  if (r.success) return { ok: true, data: r.data }
  const details = zodIssues(r.error)
  sendJSON(res, 400, { ok: false, code: 'VALIDATION_ERROR', message: 'Invalid request payload', details, correlationId })
  return { ok: false }
}

export const ZTypingBody = z.object({
  peerUserId: z.string().trim().min(1).max(128),
  active: z.boolean(),
})

export const ZSendBody = z.object({
  toUserId: z.string().trim().min(1).max(128),
  content: z.string().trim().min(1).max(1000),
})

export const ZMarkReadBody = z.object({
  peerUserId: z.string().trim().min(1).max(128),
  upToMessageId: z.string().trim().min(1).max(128).optional(),
})

export const ZReportBody = z.object({
  reportedTelegramId: z.string().trim().min(1).max(64),
  reason: z.string().trim().min(1).max(200).optional(),
}).strict()

export const ZBlockBody = z.object({
  blockedTelegramId: z.string().trim().min(1).max(64),
}).strict()

export const ZModBlockBody = z.object({
  blockerUserId: z.string().trim().min(1).max(64),
  blockedUserId: z.string().trim().min(1).max(64),
}).strict()

export const ZModVerifyBody = z.object({
  userId: z.string().trim().min(1).max(64),
}).strict()

export const ZExportBody = z.object({
  format: z.enum(['json', 'csv']).default('json'),
}).strict()

export const ZDeleteBody = z.object({
  confirm: z.literal(true),
}).strict()

export function csvEscape(value) {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv(rows, headerOrder) {
  const headers = headerOrder && headerOrder.length
    ? headerOrder
    : Array.from(rows.reduce((set, r) => {
        Object.keys(r || {}).forEach(k => set.add(k))
        return set
      }, new Set()))
  const lines = []
  lines.push(headers.map(csvEscape).join(','))
  for (const r of rows) {
    lines.push(headers.map(h => csvEscape(r?.[h])).join(','))
  }
  return lines.join('\n')
}

export function exportToCsvRows(exportData) {
  const rows = []
  if (exportData.user) {
    rows.push({
      type: 'user',
      userId: exportData.user.id,
      username: exportData.user.username,
      displayName: exportData.user.displayName,
      telegramId: exportData.user.telegramId,
    })
  }
  if (exportData.profile) {
    rows.push({
      type: 'profile',
      userId: exportData.profile.userId,
      pronouns: exportData.profile.pronouns,
      gender: exportData.profile.gender,
      city: exportData.profile.city,
      createdAt: exportData.profile.createdAt,
    })
    if (exportData.profile.privacy) {
      rows.push({
        type: 'privacy',
        profileVisible: exportData.profile.privacy.profileVisible,
        incognito: exportData.profile.privacy.incognito,
        hideDistance: exportData.profile.privacy.hideDistance,
        updatedAt: exportData.profile.privacy.updatedAt,
      })
    }
  }
  for (const m of exportData.messages || []) {
    rows.push({
      type: 'message',
      id: m.id,
      fromUserId: m.senderId,
      toUserId: m.recipientId,
      content: m.content,
      createdAt: m.createdAt,
    })
  }
  for (const b of exportData.blocksSent || []) {
    rows.push({
      type: 'block',
      blockerUserId: b.blockerId,
      blockedUserId: b.blockedId,
      createdAt: b.createdAt,
    })
  }
  for (const b of exportData.blocksRecv || []) {
    rows.push({
      type: 'block',
      blockerUserId: b.blockerId,
      blockedUserId: b.blockedId,
      createdAt: b.createdAt,
    })
  }
  for (const l of exportData.likesSent || []) {
    rows.push({
      type: 'like',
      fromUserId: l.fromId,
      toUserId: l.toId,
      createdAt: l.createdAt,
    })
  }
  for (const l of exportData.likesRecv || []) {
    rows.push({
      type: 'like',
      fromUserId: l.fromId,
      toUserId: l.toId,
      createdAt: l.createdAt,
    })
  }
  for (const mt of exportData.matches || []) {
    rows.push({
      type: 'match',
      aUserId: mt.aId,
      bUserId: mt.bId,
      createdAt: mt.createdAt,
    })
  }
  for (const r of exportData.reportsSent || []) {
    rows.push({
      type: 'report',
      reporterUserId: r.reporterId,
      reportedUserId: r.reportedId,
      reason: r.reason,
      createdAt: r.createdAt,
    })
  }
  for (const r of exportData.reportsRecv || []) {
    rows.push({
      type: 'report',
      reporterUserId: r.reporterId,
      reportedUserId: r.reportedId,
      reason: r.reason,
      createdAt: r.createdAt,
    })
  }
  return rows
}
