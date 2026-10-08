const legacyRendererByVisualization = {
  d3pie: "d3pie",
  easypiechart: "easypiechart",
  gauge: "gauge",
}

const getLegacyRenderer = visualization =>
  legacyRendererByVisualization[visualization] || "dygraph"

const prepare = async (page, port, renderer, visualization) => {
  await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "load" })
  await page.waitForFunction(() =>
    Boolean(window.__NETDATA_RENDERER_BENCHMARK__)
  )
  await page.evaluate(
    input => window.__NETDATA_RENDERER_BENCHMARK__.prepare(input),
    { renderer, visualization, dimensions: 1, points: 100 }
  )
  await page.evaluate(() =>
    window.__NETDATA_RENDERER_BENCHMARK__.mountPreview()
  )
}

const cleanup = async page => {
  await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())
  return page.evaluate(() =>
    window.__NETDATA_RENDERER_BENCHMARK__.getActiveWebGL2Contexts()
  )
}

const validateFallbackChain = async (harness, port, visualization) => {
  const scope = await harness.openScope({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const { page } = scope
  try {
    await prepare(page, port, "webgpu", visualization)
    const deviceLoss = await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.exerciseDeviceLossFallback()
    )
    const contextLoss = await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.exerciseWebGL2ContextLossFallback()
    )
    const activeWebGL2Contexts = await cleanup(page)
    const legacyRenderer = getLegacyRenderer(visualization)
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
    await scope.close()
  }
}

const validateWebGL2Fallback = async (harness, port, visualization) => {
  const scope = await harness.openScope({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const { page } = scope
  try {
    await prepare(page, port, "webgl2", visualization)
    const contextLoss = await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.exerciseWebGL2ContextLossFallback()
    )
    const activeWebGL2Contexts = await cleanup(page)
    const legacyRenderer = getLegacyRenderer(visualization)
    return {
      contextLoss,
      activeWebGL2Contexts,
      passed:
        contextLoss.renderer === legacyRenderer &&
        contextLoss.hasDygraph === (legacyRenderer === "dygraph") &&
        activeWebGL2Contexts === 0,
    }
  } finally {
    await scope.close()
  }
}

module.exports = {
  validateFallbackChain,
  validateWebGL2Fallback,
}
