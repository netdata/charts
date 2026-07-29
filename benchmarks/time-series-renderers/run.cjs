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
        window.__NETDATA_RENDERER_BENCHMARK__.capturePreview({
          samples: [{ name: "gapCenter", xRatio: 50 / 99, yRatio: 0.75 }],
        })
      )
      await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())
    }
  } finally {
    await context.close()
  }

  const regularStats = captures.regular.drawStats
  const stepStats = captures.step.drawStats
  const gapStats = captures.gap.drawStats
  const isBar = new Set(["heatmap", "multiBar", "stackedBar"]).has(
    visualizationId
  )
  const exactDraws = isBar
    ? [regularStats, stepStats, gapStats].every(
        stats =>
          stats?.barInstanceCount === 100 &&
          stats.fillInstanceCount === 100 &&
          stats.strokeInstanceCount === 0 &&
          stats.instanceCount === 100
      )
    : Boolean(
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
  const stepPassed = isBar
    ? captures.regular.sha256 === captures.step.sha256
    : captures.regular.sha256 !== captures.step.sha256
  const heatmapGapPassed =
    visualizationId !== "heatmap" ||
    (captures.regular.samplePixels.gapCenter[3] > 0 &&
      captures.gap.samplePixels.gapCenter[3] === 0)
  const passed = Boolean(
    exactDraws &&
      captures.regular.nonTransparentPixels > 0 &&
      captures.step.nonTransparentPixels > 0 &&
      captures.gap.nonTransparentPixels > 0 &&
      heatmapGapPassed &&
      stepPassed &&
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

const captureStackedDiverging = async (
  browser,
  port,
  renderer,
  visualizationId = "stacked"
) => {
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
      visualization: visualizationId,
      dimensions: 3,
      points: 101,
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
    const capture = await page.evaluate(
      isBar =>
        window.__NETDATA_RENDERER_BENCHMARK__.capturePreview({
          samples: [
            { name: "topPositive", xRatio: 0.5, yRatio: 0.25 },
            { name: "bottomPositive", xRatio: 0.5, yRatio: 0.47 },
            { name: "negative", xRatio: 0.5, yRatio: 0.58 },
            { name: "empty", xRatio: 0.5, yRatio: 0.85 },
            ...(isBar
              ? [
                  { name: "barBorder", xRatio: 0.5, xOffset: 4, yRatio: 0.25 },
                  { name: "barEdge", xRatio: 0.5, xOffset: 5, yRatio: 0.25 },
                  { name: "barOutside", xRatio: 0.5, xOffset: 7, yRatio: 0.25 },
                ]
              : []),
          ],
        }),
      visualizationId === "stackedBar"
    )
    await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())
    return capture
  } finally {
    await context.close()
  }
}

const validateStackedParity = async (
  browser,
  port,
  renderer,
  visualizationId,
  dygraphCapture
) => {
  const capture = await captureStackedDiverging(
    browser,
    port,
    renderer,
    visualizationId
  )
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
  const barRunWidth = capture.sampleRuns.topPositive?.width || 0
  const dygraphBarRunWidth = dygraphCapture.sampleRuns.topPositive?.width || 0
  const barRunWidthDelta = Math.abs(barRunWidth - dygraphBarRunWidth)
  const barVerticalHeight = capture.sampleVerticalRuns.topPositive?.height || 0
  const dygraphBarVerticalHeight =
    dygraphCapture.sampleVerticalRuns.topPositive?.height || 0
  const barVerticalHeightDelta = Math.abs(
    barVerticalHeight - dygraphBarVerticalHeight
  )
  const barPixelsPassed =
    visualizationId !== "stackedBar" ||
    (samples.barBorder[0] > 0 &&
      samples.barBorder[1] > 0 &&
      samples.barOutside[3] === 0 &&
      barRunWidth > 0 &&
      barRunWidthDelta <= 1 &&
      barVerticalHeight > 0 &&
      barVerticalHeightDelta <= 2)
  const passed = Boolean(
    samples.topPositive[0] > samples.topPositive[2] &&
      samples.bottomPositive[2] > samples.bottomPositive[0] &&
      samples.negative[1] > samples.negative[0] &&
      samples.empty[3] === 0 &&
      barPixelsPassed &&
      Object.values(deltas).every(delta => delta <= 3)
  )
  return {
    renderer,
    visualization: visualizationId,
    samples,
    deltas,
    ...(visualizationId === "stackedBar" && {
      dygraphBarBorder: dygraphCapture.samplePixels.barBorder,
    }),
    nonTransparentPixels: capture.nonTransparentPixels,
    barRunWidth,
    dygraphBarRunWidth,
    barRunWidthDelta,
    barVerticalHeight,
    dygraphBarVerticalHeight,
    barVerticalHeightDelta,
    yAxisRange: capture.yAxisRange,
    dygraphYAxisRange: dygraphCapture.yAxisRange,
    passed,
  }
}

