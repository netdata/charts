const http = require("node:http")
const fs = require("node:fs")
const path = require("node:path")
const os = require("node:os")
const { chromium } = require("playwright")

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
if (!new Set(["line", "area", "stacked"]).has(visualization))
  throw new Error("BENCHMARK_VISUALIZATION must select line, area, or stacked")

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
const metricsByName = metrics =>
  Object.fromEntries(metrics.map(({ name, value }) => [name, value]))
const speedup = (baseline, candidate) => baseline / Math.max(candidate, Number.EPSILON)

const measureCase = async (browser, port, benchmarkCase) => {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  try {
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "load" })
    await page.waitForFunction(() => Boolean(window.__NETDATA_RENDERER_BENCHMARK__))

    const prepared = await page.evaluate(
      input => window.__NETDATA_RENDERER_BENCHMARK__.prepare(input),
      benchmarkCase
    )
    const session = await context.newCDPSession(page)
    await session.send("Performance.enable")
    const before = metricsByName((await session.send("Performance.getMetrics")).metrics)
    const wallStartedAt = Date.now()
    const measured = await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.measure({
        mountSamples: 3,
        updateSamples: 10,
        sustainedMs: 3000,
      })
    )
    const wallElapsedMs = Date.now() - wallStartedAt
    const after = metricsByName((await session.send("Performance.getMetrics")).metrics)

    await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())

    return {
      ...prepared,
      ...measured,
      wallElapsedMs,
      cdp: {
        taskDurationMs: (after.TaskDuration - before.TaskDuration) * 1000,
        scriptDurationMs: (after.ScriptDuration - before.ScriptDuration) * 1000,
        layoutDurationMs: (after.LayoutDuration - before.LayoutDuration) * 1000,
      },
      peakHeapDelta:
        measured.peakMemory == null || prepared.memoryBefore == null
          ? null
          : measured.peakMemory - prepared.memoryBefore,
      retainedHeapDelta:
        measured.retainedMemory == null || prepared.memoryBefore == null
          ? null
          : measured.retainedMemory - prepared.memoryBefore,
    }
  } finally {
    await context.close()
  }
}

const validateLine = async (browser, port, renderer) => {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const cases = [
    { name: "smooth", gaps: false, stepped: false },
    { name: "step", gaps: false, stepped: true },
    { name: "gap", gaps: true, stepped: false },
  ]
  const captures = {}

  try {
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "load" })
    await page.waitForFunction(() => Boolean(window.__NETDATA_RENDERER_BENCHMARK__))
    for (const benchmarkCase of cases) {
      await page.evaluate(
        input => window.__NETDATA_RENDERER_BENCHMARK__.prepare(input),
        { renderer, dimensions: 1, points: 100, gaps: benchmarkCase.gaps }
      )
      await page.evaluate(
        input => window.__NETDATA_RENDERER_BENCHMARK__.mountPreview(input),
        {
          stepped: benchmarkCase.stepped,
          enabledXAxis: false,
          enabledYAxis: false,
        }
      )
      captures[benchmarkCase.name] = await page.evaluate(() =>
        window.__NETDATA_RENDERER_BENCHMARK__.capturePreview()
      )
      await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())
    }
  } finally {
    await context.close()
  }

  const exactDraws = cases.map(({ name }) => captures[name]).every(
    capture =>
      capture.drawStats.sourcePairs === 99 &&
      capture.drawStats.instanceCount ===
        capture.drawStats.sourcePairs * capture.drawStats.segmentsPerPair
  )
  const passed = Boolean(
    exactDraws &&
      captures.smooth.nonTransparentPixels > 0 &&
      captures.step.nonTransparentPixels > 0 &&
      captures.gap.nonTransparentPixels > 0 &&
      captures.smooth.sha256 !== captures.step.sha256 &&
      captures.step.drawStats.segmentsPerPair === 2 &&
      captures.gap.gapBandNonTransparentPixels === 0
  )

  return { renderer, captures, exactDraws, passed }
}

