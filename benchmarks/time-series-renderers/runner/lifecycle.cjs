const validateLifecycle = result => {
  const expectedReferencesAfter = 1
  const expectedReferencesDuring =
    result.multiChart.count + expectedReferencesAfter

  return Boolean(
    result.multiChart &&
      result.multiChart.resourceReferencesDuring === expectedReferencesDuring &&
      result.multiChart.resourceReferencesAfter === expectedReferencesAfter &&
      result.multiChart.gpuBufferBytes > 0 &&
      result.multiChart.sharedResourceBytes > 0
  )
}

const validateCorrectnessMeasurement = result =>
  result.exportDataUrlBytes > 1000 && validateLifecycle(result)

const validateInitializationUnmount = async (harness, port, renderer) => {
  const scope = await harness.openScope({
    viewport: { width: 1600, height: 500 },
    deviceScaleFactor: 1,
  })
  const { page } = scope
  try {
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "load" })
    await page.waitForFunction(() =>
      Boolean(window.__NETDATA_RENDERER_BENCHMARK__)
    )
    await page.evaluate(
      input => window.__NETDATA_RENDERER_BENCHMARK__.prepare(input),
      { renderer, visualization: "line", dimensions: 10, points: 100 }
    )
    const result = await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.exerciseInitializationUnmount()
    )
    await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())
    return {
      ...result,
      passed:
        !result.elementConnected &&
        !result.canvasConnected &&
        result.resourceReferences === 1,
    }
  } finally {
    await scope.close()
  }
}

module.exports = {
  validateLifecycle,
  validateCorrectnessMeasurement,
  validateInitializationUnmount,
}