const captureMultiBar = async (
  browser,
  port,
  renderer,
  visibleDimensionIds = null
) => {
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
      visualization: "multiBar",
      dimensions: 3,
      points: 101,
      profile: "multi-bar",
      range: [-3, 3],
      colors: {
        "series-0": "#ff0000",
        "series-1": "#00ff00",
        "series-2": "#0000ff",
      },
    })
    await page.evaluate(
      input => window.__NETDATA_RENDERER_BENCHMARK__.mountPreview(input),
      {
        enabledXAxis: false,
        enabledYAxis: false,
        visibleDimensionIds,
      }
    )
    const capture = await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.capturePreview({
        samples: [
          { name: "topRed", xRatio: 0.5, xOffset: -4, yRatio: 0.25 },
          { name: "lowerRed", xRatio: 0.5, xOffset: -4, yRatio: 0.42 },
          { name: "lowerGreen", xRatio: 0.5, xOffset: -2, yRatio: 0.42 },
          { name: "negativeBlue", xRatio: 0.5, xOffset: 1, yRatio: 0.58 },
          { name: "redBorder", xRatio: 0.5, xOffset: -5, yRatio: 0.25 },
          { name: "outside", xRatio: 0.5, xOffset: 5, yRatio: 0.42 },
        ],
      })
    )
    await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())
    return capture
  } finally {
    await context.close()
  }
}

const validateMultiBarParity = async (
  browser,
  port,
  renderer,
  dygraphCapture,
  dygraphReflowCapture
) => {
  const capture = await captureMultiBar(browser, port, renderer)
  const reflowCapture = await captureMultiBar(browser, port, renderer, [
    "series-0",
    "series-2",
  ])
  const makeDeltas = (reference, candidate) =>
    Object.fromEntries(
      Object.keys(reference.samplePixels).map(name => [
        name,
        Math.max(
          ...reference.samplePixels[name].map((value, index) =>
            Math.abs(value - candidate.samplePixels[name][index])
          )
        ),
      ])
    )
  const deltas = makeDeltas(dygraphCapture, capture)
  const reflowDeltas = makeDeltas(dygraphReflowCapture, reflowCapture)
  const samples = capture.samplePixels
  const reflowSamples = reflowCapture.samplePixels
  const barRunWidthDelta = Math.abs(
    capture.sampleRuns.topRed.width - dygraphCapture.sampleRuns.topRed.width
  )
  const barVerticalHeightDelta = Math.abs(
    capture.sampleVerticalRuns.topRed.height -
      dygraphCapture.sampleVerticalRuns.topRed.height
  )
  const passed = Boolean(
    samples.topRed[0] > samples.topRed[1] &&
      samples.lowerGreen[1] > samples.lowerGreen[0] &&
      samples.negativeBlue[2] > samples.negativeBlue[0] &&
      samples.outside[3] === 0 &&
      reflowSamples.lowerGreen[0] > reflowSamples.lowerGreen[1] &&
      Object.values(deltas).every(delta => delta <= 3) &&
      Object.values(reflowDeltas).every(delta => delta <= 3) &&
      barRunWidthDelta <= 1 &&
      barVerticalHeightDelta <= 2 &&
      JSON.stringify(capture.yAxisRange) === JSON.stringify(dygraphCapture.yAxisRange)
  )
  return {
    renderer,
    samples,
    reflowSamples,
    dygraphSamples: dygraphCapture.samplePixels,
    dygraphReflowSamples: dygraphReflowCapture.samplePixels,
    deltas,
    reflowDeltas,
    barRunWidth: capture.sampleRuns.topRed.width,
    dygraphBarRunWidth: dygraphCapture.sampleRuns.topRed.width,
    barRunWidthDelta,
    barVerticalHeight: capture.sampleVerticalRuns.topRed.height,
    dygraphBarVerticalHeight: dygraphCapture.sampleVerticalRuns.topRed.height,
    barVerticalHeightDelta,
    yAxisRange: capture.yAxisRange,
    dygraphYAxisRange: dygraphCapture.yAxisRange,
    passed,
  }
}

