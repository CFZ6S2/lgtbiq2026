export function sendJSON(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(payload))
}

export function isModerator(modAdmins, tgUser) {
  if (!tgUser?.id) return false
  return modAdmins.includes(String(tgUser.id))
}

export function haversineKm(a, b) {
  if (!a || !b) return null
  const toRad = d => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad((b.lat ?? 0) - (a.lat ?? 0))
  const dLon = toRad((b.lon ?? 0) - (a.lon ?? 0))
  const lat1 = toRad(a.lat ?? 0)
  const lat2 = toRad(b.lat ?? 0)
  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}

export async function handleProfileSubmission(prisma, data, user) {
  let upsertUser
  if (user?.id) {
    upsertUser = await prisma.user.upsert({
      where: { telegramId: String(user.id) },
      update: {
        username: user.username || data.username || '',
        displayName: data.displayName,
        language: data.meta?.language || 'es',
      },
      create: {
        telegramId: String(user.id),
        username: user.username || data.username || '',
        displayName: data.displayName,
        language: data.meta?.language || 'es',
      },
    })
  } else if (data.username) {
    upsertUser = await prisma.user.upsert({
      where: { username: data.username },
      update: {
        displayName: data.displayName,
        language: data.meta?.language || 'es',
      },
      create: {
        username: data.username,
        displayName: data.displayName,
        language: data.meta?.language || 'es',
      },
    })
  } else {
    upsertUser = await prisma.user.create({
      data: {
        displayName: data.displayName,
        language: data.meta?.language || 'es',
      },
    })
  }
  const orientationNames = data.orientation || []
  const orientations = await Promise.all(
    orientationNames.map(name =>
      prisma.orientation.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  )
  const profile = await prisma.profile.upsert({
    where: { userId: upsertUser.id },
    update: {
      pronouns: data.pronouns,
      gender: data.gender,
      genderCustom: data.genderCustom,
      intentsFriends: data.intents?.lookingFriends || false,
      intentsRomance: data.intents?.lookingRomance || false,
      intentsPoly: data.intents?.lookingPoly || false,
      transInclusive: data.intents?.transInclusive !== false,
      city: data.location?.city || null,
      latitude: typeof data.location?.latitude === 'number' ? data.location.latitude : null,
      longitude: typeof data.location?.longitude === 'number' ? data.location.longitude : null,
      orientations: { set: orientations.map(o => ({ id: o.id })) },
    },
    create: {
      userId: upsertUser.id,
      pronouns: data.pronouns,
      gender: data.gender,
      genderCustom: data.genderCustom,
      intentsFriends: data.intents?.lookingFriends || false,
      intentsRomance: data.intents?.lookingRomance || false,
      intentsPoly: data.intents?.lookingPoly || false,
      transInclusive: data.intents?.transInclusive !== false,
      city: data.location?.city || null,
      latitude: typeof data.location?.latitude === 'number' ? data.location.latitude : null,
      longitude: typeof data.location?.longitude === 'number' ? data.location.longitude : null,
      orientations: { connect: orientations.map(o => ({ id: o.id })) },
    },
  })
  await prisma.privacySettings.upsert({
    where: { profileId: profile.id },
    update: {
      incognito: data.privacy?.incognito || false,
      hideDistance: data.privacy?.hideDistance || false,
      profileVisible: data.privacy?.profileVisible !== false,
    },
    create: {
      profileId: profile.id,
      incognito: data.privacy?.incognito || false,
      hideDistance: data.privacy?.hideDistance || false,
      profileVisible: data.privacy?.profileVisible !== false,
    },
  })
  return upsertUser
}

export async function getAuthedUserFromInitData(prisma, validateInitData, botToken, initData, allowDemo) {
  if (!initData) return null
  if (allowDemo && initData === 'demo_init_data') {
    const user = await prisma.user.upsert({
      where: { username: 'demo_user' },
      update: { displayName: 'Demo', language: 'es' },
      create: { username: 'demo_user', displayName: 'Demo', language: 'es' },
    })
    return user
  }
  if (!botToken) return null
  const validation = validateInitData(initData, botToken)
  if (!validation.valid || !validation.user?.id) return null
  const tgUser = validation.user
  const user = await prisma.user.upsert({
    where: { telegramId: String(tgUser.id) },
    update: {
      username: tgUser.username || '',
      displayName: tgUser.first_name || 'Usuario',
      language: tgUser.language_code || 'es',
    },
    create: {
      telegramId: String(tgUser.id),
      username: tgUser.username || '',
      displayName: tgUser.first_name || 'Usuario',
      language: tgUser.language_code || 'es',
    },
  })
  return user
}

export const subscribers = new Map()
export function addSubscriber(userId, res) {
  const list = subscribers.get(userId) || []
  list.push(res)
  subscribers.set(userId, list)
}
export function removeSubscriber(userId, res) {
  const arr = subscribers.get(userId) || []
  const idx = arr.indexOf(res)
  if (idx >= 0) arr.splice(idx, 1)
  subscribers.set(userId, arr)
}
export function emitTo(userId, event, payload) {
  const receivers = subscribers.get(userId) || []
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload)
  for (const r of receivers) {
    r.write(`event: ${event}\ndata: ${data}\n\n`)
  }
}

const rateLimits = new Map()
export function checkRate(userId, key, max, windowMs) {
  const now = Date.now()
  const now = Date.now()
  const k = `${userId}|${key}`
  const state = rateLimits.get(k) || { count: 0, start: now }
  if (now - state.start > windowMs) {
    state.count = 0
    state.start = now
  }
  state.count++
  rateLimits.set(k, state)
  return state.count <= max
}

export async function isBlockedBetween(prisma, aId, bId) {
  if (!aId || !bId) return false
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: aId, blockedId: bId },
        { blockerId: bId, blockedId: aId },
      ],
    },
  })
  return !!blocked
}

export async function isIncognito(prisma, userId) {
  const privacy = await prisma.privacySettings.findFirst({ where: { profile: { userId } } })
  return !!privacy?.incognito
}
