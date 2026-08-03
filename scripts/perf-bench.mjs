import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const staticDir = path.resolve(__dirname, "../storybook-static")
const outDir = path.resolve(__dirname, "../.perf-results")

const STORY_ID = "perf-benchmark--benchmark"
const WARMUP_MS = Number(process.env.PERF_WARMUP_MS || 4000)
const MEASURE_MS = Number(process.env.PERF_MEASURE_MS || 10000)
const REPEATS = Number(process.env.PERF_REPEATS || 5)
const MAX_POINTS = Number(process.env.PERF_MAX_POINTS || 3000000)
const RUN_TIMEOUT_MS = Number(process.env.PERF_RUN_TIMEOUT_MS || 120000)

const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
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

const storyUrl = (port, { chartLibrary, count, rows, dims, chartType }) => {
  const args = [
    `chartLibrary:${chartLibrary}`,
    `count:${count}`,
    `rows:${rows}`,
    `dims:${dims}`,
    `chartType:${chartType}`,
  ].join(";")

  return `http://127.0.0.1:${port}/iframe.html?id=${STORY_ID}&viewMode=story&args=${encodeURIComponent(args)}`
}

const taskDuration = async client => {
  const { metrics } = await client.send("Performance.getMetrics")
  const entry = metrics.find(metric => metric.name === "TaskDuration")
  return entry ? entry.value : 0
}

const driveHover = async (page, deadline) => {
  const box = await page.locator("[data-testid='perfBenchmark'] canvas").first().boundingBox()
  if (!box) return

  const y = box.y + box.height / 2
  let step = 0

  while (Date.now() < deadline) {
    const ratio = (Math.sin(step / 8) + 1) / 2
    await page.mouse.move(box.x + 6 + ratio * (box.width - 12), y)
    await page.waitForTimeout(32)
    step++
  }
}

// one page reused across runs: a cold context per run spends ~80s re-parsing the bundle
const runOnce = async ({ page, client }, port, config, scenario) => {
  try {
    await page.goto(storyUrl(port, config), { waitUntil: "load", timeout: RUN_TIMEOUT_MS })
    await page.waitForFunction(() => !!window.__netdataPerf, null, { timeout: RUN_TIMEOUT_MS })
    await page.waitForFunction(() => window.__netdataPerf.snapshot().overall.count > 0, null, {
      timeout: RUN_TIMEOUT_MS,
    })

    await page.waitForTimeout(WARMUP_MS)

    await page.evaluate(() => window.__netdataPerf.reset())
    const taskBefore = await taskDuration(client)
    const startedAt = Date.now()

    if (scenario === "hover") await driveHover(page, startedAt + MEASURE_MS)
    else await page.waitForTimeout(MEASURE_MS)

    const elapsedMs = Date.now() - startedAt
    const taskAfter = await taskDuration(client)
    const snapshot = await page.evaluate(() => window.__netdataPerf.snapshot())

    const renderer = snapshot.renderers[config.chartLibrary] || { count: 0, p50: 0, p95: 0, max: 0 }

    return {
      ok: true,
      elapsedMs,
      renders: renderer.count,
      p50: renderer.p50,
      p95: renderer.p95,
      max: renderer.max,
      heapPeak: snapshot.heap.peak,
      taskMs: (taskAfter - taskBefore) * 1000,
      taskPerRender: renderer.count ? ((taskAfter - taskBefore) * 1000) / renderer.count : null,
    }
  } catch (error) {
    return { ok: false, error: error.message.split("\n")[0] }
  }
}

const mean = values => values.reduce((sum, value) => sum + value, 0) / (values.length || 1)

const stddev = values => {
  if (values.length < 2) return 0
  const avg = mean(values)
  return Math.sqrt(mean(values.map(value => (value - avg) ** 2)))
}

const buildCells = () => {
  const cells = []

  // A: scaling curve on the common case
  for (const rows of [300, 1000, 5000])
    for (const dims of [3, 20, 100])
      for (const count of [10, 50])
        cells.push({ phase: "A-scaling", rows, dims, count, chartType: "line", scenario: "idle" })

  // B: synced hover, where the fan-out cost shows up
  for (const rows of [1000, 5000])
    for (const dims of [20, 100])
      cells.push({ phase: "B-hover", rows, dims, count: 25, chartType: "line", scenario: "hover" })

  // C: expensive geometry chart types
  for (const chartType of ["stacked", "heatmap"])
    for (const scenario of ["idle", "hover"])
      cells.push({ phase: "C-types", rows: 1000, dims: 20, count: 25, chartType, scenario })

  return cells
}