const captureHeatmap = async (browser, port, renderer) => {
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
      visualization: "heatmap",
      dimensions: 3,
      points: 101,
      profile: "heatmap",
      range: [0, 90],
      ids: ["+Inf", "0.3", "2"],
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
          { name: "top", xRatio: 0.5, yRatio: 0.34 },
          { name: "middle", xRatio: 0.5, yRatio: 0.66 },
          { name: "bottom", xRatio: 0.5, yRatio: 0.97 },
          { name: "outside", xRatio: 0.5, xOffset: 10, yRatio: 0.34 },
        ],
      })
    )
    await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())
    return capture
  } finally {
    await context.close()
  }
}

const validateHeatmapParity = async (
  browser,
  port,
  renderer,
  dygraphCapture
) => {
  const capture = await captureHeatmap(browser, port, renderer)
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
  const horizontalDelta = Math.abs(
    capture.sampleRuns.top.width - dygraphCapture.sampleRuns.top.width
  )
  const verticalDelta = Math.abs(
    capture.sampleVerticalRuns.top.height -
      dygraphCapture.sampleVerticalRuns.top.height
  )
  const passed = Boolean(
    samples.top[3] > 0 &&
      samples.middle[3] === 0 &&
      samples.bottom[3] > 0 &&
      Object.values(deltas).every(delta => delta <= 3) &&
      horizontalDelta <= 1 &&
      verticalDelta <= 2 &&
      JSON.stringify(capture.yAxisRange) === JSON.stringify(dygraphCapture.yAxisRange)
  )
  return {
    renderer,
    samples,
    dygraphSamples: dygraphCapture.samplePixels,
    deltas,
    horizontalDelta,
    verticalDelta,
    yAxisRange: capture.yAxisRange,
    dygraphYAxisRange: dygraphCapture.yAxisRange,
    passed,
  }
}

const captureEasyPie = async (browser, port, renderer, profile) => {
  const context = await browser.newContext({
    viewport: { width: 700, height: 700 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  try {
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "load" })
    await page.waitForFunction(() => Boolean(window.__NETDATA_RENDERER_BENCHMARK__))
    await page.evaluate(input => window.__NETDATA_RENDERER_BENCHMARK__.prepare(input), {
      renderer,
      visualization: "easypiechart",
      dimensions: 2,
      points: 10,
      profile,
      range: [0, 100],
    })
    await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.mountPreview({
        width: 500,
        height: 500,
      })
    )
    const capture = await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.capturePreview({
        samples: [
          { name: "top", xRatio: 0.5, yRatio: 0.07 },
          { name: "right", xRatio: 0.93, yRatio: 0.5 },
          { name: "bottom", xRatio: 0.5, yRatio: 0.93 },
          { name: "left", xRatio: 0.07, yRatio: 0.5 },
          { name: "center", xRatio: 0.5, yRatio: 0.5 },
        ],
      })
    )
    await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())
    return capture
  } finally {
    await context.close()
  }
}

