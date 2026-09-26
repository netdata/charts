const validateFilledVisualization = async (
  harness,
  port,
  renderer,
  visualizationId
) => {
  const scope = await harness.openScope({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const { page } = scope
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
    await scope.close()
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

const captureAreaOverlap = async (harness, port, renderer) => {
  const scope = await harness.openScope({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const { page } = scope
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
    await scope.close()
  }
}

const validateAreaParity = async (harness, port, renderer, dygraphCapture) => {
  const capture = await captureAreaOverlap(harness, port, renderer)
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
  harness,
  port,
  renderer,
  visualizationId = "stacked"
) => {
  const scope = await harness.openScope({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const { page } = scope
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
    await scope.close()
  }
}

const validateStackedParity = async (
  harness,
  port,
  renderer,
  visualizationId,
  dygraphCapture
) => {
  const capture = await captureStackedDiverging(
    harness,
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
  const semanticsPassed = Boolean(
    samples.topPositive[0] > samples.topPositive[2] &&
      samples.bottomPositive[2] > samples.bottomPositive[0] &&
      samples.negative[1] > samples.negative[0] &&
      samples.empty[3] === 0 &&
      barPixelsPassed
  )
  const passed = Boolean(
    semanticsPassed && Object.values(deltas).every(delta => delta <= 3)
  )
  const portablePassed = Boolean(
    semanticsPassed && Object.values(deltas).every(delta => delta <= 32)
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
    portablePassed,
    passed,
  }
}

module.exports = {
  validateFilledVisualization,
  captureAreaOverlap,
  validateAreaParity,
  captureStackedDiverging,
  validateStackedParity,
}
