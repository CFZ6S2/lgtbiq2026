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
}

main().then(() => console.log('API basic tests passed')).catch(err => {
  console.error(err)
  process.exit(1)
})