const validateFilledVisualization = async (
  browser,
  port,
  renderer,
  visualizationId
) => {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const cases = [
    { name: "regular", gaps: false, stepped: false },
    { name: "step", gaps: false, stepped: true },
    { name: "gap", gaps: true, stepped: false },
  ]
  const captures = {}

  try {
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "load" })
    await page.waitForFunction(() => Boolean(window.__NETDATA_RENDERER_BENCHMARK__))
    for (const benchmarkCase of cases) {
      await page.evaluate(
        input => window.__NETDATA_RENDERER_BENCHMARK__.prepare(input),
        {
          renderer,
          visualization: visualizationId,
          dimensions: 1,
          points: 100,
          gaps: benchmarkCase.gaps,
        }
      )
      await page.evaluate(
        input => window.__NETDATA_RENDERER_BENCHMARK__.mountPreview(input),
        {
          stepped: benchmarkCase.stepped,
          enabledXAxis: false,
          enabledYAxis: false,
        }
      )
      captures[benchmarkCase.name] = await page.evaluate(() =>
        window.__NETDATA_RENDERER_BENCHMARK__.capturePreview()
      )
      await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())
    }
  } finally {
    await context.close()
  }

  const regularStats = captures.regular.drawStats
  const stepStats = captures.step.drawStats
  const gapStats = captures.gap.drawStats
  const exactDraws = Boolean(
    regularStats?.sourcePairs === 99 &&
      regularStats.fillInstanceCount === 99 &&
      regularStats.strokeInstanceCount === 99 &&
      regularStats.instanceCount === 198 &&
      stepStats?.sourcePairs === 99 &&
      stepStats.fillInstanceCount === 99 &&
      stepStats.strokeInstanceCount === 198 &&
      stepStats.instanceCount === 297 &&
      gapStats?.sourcePairs === 99 &&
      gapStats.fillInstanceCount === 99 &&
      gapStats.strokeInstanceCount === 99
  )
  const passed = Boolean(
    exactDraws &&
      captures.regular.nonTransparentPixels > 0 &&
      captures.step.nonTransparentPixels > 0 &&
      captures.gap.nonTransparentPixels > 0 &&
      captures.regular.sha256 !== captures.step.sha256 &&
      captures.gap.gapBandNonTransparentPixels === 0
  )

  return { renderer, visualization: visualizationId, captures, exactDraws, passed }
}

const captureAreaOverlap = async (browser, port, renderer) => {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  try {
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "load" })
    await page.waitForFunction(() => Boolean(window.__NETDATA_RENDERER_BENCHMARK__))
    await page.evaluate(input => window.__NETDATA_RENDERER_BENCHMARK__.prepare(input), {
      renderer,
      visualization: "area",
      dimensions: 2,
      points: 100,
      profile: "area-overlap",
      range: [20, 100],
      colors: { "series-0": "#ff0000", "series-1": "#0000ff" },
    })
    await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.mountPreview({
        enabledXAxis: false,
        enabledYAxis: false,
      })
    )
    const capture = await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.capturePreview({
        samples: [
          { name: "empty", xRatio: 0.5, yRatio: 0.1 },
          { name: "firstSeriesOnly", xRatio: 0.5, yRatio: 0.45 },
          { name: "overlap", xRatio: 0.5, yRatio: 0.7 },
          { name: "nearBaseline", xRatio: 0.5, yRatio: 0.9 },
        ],
      })
    )
    await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())
    return capture
  } finally {
    await context.close()
  }
}

const validateAreaParity = async (browser, port, renderer, dygraphCapture) => {
  const capture = await captureAreaOverlap(browser, port, renderer)
  const deltas = Object.fromEntries(
    Object.keys(dygraphCapture.samplePixels).map(name => [
      name,
      Math.max(
        ...dygraphCapture.samplePixels[name].map((value, index) =>
          Math.abs(value - capture.samplePixels[name][index])
        )
      ),
    ])
  )
  const samples = capture.samplePixels
  const passed = Boolean(
    samples.empty[3] === 0 &&
      samples.firstSeriesOnly[3] > 0 &&
      samples.overlap[3] > samples.firstSeriesOnly[3] &&
      samples.nearBaseline[3] > 0 &&
      Object.values(deltas).every(delta => delta <= 3)
  )
  return { renderer, samples: capture.samplePixels, deltas, passed }
}