const main = async () => {
  if (!fs.existsSync(staticDir)) {
    console.error(`missing ${staticDir} — run \`yarn build-storybook\` first`)
    process.exit(1)
  }

  fs.mkdirSync(outDir, { recursive: true })

  const { server, port } = await serveStatic()
  const browser = await chromium.launch({ args: ["--no-sandbox"] })
  const context = await browser.newContext({ viewport: { width: 1600, height: 1200 } })
  const page = await context.newPage()
  const client = await context.newCDPSession(page)
  await client.send("Performance.enable")
  const session = { page, client }

  const quick = process.argv.includes("--quick")
  const allCells = quick
    ? [
        {
          phase: "quick",
          rows: Number(process.env.PERF_QUICK_ROWS || 1000),
          dims: Number(process.env.PERF_QUICK_DIMS || 20),
          count: Number(process.env.PERF_QUICK_COUNT || 10),
          chartType: process.env.PERF_QUICK_TYPE || "line",
          scenario: process.env.PERF_QUICK_SCENARIO || "idle",
        },
      ]
    : buildCells()

  const repeats = quick ? 1 : REPEATS
  const results = []
  const skipped = []

  for (const cell of allCells) {
    const points = cell.rows * cell.dims * cell.count
    if (points > MAX_POINTS) {
      skipped.push({ ...cell, points, reason: `exceeds PERF_MAX_POINTS (${MAX_POINTS})` })
      console.log(`SKIP ${JSON.stringify(cell)} — ${points.toLocaleString()} points`)
      continue
    }

    for (let repeat = 0; repeat < repeats; repeat++) {
      for (const chartLibrary of ["dygraph", "uplot"]) {
        const config = { ...cell, chartLibrary }
        const run = await runOnce(session, port, config, cell.scenario)
        results.push({ ...config, repeat, ...run })

        console.log(
          `${cell.phase} ${cell.chartType}/${cell.scenario} r${cell.rows} d${cell.dims} c${cell.count} ` +
            `[${chartLibrary}] #${repeat} ${
              run.ok
                ? `renders=${run.renders} p50=${run.p50.toFixed(2)}ms p95=${run.p95.toFixed(2)}ms task/render=${
                    run.taskPerRender == null ? "n/a" : run.taskPerRender.toFixed(2)
                  }ms`
                : `FAILED ${run.error}`
            }`
        )

        fs.writeFileSync(path.join(outDir, "raw.json"), JSON.stringify({ results, skipped }, null, 2))
      }
    }
  }

  await browser.close()
  server.close()

  const key = row => `${row.phase}|${row.chartType}|${row.scenario}|${row.rows}|${row.dims}|${row.count}`
  const groups = new Map()

  results.filter(row => row.ok).forEach(row => {
    if (!groups.has(key(row))) groups.set(key(row), [])
    groups.get(key(row)).push(row)
  })

  const summary = []

  groups.forEach((rows, groupKey) => {
    const [phase, chartType, scenario, rowCount, dims, count] = groupKey.split("|")
    const byRepeat = new Map()

    rows.forEach(row => {
      if (!byRepeat.has(row.repeat)) byRepeat.set(row.repeat, {})
      byRepeat.get(row.repeat)[row.chartLibrary] = row
    })

    const p50Ratios = []
    const taskRatios = []
    const totalTaskRatios = []
    const dygraphRenders = []
    const uplotRenders = []

    byRepeat.forEach(pair => {
      if (!pair.dygraph || !pair.uplot) return
      if (pair.dygraph.p50 > 0) p50Ratios.push(pair.uplot.p50 / pair.dygraph.p50)
      if (pair.dygraph.taskPerRender > 0)
        taskRatios.push(pair.uplot.taskPerRender / pair.dygraph.taskPerRender)
      // total main-thread cost over a fixed window: the number that decides the flip
      if (pair.dygraph.taskMs > 0) totalTaskRatios.push(pair.uplot.taskMs / pair.dygraph.taskMs)
      dygraphRenders.push(pair.dygraph.renders)
      uplotRenders.push(pair.uplot.renders)
    })

    summary.push({
      phase,
      chartType,
      scenario,
      rows: Number(rowCount),
      dims: Number(dims),
      count: Number(count),
      pairs: p50Ratios.length,
      dygraphRenders: mean(dygraphRenders),
      uplotRenders: mean(uplotRenders),
      p50RatioMean: mean(p50Ratios),
      p50RatioSd: stddev(p50Ratios),
      taskRatioMean: mean(taskRatios),
      taskRatioSd: stddev(taskRatios),
      totalTaskRatioMean: mean(totalTaskRatios),
      totalTaskRatioSd: stddev(totalTaskRatios),
    })
  })

  summary.sort((a, b) => a.phase.localeCompare(b.phase) || a.rows - b.rows || a.dims - b.dims)

  const lines = [
    "Ratios are uPlot/dygraph — below 1.000 means uPlot is cheaper.",
    "`total task` is whole-tab main-thread ms over the same wall-clock window (the flip decider).",
    "Render counts are shown because the renderers do not always render the same number of times.",
    "",
    "| phase | type | scenario | rows | dims | charts | pairs | renders dyg→uplot | p50 ratio | task/render ratio | total task ratio |",
    "|---|---|---|---|---|---|---|---|---|---|---|",
    ...summary.map(
      row =>
        `| ${row.phase} | ${row.chartType} | ${row.scenario} | ${row.rows} | ${row.dims} | ${row.count} | ${row.pairs} | ` +
        `${row.dygraphRenders.toFixed(0)}→${row.uplotRenders.toFixed(0)} | ` +
        `${row.p50RatioMean.toFixed(3)} ± ${row.p50RatioSd.toFixed(3)} | ${row.taskRatioMean.toFixed(3)} ± ${row.taskRatioSd.toFixed(3)} | ` +
        `${row.totalTaskRatioMean.toFixed(3)} ± ${row.totalTaskRatioSd.toFixed(3)} |`
    ),
  ]

  if (skipped.length) {
    lines.push("", "Skipped cells (too large):")
    skipped.forEach(cell =>
      lines.push(`- ${cell.chartType}/${cell.scenario} rows=${cell.rows} dims=${cell.dims} charts=${cell.count} (${cell.points.toLocaleString()} points)`)
    )
  }

  const failures = results.filter(row => !row.ok)
  if (failures.length) {
    lines.push("", `Failed runs: ${failures.length}`)
    failures.slice(0, 10).forEach(row =>
      lines.push(`- ${row.chartType}/${row.scenario} r${row.rows} d${row.dims} c${row.count} [${row.chartLibrary}]: ${row.error}`)
    )
  }

  const report = lines.join("\n")
  fs.writeFileSync(path.join(outDir, "summary.md"), `${report}\n`)
  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2))

  console.log(`\n${report}\n`)
  console.log(`raw: ${path.join(outDir, "raw.json")}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
