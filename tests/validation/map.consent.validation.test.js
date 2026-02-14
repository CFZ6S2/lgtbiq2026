import assert from 'node:assert/strict'

const base = 'http://localhost:8081'
const DEMO_INIT_DATA = 'demo_init_data'

async function get(path) {
  const r = await fetch(base + path)
  const text = await r.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: r.status, json }
}

async function main() {
  const r = await get(`/api/map/nearby?initData=${encodeURIComponent(DEMO_INIT_DATA)}`)
  assert.equal(r.status, 409)
  assert.equal(r.json?.code, 'CONSENT_REQUIRED')
  console.log('map.consent.validation.test.js OK')
}

main().catch(err => { console.error(err); process.exit(1) })
