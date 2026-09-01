// Attributes main-thread time to functions for one perf-bench cell, per renderer.
//
//   yarn build-storybook && node scripts/profile-probe.mjs
//   PROFILE_ROWS=300 PROFILE_DIMS=20 PROFILE_COUNT=10 node scripts/profile-probe.mjs
import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const staticDir = path.resolve(__dirname, "../storybook-static")
const outDir = path.resolve(__dirname, "../.perf-results")

const STORY_ID = "perf-benchmark--benchmark"
const ROWS = Number(process.env.PROFILE_ROWS || 300)
const DIMS = Number(process.env.PROFILE_DIMS || 20)
const COUNT = Number(process.env.PROFILE_COUNT || 10)
const CHART_TYPE = process.env.PROFILE_TYPE || "line"
const SCENARIO = process.env.PROFILE_SCENARIO || "idle"
const WARMUP_MS = Number(process.env.PROFILE_WARMUP_MS || 4000)
const MEASURE_MS = Number(process.env.PROFILE_MEASURE_MS || 10000)
const TOP = Number(process.env.PROFILE_TOP || 25)

const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
}

const serveStatic = () =>
  new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0])
      const relative = urlPath === "/" ? "/index.html" : urlPath
      const filePath = path.join(staticDir, path.normalize(relative))

      if (!filePath.startsWith(staticDir) || !fs.existsSync(filePath)) {
        res.writeHead(404)
        res.end("not found")
        return
      }

      res.writeHead(200, { "content-type": mimeTypes[path.extname(filePath)] || "text/plain" })
      fs.createReadStream(filePath).pipe(res)
    })

    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }))
  })

const storyUrl = (port, chartLibrary) => {
  const streaming = SCENARIO !== "hoverInteraction"
  const args = [
    `chartLibrary:${chartLibrary}`,
    `count:${COUNT}`,
    `rows:${ROWS}`,
    `dims:${DIMS}`,
    `chartType:${CHART_TYPE}`,
    "height:300px",
    `streaming:!${streaming}`,
    "autofetchOnHovering:!false",
  ].join(";")

  return `http://127.0.0.1:${port}/iframe.html?id=${STORY_ID}&viewMode=story&args=${encodeURIComponent(args)}`
}

const selfTimes = profile => {
  const byNode = new Map(profile.nodes.map(node => [node.id, node]))
  const totals = new Map()
  let measured = 0

  profile.samples.forEach((nodeId, index) => {
    const delta = profile.timeDeltas[index] || 0
    if (delta <= 0) return

    const node = byNode.get(nodeId)
    if (!node) return

    const { functionName, url, lineNumber } = node.callFrame
    const file = url ? url.split("/").pop() : "(native)"
    const key = `${functionName || "(anonymous)"} @ ${file}:${lineNumber + 1}`

    totals.set(key, (totals.get(key) || 0) + delta)
    measured += delta
  })

  return { totals, measured }
}

const profileLibrary = async (context, port, chartLibrary) => {
  const page = await context.newPage()
  const client = await context.newCDPSession(page)

  await page.goto(storyUrl(port, chartLibrary), { waitUntil: "load" })
  await page.waitForSelector("[data-testid='perfBenchmark'] canvas", {
    state: "attached",
    timeout: 30000,
  })
  await page.waitForTimeout(WARMUP_MS)

  await client.send("Profiler.enable")
  await client.send("Profiler.setSamplingInterval", { interval: 100 })
  await client.send("Profiler.start")
  await page.waitForTimeout(MEASURE_MS)
  const { profile } = await client.send("Profiler.stop")

  const { totals, measured } = selfTimes(profile)
  const rows = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP)
    .map(([key, us]) => ({
      fn: key,
      ms: Math.round(us / 1000),
      pct: `${((us / measured) * 100).toFixed(1)}%`,
    }))

  await page.close()

  return { chartLibrary, totalMeasuredMs: Math.round(measured / 1000), rows }
}

const run = async () => {
  if (!fs.existsSync(staticDir)) {
    console.error(`missing ${staticDir} - run "yarn build-storybook" first`)
    process.exit(1)
  }

  fs.mkdirSync(outDir, { recursive: true })

  const { server, port } = await serveStatic()
  const browser = await chromium.launch({ args: ["--no-sandbox"] })
  const context = await browser.newContext({ viewport: { width: 1600, height: 1200 } })
  const results = []

  for (const chartLibrary of ["dygraph", "uplot"]) {
    const result = await profileLibrary(context, port, chartLibrary)
    results.push(result)

    console.log(
      `\n=== ${chartLibrary} — ${result.totalMeasuredMs}ms of samples ` +
        `(${CHART_TYPE}/${SCENARIO} r${ROWS} d${DIMS} c${COUNT}) ===`
    )
    console.table(result.rows)
  }

  await browser.close()
  server.close()

  const file = path.join(outDir, `profile-${CHART_TYPE}-${SCENARIO}-r${ROWS}-d${DIMS}-c${COUNT}.json`)
  fs.writeFileSync(file, JSON.stringify({ rows: ROWS, dims: DIMS, count: COUNT, results }, null, 2))
  console.log(`\nprofile json: ${file}`)
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
