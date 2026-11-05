export default (timestamp, range, step = 1) => {
  if (!Array.isArray(range)) return true

  const [after, before] = range
  if (after == null || before == null) return true

  const stepMs = step * 1000
  return timestamp >= after - stepMs && timestamp <= before + stepMs
}
