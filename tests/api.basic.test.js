import assert from 'assert'

const base = 'http://localhost:8080'

async function post(path, body) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-request-id': 'test-' + Date.now() },
    body: JSON.stringify(body || {}),
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, json }
}

async function main() {
  const sendUnauth = await post('/api/chat/send', { content: 'hola' })
  assert.strictEqual(sendUnauth.status, 401)
  console.log('send unauth OK')

  const historyBad = await post('/api/chat/history', { initData: 'demo_init_data' })
  assert.strictEqual(historyBad.status, 400)
  console.log('history peer required OK')

  const typingOk = await post('/api/chat/typing', { initData: 'demo_init_data', peerUserId: 'demo_peer', active: true })
  assert.ok([200, 401, 400].includes(typingOk.status))
  console.log('typing route reachable OK')

  const incognitoOk = await post('/api/privacy/incognito', { initData: 'demo_init_data', incognito: true })
  assert.ok([200, 401].includes(incognitoOk.status))
  console.log('incognito toggle reachable OK')
}

main().then(() => console.log('API basic tests passed')).catch(err => {
  const msg = String(err?.message || err)
  if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
    console.log('API tests skipped: server not running')
    process.exit(0)
  } else {
    console.error(err)
    process.exit(1)
  }
})
