const metricsByName = metrics =>
  Object.fromEntries(metrics.map(({ name, value }) => [name, value]))
const measureCase = async (harness, port, benchmarkCase) => {
  const scope = await harness.openScope({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const { page } = scope

  try {
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "load" })
    await page.waitForFunction(() => Boolean(window.__NETDATA_RENDERER_BENCHMARK__))

    const prepared = await page.evaluate(
      input => window.__NETDATA_RENDERER_BENCHMARK__.prepare(input),
      benchmarkCase
    )
    const session = await scope.newCDPSession()
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
    await scope.close()
  }
}

const validateLine = async (harness, port, renderer) => {
  const scope = await harness.openScope({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const { page } = scope
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
    await scope.close()
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

module.exports = {
  measureCase,
  validateLine,
}
