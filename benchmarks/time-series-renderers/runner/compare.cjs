const { validateLifecycle } = require("./lifecycle.cjs")

const speedup = (baseline, candidate) => baseline / Math.max(candidate, Number.EPSILON)

const compare = (results, { workloads, candidateRenderers }) =>
  workloads.flatMap(workload => {
    const values = workload.dimensions * workload.points
    const dygraph = results.find(result => result.renderer === "dygraph" && result.values === values)

    return candidateRenderers.map(candidateRenderer => {
      const candidate = results.find(
        result => result.renderer === candidateRenderer && result.values === values
      )
      const multiChartPassed = validateLifecycle(candidate)
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


module.exports = compare
