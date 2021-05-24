// const payload = makePayload({
//     series: 10,
//     points: 200,
//     after: Date.now() - 15 * 60 * 1000,
//     period: 15 * 60 * 1000,
//     min: 0,
//     max: 100,
//   })

const getInitialPayload = () => ({
  api: 1,
  id: "",
  name: "",
  view_update_every: 1,
  update_every: 1,
  first_entry: 0,
  last_entry: 0,
  before: 0,
  after: 0,
  dimension_names: [],
  dimension_ids: [],
  latest_values: [],
  view_latest_values: [],
  dimensions: 0,
  points: 0,
  format: "json",
  result: {
    labels: [],
    data: [],
  },
})

const makePayload = ({ series, points, after, period, min, max, labelsSize = 8 }) => {
  const payload = getInitialPayload()

  payload.id = "id"
  payload.name = "id"
  payload.before = after + period
  payload.after = after
  payload.points = points

  payload.result.labels.push("time")

  const list = Array.from(Array(series))
  list.forEach((v, index) => {
    const dimension = `label ${index}`
    const dimensionId = `${dimension}_${index}`
    payload.dimension_names.push(dimension)
    payload.dimension_ids.push(dimensionId)
    payload.result.labels.push(dimensionId)
  })

  const interval = period / points

  const valueInterval = (max - min) / 10
  const directions = list.map((v, index) => index % 2 === 0)

  let data = list.map((v, dimensionIndex) => min + dimensionIndex * valueInterval)

  Array.from(Array(points)).forEach((v, pointsIndex) => {
    data = data.map((v, dataIndex) => {
      if (v >= max) {
        directions[dataIndex] = false
      }
      if (v <= min) {
        directions[dataIndex] = true
      }
      if (directions[dataIndex]) {
        return Math.min(v + valueInterval, max)
      }

      return Math.max(v - valueInterval, min)
    })
    payload.result.data.push([after + pointsIndex * interval, ...data])
  })

  const lastEntry = payload.result.data[payload.result.data.length - 1]
  payload.first_entry = payload.result.data[0][0]
  payload.last_entry = lastEntry[0]
  payload.latest_values = [...lastEntry].splice(1)
  payload.view_latest_values = [...lastEntry].splice(1)
  payload.min = min
  payload.max = max

  return payload
}

export default makePayload
