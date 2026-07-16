import Dygraph from "dygraphs"

const haveSameLabels = (left, right) =>
  left?.length === right?.length && left.every((label, index) => label === right[index])

const haveUniqueLabels = labels => new Set(labels).size === labels.length

const updateSeries = (series, rawData, seriesIndex, logScale) => {
  for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
    const row = rawData[rowIndex]
    let value = row[seriesIndex]

    if (logScale && value <= 0) value = null

    const item = series[rowIndex]
    item[0] = row[0]
    item[1] = value
  }
}

const makeSeries = (rawData, seriesIndex, logScale) => {
  const series = new Array(rawData.length)

  for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
    const row = rawData[rowIndex]
    let value = row[seriesIndex]

    if (logScale && value <= 0) value = null
    series[rowIndex] = [row[0], value]
  }

  return series
}

const updatePoints = (points, series) => {
  for (let pointIndex = 0; pointIndex < series.length; pointIndex++) {
    const item = series[pointIndex]
    const point = points[pointIndex]

    point.xval = item[0]
    point.yval = item[1] === null ? null : item[1]
    if ("annotation" in point) delete point.annotation
  }
}

const makePoints = (series, setName, boundaryIdStart) => {
  const points = new Array(series.length)

  for (let pointIndex = 0; pointIndex < series.length; pointIndex++) {
    const item = series[pointIndex]

    points[pointIndex] = {
      x: NaN,
      y: NaN,
      xval: item[0],
      yval: item[1] === null ? null : item[1],
      name: setName,
      idx: pointIndex + boundaryIdStart,
      canvasx: NaN,
      canvasy: NaN,
    }
  }

  return points
}

export const makeReusableLineDataHandler = () => {
  const DefaultHandler = Dygraph.DataHandlers?.DefaultHandler
  if (!DefaultHandler) return null

  let labels
  let rowCount
  let reusable = false
  let seriesByIndex = []
  let pointsByName = new Map()

  const reset = (nextLabels, nextRowCount) => {
    labels = nextLabels.slice()
    rowCount = nextRowCount
    reusable = haveUniqueLabels(nextLabels)
    seriesByIndex = []
    pointsByName = new Map()
  }

  return class ReusableLineDataHandler extends DefaultHandler {
    extractSeries(rawData, seriesIndex, options) {
      const nextLabels = options.get("labels")

      if (
        seriesIndex === 1 &&
        (!haveSameLabels(labels, nextLabels) || rowCount !== rawData.length)
      ) {
        reset(nextLabels, rawData.length)
      }

      if (!reusable) return super.extractSeries(rawData, seriesIndex, options)

      const seriesLabel = nextLabels[seriesIndex]
      const logScale = options.getForSeries("logscale", seriesLabel)
      let series = seriesByIndex[seriesIndex]

      if (!series) {
        series = makeSeries(rawData, seriesIndex, logScale)
        seriesByIndex[seriesIndex] = series
      } else {
        updateSeries(series, rawData, seriesIndex, logScale)
      }

      return series
    }

    seriesToPoints(series, setName, boundaryIdStart) {
      if (!reusable) return super.seriesToPoints(series, setName, boundaryIdStart)

      const cached = pointsByName.get(setName)
      let points

      if (
        cached &&
        cached.boundaryIdStart === boundaryIdStart &&
        cached.points.length === series.length
      ) {
        points = cached.points
        updatePoints(points, series)
      } else {
        points = makePoints(series, setName, boundaryIdStart)
        pointsByName.set(setName, { boundaryIdStart, points })
      }

      this.onPointsCreated_(series, points)
      return points
    }
  }
}
