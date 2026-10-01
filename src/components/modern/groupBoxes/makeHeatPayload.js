import { makePayload, makeWave } from "@/helpers/makeWavePayload"

const defaultGroups = [
  { id: "prod-edge", count: 24 },
  { id: "prod-db", count: 16, hot: 3 },
  { id: "prod-jobs", count: 16 },
  { id: "staging", count: 10 },
]

export const makeHeatPayload = ({ groups = defaultGroups, context = "modern.nodes.cpu" } = {}) => {
  const dimensions = groups.flatMap(({ id: group, count, hot = 0 }, groupIndex) =>
    Array.from({ length: count }, (_, index) => {
      const noise = Math.sin((index + 1) * (groupIndex + 3) * 12.9898) * 43758.5453
      const center = Math.min(
        97,
        Math.max(4, 30 + (noise - Math.floor(noise)) * 55 + (index < hot ? 40 : 0))
      )
      const id = `${group},${group}-${String(index + 1).padStart(2, "0")}`

      return {
        id,
        values: makeWave({
          center,
          amplitude: 2,
          cycles: 1.5 + (index % 4) * 0.3,
          phase: index * 0.4,
        }).map(value => Math.min(100, Math.max(0, value))),
      }
    })
  )

  const payload = makePayload({
    context,
    title: "Node CPU",
    unit: "percentage",
    dimensions,
  })

  payload.view.dimensions.grouped_by = ["label:group", "node"]
  payload.view.min = 0
  payload.view.max = 100

  return payload
}

export default makeHeatPayload
