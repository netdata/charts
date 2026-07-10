import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { spawn } from "node:child_process"

const fixtureNames = [
  "streaming-by-instance-percentage",
  "streaming-compare-24h",
  "streaming-compare-7d",
  "streaming-correlate-context-sparklines",
  "streaming-correlate-selected-area-corrected",
  "streaming-correlate-window-corrected",
  "streaming-drilldown-selected-area",
  "streaming-drilldown-window",
]

const runFixturePreparation = ({ moduleUrl, sourceDir, outputDir }) =>
  new Promise((resolve, reject) => {
    const script = `
      import { prepareHighCardinalityFixtures } from ${JSON.stringify(moduleUrl)}
      prepareHighCardinalityFixtures({
        sourceDir: ${JSON.stringify(sourceDir)},
        outputDir: ${JSON.stringify(outputDir)},
      })
    `
    const child = spawn(process.execPath, ["--input-type=module", "--eval", script])
    let stderr = ""

    child.stderr.on("data", chunk => {
      stderr += chunk
    })
    child.on("error", reject)
    child.on("exit", code => {
      if (code === 0) resolve()
      else reject(new Error(stderr || `Fixture preparation exited with code ${code}`))
    })
  })

describe("prepareHighCardinalityFixtures", () => {
  it("supports concurrent Storybook processes", async () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "netdata-charts-fixtures-"))
    const sourceDir = path.join(rootDir, "source")
    const outputDir = path.join(rootDir, "output")
    const moduleUrl = pathToFileURL(
      path.resolve(__dirname, "prepareHighCardinalityFixtures.mjs")
    ).href
    const payload = {
      result: {
        labels: ["time", "value"],
        data: [[1, 1]],
      },
      view: {
        dimensions: {
          ids: ["value"],
          names: ["value"],
          units: ["%"],
        },
      },
    }

    fs.mkdirSync(sourceDir, { recursive: true })
    fs.mkdirSync(outputDir, { recursive: true })
    fs.writeFileSync(path.join(outputDir, "stale.json"), "{}")
    fixtureNames.forEach(name => {
      fs.writeFileSync(path.join(sourceDir, `${name}.json`), JSON.stringify(payload))
    })

    try {
      await Promise.all([
        runFixturePreparation({ moduleUrl, sourceDir, outputDir }),
        runFixturePreparation({ moduleUrl, sourceDir, outputDir }),
      ])

      const outputFiles = fs.readdirSync(outputDir).sort()
      expect(outputFiles).toEqual(fixtureNames.map(name => `${name}.json`).sort())
      outputFiles.forEach(file => {
        expect(() => JSON.parse(fs.readFileSync(path.join(outputDir, file), "utf8"))).not.toThrow()
      })
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
