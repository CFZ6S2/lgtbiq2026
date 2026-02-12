import assert from 'assert'
import { validateInitData } from '../bot/validateInitData.js'

const botToken = 'TEST_TOKEN'

{
  const r = validateInitData('demo_init_data', botToken)
  assert.strictEqual(r.valid, true)
  assert.ok(r.user)
  assert.strictEqual(r.user.username, 'demo_user')
  console.log('demo_init_data OK')
}

{
  const params = new URLSearchParams()
  params.set('user', encodeURIComponent(JSON.stringify({ id: 1, username: 'x' })))
  params.set('hash', 'bad_hash')
  const r = validateInitData(params.toString(), botToken)
  assert.strictEqual(r.valid, false)
  console.log('bad hash invalid OK')
}

console.log('validateInitData tests passed')
