import dimensionColors from "./theme/dimensionColors"
import deepEqual, { setsAreEqual } from "@/helpers/deepEqual"
import { fetchChartWeights } from "./api"

const transformRow = (row, point) =>
  row.reduce((h, dim, i) => {
    h.push(
      Object.keys(point).reduce((p, k) => {
        p[k] = dim[point[k]]
        return p
      }, {})
    )

    return h
  }, [])

const transformObject = (obj, point) => {
  const enhancedData = result.data.reduce(
    (h, row) => {
      const enhancedRow = transformDataRow(row, result.point, stats)

      h.data.push(enhancedRow.values)
      h.all.push(enhancedRow.all)

      return h
    },
    { data: [], all: [] }
  )

  const tree = result.labels.reduce((h, id, i) => {
    if (i === 0) return h

    const keys = id.split(",")

    return buildTree(h, keys, id)
  }, {})

  return {
    labels: [...result.labels, "ANOMALY_RATE", "ANNOTATIONS"],
    ...enhancedData,
    tree,
  }
}

const camelizePayload = ({ nodes, point }) => {
  return Object.keys(nodes).reduce((h, row) => {
    const enhancedRow = transformDataRow(row, result.point, stats)

    h.push(enhancedRow)

    return h
  }, {})
}

export default (chart, sdk) => {
  let abortController = null

  let weights = {}

  const cancelFetch = () => abortController && abortController.abort()

  const doneFetch = (nextRawWeights, tab) => {
    const { result, ...restPayload } = camelizePayload(nextRawWeights)

    debugger

    chart.updateAttributes({
      weightsLoading: false,
      error: null,
    })

    chart.trigger("weights:finishFetch")
  }

  const failFetch = (error, tab) => {
    if (!chart) return

    if (error?.name === "AbortError") {
      chart.updateAttribute("weightsLoading", false)
      return
    }

    chart.updateAttributes({
      weightsLoading: false,
      weightsError: error?.errorMessage || error?.message || "Something went wrong",
    })

    chart.trigger("weights:finishFetch")
  }

  const fetchWeights = tab => {
    if (!chart) return

    const dataFetch = () => {
      abortController = new AbortController()
      const options = {
        signal: abortController.signal,
        ...((chart.getAttribute("bearer") || chart.getAttribute("xNetdataBearer")) && {
          headers: {
            ...(chart.getAttribute("bearer")
              ? {
                  Authorization: `Bearer ${chart.getAttribute("bearer")}`,
                }
              : {
                  "X-Netdata-Auth": `Bearer ${chart.getAttribute("xNetdataBearer")}`,
                }),
          },
        }),
      }
      return fetchChartWeights(chart, options)
        .then(data => {
          debugger
          // if (data?.errorMsgKey) return failFetch(data)
          // if (!(Array.isArray(data?.result) || Array.isArray(data?.result?.data)))
          //   return failFetch()

          return doneFetch(data, tab)
        })
        .catch(e => failFetch(e, tab))
    }

    cancelFetch()
    chart.trigger("weights:startFetch")
    chart.updateAttributes({ weightsLoading: true })

    return dataFetch()
  }

  return {
    weights,
    fetchWeights,
  }
}