const validateEasyPieParity = async (browser, port, renderer, references) => {
  const positive = await captureEasyPie(browser, port, renderer, "easy-pie")
  const negative = await captureEasyPie(browser, port, renderer, "easy-pie-negative")
  const makeDeltas = (reference, candidate) =>
    Object.fromEntries(
      Object.keys(reference.samplePixels).map(name => [
        name,
        Math.max(
          ...reference.samplePixels[name].map((value, index) =>
            Math.abs(value - candidate.samplePixels[name][index])
          )
        ),
      ])
    )
  const positiveDeltas = makeDeltas(references.positive, positive)
  const negativeDeltas = makeDeltas(references.negative, negative)
  const runWidthDelta = Math.abs(
    positive.sampleRuns.right.width - references.positive.sampleRuns.right.width
  )
  const pixelCountDelta = Math.abs(
    positive.nonTransparentPixels - references.positive.nonTransparentPixels
  )
  const passed = Boolean(
    positive.samplePixels.top[3] > 0 &&
      positive.samplePixels.right[3] > 0 &&
      positive.samplePixels.bottom[3] > 0 &&
      positive.samplePixels.left[3] > 0 &&
      positive.samplePixels.center[3] === 0 &&
      negative.samplePixels.left[3] > 0 &&
      negative.samplePixels.right[3] > 0 &&
      Object.values(positiveDeltas).every(delta => delta <= 3) &&
      Object.values(negativeDeltas).every(delta => delta <= 3) &&
      runWidthDelta <= 2 &&
      pixelCountDelta <= 1000
  )
  return {
    renderer,
    positiveSamples: positive.samplePixels,
    negativeSamples: negative.samplePixels,
    referencePositiveSamples: references.positive.samplePixels,
    referenceNegativeSamples: references.negative.samplePixels,
    positiveDeltas,
    negativeDeltas,
    runWidthDelta,
    pixelCountDelta,
    drawStats: positive.drawStats,
    passed,
  }
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
    const legacyRenderer =
      visualizationId === "easypiechart" ? "easypiechart" : "dygraph"
    return {
      deviceLoss,
      contextLoss,
      activeWebGL2Contexts,
      passed:
        deviceLoss.renderer === "webgl2" &&
        deviceLoss.hasWebGL2 &&
        !deviceLoss.hasDygraph &&
        contextLoss.renderer === legacyRenderer &&
        contextLoss.hasDygraph === (legacyRenderer === "dygraph") &&
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
  const context = await browser.newContext({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  let page = await context.newPage()
  let logicalContexts = 0
  const resetPage = async () => {
    await page.close()
    page = await context.newPage()
    logicalContexts = 0
  }
  const benchmarkBrowser = {
    newContext: async () => {
      if (logicalContexts >= 2) await resetPage()
      logicalContexts += 1
      const sessions = []
      return {
        newPage: async () => page,
        newCDPSession: async target => {
          const session = await context.newCDPSession(target)
          sessions.push(session)
          return session
        },
        close: async () => Promise.all(sessions.map(session => session.detach())),
      }
    },
    resetPage,
  }
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
  const easyPieParity = {}
  let fallbackChain = null
  let easyPieFallbackChain = null

  try {
    for (const workload of workloads) {
      for (const renderer of renderers) {
        results.push(
          await measureCase(benchmarkBrowser, port, {
            ...workload,
            renderer,
            visualization,
          })
        )
      }
    }
    const dygraphArea = await captureAreaOverlap(benchmarkBrowser, port, "dygraph")
    const dygraphHeatmap = await captureHeatmap(benchmarkBrowser, port, "dygraph")
    const dygraphMultiBar = await captureMultiBar(benchmarkBrowser, port, "dygraph")
    const dygraphMultiBarReflow = await captureMultiBar(
      benchmarkBrowser,
      port,
      "dygraph",
      ["series-0", "series-2"]
    )
    const dygraphStacked = await captureStackedDiverging(
      benchmarkBrowser,
      port,
      "dygraph"
    )
    const dygraphStackedBar = await captureStackedDiverging(
      benchmarkBrowser,
      port,
      "dygraph",
      "stackedBar"
    )
    const easyPieReferences = {
      positive: await captureEasyPie(
        benchmarkBrowser,
        port,
        "easypiechart",
        "easy-pie"
      ),
      negative: await captureEasyPie(
        benchmarkBrowser,
        port,
        "easypiechart",
        "easy-pie-negative"
      ),
    }
    for (const renderer of candidateRenderers) {
      await benchmarkBrowser.resetPage()
      lineCorrectness[renderer] = await validateLine(benchmarkBrowser, port, renderer)
      areaCorrectness[renderer] = await validateFilledVisualization(
        benchmarkBrowser,
        port,
        renderer,
        "area"
      )
      areaParity[renderer] = await validateAreaParity(
        benchmarkBrowser,
        port,
        renderer,
        dygraphArea
      )
      heatmapCorrectness[renderer] = await validateFilledVisualization(
        benchmarkBrowser,
        port,
        renderer,
        "heatmap"
      )
      heatmapParity[renderer] = await validateHeatmapParity(
        benchmarkBrowser,
        port,
        renderer,
        dygraphHeatmap
      )
      multiBarCorrectness[renderer] = await validateFilledVisualization(
        benchmarkBrowser,
        port,
        renderer,
        "multiBar"
      )
      multiBarParity[renderer] = await validateMultiBarParity(
        benchmarkBrowser,
        port,
        renderer,
        dygraphMultiBar,
        dygraphMultiBarReflow
      )
      stackedCorrectness[renderer] = await validateFilledVisualization(
        benchmarkBrowser,
        port,
        renderer,
        "stacked"
      )
      stackedParity[renderer] = await validateStackedParity(
        benchmarkBrowser,
        port,
        renderer,
        "stacked",
        dygraphStacked
      )
      stackedBarCorrectness[renderer] = await validateFilledVisualization(
        benchmarkBrowser,
        port,
        renderer,
        "stackedBar"
      )
      stackedBarParity[renderer] = await validateStackedParity(
        benchmarkBrowser,
        port,
        renderer,
        "stackedBar",
        dygraphStackedBar
      )
      easyPieParity[renderer] = await validateEasyPieParity(
        benchmarkBrowser,
        port,
        renderer,
        easyPieReferences
      )
    }
    if (candidateRenderers.includes("webgpu")) {
      await benchmarkBrowser.resetPage()
      fallbackChain = await validateFallbackChain(
        benchmarkBrowser,
        port,
        visualization
      )
      easyPieFallbackChain = await validateFallbackChain(
        benchmarkBrowser,
        port,
        "easypiechart"
      )
    }
  } finally {
    await context.close()
    await browser.close()
    await close()
  }

  const comparisons = compare(results)
  const passed =
    Object.values(lineCorrectness).every(result => result.passed) &&
    Object.values(areaCorrectness).every(result => result.passed) &&
    Object.values(areaParity).every(result => result.passed) &&
    Object.values(heatmapCorrectness).every(result => result.passed) &&
    Object.values(heatmapParity).every(result => result.passed) &&
    Object.values(multiBarCorrectness).every(result => result.passed) &&
    Object.values(multiBarParity).every(result => result.passed) &&
    Object.values(stackedCorrectness).every(result => result.passed) &&
    Object.values(stackedParity).every(result => result.passed) &&
    Object.values(stackedBarCorrectness).every(result => result.passed) &&
    Object.values(stackedBarParity).every(result => result.passed) &&
    Object.values(easyPieParity).every(result => result.passed) &&
    (!fallbackChain || fallbackChain.passed) &&
    (!easyPieFallbackChain || easyPieFallbackChain.passed) &&
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
      browser:
        "one shared Chromium context with at most one live page, reset between backend groups",
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
      easyPieParity,
      fallbackChain,
      easyPieFallbackChain,
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
