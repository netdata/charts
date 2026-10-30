import { makePayload, makeWave } from "./makeWavePayload"

export const machineGuid = "9de8b1d4-86ee-11ef-bdfe-bc24117ecd4d"
export const nodeId = "9d445810-58a2-4d8c-9749-d80785f49d93"

const defaultInterfaces = [
  { name: "Gi0/1", type: "ethernetCsmacd", alias: "uplink, core" },
  { name: "Gi0/2", type: "ethernetCsmacd", alias: "" },
]

const contexts = [
  { id: "snmp.device_prof_ifTraffic", dimensions: ["in", "out"] },
  { id: "snmp.device_prof_ifErrors", dimensions: ["in", "out"] },
]

export const makeInterfacePayload = ({ interfaces = defaultInterfaces, labels = true } = {}) => {
  const rows = contexts.flatMap(context =>
    interfaces.flatMap((iface, ifaceIndex) =>
      context.dimensions.map((dimension, dimensionIndex) => ({
        iface,
        id: `${dimension},${iface.name},${iface.type},${machineGuid},${context.id}`,
        values: makeWave({ center: 10 + ifaceIndex * 20 + dimensionIndex * 5, amplitude: 2 }),
      }))
    )
  )

  const payload = makePayload({
    context: contexts[0].id,
    title: "Interfaces",
    unit: "kilobits/s",
    dimensions: rows.map(({ id, values }) => ({ id, values })),
  })

  payload.summary.nodes = [{ mg: machineGuid, nd: nodeId, nm: "switch-01", ni: 0 }]
  payload.summary.contexts = contexts.map(({ id }) => ({
    id,
    sts: payload.summary.contexts[0].sts,
  }))
  payload.view.dimensions.grouped_by = [
    "dimension",
    "label:interface",
    "label:if_type",
    "node",
    "context",
  ]

  if (labels)
    payload.view.dimensions.labels = {
      interface: rows.map(({ iface }) => [iface.name]),
      if_type: rows.map(({ iface }) => [iface.type]),
      if_alias: rows.map(({ iface }) => (iface.alias ? [iface.alias] : null)),
    }

  return payload
}

export default makeInterfacePayload
