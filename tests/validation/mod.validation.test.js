import assert from 'node:assert/strict'

const base = 'http://localhost:8080'
const DEMO_INIT_DATA = 'demo_init_data'

async function post(path, body) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, json }
}

async function upsertUser(username) {
  const r = await post('/api/sendData', {
    profile: {
      username,
      displayName: username,
      privacy: { profileVisible: true, incognito: false },
      meta: { language: 'es' },
    },
  })
  assert.equal(r.status, 200)
  assert.equal(r.json?.ok, true)
  return r.json.userId
}

async function main() {
  const demoId = await upsertUser('demo_user')
  const peerId = await upsertUser('peer_mod_' + Date.now())

  {
    const r = await post('/api/mod/verify', { initData: DEMO_INIT_DATA, userId: peerId })
    assert.equal(r.status, 200)
    assert.equal(r.json?.ok, true)
    console.log('mod/verify -> 200 OK')
  }
  {
    const r = await post('/api/mod/block-user', { initData: DEMO_INIT_DATA, blockerUserId: demoId, blockedUserId: peerId })
    assert.equal(r.status, 200)
    assert.equal(r.json?.ok, true)
    const send = await post('/api/chat/send', { initData: DEMO_INIT_DATA, toUserId: peerId, content: 'hola' })
    assert.equal(send.status, 403)
    assert.equal(send.json?.error || send.json?.code, 'blocked')
    console.log('mod/block-user -> 200 OK and chat/send blocked -> 403')
  }
  console.log('mod.validation.test.js OK')
}

main().catch(err => { console.error(err); process.exit(1) })
