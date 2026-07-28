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
const renderers = ["dygraph", "webgpu"]

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

const compare = results =>
  workloads.map(workload => {
    const values = workload.dimensions * workload.points
    const dygraph = results.find(result => result.renderer === "dygraph" && result.values === values)
    const webgpu = results.find(result => result.renderer === "webgpu" && result.values === values)
    const speedups = {
      mountSync: speedup(dygraph.mountSyncMs.median, webgpu.mountSyncMs.median),
      mountFrame: speedup(dygraph.mountFrameMs.median, webgpu.mountFrameMs.median),
      updateSync: speedup(dygraph.updateSyncMs.median, webgpu.updateSyncMs.median),
      updateFrame: speedup(dygraph.updateFrameMs.median, webgpu.updateFrameMs.median),
    }

    if (workload.gate === "single-frame") {
      const frameBudgetMs = webgpu.displayFrameIntervalMs * 1.25
      const mountPassed =
        speedups.mountSync >= workload.requiredMainThreadSpeedup &&
        webgpu.mountWorkCompletionMs.median <= frameBudgetMs &&
        webgpu.mountFrameMs.median <= frameBudgetMs
      const updatePassed =
        speedups.updateSync >= workload.requiredMainThreadSpeedup &&
        webgpu.updateWorkCompletionMs.median <= frameBudgetMs &&
        webgpu.updateFrameMs.median <= frameBudgetMs

      return {
        values,
        gate: workload.gate,
        measuredDisplayFrameMs: webgpu.displayFrameIntervalMs,
        allowedFrameBudgetMs: frameBudgetMs,
        requiredMainThreadSpeedup: workload.requiredMainThreadSpeedup,
        speedups,
        webgpuWorkCompletionMs: {
          mount: webgpu.mountWorkCompletionMs.median,
          update: webgpu.updateWorkCompletionMs.median,
        },
        webgpuFrameMs: {
          mount: webgpu.mountFrameMs.median,
          update: webgpu.updateFrameMs.median,
        },
        mountPassed,
        updatePassed,
      }
    }

    return {
      values,
      gate: workload.gate,
      requiredFrameSpeedup: workload.requiredFrameSpeedup,
      speedups,
      mountPassed: speedups.mountFrame >= workload.requiredFrameSpeedup,
      updatePassed: speedups.updateFrame >= workload.requiredFrameSpeedup,
    }
  })

const run = async () => {
  const port = await listen()
  const browserArgs = [
    "--enable-precise-memory-info",
    "--js-flags=--expose-gc",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
  ]
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
  const results = []

  try {
    for (const workload of workloads) {
      for (const renderer of renderers) {
        results.push(await measureCase(browser, port, { ...workload, renderer }))
      }
    }
  } finally {
    await browser.close()
    await close()
  }

  const comparisons = compare(results)
  const passed = comparisons.every(result => result.mountPassed && result.updatePassed)
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
      renderers: "Dygraphs and the native WebGPU prototype from the same @netdata/charts checkout",
      data: "deterministic row-major values; two pre-generated revisions alternated",
      canvas: "1600x500 CSS pixels at devicePixelRatio 1",
      samples: "3 mounts, 2 warm-up updates, 10 measured updates, 3 seconds sustained updates",
      primaryLatency:
        "100k uses measured one-frame presentation/work completion plus synchronous speedup; 1M uses median frame-settled speedup",
      memory: "Chromium usedJSHeapSize delta after forced GC; peak sampled after settled draws",
    },
    results,
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
