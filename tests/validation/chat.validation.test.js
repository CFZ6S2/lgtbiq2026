import assert from 'assert'

const base = 'http://localhost:8080'
const DEMO_INIT_DATA = 'demo_init_data'

async function post(path, body) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-request-id': 'val-' + Date.now() },
    body: JSON.stringify(body || {}),
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, json }
}

function expectValidationError(r) {
  assert.strictEqual(r.status, 400)
  assert.ok(r.json)
  assert.strictEqual(r.json.ok, false)
  assert.strictEqual(r.json.code, 'VALIDATION_ERROR')
  assert.ok(Array.isArray(r.json.details))
  assert.ok(r.json.correlationId)
}

async function main() {
  {
    const r = await post('/api/chat/send', { initData: DEMO_INIT_DATA, content: 'hola' })
    expectValidationError(r)
    console.log('send missing toUserId -> VALIDATION_ERROR OK')
  }
  {
    const r = await post('/api/chat/send', { initData: DEMO_INIT_DATA, toUserId: 'u_123' })
    expectValidationError(r)
    console.log('send missing content -> VALIDATION_ERROR OK')
  }
  {
    const r = await post('/api/chat/typing', { initData: DEMO_INIT_DATA, peerUserId: 'u_123', active: 'yes' })
    expectValidationError(r)
    console.log('typing invalid active -> VALIDATION_ERROR OK')
  }
  {
    const r = await post('/api/chat/mark-read', { initData: DEMO_INIT_DATA })
    expectValidationError(r)
    console.log('mark-read missing peerUserId -> VALIDATION_ERROR OK')
  }
  {
    const r = await post('/api/block', { initData: DEMO_INIT_DATA })
    expectValidationError(r)
    console.log('block missing blockedTelegramId -> VALIDATION_ERROR OK')
  }
  {
    const r = await post('/api/me/delete', { initData: DEMO_INIT_DATA, confirm: false })
    expectValidationError(r)
    console.log('delete confirm must be true -> VALIDATION_ERROR OK')
  }
  {
    const r1 = await post('/api/chat/send', { initData: DEMO_INIT_DATA, toUserId: '' })
    const r2 = await post('/api/chat/typing', { initData: DEMO_INIT_DATA, peerUserId: '', active: true })
    expectValidationError(r1)
    expectValidationError(r2)
    const keys1 = Object.keys(r1.json).sort()
    const keys2 = Object.keys(r2.json).sort()
    assert.deepStrictEqual(keys1, keys2)
    console.log('parity of error shape across endpoints OK')
  }
  console.log('Validation tests passed')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
