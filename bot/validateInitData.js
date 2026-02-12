import crypto from 'crypto'
export function validateInitData(initData, botToken) {
  // Modo demo para desarrollo local
  if (initData === 'demo_init_data') {
    return { 
      valid: true, 
      user: { 
        id: 123456789, 
        first_name: 'Demo', 
        last_name: 'User',
        username: 'demo_user',
        language_code: 'es'
      }
    }
  }

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return { valid: false }

  const dataCheckArr = []
  for (const [k, v] of params) {
    if (k === 'hash') continue
    dataCheckArr.push(`${k}=${v}`)
  }
  dataCheckArr.sort()
  const dataCheckString = dataCheckArr.join('\n')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  const valid = computedHash === hash
  if (!valid) return { valid: false }

  const userRaw = params.get('user')
  let user = null
  if (userRaw) {
    try {
      user = JSON.parse(decodeURIComponent(userRaw))
    } catch {}
  }

  return { valid: true, user }
}
