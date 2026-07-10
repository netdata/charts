import fs from "node:fs"
import path from "node:path"

export const highCardinalityFixtureNames = [
  "streaming-by-instance-percentage",
  "streaming-compare-24h",
  "streaming-compare-7d",
  "streaming-correlate-context-sparklines",
  "streaming-correlate-selected-area-corrected",
  "streaming-correlate-window-corrected",
  "streaming-drilldown-selected-area",
  "streaming-drilldown-window",
]

export const technicalStrings = new Set([
  "",
  "%",
  "*",
  "absolute",
  "anomaly-bit",
  "anomaly_count",
  "anomaly_count * 100 / count",
  "array",
  "average",
  "avg",
  "baseline",
  "baseline timeframe",
  "context",
  "count",
  "dimension",
  "flip",
  "instance",
  "json2",
  "jsonwrap",
  "label",
  "line",
  "max",
  "median",
  "min",
  "minify",
  "netdata.streaming.in.state",
  "node",
  "nonzero",
  "percentage",
  "stacked",
  "state",
  "stddev",
  "sum",
  "time",
  "timeframe",
  "unaligned",
  "value",
  "volume",
  "weight",
])

const sensitiveTopLevelKeys = ["agents", "functions", "totals", "versions"]

const makeStringAnonymizer = () => {
  const valuesBySource = new Map()
  let nextValueId = 1

  const anonymizeToken = value => {
    if (technicalStrings.has(value)) return value
    if (!valuesBySource.has(value)) {
      valuesBySource.set(
        value,
        `fixture-value-${String(nextValueId++).padStart(5, "0")}`
      )
    }
    return valuesBySource.get(value)
  }

  return value => value.split(",").map(anonymizeToken).join(",")
}

const anonymizeValue = (value, anonymizeString) => {
  if (typeof value === "string") return anonymizeString(value)
  if (Array.isArray(value)) {
    return value.map(item => anonymizeValue(item, anonymizeString))
  }
  if (!value || typeof value !== "object") return value

  Object.keys(value).forEach(childKey => {
    value[childKey] = anonymizeValue(value[childKey], anonymizeString)
  })
  return value
}

export const anonymizeHighCardinalityPayload = (payload, anonymizeString) => {
  sensitiveTopLevelKeys.forEach(key => delete payload[key])

  const timeSeriesData = Array.isArray(payload.result?.data) ? payload.result.data : null

  if (timeSeriesData) payload.result.data = []

  anonymizeValue(payload, anonymizeString)

  if (timeSeriesData) payload.result.data = timeSeriesData
  return payload
}

const isSanitizedString = value =>
  value
    .split(",")
    .every(token => technicalStrings.has(token) || /^fixture-value-\d+$/.test(token))

export const assertSanitizedPayload = payload => {
  if (sensitiveTopLevelKeys.some(key => key in payload)) {
    throw new Error("Sanitized high-cardinality fixture contains sensitive metadata")
  }

  const visit = (value, inValueSchema = false) => {
    if (typeof value === "string") {
      if (!isSanitizedString(value)) {
        throw new Error("Sanitized high-cardinality fixture contains an unexpected string")
      }
      return
    }
    if (Array.isArray(value)) {
      value.forEach(child => visit(child, inValueSchema))
      return
    }
    if (!value || typeof value !== "object") return

    Object.entries(value).forEach(([key, child]) => {
      const childInValueSchema = inValueSchema || key === "v_schema"
      if (
        !childInValueSchema &&
        !/^[a-z][a-z0-9_]*$/.test(key) &&
        !/^\d+$/.test(key)
      ) {
        throw new Error("Sanitized high-cardinality fixture contains an unsafe object key")
      }
      visit(child, childInValueSchema)
    })
  }

  visit(payload)
}

export const prepareHighCardinalityFixtures = ({ sourceDir, outputDir }) => {
  const anonymizeString = makeStringAnonymizer()

  fs.rmSync(outputDir, { recursive: true, force: true })
  fs.mkdirSync(outputDir, { recursive: true })

  highCardinalityFixtureNames.forEach(name => {
    const sourcePath = path.join(sourceDir, `${name}.json`)
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Missing local high-cardinality fixture: ${sourcePath}`)
    }

    const payload = JSON.parse(fs.readFileSync(sourcePath, "utf8"))
    const sanitized = anonymizeHighCardinalityPayload(payload, anonymizeString)
    assertSanitizedPayload(sanitized)
    const outputPath = path.join(outputDir, `${name}.json`)
    const temporaryPath = `${outputPath}.tmp`

    fs.writeFileSync(temporaryPath, JSON.stringify(sanitized))
    fs.renameSync(temporaryPath, outputPath)
  })
}
