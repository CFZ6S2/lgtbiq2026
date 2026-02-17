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

// Simplified Firebase versions - these need to be implemented properly
export async function getAuthedUserFromInitData(initData, { botToken, demoAllowed, db }) {
  if (!initData) return null
  if (demoAllowed && initData === 'demo_init_data') {
    // Create demo user in Firebase
    return { 
      id: 'demo_user', 
      username: 'demo_user', 
      displayName: 'Demo', 
      language: 'es' 
    }
  }
  if (!botToken) return null
  const validation = validateInitData(initData, botToken)
  if (!validation.valid || !validation.user?.id) return null
  const tgUser = validation.user
  
  // For now, return a simple user object
  // TODO: Implement proper Firebase user creation/retrieval
  return {
    id: String(tgUser.id),
    telegramId: String(tgUser.id),
    username: tgUser.username || '',
    displayName: tgUser.first_name || 'Usuario',
    language: tgUser.language_code || 'es',
  }
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

// Placeholder functions for Firebase - need proper implementation
export async function isBlockedBetween(db, aId, bId) {
  // TODO: Implement Firebase version
  return false
}

export async function isIncognito(db, userId) {
  // TODO: Implement Firebase version
  return false
}

export async function isPeerVisible(db, peerUserId) {
  // TODO: Implement Firebase version
  return true
}

export async function assertChatAllowed(db, meId, peerId, opts = {}) {
  const blocked = await isBlockedBetween(db, meId, peerId)
  if (blocked) return { ok: false, error: 'blocked' }
  if (opts.checkIncognitoSender) {
    const inc = await isIncognito(db, meId)
    if (inc) return { ok: false, error: 'incognito' }
  }
  if (opts.checkPeerVisibility) {
    const vis = await isPeerVisible(db, peerId)
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