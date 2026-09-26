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
const createPageHarness = require("./runner/browser.cjs")
const runSuite = require("./runner/suite.cjs")

const makeBrowserArgs = () => {
  const args = [
    "--enable-precise-memory-info",
    "--js-flags=--expose-gc",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
  ]
  if (process.env.CHROMIUM_OZONE_PLATFORM)
    args.push(`--ozone-platform=${process.env.CHROMIUM_OZONE_PLATFORM}`)
  if (process.env.WEBGPU_UNSAFE === "1") args.push("--enable-unsafe-webgpu")
  if (process.env.WEBGPU_VULKAN === "1")
    args.push(
      "--enable-unsafe-webgpu",
      "--ozone-platform=wayland",
      "--use-angle=vulkan",
      "--enable-features=Vulkan,VulkanFromANGLE"
    )
  if (process.env.WEBGPU_SOFTWARE === "1")
    args.push("--enable-unsafe-webgpu", "--use-angle=swiftshader-webgl")
  return args
}

const getChromiumExecutable = () => {
  const systemChromium = "/usr/bin/chromium"
  return (
    process.env.CHROMIUM_EXECUTABLE ||
    (fs.existsSync(systemChromium) ? systemChromium : chromium.executablePath())
  )
}

const run = async () => {
  const port = await listen()
  let browser
  let context
  let browserVersion
  let suite

  try {
    browser = await chromium.launch({
      headless: process.env.BENCHMARK_HEADED !== "1",
      executablePath: getChromiumExecutable(),
      args: makeBrowserArgs(),
    })
    browserVersion = browser.version()
    context = await browser.newContext({
      viewport: { width: 1600, height: 500 },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    const harness = createPageHarness({ context, page })
    suite = await runSuite({
      harness,
      port,
      config: {
        workloads,
        renderers,
        candidateRenderers,
        visualization,
        radialOnly,
        correctnessOnly,
      },
    })
  } finally {
    await context?.close()
    await browser?.close()
    await close()
  }

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
    ...suite,
  }

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
  if (!suite.passed) process.exitCode = 1
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