const captureStackedDiverging = async (browser, port, renderer) => {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  try {
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "load" })
    await page.waitForFunction(() => Boolean(window.__NETDATA_RENDERER_BENCHMARK__))
    await page.evaluate(input => window.__NETDATA_RENDERER_BENCHMARK__.prepare(input), {
      renderer,
      visualization: "stacked",
      dimensions: 3,
      points: 100,
      profile: "stacked-diverging",
      range: [-3, 3],
      colors: {
        "series-0": "#ff0000",
        "series-1": "#00ff00",
        "series-2": "#0000ff",
      },
    })
    await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.mountPreview({
        enabledXAxis: false,
        enabledYAxis: false,
      })
    )
    const capture = await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.capturePreview({
        samples: [
          { name: "topPositive", xRatio: 0.5, yRatio: 0.25 },
          { name: "bottomPositive", xRatio: 0.5, yRatio: 0.47 },
          { name: "negative", xRatio: 0.5, yRatio: 0.58 },
          { name: "empty", xRatio: 0.5, yRatio: 0.85 },
        ],
      })
    )
    await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())
    return capture
  } finally {
    await context.close()
  }
}

const validateStackedParity = async (browser, port, renderer, dygraphCapture) => {
  const capture = await captureStackedDiverging(browser, port, renderer)
  const deltas = Object.fromEntries(
    Object.keys(dygraphCapture.samplePixels).map(name => [
      name,
      Math.max(
        ...dygraphCapture.samplePixels[name].map((value, index) =>
          Math.abs(value - capture.samplePixels[name][index])
        )
      ),
    ])
  )
  const samples = capture.samplePixels
  const passed = Boolean(
    samples.topPositive[0] > samples.topPositive[2] &&
      samples.bottomPositive[2] > samples.bottomPositive[0] &&
      samples.negative[1] > samples.negative[0] &&
      samples.empty[3] === 0 &&
      Object.values(deltas).every(delta => delta <= 3)
  )
  return { renderer, samples, deltas, passed }
}

const validateFallbackChain = async (browser, port, visualizationId) => {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  try {
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "load" })
    await page.waitForFunction(() => Boolean(window.__NETDATA_RENDERER_BENCHMARK__))
    await page.evaluate(input => window.__NETDATA_RENDERER_BENCHMARK__.prepare(input), {
      renderer: "webgpu",
      visualization: visualizationId,
      dimensions: 1,
      points: 100,
    })
    await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.mountPreview())
    const deviceLoss = await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.exerciseDeviceLossFallback()
    )
    const contextLoss = await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.exerciseWebGL2ContextLossFallback()
    )
    await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())
    const activeWebGL2Contexts = await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.getActiveWebGL2Contexts()
    )
    return {
      deviceLoss,
      contextLoss,
      activeWebGL2Contexts,
      passed:
        deviceLoss.renderer === "webgl2" &&
        deviceLoss.hasWebGL2 &&
        !deviceLoss.hasDygraph &&
        contextLoss.renderer === "dygraph" &&
        contextLoss.hasDygraph &&
        activeWebGL2Contexts === 0,
    }
  } finally {
    await context.close()
  }
}

