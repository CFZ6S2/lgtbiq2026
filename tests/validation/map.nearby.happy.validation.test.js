import assert from 'node:assert/strict'

const base = 'http://localhost:8081'
const DEMO_INIT_DATA = 'demo_init_data'

async function post(path, body) {
  const r = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await r.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: r.status, json }
}
async function get(path) {
  const r = await fetch(base + path)
  const text = await r.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: r.status, json }
}

async function main() {
  const c1 = await post('/api/map/consent', { initData: DEMO_INIT_DATA, consent: true })
  assert.equal(c1.status, 200)
  const loc1 = await post('/api/map/location', { initData: DEMO_INIT_DATA, lat: 40.4168, lon: -3.7038 })
  assert.equal(loc1.status, 200)
  const r = await get(`/api/map/nearby?initData=${encodeURIComponent(DEMO_INIT_DATA)}&lat=40.4168&lon=-3.7038&radiusKm=5`)
  assert.equal(r.status, 200)
  assert.equal(r.json?.ok, true)
  assert.ok(Array.isArray(r.json.locations))
  console.log('map.nearby.happy.validation.test.js OK')
}

main().catch(err => { console.error(err); process.exit(1) })
