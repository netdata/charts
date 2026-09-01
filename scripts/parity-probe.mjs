//   yarn build-storybook && node scripts/parity-probe.mjs
//   PARITY_HEIGHTS=300,120 node scripts/parity-probe.mjs
import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const staticDir = path.resolve(__dirname, "../storybook-static")
const outDir = path.resolve(__dirname, "../.parity-results")

const STORY_ID = "perf-benchmark--benchmark"
const HEIGHTS = (process.env.PARITY_HEIGHTS || "400,300,200,120,100").split(",").map(Number)
const CHART_TYPE = process.env.PARITY_CHART_TYPE || "line"
const DIMS = Number(process.env.PARITY_DIMS || 3)
const ROWS = Number(process.env.PARITY_ROWS || 300)
const SETTLE_MS = Number(process.env.PARITY_SETTLE_MS || 2500)

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

const storyUrl = (port, chartLibrary, height) => {
  const args = [
    `chartLibrary:${chartLibrary}`,
    "count:1",
    `rows:${ROWS}`,
    `dims:${DIMS}`,
    `chartType:${CHART_TYPE}`,
    `height:${height}px`,
    "streaming:!false",
    "autofetchOnHovering:!false",
  ].join(";")

  return `http://127.0.0.1:${port}/iframe.html?id=${STORY_ID}&viewMode=story&args=${encodeURIComponent(args)}`
}

const measure = async page =>
  page.evaluate(() => {
    const container = document.querySelector("[data-testid='perfBenchmark']")
    if (!container) return { error: "story container not found" }

    const base = container.getBoundingClientRect()
    const rel = r => ({
      left: Math.round((r.left - base.left) * 10) / 10,
      top: Math.round((r.top - base.top) * 10) / 10,
      width: Math.round(r.width * 10) / 10,
      height: Math.round(r.height * 10) / 10,
    })

    const over = container.querySelector(".u-over")
    if (over) {
      const root = container.querySelector(".uplot")
      return {
        source: "exact (.u-over)",
        plot: rel(over.getBoundingClientRect()),
        mountHeight: Math.round(root?.parentElement?.getBoundingClientRect().height ?? -1),
      }
    }

    const canvas = container.querySelector("canvas")
    if (!canvas) return { error: "no canvas rendered" }

    const canvasRect = canvas.getBoundingClientRect()
    const xLabels = [...container.querySelectorAll(".dygraph-axis-label-x")]
    const yLabels = [...container.querySelectorAll(".dygraph-axis-label-y")]

    const plotBottom = xLabels.length
      ? Math.min(...xLabels.map(el => el.getBoundingClientRect().top))
      : canvasRect.bottom
    const plotLeft = yLabels.length
      ? Math.max(...yLabels.map(el => el.getBoundingClientRect().right))
      : canvasRect.left

    return {
      source: "derived (axis label divs)",
      mountHeight: Math.round(canvas.parentElement?.getBoundingClientRect().height ?? -1),
      plot: rel({
        left: plotLeft,
        top: canvasRect.top,
        width: canvasRect.right - plotLeft,
        height: plotBottom - canvasRect.top,
      }),
      xLabels: xLabels.length,
      yLabels: yLabels.length,
    }
  })

const run = async () => {
  if (!fs.existsSync(staticDir)) {
    console.error(`missing ${staticDir} - run "yarn build-storybook" first`)
    process.exit(1)
  }

  fs.mkdirSync(outDir, { recursive: true })

  const { server, port } = await serveStatic()
  const browser = await chromium.launch({ args: ["--no-sandbox"] })
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  const results = []

  for (const height of HEIGHTS) {
    for (const chartLibrary of ["dygraph", "uplot"]) {
      const page = await context.newPage()

      try {
        await page.goto(storyUrl(port, chartLibrary, height), { waitUntil: "load" })
        await page.waitForSelector("[data-testid='perfBenchmark'] canvas", {
          state: "attached",
          timeout: 30000,
        })
        await page.waitForTimeout(SETTLE_MS)

        const measured = await measure(page)
        results.push({ chartLibrary, height, ...measured })

        const file = path.join(outDir, `${CHART_TYPE}-${height}px-${chartLibrary}.png`)
        await page.locator("[data-testid='perfBenchmark']").screenshot({ path: file })
      } catch (error) {
        results.push({ chartLibrary, height, error: error.message })
      } finally {
        await page.close()
      }
    }
  }

  await browser.close()
  server.close()

  const rows = results.map(r => ({
    height: `${r.height}px`,
    library: r.chartLibrary,
    mount: r.mountHeight ?? "-",
    top: r.plot?.top ?? "-",
    plotHeight: r.plot?.height ?? "-",
    left: r.plot?.left ?? "-",
    plotWidth: r.plot?.width ?? "-",
    source: r.source || r.error,
  }))

  console.table(rows)

  const jsonFile = path.join(outDir, `geometry-${CHART_TYPE}.json`)
  fs.writeFileSync(
    jsonFile,
    JSON.stringify({ chartType: CHART_TYPE, rows: ROWS, dims: DIMS, results }, null, 2)
  )
  console.log(`\nscreenshots + json: ${outDir}`)
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
