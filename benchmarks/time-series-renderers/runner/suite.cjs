const { measureCase, validateLine } = require("./measurements.cjs")
const {
  validateFilledVisualization,
  captureAreaOverlap,
  validateAreaParity,
  captureStackedDiverging,
  validateStackedParity,
} = require("./filled.cjs")
const {
  captureMultiBar,
  validateMultiBarParity,
} = require("./bars.cjs")
const {
  captureHeatmap,
  validateHeatmapParity,
} = require("./heatmap.cjs")
const {
  captureEasyPie,
  validateEasyPieParity,
  captureGauge,
  validateGaugeParity,
  captureD3Pie,
  validateD3PieParity,
} = require("./radial.cjs")
const {
  validateFallbackChain,
  validateWebGL2Fallback,
} = require("./fallback.cjs")
const {
  validateCorrectnessMeasurement,
  validateInitializationUnmount,
} = require("./lifecycle.cjs")
const compare = require("./compare.cjs")

const makeCorrectness = () => ({
  line: {},
  area: {},
  areaParity: {},
  heatmap: {},
  heatmapParity: {},
  multiBar: {},
  multiBarParity: {},
  stacked: {},
  stackedParity: {},
  stackedBar: {},
  stackedBarParity: {},
  d3PieParity: {},
  easyPieParity: {},
  gaugeParity: {},
  fallbackChain: null,
  d3PieFallbackChain: null,
  easyPieFallbackChain: null,
  gaugeFallbackChain: null,
  webGL2Fallbacks: {},
  initializationUnmount: {},
})

const measureResults = async ({
  harness,
  port,
  radialOnly,
  correctnessOnly,
  workloads,
  renderers,
  candidateRenderers,
  visualization,
}) => {
  if (radialOnly) return []
  const results = []
  if (correctnessOnly) {
    for (const renderer of candidateRenderers)
      results.push(
        await measureCase(harness, port, {
          dimensions: 10,
          points: 100,
          renderer,
          visualization,
        })
      )
    return results
  }

  for (const workload of workloads)
    for (const renderer of renderers)
      results.push(
        await measureCase(harness, port, {
          ...workload,
          renderer,
          visualization,
        })
      )
  return results
}

const captureReferences = async ({ harness, port, radialOnly }) => {
  const references = {}
  if (!radialOnly) {
    references.area = await captureAreaOverlap(harness, port, "dygraph")
    references.heatmap = await captureHeatmap(harness, port, "dygraph")
    references.multiBar = await captureMultiBar(harness, port, "dygraph")
    references.multiBarReflow = await captureMultiBar(
      harness,
      port,
      "dygraph",
      ["series-0", "series-2"]
    )
    references.stacked = await captureStackedDiverging(
      harness,
      port,
      "dygraph"
    )
    references.stackedBar = await captureStackedDiverging(
      harness,
      port,
      "dygraph",
      "stackedBar"
    )
  }
  references.d3Pie = await captureD3Pie(harness, port, "d3pie")
  references.easyPie = {
    positive: await captureEasyPie(
      harness,
      port,
      "easypiechart",
      "easy-pie"
    ),
    negative: await captureEasyPie(
      harness,
      port,
      "easypiechart",
      "easy-pie-negative"
    ),
  }
  references.gauge = await captureGauge(harness, port, "gauge")
  return references
}

const validateCartesian = async ({
  harness,
  port,
  renderer,
  references,
  correctness,
}) => {
  correctness.line[renderer] = await validateLine(harness, port, renderer)
  for (const visualization of ["area", "heatmap", "multiBar", "stacked", "stackedBar"])
    correctness[visualization][renderer] = await validateFilledVisualization(
      harness,
      port,
      renderer,
      visualization
    )
  correctness.areaParity[renderer] = await validateAreaParity(
    harness,
    port,
    renderer,
    references.area
  )
  correctness.heatmapParity[renderer] = await validateHeatmapParity(
    harness,
    port,
    renderer,
    references.heatmap
  )
  correctness.multiBarParity[renderer] = await validateMultiBarParity(
    harness,
    port,
    renderer,
    references.multiBar,
    references.multiBarReflow
  )
  correctness.stackedParity[renderer] = await validateStackedParity(
    harness,
    port,
    renderer,
    "stacked",
    references.stacked
  )
  correctness.stackedBarParity[renderer] = await validateStackedParity(
    harness,
    port,
    renderer,
    "stackedBar",
    references.stackedBar
  )
}

