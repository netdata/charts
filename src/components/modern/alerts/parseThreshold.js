const number = "(-?\\d+(?:\\.\\d+)?)"
const operator = "(>=|<=|>|<)"

const plainPattern = new RegExp(`^\\$this\\s*${operator}\\s*\\(?\\s*${number}\\s*\\)?$`)

const hysteresisPattern = new RegExp(
  `^\\$this\\s*${operator}\\s*\\(\\s*\\(\\s*\\$status\\s*>=\\s*\\$(?:WARNING|CRITICAL)\\s*\\)\\s*\\?\\s*\\(\\s*${number}\\s*\\)\\s*:\\s*\\(\\s*${number}\\s*\\)\\s*\\)$`
)

const toDirection = op => (op.startsWith(">") ? "above" : "below")

export const parseExpression = expression => {
  if (typeof expression !== "string") return null

  const text = expression.trim()

  const plain = text.match(plainPattern)
  if (plain) return { direction: toDirection(plain[1]), value: Number(plain[2]) }

  const hysteresis = text.match(hysteresisPattern)
  if (hysteresis)
    return {
      direction: toDirection(hysteresis[1]),
      value: Number(hysteresis[3]),
      hold: Number(hysteresis[2]),
    }

  return null
}

export const parseThresholds = ({ warn, crit } = {}) => {
  const warning = parseExpression(warn)
  const critical = parseExpression(crit)
  const levels = [warning, critical].filter(Boolean)

  if (!levels.length) return null
  if (levels.some(level => level.direction !== levels[0].direction)) return null

  return {
    direction: levels[0].direction,
    ...(warning && { warning: warning.value }),
    ...(critical && { critical: critical.value }),
  }
}
