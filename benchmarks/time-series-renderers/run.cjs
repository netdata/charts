const http = require("node:http")
const fs = require("node:fs")
const path = require("node:path")
const os = require("node:os")
const { chromium } = require("playwright-core")

const root = path.join(__dirname, "dist")
const indexPath = path.join(__dirname, "index.html")
const workloads = [
  {
    dimensions: 100,
    points: 1000,
    gate: "single-frame",
    requiredMainThreadSpeedup: 3,
  },
  {
    dimensions: 1000,
    points: 1000,
    gate: "relative",
    requiredFrameSpeedup: 5,
  },
]
const supportedCandidates = new Set(["webgpu", "webgl2"])
const candidateRenderers = [
  ...new Set(
    (process.env.BENCHMARK_RENDERERS || "webgpu")
      .split(",")
      .map(value => value.trim())
      .filter(value => value && value !== "dygraph")
  ),
]
if (
  !candidateRenderers.length ||
  candidateRenderers.some(value => !supportedCandidates.has(value))
)
  throw new Error("BENCHMARK_RENDERERS must select webgpu and/or webgl2")
const renderers = ["dygraph", ...candidateRenderers]
const visualization = process.env.BENCHMARK_VISUALIZATION || "line"
const radialOnly = process.env.BENCHMARK_RADIAL_ONLY === "1"
const correctnessOnly = process.env.BENCHMARK_CORRECTNESS_ONLY === "1"
if (
  !new Set(["line", "area", "heatmap", "multiBar", "stacked", "stackedBar"]).has(
    visualization
  )
)
  throw new Error(
    "BENCHMARK_VISUALIZATION must select line, area, heatmap, multiBar, stacked, or stackedBar"
  )

const server = http.createServer((request, response) => {
  const file = request.url === "/benchmark.js" ? path.join(root, "benchmark.js") : indexPath
  if (!fs.existsSync(file)) {
    response.writeHead(404)
    response.end("not found")
    return
  }

  response.writeHead(200, {
    "content-type": file.endsWith(".js") ? "text/javascript" : "text/html",
    "cache-control": "no-store",
  })
  fs.createReadStream(file).pipe(response)
})

const listen = () =>
  new Promise(resolve => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port))
  })

const close = () => new Promise(resolve => server.close(resolve))
const { measureCase, validateLine } = require("./runner/measurements.cjs")
const {
  validateFilledVisualization,
  captureAreaOverlap,
  validateAreaParity,
  captureStackedDiverging,
  validateStackedParity,
} = require("./runner/filled.cjs")
const {
  captureMultiBar,
  validateMultiBarParity,
} = require("./runner/bars.cjs")
const {
  captureHeatmap,
  validateHeatmapParity,
} = require("./runner/heatmap.cjs")
const {
  captureEasyPie,
  validateEasyPieParity,
  captureGauge,
  validateGaugeParity,
  captureD3Pie,
  validateD3PieParity,
} = require("./runner/radial.cjs")
const {
  validateFallbackChain,
  validateWebGL2Fallback,
} = require("./runner/fallback.cjs")
const compare = require("./runner/compare.cjs")
const createPageHarness = require("./runner/browser.cjs")
const {
  validateCorrectnessMeasurement,
  validateInitializationUnmount,
} = require("./runner/lifecycle.cjs")

