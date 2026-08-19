const captureMultiBar = async (
  harness,
  port,
  renderer,
  visibleDimensionIds = null
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
    await scope.close()
  }
}

const validateMultiBarParity = async (
  harness,
  port,
  renderer,
  dygraphCapture,
  dygraphReflowCapture
) => {
  const capture = await captureMultiBar(harness, port, renderer)
  const reflowCapture = await captureMultiBar(harness, port, renderer, [
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
  const semanticsPassed = Boolean(
    samples.topRed[0] > samples.topRed[1] &&
      samples.lowerGreen[1] > samples.lowerGreen[0] &&
      samples.negativeBlue[2] > samples.negativeBlue[0] &&
      samples.outside[3] === 0 &&
      reflowSamples.lowerGreen[0] > reflowSamples.lowerGreen[1] &&
      barRunWidthDelta <= 1 &&
      barVerticalHeightDelta <= 2 &&
      JSON.stringify(capture.yAxisRange) ===
        JSON.stringify(dygraphCapture.yAxisRange)
  )
  const passed = Boolean(
    semanticsPassed &&
      Object.values(deltas).every(delta => delta <= 3) &&
      Object.values(reflowDeltas).every(delta => delta <= 3)
  )
  const portablePassed = Boolean(
    semanticsPassed &&
      Object.values(deltas).every(delta => delta <= 32) &&
      Object.values(reflowDeltas).every(delta => delta <= 32)
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
    portablePassed,
    passed,
  }
}

module.exports = {
  captureMultiBar,
  validateMultiBarParity,
}
