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

async function upsertPeer() {
  const username = 'peer_report_' + Date.now()
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
  const peerId = await upsertPeer()
  const r = await post('/api/report', { initData: DEMO_INIT_DATA, reportedUserId: peerId, reason: 'spam' })
  assert.equal(r.status, 200)
  assert.equal(r.json?.ok, true)
  console.log('report.validation.test.js OK')
}

main().catch(err => { console.error(err); process.exit(1) })