const run = async () => {
  const port = await listen()
  const browserArgs = [
    "--enable-precise-memory-info",
    "--js-flags=--expose-gc",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
  ]
  if (process.env.CHROMIUM_OZONE_PLATFORM)
    browserArgs.push(`--ozone-platform=${process.env.CHROMIUM_OZONE_PLATFORM}`)
  if (process.env.WEBGPU_UNSAFE === "1") browserArgs.push("--enable-unsafe-webgpu")
  if (process.env.WEBGPU_VULKAN === "1") {
    browserArgs.push(
      "--enable-unsafe-webgpu",
      "--ozone-platform=wayland",
      "--use-angle=vulkan",
      "--enable-features=Vulkan,VulkanFromANGLE"
    )
  }
  if (process.env.WEBGPU_SOFTWARE === "1") {
    browserArgs.push("--enable-unsafe-webgpu", "--use-angle=swiftshader-webgl")
  }

  const systemChromium = "/usr/bin/chromium"
  const browser = await chromium.launch({
    headless: process.env.BENCHMARK_HEADED !== "1",
    executablePath:
      process.env.CHROMIUM_EXECUTABLE ||
      (fs.existsSync(systemChromium) ? systemChromium : chromium.executablePath()),
    args: browserArgs,
  })
  const browserVersion = browser.version()
  const context = await browser.newContext({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const pageHarness = createPageHarness({ context, page })
  const results = []
  const lineCorrectness = {}
  const areaCorrectness = {}
  const areaParity = {}
  const heatmapCorrectness = {}
  const heatmapParity = {}
  const multiBarCorrectness = {}
  const multiBarParity = {}
  const stackedCorrectness = {}
  const stackedParity = {}
  const stackedBarCorrectness = {}
  const stackedBarParity = {}
  const d3PieParity = {}
  const easyPieParity = {}
  const gaugeParity = {}
  let fallbackChain = null
  let d3PieFallbackChain = null
  let easyPieFallbackChain = null
  let gaugeFallbackChain = null
  const webGL2Fallbacks = {}
  const initializationUnmount = {}

  try {
    let dygraphArea = null
    let dygraphHeatmap = null
    let dygraphMultiBar = null
    let dygraphMultiBarReflow = null
    let dygraphStacked = null
    let dygraphStackedBar = null
    if (!radialOnly) {
      if (correctnessOnly) {
        for (const renderer of candidateRenderers)
          results.push(
            await measureCase(pageHarness, port, {
              dimensions: 10,
              points: 100,
              renderer,
              visualization,
            })
          )
      } else {
        for (const workload of workloads) {
          for (const renderer of renderers) {
            results.push(
              await measureCase(pageHarness, port, {
                ...workload,
                renderer,
                visualization,
              })
            )
          }
        }
      }
      dygraphArea = await captureAreaOverlap(pageHarness, port, "dygraph")
      dygraphHeatmap = await captureHeatmap(pageHarness, port, "dygraph")
      dygraphMultiBar = await captureMultiBar(pageHarness, port, "dygraph")
      dygraphMultiBarReflow = await captureMultiBar(
        pageHarness,
        port,
        "dygraph",
        ["series-0", "series-2"]
      )
      dygraphStacked = await captureStackedDiverging(
        pageHarness,
        port,
        "dygraph"
      )
      dygraphStackedBar = await captureStackedDiverging(
        pageHarness,
        port,
        "dygraph",
        "stackedBar"
      )
    }
    const d3PieReference = await captureD3Pie(pageHarness, port, "d3pie")
    const easyPieReferences = {
      positive: await captureEasyPie(
        pageHarness,
        port,
        "easypiechart",
        "easy-pie"
      ),
      negative: await captureEasyPie(
        pageHarness,
        port,
        "easypiechart",
        "easy-pie-negative"
      ),
    }
    const gaugeReference = await captureGauge(pageHarness, port, "gauge")
    for (const renderer of candidateRenderers) {
      await pageHarness.resetPage()
      if (!radialOnly) {
        lineCorrectness[renderer] = await validateLine(
          pageHarness,
          port,
          renderer
        )
        areaCorrectness[renderer] = await validateFilledVisualization(
          pageHarness,
          port,
          renderer,
          "area"
        )
        areaParity[renderer] = await validateAreaParity(
          pageHarness,
          port,
          renderer,
          dygraphArea
        )
        heatmapCorrectness[renderer] = await validateFilledVisualization(
          pageHarness,
          port,
          renderer,
          "heatmap"
        )
        heatmapParity[renderer] = await validateHeatmapParity(
          pageHarness,
          port,
          renderer,
          dygraphHeatmap
        )
        multiBarCorrectness[renderer] = await validateFilledVisualization(
          pageHarness,
          port,
          renderer,
          "multiBar"
        )
        multiBarParity[renderer] = await validateMultiBarParity(
          pageHarness,
          port,
          renderer,
          dygraphMultiBar,
          dygraphMultiBarReflow
        )
        stackedCorrectness[renderer] = await validateFilledVisualization(
          pageHarness,
          port,
          renderer,
          "stacked"
        )
        stackedParity[renderer] = await validateStackedParity(
          pageHarness,
          port,
          renderer,
          "stacked",
          dygraphStacked
        )
        stackedBarCorrectness[renderer] = await validateFilledVisualization(
          pageHarness,
          port,
          renderer,
          "stackedBar"
        )
        stackedBarParity[renderer] = await validateStackedParity(
          pageHarness,
          port,
          renderer,
          "stackedBar",
          dygraphStackedBar
        )
      }
      d3PieParity[renderer] = await validateD3PieParity(
        pageHarness,
        port,
        renderer,
        d3PieReference
      )
      easyPieParity[renderer] = await validateEasyPieParity(
        pageHarness,
        port,
        renderer,
        easyPieReferences
      )
      gaugeParity[renderer] = await validateGaugeParity(
        pageHarness,
        port,
        renderer,
        gaugeReference
      )
    }
    for (const renderer of candidateRenderers)
      initializationUnmount[renderer] = await validateInitializationUnmount(
        pageHarness,
        port,
        renderer
      )
    if (candidateRenderers.includes("webgl2")) {
      await pageHarness.resetPage()
      for (const visualizationId of [
        "line",
        "d3pie",
        "easypiechart",
        "gauge",
      ])
        webGL2Fallbacks[visualizationId] = await validateWebGL2Fallback(
          pageHarness,
          port,
          visualizationId
        )
    }
    if (candidateRenderers.includes("webgpu")) {
      await pageHarness.resetPage()
      if (!radialOnly)
        fallbackChain = await validateFallbackChain(
          pageHarness,
          port,
          visualization
        )
      d3PieFallbackChain = await validateFallbackChain(
        pageHarness,
        port,
        "d3pie"
      )
      easyPieFallbackChain = await validateFallbackChain(
        pageHarness,
        port,
        "easypiechart"
      )
      gaugeFallbackChain = await validateFallbackChain(
        pageHarness,
        port,
        "gauge"
      )
    }
  } finally {
    await context.close()
    await browser.close()
    await close()
  }

  const comparisons =
    radialOnly || correctnessOnly
      ? []
      : compare(results, { workloads, candidateRenderers })
  const correctnessPassed = result =>
    result.passed || (correctnessOnly && result.portablePassed)
  const passed =
    Object.values(lineCorrectness).every(correctnessPassed) &&
    Object.values(areaCorrectness).every(correctnessPassed) &&
    Object.values(areaParity).every(correctnessPassed) &&
    Object.values(heatmapCorrectness).every(correctnessPassed) &&
    Object.values(heatmapParity).every(correctnessPassed) &&
    Object.values(multiBarCorrectness).every(correctnessPassed) &&
    Object.values(multiBarParity).every(correctnessPassed) &&
    Object.values(stackedCorrectness).every(correctnessPassed) &&
    Object.values(stackedParity).every(correctnessPassed) &&
    Object.values(stackedBarCorrectness).every(correctnessPassed) &&
    Object.values(stackedBarParity).every(correctnessPassed) &&
    Object.values(d3PieParity).every(correctnessPassed) &&
    Object.values(easyPieParity).every(correctnessPassed) &&
    Object.values(gaugeParity).every(correctnessPassed) &&
    (!fallbackChain || fallbackChain.passed) &&
    (!d3PieFallbackChain || d3PieFallbackChain.passed) &&
    (!easyPieFallbackChain || easyPieFallbackChain.passed) &&
    (!gaugeFallbackChain || gaugeFallbackChain.passed) &&
    Object.values(webGL2Fallbacks).every(result => result.passed) &&
    Object.values(initializationUnmount).every(result => result.passed) &&
    (!correctnessOnly || results.every(validateCorrectnessMeasurement)) &&
    comparisons.every(
      result =>
        result.mountPassed &&
        result.updatePassed &&
        result.exportPassed &&
        result.multiChartPassed
    )
  const output = {
    generatedAt: new Date().toISOString(),
    runtime: {
      platform: process.platform,
      architecture: process.arch,
      node: process.version,
      chromium: browserVersion,
      cpuModel: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
    },
    method: {
      correctnessOnly,
      renderers: `Dygraphs and ${candidateRenderers.join(
        ", "
      )} rendering ${visualization} from the same @netdata/charts checkout`,
      data: "deterministic row-major values; two pre-generated revisions alternated",
      canvas: "1600x500 CSS pixels at devicePixelRatio 1",
      browser:
        "one shared Chromium context, window, and persistent page; state reset by navigation",
      samples: "3 mounts, 2 warm-up updates, 10 measured updates, 3 seconds sustained updates",
      primaryLatency:
        "100k uses measured one-frame presentation/work completion plus synchronous speedup; 1M uses median frame-settled speedup",
      memory: "Chromium usedJSHeapSize delta after forced GC; peak sampled after settled draws",
    },
    results,
    correctness: {
      line: lineCorrectness,
      area: areaCorrectness,
      areaParity,
      heatmap: heatmapCorrectness,
      heatmapParity,
      multiBar: multiBarCorrectness,
      multiBarParity,
      stacked: stackedCorrectness,
      stackedParity,
      stackedBar: stackedBarCorrectness,
      stackedBarParity,
      d3PieParity,
      easyPieParity,
      gaugeParity,
      fallbackChain,
      d3PieFallbackChain,
      easyPieFallbackChain,
      gaugeFallbackChain,
      webGL2Fallbacks,
      initializationUnmount,
    },
    comparisons,
    passed,
  }

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
  if (!passed) process.exitCode = 1
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