const validateRenderer = async ({
  harness,
  port,
  renderer,
  radialOnly,
  references,
  correctness,
}) => {
  await harness.resetPage()
  if (!radialOnly)
    await validateCartesian({
      harness,
      port,
      renderer,
      references,
      correctness,
    })
  correctness.d3PieParity[renderer] = await validateD3PieParity(
    harness,
    port,
    renderer,
    references.d3Pie
  )
  correctness.easyPieParity[renderer] = await validateEasyPieParity(
    harness,
    port,
    renderer,
    references.easyPie
  )
  correctness.gaugeParity[renderer] = await validateGaugeParity(
    harness,
    port,
    renderer,
    references.gauge
  )
  correctness.initializationUnmount[renderer] =
    await validateInitializationUnmount(harness, port, renderer)
}

const validateFallbacks = async ({
  harness,
  port,
  radialOnly,
  candidateRenderers,
  visualization,
  correctness,
}) => {
  if (candidateRenderers.includes("webgl2")) {
    await harness.resetPage()
    for (const visualizationId of ["line", "d3pie", "easypiechart", "gauge"])
      correctness.webGL2Fallbacks[visualizationId] =
        await validateWebGL2Fallback(harness, port, visualizationId)
  }
  if (!candidateRenderers.includes("webgpu")) return

  await harness.resetPage()
  if (!radialOnly)
    correctness.fallbackChain = await validateFallbackChain(
      harness,
      port,
      visualization
    )
  correctness.d3PieFallbackChain = await validateFallbackChain(
    harness,
    port,
    "d3pie"
  )
  correctness.easyPieFallbackChain = await validateFallbackChain(
    harness,
    port,
    "easypiechart"
  )
  correctness.gaugeFallbackChain = await validateFallbackChain(
    harness,
    port,
    "gauge"
  )
}

const didPass = ({ correctness, correctnessOnly, results, comparisons }) => {
  const accept = result =>
    result.passed || (correctnessOnly && result.portablePassed)
  const resultGroups = Object.entries(correctness)
    .filter(([name]) => !name.toLowerCase().includes("fallback"))
    .map(([, resultsByRenderer]) => resultsByRenderer)

  return (
    resultGroups.every(group => Object.values(group).every(accept)) &&
    [
      correctness.fallbackChain,
      correctness.d3PieFallbackChain,
      correctness.easyPieFallbackChain,
      correctness.gaugeFallbackChain,
    ].every(result => !result || result.passed) &&
    Object.values(correctness.webGL2Fallbacks).every(result => result.passed) &&
    (!correctnessOnly || results.every(validateCorrectnessMeasurement)) &&
    comparisons.every(
      result =>
        result.mountPassed &&
        result.updatePassed &&
        result.exportPassed &&
        result.multiChartPassed
    )
  )
}

module.exports = async ({ harness, port, config }) => {
  const correctness = makeCorrectness()
  const results = await measureResults({ harness, port, ...config })
  const references = await captureReferences({
    harness,
    port,
    radialOnly: config.radialOnly,
  })
  for (const renderer of config.candidateRenderers)
    await validateRenderer({
      harness,
      port,
      renderer,
      radialOnly: config.radialOnly,
      references,
      correctness,
    })
  await validateFallbacks({ harness, port, correctness, ...config })

  const comparisons =
    config.radialOnly || config.correctnessOnly
      ? []
      : compare(results, config)
  return {
    results,
    correctness,
    comparisons,
    passed: didPass({
      correctness,
      correctnessOnly: config.correctnessOnly,
      results,
      comparisons,
    }),
  }
}
