const now = Date.now()
const from = now - 15 * 60 * 1000
const first = 1617946830000
const offset = from - first

export default [
  {
    api: 2,
    versions: {
      nodes_hard_hash: 1,
      contexts_hard_hash: 1,
    },
    summary: {
      nodes: [
        {
          mg: "mg-001",
          nd: "node-001",
          nm: "testnode",
          ni: 0,
          st: { ai: 0, code: 200, msg: "" },
          is: { sl: 3, qr: 3 },
          ds: { sl: 3, qr: 3 },
          al: { cl: 0 },
          sts: { min: 0, max: 100, avg: 50, con: 100 },
        },
      ],
      contexts: [
        {
          id: "httpcheck.responsetime",
          is: { sl: 3, ex: 3, qr: 3 },
          ds: { sl: 3, qr: 3 },
          al: { cl: 0 },
          sts: { min: 0, max: 100, avg: 50, con: 100 },
        },
      ],
      instances: [
        {
          id: "httpcheck_website-a",
          ni: 0,
          ds: { sl: 1, qr: 1 },
          al: { cl: 0 },
          sts: { min: 10, max: 30, avg: 20, con: 33 },
        },
        {
          id: "httpcheck_website-b",
          ni: 0,
          ds: { sl: 1, qr: 1 },
          al: { cl: 0 },
          sts: { min: 40, max: 60, avg: 50, con: 33 },
        },
        {
          id: "httpcheck_website-c",
          ni: 0,
          ds: { sl: 1, qr: 1 },
          al: { cl: 0 },
          sts: { min: 70, max: 90, avg: 80, con: 33 },
        },
      ],
      dimensions: [
        {
          id: "responsetime",
          ds: { sl: 3, qr: 3 },
          sts: { min: 10, max: 90, avg: 50, con: 100 },
          pri: 0,
        },
      ],
      labels: [],
    },
    totals: {
      nodes: { sl: 1, qr: 1 },
      instances: { sl: 3, qr: 3 },
      dimensions: { sl: 3, qr: 3 },
    },
    functions: [],
    result: {
      labels: [
        "time",
        "responsetime,httpcheck_website-a,node-001,httpcheck.responsetime",
        "responsetime,httpcheck_website-b,node-001,httpcheck.responsetime",
        "responsetime,httpcheck_website-c,node-001,httpcheck.responsetime",
      ],
      point: { value: 0, arp: 1, pa: 2 },
      data: [
        [first + offset, [20, 0, 0], [50, 0, 0], [80, 0, 0]],
        [first + offset + 1000, [22, 0, 0], [48, 0, 0], [82, 0, 0]],
        [first + offset + 2000, [18, 0, 0], [52, 0, 0], [78, 0, 0]],
        [first + offset + 3000, [25, 0, 0], [45, 0, 0], [85, 0, 0]],
        [first + offset + 4000, [21, 0, 0], [51, 0, 0], [79, 0, 0]],
      ],
    },
    db: {
      update_every: 1,
      first_entry: first + offset,
      last_entry: first + offset + 4000,
      tiers: 1,
      per_tier: [
        {
          tier: 0,
          queries: 1,
          points: 5,
          update_every: 1,
          first_entry: first + offset,
          last_entry: first + offset + 4000,
        },
      ],
    },
    view: {
      title: "HTTP Check Response Time",
      update_every: 1,
      after: first + offset,
      before: first + offset + 4000,
      units: "ms",
      chart_type: "line",
      min: 0,
      max: 100,
      dimensions: {
        grouped_by: ["dimension", "instance", "node", "context"],
        ids: [
          "responsetime,httpcheck_website-a,node-001,httpcheck.responsetime",
          "responsetime,httpcheck_website-b,node-001,httpcheck.responsetime",
          "responsetime,httpcheck_website-c,node-001,httpcheck.responsetime",
        ],
        names: [
          "responsetime,httpcheck_website-a,node-001,httpcheck.responsetime",
          "responsetime,httpcheck_website-b,node-001,httpcheck.responsetime",
          "responsetime,httpcheck_website-c,node-001,httpcheck.responsetime",
        ],
        units: ["ms", "ms", "ms"],
        sts: {
          min: [10, 40, 70],
          max: [30, 60, 90],
          avg: [20, 50, 80],
          con: [33, 33, 33],
          arp: [0, 0, 0],
        },
        priorities: [0, 0, 0],
        contexts: [
          "httpcheck.responsetime",
          "httpcheck.responsetime",
          "httpcheck.responsetime",
        ],
      },
    },
  },
]
