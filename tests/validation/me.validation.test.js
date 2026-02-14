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

async function main() {
  {
    const r = await post('/api/me/export', { initData: DEMO_INIT_DATA, format: 'json' })
    assert.equal(r.status, 200)
    assert.equal(r.json?.ok, true)
    assert.equal(r.json?.format, 'json')
    assert.ok(r.json?.data)
    console.log('me/export valid -> 200 OK')
  }
  {
    const r = await post('/api/me/delete', { initData: DEMO_INIT_DATA, confirm: true })
    assert.equal(r.status, 200)
    assert.equal(r.json?.ok, true)
    const r2 = await post('/api/me/export', { initData: DEMO_INIT_DATA })
    assert.equal(r2.status, 200)
    assert.equal(r2.json?.ok, true)
    assert.ok(r2.json?.data)
    console.log('me/delete valid -> 200 OK and subsequent export works with empty data')
  }
  {
    const r = await post('/api/me/export', { initData: DEMO_INIT_DATA, format: 'csv' })
    assert.equal(r.status, 200)
    assert.equal(r.json?.ok, true)
    assert.equal(r.json?.format, 'csv')
    assert.ok(typeof r.json?.csv === 'string')
    assert.ok(r.json?.csv.startsWith('type,'))
    console.log('me/export csv -> 200 OK')
  }
  console.log('me.validation.test.js OK')
}

main().catch(err => { console.error(err); process.exit(1) })
