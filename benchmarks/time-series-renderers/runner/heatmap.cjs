const captureHeatmap = async (harness, port, renderer) => {
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
    await scope.close()
  }
}

const validateHeatmapParity = async (
  harness,
  port,
  renderer,
  dygraphCapture
) => {
  const capture = await captureHeatmap(harness, port, renderer)
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

module.exports = {
  captureHeatmap,
  validateHeatmapParity,
}
