const captureEasyPie = async (harness, port, renderer, profile) => {
  const scope = await harness.openScope({
    viewport: { width: 700, height: 700 },
    deviceScaleFactor: 1,
  })
  const { page } = scope
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
    await scope.close()
  }
}

const validateEasyPieParity = async (harness, port, renderer, references) => {
  const positive = await captureEasyPie(harness, port, renderer, "easy-pie")
  const negative = await captureEasyPie(harness, port, renderer, "easy-pie-negative")
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

const captureGauge = async (harness, port, renderer) => {
  const scope = await harness.openScope({
    viewport: { width: 700, height: 700 },
    deviceScaleFactor: 1,
  })
  const { page } = scope
  try {
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "load" })
    await page.waitForFunction(() => Boolean(window.__NETDATA_RENDERER_BENCHMARK__))
    await page.evaluate(input => window.__NETDATA_RENDERER_BENCHMARK__.prepare(input), {
      renderer,
      visualization: "gauge",
      dimensions: 2,
      points: 10,
      profile: "easy-pie",
      range: [0, 100],
    })
    await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.mountPreview({ width: 500, height: 500 })
    )
    const capture = await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.capturePreview({
        samples: [
          { name: "progress", xRatio: 0.112, yRatio: 0.39 },
          { name: "track", xRatio: 0.884, yRatio: 0.39 },
          { name: "pointerBody", xRatio: 0.5, yRatio: 0.1 },
          { name: "pointerCenter", xRatio: 0.5, yRatio: 0.586 },
          { name: "empty", xRatio: 0.5, yRatio: 0.95 },
        ],
      })
    )
    await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())
    return capture
  } finally {
    await scope.close()
  }
}

const validateGaugeParity = async (harness, port, renderer, reference) => {
  const capture = await captureGauge(harness, port, renderer)
  const deltas = Object.fromEntries(
    Object.keys(reference.samplePixels).map(name => [
      name,
      Math.max(
        ...reference.samplePixels[name].map((value, index) =>
          Math.abs(value - capture.samplePixels[name][index])
        )
      ),
    ])
  )
  const pixelCountDelta = Math.abs(
    capture.nonTransparentPixels - reference.nonTransparentPixels
  )
  const passed = Boolean(
    capture.samplePixels.progress[3] > 0 &&
      capture.samplePixels.track[3] > 0 &&
      capture.samplePixels.pointerBody[3] > 0 &&
      capture.samplePixels.pointerCenter[3] > 0 &&
      capture.samplePixels.empty[3] === 0 &&
      Object.values(deltas).every(delta => delta <= 4) &&
      pixelCountDelta <= 1500
  )
  return {
    renderer,
    samples: capture.samplePixels,
    referenceSamples: reference.samplePixels,
    deltas,
    pixelCountDelta,
    drawStats: capture.drawStats,
    passed,
  }
}

const captureD3Pie = async (harness, port, renderer) => {
  const scope = await harness.openScope({
    viewport: { width: 700, height: 700 },
    deviceScaleFactor: 1,
  })
  const { page } = scope
  try {
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "load" })
    await page.waitForFunction(() => Boolean(window.__NETDATA_RENDERER_BENCHMARK__))
    await page.mouse.move(690, 690)
    await page.evaluate(input => window.__NETDATA_RENDERER_BENCHMARK__.prepare(input), {
      renderer,
      visualization: "d3pie",
      dimensions: 7,
      points: 10,
      profile: "d3-pie",
      range: [0, 7],
    })
    await page.evaluate(() =>
      window.__NETDATA_RENDERER_BENCHMARK__.mountPreview({ width: 500, height: 500 })
    )
    const sampleOptions = {
      samples: [
        { name: "series0", xRatio: 0.69, yRatio: 0.31 },
        { name: "series2", xRatio: 0.706, yRatio: 0.674 },
        { name: "series4", xRatio: 0.408, yRatio: 0.754 },
        { name: "series5", xRatio: 0.246, yRatio: 0.592 },
        { name: "series6", xRatio: 0.256, yRatio: 0.308 },
        { name: "grouped", xRatio: 0.408, yRatio: 0.246 },
        { name: "center", xRatio: 0.5, yRatio: 0.5 },
        { name: "outside", xRatio: 0.5, yRatio: 0.05 },
      ],
    }
    const initial = await page.evaluate(
      options => window.__NETDATA_RENDERER_BENCHMARK__.capturePreview(options),
      sampleOptions
    )
    const firstSegment = page.locator(
      "[data-benchmark-chart] svg path[data-index='0']"
    )
    await firstSegment.hover({ force: true })
    await page.waitForTimeout(50)
    const hovered = await page.evaluate(
      options => window.__NETDATA_RENDERER_BENCHMARK__.capturePreview(options),
      sampleOptions
    )
    await firstSegment.click({ force: true })
    await page.waitForTimeout(600)
    const expanded = await page.evaluate(
      options => window.__NETDATA_RENDERER_BENCHMARK__.capturePreview(options),
      sampleOptions
    )
    await page.evaluate(() => window.__NETDATA_RENDERER_BENCHMARK__.cleanup())
    return { initial, hovered, expanded }
  } finally {
    await scope.close()
  }
}

const validateD3PieParity = async (harness, port, renderer, reference) => {
  const capture = await captureD3Pie(harness, port, renderer)
  const deltas = Object.fromEntries(
    Object.keys(reference.initial.samplePixels).map(name => [
      name,
      Math.max(
        ...reference.initial.samplePixels[name].map((value, index) =>
          Math.abs(value - capture.initial.samplePixels[name][index])
        )
      ),
    ])
  )
  const hoverDelta = Math.max(
    ...reference.hovered.samplePixels.series0.map((value, index) =>
      Math.abs(value - capture.hovered.samplePixels.series0[index])
    )
  )
  const pixelCountDelta = Math.abs(
    capture.initial.nonTransparentPixels - reference.initial.nonTransparentPixels
  )
  const labelsMatch =
    JSON.stringify(capture.initial.semanticLabels) ===
    JSON.stringify(reference.initial.semanticLabels)
  const expanded = capture.expanded.segmentTransforms.some(Boolean)
  const gpuOffset =
    renderer === "d3pie" ||
    capture.expanded.drawStats?.expandedOffsetPixels > 0
  const passed = Boolean(
    capture.initial.samplePixels.center[3] === 0 &&
      capture.initial.samplePixels.outside[3] === 0 &&
      Object.values(deltas).every(delta => delta <= 4) &&
      hoverDelta <= 4 &&
      pixelCountDelta <= 1500 &&
      labelsMatch &&
      capture.initial.connectorCount === reference.initial.connectorCount &&
      expanded &&
      gpuOffset
  )
  return {
    renderer,
    samples: capture.initial.samplePixels,
    referenceSamples: reference.initial.samplePixels,
    deltas,
    hoverDelta,
    hoverFill: capture.hovered.segmentFills[0],
    referenceHoverFill: reference.hovered.segmentFills[0],
    pixelCountDelta,
    labelsMatch,
    connectorCount: capture.initial.connectorCount,
    expanded,
    expandedTransforms: capture.expanded.segmentTransforms,
    expandedClasses: capture.expanded.segmentClasses,
    drawStats: capture.expanded.drawStats,
    passed,
  }
}


module.exports = {
  captureEasyPie,
  validateEasyPieParity,
  captureGauge,
  validateGaugeParity,
  captureD3Pie,
  validateD3PieParity,
}
