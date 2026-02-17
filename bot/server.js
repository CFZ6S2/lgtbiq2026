import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'
import url from 'url'
import { validateInitData } from './validateInitData.js'
import { db } from './firebase.js'
import { getCorrelationId, log } from './logger.js'
import { sendJSON as sendJSONCommon, isModerator as isModeratorCommon, checkRate as checkRateCommon, haversineKm as haversineKmCommon, readJsonLimited as readJsonLimitedCommon } from './common-firebase.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const webRoot = path.join(root, 'webapp')
const docsRoot = path.join(root, 'docs')
const uploadsRoot = path.join(root, 'uploads')
const rateLimits = new Map()

function checkRate(userId, key, max, windowMs) {
  return checkRateCommon(rateLimits, userId, key, max, windowMs)
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080
const botToken = process.env.BOT_TOKEN || ''
const apiBase = botToken ? `https://api.telegram.org/bot${botToken}` : ''
const modAdmins = (process.env.MOD_ADMINS || '').split(',').map(s => s.trim()).filter(Boolean)
const subscribers = new Map()
const haversineKm = haversineKmCommon
const featureMap = process.env.FEATURE_MAP === 'true'
const mapPaid = process.env.MAP_PAID === 'true'
const mapRequireConsent = process.env.MAP_REQUIRE_CONSENT === 'true'
const mapGeohashOutPrecision = process.env.MAP_GEOHASH_OUT_PRECISION ? parseInt(process.env.MAP_GEOHASH_OUT_PRECISION, 10) : 0
const mapJitterMinM = process.env.MAP_JITTER_MIN_M ? parseInt(process.env.MAP_JITTER_MIN_M, 10) : 80
const mapJitterMaxM = process.env.MAP_JITTER_MAX_M ? parseInt(process.env.MAP_JITTER_MAX_M, 10) : 250

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

function sendJSON(res, status, payload) {
  sendJSONCommon(res, status, payload)
}

function isModerator(tgUser) {
  return isModeratorCommon(modAdmins, tgUser)
}

// getCorrelationId and log are imported from logger.js

// Simplified handlers for Firebase
async function handleHealth(req, res) {
  const correlationId = getCorrelationId()
  sendJSON(res, 200, { ok: true, timestamp: Date.now(), correlationId })
}

async function handleSendData(req, res) {
  const correlationId = getCorrelationId()
  try {
    const body = await readJsonLimitedCommon(req, 1024 * 1024)
    const { initData, profile } = body
    
    if (!initData || !profile) {
      return sendJSON(res, 400, { ok: false, error: 'Missing required fields', correlationId })
    }

    // Validate init data
    const validation = validateInitData(initData, botToken)
    if (!validation.valid || !validation.user?.id) {
      return sendJSON(res, 401, { ok: false, error: 'Invalid init data', correlationId })
    }

    const userId = String(validation.user.id)
    
    // For now, just return success
    // TODO: Implement proper Firebase data storage
    sendJSON(res, 200, { 
      ok: true, 
      message: 'Data received successfully (Firebase version)',
      correlationId 
    })
  } catch (error) {
    log('error', 'handleSendData error', { error: error.message, correlationId })
    sendJSON(res, 500, { ok: false, error: 'Internal server error', correlationId })
  }
}

async function handleMatches(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase matches
  sendJSON(res, 200, { ok: true, matches: [], correlationId })
}

async function handleChatHistory(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase chat history
  sendJSON(res, 200, { ok: true, messages: [], correlationId })
}

async function handleSendMessage(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase message sending
  sendJSON(res, 200, { ok: true, messageId: 'temp_' + Date.now(), correlationId })
}

async function handleTyping(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase typing indicator
  sendJSON(res, 200, { ok: true, correlationId })
}

async function handleMarkRead(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase mark as read
  sendJSON(res, 200, { ok: true, correlationId })
}

async function handleExport(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase data export
  sendJSON(res, 200, { ok: true, csv: '', correlationId })
}

async function handleDelete(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase data deletion
  sendJSON(res, 200, { ok: true, correlationId })
}

async function handleReport(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase reporting
  sendJSON(res, 200, { ok: true, correlationId })
}

async function handleBlock(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase blocking
  sendJSON(res, 200, { ok: true, correlationId })
}

async function handleModerationBlock(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase moderation
  sendJSON(res, 200, { ok: true, correlationId })
}

async function handleModerationVerify(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase verification
  sendJSON(res, 200, { ok: true, correlationId })
}

async function handleModerationReports(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase moderation reports
  sendJSON(res, 200, { ok: true, reports: [], correlationId })
}

async function handleRecs(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase recommendations
  sendJSON(res, 200, { ok: true, recs: [], correlationId })
}

async function handleOrientations(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase orientations
  sendJSON(res, 200, { ok: true, orientations: [], correlationId })
}

async function handlePrivacySettings(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase privacy settings
  sendJSON(res, 200, { ok: true, privacy: {}, correlationId })
}

async function handleMapNearby(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase map nearby
  sendJSON(res, 200, { ok: true, nearby: [], correlationId })
}

async function handleMapConsent(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase map consent
  sendJSON(res, 200, { ok: true, correlationId })
}

async function handleMapLocation(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase map location
  sendJSON(res, 200, { ok: true, correlationId })
}

async function handleStats(req, res) {
  const correlationId = getCorrelationId()
  // TODO: Implement Firebase stats
  sendJSON(res, 200, { ok: true, stats: {}, correlationId })
}

const server = http.createServer((req, res) => {
  const correlationId = getCorrelationId()
  const path = url.parse(req.url).pathname
  const method = req.method

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  try {
    switch (true) {
      case method === 'GET' && path === '/health':
        return handleHealth(req, res)
      case method === 'POST' && path === '/api/sendData':
        return handleSendData(req, res)
      case method === 'POST' && path === '/api/matches':
        return handleMatches(req, res)
      case method === 'POST' && path === '/api/chatHistory':
        return handleChatHistory(req, res)
      case method === 'POST' && path === '/api/sendMessage':
        return handleSendMessage(req, res)
      case method === 'POST' && path === '/api/typing':
        return handleTyping(req, res)
      case method === 'POST' && path === '/api/markRead':
        return handleMarkRead(req, res)
      case method === 'POST' && path === '/api/export':
        return handleExport(req, res)
      case method === 'POST' && path === '/api/delete':
        return handleDelete(req, res)
      case method === 'POST' && path === '/api/report':
        return handleReport(req, res)
      case method === 'POST' && path === '/api/block':
        return handleBlock(req, res)
      case method === 'POST' && path === '/api/mod/block':
        return handleModerationBlock(req, res)
      case method === 'POST' && path === '/api/mod/verify':
        return handleModerationVerify(req, res)
      case method === 'POST' && path === '/api/mod/reports':
        return handleModerationReports(req, res)
      case method === 'POST' && path === '/api/recs':
        return handleRecs(req, res)
      case method === 'POST' && path === '/api/orientations':
        return handleOrientations(req, res)
      case method === 'POST' && path === '/api/privacy':
        return handlePrivacySettings(req, res)
      case method === 'POST' && path === '/api/map/nearby':
        return handleMapNearby(req, res)
      case method === 'POST' && path === '/api/map/consent':
        return handleMapConsent(req, res)
      case method === 'POST' && path === '/api/map/location':
        return handleMapLocation(req, res)
      case method === 'POST' && path === '/api/stats':
        return handleStats(req, res)
      default:
        serveFile(res, path.join(webRoot, 'index.html'), 'text/html')
    }
  } catch (error) {
    log('error', 'Server error', { error: error.message, path, method, correlationId })
    sendJSON(res, 500, { ok: false, error: 'Internal server error', correlationId })
  }
})

server.listen(port, () => {
  log('info', 'Server started', { port, featureMap, mapPaid, mapRequireConsent })
})