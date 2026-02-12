export function getCorrelationId(req) {
  const hdr = req.headers?.['x-request-id'] || req.headers?.['X-Request-Id']
  return String(hdr || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
}

export function log(level, msg, ctx = {}) {
  const entry = {
    level,
    time: new Date().toISOString(),
    msg,
    ...ctx,
  }
  process.stdout.write(JSON.stringify(entry) + '\n')
}
