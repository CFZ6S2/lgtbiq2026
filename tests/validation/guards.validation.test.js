import assert from 'node:assert/strict'

const BASES = (process.env.TEST_BASES || process.env.TEST_BASE || 'http://localhost:8080').split(',').map(s => s.trim()).filter(Boolean)
const DEMO_INIT = 'demo_init_data'

async function post(base, path, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let json = null
  try { json = await res.json() } catch { /* ignore */ }
  return { status: res.status, json }
}
function getCode(j) {
  return j?.code || j?.error
}

async function upsertUserProfile(base, { username, profileVisible = true, incognito = false }) {
  const { status, json } = await post(base, '/api/sendData', {
    profile: {
      username,
      displayName: username,
      privacy: { profileVisible, incognito },
      meta: { language: 'es' },
    },
  })
  assert.equal(status, 200)
  assert.equal(json?.ok, true)
  assert.ok(json?.userId)
  return json.userId
}

async function setIncognito(base, incognito) {
  const { status, json } = await post(base, '/api/privacy/incognito', { initData: DEMO_INIT, incognito })
  assert.equal(status, 200)
  assert.equal(json?.ok, true)
}

async function chatSend(base, toUserId, content = 'ping') {
  return post(base, '/api/chat/send', { initData: DEMO_INIT, toUserId, content })
}
async function chatHistory(base, peerUserId) {
  return post(base, '/api/chat/history', { initData: DEMO_INIT, peerUserId, limit: 10 })
}

async function blockPeer(base, peerUserId) {
  return post(base, '/api/block', { initData: DEMO_INIT, blockedUserId: peerUserId })
}

async function main() {
  for (const base of BASES) {
    await upsertUserProfile(base, { username: 'demo_user', profileVisible: true, incognito: false })
    {
      const peerId = await upsertUserProfile(base, { username: `peer_inc_${Date.now()}`, profileVisible: true })
      await setIncognito(base, true)
      const r = await chatSend(base, peerId, 'hola')
      assert.equal(r.status, 403)
      assert.equal(getCode(r.json), 'incognito')
      await setIncognito(base, false)
      console.log(`[${base}] guard incognito send -> 403/incognito OK`)
    }
    {
      const peerId = await upsertUserProfile(base, { username: `peer_blk_${Date.now()}`, profileVisible: true })
      const b = await blockPeer(base, peerId)
      assert.equal(b.status, 200)
      const r = await chatSend(base, peerId, 'hola')
      assert.equal(r.status, 403)
      assert.equal(getCode(r.json), 'blocked')
      console.log(`[${base}] guard blocked send -> 403/blocked OK`)
    }
    {
      const peerId = await upsertUserProfile(base, { username: `peer_hid_${Date.now()}`, profileVisible: false })
      const r = await chatHistory(base, peerId)
      assert.equal(r.status, 403)
      assert.equal(getCode(r.json), 'peer_hidden')
      console.log(`[${base}] guard peer_hidden history -> 403/peer_hidden OK`)
    }
  }

  console.log('guards.validation.test.js OK')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
