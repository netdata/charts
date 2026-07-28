import Dygraph from "dygraphs"
import { makeReusableLineDataHandler } from "./reusableLineDataHandler"

const dygraphs = []

const makeDygraph = (data, options = {}) => {
  const element = document.createElement("div")
  Object.defineProperties(element, {
    clientWidth: { value: 800 },
    clientHeight: { value: 400 },
  })
  element.style.padding = "0px"
  document.body.appendChild(element)

  const dygraph = new Dygraph(element, data, options)
  dygraphs.push(dygraph)
  return dygraph
}

const snapshot = dygraph => ({
  series: dygraph.rolledSeries_.slice(1).map(series => series.map(item => [...item])),
  points: dygraph.layout_.points.map(points =>
    points.map(({ x, y, xval, yval, name, idx, canvasx, canvasy }) => ({
      x,
      y,
      xval,
      yval,
      name,
      idx,
      canvasx,
      canvasy,
    }))
  ),
  xRange: dygraph.xAxisRange(),
  yRange: dygraph.yAxisRange(),
})

describe("reusable line data handler", () => {
  afterEach(() => {
    dygraphs.forEach(dygraph => dygraph.destroy())
    dygraphs.length = 0
    document.body.innerHTML = ""
  })

  it("reuses extracted pairs and point objects for compatible updates", () => {
    const labels = ["time", "first", "second"]
    const dataHandler = makeReusableLineDataHandler()
    const dygraph = makeDygraph(
      [
        [1000, 1, 2],
        [2000, 3, 4],
      ],
      { labels, dataHandler }
    )
    const firstSeries = dygraph.rolledSeries_[1]
    const firstPair = firstSeries[0]
    const firstPoints = dygraph.layout_.points[0]
    const firstPoint = firstPoints[0]

    dygraph.updateOptions({
      file: [
        [2000, 5, 6],
        [3000, 7, 8],
      ],
      labels,
    })

    expect(dygraph.rolledSeries_[1]).toBe(firstSeries)
    expect(dygraph.rolledSeries_[1][0]).toBe(firstPair)
    expect(dygraph.layout_.points[0]).toBe(firstPoints)
    expect(dygraph.layout_.points[0][0]).toBe(firstPoint)
    expect(dygraph.rolledSeries_[1]).toEqual([
      [2000, 5],
      [3000, 7],
    ])
    expect(
      dygraph.layout_.points[0].map(({ xval, yval, name, idx }) => ({
        xval,
        yval,
        name,
        idx,
      }))
    ).toEqual([
      { xval: 2000, yval: 5, name: "first", idx: 0 },
      { xval: 3000, yval: 7, name: "first", idx: 1 },
    ])
  })

  it("overwrites corrected historical values in reused structures", () => {
    const labels = ["time", "first", "second"]
    const initialData = [
      [1000, 1, 10],
      [2000, 2, 20],
      [3000, 3, 30],
    ]
    const reference = makeDygraph(initialData, { labels })
    const candidate = makeDygraph(initialData, {
      labels,
      dataHandler: makeReusableLineDataHandler(),
    })
    const firstSeries = candidate.rolledSeries_[1]
    const firstPair = firstSeries[0]
    const firstPoints = candidate.layout_.points[0]
    const firstPoint = firstPoints[0]
    const correctedData = [
      [1000, 11, 110],
      [2000, null, 220],
      [3000, 33, 330],
    ]

    reference.updateOptions({ file: correctedData, labels })
    candidate.updateOptions({ file: correctedData, labels })

    expect(candidate.rolledSeries_[1]).toBe(firstSeries)
    expect(candidate.rolledSeries_[1][0]).toBe(firstPair)
    expect(candidate.layout_.points[0]).toBe(firstPoints)
    expect(candidate.layout_.points[0][0]).toBe(firstPoint)
    expect(candidate.rolledSeries_[1]).toEqual([
      [1000, 11],
      [2000, null],
      [3000, 33],
    ])
    expect(snapshot(candidate)).toEqual(snapshot(reference))
  })

  it("rebuilds cached structures when the row shape changes", () => {
    const labels = ["time", "value"]
    const dygraph = makeDygraph(
      [
        [1000, 1],
        [2000, 2],
      ],
      { labels, dataHandler: makeReusableLineDataHandler() }
    )
    const firstSeries = dygraph.rolledSeries_[1]
    const firstPoint = dygraph.layout_.points[0][0]

    dygraph.updateOptions({
      file: [
        [1000, 3],
        [2000, 4],
        [3000, 5],
      ],
      labels,
    })

    expect(dygraph.rolledSeries_[1]).not.toBe(firstSeries)
    expect(dygraph.layout_.points[0][0]).not.toBe(firstPoint)
    expect(dygraph.rolledSeries_[1]).toEqual([
      [1000, 3],
      [2000, 4],
      [3000, 5],
    ])
  })

  it("rebuilds cached structures when labels are reordered", () => {
    const dygraph = makeDygraph(
      [
        [1000, 1, 2],
        [2000, 3, 4],
      ],
      {
        labels: ["time", "first", "second"],
        dataHandler: makeReusableLineDataHandler(),
      }
    )
    const firstSeries = dygraph.rolledSeries_[1]
    const firstPoint = dygraph.layout_.points[0][0]

    dygraph.updateOptions({
      file: [
        [1000, 2, 1],
        [2000, 4, 3],
      ],
      labels: ["time", "second", "first"],
    })

    expect(dygraph.rolledSeries_[1]).not.toBe(firstSeries)
    expect(dygraph.layout_.points[0][0]).not.toBe(firstPoint)
    expect(dygraph.layout_.points[0][0].name).toBe("second")
  })

  it("skips hidden series and rebuilds them when they become visible", () => {
    const labels = ["time", "first", "second"]
    const data = [
      [1000, -1, 2],
      [2000, 3, 4],
      [3000, 5, 8],
      [4000, 7, null],
    ]
    const options = {
      labels,
      dateWindow: [1500, 3500],
      logscale: true,
      rollPeriod: 2,
    }
    const reference = makeDygraph(data, options)
    const candidate = makeDygraph(data, {
      ...options,
      dataHandler: makeReusableLineDataHandler(),
    })
    const secondSeries = candidate.rolledSeries_[2]
    const secondPoint = candidate.layout_.points[1][0]
    const annotations = [{ series: "second", x: 2000, shortText: "A" }]

    reference.setAnnotations(annotations)
    candidate.setAnnotations(annotations)

    reference.updateOptions({ visibility: [true, false] })
    candidate.updateOptions({ visibility: [true, false] })

    expect(candidate.rolledSeries_[2]).toEqual([])
    expect(candidate.layout_.setNames).toEqual(reference.layout_.setNames)
    const hiddenReference = snapshot(reference)
    const hiddenCandidate = snapshot(candidate)
    expect({
      points: hiddenCandidate.points,
      xRange: hiddenCandidate.xRange,
      yRange: hiddenCandidate.yRange,
    }).toEqual({
      points: hiddenReference.points,
      xRange: hiddenReference.xRange,
      yRange: hiddenReference.yRange,
    })

    const nextData = [
      [2000, 9, 16],
      [3000, 11, 32],
      [4000, 13, 64],
      [5000, 15, 128],
    ]
    reference.updateOptions({ file: nextData })
    candidate.updateOptions({ file: nextData })
    reference.updateOptions({ visibility: [true, true] })
    candidate.updateOptions({ visibility: [true, true] })

    expect(candidate.rolledSeries_[2]).not.toBe(secondSeries)
    expect(candidate.layout_.points[1][0]).not.toBe(secondPoint)
    expect(snapshot(candidate)).toEqual(snapshot(reference))
    expect(candidate.layout_.points[1].map(point => point.annotation?.shortText)).toEqual(
      reference.layout_.points[1].map(point => point.annotation?.shortText)
    )
  })

  it("does not retain removed annotations on reused points", () => {
    const labels = ["time", "value"]
    const dygraph = makeDygraph([[1000, 1]], {
      labels,
      dataHandler: makeReusableLineDataHandler(),
    })

    dygraph.setAnnotations([{ series: "value", x: 1000, shortText: "A" }])
    const point = dygraph.layout_.points[0][0]
    expect(point.annotation).toBeTruthy()

    dygraph.setAnnotations([])

    expect(dygraph.layout_.points[0][0]).toBe(point)
    expect(point.annotation).toBeUndefined()
  })

  it("rebuilds points when the visible boundary changes", () => {
    const labels = ["time", "value"]
    const dygraph = makeDygraph(
      [
        [1000, 1],
        [2000, 2],
        [3000, 3],
        [4000, 4],
        [5000, 5],
        [6000, 6],
      ],
      {
        labels,
        dateWindow: [2000, 3000],
        dataHandler: makeReusableLineDataHandler(),
      }
    )
    const series = dygraph.rolledSeries_[1]
    const point = dygraph.layout_.points[0][0]

    dygraph.updateOptions({ dateWindow: [3000, 4000] })

    expect(dygraph.rolledSeries_[1]).toBe(series)
    expect(dygraph.layout_.points[0][0]).not.toBe(point)
    expect(dygraph.layout_.points[0].map(({ xval, idx }) => ({ xval, idx }))).toEqual([
      { xval: 2000, idx: 1 },
      { xval: 3000, idx: 2 },
      { xval: 4000, idx: 3 },
      { xval: 5000, idx: 4 },
    ])
  })

  it("matches the default handler for gaps, log scales, rolling, and zoom", () => {
    const labels = ["time", "first", "second"]
    const initialData = [
      [1000, -1, null],
      [2000, 2, NaN],
      [3000, 0, 4],
      [4000, 8, 16],
    ]
    const options = {
      labels,
      logscale: true,
      rollPeriod: 2,
      dateWindow: [1500, 3500],
    }
    const reference = makeDygraph(initialData, options)
    const candidate = makeDygraph(initialData, {
      ...options,
      dataHandler: makeReusableLineDataHandler(),
    })

    expect(snapshot(candidate)).toEqual(snapshot(reference))

    const nextData = [
      [2000, 1, 2],
      [3000, null, 4],
      [4000, 8, 0],
      [5000, 16, 32],
    ]
    reference.updateOptions({ file: nextData, labels })
    candidate.updateOptions({ file: nextData, labels })

    expect(snapshot(candidate)).toEqual(snapshot(reference))
  })
})