const compare = results =>
  workloads.flatMap(workload => {
    const values = workload.dimensions * workload.points
    const dygraph = results.find(result => result.renderer === "dygraph" && result.values === values)

    return candidateRenderers.map(candidateRenderer => {
      const candidate = results.find(
        result => result.renderer === candidateRenderer && result.values === values
      )
      const expectedReferencesAfter = 1
      const expectedReferencesDuring = candidate.multiChart.count + expectedReferencesAfter
      const multiChartPassed = Boolean(
        candidate.multiChart &&
          candidate.multiChart.resourceReferencesDuring === expectedReferencesDuring &&
          candidate.multiChart.resourceReferencesAfter === expectedReferencesAfter &&
          candidate.multiChart.gpuBufferBytes > 0
      )
      const speedups = {
        mountSync: speedup(dygraph.mountSyncMs.median, candidate.mountSyncMs.median),
        mountFrame: speedup(dygraph.mountFrameMs.median, candidate.mountFrameMs.median),
        updateSync: speedup(dygraph.updateSyncMs.median, candidate.updateSyncMs.median),
        updateFrame: speedup(dygraph.updateFrameMs.median, candidate.updateFrameMs.median),
      }

      if (workload.gate === "single-frame") {
        const frameBudgetMs = candidate.displayFrameIntervalMs * 1.25
        const mountPassed =
          speedups.mountSync >= workload.requiredMainThreadSpeedup &&
          candidate.mountWorkCompletionMs.median <= frameBudgetMs &&
          candidate.mountFrameMs.median <= frameBudgetMs
        const updatePassed =
          speedups.updateSync >= workload.requiredMainThreadSpeedup &&
          candidate.updateWorkCompletionMs.median <= frameBudgetMs &&
          candidate.updateFrameMs.median <= frameBudgetMs

        return {
          candidateRenderer,
          values,
          gate: workload.gate,
          measuredDisplayFrameMs: candidate.displayFrameIntervalMs,
          allowedFrameBudgetMs: frameBudgetMs,
          requiredMainThreadSpeedup: workload.requiredMainThreadSpeedup,
          speedups,
          candidateWorkCompletionMs: {
            mount: candidate.mountWorkCompletionMs.median,
            update: candidate.updateWorkCompletionMs.median,
          },
          candidateFrameMs: {
            mount: candidate.mountFrameMs.median,
            update: candidate.updateFrameMs.median,
          },
          mountPassed,
          updatePassed,
          exportPassed: candidate.exportDataUrlBytes > 1000,
          multiChartPassed,
        }
      }

      return {
        candidateRenderer,
        values,
        gate: workload.gate,
        requiredFrameSpeedup: workload.requiredFrameSpeedup,
        speedups,
        mountPassed: speedups.mountFrame >= workload.requiredFrameSpeedup,
        updatePassed: speedups.updateFrame >= workload.requiredFrameSpeedup,
        exportPassed: candidate.exportDataUrlBytes > 1000,
        multiChartPassed,
      }
    })
  })

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

  const browser = await chromium.launch({
    headless: process.env.BENCHMARK_HEADED !== "1",
    executablePath: process.env.CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
    args: browserArgs,
  })
  const browserVersion = browser.version()
  const results = []
  const lineCorrectness = {}
  const areaCorrectness = {}
  const areaParity = {}
  const stackedCorrectness = {}
  const stackedParity = {}
  let fallbackChain = null

  try {
    for (const workload of workloads) {
      for (const renderer of renderers) {
        results.push(
          await measureCase(browser, port, { ...workload, renderer, visualization })
        )
      }
    }
    const dygraphArea = await captureAreaOverlap(browser, port, "dygraph")
    const dygraphStacked = await captureStackedDiverging(browser, port, "dygraph")
    for (const renderer of candidateRenderers) {
      lineCorrectness[renderer] = await validateLine(browser, port, renderer)
      areaCorrectness[renderer] = await validateFilledVisualization(
        browser,
        port,
        renderer,
        "area"
      )
      areaParity[renderer] = await validateAreaParity(browser, port, renderer, dygraphArea)
      stackedCorrectness[renderer] = await validateFilledVisualization(
        browser,
        port,
        renderer,
        "stacked"
      )
      stackedParity[renderer] = await validateStackedParity(
        browser,
        port,
        renderer,
        dygraphStacked
      )
    }
    if (candidateRenderers.includes("webgpu"))
      fallbackChain = await validateFallbackChain(browser, port, visualization)
  } finally {
    await browser.close()
    await close()
  }

  const comparisons = compare(results)
  const passed =
    Object.values(lineCorrectness).every(result => result.passed) &&
    Object.values(areaCorrectness).every(result => result.passed) &&
    Object.values(areaParity).every(result => result.passed) &&
    Object.values(stackedCorrectness).every(result => result.passed) &&
    Object.values(stackedParity).every(result => result.passed) &&
    (!fallbackChain || fallbackChain.passed) &&
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
      renderers: `Dygraphs and ${candidateRenderers.join(
        ", "
      )} rendering ${visualization} from the same @netdata/charts checkout`,
      data: "deterministic row-major values; two pre-generated revisions alternated",
      canvas: "1600x500 CSS pixels at devicePixelRatio 1",
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
      stacked: stackedCorrectness,
      stackedParity,
      fallbackChain,
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
