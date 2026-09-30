import systemLoadLine from "./systemLoadLine"

// system.load with six nodes that carry volume share, anomaly rate and alert counts, so the filter
// dropdowns have every column populated.
const nodeRows = [
  { nm: "prod-edge-1", con: 31, arp: 4, al: { cr: 1, cl: 2 } },
  { nm: "prod-edge-2", con: 24, arp: 0, al: { cl: 3 } },
  { nm: "prod-db-1", con: 19, arp: 12, al: { wr: 2, cl: 1 } },
  { nm: "prod-cache-1", con: 14, arp: 0, al: {} },
  { nm: "prod-jobs-2", con: 8, arp: 1, al: {} },
  { nm: "staging-1", con: 4, arp: 0, al: {} },
]

const [base] = systemLoadLine

const nodes = nodeRows.map(({ nm, con, arp, al }, ni) => ({
  mg: `mg-${nm}`,
  nd: `nd-${nm}`,
  nm,
  ni,
  st: { ai: 0, code: 200, msg: "" },
  is: { sl: 1, qr: 1 },
  ds: { sl: 3, qr: 3 },
  al,
  sts: { min: 1 + ni, max: 20 + ni * 3, avg: 10 + ni, con, arp },
}))

const instances = nodeRows.map(({ con, arp, al }, ni) => ({
  id: "system.load",
  ni,
  ds: { sl: 3, qr: 3 },
  al,
  sts: { min: 1 + ni, max: 20 + ni * 3, avg: 10 + ni, con, arp },
}))

export const filterDropdownsPayload = {
  ...base,
  summary: { ...base.summary, nodes, instances },
  totals: {
    ...base.totals,
    nodes: { sl: nodes.length, qr: nodes.length },
    instances: { sl: instances.length, qr: instances.length },
  },
}

export default [filterDropdownsPayload]
